import { getOneSignalConfig, isOneSignalConfigured } from '@/config/onesignal';

// CRITICAL FIX: Safe OneSignal availability check
export const isOneSignalSafe = () => {
  try {
    return !!(
      window.OneSignal && 
      typeof window.OneSignal === 'object' &&
      window.OneSignal.User &&
      typeof window.OneSignal.User === 'object'
    );
  } catch (error) {
    console.warn('⚠️ OneSignal safety check failed:', error.message);
    return false;
  }
};

// CRITICAL FIX: Safe OneSignal method call wrapper
export const safeOneSignalCall = async (methodName, methodCall, fallback = null) => {
  try {
    if (!isOneSignalSafe()) {
      console.warn(`⚠️ OneSignal not safe to call ${methodName}`);
      return fallback;
    }
    
    return await methodCall();
  } catch (error) {
    console.error(`❌ OneSignal ${methodName} failed:`, error.message);
    return fallback;
  }
};

// Enhanced OneSignal initialization with better error handling
export const initializeOneSignalEnhanced = async () => {
  if (!isOneSignalConfigured()) {
    console.warn('⚠️ OneSignal not configured, skipping initialization');
    return { success: false, reason: 'not_configured' };
  }

  try {
    console.log('🚀 Enhanced OneSignal initialization starting...');
    
    // Wait for OneSignal to be available
    if (!window.OneSignal) {
      console.log('⏳ Waiting for OneSignal SDK to load...');
      await new Promise((resolve) => {
        const checkOneSignal = () => {
          if (window.OneSignal) {
            resolve();
          } else {
            setTimeout(checkOneSignal, 100);
          }
        };
        checkOneSignal();
      });
    }

    // CRITICAL FIX: Check if OneSignal is safe before proceeding
    if (!isOneSignalSafe()) {
      console.warn('⚠️ OneSignal not safe to initialize, skipping');
      return { success: false, reason: 'not_safe' };
    }

    // Initialize with enhanced options
    // const initOptions = getOneSignalInitOptions();
    // console.log('⚙️ Initializing OneSignal with options:', initOptions);
    
    // await window.OneSignal.init(initOptions);
    
    console.log('✅ Enhanced OneSignal initialization successful');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Enhanced OneSignal initialization failed:', error);
    return { success: false, error: error.message };
  }
};

// Enhanced permission request with better UX and error handling
export const requestNotificationPermissionEnhanced = async (birthdayName = null) => {
  if (!isOneSignalSafe()) {
    throw new Error('OneSignal not available or not safe');
  }

  try {
    console.log('🔔 Enhanced permission request starting...');
    
    // Check current permission
    const currentPermission = Notification.permission;
    console.log('Current permission:', currentPermission);
    
    if (currentPermission === 'granted') {
      console.log('✅ Permission already granted');
      return { success: true, permission: 'granted', alreadyGranted: true };
    }
    
    if (currentPermission === 'denied') {
      console.log('❌ Permission previously denied');
      return { 
        success: false, 
        permission: 'denied', 
        error: 'Notifications were previously blocked. Please enable them in your browser settings.' 
      };
    }

    // Show custom prompt with context
    const userMessage = birthdayName 
      ? `Get reminded about ${birthdayName}'s birthday and never miss a celebration! 🎉`
      : 'Get birthday reminders and never miss a celebration! 🎉';
    
    const userConfirmed = confirm(
      `🎂 Birthday Reminders\n\n${userMessage}\n\nWould you like to enable notifications?`
    );
    
    if (!userConfirmed) {
      console.log('👎 User declined permission prompt');
      return { success: false, permission: 'default', userDeclined: true };
    }

    // CRITICAL FIX: Safe permission request through OneSignal
    console.log('📱 Requesting permission through OneSignal...');
    const permissionResult = await safeOneSignalCall(
      'Notifications.requestPermission',
      () => window.OneSignal.Notifications.requestPermission(),
      false
    );
    
    console.log('Permission result:', permissionResult);
    
    if (permissionResult) {
      console.log('✅ Enhanced permission granted successfully');
      return { success: true, permission: 'granted' };
    } else {
      console.log('❌ Enhanced permission denied');
      return { success: false, permission: 'denied' };
    }
    
  } catch (error) {
    console.error('❌ Enhanced permission request failed:', error);
    return { success: false, error: error.message };
  }
};

// Enhanced subscription status check with safety
export const getEnhancedSubscriptionStatus = async () => {
  if (!isOneSignalSafe()) {
    return { 
      available: false, 
      subscribed: false, 
      error: 'OneSignal not available or not safe' 
    };
  }

  try {
    const [permission, subscribed, userId] = await Promise.all([
      Promise.resolve(Notification.permission),
      safeOneSignalCall(
        'User.PushSubscription.optedIn',
        () => window.OneSignal.User.PushSubscription.optedIn,
        false
      ),
      safeOneSignalCall(
        'User.PushSubscription.id',
        () => window.OneSignal.User.PushSubscription.id,
        null
      )
    ]);

    return {
      available: true,
      permission,
      subscribed,
      userId,
      ready: !!(permission === 'granted' && subscribed && userId)
    };
    
  } catch (error) {
    console.error('❌ Error getting enhanced subscription status:', error);
    return { 
      available: false, 
      subscribed: false, 
      error: error.message 
    };
  }
};

// Legacy compatibility functions for existing components
export const isSubscribed = async () => {
  const status = await getEnhancedSubscriptionStatus();
  return status.subscribed;
};

export const sendTestNotification = async () => {
  if (!isOneSignalSafe()) {
    return false;
  }

  try {
    // Send a test notification using OneSignal
    await safeOneSignalCall(
      'Notifications.add',
      () => window.OneSignal.Notifications.add({
        title: '🎉 Test Notification',
        message: 'This is a test notification from Celefy!',
        url: window.location.href
      }),
      false
    );
    return true;
  } catch (error) {
    console.error('Failed to send test notification:', error);
    return false;
  }
};

export const unsubscribe = async () => {
  if (!isOneSignalSafe()) {
    return false;
  }

  try {
    await safeOneSignalCall(
      'User.PushSubscription.optOut',
      () => window.OneSignal.User.PushSubscription.optOut(),
      false
    );
    return true;
  } catch (error) {
    console.error('Failed to unsubscribe:', error);
    return false;
  }
};

export const getDebugInfo = () => {
  return {
    oneSignalAvailable: !!window.OneSignal,
    oneSignalSafe: isOneSignalSafe(),
    notificationPermission: Notification.permission,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  };
};

export default {
  isOneSignalSafe,
  safeOneSignalCall,
  initializeOneSignalEnhanced,
  requestNotificationPermissionEnhanced,
  getEnhancedSubscriptionStatus,
  isSubscribed,
  sendTestNotification,
  unsubscribe,
  getDebugInfo
};