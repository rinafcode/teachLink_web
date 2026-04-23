'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Eye,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  NotificationTemplate,
  NotificationCategory,
  NotificationChannel,
  NotificationPriority,
} from '@/utils/notificationUtils';

interface NotificationTemplatesProps {
  onTemplateSelect?: (template: NotificationTemplate) => void;
  onTemplateCreate?: (template: NotificationTemplate) => void;
  onTemplateUpdate?: (template: NotificationTemplate) => void;
  onTemplateDelete?: (templateId: string) => void;
}

// Default templates
const defaultTemplates: NotificationTemplate[] = [
  {
    id: 'tpl_course_update',
    category: 'course_update',
    title: 'New Lesson Available',
    body: 'A new lesson "{{lessonName}}" has been added to "{{courseName}}". Check it out now!',
    channels: ['in-app', 'push', 'email'],
    priority: 'medium',
    variables: ['lessonName', 'courseName'],
  },
  {
    id: 'tpl_assignment_due',
    category: 'reminder',
    title: 'Assignment Due Soon',
    body: 'Your assignment "{{assignmentName}}" for "{{courseName}}" is due in {{timeRemaining}}.',
    channels: ['in-app', 'push', 'email'],
    priority: 'high',
    variables: ['assignmentName', 'courseName', 'timeRemaining'],
  },
  {
    id: 'tpl_achievement',
    category: 'achievement',
    title: 'Achievement Unlocked! 🏆',
    body: 'Congratulations! You\'ve earned the "{{badgeName}}" badge. Keep up the great work!',
    channels: ['in-app', 'push'],
    priority: 'medium',
    variables: ['badgeName'],
  },
  {
    id: 'tpl_message',
    category: 'message',
    title: 'New Message from {{senderName}}',
    body: '{{senderName}} sent you a message: "{{messagePreview}}"',
    channels: ['in-app', 'push'],
    priority: 'medium',
    variables: ['senderName', 'messagePreview'],
  },
  {
    id: 'tpl_payment_success',
    category: 'payment',
    title: 'Payment Confirmed',
    body: 'Your payment of {{amount}} for "{{itemName}}" has been successfully processed.',
    channels: ['in-app', 'email'],
    priority: 'medium',
    variables: ['amount', 'itemName'],
  },
  {
    id: 'tpl_study_group',
    category: 'social',
    title: 'Study Group Activity',
    body: '{{activityType}} in your study group "{{groupName}}". Join the discussion!',
    channels: ['in-app', 'push'],
    priority: 'low',
    variables: ['activityType', 'groupName'],
  },
  {
    id: 'tpl_system_maintenance',
    category: 'system',
    title: 'Scheduled Maintenance',
    body: 'The platform will undergo maintenance on {{date}} from {{startTime}} to {{endTime}}. Please save your work.',
    channels: ['in-app', 'email'],
    priority: 'high',
    variables: ['date', 'startTime', 'endTime'],
  },
];

