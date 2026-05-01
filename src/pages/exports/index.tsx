/**
 * Exports Dashboard Page
 * Main page for managing export templates and schedules
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ExportTemplate, ExportSchedule, ExportHistory } from '@/lib/export-scheduler';
import { apiClient } from '@/lib/api';

export default function ExportsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'templates' | 'schedules' | 'history'>('templates');
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [schedules, setSchedules] = useState<ExportSchedule[]>([]);
  const [history, setHistory] = useState<ExportHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
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

  const handleCreateTemplate = () => {
    router.push('/exports/templates/new');
  };

  const handleCreateSchedule = () => {
    router.push('/exports/schedules/new');
  };

  const handleExecuteExport = async (templateId: string) => {
    try {
      await apiClient.post('/api/exports/execute', { templateId });
      alert('Export started! You will receive an email when it completes.');
      loadData();
    } catch (error) {
      console.error('Error executing export:', error);
      alert('Failed to start export');
    }
  };

  const handleToggleSchedule = async (scheduleId: string, enabled: boolean) => {
    try {
      await apiClient.patch(`/api/exports/schedules/${scheduleId}`, { enabled });
      loadData();
    } catch (error) {
      console.error('Error toggling schedule:', error);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await apiClient.delete(`/api/exports/templates/${id}`);
      loadData();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try {
      await apiClient.delete(`/api/exports/schedules/${id}`);
      loadData();
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Data Exports</h1>
        <p className="text-gray-600">Manage export templates, schedules, and history</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab('schedules')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'schedules'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Schedules
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            History
          </button>
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      ) : (
        <>
          {activeTab === 'templates' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Export Templates</h2>
                <button
                  onClick={handleCreateTemplate}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Create Template
                </button>
              </div>
              {templates.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">No templates yet. Create your first template!</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {templates.map((template) => (
                    <div key={template.id} className="border rounded-lg p-4 hover:shadow-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{template.name}</h3>
                          {template.description && (
                            <p className="text-gray-600 text-sm mt-1">{template.description}</p>
                          )}
                          <div className="flex gap-4 mt-2 text-sm text-gray-500">
                            <span>Format: {template.format.toUpperCase()}</span>
                            <span>Source: {template.dataSource}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleExecuteExport(template.id)}
                            className="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-600 rounded"
                          >
                            Run Now
                          </button>
                          <button
                            onClick={() => router.push(`/exports/templates/${template.id}`)}
                            className="text-gray-600 hover:text-gray-800 px-3 py-1 border border-gray-300 rounded"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="text-red-600 hover:text-red-800 px-3 py-1 border border-red-600 rounded"
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

          {activeTab === 'schedules' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Export Schedules</h2>
                <button
                  onClick={handleCreateSchedule}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Create Schedule
                </button>
              </div>
              {schedules.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">No schedules yet. Create your first schedule!</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {schedules.map((schedule) => (
                    <div key={schedule.id} className="border rounded-lg p-4 hover:shadow-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{schedule.name}</h3>
                          <div className="flex gap-4 mt-2 text-sm text-gray-500">
                            <span>Frequency: {schedule.frequency}</span>
                            <span>Next run: {new Date(schedule.nextRunAt).toLocaleString()}</span>
                            <span className={schedule.enabled ? 'text-green-600' : 'text-red-600'}>
                              {schedule.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                          {schedule.emailDelivery && (
                            <p className="text-sm text-gray-600 mt-1">
                              Email delivery to: {schedule.emailRecipients?.join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleSchedule(schedule.id, !schedule.enabled)}
                            className={`px-3 py-1 border rounded ${
                              schedule.enabled
                                ? 'text-orange-600 border-orange-600 hover:text-orange-800'
                                : 'text-green-600 border-green-600 hover:text-green-800'
                            }`}
                          >
                            {schedule.enabled ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => router.push(`/exports/schedules/${schedule.id}`)}
                            className="text-gray-600 hover:text-gray-800 px-3 py-1 border border-gray-300 rounded"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="text-red-600 hover:text-red-800 px-3 py-1 border border-red-600 rounded"
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
              <h2 className="text-xl font-semibold mb-4">Export History</h2>
              {history.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">No export history yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          File Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Format
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Size
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {history.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{item.fileName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {item.format.toUpperCase()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                item.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {(item.fileSize / 1024).toFixed(2)} KB
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {new Date(item.executedAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
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
