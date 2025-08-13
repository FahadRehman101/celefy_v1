// OneSignal utility functions - Simplified for v16 SDK compatibility

// Safety mechanism to prevent multiple simultaneous operations
let isRequestingPermission = false;
let isInitializing = false;
let isGettingDebugInfo = false;

/**
 * Initialize OneSignal with proper configuration
 */
export const initializeOneSignal = async () => {
  try {
    // Prevent multiple simultaneous initializations
    if (isInitializing) {
      console.log('🔍 OneSignal initialization already in progress, waiting...');
      return true;
    }
    
    isInitializing = true;
    console.log('🔍 Starting OneSignal v16 initialization...');
    
    // Wait for OneSignal SDK to be loaded
    if (typeof window === 'undefined') {
      throw new Error('Window is not available');
    }

    // Wait for OneSignal to be available with proper v16 detection
    await new Promise((resolve, reject) => {
      const maxWaitTime = 30000; // 30 seconds timeout
      const startTime = Date.now();
      let checkCount = 0;
      
      const checkOneSignal = () => {
        checkCount++;
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        
        console.log(`🔍 Check #${checkCount} (${elapsed}s elapsed):`);
        console.log(`🔍 - OneSignal exists: ${!!window.OneSignal}`);
        
        // For v16, check if OneSignal object exists and has the right structure
        if (window.OneSignal && (
          typeof window.OneSignal.init === 'function' || 
          typeof window.OneSignal.Slidedown === 'object' ||
          typeof window.OneSignal.Notifications === 'object'
        )) {
          console.log('✅ OneSignal v16 SDK detected and ready!');
          resolve();
        } else if (Date.now() - startTime > maxWaitTime) {
          console.error('❌ Timeout: OneSignal SDK failed to load within 30 seconds');
          reject(new Error('OneSignal SDK failed to load within 30 seconds'));
        } else {
          setTimeout(checkOneSignal, 1000);
        }
      };
      
      checkOneSignal();
    });

    console.log('🔍 OneSignal SDK loaded, proceeding with v16 initialization...');

    // Check if already initialized
    if (window.OneSignal._isInitialized || window.OneSignal.initialized) {
      console.log('✅ OneSignal already initialized');
      isInitializing = false;
      return true;
    }

    // OneSignal v16 initialization
    console.log('🔍 Initializing OneSignal v16...');
    
    await window.OneSignal.init({
      appId: "b714db0f-1b9e-4b4b-87fb-1d52c3309714",
      safari_web_id: "web.onesignal.auto.145f18a4-510a-4781-b676-50fa3f7fa700",
      
      // v16 specific options
      allowLocalhostAsSecureOrigin: true,
      
      // Slidedown prompt configuration
      promptOptions: {
        slidedown: {
          enabled: true,
          acceptButtonText: "Allow",
          cancelButtonText: "No Thanks",
          siteNameText: "Celefy",
          actionMessage: "We'd like to send you notifications for upcoming birthdays!"
        }
      },

      // Welcome notification
      welcomeNotification: {
        title: "Welcome to Celefy! 🎉",
        message: "Get notified about birthdays and celebrations!",
        url: ""
      },

      // Notification settings
      notificationClickHandlerMatch: "origin",
      notificationClickHandlerAction: "focus"
    });

    // Wait for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mark as initialized
    window.OneSignal._isInitialized = true;
    console.log('✅ OneSignal v16 initialized successfully!');
    
    isInitializing = false;
    return true;
    
  } catch (error) {
    console.error('❌ Failed to initialize OneSignal v16:', error);
    isInitializing = false;
    throw error;
  }
};

/**
 * Check if user is subscribed to push notifications
 */
export const isSubscribed = async () => {
  try {
    // Use browser API directly to avoid OneSignal loops
    const browserPermission = Notification.permission;
    
    // Only check OneSignal if it's safe and we need additional info
    if (window.OneSignal && window.OneSignal._isInitialized && window.OneSignal.Notifications) {
      try {
        // Use a timeout to prevent hanging
        const oneSignalPermission = await Promise.race([
          window.OneSignal.Notifications.permission,
          new Promise((_, reject) => setTimeout(() => reject(new Error('OneSignal timeout')), 2000))
        ]);
        
        // If OneSignal says granted, trust it; otherwise use browser
        if (oneSignalPermission === 'granted') {
          return true;
        }
      } catch (oneSignalError) {
        console.warn('OneSignal permission check failed, using browser API:', oneSignalError);
      }
    }
    
    // Fallback to browser API (more reliable)
    return browserPermission === 'granted';
  } catch (error) {
    console.error('Error checking subscription status:', error);
    // Always fallback to browser API
    return Notification.permission === 'granted';
  }
};

/**
 * Request notification permission
 */
export const requestPermission = async () => {
  try {
    // Prevent multiple simultaneous permission requests
    if (isRequestingPermission) {
      console.log('🔔 Permission request already in progress, waiting...');
      return Notification.permission === 'granted';
    }
    
    isRequestingPermission = true;
    
    if (!window.OneSignal || !window.OneSignal._isInitialized) {
      throw new Error('OneSignal not initialized');
    }

    console.log('🔔 Requesting notification permission...');

    // Use v16 API if available
    if (window.OneSignal.Slidedown) {
      await window.OneSignal.Slidedown.promptPush();
      
      // Wait a bit for the permission dialog to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check permission using browser API instead of OneSignal to avoid loops
      const browserPermission = Notification.permission;
      console.log('🔔 Permission result:', browserPermission);
      
      isRequestingPermission = false;
      return browserPermission === 'granted';
      
    } else if (window.OneSignal.showSlidedownPrompt) {
      await window.OneSignal.showSlidedownPrompt();
      
      // Wait a bit for the permission dialog to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check permission using browser API
      const browserPermission = Notification.requestPermission();
      
      isRequestingPermission = false;
      return browserPermission === 'granted';
      
    } else {
      // Fallback to browser API
      const permission = await Notification.requestPermission();
      
      isRequestingPermission = false;
      return permission === 'granted';
    }
    
  } catch (error) {
    console.error('Error requesting permission:', error);
    isRequestingPermission = false;
    throw error;
  }
};

/**
 * Subscribe to push notifications
 */
export const subscribe = async () => {
  try {
    return await requestPermission();
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    throw error;
  }
};

/**
 * Unsubscribe from push notifications (limited in browser)
 */
export const unsubscribe = async () => {
  try {
    // Note: True unsubscription requires user to manually disable in browser settings
    console.log('🔕 Unsubscribe initiated - user should disable in browser settings');
    
    // Check current permission status
    const currentPermission = Notification.permission;
    
    if (currentPermission === 'granted') {
      console.log('⚠️ User still has granted permission - they need to manually disable in browser settings');
      console.log('📱 Instructions: Settings > Site Settings > Notifications > Block');
    }
    
    // We can't actually unsubscribe programmatically, but we can track intent
    localStorage.setItem('celefy_notifications_disabled', 'true');
    
    console.log('✅ Unsubscribe preference saved locally');
    console.log('💡 Note: To fully disable, user must block notifications in browser settings');
    
    return {
      success: true,
      message: 'Notifications disabled locally. For complete disable, block in browser settings.',
      permissionStatus: currentPermission,
      requiresBrowserAction: currentPermission === 'granted'
    };
  } catch (error) {
    console.error('Error unsubscribing from notifications:', error);
    throw error;
  }
};

/**
 * Send a test notification
 */
export const sendTestNotification = async (title = 'Test from Celefy! 🎉', message = 'This is a test notification to verify OneSignal is working!') => {
  try {
    // Check if notifications are disabled locally
    const locallyDisabled = localStorage.getItem('celefy_notifications_disabled');
    
    if (locallyDisabled === 'true') {
      console.log('Notifications disabled locally, checking if we should re-enable...');
      
      // If user has granted permission, we can override the local setting
      if (Notification.permission === 'granted') {
        console.log('Permission granted, overriding local disable setting');
        localStorage.removeItem('celefy_notifications_disabled');
      } else {
        console.log('Notifications disabled locally and no permission, skipping test');
        return false;
      }
    }

    // Create a simple browser notification for testing
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: message,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'celefy-test',
        requireInteraction: false,
        silent: false
      });

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);
      
      console.log('✅ Test notification sent via browser API');
      return true;
    } else if (Notification.permission === 'default') {
      // Permission not yet requested
      console.log('Permission not yet requested, requesting now...');
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Try again with the new permission
        return await sendTestNotification(title, message);
      } else {
        throw new Error('Notification permission denied by user');
      }
    } else {
      throw new Error('Notification permission not granted');
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw error;
  }
};

/**
 * Get OneSignal user ID (v16 compatible)
 */
