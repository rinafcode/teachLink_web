'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { CertificateInputSchema, type CertificateInput } from '@/schemas/certificate.schema';
import { apiClient } from '@/lib/api';
import { FormInput } from '@/components/forms/FormInput';
import { FieldError, FormError } from '@/components/forms/FormError';
import { SubmitButton } from '@/components/forms/SubmitButton';

export default function CertificateGenerationPage() {
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const methods = useForm<CertificateInput>({
    resolver: zodResolver(CertificateInputSchema),
    mode: 'onTouched',
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = methods;

  const onSubmit = async (data: CertificateInput) => {
    setApiError(null);
    setSuccessMessage(null);

    try {
      const result = await apiClient.post<{ certificateId: string }>('/api/certificates/generate', data);
      setSuccessMessage(`Certificate generated successfully. ID: ${result.certificateId}`);
      reset();
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : 'Unable to generate certificate. Please try again.',
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 shadow-sm"
        >
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
              Certification Program
            </p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              Generate your Course Certificate
            </h1>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 max-w-2xl">
              Complete the form below to request a certificate for a completed course. Your input fields are
              validated, accessible, and connected to the Certification Program workflow.
            </p>
          </div>

          <FormProvider {...methods}>
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <FormInput
                name="courseId"
                label="Course ID"
                placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                helperText="Enter the UUID of the completed course for which you want a certificate."
                required
              />

              <FormInput
                name="name"
                label="Student Name"
                placeholder="Your full name"
                helperText="This name will appear on the issued certificate exactly as entered."
                certificationProgram="Certificate of completion"
                required
              />

              <FormError error={apiError} id="certificate-api-error" />
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                  role="status"
                  aria-live="polite"
                >
                  {successMessage}
                </motion.div>
              )}

              <div>
                <SubmitButton
                  isLoading={isSubmitting}
                  loadingText="Generating certificate…"
                  className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Generate certificate
                </SubmitButton>
              </div>
            </motion.form>
          </FormProvider>
        </motion.div>
      </div>
    </div>
  );
}
