// 🎯 Enhanced Notification Service - Industry-Standard with Firestore Integration
// This service provides persistent, cross-device notification storage while preserving all existing functionality

import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { 
  addNotificationToHistory as addToLocalHistory,
  getNotificationHistory as getLocalHistory,
  markNotificationAsRead as markLocalAsRead,
  markAllNotificationsAsRead as markAllLocalAsRead,
  deleteNotification as deleteLocalNotification,
  clearAllNotifications as clearAllLocalNotifications,
  getUnreadNotificationCount as getLocalUnreadCount
} from './notificationHistory';

// Collection for storing notifications in Firestore
const NOTIFICATIONS_COLLECTION = 'user_notifications';

/**
 * Enhanced notification object structure
 */
export const createNotificationObject = (notification) => {
  return {
    id: notification.id || generateNotificationId(),
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    priority: notification.priority || 'medium',
    read: notification.read || false,
    data: notification.data || {},
    source: notification.source || 'app', // 'app', 'push', 'scheduled'
    timestamp: notification.timestamp || Date.now(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
};

/**
 * Save notification to both Firestore and local storage (hybrid approach)
 */
export const saveNotification = async (notification, userId) => {
  try {
    // Create enhanced notification object
    const enhancedNotification = createNotificationObject({
      ...notification,
      userId
    });
    
    // Save to Firestore for persistence and cross-device sync
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, enhancedNotification.id);
    await setDoc(notificationRef, enhancedNotification);
    
    // Also save to local storage for immediate access (existing functionality preserved)
    addToLocalHistory(enhancedNotification);
    
    console.log('✅ Notification saved to both Firestore and local storage:', enhancedNotification.id);
    return enhancedNotification;
    
  } catch (error) {
    console.error('❌ Failed to save notification:', error);
    
    // Fallback to local storage only (preserving existing functionality)
    console.log('🔄 Falling back to local storage only');
    return addToLocalHistory(notification);
  }
};

/**
 * Get notifications from Firestore with real-time updates
 */
export const getNotificationsWithRealtime = (userId, callback) => {
  try {
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = [];
      snapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Update local storage to keep it in sync
      notifications.forEach(notification => {
        addToLocalHistory(notification);
      });
      
      // Call the callback with updated notifications
      if (callback) {
        callback(notifications);
      }
      
      console.log('🔄 Real-time notifications update:', notifications.length);
    }, (error) => {
      console.error('❌ Real-time listener error:', error);
      // Fallback to local storage
      if (callback) {
        callback(getLocalHistory());
      }
    });
    
    return unsubscribe; // Return unsubscribe function
    
  } catch (error) {
    console.error('❌ Failed to set up real-time listener:', error);
    // Fallback to local storage
    if (callback) {
      callback(getLocalHistory());
    }
    return null;
  }
};

/**
 * Mark notification as read in both Firestore and local storage
 */
export const markNotificationAsRead = async (notificationId, userId) => {
  try {
    // Update in Firestore
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await setDoc(notificationRef, { 
      read: true, 
      updatedAt: serverTimestamp() 
    }, { merge: true });
    
    // Update in local storage (preserving existing functionality)
    markLocalAsRead(notificationId);
    
    console.log('✅ Notification marked as read in both systems:', notificationId);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to mark as read in Firestore:', error);
    
    // Fallback to local storage only
    return markLocalAsRead(notificationId);
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    // Get all unread notifications
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(q);
    const batch = [];
    
    snapshot.forEach((doc) => {
      batch.push(setDoc(doc.ref, { 
        read: true, 
        updatedAt: serverTimestamp() 
      }, { merge: true }));
    });
    
    // Update all in Firestore
    await Promise.all(batch);
    
    // Update local storage (preserving existing functionality)
    markAllLocalAsRead();
    
    console.log('✅ All notifications marked as read in both systems');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to mark all as read in Firestore:', error);
    
    // Fallback to local storage only
    return markAllLocalAsRead();
  }
};

/**
 * Delete notification from both systems
 */
export const deleteNotification = async (notificationId, userId) => {
  try {
    // Delete from Firestore
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await deleteDoc(notificationRef);
    
    // Delete from local storage (preserving existing functionality)
    deleteLocalNotification(notificationId);
    
    console.log('✅ Notification deleted from both systems:', notificationId);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to delete from Firestore:', error);
    
    // Fallback to local storage only
    return deleteLocalNotification(notificationId);
  }
};

/**
 * Clear all notifications for a user
 */
export const clearAllNotifications = async (userId) => {
  try {
    // Get all user notifications
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(notificationsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    // Delete all from Firestore
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    // Clear local storage (preserving existing functionality)
    clearAllLocalNotifications();
    
    console.log('✅ All notifications cleared from both systems');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to clear from Firestore:', error);
    
    // Fallback to local storage only
    return clearAllLocalNotifications();
  }
};

/**
 * Get unread count from both systems (hybrid approach)
 */
export const getUnreadNotificationCount = (userId) => {
  try {
    // Try to get from local storage first (fast)
    const localCount = getLocalUnreadCount();
    
    // Return local count immediately for UI responsiveness
    return localCount;
    
  } catch (error) {
    console.error('❌ Failed to get unread count:', error);
    return 0;
  }
};

/**
 * Sync local storage with Firestore (for cross-device consistency)
 */
export const syncNotificationsWithFirestore = async (userId) => {
  try {
    console.log('🔄 Starting notification sync with Firestore...');
    
    // Get notifications from Firestore
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    
    const snapshot = await getDocs(q);
    const firestoreNotifications = [];
    
    snapshot.forEach((doc) => {
      firestoreNotifications.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Update local storage with Firestore data
    firestoreNotifications.forEach(notification => {
      addToLocalHistory(notification);
    });
    
    console.log('✅ Notification sync completed:', firestoreNotifications.length);
    return firestoreNotifications;
    
  } catch (error) {
    console.error('❌ Notification sync failed:', error);
    return getLocalHistory(); // Fallback to local
  }
};

/**
 * Generate unique notification ID
 */
const generateNotificationId = () => {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Handle incoming push notifications from OneSignal
 */
export const handleIncomingPushNotification = async (notification, userId) => {
  try {
    console.log('🔔 Processing incoming push notification:', notification);
    
    // Convert OneSignal notification to our format
    const processedNotification = {
      id: notification.id || generateNotificationId(),
      userId: userId,
      type: 'push_notification',
      title: notification.headings?.en || 'New Notification',
      message: notification.contents?.en || 'You have a new notification',
      priority: 'medium',
      read: false,
      data: notification.data || {},
      source: 'push',
      timestamp: Date.now(),
      oneSignalId: notification.id
    };
    
    // Save to both systems
    const savedNotification = await saveNotification(processedNotification, userId);
    
    console.log('✅ Push notification processed and saved:', savedNotification.id);
    return savedNotification;
    
  } catch (error) {
    console.error('❌ Failed to process push notification:', error);
    return null;
  }
};

// Export all functions for backward compatibility
export {
  addToLocalHistory as addNotificationToHistory,
  getLocalHistory as getNotificationHistory,
  getLocalUnreadCount as getUnreadCount
};

// Export constants and types
export { 
  NOTIFICATION_TYPES, 
  NOTIFICATION_PRIORITY,
  formatNotificationTime,
  getNotificationIcon,
  getNotificationColor
} from './notificationHistory';
