/**
 * OneSignal Notification Scheduler - FINAL WORKING VERSION
 * Uses external user IDs for reliable notification delivery
 */

import { getOneSignalConfig, isOneSignalConfigured } from '@/config/onesignal';

const config = getOneSignalConfig();

export const scheduleBirthdayReminders = async (birthday, firebaseUserId, userTimezone = null) => {
  console.log('🎂 === STARTING BIRTHDAY REMINDER SCHEDULING ===');
  console.log('👤 Firebase User ID:', firebaseUserId);
  console.log('🎉 Birthday Person:', birthday.name);
  console.log('📅 Birthday Date:', birthday.date);

  // Check OneSignal configuration
  if (!isOneSignalConfigured()) {
    console.error('❌ OneSignal not configured');
    return { 
      success: false, 
      error: 'OneSignal not configured. Check environment variables.',
      requiresConfig: true
    };
  }

  // Check notification permission
  if (Notification.permission !== 'granted') {
    console.warn('⚠️ Notification permission not granted');
    return {
      success: false,
      error: 'Please enable notifications first to receive birthday reminders.',
      requiresSubscription: true
    };
  }

  console.log('✅ OneSignal configured and permissions granted');

  try {
    const timezone = userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const birthDate = new Date(birthday.date);
    const currentYear = new Date().getFullYear();
    
    // Calculate next birthday
    let nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
    
    if (nextBirthday <= new Date()) {
      nextBirthday.setFullYear(currentYear + 1);
    }
    
    console.log('📅 Next birthday will be:', nextBirthday.toLocaleDateString());
    
    const notifications = [];
    const baseTime = new Date(nextBirthday);
    baseTime.setHours(9, 0, 0, 0);
    
    const scheduleData = [
      { 
        days: -7, 
        title: "🎂 Birthday Reminder", 
        message: `${birthday.name}'s birthday is in 7 days! Time to plan something special.`,
        type: 'birthday_reminder_7d'
      },
      { 
        days: -1, 
        title: "🎉 Birthday Tomorrow!", 
        message: `Don't forget: ${birthday.name}'s birthday is tomorrow!`,
        type: 'birthday_reminder_1d'
      },
      { 
        days: 0, 
        title: "🎂 Birthday Today!", 
        message: `It's ${birthday.name}'s birthday today! 🎉`,
        type: 'birthday_today'
      }
    ];
    
    console.log('🔔 Scheduling notifications...');
    
    for (const schedule of scheduleData) {
      const notifyTime = new Date(baseTime);
      notifyTime.setDate(notifyTime.getDate() + schedule.days);
      
      console.log(`⏰ ${schedule.type} scheduled for:`, notifyTime.toLocaleString());
      
      if (notifyTime > new Date()) {
        try {
          const result = await scheduleOneSignalNotification({
            firebaseUserId: firebaseUserId,
            sendAfter: notifyTime.toISOString(),
            title: schedule.title,
            message: schedule.message,
            timezone: timezone,
            data: { 
              type: schedule.type,
              birthday_id: birthday.id,
              birthday_name: birthday.name,
              days_until: Math.abs(schedule.days),
              firebase_user_id: firebaseUserId
            }
          });
          
          if (result && result.id) {
            notifications.push(result);
            console.log(`🎯 SUCCESS: ${schedule.type} → Notification ID: ${result.id}`);
          } else {
            console.warn(`⚠️ ${schedule.type} scheduled but no ID returned:`, result);
            notifications.push(result || { id: 'scheduled-no-id' });
          }
        } catch (scheduleError) {
          console.error(`❌ FAILED: ${schedule.type} →`, scheduleError.message);
        }
      } else {
        console.log(`⏭️ SKIPPED: ${schedule.type} (date in past)`);
      }
    }
    
    const successCount = notifications.length;
    console.log('🎊 === SCHEDULING COMPLETE ===');
    console.log(`✅ Successfully scheduled ${successCount} notifications`);
    console.log('📋 Notification IDs:', notifications.map(n => n.id || 'no-id'));
    
    return {
      success: true,
      notificationIds: notifications.filter(n => n.id).map(n => n.id),
      scheduledFor: nextBirthday,
      timezone: timezone,
      scheduledCount: successCount
    };
    
  } catch (error) {
    console.error('💥 CRITICAL ERROR in scheduleBirthdayReminders:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Schedule a single notification via OneSignal API
 */
const scheduleOneSignalNotification = async (notificationData) => {
  const payload = {
    app_id: config.appId,
    include_external_user_ids: [notificationData.firebaseUserId],
    headings: { "en": notificationData.title },
    contents: { "en": notificationData.message },
    send_after: notificationData.sendAfter,
    data: notificationData.data
  };

  // Add optional settings
  if (config.notificationSettings?.androidAccentColor) {
    payload.android_accent_color = config.notificationSettings.androidAccentColor;
  }
  
  if (config.notificationSettings?.priority) {
    payload.priority = config.notificationSettings.priority;
  }

  if (notificationData.timezone) {
    payload.timezone_id = notificationData.timezone;
  }
  
  console.log('📡 Making OneSignal API call...');
  console.log('🎯 Target User ID:', notificationData.firebaseUserId);
  console.log('📬 Notification:', notificationData.title);
  console.log('⏰ Send After:', notificationData.sendAfter);
  
  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${config.restApiKey}`
      },
      body: JSON.stringify(payload)
    });
    
    console.log('📊 OneSignal API Response Status:', response.status);
    
    const result = await response.json();
    console.log('📋 OneSignal API Response:', result);
    
    if (response.ok) {
      if (result.id) {
        console.log('🎉 NOTIFICATION SCHEDULED SUCCESSFULLY!');
        console.log('🔑 Notification ID:', result.id);
        return result;
      } else {
        console.warn('⚠️ API success but no notification ID returned');
        return result;
      }
    } else {
      console.error('❌ OneSignal API Error:', result);
      if (result.errors) {
        console.error('📝 Error Details:', result.errors);
      }
      throw new Error(result.errors?.[0] || `API Error: ${response.status}`);
    }
  } catch (fetchError) {
    console.error('🌐 Network Error:', fetchError);
    throw new Error(`Network error: ${fetchError.message}`);
  }
};

export const cancelBirthdayReminders = async (notificationIds) => {
  if (!isOneSignalConfigured() || !notificationIds?.length) {
    return { success: true, cancelled: 0 };
  }

  try {
    const cancelPromises = notificationIds.map(async (id) => {
      const response = await fetch(`https://onesignal.com/api/v1/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Basic ${config.restApiKey}` }
      });
      return response.ok;
    });
    
    const results = await Promise.all(cancelPromises);
    const successCount = results.filter(r => r).length;
    
    return { success: true, cancelled: successCount };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default { scheduleBirthdayReminders, cancelBirthdayReminders };