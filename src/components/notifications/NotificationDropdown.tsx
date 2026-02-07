import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Heart, MessageCircle, UserPlus, CheckCircle, XCircle, Award, AtSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationItem, notificationsService } from '../../services/notificationsService';

interface NotificationDropdownProps {
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  onClose
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
    const unsubscribe = notificationsService.subscribe((n) => {
      setNotifications(prev => [n, ...prev]);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationsService.list();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const getNotificationContent = (notification: NotificationItem) => {
    switch (notification.type) {
      case 'publish':
        return {
          icon: <Bell className="w-4 h-4 text-blue-400" />,
          primaryText: notification.title || 'New article published',
          secondaryText: notification.message,
          showDot: !notification.read
        };
      case 'like':
        return {
          icon: <Heart className="w-4 h-4 text-red-400" />,
          primaryText: notification.title || 'Someone liked your article',
          secondaryText: notification.message,
          showDot: !notification.read
        };
      case 'comment':
        return {
          icon: <MessageCircle className="w-4 h-4 text-blue-400" />,
          primaryText: notification.title || 'New comment',
          secondaryText: notification.message,
          showDot: !notification.read
        };
      case 'follow':
        return {
          icon: <UserPlus className="w-4 h-4 text-green-400" />,
          primaryText: notification.title || 'New follower',
          secondaryText: notification.message,
          showDot: !notification.read
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-400" />,
          primaryText: notification.title || 'Success',
          secondaryText: notification.message,
          showDot: !notification.read
        };
      case 'error':
        return {
          icon: <XCircle className="w-4 h-4 text-red-400" />,
          primaryText: notification.title || 'Error',
          secondaryText: notification.message,
          showDot: !notification.read
        };
      case 'award':
        return {
          icon: <Award className="w-4 h-4 text-yellow-400" />,
          primaryText: notification.title || 'Achievement unlocked',
          secondaryText: notification.message,
          showDot: !notification.read
        };
      case 'mention':
        return {
          icon: <AtSign className="w-4 h-4 text-purple-400" />,
          primaryText: notification.title || 'You were mentioned',
          secondaryText: notification.message,
          showDot: !notification.read
        };
      default:
        return {
          icon: <Bell className="w-4 h-4 text-gray-400" />,
          primaryText: notification.title || 'Notification',
          secondaryText: notification.message,
          showDot: !notification.read
        };
    }
  };

  if (loading) {
    return (
      <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] bg-dark-900 border border-dark-800 rounded-lg shadow-lg py-4 z-50">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] bg-dark-900 border border-dark-800 rounded-lg shadow-lg py-4 z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-3 border-b border-dark-800">
        <h3 className="text-lg font-semibold text-white">Notifications</h3>
        {notifications.some(n => !n.read) && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-primary-400 hover:text-primary-300 transition-colors font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No notifications yet</p>
            <p className="text-sm text-gray-500 mt-1">
              We'll notify you when something happens
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {notifications.map((notification) => {
              const content = getNotificationContent(notification);
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`px-4 py-3 hover:bg-dark-800 transition-colors cursor-pointer border-l-2 ${
                    content.showDot ? 'border-primary-500 bg-dark-800/30' : 'border-transparent'
                  }`}
                  onClick={() => {
                    if (!notification.read) {
                      handleMarkAsRead(notification.id);
                    }
                    if (notification.link) {
                      navigate(notification.link);
                    }
                    onClose();
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {content.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="space-y-1">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white leading-tight">
                              {content.primaryText}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {content.showDot && (
                              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                            )}
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        {content.secondaryText && (
                          <p className="text-xs text-gray-400 leading-tight">
                            {content.secondaryText}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {/* Removed 'View all notifications' per request */}
    </div>
  );
};

export default NotificationDropdown;