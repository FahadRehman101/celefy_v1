// src/services/notificationScheduler.js
// Complete notification scheduler with full cancellation support
import { getOneSignalConfig, isOneSignalConfigured } from '@/config/onesignal';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

// Collection for storing notification metadata
const NOTIFICATION_METADATA_COLLECTION = 'notification_metadata';

// Generate proper UUID for OneSignal idempotency
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Store notification IDs for future cancellation
 */
const storeNotificationMetadata = async (birthdayId, notificationIds) => {
  try {
    const metadataRef = doc(db, NOTIFICATION_METADATA_COLLECTION, birthdayId);
    await setDoc(metadataRef, {
      birthdayId,
      notificationIds,
      createdAt: new Date().toISOString(),
      status: 'scheduled'
    });
    console.log('✅ Notification metadata stored successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to store notification metadata:', error);
    // Don't throw - continue even if metadata storage fails
    return false;
  }
};

/**
 * Cancel all scheduled notifications for a birthday
 * This is called when a birthday is deleted
 */
export const cancelScheduledNotifications = async (birthdayId) => {
  console.log('🚫 === CANCELING SCHEDULED NOTIFICATIONS ===');
  console.log('🎂 Birthday ID:', birthdayId);
  
  if (!birthdayId) {
    console.error('❌ No birthday ID provided for cancellation');
    return { success: false, error: 'No birthday ID' };
  }
  
  try {
    // Get stored notification IDs from Firestore
    const metadataRef = doc(db, NOTIFICATION_METADATA_COLLECTION, birthdayId);
    const metadataDoc = await getDoc(metadataRef);
    
    if (!metadataDoc.exists()) {
      console.log('⚠️ No notification metadata found - might be an old birthday');
      // Still return success as there's nothing to cancel
      return { success: true, message: 'No notifications to cancel', canceledCount: 0 };
    }
    
    const metadata = metadataDoc.data();
    const notificationIds = metadata.notificationIds || [];
    
    if (notificationIds.length === 0) {
      console.log('⚠️ No notification IDs found in metadata');
      return { success: true, message: 'No notifications to cancel', canceledCount: 0 };
    }
    
    console.log(`📋 Found ${notificationIds.length} notifications to cancel`);
    
    const config = getOneSignalConfig();
    let canceledCount = 0;
    let failedCount = 0;
    
    // Cancel each notification using OneSignal REST API
    for (const notificationId of notificationIds) {
      try {
        console.log(`🔴 Canceling notification: ${notificationId}`);
        
        const response = await fetch(
          `https://onesignal.com/api/v1/notifications/${notificationId}?app_id=${config.appId}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Basic ${config.restApiKey}`
            }
          }
        );
        
        if (response.ok || response.status === 404) {
          // 404 means notification was already sent or doesn't exist
          console.log(`✅ Notification canceled or already processed: ${notificationId}`);
          canceledCount++;
        } else {
          const errorText = await response.text();
          console.error(`❌ Failed to cancel notification ${notificationId}:`, errorText);
          failedCount++;
        }
      } catch (error) {
        console.error(`❌ Error canceling notification ${notificationId}:`, error);
        failedCount++;
      }
    }
    
    // Delete the metadata after attempting cancellation
    try {
      await deleteDoc(metadataRef);
      console.log('🗑️ Notification metadata deleted');
    } catch (error) {
      console.error('⚠️ Failed to delete metadata:', error);
    }
    
    console.log(`📊 Cancellation complete: ${canceledCount} succeeded, ${failedCount} failed`);
    
    return {
      success: true,
      canceledCount,
      failedCount,
      totalAttempted: notificationIds.length
    };
    
  } catch (error) {
    console.error('❌ Failed to cancel notifications:', error);
    // Don't throw - return partial success
    return {
      success: false,
      error: error.message,
      canceledCount: 0
    };
  }
};

/**
 * Schedule birthday reminders with proper metadata storage
 */
