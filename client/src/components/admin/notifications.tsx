'use client';

import { useState } from 'react';
import { Bell, X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useAdmin } from '@/contexts/admin-context';

interface NotificationItemProps {
  notification: {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
  };
  onMarkRead: (id: string) => void;
}

function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case 'success':
        return 'border-l-green-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'error':
        return 'border-l-red-500';
      default:
        return 'border-l-blue-500';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div
      className={`border-l-4 ${getBorderColor()} bg-surface p-4 ${
        !notification.read ? 'bg-opacity-100' : 'bg-opacity-50'
      } transition-all duration-200`}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h4 className={`text-sm font-medium ${
              !notification.read ? 'text-text-primary' : 'text-text-secondary'
            }`}>
              {notification.title}
            </h4>
            <button
              onClick={() => onMarkRead(notification.id)}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className={`text-sm mt-1 ${
            !notification.read ? 'text-text-secondary' : 'text-text-muted'
          }`}>
            {notification.message}
          </p>
          <p className="text-xs text-text-muted mt-2">
            {formatTime(notification.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminNotifications() {
  const { state, actions } = useAdmin();
  const [isOpen, setIsOpen] = useState(false);

  const { notifications, unreadNotificationCount } = state;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-text-secondary hover:text-text-primary transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadNotificationCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-surface border border-border-default rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-border-default">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                {unreadNotificationCount > 0 && (
                  <span className="text-sm text-text-secondary">
                    {unreadNotificationCount} unread
                  </span>
                )}
                <button
                  onClick={() => {
                    actions.clearNotifications();
                    setIsOpen(false);
                  }}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Clear all
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-text-secondary">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border-default">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={actions.markNotificationRead}
                  />
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-4 border-t border-border-default text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}