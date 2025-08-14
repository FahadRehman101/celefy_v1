// 🎯 Notification History Service - Elegant & User-Friendly
// This service manages notification history with local storage for fast, reliable access

/**
 * Notification types for categorization
 */
export const NOTIFICATION_TYPES = {
  BIRTHDAY_ADDED: 'birthday_added',
  BIRTHDAY_REMINDER_7D: 'birthday_reminder_7d',
  BIRTHDAY_REMINDER_1D: 'birthday_reminder_1d',
  BIRTHDAY_TODAY: 'birthday_today',
  SYSTEM_INFO: 'system_info',
  SUCCESS: 'success'
};

/**
 * Notification priority levels
 */
export const NOTIFICATION_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

/**
 * Store a new notification in history
 */
export const addNotificationToHistory = (notification) => {
  try {
    const history = getNotificationHistory();
    
    // Create notification object with metadata
    const notificationEntry = {
      id: generateNotificationId(),
      timestamp: Date.now(),
      read: false,
      ...notification
    };
    
    // Add to beginning of array (newest first)
    history.unshift(notificationEntry);
    
    // Keep only last 100 notifications to prevent storage bloat
    if (history.length > 100) {
      history.splice(100);
    }
    
    // Save to localStorage
    localStorage.setItem('celefy_notification_history', JSON.stringify(history));
    
    console.log('📝 Notification added to history:', notificationEntry);
    return notificationEntry;
    
  } catch (error) {
    console.error('❌ Failed to add notification to history:', error);
    return null;
  }
};

/**
 * Get all notifications from history
 */
export const getNotificationHistory = () => {
  try {
    const stored = localStorage.getItem('celefy_notification_history');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('❌ Failed to get notification history:', error);
    return [];
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = (notificationId) => {
  try {
    const history = getNotificationHistory();
    const notification = history.find(n => n.id === notificationId);
    
    if (notification) {
      notification.read = true;
      localStorage.setItem('celefy_notification_history', JSON.stringify(history));
      console.log('✅ Notification marked as read:', notificationId);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Failed to mark notification as read:', error);
    return false;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = () => {
  try {
    const history = getNotificationHistory();
    history.forEach(notification => {
      notification.read = true;
    });
    
    localStorage.setItem('celefy_notification_history', JSON.stringify(history));
    console.log('✅ All notifications marked as read');
    return true;
  } catch (error) {
    console.error('❌ Failed to mark all notifications as read:', error);
    return false;
  }
};

/**
 * Delete a specific notification
 */
export const deleteNotification = (notificationId) => {
  try {
    const history = getNotificationHistory();
    const filteredHistory = history.filter(n => n.id !== notificationId);
    
    if (filteredHistory.length !== history.length) {
      localStorage.setItem('celefy_notification_history', JSON.stringify(filteredHistory));
      console.log('🗑️ Notification deleted:', notificationId);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Failed to delete notification:', error);
    return false;
  }
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = () => {
  try {
    localStorage.removeItem('celefy_notification_history');
    console.log('🗑️ All notifications cleared');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear all notifications:', error);
    return false;
  }
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = () => {
  try {
    const history = getNotificationHistory();
    return history.filter(n => !n.read).length;
  } catch (error) {
    console.error('❌ Failed to get unread count:', error);
    return 0;
  }
};

/**
 * Get notifications by type
 */
export const getNotificationsByType = (type) => {
  try {
    const history = getNotificationHistory();
    return history.filter(n => n.type === type);
  } catch (error) {
    console.error('❌ Failed to get notifications by type:', error);
    return [];
  }
};

/**
 * Get recent notifications (last 24 hours)
 */
export const getRecentNotifications = (hours = 24) => {
  try {
    const history = getNotificationHistory();
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    return history.filter(n => n.timestamp > cutoffTime);
  } catch (error) {
    console.error('❌ Failed to get recent notifications:', error);
    return [];
  }
};

/**
 * Generate unique notification ID
 */
const generateNotificationId = () => {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Format notification timestamp for display
 */
export const formatNotificationTime = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
};

/**
 * Get notification icon based on type
 */
export const getNotificationIcon = (type) => {
  const icons = {
    [NOTIFICATION_TYPES.BIRTHDAY_ADDED]: '🎉',
    [NOTIFICATION_TYPES.BIRTHDAY_REMINDER_7D]: '📅',
    [NOTIFICATION_TYPES.BIRTHDAY_REMINDER_1D]: '⏰',
    [NOTIFICATION_TYPES.BIRTHDAY_TODAY]: '🎂',
    [NOTIFICATION_TYPES.SYSTEM_INFO]: 'ℹ️',
    [NOTIFICATION_TYPES.SUCCESS]: '✅'
  };
  
  return icons[type] || '🔔';
};

/**
 * Get notification color based on priority
 */
export const getNotificationColor = (priority) => {
  const colors = {
    [NOTIFICATION_PRIORITY.LOW]: 'text-gray-500',
    [NOTIFICATION_PRIORITY.MEDIUM]: 'text-blue-500',
    [NOTIFICATION_PRIORITY.HIGH]: 'text-orange-500',
    [NOTIFICATION_PRIORITY.URGENT]: 'text-red-500'
  };
  
  return colors[priority] || 'text-gray-500';
};

/**
 * Populate sample notifications for testing (remove in production)
 */
export const populateSampleNotifications = () => {
  try {
    const existingHistory = getNotificationHistory();
    if (existingHistory.length > 0) {
      console.log('📝 Sample notifications already exist, skipping...');
      return;
    }

    const sampleNotifications = [
      {
        type: NOTIFICATION_TYPES.BIRTHDAY_ADDED,
        priority: NOTIFICATION_PRIORITY.MEDIUM,
        title: 'Birthday Added Successfully! 🎉',
        message: "John's birthday has been added to your celebration list!",
        data: {
          birthdayId: 'sample_1',
          birthdayName: 'John',
          birthdayDate: '1990-05-15'
        }
      },
      {
        type: NOTIFICATION_TYPES.BIRTHDAY_REMINDER_7D,
        priority: NOTIFICATION_PRIORITY.MEDIUM,
        title: 'Birthday Reminder (7 days) 📅',
        message: "Time to plan something special! Sarah's birthday is in 7 days.",
        data: {
          birthdayId: 'sample_2',
          birthdayName: 'Sarah',
          scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      },
      {
        type: NOTIFICATION_TYPES.BIRTHDAY_REMINDER_1D,
        priority: NOTIFICATION_PRIORITY.HIGH,
        title: 'Birthday Reminder (1 day) ⏰',
        message: "Don't forget: Mike's birthday is tomorrow!",
        data: {
          birthdayId: 'sample_3',
          birthdayName: 'Mike',
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
      },
      {
        type: NOTIFICATION_TYPES.BIRTHDAY_TODAY,
        priority: NOTIFICATION_PRIORITY.URGENT,
        title: 'Birthday Today! 🎂',
        message: "Happy Birthday! 🎉🎂🎁 It's Emma's special day today!",
        data: {
          birthdayId: 'sample_4',
          birthdayName: 'Emma',
          scheduledFor: new Date().toISOString()
        }
      }
    ];

    sampleNotifications.forEach(notification => {
      addNotificationToHistory(notification);
    });

    console.log('✅ Sample notifications populated for testing');
  } catch (error) {
    console.error('❌ Failed to populate sample notifications:', error);
  }
};
