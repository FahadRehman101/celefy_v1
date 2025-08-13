/**
 * OneSignal Notification Scheduler
 * Schedules birthday reminders that work without the app being opened
 */

import { getOneSignalConfig, isOneSignalConfigured } from '@/config/onesignal';

// Get configuration safely
const config = getOneSignalConfig();

/**
 * Schedule all birthday notifications when birthday is added
 * This works completely independently - user never needs to open app again!
 */
export const scheduleBirthdayReminders = async (birthday, userId) => {
  console.log('📅 Scheduling birthday reminders for:', birthday.name);

  // Check if OneSignal is configured
  if (!isOneSignalConfigured()) {
    console.warn('⚠️ OneSignal not configured. Cannot schedule notifications.');
    return { 
      success: false, 
      error: 'OneSignal not configured. Please check your environment variables.',
      requiresConfig: true
    };
  }

  try {
    // Calculate notification dates
    const birthDate = new Date(birthday.date);
    const currentYear = new Date().getFullYear();
    
    // Get this year's birthday
    let nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
    
    // If birthday already passed this year, schedule for next year
    if (nextBirthday <= new Date()) {
      nextBirthday.setFullYear(currentYear + 1);
    }
    
    // Calculate notification times (9 AM local time)
    const sevenDaysBefore = new Date(nextBirthday);
    sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);
    sevenDaysBefore.setHours(9, 0, 0, 0);
    
    const oneDayBefore = new Date(nextBirthday);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
    oneDayBefore.setHours(9, 0, 0, 0);
    
    const birthdayDay = new Date(nextBirthday);
    birthdayDay.setHours(9, 0, 0, 0);
    
    // Schedule all 3 notifications
    const notifications = [];
    
    // Only schedule if the date is in the future
    if (sevenDaysBefore > new Date()) {
      notifications.push(await scheduleOneSignalNotification({
        userId,
        sendAfter: sevenDaysBefore.toISOString(),
        title: "🎂 Birthday Reminder",
        message: `${birthday.name}'s birthday is in 7 days! Time to plan something special.`,
        data: { 
          type: 'birthday_reminder_7d',
          birthday_id: birthday.id,
          birthday_name: birthday.name,
          days_until: 7
        }
      }));
    }
    
    if (oneDayBefore > new Date()) {
      notifications.push(await scheduleOneSignalNotification({
        userId,
        sendAfter: oneDayBefore.toISOString(),
        title: "🎉 Birthday Tomorrow!",
        message: `Don't forget: ${birthday.name}'s birthday is tomorrow! Have you prepared anything special?`,
        data: { 
          type: 'birthday_reminder_1d',
          birthday_id: birthday.id,
          birthday_name: birthday.name,
          days_until: 1
        }
      }));
    }
    
    if (birthdayDay > new Date()) {
      notifications.push(await scheduleOneSignalNotification({
        userId,
        sendAfter: birthdayDay.toISOString(),
        title: "🎂 Birthday Today!",
        message: `It's ${birthday.name}'s birthday today! Don't forget to wish them well! 🎉`,
        data: { 
          type: 'birthday_today',
          birthday_id: birthday.id,
          birthday_name: birthday.name,
          days_until: 0
        }
      }));
    }
    
    console.log(`✅ Scheduled ${notifications.length} notifications for ${birthday.name}`);
    
    // Store notification IDs for potential cancellation
    return {
      success: true,
      notificationIds: notifications.filter(n => n.id).map(n => n.id),
      scheduledFor: nextBirthday
    };
    
  } catch (error) {
    console.error('❌ Failed to schedule birthday reminders:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Schedule a single notification via OneSignal API
 */
const scheduleOneSignalNotification = async (notificationData) => {
  const payload = {
    app_id: config.appId,
    include_external_user_ids: [notificationData.userId],
    headings: { "en": notificationData.title },
    contents: { "en": notificationData.message },
    send_after: notificationData.sendAfter, // 🔑 This is the magic!
    data: notificationData.data,
    
    // Notification settings from config
    android_accent_color: config.notificationSettings.androidAccentColor,
    small_icon: config.notificationSettings.smallIcon,
    large_icon: config.notificationSettings.largeIcon,
    priority: config.notificationSettings.priority,
    android_channel_id: config.notificationSettings.androidChannelId
  };
  
  console.log('📤 Scheduling OneSignal notification:', {
    title: notificationData.title,
    sendAfter: notificationData.sendAfter,
    userId: notificationData.userId
  });
  
  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${config.restApiKey}`
    },
    body: JSON.stringify(payload)
  });
  
  const result = await response.json();
  
  if (response.ok) {
    console.log('✅ OneSignal notification scheduled:', result.id);
    return result;
  } else {
    console.error('❌ OneSignal scheduling failed:', result);
    throw new Error(result.errors?.[0] || 'Failed to schedule notification');
  }
};

/**
 * Cancel scheduled notifications (when birthday is deleted)
 */
export const cancelBirthdayReminders = async (notificationIds) => {
  console.log('🚫 Cancelling scheduled notifications:', notificationIds);
  
  // Check if OneSignal is configured
  if (!isOneSignalConfigured()) {
    console.warn('⚠️ OneSignal not configured. Cannot cancel notifications.');
    return { 
      success: false, 
      error: 'OneSignal not configured. Please check your environment variables.',
      requiresConfig: true
    };
  }

  try {
    const cancelPromises = notificationIds.map(async (id) => {
      const response = await fetch(`https://onesignal.com/api/v1/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${config.restApiKey}`
        }
      });
      
      return response.ok;
    });
    
    const results = await Promise.all(cancelPromises);
    console.log(`✅ Cancelled ${results.filter(r => r).length}/${notificationIds.length} notifications`);
    
    return { success: true, cancelled: results.filter(r => r).length };
  } catch (error) {
    console.error('❌ Failed to cancel notifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Reschedule notifications for next year (call this annually)
 */
export const rescheduleForNextYear = async (birthdays, userId) => {
  console.log('🔄 Rescheduling notifications for next year...');
  
  // Check if OneSignal is configured
  if (!isOneSignalConfigured()) {
    console.warn('⚠️ OneSignal not configured. Cannot reschedule notifications.');
    return { 
      success: false, 
      error: 'OneSignal not configured. Please check your environment variables.',
      requiresConfig: true
    };
  }
  
  for (const birthday of birthdays) {
    await scheduleBirthdayReminders(birthday, userId);
  }
  
  console.log('✅ All notifications rescheduled for next year');
};

export default {
  scheduleBirthdayReminders,
  cancelBirthdayReminders,
  rescheduleForNextYear
};