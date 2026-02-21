/**
 * Advanced Forms Hook
 * Provides comprehensive form management with validation, auto-save, and state management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { FormStateManager } from '@/form-management/state/form-state-manager';
import { ValidationEngineImpl } from '@/form-management/validation/validation-engine';
import { AutoSaveManagerImpl } from '@/form-management/auto-save/auto-save-manager';
import {
  FormConfiguration,
  FormState,
  ValidationResult,
  SaveStatus,
  FieldDescriptor
} from '@/form-management/types/core';

interface UseAdvancedFormsOptions {
  formId: string;
  config: FormConfiguration;
  autoSave?: boolean;
  autoSaveInterval?: number;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  onSubmit?: (values: Record<string, any>) => void | Promise<void>;
  onFieldChange?: (fieldId: string, value: any) => void;
  onValidationChange?: (fieldId: string, result: ValidationResult) => void;
}

interface UseAdvancedFormsReturn {
  // State
  formState: FormState;
  saveStatus: SaveStatus;
  isSubmitting: boolean;
  isValid: boolean;

  // Field operations
  getFieldValue: (fieldId: string) => any;
  setFieldValue: (fieldId: string, value: any) => void;
  setFieldValues: (values: Record<string, any>) => void;
  getFieldValidation: (fieldId: string) => ValidationResult | undefined;
  isFieldTouched: (fieldId: string) => boolean;
  isFieldDirty: (fieldId: string) => boolean;
  isFieldVisible: (fieldId: string) => boolean;

  // Form operations
  validateField: (fieldId: string) => Promise<ValidationResult>;
  validateForm: () => Promise<boolean>;
  resetForm: () => void;
  submitForm: () => Promise<void>;

  // Auto-save operations
  saveNow: () => Promise<void>;
  loadDraft: () => Promise<void>;
  clearDraft: () => Promise<void>;

  // Managers (for advanced usage)
  stateManager: FormStateManager;
  validationEngine: ValidationEngineImpl;
  autoSaveManager: AutoSaveManagerImpl;
}

export const useAdvancedForms = (options: UseAdvancedFormsOptions): UseAdvancedFormsReturn => {
  const {
    formId,
    config,
    autoSave = false,
    autoSaveInterval = 5000,
    validateOnChange = false,
    validateOnBlur = true,
    onSubmit,
    onFieldChange,
    onValidationChange
  } = options;

  // Initialize managers
  const stateManagerRef = useRef<FormStateManager>();
  const validationEngineRef = useRef<ValidationEngineImpl>();
  const autoSaveManagerRef = useRef<AutoSaveManagerImpl>();

  if (!stateManagerRef.current) {
    stateManagerRef.current = new FormStateManager(formId);
  }
  if (!validationEngineRef.current) {
    validationEngineRef.current = new ValidationEngineImpl();
  }
  if (!autoSaveManagerRef.current) {
    autoSaveManagerRef.current = new AutoSaveManagerImpl();
  }

  const stateManager = stateManagerRef.current;
  const validationEngine = validationEngineRef.current;
  const autoSaveManager = autoSaveManagerRef.current;

  // State
  const [formState, setFormState] = useState<FormState>(stateManager.getState());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({
    status: 'idle',
    queuedSaves: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize dependencies
  useEffect(() => {
    stateManager.initializeDependencies(config.fields, config.conditionalLogic || []);
  }, [config, stateManager]);

  // Subscribe to state changes
  useEffect(() => {
    const subscription = stateManager.subscribeToChanges((event) => {
      setFormState(stateManager.getState());

      if (event.type === 'field-change' && event.fieldId) {
        if (onFieldChange) {
          onFieldChange(event.fieldId, event.newValue);
        }

        if (validateOnChange) {
          validateField(event.fieldId);
        }

        if (autoSave) {
          autoSaveManager.saveNow(formId, stateManager.getState());
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [stateManager, validateOnChange, autoSave, formId, onFieldChange]);

  // Setup auto-save
  useEffect(() => {
    if (!autoSave) return;

    autoSaveManager.enableAutoSave(formId, autoSaveInterval);

    const subscription = autoSaveManager.onSaveStatusChange((status) => {
      setSaveStatus(status);
    });

    // Load draft on mount
    loadDraft();

    return () => {
      subscription.unsubscribe();
    };
  }, [autoSave, autoSaveInterval, formId]);

  // Field operations
  const getFieldValue = useCallback((fieldId: string) => {
    return stateManager.getFieldValue(fieldId);
  }, [stateManager]);

  const setFieldValue = useCallback((fieldId: string, value: any) => {
    stateManager.updateField(fieldId, value);
  }, [stateManager]);

  const setFieldValues = useCallback((values: Record<string, any>) => {
    stateManager.setValues(values);
  }, [stateManager]);

  const getFieldValidation = useCallback((fieldId: string) => {
    return stateManager.getFieldValidation(fieldId);
  }, [stateManager]);

  const isFieldTouched = useCallback((fieldId: string) => {
    return stateManager.isFieldTouched(fieldId);
  }, [stateManager]);

  const isFieldDirty = useCallback((fieldId: string) => {
    return stateManager.isFieldDirty(fieldId);
  }, [stateManager]);

  const isFieldVisible = useCallback((fieldId: string) => {
    return stateManager.isFieldVisible(fieldId);
  }, [stateManager]);

  // Validation operations
  const validateField = useCallback(async (fieldId: string): Promise<ValidationResult> => {
    const value = stateManager.getFieldValue(fieldId);
    const result = await validationEngine.validateField(fieldId, value, stateManager.getState());
    
    stateManager.setValidationState(fieldId, result);

    if (onValidationChange) {
      onValidationChange(fieldId, result);
    }

    return result;
  }, [stateManager, validationEngine, onValidationChange]);

  const validateForm = useCallback(async (): Promise<boolean> => {
    const result = await validationEngine.validateForm(stateManager.getState());
    
    // Update validation state for all fields
    Object.entries(result.fieldResults).forEach(([fieldId, fieldResult]) => {
      stateManager.setValidationState(fieldId, fieldResult);
    });

    return result.isValid;
  }, [stateManager, validationEngine]);

  // Form operations
  const resetForm = useCallback(() => {
    stateManager.resetForm();
  }, [stateManager]);

  const submitForm = useCallback(async () => {
    setIsSubmitting(true);
    stateManager.setSubmitting(true);

    try {
      const isValid = await validateForm();

      if (!isValid) {
        console.warn('Form validation failed');
        return;
      }

      if (onSubmit) {
        await onSubmit(formState.values);
      }

      // Clear draft after successful submission
      if (autoSave) {
        await clearDraft();
      }

      stateManager.completeSubmission(true);
    } catch (error) {
      console.error('Form submission error:', error);
      stateManager.completeSubmission(false);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [stateManager, validateForm, onSubmit, formState.values, autoSave]);

  // Auto-save operations
  const saveNow = useCallback(async () => {
    await autoSaveManager.saveNow(formId, stateManager.getState());
  }, [autoSaveManager, formId, stateManager]);

  const loadDraft = useCallback(async () => {
    const draft = await autoSaveManager.loadDraft(formId);
    if (draft) {
      Object.entries(draft.values).forEach(([fieldId, value]) => {
        stateManager.updateField(fieldId, value);
      });
    }
  }, [autoSaveManager, formId, stateManager]);

  const clearDraft = useCallback(async () => {
    await autoSaveManager.clearDraft(formId);
  }, [autoSaveManager, formId]);

  // Computed values
  const isValid = stateManager.isFormValid();

  return {
    // State
    formState,
    saveStatus,
    isSubmitting,
    isValid,

    // Field operations
    getFieldValue,
    setFieldValue,
    setFieldValues,
    getFieldValidation,
    isFieldTouched,
    isFieldDirty,
    isFieldVisible,

    // Form operations
    validateField,
    validateForm,
    resetForm,
    submitForm,

    // Auto-save operations
    saveNow,
    loadDraft,
    clearDraft,

    // Managers
    stateManager,
    validationEngine,
    autoSaveManager
  };
};

// Additional utility hooks

export const useFormField = (
  formHook: UseAdvancedFormsReturn,
  fieldId: string
) => {
  const value = formHook.getFieldValue(fieldId);
  const validation = formHook.getFieldValidation(fieldId);
  const isTouched = formHook.isFieldTouched(fieldId);
  const isDirty = formHook.isFieldDirty(fieldId);
  const isVisible = formHook.isFieldVisible(fieldId);

  const setValue = useCallback((newValue: any) => {
    formHook.setFieldValue(fieldId, newValue);
  }, [formHook, fieldId]);

  const validate = useCallback(async () => {
    return await formHook.validateField(fieldId);
  }, [formHook, fieldId]);

  const hasError = validation && !validation.isValid && isTouched;

  return {
    value,
    setValue,
    validation,
    validate,
    isTouched,
    isDirty,
    isVisible,
    hasError,
    errors: validation?.errors || [],
    warnings: validation?.warnings || []
  };
};
