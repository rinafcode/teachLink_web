/**
 * Validation Feedback Display System - Handles error message rendering and visual feedback
 */

import {
  ValidationResult,
  ValidationError,
  ValidationWarning
} from '../types/core.js';

export interface FeedbackDisplayOptions {
  position: 'top' | 'bottom' | 'left' | 'right' | 'inline' | 'tooltip';
  showIcons: boolean;
  showSuccessState: boolean;
  animationDuration: number;
  maxErrors: number;
  groupSimilarErrors: boolean;
  customClassName?: string;
  customStyles?: Record<string, string>;
  ariaLive: 'polite' | 'assertive' | 'off';
}

export interface FeedbackElement {
  id: string;
  fieldId: string;
  type: 'error' | 'warning' | 'success';
  message: string;
  code?: string;
  element: HTMLElement;
  isVisible: boolean;
  timestamp: Date;
}

export interface FeedbackDisplayState {
  fieldId: string;
  hasErrors: boolean;
  hasWarnings: boolean;
  isValid: boolean;
  errorCount: number;
  warningCount: number;
  elements: FeedbackElement[];
}

export type FeedbackDisplayCallback = (state: FeedbackDisplayState) => void;

export class ValidationFeedbackDisplay {
  private feedbackElements: Map<string, FeedbackElement[]> = new Map();
  private displayStates: Map<string, FeedbackDisplayState> = new Map();
  private callbacks: Set<FeedbackDisplayCallback> = new Set();
  private container: HTMLElement;
  
  private defaultOptions: FeedbackDisplayOptions = {
    position: 'bottom',
    showIcons: true,
    showSuccessState: true,
    animationDuration: 300,
    maxErrors: 5,
    groupSimilarErrors: true,
    ariaLive: 'polite'
  };

  constructor(container?: HTMLElement) {
    this.container = container || document.body;
    this.initializeStyles();
  }

