/**
 * Advanced Validation Component
 * Provides advanced validation UI with custom rules and async validation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ValidationEngineImpl } from '@/form-management/validation/validation-engine';
import { ValidationResult, ValidationRule, FormState } from '@/form-management/types/core';

interface AdvancedValidationProps {
  fieldId: string;
  value: any;
  rules: ValidationRule[];
  formState: FormState;
  onValidationComplete?: (result: ValidationResult) => void;
  showValidationOn?: 'change' | 'blur' | 'submit';
  debounceMs?: number;
  className?: string;
}

export const AdvancedValidation: React.FC<AdvancedValidationProps> = ({
  fieldId,
  value,
  rules,
  formState,
  onValidationComplete,
  showValidationOn = 'blur',
  debounceMs = 300,
  className = ''
}) => {
  const [validationEngine] = useState(() => new ValidationEngineImpl());
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (showValidationOn === 'change' || showErrors) {
        await performValidation();
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, rules, formState]);

  const performValidation = async () => {
    setIsValidating(true);

    try {
      const result = await validationEngine.validateField(fieldId, value, formState);
      setValidationResult(result);

      if (onValidationComplete) {
        onValidationComplete(result);
      }
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleBlur = async () => {
    if (showValidationOn === 'blur') {
      setShowErrors(true);
      await performValidation();
    }
  };

  const hasErrors = validationResult && !validationResult.isValid;
  const hasWarnings = validationResult && validationResult.warnings && validationResult.warnings.length > 0;

  return (
    <div className={`advanced-validation ${className}`}>
      {isValidating && (
        <div className="validation-loading">
          <span className="spinner">⏳</span>
          <span>Validating...</span>
        </div>
      )}

      {showErrors && hasErrors && (
        <div className="validation-errors">
          {validationResult.errors.map((error, idx) => (
            <div key={idx} className="validation-error">
              <span className="error-icon">❌</span>
              <span className="error-message">{error.message}</span>
            </div>
          ))}
        </div>
      )}

      {showErrors && hasWarnings && (
        <div className="validation-warnings">
          {validationResult.warnings!.map((warning, idx) => (
            <div key={idx} className="validation-warning">
              <span className="warning-icon">⚠️</span>
              <span className="warning-message">{warning.message}</span>
            </div>
          ))}
        </div>
      )}

      {showErrors && validationResult && validationResult.isValid && !hasWarnings && (
        <div className="validation-success">
          <span className="success-icon">✅</span>
          <span className="success-message">Valid</span>
        </div>
      )}
    </div>
  );
};

interface ValidationRuleBuilderProps {
  onRuleCreate: (rule: ValidationRule) => void;
  className?: string;
}

export const ValidationRuleBuilder: React.FC<ValidationRuleBuilderProps> = ({
  onRuleCreate,
  className = ''
}) => {
  const [ruleType, setRuleType] = useState<ValidationRule['type']>('required');
  const [message, setMessage] = useState('');
  const [params, setParams] = useState<Record<string, any>>({});

  const handleCreateRule = () => {
    const rule: ValidationRule = {
      type: ruleType,
      message,
      params: Object.keys(params).length > 0 ? params : undefined
    };

    onRuleCreate(rule);

    // Reset form
    setMessage('');
    setParams({});
  };

  return (
    <div className={`validation-rule-builder ${className}`}>
      <h3>Create Validation Rule</h3>

      <div className="form-group">
        <label>Rule Type</label>
        <select value={ruleType} onChange={(e) => setRuleType(e.target.value as ValidationRule['type'])}>
          <option value="required">Required</option>
          <option value="email">Email</option>
          <option value="minLength">Min Length</option>
          <option value="maxLength">Max Length</option>
          <option value="pattern">Pattern</option>
          <option value="custom">Custom</option>
          <option value="async">Async</option>
        </select>
      </div>

      <div className="form-group">
        <label>Error Message</label>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter error message"
        />
      </div>

      {(ruleType === 'minLength' || ruleType === 'maxLength') && (
        <div className="form-group">
          <label>Length</label>
          <input
            type="number"
            value={params.min || params.max || ''}
            onChange={(e) => setParams({
              [ruleType === 'minLength' ? 'min' : 'max']: parseInt(e.target.value)
            })}
          />
        </div>
      )}

      {ruleType === 'pattern' && (
        <div className="form-group">
          <label>Pattern (Regex)</label>
          <input
            type="text"
            value={params.pattern || ''}
            onChange={(e) => setParams({ pattern: e.target.value })}
            placeholder="Enter regex pattern"
          />
        </div>
      )}

      <button onClick={handleCreateRule} className="btn-create-rule">
        Create Rule
      </button>
    </div>
  );
};
