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
      const target = event.target as HTMLElement;
      // Close only if clicking outside AND not clicking the trigger button
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target as Node) &&
        !target.closest('#notification-trigger')
      ) {
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

  return (
    <div
      ref={dropdownRef}
      className={`
        z-50 bg-dark-950 border-dark-800 shadow-xl overflow-hidden
        
        /* Mobile: Full screen fixed below header */
        fixed inset-x-0 top-16 bottom-16 border-t md:border-t-0
        
        /* Desktop: Dropdown */
        md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-96 md:h-auto md:max-h-[32rem] md:rounded-xl md:border
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 md:py-3 border-b border-dark-800 bg-dark-950/95 backdrop-blur sticky top-0 z-10 w-full">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          Notifications
          {!loading && notifications.some(n => !n.read) && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-black bg-primary-500 rounded-full">
              {notifications.filter(n => !n.read).length}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-4">
          {!loading && notifications.some(n => !n.read) && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs font-semibold text-primary-500 hover:text-primary-400 transition-colors uppercase tracking-wider"
            >
              Mark all read
            </button>
          )}
          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto h-full md:max-h-96 bg-dark-900/50">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-dark-600" />
            </div>
            <p className="text-gray-300 font-medium">No new notifications</p>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">
              When you interact with the community, updates will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-dark-800">
            {notifications.map((notification) => {
              const content = getNotificationContent(notification);
              const date = new Date(notification.created_at);
              const timeString = !isNaN(date.getTime())
                ? formatDistanceToNow(date, { addSuffix: true })
                : '';

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`
                    px-4 py-4 hover:bg-dark-800/80 transition-colors cursor-pointer relative group
                    ${!notification.read ? 'bg-dark-800/20' : ''}
                  `}
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
                  <div className="flex gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${!notification.read ? 'bg-primary-500/10' : 'bg-dark-800'
                      }`}>
                      {content.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <p className={`text-sm leading-tight ${!notification.read ? 'text-white font-semibold' : 'text-gray-300'}`}>
                          {content.primaryText}
                        </p>
                        <span className="text-[10px] text-gray-500 whitespace-nowrap pt-0.5">
                          {timeString}
                        </span>
                      </div>

                      {content.secondaryText && (
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {content.secondaryText}
                        </p>
                      )}
                    </div>

                    {!notification.read && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary-500 rounded-full" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;