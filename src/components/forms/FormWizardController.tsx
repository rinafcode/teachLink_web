/**
 * Form Wizard Controller Component
 * Manages multi-step form navigation with progress tracking
 */

'use client';

import React, { useState, useEffect } from 'react';
import { WizardStep, WizardProgress, FormState } from '@/form-management/types/core';
import { FormStateManager } from '@/form-management/state/form-state-manager';
import { ValidationEngineImpl } from '@/form-management/validation/validation-engine';

interface FormWizardControllerProps {
  steps: WizardStep[];
  formState: FormState;
  stateManager: FormStateManager;
  onStepChange?: (step: WizardStep) => void;
  onComplete?: (values: Record<string, any>) => void | Promise<void>;
  allowNonLinearNavigation?: boolean;
  validateBeforeNext?: boolean;
  className?: string;
  children: (currentStep: WizardStep, progress: WizardProgress) => React.ReactNode;
}

export const FormWizardController: React.FC<FormWizardControllerProps> = ({
  steps,
  formState,
  stateManager,
  onStepChange,
  onComplete,
  allowNonLinearNavigation = false,
  validateBeforeNext = true,
  className = '',
  children
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [validationEngine] = useState(() => new ValidationEngineImpl());
  const [isValidating, setIsValidating] = useState(false);

  const currentStep = steps[currentStepIndex];

  const progress: WizardProgress = {
    currentStep: currentStepIndex,
    totalSteps: steps.length,
    completedSteps,
    canGoNext: currentStepIndex < steps.length - 1,
    canGoPrevious: currentStepIndex > 0
  };

  useEffect(() => {
    if (onStepChange && currentStep) {
      onStepChange(currentStep);
    }
  }, [currentStepIndex, currentStep, onStepChange]);

  const validateCurrentStep = async (): Promise<boolean> => {
    if (!validateBeforeNext) return true;

    setIsValidating(true);

    try {
      // Validate all fields in current step
      const stepFields = currentStep.fields;
      let allValid = true;

      for (const fieldId of stepFields) {
        const value = formState.values[fieldId];
        const result = await validationEngine.validateField(fieldId, value, formState);
        stateManager.setValidationState(fieldId, result);

        if (!result.isValid) {
          allValid = false;
        }
      }

      return allValid;
    } finally {
      setIsValidating(false);
    }
  };

  const handleNext = async () => {
    if (!progress.canGoNext) return;

    const isValid = await validateCurrentStep();

    if (!isValid) {
      console.warn('Current step validation failed');
      return;
    }

    // Mark current step as completed
    if (!completedSteps.includes(currentStepIndex)) {
      setCompletedSteps([...completedSteps, currentStepIndex]);
    }

    // Check for conditional routing
    if (currentStep.conditionalNext) {
      const nextStepIndex = currentStep.conditionalNext(formState);
      setCurrentStepIndex(nextStepIndex);
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (!progress.canGoPrevious) return;
    setCurrentStepIndex(currentStepIndex - 1);
  };

  const handleGoToStep = async (stepIndex: number) => {
    if (!allowNonLinearNavigation) {
      // Only allow navigation to completed steps
      if (!completedSteps.includes(stepIndex) && stepIndex !== currentStepIndex) {
        console.warn('Cannot navigate to incomplete step');
        return;
      }
    }

    if (stepIndex < 0 || stepIndex >= steps.length) {
      console.warn('Invalid step index');
      return;
    }

    setCurrentStepIndex(stepIndex);
  };

  const handleComplete = async () => {
    const isValid = await validateCurrentStep();

    if (!isValid) {
      console.warn('Final step validation failed');
      return;
    }

    if (onComplete) {
      await onComplete(formState.values);
    }
  };

  const isStepAccessible = (stepIndex: number): boolean => {
    if (allowNonLinearNavigation) return true;
    return completedSteps.includes(stepIndex) || stepIndex === currentStepIndex;
  };

  return (
    <div className={`form-wizard ${className}`}>
      <WizardProgressBar
        steps={steps}
        currentStep={currentStepIndex}
        completedSteps={completedSteps}
        onStepClick={handleGoToStep}
        isStepAccessible={isStepAccessible}
      />

      <div className="wizard-content">
        {children(currentStep, progress)}
      </div>

      <WizardNavigation
        progress={progress}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onComplete={handleComplete}
        isValidating={isValidating}
        isLastStep={currentStepIndex === steps.length - 1}
      />
    </div>
  );
};

interface WizardProgressBarProps {
  steps: WizardStep[];
  currentStep: number;
  completedSteps: number[];
  onStepClick: (index: number) => void;
  isStepAccessible: (index: number) => boolean;
}

const WizardProgressBar: React.FC<WizardProgressBarProps> = ({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  isStepAccessible
}) => {
  return (
    <div className="wizard-progress-bar">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(index);
        const isCurrent = index === currentStep;
        const isAccessible = isStepAccessible(index);

        return (
          <div
            key={step.id}
            className={`progress-step ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''} ${isAccessible ? 'accessible' : 'locked'}`}
            onClick={() => isAccessible && onStepClick(index)}
          >
            <div className="step-indicator">
              {isCompleted ? '✓' : index + 1}
            </div>
            <div className="step-label">{step.title}</div>
          </div>
        );
      })}
    </div>
  );
};

interface WizardNavigationProps {
  progress: WizardProgress;
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  isValidating: boolean;
  isLastStep: boolean;
}

const WizardNavigation: React.FC<WizardNavigationProps> = ({
  progress,
  onNext,
  onPrevious,
  onComplete,
  isValidating,
  isLastStep
}) => {
  return (
    <div className="wizard-navigation">
      <button
        onClick={onPrevious}
        disabled={!progress.canGoPrevious}
        className="btn-previous"
      >
        ← Previous
      </button>

      <div className="step-counter">
        Step {progress.currentStep + 1} of {progress.totalSteps}
      </div>

      {isLastStep ? (
        <button
          onClick={onComplete}
          disabled={isValidating}
          className="btn-complete"
        >
          {isValidating ? 'Validating...' : 'Complete'}
        </button>
      ) : (
        <button
          onClick={onNext}
          disabled={!progress.canGoNext || isValidating}
          className="btn-next"
        >
          {isValidating ? 'Validating...' : 'Next →'}
        </button>
      )}
    </div>
  );
};

interface WizardStepContentProps {
  step: WizardStep;
  children: React.ReactNode;
  className?: string;
}

export const WizardStepContent: React.FC<WizardStepContentProps> = ({
  step,
  children,
  className = ''
}) => {
  return (
    <div className={`wizard-step-content ${className}`}>
      <h2 className="step-title">{step.title}</h2>
      <div className="step-fields">{children}</div>
    </div>
  );
};
