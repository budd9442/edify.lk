import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Heart, MessageCircle, UserPlus, CheckCircle, XCircle, Award, AtSign, BookMarked as MarkAsRead, Trash2 } from 'lucide-react';
import { Notification } from '../../mock-data/strapiBlocks';
import { notificationService } from '../../services/notificationService';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
  onUnreadCountChange: (count: number) => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  unreadCount,
  onUnreadCountChange
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications('1');
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      onUnreadCountChange(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead('1');
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      onUnreadCountChange(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        onUnreadCountChange(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-red-400" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-400" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-green-400" />;
      case 'article_approved':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'article_rejected':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'badge_earned':
        return <Award className="w-4 h-4 text-yellow-400" />;
      case 'mention':
        return <AtSign className="w-4 h-4 text-purple-400" />;
      default:
        return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        className="absolute right-0 mt-2 w-96 bg-dark-900 rounded-lg shadow-xl border border-dark-800 z-50 max-h-96 overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-dark-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Loading notifications...</p>
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-dark-800">
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 hover:bg-dark-800 transition-colors group ${
                    !notification.read ? 'bg-primary-900/10' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-white mb-1">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-400 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-1 text-gray-400 hover:text-primary-400 transition-colors"
                              title="Mark as read"
                            >
                              <MarkAsRead className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary-500 rounded-full absolute right-2 top-4" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No notifications yet</p>
              <p className="text-gray-500 text-sm mt-1">
                We'll notify you when something happens
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-dark-800 bg-dark-800/50">
            <button className="w-full text-center text-sm text-primary-400 hover:text-primary-300 transition-colors">
              View all notifications
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationDropdown;