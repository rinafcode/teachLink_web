/**
 * Exports Dashboard Page
 * Main page for managing export templates and schedules
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ExportButton from '@/components/ExportButton';
import { apiClient } from '@/lib/api';
import { defaultSort, normalizeFilters } from '@/lib/export';
import { ExportHistory, ExportSchedule, ExportTemplate } from '@/lib/export-scheduler';

export default function ExportsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'templates' | 'schedules' | 'history'>('templates');
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [schedules, setSchedules] = useState<ExportSchedule[]>([]);
  const [history, setHistory] = useState<ExportHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'templates') {
        const response = await apiClient.get<{ templates: ExportTemplate[] }>(
          '/api/exports/templates',
        );
        setTemplates(response.templates);
      } else if (activeTab === 'schedules') {
        const response = await apiClient.get<{ schedules: ExportSchedule[] }>(
          '/api/exports/schedules',
        );
        setSchedules(response.schedules);
      } else {
        const response = await apiClient.get<{ history: ExportHistory[] }>('/api/exports/history');
        setHistory(response.history);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await apiClient.delete(`/api/exports/templates/${id}`);
      void loadData();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try {
      await apiClient.delete(`/api/exports/schedules/${id}`);
      void loadData();
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const handleToggleSchedule = async (scheduleId: string, enabled: boolean) => {
    try {
      await apiClient.patch(`/api/exports/schedules/${scheduleId}`, { enabled });
      void loadData();
    } catch (error) {
      console.error('Error toggling schedule:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Data Exports</h1>
        <p className="text-gray-600">
          Manage export templates, schedules, history, and on-demand filtered exports.
        </p>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('templates')}
            className={`border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab('schedules')}
            className={`border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === 'schedules'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Schedules
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            History
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      ) : (
        <>
          {activeTab === 'templates' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Export Templates</h2>
                  <p className="text-sm text-gray-500">
                    Exports keep template filters and apply a deterministic sort before generating files.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/exports/templates/new')}
                  className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Create Template
                </button>
              </div>

              {templates.length === 0 ? (
                <div className="rounded-lg bg-gray-50 py-12 text-center">
                  <p className="text-gray-600">No templates yet. Create your first template!</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {templates.map((template) => (
                    <div key={template.id} className="rounded-lg border p-4 hover:shadow-md">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{template.name}</h3>
                          {template.description && (
                            <p className="mt-1 text-sm text-gray-600">{template.description}</p>
                          )}
                          <div className="mt-2 flex gap-4 text-sm text-gray-500">
                            <span>Format: {template.format.toUpperCase()}</span>
                            <span>Source: {template.dataSource}</span>
                            <span>Columns: {(template.columns ?? []).length || 'Default'}</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 lg:items-end">
                          <ExportButton
                            templateId={template.id}
                            label="Run Now"
                            filters={normalizeFilters(template.filters)}
                            sort={defaultSort(template.columns)}
                            columns={template.columns}
                            onComplete={() => {
                              setActiveTab('history');
                              void loadData();
                            }}
                            className="rounded border border-blue-600 px-3 py-1 text-blue-600 hover:text-blue-800"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`/exports/templates/${template.id}`)}
                              className="rounded border border-gray-300 px-3 py-1 text-gray-600 hover:text-gray-800"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="rounded border border-red-600 px-3 py-1 text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'schedules' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Export Schedules</h2>
                <button
                  onClick={() => router.push('/exports/schedules/new')}
                  className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Create Schedule
                </button>
              </div>
              {schedules.length === 0 ? (
                <div className="rounded-lg bg-gray-50 py-12 text-center">
                  <p className="text-gray-600">No schedules yet. Create your first schedule!</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {schedules.map((schedule) => (
                    <div key={schedule.id} className="rounded-lg border p-4 hover:shadow-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold">{schedule.name}</h3>
                          <div className="mt-2 flex gap-4 text-sm text-gray-500">
                            <span>Frequency: {schedule.frequency}</span>
                            <span>Next run: {new Date(schedule.nextRunAt).toLocaleString()}</span>
                            <span className={schedule.enabled ? 'text-green-600' : 'text-red-600'}>
                              {schedule.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                          {schedule.emailDelivery && (
                            <p className="mt-1 text-sm text-gray-600">
                              Email delivery to: {schedule.emailRecipients?.join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleSchedule(schedule.id, !schedule.enabled)}
                            className={`rounded border px-3 py-1 ${
                              schedule.enabled
                                ? 'border-orange-600 text-orange-600 hover:text-orange-800'
                                : 'border-green-600 text-green-600 hover:text-green-800'
                            }`}
                          >
                            {schedule.enabled ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => router.push(`/exports/schedules/${schedule.id}`)}
                            className="rounded border border-gray-300 px-3 py-1 text-gray-600 hover:text-gray-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="rounded border border-red-600 px-3 py-1 text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h2 className="mb-4 text-xl font-semibold">Export History</h2>
              {history.length === 0 ? (
                <div className="rounded-lg bg-gray-50 py-12 text-center">
                  <p className="text-gray-600">No export history yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          File Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Format
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Size
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {history.map((item) => (
                        <tr key={item.id}>
                          <td className="whitespace-nowrap px-6 py-4 text-sm">{item.fileName}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm">
                            {item.format.toUpperCase()}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                item.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm">
                            {(item.fileSize / 1024).toFixed(2)} KB
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm">
                            {new Date(item.executedAt).toLocaleString()}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm">
                            {item.downloadUrl && (
                              <a
                                href={item.downloadUrl}
                                download={item.fileName}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Download
                              </a>
                            )}
                            {item.error && (
                              <span className="text-red-600" title={item.error}>
                                Error
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
