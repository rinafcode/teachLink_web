/**
 * Create Export Schedule Page
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from '@/lib/api';
import { ExportTemplate, ScheduleFrequency } from '@/lib/export-scheduler';

export default function NewSchedulePage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    templateId: '',
    frequency: 'daily' as ScheduleFrequency,
    cronExpression: '',
    emailDelivery: false,
    emailRecipients: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await apiClient.get<{ templates: ExportTemplate[] }>(
        '/api/exports/templates',
      );
      setTemplates(response.templates);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const recipients = formData.emailRecipients
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);

      await apiClient.post('/api/exports/schedules', {
        ...formData,
        emailRecipients: formData.emailDelivery && recipients.length > 0 ? recipients : undefined,
        cronExpression: formData.frequency === 'custom' ? formData.cronExpression : undefined,
      });

      router.push('/exports');
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Create Export Schedule</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Weekly Course Export"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Template *</label>
          <select
            required
            value={formData.templateId}
            onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} ({template.format.toUpperCase()})
              </option>
            ))}
          </select>
          {templates.length === 0 && (
            <p className="mt-1 text-sm text-red-600">
              No templates available. Please create a template first.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Frequency *</label>
          <select
            required
            value={formData.frequency}
            onChange={(e) =>
              setFormData({ ...formData, frequency: e.target.value as ScheduleFrequency })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom (Cron)</option>
          </select>
        </div>

        {formData.frequency === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cron Expression *
            </label>
            <input
              type="text"
              required={formData.frequency === 'custom'}
              value={formData.cronExpression}
              onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 0 0 * * * (every day at midnight)"
            />
            <p className="mt-1 text-sm text-gray-500">
              Format: minute hour day month weekday (e.g., 0 0 * * * for daily at midnight)
            </p>
          </div>
        )}

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.emailDelivery}
              onChange={(e) => setFormData({ ...formData, emailDelivery: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Enable Email Delivery</span>
          </label>
        </div>

        {formData.emailDelivery && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Recipients *
            </label>
            <input
              type="text"
              required={formData.emailDelivery}
              value={formData.emailRecipients}
              onChange={(e) => setFormData({ ...formData, emailRecipients: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="email1@example.com, email2@example.com"
            />
            <p className="mt-1 text-sm text-gray-500">Comma-separated email addresses</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || templates.length === 0}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Creating...' : 'Create Schedule'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
