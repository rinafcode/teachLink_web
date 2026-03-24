/**
 * Configuration Parser Example
 * 
 * Demonstrates the usage of the FormConfigurationParser for parsing,
 * validating, and formatting form configurations.
 */

import { FormConfigurationParser } from '../utils/configuration-parser';
import type { FormConfiguration } from '../types/core';

// Create parser instance
const parser = new FormConfigurationParser();

// Example 1: Basic form configuration
const basicFormConfig: FormConfiguration = {
  id: 'contact-form',
  version: '1.0.0',
  title: 'Contact Us Form',
  description: 'A simple contact form for customer inquiries',
  fields: [
    {
      id: 'full-name',
      type: 'text',
      label: 'Full Name',
      placeholder: 'Enter your full name',
      required: true,
      validation: [
        { type: 'required', message: 'Name is required' },
        { type: 'minLength', message: 'Name must be at least 2 characters', params: { min: 2 } }
      ]
    },
    {
      id: 'email',
      type: 'email',
      label: 'Email Address',
      placeholder: 'your.email@example.com',
      required: true,
      validation: [
        { type: 'required', message: 'Email is required' },
        { type: 'email', message: 'Please enter a valid email address' }
      ]
    },
    {
      id: 'message',
      type: 'textarea',
      label: 'Message',
      placeholder: 'Tell us how we can help you...',
      required: true,
      validation: [
        { type: 'required', message: 'Message is required' },
        { type: 'minLength', message: 'Message must be at least 10 characters', params: { min: 10 } }
      ]
    }
  ],
  layout: {
    type: 'single-column',
    spacing: 'normal',
    responsive: {
      breakpoints: { mobile: 768, tablet: 1024 },
      layouts: {
        mobile: {
          type: 'single-column',
          spacing: 'compact',
          responsive: { breakpoints: {}, layouts: {} }
        }
      }
    }
  },
  validation: {
    validateOnChange: false,
    validateOnBlur: true,
    showErrorsOnSubmit: true,
    debounceMs: 300,
    customRules: {}
  },
  autoSave: {
    enabled: true,
    intervalMs: 30000, // Save every 30 seconds
    saveOnBlur: true,
    maxDrafts: 3,
    compressionEnabled: true
  },
  analytics: {
    enabled: true,
    trackFieldInteractions: true,
    trackTimeSpent: true,
    privacyMode: false,
    customEvents: ['form-started', 'form-abandoned']
  }
};

// Example 2: Multi-step wizard form configuration
const wizardFormConfig: FormConfiguration = {
  id: 'user-registration',
  version: '2.0.0',
  title: 'User Registration Wizard',
  description: 'Complete user registration in 3 easy steps',
  fields: [
    // Step 1: Personal Information
    {
      id: 'first-name',
      type: 'text',
      label: 'First Name',
      required: true,
      validation: [{ type: 'required', message: 'First name is required' }]
    },
    {
      id: 'last-name',
      type: 'text',
      label: 'Last Name',
      required: true,
      validation: [{ type: 'required', message: 'Last name is required' }]
    },
    {
      id: 'birth-date',
      type: 'date',
      label: 'Date of Birth',
      required: true,
      validation: [{ type: 'required', message: 'Date of birth is required' }]
    },
    // Step 2: Account Information
    {
      id: 'username',
      type: 'text',
      label: 'Username',
      required: true,
      validation: [
        { type: 'required', message: 'Username is required' },
        { type: 'minLength', message: 'Username must be at least 3 characters', params: { min: 3 } }
      ]
    },
    {
      id: 'password',
      type: 'password',
      label: 'Password',
      required: true,
      validation: [
        { type: 'required', message: 'Password is required' },
        { type: 'minLength', message: 'Password must be at least 8 characters', params: { min: 8 } }
      ]
    },
    {
      id: 'confirm-password',
      type: 'password',
      label: 'Confirm Password',
      required: true,
      validation: [{ type: 'required', message: 'Please confirm your password' }],
      dependencies: ['password']
    },
    // Step 3: Preferences
    {
      id: 'newsletter',
      type: 'checkbox',
      label: 'Subscribe to newsletter',
      required: false,
      validation: []
    },
    {
      id: 'notifications',
      type: 'select',
      label: 'Notification Preferences',
      required: false,
      validation: []
    }
  ],
  steps: [
    {
      index: 0,
      id: 'personal-info',
      title: 'Personal Information',
      fields: ['first-name', 'last-name', 'birth-date'],
      isComplete: false,
      isValid: false
    },
    {
      index: 1,
      id: 'account-info',
      title: 'Account Setup',
      fields: ['username', 'password', 'confirm-password'],
      isComplete: false,
      isValid: false
    },
    {
      index: 2,
      id: 'preferences',
      title: 'Preferences',
      fields: ['newsletter', 'notifications'],
      isComplete: false,
      isValid: false
    }
  ],
  layout: {
    type: 'single-column',
    spacing: 'relaxed',
    fieldGroups: [
      {
        id: 'personal-group',
        title: 'Personal Details',
        fields: ['first-name', 'last-name', 'birth-date']
      },
      {
        id: 'account-group',
        title: 'Account Setup',
        fields: ['username', 'password', 'confirm-password']
      },
      {
        id: 'preferences-group',
        title: 'Your Preferences',
        fields: ['newsletter', 'notifications']
      }
    ],
    responsive: {
      breakpoints: { mobile: 768, tablet: 1024, desktop: 1200 },
      layouts: {
        mobile: {
          type: 'single-column',
          spacing: 'compact',
          responsive: { breakpoints: {}, layouts: {} }
        },
        tablet: {
          type: 'two-column',
          spacing: 'normal',
          responsive: { breakpoints: {}, layouts: {} }
        }
      }
    }
  },
  validation: {
    validateOnChange: true,
    validateOnBlur: true,
    showErrorsOnSubmit: true,
    debounceMs: 500,
    customRules: {}
  },
  autoSave: {
    enabled: true,
    intervalMs: 15000, // Save every 15 seconds for registration
    saveOnBlur: true,
    maxDrafts: 5,
    compressionEnabled: true
  },
  analytics: {
    enabled: true,
    trackFieldInteractions: true,
    trackTimeSpent: true,
    privacyMode: false,
    customEvents: ['step-completed', 'registration-started', 'registration-completed']
  },
  accessibility: {
    highContrastMode: true,
    screenReaderSupport: true,
    keyboardNavigation: true,
    customFocusIndicators: true
  }
};

