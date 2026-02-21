/**
 * Validation Engine Module - Complete validation system exports
 */

// Core validation engine
export { ValidationEngineImpl, type ValidationEngine } from './validation-engine.js';

// Async validation management
export { 
  AsyncValidationManager,
  type AsyncValidationState,
  type AsyncValidationOptions,
  type AsyncValidationRequest,
  type AsyncValidationResponse,
  type AsyncValidationCallback
} from './async-validation-manager.js';

// Custom validation registry
export {
  CustomValidationRegistry,
  ValidationRuleBuilders,
  type ValidationContext,
  type CustomValidationRule,
  type ValidationExecutionContext,
  type EnhancedValidationFunction
} from './custom-validation-registry.js';

// Validation feedback display
export {
  ValidationFeedbackDisplay,
  type FeedbackDisplayOptions,
  type FeedbackElement,
  type FeedbackDisplayState,
  type FeedbackDisplayCallback
} from './validation-feedback-display.js';

// Re-export core validation types
export type {
  ValidationRule,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  FormValidationResult,
  ValidationFunction
} from '../types/core.js';