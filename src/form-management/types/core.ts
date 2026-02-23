/**
 * Core type definitions for the Form Management System
 * Based on the design document specifications
 */

// Field Type Definitions
export type FieldType = 
  | 'text' 
  | 'number' 
  | 'email' 
  | 'password' 
  | 'select' 
  | 'checkbox' 
  | 'radio' 
  | 'textarea' 
  | 'file' 
  | 'date' 
  | 'time' 
  | 'datetime-local';

// Validation Rule Types
export interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom' | 'async';
  params?: Record<string, any>;
  message: string;
  condition?: (formState: FormState) => boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
}

export interface FormValidationResult {
  isValid: boolean;
  fieldResults: Record<string, ValidationResult>;
  globalErrors: ValidationError[];
}

// Field Descriptor and Configuration
export interface FieldDescriptor {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  validation: ValidationRule[];
  dependencies?: string[];
  styling?: FieldStyling;
}

export interface FieldStyling {
  className?: string;
  style?: Record<string, string>;
  width?: 'full' | 'half' | 'third' | 'quarter';
  order?: number;
}

// Conditional Logic
export interface ConditionalRule {
  id: string;
  condition: (formState: FormState) => boolean;
  actions: ConditionalAction[];
}

export interface ConditionalAction {
  type: 'show' | 'hide' | 'enable' | 'disable' | 'setValue';
  targetFieldId: string;
  value?: any;
}

// Layout Configuration
export interface LayoutConfiguration {
  type: 'single-column' | 'two-column' | 'grid' | 'custom';
  spacing: 'compact' | 'normal' | 'relaxed';
  fieldGroups?: FieldGroup[];
  responsive: ResponsiveConfiguration;
}

export interface FieldGroup {
  id: string;
  title?: string;
  fields: string[];
  layout?: LayoutConfiguration;
}

export interface ResponsiveConfiguration {
  breakpoints: Record<string, number>;
  layouts: Record<string, LayoutConfiguration>;
}

// Validation Configuration
export interface ValidationConfiguration {
  validateOnChange: boolean;
  validateOnBlur: boolean;
  showErrorsOnSubmit: boolean;
  debounceMs: number;
  customRules: Record<string, ValidationFunction>;
}

export interface ValidationExecutionContext {
  getFieldValue(fieldId: string): unknown;
  getFieldDescriptor(fieldId: string): FieldDescriptor | undefined;
  getAllFieldValues(): Record<string, unknown>;
  getFormMetadata(): FormState['metadata'];
  hasField(fieldId: string): boolean;
  isFieldTouched(fieldId: string): boolean;
  isFieldDirty(fieldId: string): boolean;
  getCustomData(key: string): unknown;
  setCustomData(key: string, value: unknown): void;
}
export type ValidationFunction = (value: unknown, formState: FormState, context?: ValidationExecutionContext) => ValidationResult | Promise<ValidationResult>;

// Form Configuration Schema
export interface FormConfiguration {
  id: string;
  version: string;
  title: string;
  description?: string;
  steps?: WizardStep[];
  fields: FieldDescriptor[];
  layout: LayoutConfiguration;
  validation: ValidationConfiguration;
  conditionalLogic?: ConditionalRule[];
  autoSave?: AutoSaveConfiguration;
  analytics?: AnalyticsConfiguration;
  accessibility?: AccessibilityConfiguration;
}

// Auto-Save Configuration
export interface AutoSaveConfiguration {
  enabled: boolean;
  intervalMs: number;
  saveOnBlur: boolean;
  maxDrafts: number;
  compressionEnabled: boolean;
}

// Analytics Configuration
export interface AnalyticsConfiguration {
  enabled: boolean;
  trackFieldInteractions: boolean;
  trackTimeSpent: boolean;
  privacyMode: boolean;
  customEvents: string[];
}

// Accessibility Configuration
export interface AccessibilityConfiguration {
  highContrastMode: boolean;
  screenReaderSupport: boolean;
  keyboardNavigation: boolean;
  customFocusIndicators: boolean;
}

// Form State Management
export interface FormState {
  values: Record<string, any>;
  validation: Record<string, ValidationResult>;
  touched: Record<string, boolean>;
  dirty: Record<string, boolean>;
  isSubmitting: boolean;
  submitCount: number;
  metadata: FormMetadata;
}

export interface FormMetadata {
  formId: string;
  sessionId: string;
  createdAt: Date;
  lastModified: Date;
  version: string;
  userId?: string;
}

// Wizard Step Management
export interface WizardStep {
  index: number;
  id: string;
  title: string;
  fields: string[];
  isComplete: boolean;
  isValid: boolean;
  conditionalNext?: (formState: FormState) => number;
}

export interface WizardProgress {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  canGoNext: boolean;
  canGoPrevious: boolean;
}

// Auto-Save Management
export interface SaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  error?: Error;
  queuedSaves: number;
}

export interface DraftData {
  formId: string;
  userId?: string;
  sessionId: string;
  data: FormState;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  compressed: boolean;
}

// Analytics Data Models
export interface FormAnalytics {
  formId: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  completionStatus: 'completed' | 'abandoned' | 'in-progress';
  fieldInteractions: FieldInteraction[];
  stepMetrics?: StepMetrics[];
  abandonmentPoint?: string;
}

export interface FieldInteraction {
  fieldId: string;
  eventType: 'focus' | 'blur' | 'change' | 'error';
  timestamp: Date;
  value?: any;
  timeSpent?: number;
}

export interface StepMetrics {
  stepId: string;
  startTime: Date;
  endTime?: Date;
  timeSpent?: number;
  validationErrors: number;
  fieldInteractions: number;
}

// Event System
export interface StateChangeEvent {
  type: 'field-change' | 'validation-change' | 'form-submit' | 'step-change';
  fieldId?: string;
  oldValue?: any;
  newValue?: any;
  timestamp: Date;
}

export type StateChangeCallback = (event: StateChangeEvent) => void;

// Subscription Management
export interface Subscription {
  unsubscribe(): void;
}

// Form Element Types
export interface FormElement {
  id: string;
  type: FieldType;
  element: HTMLElement;
  hasField(fieldId: string): boolean;
  getFieldType(fieldId: string): FieldType | undefined;
  updateField(fieldId: string, updates: FieldUpdates): void;
}

export interface FieldUpdates {
  value?: any;
  visible?: boolean;
  enabled?: boolean;
  validation?: ValidationResult;
}

// Callback Types
export type SaveStatusCallback = (status: SaveStatus) => void;