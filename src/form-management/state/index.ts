/**
 * Form State Management Module
 * 
 * Exports the Form State Manager and related components for centralized
 * form state management with dependency tracking and cascading updates.
 */

export { FormStateManager } from './form-state-manager';
export { DependencyManager } from './dependency-manager';
export type { 
  DependencyGraph, 
  FieldVisibilityState, 
  CascadeUpdateResult 
} from './dependency-manager';