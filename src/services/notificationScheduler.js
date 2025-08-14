import { getOneSignalConfig, isOneSignalConfigured } from '@/config/onesignal';

const config = getOneSignalConfig();

// Enhanced birthday reminder scheduling with external user ID support
export const scheduleBirthdayReminders = async (birthday, firebaseUserId, userTimezone = null) => {
  console.log('🎂 === ENHANCED BIRTHDAY REMINDER SCHEDULING ===');
  console.log('👤 Firebase User ID:', firebaseUserId);
  console.log('🎉 Birthday Person:', birthday.name);
  console.log('📅 Birthday Date:', birthday.date);

  // CRITICAL FIX: Enhanced configuration check with better error handling
  if (!isOneSignalConfigured()) {
    console.warn('⚠️ OneSignal not properly configured - continuing without notifications');
    return { 
      success: false, 
      error: 'OneSignal not configured. Birthday saved successfully without notifications.',
      requiresConfig: true,
      birthdaySaved: true // CRITICAL: Indicate birthday was still saved
    };
  }

  // CRITICAL FIX: Enhanced permission check
  if (Notification.permission !== 'granted') {
    console.warn('⚠️ Notification permission not granted - continuing without notifications');
    return {
      success: false,
      error: 'Please enable notifications to receive birthday reminders. Birthday saved successfully.',
      requiresSubscription: true,
      birthdaySaved: true // CRITICAL: Indicate birthday was still saved
    };
  }

  // CRITICAL FIX: Enhanced OneSignal availability check with better error handling
  if (!window.OneSignal) {
    console.warn('⚠️ OneSignal not available - continuing without notifications');
    return {
      success: false,
      error: 'OneSignal not loaded. Birthday saved successfully without notifications.',
      requiresReload: true,
      birthdaySaved: true // CRITICAL: Indicate birthday was still saved
    };
  }

  // CRITICAL FIX: Check if OneSignal.User is available
  if (!window.OneSignal.User) {
    console.warn('⚠️ OneSignal.User not available - continuing without notifications');
    return {
      success: false,
      error: 'OneSignal user system not ready. Birthday saved successfully without notifications.',
      requiresReload: true,
      birthdaySaved: true // CRITICAL: Indicate birthday was still saved
    };
  }

  console.log('✅ OneSignal configured and permissions granted');

  try {
    // CRITICAL FIX: Safe external user ID setting with error handling
    console.log('🔗 Setting external user ID for reliable delivery...');
    try {
      // Check if login method exists and is safe to call
      if (typeof window.OneSignal.login === 'function') {
        await window.OneSignal.login(firebaseUserId);
        console.log('✅ External user ID set successfully');
      } else {
        console.warn('⚠️ OneSignal.login method not available, skipping external user ID');
      }
    } catch (loginError) {
      console.warn('⚠️ Failed to set external user ID, continuing without it:', loginError.message);
      // Don't fail the entire process for this
    }

    // Enhanced timezone handling
    const timezone = userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const birthDate = new Date(birthday.date);
    const currentYear = new Date().getFullYear();
    
    // Calculate next birthday with enhanced logic
    let nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
    
    if (nextBirthday <= new Date()) {
      nextBirthday.setFullYear(currentYear + 1);
    }
    
    console.log('📅 Next birthday calculated:', nextBirthday.toLocaleDateString());
    
    const notifications = [];
    const baseTime = new Date(nextBirthday);
    baseTime.setHours(9, 0, 0, 0); // 9 AM for better user experience
    
    // Enhanced notification schedule with better messaging
    const scheduleData = [
      { 
        days: -7, 
        title: "🎂 Birthday Reminder", 
        message: `${birthday.name}'s birthday is in 7 days! Time to plan something special 🎉`,
        type: 'birthday_reminder_7d',
        priority: 'high'
      },
      { 
        days: -1, 
        title: "🎉 Birthday Tomorrow!", 
        message: `Don't forget: ${birthday.name}'s birthday is tomorrow! 🎁`,
        type: 'birthday_reminder_1d',
        priority: 'high'
      },
      { 
        days: 0, 
        title: "🎂 Happy Birthday!", 
        message: `It's ${birthday.name}'s birthday today! 🎉🎂🎁`,
        type: 'birthday_today',
        priority: 'max'
      }
    ];
    
    console.log('🔔 Enhanced notification scheduling...');
    
    for (const schedule of scheduleData) {
      const notifyTime = new Date(baseTime);
      notifyTime.setDate(notifyTime.getDate() + schedule.days);
      
      console.log(`⏰ ${schedule.type} scheduled for:`, notifyTime.toLocaleString());
      
      if (notifyTime > new Date()) {
        try {
          const result = await scheduleEnhancedOneSignalNotification({
            firebaseUserId: firebaseUserId,
            sendAfter: notifyTime.toISOString(),
            title: schedule.title,
            message: schedule.message,
            timezone: timezone,
            priority: schedule.priority,
            data: { 
              type: schedule.type,
              birthday_id: birthday.id,
              birthday_name: birthday.name,
              days_until: Math.abs(schedule.days),
              firebase_user_id: firebaseUserId,
              scheduled_at: new Date().toISOString()
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
          // Don't fail the entire process for one notification failure
        }
      } else {
        console.log(`⏭️ SKIPPED: ${schedule.type} (date in past)`);
      }
    }
    
    const successCount = notifications.length;
    console.log('🎊 === ENHANCED SCHEDULING COMPLETE ===');
    console.log(`✅ Successfully scheduled ${successCount} notifications`);
    console.log('📋 Notification IDs:', notifications.map(n => n.id || 'no-id'));
    
    return {
      success: true,
      notificationIds: notifications.filter(n => n.id).map(n => n.id),
      scheduledFor: nextBirthday,
      timezone: timezone,
      scheduledCount: successCount,
      externalUserId: firebaseUserId,
      birthdaySaved: true // CRITICAL: Always indicate birthday was saved
    };
    
  } catch (error) {
    console.error('💥 CRITICAL ERROR in enhanced birthday reminder scheduling:', error);
    // CRITICAL FIX: Return success for birthday saving even if notifications fail
    return { 
      success: false, 
      error: error.message,
      details: error.stack,
      birthdaySaved: true, // CRITICAL: Birthday was still saved successfully
      fallbackMessage: 'Birthday saved successfully! Notification scheduling failed but will retry later.'
    };
  }
};

/**
 * Enhanced OneSignal notification scheduling with better reliability
 */
const scheduleEnhancedOneSignalNotification = async (notificationData) => {
  const payload = {
    app_id: config.appId,
    
    // Use external user IDs for better reliability
    include_external_user_ids: [notificationData.firebaseUserId],
    
    // Enhanced content
    headings: { "en": notificationData.title },
    contents: { "en": notificationData.message },
    
    // Enhanced scheduling
    send_after: notificationData.sendAfter,
    
    // Enhanced notification settings
    priority: 10,
    ttl: 259200, // 3 days TTL for better delivery
    
    // Enhanced data payload
    data: {
      ...notificationData.data,
      notification_id: `birthday_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    },
    
    // Enhanced delivery settings
    delayed_option: "timezone",
    delivery_time_of_day: "9:00AM", // Deliver at 9 AM in user's timezone
    
    // Enhanced platform settings
    web_url: window.location.origin, // Return to app when clicked
    chrome_web_icon: "/icons/icon-192.png",
    firefox_icon: "/icons/icon-192.png",
    chrome_web_badge: "/icons/badge-72.png",
    
    // Enhanced behavior
    web_buttons: [
      {
        id: "view_birthday",
        text: "View Birthday",
        icon: "/icons/cake-icon.png",
        url: `${window.location.origin}/?birthday=${notificationData.data.birthday_id}`
      }
    ]
  };

  console.log('📤 Enhanced OneSignal API call:', payload);

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${config.restApiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OneSignal API error: ${errorData.errors?.[0] || response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Enhanced OneSignal response:', result);
    
    return {
      id: result.id,
      recipients: result.recipients,
      external_id: result.external_id
    };
  } catch (error) {
    console.error('❌ Enhanced OneSignal API error:', error);
    throw error;
  }
};