export const scheduleBirthdayReminders = async (birthday, userId) => {
  console.log('🎂 === SCHEDULING BIRTHDAY REMINDERS ===');
  console.log('👤 User:', userId);
  console.log('🎉 Birthday Person:', birthday.name);
  console.log('📅 Birthday Date:', birthday.date);
  console.log('🆔 Birthday ID:', birthday.id);
  
  // Validate inputs
  if (!birthday.id) {
    console.error('❌ Birthday ID is missing!');
    return {
      success: false,
      error: 'Birthday ID is required for scheduling'
    };
  }
  
  if (!birthday.name || !birthday.date) {
    console.error('❌ Birthday name or date is missing!');
    return {
      success: false,
      error: 'Birthday name and date are required'
    };
  }
  
  try {
    // First, cancel any existing notifications for this birthday
    console.log('🧹 Checking for existing notifications...');
    await cancelScheduledNotifications(birthday.id);
    
    // Check OneSignal configuration
    if (!isOneSignalConfigured()) {
      console.warn('⚠️ OneSignal not configured');
      return {
        success: false,
        error: 'OneSignal not configured'
      };
    }
    
    const config = getOneSignalConfig();
    const birthDate = new Date(birthday.date);
    const currentYear = new Date().getFullYear();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate next birthday
    let nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
    nextBirthday.setHours(9, 0, 0, 0); // Set to 9 AM
    
    // If birthday has passed this year, schedule for next year
    if (nextBirthday <= today) {
      nextBirthday.setFullYear(currentYear + 1);
    }
    
    console.log('📅 Next birthday:', nextBirthday.toLocaleDateString());
    
    // Define notification schedules
    const schedules = [
      { 
        days: -7, 
        title: '🎂 Birthday Reminder', 
        message: `${birthday.name}'s birthday is in 7 days! Time to plan something special 🎉`,
        type: 'reminder_7d'
      },
      { 
        days: -1, 
        title: '🎉 Birthday Tomorrow!', 
        message: `Don't forget: ${birthday.name}'s birthday is tomorrow! 🎁`,
        type: 'reminder_1d'
      },
      { 
        days: 0, 
        title: '🎊 Birthday Today!', 
        message: `It's ${birthday.name}'s birthday today! Time to celebrate! 🎂🎉`,
        type: 'birthday_today'
      }
    ];
    
    const notificationIds = [];
    const now = new Date();
    
    for (const schedule of schedules) {
      const notificationDate = new Date(nextBirthday);
      notificationDate.setDate(notificationDate.getDate() + schedule.days);
      
      // Only schedule if date is in the future (at least 1 minute from now)
      const timeDiff = notificationDate.getTime() - now.getTime();
      
      if (timeDiff > 60000) { // More than 1 minute in the future
        try {
          console.log(`⏰ Scheduling: ${schedule.title}`);
          console.log(`   Date: ${notificationDate.toLocaleString()}`);
          console.log(`   Time until: ${Math.round(timeDiff / (1000 * 60 * 60 * 24))} days`);
          
          const notificationPayload = {
            app_id: config.appId,
            headings: { en: schedule.title },
            contents: { en: schedule.message },
            included_segments: ['All'],
            send_after: notificationDate.toISOString(),
            // CRITICAL FIX: Add proper idempotency_key for OneSignal
            idempotency_key: generateUUID(),
            // Unique identifiers for cancellation
            external_id: `${birthday.id}_${schedule.type}_${Date.now()}`,
            web_push_topic: `birthday_${birthday.id}_${schedule.type}`,
            collapse_id: `birthday_${birthday.id}_${schedule.type}`,
            // Metadata
            data: {
              birthdayId: birthday.id,
              birthdayName: birthday.name,
              userId: userId,
              type: schedule.type,
              scheduledFor: notificationDate.toISOString()
            },
            // Delivery settings
            ttl: 259200, // 3 days
            priority: 10,
            // Icons
            chrome_web_icon: '/icons/icon-192.png',
            chrome_web_badge: '/icons/badge-72.png',
            firefox_icon: '/icons/icon-192.png'
          };
          
          const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${config.restApiKey}`
            },
            body: JSON.stringify(notificationPayload)
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Failed to schedule ${schedule.type}:`, errorText);
            continue;
          }
          
          const result = await response.json();
          if (result.id) {
            notificationIds.push(result.id);
            console.log(`✅ Scheduled ${schedule.type} with ID: ${result.id}`);
          } else {
            console.warn(`⚠️ No ID returned for ${schedule.type}`);
          }
          
        } catch (error) {
          console.error(`❌ Error scheduling ${schedule.type}:`, error);
        }
      } else {
        console.log(`⏭️ Skipped ${schedule.type} (too close or in past)`);
      }
    }
    
    // Store notification IDs for future cancellation
    if (notificationIds.length > 0) {
      await storeNotificationMetadata(birthday.id, notificationIds);
      console.log(`📦 Stored ${notificationIds.length} notification IDs for future cancellation`);
    }
    
    console.log(`🎊 Successfully scheduled ${notificationIds.length} reminders!`);
    
    return {
      success: true,
      scheduledCount: notificationIds.length,
      notificationIds: notificationIds
    };
    
  } catch (error) {
    console.error('❌ Failed to schedule reminders:', error);
    return {
      success: false,
      error: error.message,
      scheduledCount: 0
    };
  }
};

