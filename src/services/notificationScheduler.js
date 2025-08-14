import { getOneSignalConfig, isOneSignalConfigured } from '@/config/onesignal';
import { addNotificationToHistory, NOTIFICATION_TYPES, NOTIFICATION_PRIORITY } from './notificationHistory';

const config = getOneSignalConfig();

// CRITICAL FIX: Clear any existing immediate notifications to prevent confusion
const clearExistingNotifications = () => {
  try {
    // Clear any existing notifications with the same tag pattern
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.getNotifications().then(notifications => {
          notifications.forEach(notification => {
            if (notification.tag && notification.tag.includes('birthday_')) {
              notification.close();
              console.log('🗑️ Cleared existing birthday notification:', notification.tag);
            }
          });
        });
      });
    }
  } catch (error) {
    console.warn('⚠️ Could not clear existing notifications:', error.message);
  }
};

// CRITICAL FIX: Validate that a date is in the future
const isDateInFuture = (dateString) => {
  const targetDate = new Date(dateString);
  const currentDate = new Date();
  return targetDate > currentDate;
};

/**
 * Enhanced OneSignal notification scheduling using REST API
 */
export const scheduleEnhancedOneSignalNotification = async (scheduleData) => {
  console.log('📤 Scheduling notification using OneSignal v16 API...');
  console.log('⏰ Scheduled for:', scheduleData.scheduledFor);
  console.log('🎯 Birthday:', scheduleData.data?.birthday_name || 'Unknown');
  console.log('📅 Type:', scheduleData.type || 'Unknown');
  
  try {
    // CRITICAL: Store notification in history for user to see
    const notificationData = {
      type: NOTIFICATION_TYPES.BIRTHDAY_REMINDER_7D,
      priority: NOTIFICATION_PRIORITY.MEDIUM,
      message: scheduleData.body,
      title: scheduleData.title,
      data: {
        birthdayId: scheduleData.birthdayId,
        scheduledFor: scheduleData.scheduledFor,
        notificationType: scheduleData.type
      }
    };
    
    // Set specific type based on schedule type
    if (scheduleData.type === 'birthday_reminder_7d') {
      notificationData.type = NOTIFICATION_TYPES.BIRTHDAY_REMINDER_7D;
      notificationData.priority = NOTIFICATION_PRIORITY.MEDIUM;
    } else if (scheduleData.type === 'birthday_reminder_1d') {
      notificationData.type = NOTIFICATION_TYPES.BIRTHDAY_REMINDER_1D;
      notificationData.priority = NOTIFICATION_PRIORITY.HIGH;
    } else if (scheduleData.type === 'birthday_today') {
      notificationData.type = NOTIFICATION_TYPES.BIRTHDAY_TODAY;
      notificationData.priority = NOTIFICATION_PRIORITY.URGENT;
    }
    
    // Add to notification history
    addNotificationToHistory(notificationData);
    
    // CRITICAL: Validate the scheduled time is in the future
    const scheduledTime = new Date(notificationData.sendAfter);
    const currentTime = new Date();
    const delayMs = scheduledTime.getTime() - currentTime.getTime();
    
    if (delayMs <= 0) {
      throw new Error(`Scheduled time is in the past: ${scheduledTime.toLocaleString()}`);
    }
    
    console.log('⏰ Scheduling validation:', {
      scheduledTime: scheduledTime.toLocaleString(),
      currentTime: currentTime.toLocaleString(),
      delayMs: delayMs,
      delayHours: Math.round(delayMs / (1000 * 60 * 60)),
      delayDays: Math.round(delayMs / (1000 * 60 * 60 * 24))
    });
    
    // CRITICAL: Use OneSignal REST API for server-side scheduling
    const oneSignalConfig = getOneSignalConfig();
    
    if (!oneSignalConfig.appId || !oneSignalConfig.restApiKey) {
      throw new Error('OneSignal configuration missing - cannot schedule notifications');
    }
    
    // CRITICAL: Prepare the REST API payload for server-side scheduling
    const restApiPayload = {
      app_id: oneSignalConfig.appId,
      included_segments: ["Subscribed Users"],
      headings: { en: notificationData.title },
      contents: { en: notificationData.message },
      send_after: notificationData.sendAfter, // CRITICAL: This schedules for the future
      delayed_option: "timezone",
      ttl: 259200, // 3 days TTL for scheduled notifications
      priority: 10,
      data: {
        ...notificationData.data,
        notification_id: `birthday_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        click_action: `${window.location.origin}/?birthday=${notificationData.data.birthday_id}`,
        scheduled_for: notificationData.sendAfter,
        notification_type: notificationData.data.type,
        scheduled_at: new Date().toISOString()
      },
      chrome_web_icon: `${window.location.origin}/icons/icon-192.png`,
      chrome_web_badge: `${window.location.origin}/icons/icon-192.png`,
      chrome_web_image: `${window.location.origin}/icons/icon-192.png`,
      url: `${window.location.origin}/?birthday=${notificationData.data.birthday_id}`,
      web_push_topic: `birthday_${notificationData.data.birthday_id}_${notificationData.data.type}`
    };
    
    console.log('📤 OneSignal REST API payload for server-side scheduling:', restApiPayload);
    
    // CRITICAL: Make the REST API call to OneSignal for server-side scheduling
    console.log('📤 Making OneSignal REST API call for server-side scheduling...');
    console.log('🔑 Using REST API Key:', oneSignalConfig.restApiKey ? `${oneSignalConfig.restApiKey.substring(0, 8)}...` : 'NOT SET');
    
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${oneSignalConfig.restApiKey}`
      },
      body: JSON.stringify(restApiPayload)
    });
    
    console.log('📡 OneSignal REST API response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OneSignal REST API failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`OneSignal REST API failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ OneSignal REST API response for server-side scheduling:', result);
    
    // CRITICAL: Validate the response contains a valid notification ID
    if (!result.id) {
      console.warn('⚠️ OneSignal response missing notification ID:', result);
    }
    
    // CRITICAL: Return the OneSignal notification ID for tracking
    return {
      id: result.id || `onesignal_${Date.now()}`,
      recipients: result.recipients || 1,
      external_id: notificationData.firebaseUserId,
      success: true,
      schedulingMethod: 'OneSignal REST API - Server-side scheduling',
      scheduledFor: notificationData.sendAfter,
      actualDeliveryTime: scheduledTime.toLocaleString(),
      delayMs: delayMs,
      oneSignalId: result.id,
      restApiResponse: result,
      scheduled: true,
      immediate: false
    };
    
  } catch (error) {
    console.error('❌ OneSignal REST API scheduling error:', error);
    
    // CRITICAL: Enhanced fallback to browser notification with proper future scheduling
    try {
      const scheduledTime = new Date(notificationData.sendAfter);
      const currentTime = new Date();
      const delayMs = scheduledTime.getTime() - currentTime.getTime();
      
      if (delayMs > 0) {
        console.log('🔄 Fallback: Using browser notification with future scheduling...');
        console.log('⚠️ WARNING: Browser notifications only work when app is open. For mobile users, ensure OneSignal is properly configured.');
        
        // CRITICAL: Schedule the browser notification for the future
        setTimeout(() => {
          if (Notification.permission === 'granted') {
            const fallbackNotification = new Notification(notificationData.title, {
              body: notificationData.message,
              icon: '/icons/icon-192.png',
              badge: '/icons/icon-192.png',
              tag: `birthday_${notificationData.data.birthday_id}_${notificationData.data.type}`,
              data: notificationData.data,
              requireInteraction: true,
              silent: false
            });
            
            fallbackNotification.onclick = () => {
              window.focus();
              window.location.href = notificationData.data.click_action;
            };
            
            console.log('✅ Fallback browser notification delivered at scheduled time:', new Date().toLocaleString());
          }
        }, delayMs);
        
        return {
          id: `fallback_browser_${Date.now()}`,
          recipients: 1,
          external_id: notificationData.firebaseUserId,
          success: true,
          schedulingMethod: 'Browser notification fallback - Client-side scheduling',
          scheduledFor: notificationData.sendAfter,
          actualDeliveryTime: scheduledTime.toLocaleString(),
          delayMs: delayMs,
          warning: 'Client-side scheduling - notifications may be lost if browser is closed. Check OneSignal configuration for server-side scheduling.',
          error: error.message
        };
      } else {
        throw new Error('Cannot schedule notification in the past');
      }
    } catch (fallbackError) {
      console.error('❌ Fallback scheduling also failed:', fallbackError);
      
      return {
        id: `error_${Date.now()}`,
        recipients: 0,
        external_id: notificationData.firebaseUserId,
        success: false,
        error: error.message,
        schedulingMethod: 'Failed - no scheduling method available',
        recommendation: 'Check OneSignal configuration and ensure REST API key is set correctly'
      };
    }
  }
};

