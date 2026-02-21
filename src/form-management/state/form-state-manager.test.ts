/**
 * Unit tests for Form State Manager
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FormStateManager } from './form-state-manager';
import { ValidationResult, StateChangeEvent } from '../types/core';

describe('FormStateManager', () => {
  let stateManager: FormStateManager;
  const formId = 'test-form';
  const userId = 'test-user';

  beforeEach(() => {
    stateManager = new FormStateManager(formId, userId);
  });

  describe('initialization', () => {
    it('should create initial state with correct metadata', () => {
      const state = stateManager.getState();
      
      expect(state.metadata.formId).toBe(formId);
      expect(state.metadata.userId).toBe(userId);
      expect(state.metadata.version).toBe('1.0.0');
      expect(state.metadata.sessionId).toMatch(/^session_/);
      expect(state.values).toEqual({});
      expect(state.validation).toEqual({});
      expect(state.touched).toEqual({});
      expect(state.dirty).toEqual({});
      expect(state.isSubmitting).toBe(false);
      expect(state.submitCount).toBe(0);
    });

    it('should create initial state without userId', () => {
      const manager = new FormStateManager(formId);
      const state = manager.getState();
      
      expect(state.metadata.formId).toBe(formId);
      expect(state.metadata.userId).toBeUndefined();
    });
  });

  describe('field value management', () => {
    it('should update field value and mark as touched and dirty', () => {
      const fieldId = 'email';
      const value = 'test@example.com';

      stateManager.updateField(fieldId, value);

      expect(stateManager.getFieldValue(fieldId)).toBe(value);
      expect(stateManager.isFieldTouched(fieldId)).toBe(true);
      expect(stateManager.isFieldDirty(fieldId)).toBe(true);
    });

    it('should not mark field as dirty if value is the same', () => {
      const fieldId = 'email';
      const value = 'test@example.com';

      // Set initial value
      stateManager.updateField(fieldId, value);
      
      // Reset dirty state for testing
      const state = stateManager.getState();
      state.dirty[fieldId] = false;

      // Update with same value
      stateManager.updateField(fieldId, value);

      expect(stateManager.isFieldDirty(fieldId)).toBe(false);
    });

    it('should get all field values', () => {
      stateManager.updateField('email', 'test@example.com');
      stateManager.updateField('name', 'John Doe');

      const values = stateManager.getAllValues();
      expect(values).toEqual({
        email: 'test@example.com',
        name: 'John Doe'
      });
    });

    it('should set multiple values at once', () => {
      const values = {
        email: 'test@example.com',
        name: 'John Doe',
        age: 30
      };

      stateManager.setValues(values);

      expect(stateManager.getAllValues()).toEqual(values);
      expect(stateManager.isFieldTouched('email')).toBe(true);
      expect(stateManager.isFieldTouched('name')).toBe(true);
      expect(stateManager.isFieldTouched('age')).toBe(true);
    });
  });

  describe('validation management', () => {
    it('should set and get validation state', () => {
      const fieldId = 'email';
      const validationResult: ValidationResult = {
        isValid: false,
        errors: [{ code: 'INVALID_EMAIL', message: 'Invalid email format' }]
      };

      stateManager.setValidationState(fieldId, validationResult);

      expect(stateManager.getFieldValidation(fieldId)).toEqual(validationResult);
      expect(stateManager.isFieldValid(fieldId)).toBe(false);
    });

    it('should check if form is valid', () => {
      // Initially valid (no validation results)
      expect(stateManager.isFormValid()).toBe(true);

      // Add valid field
      stateManager.setValidationState('email', {
        isValid: true,
        errors: []
      });
      expect(stateManager.isFormValid()).toBe(true);

      // Add invalid field
      stateManager.setValidationState('name', {
        isValid: false,
        errors: [{ code: 'REQUIRED', message: 'Name is required' }]
      });
      expect(stateManager.isFormValid()).toBe(false);
    });

    it('should clear field validation', () => {
      const fieldId = 'email';
      stateManager.setValidationState(fieldId, {
        isValid: false,
        errors: [{ code: 'INVALID', message: 'Invalid' }]
      });

      stateManager.clearFieldValidation(fieldId);

      expect(stateManager.getFieldValidation(fieldId)).toBeUndefined();
    });
  });

  describe('form reset', () => {
    it('should reset form to initial state', () => {
      // Set some data
      stateManager.updateField('email', 'test@example.com');
      stateManager.setValidationState('email', {
        isValid: true,
        errors: []
      });
      stateManager.setSubmitting(true);

      // Reset form
      stateManager.resetForm();

      const state = stateManager.getState();
      expect(state.values).toEqual({});
      expect(state.validation).toEqual({});
      expect(state.touched).toEqual({});
      expect(state.dirty).toEqual({});
      expect(state.isSubmitting).toBe(false);
      expect(state.submitCount).toBe(0);
      expect(state.metadata.formId).toBe(formId);
      expect(state.metadata.userId).toBe(userId);
    });
  });

  describe('submission state', () => {
    it('should manage submission state', () => {
      expect(stateManager.getState().isSubmitting).toBe(false);
      expect(stateManager.getState().submitCount).toBe(0);

      stateManager.setSubmitting(true);
      expect(stateManager.getState().isSubmitting).toBe(true);
      expect(stateManager.getState().submitCount).toBe(1);

      stateManager.setSubmitting(false);
      expect(stateManager.getState().isSubmitting).toBe(false);
      expect(stateManager.getState().submitCount).toBe(1);

      stateManager.setSubmitting(true);
      expect(stateManager.getState().submitCount).toBe(2);
    });
  });

  describe('field state helpers', () => {
    it('should mark field as touched', () => {
      const fieldId = 'email';
      
      expect(stateManager.isFieldTouched(fieldId)).toBe(false);
      
      stateManager.markFieldTouched(fieldId);
      
      expect(stateManager.isFieldTouched(fieldId)).toBe(true);
    });

    it('should not update lastModified if field already touched', async () => {
      const fieldId = 'email';
      
      stateManager.markFieldTouched(fieldId);
      const firstModified = stateManager.getState().metadata.lastModified;
      
      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      
      stateManager.markFieldTouched(fieldId);
      const secondModified = stateManager.getState().metadata.lastModified;
      
      expect(secondModified).toEqual(firstModified);
    });
  });

  describe('state change subscriptions', () => {
    it('should notify subscribers of field changes', () => {
      const callback = jest.fn();
      const subscription = stateManager.subscribeToChanges(callback);

      stateManager.updateField('email', 'test@example.com');

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'field-change',
          fieldId: 'email',
          oldValue: undefined,
          newValue: 'test@example.com'
        })
      );

      subscription.unsubscribe();
    });

    it('should notify subscribers of validation changes', () => {
      const callback = jest.fn();
      stateManager.subscribeToChanges(callback);

      const validationResult: ValidationResult = {
        isValid: false,
        errors: [{ code: 'INVALID', message: 'Invalid' }]
      };

      stateManager.setValidationState('email', validationResult);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'validation-change',
          fieldId: 'email',
          newValue: validationResult
        })
      );
    });

    it('should handle subscription errors gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      const normalCallback = jest.fn();

      stateManager.subscribeToChanges(errorCallback);
      stateManager.subscribeToChanges(normalCallback);

      // Should not throw and should still call normal callback
      expect(() => {
        stateManager.updateField('email', 'test@example.com');
      }).not.toThrow();

      expect(normalCallback).toHaveBeenCalled();
    });

    it('should unsubscribe correctly', () => {
      const callback = jest.fn();
      const subscription = stateManager.subscribeToChanges(callback);

      stateManager.updateField('email', 'test1@example.com');
      expect(callback).toHaveBeenCalledTimes(1);

      subscription.unsubscribe();

      stateManager.updateField('email', 'test2@example.com');
      expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });

  describe('metadata management', () => {
    it('should return metadata copy', () => {
      const metadata = stateManager.getMetadata();
      
      expect(metadata.formId).toBe(formId);
      expect(metadata.userId).toBe(userId);
      
      // Ensure it's a copy, not reference
      metadata.formId = 'modified';
      expect(stateManager.getMetadata().formId).toBe(formId);
    });

    it('should update lastModified when field changes', async () => {
      const initialModified = stateManager.getState().metadata.lastModified;
      
      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      
      stateManager.updateField('email', 'test@example.com');
      const updatedModified = stateManager.getState().metadata.lastModified;
      
      expect(updatedModified.getTime()).toBeGreaterThan(initialModified.getTime());
    });
  });

  describe('edge cases', () => {
    it('should handle undefined field values', () => {
      stateManager.updateField('test', undefined);
      expect(stateManager.getFieldValue('test')).toBeUndefined();
    });

    it('should handle null field values', () => {
      stateManager.updateField('test', null);
      expect(stateManager.getFieldValue('test')).toBeNull();
    });

    it('should handle empty string field values', () => {
      stateManager.updateField('test', '');
      expect(stateManager.getFieldValue('test')).toBe('');
    });

    it('should handle complex object field values', () => {
      const complexValue = { nested: { data: [1, 2, 3] } };
      stateManager.updateField('test', complexValue);
      expect(stateManager.getFieldValue('test')).toEqual(complexValue);
    });
  });

  describe('programmatic state control methods', () => {
    describe('silent field updates', () => {
      it('should set field value without triggering change events', () => {
        const callback = jest.fn();
        stateManager.subscribeToChanges(callback);

        stateManager.setFieldValueSilently('email', 'test@example.com');

        expect(stateManager.getFieldValue('email')).toBe('test@example.com');
        expect(callback).not.toHaveBeenCalled();
      });
    });

    describe('batch operations', () => {
      it('should set multiple validation states at once', () => {
        const callback = jest.fn();
        stateManager.subscribeToChanges(callback);

        const validationStates = {
          email: { isValid: false, errors: [{ code: 'INVALID', message: 'Invalid email' }] },
          name: { isValid: true, errors: [] }
        };

        stateManager.setValidationStates(validationStates);

        expect(stateManager.getFieldValidation('email')).toEqual(validationStates.email);
        expect(stateManager.getFieldValidation('name')).toEqual(validationStates.name);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'validation-change' })
        );
      });

      it('should set multiple field values in batch', () => {
        const callback = jest.fn();
        stateManager.subscribeToChanges(callback);

        const values = {
          email: 'test@example.com',
          name: 'John Doe',
          age: 30
        };

        stateManager.setFieldValuesBatch(values);

        expect(stateManager.getAllValues()).toEqual(values);
        expect(stateManager.isFieldTouched('email')).toBe(true);
        expect(stateManager.isFieldTouched('name')).toBe(true);
        expect(stateManager.isFieldTouched('age')).toBe(true);
        expect(callback).toHaveBeenCalledTimes(1);
      });
    });

    describe('field reset operations', () => {
      it('should reset specific fields', () => {
        // Set up some data
        stateManager.updateField('email', 'test@example.com');
        stateManager.updateField('name', 'John Doe');
        stateManager.setValidationState('email', { isValid: true, errors: [] });

        // Reset only email field
        stateManager.resetFields(['email']);

        expect(stateManager.getFieldValue('email')).toBeUndefined();
        expect(stateManager.getFieldValue('name')).toBe('John Doe');
        expect(stateManager.getFieldValidation('email')).toBeUndefined();
        expect(stateManager.isFieldTouched('email')).toBe(false);
        expect(stateManager.isFieldDirty('email')).toBe(false);
      });
    });

    describe('metadata management', () => {
      it('should set partial metadata', () => {
        const newUserId = 'new-user-123';
        stateManager.setMetadata({ userId: newUserId });

        const metadata = stateManager.getMetadata();
        expect(metadata.userId).toBe(newUserId);
        expect(metadata.formId).toBe(formId); // Should preserve existing values
      });
    });

    describe('validation summary', () => {
      it('should provide comprehensive validation summary', () => {
        stateManager.setValidationState('email', {
          isValid: false,
          errors: [
            { code: 'REQUIRED', message: 'Email is required' },
            { code: 'INVALID', message: 'Invalid email format' }
          ],
          warnings: [{ code: 'SUGGESTION', message: 'Consider using a work email' }]
        });

        stateManager.setValidationState('name', {
          isValid: true,
          errors: [],
          warnings: [{ code: 'INFO', message: 'Name looks good' }]
        });

        const summary = stateManager.getValidationSummary();

        expect(summary.isValid).toBe(false);
        expect(summary.errorCount).toBe(2);
        expect(summary.warningCount).toBe(2);
        expect(summary.fieldErrors.email).toEqual(['Email is required', 'Invalid email format']);
        expect(summary.fieldWarnings.email).toEqual(['Consider using a work email']);
        expect(summary.fieldWarnings.name).toEqual(['Name looks good']);
      });
    });

    describe('form state queries', () => {
      it('should check if form is dirty', () => {
        expect(stateManager.isFormDirty()).toBe(false);

        stateManager.updateField('email', 'test@example.com');
        expect(stateManager.isFormDirty()).toBe(true);
      });

      it('should get dirty fields list', () => {
        stateManager.updateField('email', 'test@example.com');
        stateManager.updateField('name', 'John Doe');

        const dirtyFields = stateManager.getDirtyFields();
        expect(dirtyFields).toContain('email');
        expect(dirtyFields).toContain('name');
        expect(dirtyFields).toHaveLength(2);
      });

      it('should get touched fields list', () => {
        stateManager.markFieldTouched('email');
        stateManager.updateField('name', 'John Doe'); // This also marks as touched

        const touchedFields = stateManager.getTouchedFields();
        expect(touchedFields).toContain('email');
        expect(touchedFields).toContain('name');
        expect(touchedFields).toHaveLength(2);
      });
    });

    describe('submission control', () => {
      it('should start submission with callback', () => {
        const callback = jest.fn();
        stateManager.startSubmission(callback);

        expect(stateManager.getState().isSubmitting).toBe(true);
        expect(callback).toHaveBeenCalled();
      });

      it('should complete submission successfully', () => {
        const callback = jest.fn();
        
        // Set up dirty state
        stateManager.updateField('email', 'test@example.com');
        expect(stateManager.isFormDirty()).toBe(true);

        stateManager.completeSubmission(true, callback);

        expect(stateManager.getState().isSubmitting).toBe(false);
        expect(stateManager.isFormDirty()).toBe(false); // Should clear dirty state on success
        expect(callback).toHaveBeenCalledWith(true);
      });

      it('should complete submission with failure', () => {
        const callback = jest.fn();
        
        // Set up dirty state
        stateManager.updateField('email', 'test@example.com');
        expect(stateManager.isFormDirty()).toBe(true);

        stateManager.completeSubmission(false, callback);

        expect(stateManager.getState().isSubmitting).toBe(false);
        expect(stateManager.isFormDirty()).toBe(true); // Should preserve dirty state on failure
        expect(callback).toHaveBeenCalledWith(false);
      });
    });

    describe('state snapshots', () => {
      it('should create and restore snapshots', () => {
        // Set up some state
        stateManager.updateField('email', 'test@example.com');
        stateManager.setValidationState('email', { isValid: true, errors: [] });

        const snapshot = stateManager.createSnapshot();

        // Modify state
        stateManager.updateField('email', 'modified@example.com');
        stateManager.resetForm();

        // Restore from snapshot
        stateManager.restoreFromSnapshot(snapshot);

        expect(stateManager.getFieldValue('email')).toBe('test@example.com');
        expect(stateManager.getFieldValidation('email')).toEqual({ isValid: true, errors: [] });
      });

      it('should create independent snapshots', () => {
        stateManager.updateField('email', 'test@example.com');
        const snapshot = stateManager.createSnapshot();

        // Modify the snapshot object
        snapshot.values.email = 'modified@example.com';

        // Original state should be unchanged
        expect(stateManager.getFieldValue('email')).toBe('test@example.com');
      });
    });

    describe('validation control', () => {
      it('should validate specific fields', () => {
        const validationResults = {
          email: { isValid: false, errors: [{ code: 'INVALID', message: 'Invalid email' }] },
          name: { isValid: true, errors: [] }
        };

        stateManager.validateFields(['email', 'name'], validationResults);

        expect(stateManager.getFieldValidation('email')).toEqual(validationResults.email);
        expect(stateManager.getFieldValidation('name')).toEqual(validationResults.name);
      });

      it('should clear all validation', () => {
        // Set up validation
        stateManager.setValidationState('email', { isValid: false, errors: [{ code: 'INVALID', message: 'Invalid' }] });
        stateManager.setValidationState('name', { isValid: true, errors: [] });

        stateManager.clearAllValidation();

        expect(stateManager.getFieldValidation('email')).toBeUndefined();
        expect(stateManager.getFieldValidation('name')).toBeUndefined();
        expect(stateManager.isFormValid()).toBe(true);
      });
    });

    describe('pristine state management', () => {
      it('should mark field as pristine', () => {
        stateManager.updateField('email', 'test@example.com');
        expect(stateManager.isFieldDirty('email')).toBe(true);

        stateManager.markFieldPristine('email');
        expect(stateManager.isFieldDirty('email')).toBe(false);
      });

      it('should mark multiple fields as pristine', () => {
        stateManager.updateField('email', 'test@example.com');
        stateManager.updateField('name', 'John Doe');
        
        expect(stateManager.isFieldDirty('email')).toBe(true);
        expect(stateManager.isFieldDirty('name')).toBe(true);

        stateManager.markFieldsPristine(['email', 'name']);
        
        expect(stateManager.isFieldDirty('email')).toBe(false);
        expect(stateManager.isFieldDirty('name')).toBe(false);
      });
    });

    describe('field state summary', () => {
      it('should provide comprehensive field state', () => {
        const fieldId = 'email';
        const value = 'test@example.com';
        const validation = { isValid: false, errors: [{ code: 'INVALID', message: 'Invalid' }] };

        stateManager.updateField(fieldId, value);
        stateManager.setValidationState(fieldId, validation);

        const fieldState = stateManager.getFieldState(fieldId);

        expect(fieldState.value).toBe(value);
        expect(fieldState.isValid).toBe(false);
        expect(fieldState.isTouched).toBe(true);
        expect(fieldState.isDirty).toBe(true);
        expect(fieldState.validation).toEqual(validation);
      });

      it('should handle field state for non-existent field', () => {
        const fieldState = stateManager.getFieldState('nonexistent');

        expect(fieldState.value).toBeUndefined();
        expect(fieldState.isValid).toBe(true); // No validation means valid
        expect(fieldState.isTouched).toBe(false);
        expect(fieldState.isDirty).toBe(false);
        expect(fieldState.validation).toBeUndefined();
      });
    });
  });

  describe('cascading state updates', () => {
    const fields = [
      {
        id: 'trigger',
        type: 'select' as const,
        label: 'Trigger Field',
        required: false,
        validation: []
      },
      {
        id: 'dependent',
        type: 'text' as const,
        label: 'Dependent Field',
        required: false,
        validation: [],
        dependencies: ['trigger']
      }
    ];

    const conditionalRules = [
      {
        id: 'showRule',
        condition: (state: any) => state.values.trigger === 'show',
        actions: [
          { type: 'show' as const, targetFieldId: 'dependent' }
        ]
      },
      {
        id: 'hideRule',
        condition: (state: any) => state.values.trigger === 'hide',
        actions: [
          { type: 'hide' as const, targetFieldId: 'dependent' }
        ]
      }
    ];

    beforeEach(() => {
      stateManager.initializeDependencies(fields, conditionalRules);
    });

    it('should initialize dependencies correctly', () => {
      expect(stateManager.hasFieldDependencies('dependent')).toBe(true);
      expect(stateManager.hasFieldDependents('trigger')).toBe(true);
      expect(stateManager.getDependentFields('trigger')).toContain('dependent');
      expect(stateManager.getFieldDependencies('dependent')).toContain('trigger');
    });

    it('should handle field visibility changes', () => {
      // Initially all fields should be visible
      expect(stateManager.isFieldVisible('dependent')).toBe(true);

      // Set field visibility
      stateManager.setFieldVisibility('dependent', false);
      expect(stateManager.isFieldVisible('dependent')).toBe(false);

      // Reset visibility
      stateManager.setFieldVisibility('dependent', true);
      expect(stateManager.isFieldVisible('dependent')).toBe(true);
    });

    it('should get all field visibility states', () => {
      stateManager.setFieldVisibility('dependent', false);
      const visibility = stateManager.getFieldVisibility();
      
      expect(visibility.trigger).toBe(true);
      expect(visibility.dependent).toBe(false);
    });

    it('should trigger cascading updates manually', () => {
      const callback = jest.fn();
      stateManager.subscribeToChanges(callback);

      stateManager.updateField('trigger', 'show');
      stateManager.triggerCascadingUpdates('trigger');

      // Should have been called for the initial update and the manual trigger
      expect(callback).toHaveBeenCalled();
    });

    it('should preview cascading updates without applying them', () => {
      const preview = stateManager.previewCascadingUpdates('trigger', 'show');
      
      // Should show what would happen without actually changing state
      expect(preview.visibilityChanges.dependent).toBe(true);
      
      // But actual visibility should be unchanged
      expect(stateManager.isFieldVisible('dependent')).toBe(true);
    });

    it('should get field processing order', () => {
      const order = stateManager.getFieldProcessingOrder();
      
      // Trigger should come before dependent due to dependency
      const triggerIndex = order.indexOf('trigger');
      const dependentIndex = order.indexOf('dependent');
      
      expect(triggerIndex).toBeLessThan(dependentIndex);
    });

    it('should evaluate all conditional logic', () => {
      stateManager.updateField('trigger', 'show');
      stateManager.evaluateAllConditionalLogic();
      
      // This should process all fields and apply conditional logic
      expect(stateManager.isFieldVisible('dependent')).toBe(true);
    });

    it('should reset cascading state', () => {
      // Hide a field
      stateManager.setFieldVisibility('dependent', false);
      expect(stateManager.isFieldVisible('dependent')).toBe(false);

      // Reset should make all fields visible again
      stateManager.resetCascadingState();
      expect(stateManager.isFieldVisible('dependent')).toBe(true);
    });

    it('should handle complex dependency chains', () => {
      const complexFields = [
        {
          id: 'field1',
          type: 'text' as const,
          label: 'Field 1',
          required: false,
          validation: []
        },
        {
          id: 'field2',
          type: 'text' as const,
          label: 'Field 2',
          required: false,
          validation: [],
          dependencies: ['field1']
        },
        {
          id: 'field3',
          type: 'text' as const,
          label: 'Field 3',
          required: false,
          validation: [],
          dependencies: ['field2']
        }
      ];

      stateManager.initializeDependencies(complexFields);

      expect(stateManager.getDependentFields('field1')).toContain('field2');
      expect(stateManager.getDependentFields('field2')).toContain('field3');
      
      const order = stateManager.getFieldProcessingOrder();
      const field1Index = order.indexOf('field1');
      const field2Index = order.indexOf('field2');
      const field3Index = order.indexOf('field3');
      
      expect(field1Index).toBeLessThan(field2Index);
      expect(field2Index).toBeLessThan(field3Index);
    });
  });
});