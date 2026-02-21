/**
 * Form State Manager Implementation
 * Provides centralized state management for form data, validation, and metadata
 */

import {
  FormState,
  FormStateManager as IFormStateManager,
  StateChangeCallback,
  StateChangeEvent,
  Subscription,
  ValidationResult,
  FormMetadata,
  FieldDescriptor,
  ConditionalRule
} from '../types/core';
import { DependencyManager, CascadeUpdateResult } from './dependency-manager';

export class FormStateManager implements IFormStateManager {
  private state: FormState;
  private subscribers: Map<string, StateChangeCallback> = new Map();
  private subscriptionCounter = 0;
  private dependencyManager: DependencyManager = new DependencyManager();
  private fieldVisibility: Record<string, boolean> = {};

  constructor(formId: string, userId?: string) {
    this.state = this.createInitialState(formId, userId);
  }

  /**
   * Get the current form state
   */
  getState(): FormState {
    return { ...this.state };
  }

  /**
   * Update a field value and trigger change detection
   */
  updateField(fieldId: string, value: any): void {
    const oldValue = this.state.values[fieldId];
    
    // Update the field value
    this.state.values[fieldId] = value;
    
    // Mark field as touched and dirty if value changed
    this.state.touched[fieldId] = true;
    if (oldValue !== value) {
      this.state.dirty[fieldId] = true;
      this.state.metadata.lastModified = new Date();
    }

    // Process cascading updates
    this.processCascadingUpdates(fieldId, value);

    // Emit change event
    this.emitStateChange({
      type: 'field-change',
      fieldId,
      oldValue,
      newValue: value,
      timestamp: new Date()
    });
  }

  /**
   * Set validation state for a field
   */
  setValidationState(fieldId: string, result: ValidationResult): void {
    const oldResult = this.state.validation[fieldId];
    this.state.validation[fieldId] = result;

    // Emit validation change event
    this.emitStateChange({
      type: 'validation-change',
      fieldId,
      oldValue: oldResult,
      newValue: result,
      timestamp: new Date()
    });
  }

  /**
   * Reset form to initial state
   */
  resetForm(): void {
    const formId = this.state.metadata.formId;
    const userId = this.state.metadata.userId;
    
    this.state = this.createInitialState(formId, userId);

    // Emit form reset event
    this.emitStateChange({
      type: 'form-submit', // Using form-submit as closest match for reset
      timestamp: new Date()
    });
  }

  /**
   * Subscribe to state changes
   */
  subscribeToChanges(callback: StateChangeCallback): Subscription {
    const subscriptionId = `sub_${this.subscriptionCounter++}`;
    this.subscribers.set(subscriptionId, callback);

    return {
      unsubscribe: () => {
        this.subscribers.delete(subscriptionId);
      }
    };
  }

  /**
   * Get value of a specific field
   */
  getFieldValue(fieldId: string): any {
    return this.state.values[fieldId];
  }

  /**
   * Check if the entire form is valid
   */
  isFormValid(): boolean {
    return Object.values(this.state.validation).every(result => result.isValid);
  }