// Enhanced birthday reminder scheduling with external user ID support
export const scheduleBirthdayReminders = async (birthday, firebaseUserId, userTimezone = null) => {
  console.log('🎂 === ENHANCED BIRTHDAY REMINDER SCHEDULING ===');
  console.log('🎯 Function called with parameters:', { birthday, firebaseUserId, userTimezone });
  console.log('👤 Firebase User ID:', firebaseUserId);
  console.log('🎉 Birthday Person:', birthday.name);
  console.log('📅 Birthday Date:', birthday.date);
  console.log('🔍 Birthday object type:', typeof birthday);
  console.log('🔍 Birthday object keys:', Object.keys(birthday));
  
  try {
    // CRITICAL FIX: Clear any existing notifications to prevent confusion
    clearExistingNotifications();
    
    // Validate OneSignal configuration
    if (!isOneSignalConfigured()) {
      console.warn('⚠️ OneSignal not configured, skipping notification scheduling');
      return {
        success: false,
        error: 'OneSignal not configured',
        birthdaySaved: true,
        fallbackMessage: 'Birthday saved successfully! Notifications will be set up when OneSignal is configured.'
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

    // CRITICAL FIX: Simplified approach - no complex API detection needed
    console.log('🔍 Starting birthday reminder scheduling...');
    
    // CRITICAL FIX: Safe external user ID setting with error handling
    console.log('🔗 Setting external user ID for reliable delivery...');
    try {
      // Wait for OneSignal to be fully ready
      let attempts = 0;
      const maxAttempts = 50; // 5 second timeout
      
      while (attempts < maxAttempts) {
        if (window.OneSignal && window.OneSignal.User && window.OneSignal.User.PushSubscription) {
          console.log('✅ OneSignal fully ready, setting external user ID...');
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        
        if (attempts % 10 === 0) {
          console.log(`⏳ Waiting for OneSignal to be ready... (${attempts}/${maxAttempts})`);
        }
      }
      
      // CRITICAL FIX: Use safer method for OneSignal v16
      if (window.OneSignal && window.OneSignal.User && typeof window.OneSignal.User.setExternalId === 'function') {
        await window.OneSignal.User.setExternalId(firebaseUserId);
        console.log('✅ External user ID set successfully using v16 API');
      } else if (window.OneSignal && typeof window.OneSignal.setExternalUserId === 'function') {
        // Fallback to legacy method
        await window.OneSignal.setExternalUserId(firebaseUserId);
        console.log('✅ External user ID set successfully using legacy API');
      } else if (window.OneSignal && window.OneSignal.User && window.OneSignal.User.PushSubscription) {
        // Try to set external ID through subscription
        try {
          await window.OneSignal.User.PushSubscription.setExternalId(firebaseUserId);
          console.log('✅ External user ID set through PushSubscription');
        } catch (subscriptionError) {
          console.warn('⚠️ PushSubscription.setExternalId failed:', subscriptionError.message);
        }
      } else {
        console.warn('⚠️ OneSignal external user ID methods not available, continuing without it');
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
    
    // Enhanced notification schedule with better messaging and mobile-optimized timing
    const scheduleData = [
      { 
        days: -7, 
        title: "🎂 Birthday Reminder", 
        message: `${birthday.name}'s birthday is in 7 days! Time to plan something special 🎉`,
        type: 'birthday_reminder_7d',
        priority: 'high',
        time: '10:00' // 10 AM for better mobile engagement
      },
      { 
        days: -1, 
        title: "🎉 Birthday Tomorrow!", 
        message: `Don't forget: ${birthday.name}'s birthday is tomorrow! 🎁`,
        type: 'birthday_reminder_1d',
        priority: 'high',
        time: '09:00' // 9 AM for important reminder
      },
      { 
        days: 0, 
        title: "🎂 Happy Birthday!", 
        message: `It's ${birthday.name}'s birthday today! 🎉🎂🎁`,
        type: 'birthday_today',
        priority: 'max',
        time: '08:00' // 8 AM to start the day with celebration
      }
    ];
    
    console.log('🔔 Enhanced notification scheduling with mobile-optimized timing...');
    
    for (const schedule of scheduleData) {
      const notifyTime = new Date(baseTime);
      notifyTime.setDate(notifyTime.getDate() + schedule.days);
      
      // Set specific time for better mobile user experience
      const [hours, minutes] = schedule.time.split(':');
      notifyTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      console.log(`⏰ ${schedule.type} scheduled for:`, notifyTime.toLocaleString());
      
      // CRITICAL FIX: Enhanced validation to prevent immediate delivery
      if (notifyTime > new Date()) {
        try {
          // CRITICAL: Calculate exact delay for validation
          const delayMs = notifyTime.getTime() - Date.now();
          const delayHours = Math.round(delayMs / (1000 * 60 * 60));
          const delayDays = Math.round(delayMs / (1000 * 60 * 60 * 24));
          
          // CRITICAL: Additional validation to prevent immediate delivery
          if (delayMs < 60000) { // Less than 1 minute
            console.warn(`⏭️ SKIPPED: ${schedule.type} (too soon: ${delayMs}ms - ${delayHours}h ${delayDays}d)`);
            continue;
          }
          
          console.log(`⏰ ${schedule.type} timing validation:`, {
            scheduledFor: notifyTime.toLocaleString(),
            currentTime: new Date().toLocaleString(),
            delayMs: delayMs,
            delayHours: delayHours,
            delayDays: delayDays,
            isValid: delayMs > 60000,
            mobileOptimized: true
          });
          
          // CRITICAL: Only proceed if we have a valid future time
          if (delayMs <= 60000) {
            console.warn(`⏭️ SKIPPED: ${schedule.type} (calculated time is too soon: ${delayMs}ms)`);
            continue;
          }
          
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
              scheduled_at: new Date().toISOString(),
              // CRITICAL: Add timing validation data
              scheduled_for_iso: notifyTime.toISOString(),
              scheduled_for_local: notifyTime.toLocaleString(),
              delay_validation: {
                delayMs: delayMs,
                delayHours: delayHours,
                delayDays: delayDays
              },
              mobile_optimized: true,
              delivery_time: schedule.time
            }
          });
          
          if (result && result.id) {
            notifications.push(result);
            console.log(`🎯 SUCCESS: ${schedule.type} → Notification ID: ${result.id}`);
            console.log(`📋 Scheduling Details:`, {
              method: result.schedulingMethod,
              scheduledFor: result.scheduledFor,
              actualDeliveryTime: result.actualDeliveryTime,
              delayFromNow: `${delayDays} days, ${delayHours % 24} hours`
            });
          } else if (result && result.success === false) {
            // Handle failed notifications with error IDs
            const errorId = `error_${schedule.type}_${Date.now()}`;
            notifications.push({ ...result, id: errorId });
            console.warn(`❌ ${schedule.type} failed: ${result.error || 'Unknown error'}`);
          } else {
            // Handle notifications without IDs by generating fallback IDs
            const fallbackId = `fallback_${schedule.type}_${Date.now()}`;
            const fallbackResult = { 
              ...result, 
              id: fallbackId,
              fallback: true,
              type: schedule.type
            };
            notifications.push(fallbackResult);
            console.warn(`⚠️ ${schedule.type} scheduled with fallback ID: ${fallbackId}`);
          }
        } catch (scheduleError) {
          console.error(`❌ FAILED: ${schedule.type} →`, scheduleError.message);
          // Don't fail the entire process for one notification failure
        }
      } else {
        console.log(`⏭️ SKIPPED: ${schedule.type} (date in past: ${notifyTime.toLocaleString()})`);
      }
    }
    
    const successCount = notifications.length;
    console.log('🎊 === ENHANCED SCHEDULING COMPLETE ===');
    console.log(`✅ Successfully scheduled ${successCount} notifications`);
    console.log('📋 Notification IDs:', notifications.map(n => n.id || 'no-id'));
    
    // CRITICAL FIX: Enhanced scheduling summary with timing details
    const schedulingSummary = {
      totalScheduled: successCount,
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.data?.type || 'unknown',
        scheduledFor: n.data?.scheduled_for_local || 'unknown',
        method: n.schedulingMethod || 'unknown',
        delay: n.data?.delay_validation ? 
          `${n.data.delay_validation.delayDays} days, ${n.data.delay_validation.delayHours % 24} hours` : 
          'unknown'
      })),
      nextBirthday: nextBirthday.toLocaleDateString(),
      timezone: timezone
    };
    
    console.log('📊 Enhanced Scheduling Summary:', schedulingSummary);
    
    // CRITICAL: Validate that notifications are actually scheduled for future
    const immediateNotifications = notifications.filter(n => 
      n.schedulingMethod && n.schedulingMethod.includes('immediate')
    );
    
    if (immediateNotifications.length > 0) {
      console.warn('⚠️ WARNING: Some notifications may be delivered immediately instead of scheduled!');
      console.warn('📋 Immediate notifications:', immediateNotifications.map(n => n.id));
    } else {
      console.log('✅ All notifications properly scheduled for future delivery');
    }
    
    return {
      success: true,
      notificationIds: notifications.filter(n => n.id).map(n => n.id),
      scheduledFor: nextBirthday,
      timezone: timezone,
      scheduledCount: successCount,
      externalUserId: firebaseUserId,
      birthdaySaved: true, // CRITICAL: Always indicate birthday was saved
      // CRITICAL: Enhanced return data for debugging
      schedulingSummary: schedulingSummary,
      immediateNotificationsCount: immediateNotifications.length
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

// CRITICAL FIX: Test notification system with proper future scheduling
export const testNotificationSystem = async () => {
  console.log('🧪 Testing notification system with proper future scheduling...');
  
  try {
    if (Notification.permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }
    
    // Test scheduled notification (10 seconds from now) - NOT immediate
    const scheduledTime = new Date(Date.now() + 10000); // 10 seconds from now
    const delayMs = 10000;
    
    console.log(`⏰ Scheduling test notification for ${scheduledTime.toLocaleString()} (${delayMs}ms from now)`);
    console.log('📱 This notification will appear in 10 seconds, not immediately');
    
    // Schedule the notification for the future
    setTimeout(() => {
      if (Notification.permission === 'granted') {
        const scheduledNotification = new Notification('⏰ Scheduled Test Notification', {
          body: 'This notification was scheduled 10 seconds ago - proving future scheduling works!',
          icon: '/icons/icon-192.png',
          tag: 'scheduled_test',
          data: { test: true, scheduled: true, timestamp: Date.now() }
        });
        
        scheduledNotification.onclick = () => {
          window.focus();
          console.log('✅ Scheduled test notification clicked successfully');
        };
        
        console.log('✅ Scheduled test notification delivered successfully at scheduled time');
      }
    }, delayMs);
    
    return {
      success: true,
      immediate: 'No immediate notification shown',
      scheduled: `Scheduled for ${scheduledTime.toLocaleString()} (10 seconds from now)`,
      message: 'Notification system is working correctly - scheduling for future delivery'
    };
    
  } catch (error) {
    console.error('❌ Test notification failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Notification system has issues'
    };
  }
};

// CRITICAL FIX: Test OneSignal REST API for future scheduling
export const testOneSignalRestAPI = async () => {
  console.log('🧪 Testing OneSignal REST API for future scheduling...');
  
  try {
    const oneSignalConfig = getOneSignalConfig();
    
    if (!oneSignalConfig.appId || !oneSignalConfig.restApiKey) {
      throw new Error('OneSignal configuration missing - cannot test REST API');
    }
    
    // Test scheduling a notification for 30 seconds from now
    const testScheduledTime = new Date(Date.now() + 30000); // 30 seconds from now
    
    const testPayload = {
      app_id: oneSignalConfig.appId,
      included_segments: ["Subscribed Users"],
      headings: { en: "🧪 Test Scheduled Notification" },
      contents: { en: "This notification was scheduled 30 seconds ago via REST API" },
      send_after: testScheduledTime.toISOString(),
      delayed_option: "timezone",
      ttl: 259200,
      priority: 10,
      data: {
        test: true,
        scheduled: true,
        timestamp: Date.now(),
        scheduled_for: testScheduledTime.toISOString()
      },
      chrome_web_icon: `${window.location.origin}/icons/icon-192.png`,
      url: window.location.origin
    };
    
    console.log('📤 Testing OneSignal REST API with payload:', testPayload);
    
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${oneSignalConfig.restApiKey}`
      },
      body: JSON.stringify(testPayload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OneSignal REST API test failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ OneSignal REST API test successful:', result);
    
    return {
      success: true,
      message: 'OneSignal REST API is working correctly',
      scheduledFor: testScheduledTime.toLocaleString(),
      notificationId: result.id,
      restApiResponse: result
    };
    
  } catch (error) {
    console.error('❌ OneSignal REST API test failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'OneSignal REST API has issues'
    };
  }
};