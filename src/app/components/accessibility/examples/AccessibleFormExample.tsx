'use client';

import React, { useState } from 'react';
import { useScreenReaderAnnouncement, useFocusTrap } from '@/hooks/useAccessibility';
import { AccessibleError, AccessibleSuccess } from '../ScreenReaderOptimizer';

/**
 * Example of an accessible form with proper ARIA labels,
 * error handling, and screen reader announcements
 */
export function AccessibleFormExample() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const announce = useScreenReaderAnnouncement();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setSuccess(true);
      announce('Form submitted successfully', 'polite');
      // Reset form
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setSuccess(false), 5000);
    } else {
      announce(`Form has ${Object.keys(errors).length} errors. Please correct them.`, 'assertive');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Accessible Contact Form</h1>

      {success && (
        <div className="mb-4">
          <AccessibleSuccess
            message="Your message has been sent successfully!"
            onDismiss={() => setSuccess(false)}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate aria-label="Contact form">
        {/* Name Field */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-600" aria-label="required">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
            className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${
              errors.name
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {errors.name && (
            <div id="name-error" role="alert" className="mt-1">
              <AccessibleError message={errors.name} />
            </div>
          )}
        </div>

        {/* Email Field */}
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-600" aria-label="required">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : 'email-hint'}
            className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${
              errors.email
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          <div id="email-hint" className="text-xs text-gray-600 mt-1">
            We'll never share your email with anyone else.
          </div>
          {errors.email && (
            <div id="email-error" role="alert" className="mt-1">
              <AccessibleError message={errors.email} />
            </div>
          )}
        </div>

        {/* Message Field */}
        <div className="mb-4">
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message <span className="text-red-600" aria-label="required">*</span>
          </label>
          <textarea
            id="message"
            rows={4}
            value={formData.message}
            onChange={(e) => handleChange('message', e.target.value)}
            aria-required="true"
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? 'message-error' : undefined}
            className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${
              errors.message
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {errors.message && (
            <div id="message-error" role="alert" className="mt-1">
              <AccessibleError message={errors.message} />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Send Message
        </button>
      </form>

      {/* Form Instructions (Screen Reader) */}
      <div className="sr-only" role="region" aria-label="Form instructions">
        <p>All fields marked with an asterisk are required.</p>
        <p>Press Tab to move between fields. Press Enter to submit the form.</p>
      </div>
    </div>
  );
}