// Demonstration functions
export function demonstrateConfigurationParser() {
  console.log('=== Configuration Parser Demonstration ===\n');

  // 1. Validate configurations
  console.log('1. Validating configurations...');
  
  const basicValidation = parser.validate(basicFormConfig);
  console.log(`Basic form validation: ${basicValidation.isValid ? 'VALID' : 'INVALID'}`);
  if (!basicValidation.isValid) {
    console.log('Errors:', basicValidation.errors);
  }

  const wizardValidation = parser.validate(wizardFormConfig);
  console.log(`Wizard form validation: ${wizardValidation.isValid ? 'VALID' : 'INVALID'}`);
  if (!wizardValidation.isValid) {
    console.log('Errors:', wizardValidation.errors);
  }

  // 2. Format to JSON
  console.log('\n2. Formatting configurations to JSON...');
  
  const basicJson = parser.formatToJson(basicFormConfig);
  console.log('Basic form JSON length:', basicJson.length, 'characters');
  
  const compactJson = parser.formatToCompactJson(basicFormConfig);
  console.log('Compact JSON length:', compactJson.length, 'characters');
  
  // 3. Format with custom options
  console.log('\n3. Formatting with custom options...');
  
  const jsonWithMetadata = parser.formatToJsonWithOptions(wizardFormConfig, {
    includeMetadata: true,
    sortKeys: true,
    indent: 4
  });
  console.log('JSON with metadata includes _metadata field:', jsonWithMetadata.includes('_metadata'));

  // 4. Round-trip test
  console.log('\n4. Testing round-trip (format -> parse -> validate)...');
  
  try {
    const formattedJson = parser.formatToJson(wizardFormConfig);
    const parsedConfig = parser.parse(formattedJson);
    const revalidation = parser.validate(parsedConfig);
    
    console.log(`Round-trip successful: ${revalidation.isValid ? 'YES' : 'NO'}`);
    console.log(`Original fields: ${wizardFormConfig.fields.length}, Parsed fields: ${parsedConfig.fields.length}`);
    console.log(`Original steps: ${wizardFormConfig.steps?.length || 0}, Parsed steps: ${parsedConfig.steps?.length || 0}`);
  } catch (error) {
    console.log('Round-trip failed:', error);
  }

  // 5. Error handling demonstration
  console.log('\n5. Demonstrating error handling...');
  
  const invalidConfig = {
    id: '', // Invalid: empty ID
    version: '1.0.0',
    title: 'Invalid Form',
    fields: [] // Invalid: no fields
  };
  
  const invalidValidation = parser.validate(invalidConfig as unknown as FormConfiguration);
  console.log(`Invalid config validation: ${invalidValidation.isValid ? 'VALID' : 'INVALID'}`);
  console.log(`Number of validation errors: ${invalidValidation.errors.length}`);
  
  // Try parsing invalid JSON
  try {
    parser.parse('{ invalid json }');
  } catch (error) {
    console.log('Invalid JSON parsing correctly throws error:', error instanceof Error);
  }

  console.log('\n=== Demonstration Complete ===');
}

// Export configurations for use in other examples
export { basicFormConfig, wizardFormConfig };