// 🎯 Notification Center Component - Elegant & User-Friendly
// Beautiful modal displaying notification history with smooth interactions

import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, CheckCheck } from 'lucide-react';
import Modal from './Modal';
import { 
  getNotificationHistory, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  formatNotificationTime,
  getNotificationIcon,
  getNotificationColor,
  NOTIFICATION_TYPES,
  getNotificationsWithRealtime
} from '@/services/enhancedNotificationService';

const NotificationCenter = ({ isOpen, onClose, userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [isLoading, setIsLoading] = useState(false);
  const [unsubscribe, setUnsubscribe] = useState(null);

  // Load notifications when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      // CRITICAL FIX: Set up real-time listener for live updates
      const unsubscribeRealtime = getNotificationsWithRealtime(userId, (updatedNotifications) => {
        setNotifications(updatedNotifications);
      });
      
      if (unsubscribeRealtime) {
        setUnsubscribe(() => unsubscribeRealtime);
      }
      
      // Also load initial notifications
      loadNotifications();
    }
    
    return () => {
      // Clean up real-time listener when modal closes
      if (unsubscribe) {
        unsubscribe();
        setUnsubscribe(null);
      }
    };
  }, [isOpen, filter, userId]);

  const loadNotifications = () => {
    setIsLoading(true);
    try {
      const allNotifications = getNotificationHistory();
      
      let filteredNotifications = allNotifications;
      if (filter === 'unread') {
        filteredNotifications = allNotifications.filter(n => !n.read);
      } else if (filter === 'read') {
        filteredNotifications = allNotifications.filter(n => n.read);
      }
      
      setNotifications(filteredNotifications);
    } catch (error) {
      console.error('❌ Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const success = await markNotificationAsRead(notificationId, userId);
      if (success) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
      }
    } catch (error) {
      console.error('❌ Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const success = await markAllNotificationsAsRead(userId);
      if (success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('❌ Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      const success = await deleteNotification(notificationId, userId);
      if (success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('❌ Failed to delete notification:', error);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      try {
        const success = await clearAllNotifications(userId);
        if (success) {
          setNotifications([]);
        }
      } catch (error) {
        console.error('❌ Failed to clear all notifications:', error);
      }
    }
  };

  const getFilteredCount = () => {
    const allNotifications = getNotificationHistory();
    if (filter === 'unread') return allNotifications.filter(n => !n.read).length;
    if (filter === 'read') return allNotifications.filter(n => n.read).length;
    return allNotifications.length;
  };

  const getNotificationTitle = (type) => {
    const titles = {
      [NOTIFICATION_TYPES.BIRTHDAY_ADDED]: 'Birthday Added',
      [NOTIFICATION_TYPES.BIRTHDAY_REMINDER_7D]: 'Birthday Reminder (7 days)',
      [NOTIFICATION_TYPES.BIRTHDAY_REMINDER_1D]: 'Birthday Reminder (1 day)',
      [NOTIFICATION_TYPES.BIRTHDAY_TODAY]: 'Birthday Today!',
      [NOTIFICATION_TYPES.SYSTEM_INFO]: 'System Information',
      [NOTIFICATION_TYPES.SUCCESS]: 'Success'
    };
    return titles[type] || 'Notification';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">🔔</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Notifications
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getFilteredCount()} notification{getFilteredCount() !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { key: 'all', label: 'All', count: getNotificationHistory().length },
            { key: 'unread', label: 'Unread', count: getNotificationHistory().filter(n => !n.read).length },
            { key: 'read', label: 'Read', count: getNotificationHistory().filter(n => n.read).length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`
                flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                ${filter === tab.key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleMarkAllAsRead}
            disabled={notifications.filter(n => !n.read).length === 0}
            className="
              flex items-center space-x-2 px-4 py-2
              bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300
              text-white text-sm font-medium rounded-lg
              transition-colors duration-200 disabled:cursor-not-allowed
            "
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All Read</span>
          </button>
          
          <button
            onClick={handleClearAll}
            disabled={notifications.length === 0}
            className="
              flex items-center space-x-2 px-4 py-2
              bg-red-500 hover:bg-red-600 disabled:bg-gray-300
              text-white text-sm font-medium rounded-lg
              transition-colors duration-200 disabled:cursor-not-allowed
            "
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto space-y-3">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔕</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No notifications
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {filter === 'all' 
                  ? "You're all caught up! No notifications yet."
                  : filter === 'unread'
                  ? "No unread notifications."
                  : "No read notifications."
                }
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`
                  group relative p-4 rounded-lg border transition-all duration-200
                  ${notification.read
                    ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    : 'bg-white dark:bg-gray-900 border-pink-200 dark:border-pink-800 shadow-sm'
                  }
                  hover:shadow-md hover:border-pink-300 dark:hover:border-pink-600
                `}
              >
                {/* Notification Content */}
                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-lg
                    ${notification.read ? 'bg-gray-200 dark:bg-gray-700' : 'bg-pink-100 dark:bg-pink-900'}
                  `}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className={`
                          text-sm font-medium mb-1
                          ${notification.read 
                            ? 'text-gray-600 dark:text-gray-400' 
                            : 'text-gray-900 dark:text-white'
                          }
                        `}>
                          {getNotificationTitle(notification.type)}
                        </h4>
                        <p className={`
                          text-sm mb-2
                          ${notification.read 
                            ? 'text-gray-500 dark:text-gray-500' 
                            : 'text-gray-700 dark:text-gray-300'
                          }
                        `}>
                          {notification.message || notification.body || 'No message content'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {formatNotificationTime(notification.timestamp)}
                        </p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="
                              p-1.5 rounded-full hover:bg-green-100 dark:hover:bg-green-900
                              text-green-600 dark:text-green-400 transition-colors
                            "
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="
                            p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900
                            text-red-600 dark:text-red-400 transition-colors
                          "
                          title="Delete notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Unread Indicator */}
                {!notification.read && (
                  <div className="absolute top-3 right-3 w-2 h-2 bg-pink-500 rounded-full" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

export default NotificationCenter;
