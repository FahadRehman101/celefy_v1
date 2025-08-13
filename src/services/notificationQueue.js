/**
 * Notification Queue Service
 * Handles offline birthday notification scheduling
 */

import { scheduleBirthdayReminders } from './notificationScheduler';

const QUEUE_KEY = 'celefy_notification_queue';
const MAX_RETRIES = 3;

/**
 * Add notification scheduling to queue (for offline processing)
 */
export const queueNotificationScheduling = async (birthdayId, birthdayData, userId) => {
  try {
    const queue = getQueue();
    
    // Check if this birthday is already queued
    const existingIndex = queue.findIndex(item => item.birthdayId === birthdayId);
    
    const queueItem = {
      id: `${birthdayId}_${Date.now()}`, // Unique identifier
      birthdayId,
      birthdayData: {
        id: birthdayId,
        name: birthdayData.name,
        date: birthdayData.date,
        relation: birthdayData.relation,
        avatar: birthdayData.avatar
      },
      userId,
      timestamp: new Date().toISOString(),
      retries: 0,
      status: 'pending'
    };
    
    if (existingIndex >= 0) {
      // Update existing item
      queue[existingIndex] = queueItem;
      console.log(`🔄 Updated queued notification for ${birthdayData.name}`);
    } else {
      // Add new item
      queue.push(queueItem);
      console.log(`➕ Queued notification scheduling for ${birthdayData.name}`);
    }
    
    saveQueue(queue);
    
    return {
      success: true,
      queuedId: queueItem.id,
      message: 'Notification scheduling queued for when you\'re online'
    };
  } catch (error) {
    console.error('❌ Failed to queue notification:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Process all queued notifications (when back online)
 */
export const processNotificationQueue = async () => {
  // Check if we're online
  if (!navigator.onLine) {
    console.log('📴 Still offline, skipping queue processing');
    return { success: false, reason: 'offline' };
  }
  
  const queue = getQueue();
  
  if (queue.length === 0) {
    console.log('✅ Notification queue is empty');
    return { success: true, processed: 0, failed: 0 };
  }
  
  console.log(`🔄 Processing ${queue.length} queued notifications...`);
  
  let processed = 0;
  let failed = 0;
  const remainingQueue = [];
  
  for (const item of queue) {
    try {
      console.log(`📤 Processing notification for ${item.birthdayData.name}...`);
      
      // Attempt to schedule the notification
      const result = await scheduleBirthdayReminders(item.birthdayData, item.userId);
      
      if (result.success) {
        console.log(`✅ Successfully scheduled notifications for ${item.birthdayData.name}`);
        processed++;
        
        // Mark as completed - don't add back to queue
        continue;
      } else {
        throw new Error(result.error || 'Unknown scheduling error');
      }
      
    } catch (error) {
      console.error(`❌ Failed to schedule notifications for ${item.birthdayData.name}:`, error);
      
      // Increment retry count
      const updatedItem = {
        ...item,
        retries: item.retries + 1,
        lastError: error.message,
        lastAttempt: new Date().toISOString()
      };
      
      // Only retry up to MAX_RETRIES times
      if (updatedItem.retries < MAX_RETRIES) {
        remainingQueue.push(updatedItem);
        console.log(`⏳ Will retry ${item.birthdayData.name} (attempt ${updatedItem.retries + 1}/${MAX_RETRIES})`);
      } else {
        console.error(`🚫 Giving up on ${item.birthdayData.name} after ${MAX_RETRIES} failed attempts`);
        failed++;
      }
    }
  }
  
  // Save the remaining queue (items that need retry)
  saveQueue(remainingQueue);
  
  const result = {
    success: failed === 0,
    processed,
    failed,
    remaining: remainingQueue.length,
    total: queue.length
  };
  
  console.log('📊 Queue processing complete:', result);
  
  return result;
};

/**
 * Get specific queued item by birthday ID
 */
export const getQueuedItem = (birthdayId) => {
  const queue = getQueue();
  return queue.find(item => item.birthdayId === birthdayId);
};

/**
 * Remove specific item from queue (if birthday is deleted)
 */
export const removeFromQueue = (birthdayId) => {
  const queue = getQueue();
  const filteredQueue = queue.filter(item => item.birthdayId !== birthdayId);
  saveQueue(filteredQueue);
  
  console.log(`🗑️ Removed ${birthdayId} from notification queue`);
  return filteredQueue.length;
};

/**
 * Get queue statistics for debugging
 */
export const getQueueStats = () => {
  const queue = getQueue();
  
  const stats = {
    total: queue.length,
    pending: queue.filter(item => item.retries === 0).length,
    retrying: queue.filter(item => item.retries > 0 && item.retries < MAX_RETRIES).length,
    oldestItem: queue.length > 0 ? Math.min(...queue.map(item => new Date(item.timestamp).getTime())) : null
  };
  
  if (stats.oldestItem) {
    stats.oldestAge = Math.floor((Date.now() - stats.oldestItem) / (1000 * 60)); // minutes
  }
  
  return stats;
};

/**
 * Clear entire queue (for debugging/reset)
 */
export const clearQueue = () => {
  localStorage.removeItem(QUEUE_KEY);
  console.log('🧹 Notification queue cleared');
};

// Helper functions
const getQueue = () => {
  try {
    const stored = localStorage.getItem(QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading notification queue:', error);
    return [];
  }
};

const saveQueue = (queue) => {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error saving notification queue:', error);
  }
};