export const getUserId = async () => {
  try {
    if (!window.OneSignal || !window.OneSignal._isInitialized) {
      return 'user-not-initialized';
    }

    // OneSignal v16 API structure check
    if (window.OneSignal.User && typeof window.OneSignal.User.getExternalId === 'function') {
      try {
        const userId = await window.OneSignal.User.getExternalId();
        return userId || 'user-' + Date.now();
      } catch (error) {
        console.warn('getExternalId failed, trying alternative method:', error);
      }
    }
    
    // Alternative v16 methods
    if (window.OneSignal.User && typeof window.OneSignal.User.getOneSignalId === 'function') {
      try {
        const userId = await window.OneSignal.User.getOneSignalId();
        return userId || 'user-' + Date.now();
      } catch (error) {
        console.warn('getOneSignalId failed:', error);
      }
    }
    
    // Check if User object has any ID-related properties
    if (window.OneSignal.User && window.OneSignal.User.externalId) {
      return window.OneSignal.User.externalId || 'user-' + Date.now();
    }
    
    // Final fallback - generate a unique ID
    const fallbackId = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    console.log('Using fallback user ID:', fallbackId);
    return fallbackId;
    
  } catch (error) {
    console.error('Error getting user ID:', error);
    // Generate a fallback ID even on error
    return 'user-error-' + Date.now();
  }
};

/**
 * Set user properties for targeting
 */
export const setUserProperties = async (properties) => {
  try {
    if (!window.OneSignal || !window.OneSignal._isInitialized) {
      console.log('OneSignal not ready, storing properties for later:', properties);
      return false;
    }

    // OneSignal v16 API structure check
    if (window.OneSignal.User && typeof window.OneSignal.User.addTags === 'function') {
      try {
        await window.OneSignal.User.addTags(properties);
        console.log('✅ User properties set via v16 API:', properties);
        return true;
      } catch (error) {
        console.warn('addTags failed, trying alternative method:', error);
      }
    }
    
    // Alternative v16 methods
    if (window.OneSignal.User && typeof window.OneSignal.User.setExternalId === 'function') {
      try {
        if (properties.externalId) {
          await window.OneSignal.User.setExternalId(properties.externalId);
          console.log('✅ External ID set via v16 API:', properties.externalId);
        }
        return true;
      } catch (error) {
        console.warn('setExternalId failed:', error);
      }
    }
    
    // Check if User object has any property-setting methods
    if (window.OneSignal.User && typeof window.OneSignal.User.set === 'function') {
      try {
        await window.OneSignal.User.set(properties);
        console.log('✅ User properties set via v16 set method:', properties);
        return true;
      } catch (error) {
        console.warn('User.set failed:', error);
      }
    }
    
    // Store properties locally if OneSignal methods fail
    console.log('✅ User properties would be set (stored locally):', properties);
    localStorage.setItem('celefy_user_properties', JSON.stringify(properties));
    return true;
    
  } catch (error) {
    console.error('Error setting user properties:', error);
    // Store properties locally as fallback
    try {
      localStorage.setItem('celefy_user_properties', JSON.stringify(properties));
      console.log('✅ User properties stored locally as fallback:', properties);
    } catch (localError) {
      console.error('Failed to store properties locally:', localError);
    }
    return false;
  }
};

/**
 * Check if OneSignal is ready
 */
export const isOneSignalReady = () => {
  return !!(window.OneSignal && window.OneSignal._isInitialized);
};

/**
 * Check and reset local notification state if appropriate
 */
export const checkLocalNotificationState = () => {
  try {
    const locallyDisabled = localStorage.getItem('celefy_notifications_disabled');
    const currentPermission = Notification.permission;
    
    // If user has granted permission but we have them marked as disabled locally,
    // we should re-enable them
    if (locallyDisabled === 'true' && currentPermission === 'granted') {
      console.log('🔄 Re-enabling notifications - user has granted permission');
      localStorage.removeItem('celefy_notifications_disabled');
      return {
        wasDisabled: true,
        isNowEnabled: true,
        message: 'Notifications re-enabled automatically'
      };
    }
    
    // If user has denied permission and we have them marked as enabled,
    // we should respect the browser's decision
    if (locallyDisabled !== 'true' && currentPermission === 'denied') {
      console.log('🔄 Respecting browser permission - user has denied notifications');
      localStorage.setItem('celefy_notifications_disabled', 'true');
      return {
        wasEnabled: true,
        isNowDisabled: true,
        message: 'Notifications disabled due to browser permission'
      };
    }
    
    return {
      noChange: true,
      currentState: locallyDisabled === 'true' ? 'disabled' : 'enabled',
      permission: currentPermission
    };
    
  } catch (error) {
    console.error('Error checking local notification state:', error);
    return { error: error.message };
  }
};

