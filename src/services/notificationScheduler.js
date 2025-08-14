// src/services/notificationScheduler.js - Complete working implementation
import { getOneSignalConfig, isOneSignalConfigured } from '@/config/onesignal';

/**
 * Schedule birthday reminders using OneSignal REST API
 * This works even when app is closed!
 */
export const scheduleBirthdayReminders = async (birthday, userId) => {
  console.log('🎂 === SCHEDULING BIRTHDAY REMINDERS ===');
  console.log('👤 User:', userId);
  console.log('🎉 Birthday Person:', birthday.name);
  console.log('📅 Birthday Date:', birthday.date);
  
  try {
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
    
    // Calculate next birthday
    let nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
    if (nextBirthday <= new Date()) {
      nextBirthday.setFullYear(currentYear + 1);
    }
    
    console.log('📅 Next birthday:', nextBirthday.toLocaleDateString());
    
    // Schedule notifications
    const notifications = [];
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
    
    for (const schedule of schedules) {
      const notificationDate = new Date(nextBirthday);
      notificationDate.setDate(notificationDate.getDate() + schedule.days);
      notificationDate.setHours(9, 0, 0, 0); // 9 AM
      
      // Only schedule if date is in the future
      if (notificationDate > new Date()) {
        try {
          console.log(`⏰ Scheduling: ${schedule.title} for ${notificationDate.toLocaleString()}`);
          
          const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${config.restApiKey}`
            },
            body: JSON.stringify({
              app_id: config.appId,
              headings: { en: schedule.title },
              contents: { en: schedule.message },
              included_segments: ['All'],  // Send to all subscribed users
              send_after: notificationDate.toISOString(),
              web_push_topic: `birthday_${birthday.id}`,
              collapse_id: `birthday_${birthday.id}`,
              data: {
                birthdayId: birthday.id,
                birthdayName: birthday.name,
                userId: userId,
                type: schedule.type
              },
              // Mobile optimizations
              android_accent_color: 'FF9C27B0',
              ios_badgeType: 'Increase',
              ios_badgeCount: 1,
              ttl: 259200, // 3 days
              priority: 10
            })
          });
          
          if (!response.ok) {
            const error = await response.text();
            console.error(`❌ Failed to schedule ${schedule.type}:`, error);
            continue;
          }
          
          const result = await response.json();
          notifications.push(result);
          console.log(`✅ Scheduled ${schedule.type}:`, result.id);
          
        } catch (error) {
          console.error(`❌ Error scheduling ${schedule.type}:`, error);
        }
      } else {
        console.log(`⏭️ Skipped ${schedule.type} (date in past)`);
      }
    }
    
    console.log(`🎊 Successfully scheduled ${notifications.length} reminders!`);
    
    return {
      success: true,
      scheduledCount: notifications.length,
      notifications: notifications
    };
    
  } catch (error) {
    console.error('❌ Failed to schedule reminders:', error);
    return {
      success: false,
      error: error.message
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
        contents: { en: 'This test notification was scheduled 30 seconds ago!' },
        included_segments: ['All'],
        send_after: testDate.toISOString(),
        data: { test: true }
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to schedule test notification');
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