/**
 * Create Export Template Page
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from '@/lib/api';
import { ExportFormat } from '@/lib/export-scheduler';

export default function NewTemplatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    format: 'csv' as ExportFormat,
    dataSource: 'courses',
    columns: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const columns = formData.columns
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      await apiClient.post('/api/exports/templates', {
        ...formData,
        columns: columns.length > 0 ? columns : undefined,
      });

      router.push('/exports');
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Create Export Template</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Template Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Monthly Course Report"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Optional description of this export template"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Export Format *</label>
          <select
            required
            value={formData.format}
            onChange={(e) => setFormData({ ...formData, format: e.target.value as ExportFormat })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="xlsx">Excel (XLSX)</option>
            <option value="pdf">PDF</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Data Source *</label>
          <select
            required
            value={formData.dataSource}
            onChange={(e) => setFormData({ ...formData, dataSource: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="courses">Courses</option>
            <option value="users">Users</option>
            <option value="enrollments">Enrollments</option>
            <option value="analytics">Analytics</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Columns (comma-separated)
          </label>
          <input
            type="text"
            value={formData.columns}
            onChange={(e) => setFormData({ ...formData, columns: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., id, name, email, created_at"
          />
          <p className="mt-1 text-sm text-gray-500">Leave empty to include all available columns</p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Creating...' : 'Create Template'}
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