/**
 * Clean up orphaned notifications for deleted birthdays
 */
export const cleanupOrphanedNotifications = async (activeBirthdayIds) => {
  console.log('🧹 === CLEANING UP ORPHANED NOTIFICATIONS ===');
  
  if (!activeBirthdayIds || activeBirthdayIds.length === 0) {
    console.log('No active birthdays to check against');
    return { success: true, canceledCount: 0 };
  }
  
  try {
    const config = getOneSignalConfig();
    
    // Get all scheduled notifications from OneSignal
    const response = await fetch(
      `https://onesignal.com/api/v1/notifications?app_id=${config.appId}&limit=50`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${config.restApiKey}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch notifications from OneSignal');
    }
    
    const data = await response.json();
    const notifications = data.notifications || [];
    
    // Filter for scheduled birthday notifications not in active list
    const orphaned = notifications.filter(n => {
      if (!n.send_after || new Date(n.send_after) <= new Date()) {
        return false; // Not scheduled or already sent
      }
      if (!n.data || !n.data.birthdayId) {
        return false; // Not a birthday notification
      }
      return !activeBirthdayIds.includes(n.data.birthdayId);
    });
    
    console.log(`Found ${orphaned.length} orphaned notifications to cancel`);
    
    let canceledCount = 0;
    for (const notification of orphaned) {
      try {
        const deleteResponse = await fetch(
          `https://onesignal.com/api/v1/notifications/${notification.id}?app_id=${config.appId}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Basic ${config.restApiKey}`
            }
          }
        );
        
        if (deleteResponse.ok || deleteResponse.status === 404) {
          canceledCount++;
          console.log(`✅ Canceled orphaned notification for: ${notification.data.birthdayName}`);
        }
      } catch (error) {
        console.error('Failed to cancel orphaned notification:', error);
      }
    }
    
    console.log(`🎯 Cleanup complete: ${canceledCount} orphaned notifications canceled`);
    
    return {
      success: true,
      canceledCount
    };
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    return {
      success: false,
      error: error.message,
      canceledCount: 0
    };
  }
};

/**
 * Test notification system
 */
export const testNotificationSystem = async () => {
  console.log('🧪 Testing notification system...');
  
  try {
    const config = getOneSignalConfig();
    
    // Schedule test notification for 30 seconds from now
    const testDate = new Date();
    testDate.setSeconds(testDate.getSeconds() + 30);
    
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${config.restApiKey}`
      },
      body: JSON.stringify({
        app_id: config.appId,
        headings: { en: '🧪 Test Notification' },
        contents: { en: 'This test notification was scheduled for 30 seconds ago!' },
        included_segments: ['All'],
        send_after: testDate.toISOString(),
        data: { test: true }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Test notification scheduled:', result);
    
    return {
      success: true,
      message: 'Test notification will arrive in 30 seconds!',
      notificationId: result.id
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};