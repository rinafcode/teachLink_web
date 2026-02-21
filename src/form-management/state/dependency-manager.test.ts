/**
 * Unit tests for Dependency Manager
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DependencyManager } from './dependency-manager';
import { FieldDescriptor, ConditionalRule, FormState } from '../types/core';

describe('DependencyManager', () => {
  let dependencyManager: DependencyManager;

  beforeEach(() => {
    dependencyManager = new DependencyManager();
  });

  describe('initialization', () => {
    it('should initialize with field descriptors', () => {
      const fields: FieldDescriptor[] = [
        {
          id: 'field1',
          type: 'text',
          label: 'Field 1',
          required: false,
          validation: []
        },
        {
          id: 'field2',
          type: 'text',
          label: 'Field 2',
          required: false,
          validation: [],
          dependencies: ['field1']
        }
      ];

      dependencyManager.initialize(fields);

      expect(dependencyManager.hasDependencies('field2')).toBe(true);
      expect(dependencyManager.hasDependents('field1')).toBe(true);
      expect(dependencyManager.getDependentFields('field1')).toContain('field2');
    });

    it('should initialize with conditional rules', () => {
      const fields: FieldDescriptor[] = [
        {
          id: 'field1',
          type: 'text',
          label: 'Field 1',
          required: false,
          validation: []
        },
        {
          id: 'field2',
          type: 'text',
          label: 'Field 2',
          required: false,
          validation: []
        }
      ];

      const conditionalRules: ConditionalRule[] = [
        {
          id: 'rule1',
          condition: (state) => state.values.field1 === 'show',
          actions: [
            { type: 'show', targetFieldId: 'field2' }
          ]
        }
      ];

      dependencyManager.initialize(fields, conditionalRules);

      const fieldDeps = dependencyManager.getFieldDependencies('field2');
      expect(fieldDeps?.conditionalRules).toHaveLength(1);
    });
  });

  describe('dependency validation', () => {
    it('should detect missing dependencies', () => {
      const fields: FieldDescriptor[] = [
        {
          id: 'field1',
          type: 'text',
          label: 'Field 1',
          required: false,
          validation: [],
          dependencies: ['nonexistent']
        }
      ];

      dependencyManager.initialize(fields);
      const validation = dependencyManager.validateDependencies(fields);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0].error).toContain('non-existent field');
    });

    it('should detect circular dependencies', () => {
      const fields: FieldDescriptor[] = [
        {
          id: 'field1',
          type: 'text',
          label: 'Field 1',
          required: false,
          validation: [],
          dependencies: ['field2']
        },
        {
          id: 'field2',
          type: 'text',
          label: 'Field 2',
          required: false,
          validation: [],
          dependencies: ['field1']
        }
      ];

      dependencyManager.initialize(fields);
      const validation = dependencyManager.validateDependencies(fields);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.error.includes('Circular dependency'))).toBe(true);
    });

    it('should validate correct dependencies', () => {
      const fields: FieldDescriptor[] = [
        {
          id: 'field1',
          type: 'text',
          label: 'Field 1',
          required: false,
          validation: []
        },
        {
          id: 'field2',
          type: 'text',
          label: 'Field 2',
          required: false,
          validation: [],
          dependencies: ['field1']
        }
      ];

      dependencyManager.initialize(fields);
      const validation = dependencyManager.validateDependencies(fields);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('cascading updates', () => {
    beforeEach(() => {
      const fields: FieldDescriptor[] = [
        {
          id: 'trigger',
          type: 'select',
          label: 'Trigger Field',
          required: false,
          validation: []
        },
        {
          id: 'dependent',
          type: 'text',
          label: 'Dependent Field',
          required: false,
          validation: [],
          dependencies: ['trigger']
        }
      ];

      const conditionalRules: ConditionalRule[] = [
        {
          id: 'showRule',
          condition: (state) => state.values.trigger === 'show',
          actions: [
            { type: 'show', targetFieldId: 'dependent' }
          ]
        },
        {
          id: 'hideRule',
          condition: (state) => state.values.trigger === 'hide',
          actions: [
            { type: 'hide', targetFieldId: 'dependent' }
          ]
        },
        {
          id: 'setValueRule',
          condition: (state) => state.values.trigger === 'auto',
          actions: [
            { type: 'setValue', targetFieldId: 'dependent', value: 'auto-value' }
          ]
        }
      ];

      dependencyManager.initialize(fields, conditionalRules);
    });

    it('should calculate visibility changes', () => {
      const state: FormState = {
        values: {},
        validation: {},
        touched: {},
        dirty: {},
        isSubmitting: false,
        submitCount: 0,
        metadata: {
          formId: 'test',
          sessionId: 'session',
          createdAt: new Date(),
          lastModified: new Date(),
          version: '1.0.0'
        }
      };

      const result = dependencyManager.calculateCascadingUpdates('trigger', 'show', state);

      expect(result.visibilityChanges.dependent).toBe(true);
    });

    it('should calculate value changes', () => {
      const state: FormState = {
        values: {},
        validation: {},
        touched: {},
        dirty: {},
        isSubmitting: false,
        submitCount: 0,
        metadata: {
          formId: 'test',
          sessionId: 'session',
          createdAt: new Date(),
          lastModified: new Date(),
          version: '1.0.0'
        }
      };

      const result = dependencyManager.calculateCascadingUpdates('trigger', 'auto', state);

      expect(result.valueChanges.dependent).toBe('auto-value');
    });

    it('should identify fields to revalidate', () => {
      const state: FormState = {
        values: { trigger: 'some-value' },
        validation: {},
        touched: {},
        dirty: {},
        isSubmitting: false,
        submitCount: 0,
        metadata: {
          formId: 'test',
          sessionId: 'session',
          createdAt: new Date(),
          lastModified: new Date(),
          version: '1.0.0'
        }
      };

      const result = dependencyManager.calculateCascadingUpdates('trigger', 'new-value', state);

      expect(result.fieldsToRevalidate).toContain('dependent');
    });
  });

  describe('topological sorting', () => {
    it('should return fields in dependency order', () => {
      const fields: FieldDescriptor[] = [
        {
          id: 'field3',
          type: 'text',
          label: 'Field 3',
          required: false,
          validation: [],
          dependencies: ['field1', 'field2']
        },
        {
          id: 'field1',
          type: 'text',
          label: 'Field 1',
          required: false,
          validation: []
        },
        {
          id: 'field2',
          type: 'text',
          label: 'Field 2',
          required: false,
          validation: [],
          dependencies: ['field1']
        }
      ];

      dependencyManager.initialize(fields);
      const sorted = dependencyManager.getTopologicalSort();

      const field1Index = sorted.indexOf('field1');
      const field2Index = sorted.indexOf('field2');
      const field3Index = sorted.indexOf('field3');

      expect(field1Index).toBeLessThan(field2Index);
      expect(field2Index).toBeLessThan(field3Index);
    });
  });

  describe('dependency queries', () => {
    beforeEach(() => {
      const fields: FieldDescriptor[] = [
        {
          id: 'independent',
          type: 'text',
          label: 'Independent Field',
          required: false,
          validation: []
        },
        {
          id: 'dependent',
          type: 'text',
          label: 'Dependent Field',
          required: false,
          validation: [],
          dependencies: ['independent']
        }
      ];

      dependencyManager.initialize(fields);
    });

    it('should check if field has dependencies', () => {
      expect(dependencyManager.hasDependencies('dependent')).toBe(true);
      expect(dependencyManager.hasDependencies('independent')).toBe(false);
    });

    it('should check if field has dependents', () => {
      expect(dependencyManager.hasDependents('independent')).toBe(true);
      expect(dependencyManager.hasDependents('dependent')).toBe(false);
    });

    it('should get field dependencies', () => {
      const deps = dependencyManager.getFieldDependencies('dependent');
      expect(deps?.dependsOn).toContain('independent');
    });

    it('should get dependent fields', () => {
      const dependents = dependencyManager.getDependentFields('independent');
      expect(dependents).toContain('dependent');
    });
  });

  describe('error handling', () => {
    it('should handle invalid conditional rule gracefully', () => {
      const fields: FieldDescriptor[] = [
        {
          id: 'field1',
          type: 'text',
          label: 'Field 1',
          required: false,
          validation: []
        }
      ];

      const conditionalRules: ConditionalRule[] = [
        {
          id: 'errorRule',
          condition: () => { throw new Error('Test error'); },
          actions: [
            { type: 'show', targetFieldId: 'field1' }
          ]
        }
      ];

      dependencyManager.initialize(fields, conditionalRules);

      const state: FormState = {
        values: {},
        validation: {},
        touched: {},
        dirty: {},
        isSubmitting: false,
        submitCount: 0,
        metadata: {
          formId: 'test',
          sessionId: 'session',
          createdAt: new Date(),
          lastModified: new Date(),
          version: '1.0.0'
        }
      };

      // Should not throw error
      expect(() => {
        dependencyManager.calculateCascadingUpdates('field1', 'value', state);
      }).not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should clear all dependency information', () => {
      const fields: FieldDescriptor[] = [
        {
          id: 'field1',
          type: 'text',
          label: 'Field 1',
          required: false,
          validation: []
        }
      ];

      dependencyManager.initialize(fields);
      expect(dependencyManager.hasDependencies('field1')).toBe(false);

      dependencyManager.clear();
      expect(dependencyManager.getFieldDependencies('field1')).toBeNull();
    });
  });
});