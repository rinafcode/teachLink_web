'use client';

import React, { useState, useCallback } from 'react';
import {
  Mail,
  Smartphone,
  MessageSquare,
  Bell,
  Check,
  X,
  AlertCircle,
  Loader2,
  Send,
  Settings,
} from 'lucide-react';
import { useNotifications } from '@/app/hooks/useNotifications';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationCategory,
} from '@/utils/notificationUtils';

interface MultiChannelDeliveryProps {
  userId?: string;
  onDeliveryComplete?: (results: Record<NotificationChannel, boolean>) => void;
}

interface DeliveryStatus {
  channel: NotificationChannel;
  status: 'idle' | 'sending' | 'success' | 'failed';
  message?: string;
}

const channelConfig: Record<
  NotificationChannel,
  { icon: React.ReactNode; label: string; description: string; color: string }
> = {
  'in-app': {
    icon: <Bell size={20} />,
    label: 'In-App',
    description: 'Notifications within the application',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  push: {
    icon: <Smartphone size={20} />,
    label: 'Push',
    description: 'Mobile and desktop push notifications',
    color: 'bg-green-100 text-green-800 border-green-200',
  },
  email: {
    icon: <Mail size={20} />,
    label: 'Email',
    description: 'Email notifications to your inbox',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  sms: {
    icon: <MessageSquare size={20} />,
    label: 'SMS',
    description: 'Text message notifications',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
  },
};

export default function MultiChannelDelivery({
  userId,
  onDeliveryComplete,
}: MultiChannelDeliveryProps) {
  const { sendNotification, sendToChannel, sendToAllChannels, preferences } = useNotifications({
    userId,
  });

  const [selectedChannels, setSelectedChannels] = useState<Set<NotificationChannel>>(
    new Set(['in-app']),
  );
  const [deliveryStatuses, setDeliveryStatuses] = useState<DeliveryStatus[]>([]);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<NotificationCategory>('system');
  const [priority, setPriority] = useState<NotificationPriority>('medium');
  const [isSending, setIsSending] = useState(false);

  // Toggle channel selection
  const toggleChannel = useCallback((channel: NotificationChannel) => {
    setSelectedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(channel)) {
        next.delete(channel);
      } else {
        next.add(channel);
      }
      return next;
    });
  }, []);

  // Send notification to selected channels
  const handleSend = useCallback(async () => {
    if (!message.trim() || selectedChannels.size === 0) return;

    setIsSending(true);
    const channels = Array.from(selectedChannels);

    // Initialize delivery statuses
    setDeliveryStatuses(channels.map((channel) => ({ channel, status: 'sending' })));

    try {
      // Create the notification
      const notification = sendNotification({
        message,
        type: priority === 'urgent' || priority === 'high' ? 'warning' : 'info',
        category,
        priority,
        channels,
        meta: { source: 'multi-channel-delivery' },
      });

      // Send to all selected channels
      const results = await sendToAllChannels(notification, channels);

      // Update delivery statuses
      setDeliveryStatuses(
        channels.map((channel) => ({
          channel,
          status: results[channel] ? 'success' : 'failed',
          message: results[channel] ? 'Delivered successfully' : 'Delivery failed',
        })),
      );

      onDeliveryComplete?.(results);

      // Clear form after successful delivery
      if (Object.values(results).every(Boolean)) {
        setTimeout(() => {
          setMessage('');
          setDeliveryStatuses([]);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
      setDeliveryStatuses(
        channels.map((channel) => ({
          channel,
          status: 'failed',
          message: 'An error occurred',
        })),
      );
    } finally {
      setIsSending(false);
    }
  }, [
    message,
    selectedChannels,
    category,
    priority,
    sendNotification,
    sendToAllChannels,
    onDeliveryComplete,
  ]);

  // Check if channel is enabled in preferences
  const isChannelEnabled = (channel: NotificationChannel): boolean => {
    if (!preferences) return true;
    const channelKey = channel === 'in-app' ? 'inApp' : channel;
    return preferences.channels[channelKey];
  };

  // Get status icon
  const getStatusIcon = (status: DeliveryStatus['status']) => {
    switch (status) {
      case 'sending':
        return <Loader2 size={16} className="animate-spin text-blue-600" />;
      case 'success':
        return <Check size={16} className="text-green-600" />;
      case 'failed':
        return <X size={16} className="text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <Send size={20} className="text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Multi-Channel Delivery</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Send notifications through multiple channels simultaneously
        </p>
      </div>

      {/* Channel Selection */}
      <div className="p-4 border-b">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Delivery Channels
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(
            Object.entries(channelConfig) as [
              NotificationChannel,
              (typeof channelConfig)['in-app'],
            ][]
          ).map(([channel, config]) => {
            const isSelected = selectedChannels.has(channel);
            const isEnabled = isChannelEnabled(channel);

            return (
              <button
                key={channel}
                onClick={() => toggleChannel(channel)}
                disabled={!isEnabled}
                className={`
                    p-3 rounded-lg border-2 text-left transition-all
                    ${
                      isSelected
                        ? `${config.color} border-current`
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }
                    ${!isEnabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
              >
                <div className="flex items-center gap-2">
                  <span className={isSelected ? '' : 'text-gray-400'}>{config.icon}</span>
                  <span className={`font-medium ${isSelected ? '' : 'text-gray-700'}`}>
                    {config.label}
                  </span>
                  {isSelected && <Check size={16} className="ml-auto" />}
                </div>
                <p className="text-xs mt-1 text-gray-500">{config.description}</p>
                {!isEnabled && (
                  <p className="text-xs mt-1 text-orange-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Disabled in preferences
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Message Composition */}
      <div className="p-4 border-b space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notification Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your notification message..."
            rows={3}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as NotificationCategory)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="system">System</option>
              <option value="course_update">Course Update</option>
              <option value="message">Message</option>
              <option value="achievement">Achievement</option>
              <option value="reminder">Reminder</option>
              <option value="social">Social</option>
              <option value="payment">Payment</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as NotificationPriority)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Delivery Status */}
      {deliveryStatuses.length > 0 && (
        <div className="p-4 border-b bg-gray-50">
          <label className="block text-sm font-medium text-gray-700 mb-3">Delivery Status</label>
          <div className="space-y-2">
            {deliveryStatuses.map((status) => {
              const config = channelConfig[status.channel];
              return (
                <div
                  key={status.channel}
                  className="flex items-center justify-between p-2 bg-white rounded border"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">{config.icon}</span>
                    <span className="text-sm font-medium">{config.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.status)}
                    <span
                      className={`text-xs ${
                        status.status === 'success'
                          ? 'text-green-600'
                          : status.status === 'failed'
                          ? 'text-red-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {status.message || 'Pending'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Send Button */}
      <div className="p-4">
        <button
          onClick={handleSend}
          disabled={isSending || !message.trim() || selectedChannels.size === 0}
          className={`
            w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium
            transition-colors
            ${
              isSending || !message.trim() || selectedChannels.size === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          {isSending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send size={18} />
              Send to {selectedChannels.size} channel{selectedChannels.size !== 1 ? 's' : ''}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