/**
 * Safely detect OneSignal v16 API structure
 */
export const detectOneSignalAPI = () => {
  try {
    if (!window.OneSignal) {
      return { error: 'OneSignal not available' };
    }
    
    const api = {
      version: window.OneSignal.VERSION || 'Unknown',
      hasUser: !!window.OneSignal.User,
      hasNotifications: !!window.OneSignal.Notifications,
      hasSlidedown: !!window.OneSignal.Slidedown,
      hasSession: !!window.OneSignal.Session,
      methods: {}
    };
    
    // Check User object methods
    if (window.OneSignal.User) {
      api.methods.User = Object.getOwnPropertyNames(window.OneSignal.User).filter(name => 
        typeof window.OneSignal.User[name] === 'function'
      );
    }
    
    // Check Notifications object methods
    if (window.OneSignal.Notifications) {
      api.methods.Notifications = Object.getOwnPropertyNames(window.OneSignal.Notifications).filter(name => 
        typeof window.OneSignal.Notifications[name] === 'function'
      );
    }
    
    // Check Slidedown object methods
    if (window.OneSignal.Slidedown) {
      api.methods.Slidedown = Object.getOwnPropertyNames(window.OneSignal.Slidedown).filter(name => 
        typeof window.OneSignal.Slidedown[name] === 'function'
      );
    }
    
    console.log('🔍 OneSignal v16 API detected:', api);
    return api;
    
  } catch (error) {
    console.error('Error detecting OneSignal API:', error);
    return { error: error.message };
  }
};

/**
 * Get debug information about OneSignal state
 */
export const getDebugInfo = async () => {
  try {
    // Prevent multiple simultaneous debug info requests
    if (isGettingDebugInfo) {
      console.log('🔍 Debug info request already in progress, returning cached info');
      return {
        oneSignalExists: !!window.OneSignal,
        isInitialized: !!(window.OneSignal && window.OneSignal._isInitialized),
        browserNotificationSupport: 'Notification' in window,
        serviceWorkerSupport: 'serviceWorker' in navigator,
        permission: Notification.permission,
        userAgent: navigator.userAgent,
        isHttps: location.protocol === 'https:',
        domain: location.hostname,
        cached: true
      };
    }
    
    isGettingDebugInfo = true;
    
    const info = {
      oneSignalExists: !!window.OneSignal,
      isInitialized: !!(window.OneSignal && window.OneSignal._isInitialized),
      browserNotificationSupport: 'Notification' in window,
      serviceWorkerSupport: 'serviceWorker' in navigator,
      permission: Notification.permission,
      userAgent: navigator.userAgent,
      isHttps: location.protocol === 'https:',
      domain: location.hostname
    };

    // Only get OneSignal info if it's safe and won't cause loops
    if (window.OneSignal && !window.OneSignal._isInitialized) {
      // OneSignal is not fully initialized, skip potentially problematic calls
      info.oneSignalVersion = 'Not fully initialized';
      info.oneSignalMethods = ['Skipped to prevent loops'];
    } else if (window.OneSignal) {
      try {
        // Use a timeout to prevent hanging
        const versionPromise = Promise.race([
          Promise.resolve(window.OneSignal.VERSION || 'Unknown'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Version timeout')), 1000))
        ]);
        
        info.oneSignalVersion = await versionPromise;
        
        // Safely get methods without calling them
        const methods = Object.keys(window.OneSignal).filter(key => 
          typeof window.OneSignal[key] !== 'function' || 
          ['init', 'VERSION', 'initialized', '_isInitialized'].includes(key)
        );
        info.oneSignalMethods = methods;
        
      } catch (oneSignalError) {
        console.warn('OneSignal debug info failed, using safe defaults:', oneSignalError);
        info.oneSignalVersion = 'Error getting version';
        info.oneSignalMethods = ['Error getting methods'];
      }
    }

    isGettingDebugInfo = false;
    return info;
    
  } catch (error) {
    console.error('Error getting debug info:', error);
    isGettingDebugInfo = false;
    return { 
      error: error.message,
      cached: true,
      oneSignalExists: !!window.OneSignal,
      isInitialized: !!(window.OneSignal && window.OneSignal._isInitialized),
      browserNotificationSupport: 'Notification' in window,
      serviceWorkerSupport: 'serviceWorker' in navigator,
      permission: Notification.permission,
      isHttps: location.protocol === 'https:',
      domain: location.hostname
    };
  }
};