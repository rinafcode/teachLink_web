/**
 * Interface definitions for Form Management System components
 * Based on the design document component specifications
 */

import {
  FormConfiguration,
  FormElement,
  FieldUpdates,
  ConditionalRule,
  ValidationResult,
  FormValidationResult,
  ValidationFunction,
  FormState,
  StateChangeCallback,
  Subscription,
  SaveStatus,
  SaveStatusCallback,
  DraftData,
  WizardStep,
  WizardProgress
} from './core';

// Form Builder Interface
export interface FormBuilder {
  render(config: FormConfiguration): FormElement;
  updateField(fieldId: string, updates: FieldUpdates): void;
  applyConditionalLogic(conditions: ConditionalRule[]): void;
  setFieldVisibility(fieldId: string, visible: boolean): void;
}

// Validation Engine Interface
export interface ValidationEngine {
  validateField(fieldId: string, value: any, context: FormState): ValidationResult;
  validateForm(formState: FormState): Promise<FormValidationResult>;
  addCustomRule(name: string, rule: ValidationFunction): void;
  executeAsyncValidation(fieldId: string, value: any): Promise<ValidationResult>;
}

// Form State Manager Interface
export interface FormStateManager {
  getState(): FormState;
  updateField(fieldId: string, value: any): void;
  setValidationState(fieldId: string, result: ValidationResult): void;
  resetForm(): void;
  subscribeToChanges(callback: StateChangeCallback): Subscription;
  getFieldValue(fieldId: string): any;
  isFormValid(): boolean;
}

// Auto Save Manager Interface
export interface AutoSaveManager {
  enableAutoSave(formId: string, interval: number): void;
  saveNow(formId: string, data: FormState): Promise<void>;
  loadDraft(formId: string): Promise<FormState | null>;
  clearDraft(formId: string): Promise<void>;
  setStorageQuota(maxSize: number): void;
  onSaveStatusChange(callback: SaveStatusCallback): Subscription;
}

// Form Wizard Interface
export interface FormWizard {
  goToStep(stepIndex: number): Promise<boolean>;
  nextStep(): Promise<boolean>;
  previousStep(): void;
  getCurrentStep(): WizardStep;
  getProgress(): WizardProgress;
  canNavigateToStep(stepIndex: number): boolean;
  setStepValidation(stepIndex: number, isValid: boolean): void;
}

// Configuration Parser Interface
export interface ConfigurationParser {
  parse(json: string): FormConfiguration;
  validate(config: FormConfiguration): ValidationResult;
  formatToJson(config: FormConfiguration): string;
  formatToCompactJson(config: FormConfiguration): string;
  formatToJsonWithOptions(config: FormConfiguration, options?: {
    indent?: number | string;
    sortKeys?: boolean;
    includeMetadata?: boolean;
  }): string;
}

// Analytics Tracker Interface
export interface AnalyticsTracker {
  trackFormStart(formId: string): void;
  trackFieldInteraction(fieldId: string, eventType: string, value?: any): void;
  trackFormSubmission(formId: string, success: boolean): void;
  trackFormAbandonment(formId: string, abandonmentPoint: string): void;
  getAnalytics(formId: string): Promise<any>;
  enablePrivacyMode(enabled: boolean): void;
}

// Storage Interface
export interface StorageProvider {
  save(key: string, data: any): Promise<void>;
  load(key: string): Promise<any>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  getSize(): Promise<number>;
  getQuota(): Promise<number>;
}

// Event Emitter Interface
export interface EventEmitter<T = any> {
  on(event: string, callback: (data: T) => void): Subscription;
  emit(event: string, data: T): void;
  off(event: string, callback: (data: T) => void): void;
}

// Form Management System Main Interface
export interface FormManagementSystem {
  createForm(config: FormConfiguration): FormBuilder;
  getStateManager(formId: string): FormStateManager;
  getValidationEngine(): ValidationEngine;
  getAutoSaveManager(): AutoSaveManager;
  getWizard(formId: string): FormWizard;
  getAnalytics(): AnalyticsTracker;
  destroy(formId: string): void;
}