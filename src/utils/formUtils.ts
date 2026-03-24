/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Form Utilities
 * Helper functions for form management and validation
 */

import {
  FormConfiguration,
  FieldDescriptor,
  ValidationRule,
  FormState,
  FieldType
} from '@/form-management/types/core';

/**
 * Create a basic form configuration
 */
export function createFormConfig(
  id: string,
  title: string,
  fields: FieldDescriptor[]
): FormConfiguration {
  return {
    id,
    version: '1.0.0',
    title,
    fields,
    layout: {
      type: 'single-column',
      spacing: 'normal',
      responsive: {
        breakpoints: { mobile: 768, tablet: 1024 },
        layouts: {}
      }
    },
    validation: {
      validateOnChange: false,
      validateOnBlur: true,
      showErrorsOnSubmit: true,
      debounceMs: 300,
      customRules: {}
    }
  };
}

/**
 * Create a field descriptor
 */
export function createField(
  id: string,
  type: FieldType,
  label: string,
  options: Partial<FieldDescriptor> = {}
): FieldDescriptor {
  return {
    id,
    type,
    label,
    required: false,
    validation: [],
    ...options
  };
}

/**
 * Create common validation rules
 */
export const ValidationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    type: 'required',
    message
  }),

  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    type: 'email',
    message
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    type: 'minLength',
    message: message || `Minimum ${min} characters required`,
    params: { min }
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    type: 'maxLength',
    message: message || `Maximum ${max} characters allowed`,
    params: { max }
  }),

  pattern: (pattern: string, message = 'Invalid format'): ValidationRule => ({
    type: 'pattern',
    message,
    params: { pattern }
  }),

  custom: (
    validator: (value: any, formState: FormState) => boolean,
    message = 'Validation failed'
  ): ValidationRule => ({
    type: 'custom',
    message,
    condition: (formState) => validator(formState.values, formState)
  })
};

/**
 * Extract form values from FormState
 */
export function getFormValues(formState: FormState): Record<string, any> {
  return { ...formState.values };
}

/**
 * Check if form has any errors
 */
export function hasFormErrors(formState: FormState): boolean {
  return Object.values(formState.validation).some(result => !result.isValid);
}

/**
 * Get all form errors
 */
export function getFormErrors(formState: FormState): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  Object.entries(formState.validation).forEach(([fieldId, result]) => {
    if (!result.isValid) {
      errors[fieldId] = result.errors.map(e => e.message);
    }
  });

  return errors;
}

/**
 * Check if form is dirty (has unsaved changes)
 */
export function isFormDirty(formState: FormState): boolean {
  return Object.values(formState.dirty).some(isDirty => isDirty);
}

/**
 * Get list of dirty fields
 */
export function getDirtyFields(formState: FormState): string[] {
  return Object.entries(formState.dirty)
    .filter(([_, isDirty]) => isDirty)
    .map(([fieldId]) => fieldId);
}

/**
 * Get list of touched fields
 */
export function getTouchedFields(formState: FormState): string[] {
  return Object.entries(formState.touched)
    .filter(([_, isTouched]) => isTouched)
    .map(([fieldId]) => fieldId);
}

/**
 * Format field value for display
 */
export function formatFieldValue(value: any, type: FieldType): string {
  if (value === null || value === undefined) {
    return '';
  }

  switch (type) {
    case 'date':
      return value instanceof Date ? value.toLocaleDateString() : value;
    case 'time':
      return value instanceof Date ? value.toLocaleTimeString() : value;
    case 'datetime-local':
      return value instanceof Date ? value.toLocaleString() : value;
    case 'checkbox':
      return value ? 'Yes' : 'No';
    case 'number':
      return typeof value === 'number' ? value.toString() : value;
    default:
      return String(value);
  }
}

/**
 * Parse field value from string
 */
export function parseFieldValue(value: string, type: FieldType): any {
  if (!value) {
    return type === 'checkbox' ? false : '';
  }

  switch (type) {
    case 'number':
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    case 'checkbox':
      return value === 'true' || value === '1';
    case 'date':
    case 'time':
    case 'datetime-local':
      return new Date(value);
    default:
      return value;
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate phone number format (basic)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Sanitize form values (remove empty strings, null, undefined)
 */
export function sanitizeFormValues(values: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  Object.entries(values).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      sanitized[key] = value;
    }
  });

  return sanitized;
}

/**
 * Deep clone form state
 */
export function cloneFormState(formState: FormState): FormState {
  return JSON.parse(JSON.stringify(formState));
}

/**
 * Merge form states
 */
export function mergeFormStates(state1: FormState, state2: Partial<FormState>): FormState {
  return {
    ...state1,
    ...state2,
    values: { ...state1.values, ...state2.values },
    validation: { ...state1.validation, ...state2.validation },
    touched: { ...state1.touched, ...state2.touched },
    dirty: { ...state1.dirty, ...state2.dirty },
    metadata: { ...state1.metadata, ...state2.metadata }
  };
}

/**
 * Calculate form completion percentage
 */
export function getFormCompletionPercentage(
  formState: FormState,
  requiredFields: string[]
): number {
  if (requiredFields.length === 0) return 100;

  const completedFields = requiredFields.filter(fieldId => {
    const value = formState.values[fieldId];
    return value !== null && value !== undefined && value !== '';
  });

  return Math.round((completedFields.length / requiredFields.length) * 100);
}

/**
 * Get field label from configuration
 */
export function getFieldLabel(
  fieldId: string,
  config: FormConfiguration
): string | undefined {
  const field = config.fields.find(f => f.id === fieldId);
  return field?.label;
}

/**
 * Check if field is required
 */
export function isFieldRequired(
  fieldId: string,
  config: FormConfiguration
): boolean {
  const field = config.fields.find(f => f.id === fieldId);
  return field?.required || false;
}

/**
 * Get field type
 */
export function getFieldType(
  fieldId: string,
  config: FormConfiguration
): FieldType | undefined {
  const field = config.fields.find(f => f.id === fieldId);
  return field?.type;
}

/**
 * Create form data for submission (FormData object)
 */
export function createFormData(values: Record<string, any>): FormData {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach(item => formData.append(key, item));
    } else if (value !== null && value !== undefined) {
      formData.append(key, String(value));
    }
  });

  return formData;
}

/**
 * Convert FormData to plain object
 */
export function formDataToObject(formData: FormData): Record<string, any> {
  const obj: Record<string, any> = {};

  formData.forEach((value, key) => {
    if (obj[key]) {
      if (Array.isArray(obj[key])) {
        obj[key].push(value);
      } else {
        obj[key] = [obj[key], value];
      }
    } else {
      obj[key] = value;
    }
  });

  return obj;
}

/**
 * Debounce function for form operations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for form operations
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
