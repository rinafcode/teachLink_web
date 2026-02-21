/**
 * Dynamic Form Builder Component
 * Renders forms dynamically from JSON configuration
 */

'use client';

import React, { useEffect, useState } from 'react';
import { FormConfiguration, FieldDescriptor, FormState } from '@/form-management/types/core';
import { FormConfigurationParser } from '@/form-management/utils/configuration-parser';
import { FormStateManager } from '@/form-management/state/form-state-manager';
import { ValidationEngineImpl } from '@/form-management/validation/validation-engine';
import { AutoSaveManagerImpl } from '@/form-management/auto-save/auto-save-manager';

interface DynamicFormBuilderProps {
  config: FormConfiguration | string;
  onSubmit?: (values: Record<string, any>) => void | Promise<void>;
  onFieldChange?: (fieldId: string, value: any) => void;
  autoSave?: boolean;
  autoSaveInterval?: number;
  className?: string;
}

export const DynamicFormBuilder: React.FC<DynamicFormBuilderProps> = ({
  config,
  onSubmit,
  onFieldChange,
  autoSave = false,
  autoSaveInterval = 5000,
  className = ''
}) => {
  const [formConfig, setFormConfig] = useState<FormConfiguration | null>(null);
  const [stateManager] = useState(() => new FormStateManager('dynamic-form'));
  const [validationEngine] = useState(() => new ValidationEngineImpl());
  const [autoSaveManager] = useState(() => new AutoSaveManagerImpl());
  const [formState, setFormState] = useState<FormState>(stateManager.getState());
  const [saveStatus, setSaveStatus] = useState<string>('idle');

  // Parse configuration
  useEffect(() => {
    const parser = new FormConfigurationParser();
    try {
      const parsedConfig = typeof config === 'string' ? parser.parse(config) : config;
      const validation = parser.validate(parsedConfig);
      
      if (!validation.isValid) {
        console.error('Invalid form configuration:', validation.errors);
        return;
      }
      
      setFormConfig(parsedConfig);
      
      // Initialize dependencies
      stateManager.initializeDependencies(
        parsedConfig.fields,
        parsedConfig.conditionalLogic || []
      );
    } catch (error) {
      console.error('Error parsing form configuration:', error);
    }
  }, [config, stateManager]);

  // Setup auto-save
  useEffect(() => {
    if (!autoSave || !formConfig) return;

    autoSaveManager.enableAutoSave(formConfig.id, autoSaveInterval);
    
    const subscription = autoSaveManager.onSaveStatusChange((status) => {
      setSaveStatus(status.status);
    });

    // Load draft on mount
    autoSaveManager.loadDraft(formConfig.id).then((draft) => {
      if (draft) {
        Object.entries(draft.values).forEach(([fieldId, value]) => {
          stateManager.updateField(fieldId, value);
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [autoSave, autoSaveInterval, formConfig, stateManager, autoSaveManager]);

  // Subscribe to state changes
  useEffect(() => {
    const subscription = stateManager.subscribeToChanges((event) => {
      setFormState(stateManager.getState());
      
      if (event.type === 'field-change' && event.fieldId && autoSave && formConfig) {
        autoSaveManager.saveNow(formConfig.id, stateManager.getState());
      }
    });

    return () => subscription.unsubscribe();
  }, [stateManager, autoSave, formConfig, autoSaveManager]);

  const handleFieldChange = async (fieldId: string, value: any) => {
    stateManager.updateField(fieldId, value);
    
    if (onFieldChange) {
      onFieldChange(fieldId, value);
    }

    // Validate field
    const validationResult = await validationEngine.validateField(
      fieldId,
      value,
      stateManager.getState()
    );
    stateManager.setValidationState(fieldId, validationResult);
  };

  const handleFieldBlur = (fieldId: string) => {
    stateManager.markFieldTouched(fieldId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formConfig) return;

    stateManager.setSubmitting(true);

    try {
      // Validate entire form
      const validationResult = await validationEngine.validateForm(stateManager.getState());
      
      if (!validationResult.isValid) {
        console.error('Form validation failed:', validationResult.fieldResults);
        stateManager.setSubmitting(false);
        return;
      }

      // Submit form
      if (onSubmit) {
        await onSubmit(formState.values);
      }

      // Clear draft after successful submission
      if (autoSave) {
        await autoSaveManager.clearDraft(formConfig.id);
      }

      stateManager.completeSubmission(true);
    } catch (error) {
      console.error('Form submission error:', error);
      stateManager.completeSubmission(false);
    }
  };

  const renderField = (field: FieldDescriptor) => {
    const value = formState.values[field.id] || '';
    const validation = formState.validation[field.id];
    const isTouched = formState.touched[field.id];
    const isVisible = stateManager.isFieldVisible(field.id);

    if (!isVisible) return null;

    const hasError = validation && !validation.isValid && isTouched;

    return (
      <div key={field.id} className={`form-field ${field.styling?.className || ''}`}>
        <label htmlFor={field.id} className="form-label">
          {field.label}
          {field.required && <span className="required">*</span>}
        </label>
        
        {renderInput(field, value)}
        
        {hasError && (
          <div className="form-error">
            {validation.errors.map((error, idx) => (
              <span key={idx}>{error.message}</span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderInput = (field: FieldDescriptor, value: any) => {
    const commonProps = {
      id: field.id,
      name: field.id,
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
        handleFieldChange(field.id, e.target.value),
      onBlur: () => handleFieldBlur(field.id),
      placeholder: field.placeholder,
      required: field.required,
      className: 'form-input'
    };

    switch (field.type) {
      case 'textarea':
        return <textarea {...commonProps} rows={4} />;
      
      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Select...</option>
            {/* Options would come from field configuration */}
          </select>
        );
      
      case 'checkbox':
        return (
          <input
            type="checkbox"
            {...commonProps}
            checked={!!value}
            onChange={(e) => handleFieldChange(field.id, e.target.checked)}
          />
        );
      
      case 'radio':
        return (
          <div className="radio-group">
            {/* Radio options would come from field configuration */}
          </div>
        );
      
      default:
        return <input type={field.type} {...commonProps} />;
    }
  };

  if (!formConfig) {
    return <div>Loading form...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className={`dynamic-form ${className}`}>
      <div className="form-header">
        <h2>{formConfig.title}</h2>
        {formConfig.description && <p>{formConfig.description}</p>}
      </div>

      {autoSave && (
        <div className={`save-status save-status-${saveStatus}`}>
          {saveStatus === 'saving' && '💾 Saving...'}
          {saveStatus === 'saved' && '✅ Saved'}
          {saveStatus === 'error' && '❌ Save failed'}
        </div>
      )}

      <div className={`form-fields layout-${formConfig.layout.type}`}>
        {formConfig.fields.map(renderField)}
      </div>

      <div className="form-actions">
        <button
          type="submit"
          disabled={formState.isSubmitting || !stateManager.isFormValid()}
          className="btn-submit"
        >
          {formState.isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </form>
  );
};