  /**
   * Subscribe to feedback display state changes
   */
  subscribe(callback: FeedbackDisplayCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Display validation feedback for a field
   */
  displayFeedback(
    fieldId: string,
    validationResult: ValidationResult,
    options?: Partial<FeedbackDisplayOptions>
  ): void {
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    // Clear existing feedback
    this.clearFieldFeedback(fieldId);

    // Create feedback elements
    const elements: FeedbackElement[] = [];

    // Process errors
    if (validationResult.errors && validationResult.errors.length > 0) {
      const processedErrors = this.processErrors(validationResult.errors, mergedOptions);
      processedErrors.forEach(error => {
        const element = this.createFeedbackElement(fieldId, 'error', error, mergedOptions);
        elements.push(element);
      });
    }

    // Process warnings
    if (validationResult.warnings && validationResult.warnings.length > 0) {
      validationResult.warnings.forEach(warning => {
        const element = this.createFeedbackElement(fieldId, 'warning', warning, mergedOptions);
        elements.push(element);
      });
    }

    // Show success state if valid and configured
    if (validationResult.isValid && mergedOptions.showSuccessState) {
      const successElement = this.createSuccessElement(fieldId, mergedOptions);
      elements.push(successElement);
    }

    // Store elements
    this.feedbackElements.set(fieldId, elements);

    // Update display state
    this.updateDisplayState(fieldId, validationResult, elements);

    // Animate elements into view
    this.animateElementsIn(elements, mergedOptions);
  }

  /**
   * Clear feedback for a specific field
   */
  clearFieldFeedback(fieldId: string): void {
    const elements = this.feedbackElements.get(fieldId) || [];
    
    elements.forEach(element => {
      this.animateElementOut(element, this.defaultOptions).then(() => {
        if (element.element.parentNode) {
          element.element.parentNode.removeChild(element.element);
        }
      });
    });

    this.feedbackElements.delete(fieldId);
    this.displayStates.delete(fieldId);
  }

  /**
   * Clear all feedback
   */
  clearAllFeedback(): void {
    const fieldIds = Array.from(this.feedbackElements.keys());
    fieldIds.forEach(fieldId => this.clearFieldFeedback(fieldId));
  }

  /**
   * Get display state for a field
   */
  getDisplayState(fieldId: string): FeedbackDisplayState | undefined {
    return this.displayStates.get(fieldId);
  }

  /**
   * Get all display states
   */
  getAllDisplayStates(): Map<string, FeedbackDisplayState> {
    return new Map(this.displayStates);
  }

  /**
   * Update feedback positioning
   */
  updatePosition(fieldId: string, position: FeedbackDisplayOptions['position']): void {
    const elements = this.feedbackElements.get(fieldId) || [];
    elements.forEach(element => {
      this.applyPositioning(element.element, position);
    });
  }

  /**
   * Process errors with grouping and limiting
   */
  private processErrors(
    errors: ValidationError[],
    options: FeedbackDisplayOptions
  ): ValidationError[] {
    let processedErrors = [...errors];

    // Group similar errors if enabled
    if (options.groupSimilarErrors) {
      processedErrors = this.groupSimilarErrors(processedErrors);
    }

    // Limit number of errors
    if (processedErrors.length > options.maxErrors) {
      processedErrors = processedErrors.slice(0, options.maxErrors);
      processedErrors.push({
        code: 'more_errors',
        message: `... and ${errors.length - options.maxErrors} more error(s)`
      });
    }

    return processedErrors;
  }

  /**
   * Group similar validation errors
   */
  private groupSimilarErrors(errors: ValidationError[]): ValidationError[] {
    const grouped = new Map<string, ValidationError[]>();

    errors.forEach(error => {
      const key = error.code || 'unknown';
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(error);
    });

    const result: ValidationError[] = [];
    grouped.forEach((groupedErrors, code) => {
      if (groupedErrors.length === 1) {
        result.push(groupedErrors[0]);
      } else {
        result.push({
          code,
          message: `${groupedErrors[0].message} (${groupedErrors.length} occurrences)`
        });
      }
    });

    return result;
  }

  /**
   * Create feedback element for error or warning
   */
  private createFeedbackElement(
    fieldId: string,
    type: 'error' | 'warning',
    item: ValidationError | ValidationWarning,
    options: FeedbackDisplayOptions
  ): FeedbackElement {
    const element = document.createElement('div');
    const id = `feedback-${fieldId}-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    element.id = id;
    element.className = this.getFeedbackClassName(type, options);
    element.setAttribute('role', 'alert');
    element.setAttribute('aria-live', options.ariaLive);
    
    // Create content
    const content = this.createFeedbackContent(type, item.message, options);
    element.appendChild(content);

    // Apply custom styles
    if (options.customStyles) {
      Object.assign(element.style, options.customStyles);
    }

    // Position element
    this.applyPositioning(element, options.position);

    // Add to container
    this.container.appendChild(element);

    return {
      id,
      fieldId,
      type,
      message: item.message,
      code: item.code,
      element,
      isVisible: false,
      timestamp: new Date()
    };
  }

  /**
   * Create success feedback element
   */
  private createSuccessElement(
    fieldId: string,
    options: FeedbackDisplayOptions
  ): FeedbackElement {
    const element = document.createElement('div');
    const id = `feedback-${fieldId}-success-${Date.now()}`;
    
    element.id = id;
    element.className = this.getFeedbackClassName('success', options);
    element.setAttribute('role', 'status');
    element.setAttribute('aria-live', 'polite');
    
    const content = this.createFeedbackContent('success', 'Valid', options);
    element.appendChild(content);

    if (options.customStyles) {
      Object.assign(element.style, options.customStyles);
    }

    this.applyPositioning(element, options.position);
    this.container.appendChild(element);

    return {
      id,
      fieldId,
      type: 'success',
      message: 'Valid',
      element,
      isVisible: false,
      timestamp: new Date()
    };
  }

  /**
   * Create feedback content with optional icon
   */
  private createFeedbackContent(
    type: 'error' | 'warning' | 'success',
    message: string,
    options: FeedbackDisplayOptions
  ): HTMLElement {
    const content = document.createElement('div');
    content.className = 'feedback-content';

    if (options.showIcons) {
      const icon = this.createIcon(type);
      content.appendChild(icon);
    }

    const text = document.createElement('span');
    text.className = 'feedback-text';
    text.textContent = message;
    content.appendChild(text);

    return content;
  }

  /**
   * Create icon element for feedback type
   */
  private createIcon(type: 'error' | 'warning' | 'success'): HTMLElement {
    const icon = document.createElement('span');
    icon.className = `feedback-icon feedback-icon-${type}`;
    icon.setAttribute('aria-hidden', 'true');
    
    // Use Unicode symbols as fallback
    const symbols = {
      error: '✕',
      warning: '⚠',
      success: '✓'
    };
    
    icon.textContent = symbols[type];
    return icon;
  }

  /**
   * Get CSS class name for feedback element
   */
  private getFeedbackClassName(
    type: 'error' | 'warning' | 'success',
    options: FeedbackDisplayOptions
  ): string {
    const baseClass = 'validation-feedback';
    const typeClass = `validation-feedback-${type}`;
    const positionClass = `validation-feedback-${options.position}`;
    
    const classes = [baseClass, typeClass, positionClass];
    
    if (options.customClassName) {
      classes.push(options.customClassName);
    }
    
    return classes.join(' ');
  }

  /**
   * Apply positioning styles to feedback element
   */
  private applyPositioning(element: HTMLElement, position: FeedbackDisplayOptions['position']): void {
    // Reset positioning classes
    element.classList.remove(
      'validation-feedback-top',
      'validation-feedback-bottom',
      'validation-feedback-left',
      'validation-feedback-right',
      'validation-feedback-inline',
      'validation-feedback-tooltip'
    );
    
    element.classList.add(`validation-feedback-${position}`);
    
    // Apply specific positioning styles
    switch (position) {
      case 'tooltip':
        element.style.position = 'absolute';
        element.style.zIndex = '1000';
        break;
      case 'inline':
        element.style.display = 'inline-block';
        break;
      default:
        element.style.position = 'relative';
    }
  }

  /**
   * Update display state for a field
   */
  private updateDisplayState(
    fieldId: string,
    validationResult: ValidationResult,
    elements: FeedbackElement[]
  ): void {
    const state: FeedbackDisplayState = {
      fieldId,
      hasErrors: !validationResult.isValid,
      hasWarnings: (validationResult.warnings?.length || 0) > 0,
      isValid: validationResult.isValid,
      errorCount: validationResult.errors.length,
      warningCount: validationResult.warnings?.length || 0,
      elements
    };

    this.displayStates.set(fieldId, state);
    this.notifyCallbacks(state);
  }

  /**
   * Animate elements into view
   */
  private async animateElementsIn(
    elements: FeedbackElement[],
    options: FeedbackDisplayOptions
  ): Promise<void> {
    const promises = elements.map(element => this.animateElementIn(element, options));
    await Promise.all(promises);
  }

  /**
   * Animate single element in
   */
  private animateElementIn(
    feedbackElement: FeedbackElement,
    options: FeedbackDisplayOptions
  ): Promise<void> {
    return new Promise(resolve => {
      const element = feedbackElement.element;
      
      // Set initial state
      element.style.opacity = '0';
      element.style.transform = 'translateY(-10px)';
      element.style.transition = `all ${options.animationDuration}ms ease-out`;
      
      // Trigger animation
      requestAnimationFrame(() => {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
        feedbackElement.isVisible = true;
        
        setTimeout(() => resolve(), options.animationDuration);
      });
    });
  }

  /**
   * Animate element out
   */
  private animateElementOut(
    feedbackElement: FeedbackElement,
    options: FeedbackDisplayOptions
  ): Promise<void> {
    return new Promise(resolve => {
      const element = feedbackElement.element;
      
      element.style.transition = `all ${options.animationDuration}ms ease-in`;
      element.style.opacity = '0';
      element.style.transform = 'translateY(-10px)';
      
      feedbackElement.isVisible = false;
      
      setTimeout(() => resolve(), options.animationDuration);
    });
  }

  /**
   * Notify callbacks of state changes
   */
  private notifyCallbacks(state: FeedbackDisplayState): void {
    this.callbacks.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in feedback display callback:', error);
      }
    });
  }

  /**
   * Initialize default styles
   */
  private initializeStyles(): void {
    if (document.getElementById('validation-feedback-styles')) {
      return; // Styles already initialized
    }

    const styles = document.createElement('style');
    styles.id = 'validation-feedback-styles';
    styles.textContent = `
      .validation-feedback {
        font-size: 0.875rem;
        line-height: 1.25;
        margin: 0.25rem 0;
        padding: 0.5rem;
        border-radius: 0.25rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .validation-feedback-error {
        color: #dc2626;
        background-color: #fef2f2;
        border: 1px solid #fecaca;
      }
      
      .validation-feedback-warning {
        color: #d97706;
        background-color: #fffbeb;
        border: 1px solid #fed7aa;
      }
      
      .validation-feedback-success {
        color: #059669;
        background-color: #ecfdf5;
        border: 1px solid #a7f3d0;
      }
      
      .validation-feedback-tooltip {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        border-radius: 0.375rem;
      }
      
      .feedback-icon {
        flex-shrink: 0;
        width: 1rem;
        height: 1rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      
      .feedback-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .feedback-text {
        flex: 1;
      }
      
      @media (prefers-reduced-motion: reduce) {
        .validation-feedback {
          transition: none !important;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }

  /**
   * Get feedback statistics
   */
  getStatistics(): {
    totalFields: number;
    fieldsWithErrors: number;
    fieldsWithWarnings: number;
    validFields: number;
    totalElements: number;
  } {
    const states = Array.from(this.displayStates.values());
    
    return {
      totalFields: states.length,
      fieldsWithErrors: states.filter(s => s.hasErrors).length,
      fieldsWithWarnings: states.filter(s => s.hasWarnings).length,
      validFields: states.filter(s => s.isValid).length,
      totalElements: states.reduce((sum, s) => sum + s.elements.length, 0)
    };
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.clearAllFeedback();
    this.callbacks.clear();
    
    // Remove styles if no other instances exist
    const styleElement = document.getElementById('validation-feedback-styles');
    if (styleElement) {
      styleElement.remove();
    }
  }
}