  /**
   * Create initial state for a new form
   */
  private createInitialState(formId: string, userId?: string): FormState {
    const now = new Date();
    
    return {
      values: {},
      validation: {},
      touched: {},
      dirty: {},
      isSubmitting: false,
      submitCount: 0,
      metadata: {
        formId,
        sessionId: this.generateSessionId(),
        createdAt: now,
        lastModified: now,
        version: '1.0.0',
        userId
      }
    };
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Emit state change event to all subscribers
   */
  private emitStateChange(event: StateChangeEvent): void {
    this.subscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    });
  }

  /**
   * Set form submission state
   */
  setSubmitting(isSubmitting: boolean): void {
    this.state.isSubmitting = isSubmitting;
    if (isSubmitting) {
      this.state.submitCount++;
    }

    this.emitStateChange({
      type: 'form-submit',
      timestamp: new Date()
    });
  }

  /**
   * Mark field as touched
   */
  markFieldTouched(fieldId: string): void {
    if (!this.state.touched[fieldId]) {
      this.state.touched[fieldId] = true;
      this.state.metadata.lastModified = new Date();
    }
  }

  /**
   * Check if field is dirty (has been modified)
   */
  isFieldDirty(fieldId: string): boolean {
    return this.state.dirty[fieldId] || false;
  }

  /**
   * Check if field is touched
   */
  isFieldTouched(fieldId: string): boolean {
    return this.state.touched[fieldId] || false;
  }

  /**
   * Get validation result for a field
   */
  getFieldValidation(fieldId: string): ValidationResult | undefined {
    return this.state.validation[fieldId];
  }

  /**
   * Check if a specific field is valid
   */
  isFieldValid(fieldId: string): boolean {
    const validation = this.state.validation[fieldId];
    return validation ? validation.isValid : true;
  }

  /**
   * Get all field values
   */
  getAllValues(): Record<string, any> {
    return { ...this.state.values };
  }

  /**
   * Set multiple field values at once
   */
  setValues(values: Record<string, any>): void {
    Object.entries(values).forEach(([fieldId, value]) => {
      this.updateField(fieldId, value);
    });
  }

  /**
   * Clear validation for a field
   */
  clearFieldValidation(fieldId: string): void {
    delete this.state.validation[fieldId];
    
    this.emitStateChange({
      type: 'validation-change',
      fieldId,
      oldValue: undefined,
      newValue: undefined,
      timestamp: new Date()
    });
  }

  /**
   * Get form metadata
   */
  getMetadata(): FormMetadata {
    return { ...this.state.metadata };
  }

  /**
   * Programmatically set field value without triggering change events
   */
  setFieldValueSilently(fieldId: string, value: any): void {
    this.state.values[fieldId] = value;
    this.state.metadata.lastModified = new Date();
  }

  /**
   * Programmatically set validation state for multiple fields
   */
  setValidationStates(validationStates: Record<string, ValidationResult>): void {
    Object.entries(validationStates).forEach(([fieldId, result]) => {
      this.state.validation[fieldId] = result;
    });

    // Emit a single validation change event for batch update
    this.emitStateChange({
      type: 'validation-change',
      timestamp: new Date()
    });
  }

  /**
   * Programmatically set multiple field values without individual change events
   */
  setFieldValuesBatch(values: Record<string, any>): void {
    const oldValues = { ...this.state.values };
    
    Object.entries(values).forEach(([fieldId, value]) => {
      this.state.values[fieldId] = value;
      this.state.touched[fieldId] = true;
      if (oldValues[fieldId] !== value) {
        this.state.dirty[fieldId] = true;
      }
    });

    this.state.metadata.lastModified = new Date();

    // Emit a single batch change event
    this.emitStateChange({
      type: 'field-change',
      oldValue: oldValues,
      newValue: { ...this.state.values },
      timestamp: new Date()
    });
  }

  /**
   * Reset specific fields to their initial state
   */
  resetFields(fieldIds: string[]): void {
    fieldIds.forEach(fieldId => {
      delete this.state.values[fieldId];
      delete this.state.validation[fieldId];
      delete this.state.touched[fieldId];
      delete this.state.dirty[fieldId];
    });

    this.state.metadata.lastModified = new Date();

    this.emitStateChange({
      type: 'field-change',
      timestamp: new Date()
    });
  }

  /**
   * Set form-level metadata
   */
  setMetadata(metadata: Partial<FormMetadata>): void {
    this.state.metadata = {
      ...this.state.metadata,
      ...metadata,
      lastModified: new Date()
    };
  }

  /**
   * Get form validation summary
   */
  getValidationSummary(): {
    isValid: boolean;
    errorCount: number;
    warningCount: number;
    fieldErrors: Record<string, string[]>;
    fieldWarnings: Record<string, string[]>;
  } {
    const fieldErrors: Record<string, string[]> = {};
    const fieldWarnings: Record<string, string[]> = {};
    let errorCount = 0;
    let warningCount = 0;

    Object.entries(this.state.validation).forEach(([fieldId, result]) => {
      if (result.errors.length > 0) {
        fieldErrors[fieldId] = result.errors.map(e => e.message);
        errorCount += result.errors.length;
      }
      if (result.warnings && result.warnings.length > 0) {
        fieldWarnings[fieldId] = result.warnings.map(w => w.message);
        warningCount += result.warnings.length;
      }
    });

    return {
      isValid: this.isFormValid(),
      errorCount,
      warningCount,
      fieldErrors,
      fieldWarnings
    };
  }

  /**
   * Check if form has any changes (is dirty)
   */
  isFormDirty(): boolean {
    return Object.values(this.state.dirty).some(isDirty => isDirty);
  }

  /**
   * Get list of dirty field IDs
   */
  getDirtyFields(): string[] {
    return Object.entries(this.state.dirty)
      .filter(([_, isDirty]) => isDirty)
      .map(([fieldId]) => fieldId);
  }

  /**
   * Get list of touched field IDs
   */
  getTouchedFields(): string[] {
    return Object.entries(this.state.touched)
      .filter(([_, isTouched]) => isTouched)
      .map(([fieldId]) => fieldId);
  }

  /**
   * Programmatically mark form as submitting with optional callback
   */
  startSubmission(onSubmissionStart?: () => void): void {
    this.setSubmitting(true);
    if (onSubmissionStart) {
      onSubmissionStart();
    }
  }

  /**
   * Programmatically complete form submission
   */
  completeSubmission(success: boolean, onSubmissionComplete?: (success: boolean) => void): void {
    this.setSubmitting(false);
    
    if (success) {
      // Clear dirty state on successful submission
      this.state.dirty = {};
    }

    if (onSubmissionComplete) {
      onSubmissionComplete(success);
    }
  }

  /**
   * Create a snapshot of current form state
   */
  createSnapshot(): FormState {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Restore form state from a snapshot
   */
  restoreFromSnapshot(snapshot: FormState): void {
    const oldState = this.createSnapshot();
    this.state = { ...snapshot };

    this.emitStateChange({
      type: 'form-submit', // Using form-submit as closest match for state restoration
      oldValue: oldState,
      newValue: this.state,
      timestamp: new Date()
    });
  }

  /**
   * Validate specific fields programmatically
   */
  validateFields(fieldIds: string[], validationResults: Record<string, ValidationResult>): void {
    fieldIds.forEach(fieldId => {
      if (validationResults[fieldId]) {
        this.setValidationState(fieldId, validationResults[fieldId]);
      }
    });
  }

  /**
   * Clear all validation states
   */
  clearAllValidation(): void {
    this.state.validation = {};
    
    this.emitStateChange({
      type: 'validation-change',
      timestamp: new Date()
    });
  }

  /**
   * Set field as pristine (not dirty)
   */
  markFieldPristine(fieldId: string): void {
    this.state.dirty[fieldId] = false;
    this.state.metadata.lastModified = new Date();
  }

  /**
   * Set multiple fields as pristine
   */
  markFieldsPristine(fieldIds: string[]): void {
    fieldIds.forEach(fieldId => {
      this.state.dirty[fieldId] = false;
    });
    this.state.metadata.lastModified = new Date();
  }

  /**
   * Get field state summary
   */
  getFieldState(fieldId: string): {
    value: any;
    isValid: boolean;
    isTouched: boolean;
    isDirty: boolean;
    validation?: ValidationResult;
  } {
    return {
      value: this.getFieldValue(fieldId),
      isValid: this.isFieldValid(fieldId),
      isTouched: this.isFieldTouched(fieldId),
      isDirty: this.isFieldDirty(fieldId),
      validation: this.getFieldValidation(fieldId)
    };
  }

  // Cascading State Update Methods

  /**
   * Initialize field dependencies and conditional logic
   */
  initializeDependencies(fields: FieldDescriptor[], conditionalRules: ConditionalRule[] = []): void {
    this.dependencyManager.initialize(fields, conditionalRules);
    
    // Initialize field visibility (all visible by default)
    fields.forEach(field => {
      this.fieldVisibility[field.id] = true;
    });

    // Validate dependencies
    const validation = this.dependencyManager.validateDependencies(fields);
    if (!validation.isValid) {
      console.warn('Dependency validation errors:', validation.errors);
    }
  }

  /**
   * Process cascading updates when a field value changes
   */
  private processCascadingUpdates(changedFieldId: string, newValue: any): void {
    const cascadeResult = this.dependencyManager.calculateCascadingUpdates(
      changedFieldId,
      newValue,
      this.state
    );

    this.applyCascadeResult(cascadeResult);
  }

  /**
   * Apply the results of cascading updates
   */
  private applyCascadeResult(cascadeResult: CascadeUpdateResult): void {
    // Apply visibility changes
    Object.entries(cascadeResult.visibilityChanges).forEach(([fieldId, visible]) => {
      this.setFieldVisibility(fieldId, visible);
    });

    // Apply value changes
    Object.entries(cascadeResult.valueChanges).forEach(([fieldId, value]) => {
      // Use silent update to avoid infinite cascade loops
      this.setFieldValueSilently(fieldId, value);
      this.state.touched[fieldId] = true;
      this.state.dirty[fieldId] = true;
    });

    // Apply validation changes
    Object.entries(cascadeResult.validationChanges).forEach(([fieldId, validation]) => {
      this.setValidationState(fieldId, validation);
    });

    // Emit cascade update event if there were changes
    if (Object.keys(cascadeResult.visibilityChanges).length > 0 ||
        Object.keys(cascadeResult.valueChanges).length > 0 ||
        Object.keys(cascadeResult.validationChanges).length > 0) {
      
      this.emitStateChange({
        type: 'field-change', // Using field-change as closest match for cascade updates
        timestamp: new Date()
      });
    }
  }

  /**
   * Set field visibility
   */
  setFieldVisibility(fieldId: string, visible: boolean): void {
    const oldVisibility = this.fieldVisibility[fieldId];
    this.fieldVisibility[fieldId] = visible;

    // If field becomes hidden, optionally clear its value
    if (!visible && oldVisibility !== false) {
      // Clear validation errors for hidden fields
      delete this.state.validation[fieldId];
    }
  }

  /**
   * Get field visibility
   */
  isFieldVisible(fieldId: string): boolean {
    return this.fieldVisibility[fieldId] !== false;
  }

  /**
   * Get all field visibility states
   */
  getFieldVisibility(): Record<string, boolean> {
    return { ...this.fieldVisibility };
  }

  /**
   * Manually trigger cascading updates for a field
   */
  triggerCascadingUpdates(fieldId: string): void {
    const currentValue = this.state.values[fieldId];
    this.processCascadingUpdates(fieldId, currentValue);
  }

  /**
   * Get fields that depend on the given field
   */
  getDependentFields(fieldId: string): string[] {
    return this.dependencyManager.getDependentFields(fieldId);
  }

  /**
   * Get fields that the given field depends on
   */
  getFieldDependencies(fieldId: string): string[] {
    const deps = this.dependencyManager.getFieldDependencies(fieldId);
    return deps ? deps.dependsOn : [];
  }

  /**
   * Check if a field has dependencies
   */
  hasFieldDependencies(fieldId: string): boolean {
    return this.dependencyManager.hasDependencies(fieldId);
  }

  /**
   * Check if a field has dependents
   */
  hasFieldDependents(fieldId: string): boolean {
    return this.dependencyManager.hasDependents(fieldId);
  }

  /**
   * Get topological sort of fields based on dependencies
   */
  getFieldProcessingOrder(): string[] {
    return this.dependencyManager.getTopologicalSort();
  }

  /**
   * Evaluate conditional logic for all fields
   */
  evaluateAllConditionalLogic(): void {
    // Get all fields in dependency order
    const fieldOrder = this.getFieldProcessingOrder();
    
    // Process each field to trigger any conditional logic
    fieldOrder.forEach(fieldId => {
      if (this.state.values[fieldId] !== undefined) {
        this.triggerCascadingUpdates(fieldId);
      }
    });
  }

  /**
   * Reset cascading state (visibility, dependencies)
   */
  resetCascadingState(): void {
    // Reset all fields to visible
    Object.keys(this.fieldVisibility).forEach(fieldId => {
      this.fieldVisibility[fieldId] = true;
    });

    // Re-evaluate all conditional logic
    this.evaluateAllConditionalLogic();
  }

  /**
   * Get cascade update preview without applying changes
   */
  previewCascadingUpdates(fieldId: string, value: any): CascadeUpdateResult {
    return this.dependencyManager.calculateCascadingUpdates(fieldId, value, this.state);
  }
}