export default function NotificationTemplates({
  onTemplateSelect,
  onTemplateCreate,
  onTemplateUpdate,
  onTemplateDelete,
}: NotificationTemplatesProps) {
  const [templates, setTemplates] = useState<NotificationTemplate[]>(defaultTemplates);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<NotificationCategory | 'all'>('all');
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<NotificationTemplate | null>(null);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch =
        !searchQuery ||
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.body.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = filterCategory === 'all' || template.category === filterCategory;

      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, filterCategory]);

  // Group templates by category
  const groupedTemplates = useMemo(() => {
    const groups = new Map<NotificationCategory, NotificationTemplate[]>();
    filteredTemplates.forEach((template) => {
      if (!groups.has(template.category)) {
        groups.set(template.category, []);
      }
      groups.get(template.category)!.push(template);
    });
    return groups;
  }, [filteredTemplates]);

  // Handle template save
  const handleSaveTemplate = (template: NotificationTemplate) => {
    if (editingTemplate) {
      // Update existing
      setTemplates((prev) => prev.map((t) => (t.id === template.id ? template : t)));
      onTemplateUpdate?.(template);
    } else {
      // Create new
      const newTemplate = {
        ...template,
        id: `tpl_${Date.now()}`,
      };
      setTemplates((prev) => [...prev, newTemplate]);
      onTemplateCreate?.(newTemplate);
    }
    setEditingTemplate(null);
    setIsCreating(false);
  };

  // Handle template delete
  const handleDeleteTemplate = (templateId: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    onTemplateDelete?.(templateId);
  };

  // Handle template duplicate
  const handleDuplicateTemplate = (template: NotificationTemplate) => {
    const duplicate: NotificationTemplate = {
      ...template,
      id: `tpl_${Date.now()}`,
      title: `${template.title} (Copy)`,
    };
    setTemplates((prev) => [...prev, duplicate]);
  };

  // Preview with sample data
  const getPreviewContent = (template: NotificationTemplate) => {
    const sampleData: Record<string, string> = {
      lessonName: 'Introduction to React Hooks',
      courseName: 'Advanced React Development',
      assignmentName: 'Build a Custom Hook',
      timeRemaining: '2 hours',
      badgeName: 'Fast Learner',
      senderName: 'John Doe',
      messagePreview: 'Hey, can you help me with the assignment?',
      amount: '$49.99',
      itemName: 'Pro Subscription',
      activityType: 'New discussion',
      groupName: 'React Study Group',
      date: 'March 30, 2024',
      startTime: '2:00 AM',
      endTime: '4:00 AM',
    };

    let previewTitle = template.title;
    let previewBody = template.body;

    template.variables.forEach((variable) => {
      const value = sampleData[variable] || `{{${variable}}}`;
      previewTitle = previewTitle.replace(new RegExp(`{{${variable}}}`, 'g'), value);
      previewBody = previewBody.replace(new RegExp(`{{${variable}}}`, 'g'), value);
    });

    return { title: previewTitle, body: previewBody };
  };

  return (
    <div className="bg-white border rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Notification Templates</h2>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            New Template
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Create and manage reusable notification templates
        </p>
      </div>

      {/* Search and Filter */}
      <div className="p-4 border-b flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as NotificationCategory | 'all')}
          className="px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          <option value="course_update">Course Updates</option>
          <option value="message">Messages</option>
          <option value="achievement">Achievements</option>
          <option value="reminder">Reminders</option>
          <option value="system">System</option>
          <option value="social">Social</option>
          <option value="payment">Payment</option>
        </select>
      </div>

      {/* Templates List */}
      <div className="max-h-[500px] overflow-y-auto">
        {filteredTemplates.length === 0 ? (
          <div className="p-8 text-center">
            <FileText size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No templates found</p>
          </div>
        ) : (
          Array.from(groupedTemplates.entries()).map(([category, categoryTemplates]) => (
            <div key={category}>
              <div className="sticky top-0 px-4 py-2 bg-gray-100 text-xs font-medium text-gray-600 border-b capitalize">
                {category.replace('_', ' ')}
              </div>
              {categoryTemplates.map((template) => {
                const isExpanded = expandedTemplate === template.id;
                const isEditing = editingTemplate?.id === template.id;
                const preview = getPreviewContent(template);

                return (
                  <div key={template.id} className="border-b hover:bg-gray-50 transition-colors">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">{template.title}</h3>
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 text-xs rounded ${
                                template.priority === 'urgent'
                                  ? 'bg-red-100 text-red-800'
                                  : template.priority === 'high'
                                  ? 'bg-orange-100 text-orange-800'
                                  : template.priority === 'medium'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {template.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{template.body}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {template.channels.map((channel) => (
                              <span
                                key={channel}
                                className="inline-flex items-center px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded capitalize"
                              >
                                {channel === 'in-app' ? 'In-App' : channel}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          <button
                            onClick={() => setPreviewTemplate(template)}
                            className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                            title="Preview"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDuplicateTemplate(template)}
                            className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                            title="Duplicate"
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            onClick={() => setEditingTemplate(template)}
                            className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={() => setExpandedTemplate(isExpanded ? null : template.id)}
                            className="p-1.5 rounded hover:bg-gray-200 text-gray-400"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Template ID</label>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {template.id}
                            </code>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Variables</label>
                            <div className="flex flex-wrap gap-1">
                              {template.variables.map((variable) => (
                                <span
                                  key={variable}
                                  className="inline-flex items-center px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded"
                                >
                                  {`{{${variable}}}`}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Preview</label>
                            <div className="bg-gray-50 p-3 rounded border">
                              <div className="font-medium text-sm text-gray-900">
                                {preview.title}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">{preview.body}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => onTemplateSelect?.(template)}
                            className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            Use This Template
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Template Preview</h3>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              {(() => {
                const preview = getPreviewContent(previewTemplate);
                return (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="font-medium text-blue-900">{preview.title}</div>
                      <div className="text-sm text-blue-800 mt-2">{preview.body}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      <div className="font-medium mb-1">Channels:</div>
                      <div className="flex flex-wrap gap-1">
                        {previewTemplate.channels.map((channel) => (
                          <span
                            key={channel}
                            className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded capitalize"
                          >
                            {channel === 'in-app' ? 'In-App' : channel}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      <div className="font-medium mb-1">Variables:</div>
                      <div className="flex flex-wrap gap-1">
                        {previewTemplate.variables.map((variable) => (
                          <span
                            key={variable}
                            className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded"
                          >
                            {`{{${variable}}}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => {
                  onTemplateSelect?.(previewTemplate);
                  setPreviewTemplate(null);
                }}
                className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Use This Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Modal */}
      {(editingTemplate || isCreating) && (
        <TemplateEditor
          template={editingTemplate}
          onSave={handleSaveTemplate}
          onCancel={() => {
            setEditingTemplate(null);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
}

// Template Editor Component
interface TemplateEditorProps {
  template: NotificationTemplate | null;
  onSave: (template: NotificationTemplate) => void;
  onCancel: () => void;
}

function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const [formData, setFormData] = useState<Partial<NotificationTemplate>>(
    template || {
      category: 'system',
      title: '',
      body: '',
      channels: ['in-app'],
      priority: 'medium',
      variables: [],
    },
  );
  const [newVariable, setNewVariable] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  // Extract variables from text
  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches.map((m) => m.slice(2, -2)))];
  };

  // Update variables when title or body changes
  const handleTextChange = (field: 'title' | 'body', value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      const titleVars = extractVariables(newData.title || '');
      const bodyVars = extractVariables(newData.body || '');
      newData.variables = [...new Set([...titleVars, ...bodyVars])];
      return newData;
    });
  };

  // Toggle channel
  const toggleChannel = (channel: NotificationChannel) => {
    setFormData((prev) => {
      const channels = prev.channels || [];
      const newChannels = channels.includes(channel)
        ? channels.filter((c) => c !== channel)
        : [...channels, channel];
      return { ...prev, channels: newChannels };
    });
  };

  // Add manual variable
  const addVariable = () => {
    if (newVariable && !formData.variables?.includes(newVariable)) {
      setFormData((prev) => ({
        ...prev,
        variables: [...(prev.variables || []), newVariable],
      }));
      setNewVariable('');
    }
  };

  // Remove variable
  const removeVariable = (variable: string) => {
    setFormData((prev) => ({
      ...prev,
      variables: prev.variables?.filter((v) => v !== variable) || [],
    }));
  };

  // Validate and save
  const handleSave = () => {
    const newErrors: string[] = [];

    if (!formData.title?.trim()) {
      newErrors.push('Title is required');
    }
    if (!formData.body?.trim()) {
      newErrors.push('Body is required');
    }
    if (!formData.category) {
      newErrors.push('Category is required');
    }
    if (!formData.channels?.length) {
      newErrors.push('At least one channel is required');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData as NotificationTemplate);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            {template ? 'Edit Template' : 'Create Template'}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 mb-2">
                <AlertCircle size={16} />
                <span className="font-medium text-sm">Validation Errors</span>
              </div>
              <ul className="text-sm text-red-700 list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => handleTextChange('title', e.target.value)}
              placeholder="Notification title (use {{variable}} for dynamic content)"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
            <textarea
              value={formData.body || ''}
              onChange={(e) => handleTextChange('body', e.target.value)}
              placeholder="Notification message (use {{variable}} for dynamic content)"
              rows={4}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formData.category || 'system'}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  category: e.target.value as NotificationCategory,
                }))
              }
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="course_update">Course Updates</option>
              <option value="message">Messages</option>
              <option value="achievement">Achievements</option>
              <option value="reminder">Reminders</option>
              <option value="system">System</option>
              <option value="social">Social</option>
              <option value="payment">Payment</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={formData.priority || 'medium'}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  priority: e.target.value as NotificationPriority,
                }))
              }
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Channels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Channels</label>
            <div className="flex flex-wrap gap-2">
              {(['in-app', 'push', 'email', 'sms'] as NotificationChannel[]).map((channel) => (
                <button
                  key={channel}
                  onClick={() => toggleChannel(channel)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    formData.channels?.includes(channel)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {channel === 'in-app'
                    ? 'In-App'
                    : channel.charAt(0).toUpperCase() + channel.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Variables */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Variables (auto-detected from title/body)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.variables?.map((variable) => (
                <span
                  key={variable}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                >
                  {`{{${variable}}}`}
                  <button
                    onClick={() => removeVariable(variable)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newVariable}
                onChange={(e) => setNewVariable(e.target.value)}
                placeholder="Add variable name"
                className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addVariable}
                disabled={!newVariable}
                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-md text-sm hover:bg-gray-200 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {template ? 'Save Changes' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
