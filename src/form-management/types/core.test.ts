/**
 * Core Types Validation Tests
 * 
 * Basic tests to ensure the type definitions are working correctly
 * and the testing setup is properly configured.
 */

import { describe, it, expect } from 'vitest';
import { fc, testConfig } from '../tests/test-setup';
import type { 
  FieldType, 
  ValidationRule, 
  FormConfiguration,
  FieldDescriptor 
} from './core';

describe('Core Types', () => {
  it('should have valid FieldType values', () => {
    const validFieldTypes: FieldType[] = [
      'text', 'number', 'email', 'password', 'select', 
      'checkbox', 'radio', 'textarea', 'file', 'date', 
      'time', 'datetime-local'
    ];
    
    expect(validFieldTypes).toHaveLength(12);
    expect(validFieldTypes).toContain('text');
    expect(validFieldTypes).toContain('email');
  });

  it('should create valid ValidationRule objects', () => {
    const rule: ValidationRule = {
      type: 'required',
      message: 'This field is required',
      params: {}
    };
    
    expect(rule.type).toBe('required');
    expect(rule.message).toBe('This field is required');
  });

  it('should create valid FieldDescriptor objects', () => {
    const field: FieldDescriptor = {
      id: 'test-field',
      type: 'text',
      label: 'Test Field',
      required: true,
      validation: []
    };
    
    expect(field.id).toBe('test-field');
    expect(field.type).toBe('text');
    expect(field.required).toBe(true);
  });

  // Property-based test to ensure type system works with fast-check
  it('Property: FieldType values are always valid', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'text', 'number', 'email', 'password', 'select',
          'checkbox', 'radio', 'textarea', 'file', 'date',
          'time', 'datetime-local'
        ),
        (fieldType: FieldType) => {
          // Test that we can create a valid field descriptor with any field type
          const field: FieldDescriptor = {
            id: 'test',
            type: fieldType,
            label: 'Test',
            required: false,
            validation: []
          };
          
          return field.type === fieldType;
        }
      ),
      testConfig
    );
  });
});