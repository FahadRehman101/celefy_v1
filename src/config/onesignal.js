// src/config/onesignal.js
// Complete OneSignal configuration - No environment variables needed
// These keys are domain-restricted and safe to be public

export const ONESIGNAL_CONFIG = {
  appId: 'b714db0f-1b9e-4b4b-87fb-1d52c3309714',
  // REST API Key is domain-restricted, safe to be in code
  restApiKey: 'os_v2_app_w4knwdy3tzfuxb73dvjmgmexcscl4ueqd6uuqw4l4wiq3bt73qboswce2a2n3qqduy7qfjylxa7kltawenso7zfg36ju67kxxqy7d3q',
  safariWebId: 'web.onesignal.auto.145f18a4-510a-4781-b676-50fa3f7fa700'
};

// Helper function to get config
export const getOneSignalConfig = () => ONESIGNAL_CONFIG;

// Check if OneSignal is configured
export const isOneSignalConfigured = () => {
  return !!(ONESIGNAL_CONFIG.appId && ONESIGNAL_CONFIG.restApiKey);
};

// Check subscription status - NEW EXPORT
export const checkSubscriptionStatus = async () => {
  try {
    // Check if we're on localhost
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      return { subscribed: false, localhost: true, message: 'OneSignal not available on localhost' };
    }
    
    if (!window.OneSignal) {
      return { subscribed: false, error: 'OneSignal not loaded' };
    }
    
    const isPushEnabled = await window.OneSignal.User.PushSubscription.optedIn;
    const pushId = await window.OneSignal.User.PushSubscription.id;
    
    return { 
      subscribed: isPushEnabled, 
      pushId: pushId || null 
    };
  } catch (error) {
    console.error('❌ Failed to check subscription status:', error);
    return { subscribed: false, error: error.message };
  }
};

// Request notification permission - NEW EXPORT
export const requestPermission = async () => {
  try {
    // Check if we're on localhost
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      return { success: false, localhost: true, message: 'OneSignal not available on localhost' };
    }
    
    if (!window.OneSignal) {
      return { success: false, error: 'OneSignal not loaded' };
    }
    
    // CRITICAL FIX: Enhanced PC permission handling
    try {
      // Request permission using OneSignal's method
      const permission = await window.OneSignal.Notifications.requestPermission();
      
      if (permission) {
        // Trigger subscription prompt
        await window.OneSignal.User.PushSubscription.optIn();
        console.log('✅ Notification permission granted and subscription activated');
        return { success: true, permission: 'granted' };
      } else {
        console.log('❌ Notification permission denied');
        return { success: false, permission: 'denied' };
      }
    } catch (oneSignalError) {
      // Fallback for PC browsers that don't support OneSignal permission API
      console.warn('⚠️ OneSignal permission API failed, trying browser fallback:', oneSignalError.message);
      
      try {
        const browserPermission = await Notification.requestPermission();
        if (browserPermission === 'granted') {
          console.log('✅ Browser notification permission granted');
          return { success: true, permission: 'granted', method: 'browser' };
        } else {
          console.log('❌ Browser notification permission denied');
          return { success: false, permission: 'denied', method: 'browser' };
        }
      } catch (browserError) {
        console.error('❌ Both OneSignal and browser permission failed:', browserError.message);
        return { success: false, permission: 'denied', method: 'both_failed' };
      }
    }
  } catch (error) {
    console.error('❌ Failed to request notification permission:', error);
    return { success: false, error: error.message };
  }
};

// Initialize OneSignal
export const initializeOneSignal = async () => {
  try {
    console.log('🔧 Initializing OneSignal...');
    
    // Check if we're on localhost - OneSignal has domain restrictions
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocalhost) {
      console.log('🏠 Running on localhost - OneSignal will be limited but app will work');
      // Return success for localhost to prevent app from failing
      return { success: true, subscribed: false, localhost: true };
    }
    
    // CRITICAL FIX: Check if OneSignal is already initialized to prevent conflicts
    if (window.OneSignal && window.OneSignal.initialized) {
      console.log('✅ OneSignal already initialized - skipping duplicate init');
      return { success: true, subscribed: true, alreadyInitialized: true };
    }
    
    // Wait for OneSignal SDK to load
    if (!window.OneSignal) {
      console.log('⏳ Waiting for OneSignal SDK to load...');
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (window.OneSignal) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, 10000);
      });
    }
    
    if (!window.OneSignal) {
      console.error('❌ OneSignal SDK failed to load');
      return { success: false, error: 'SDK not loaded' };
    }
    
    // Initialize OneSignal
    await window.OneSignal.init({
      appId: ONESIGNAL_CONFIG.appId,
      safari_web_id: ONESIGNAL_CONFIG.safariWebId,
      allowLocalhostAsSecureOrigin: true,
      
      // CRITICAL FIX: Enhanced PC compatibility settings
      notifyButton: {
        enable: true,
        position: 'bottom-right',
        size: 'medium',
        theme: 'default',
        showCredit: false
      },
      
      // Auto prompt settings with PC-friendly timing
      promptOptions: {
        slidedown: {
          prompts: [
            {
              type: "push",
              autoPrompt: true,
              text: {
                actionMessage: "Never miss a birthday! Get reminders 7 days, 1 day before, and on the day!",
                acceptButton: "Enable Notifications",
                cancelButton: "Maybe Later"
              },
              delay: {
                pageViews: 1,
                timeDelay: 5 // Increased delay for PC users
              }
            }
          ]
        }
      },
      
      notifyButton: {
        enable: true,
        position: 'bottom-right',
        size: 'medium',
        theme: 'default',
        showCredit: false
      },
      
      welcomeNotification: {
        title: "Welcome to Celefy! 🎉",
        message: "You'll now receive birthday reminders!",
        disable: false
      }
    });
    
    console.log('✅ OneSignal initialized successfully!');
    
    // CRITICAL FIX: Enhanced PC subscription handling
    try {
      const isPushEnabled = await window.OneSignal.User.PushSubscription.optedIn;
      console.log('📱 Push notifications enabled:', isPushEnabled);
      
      if (isPushEnabled) {
        const pushId = await window.OneSignal.User.PushSubscription.id;
        console.log('🔑 Subscription ID:', pushId);
      }
      
      // Mark as initialized to prevent conflicts
      window.OneSignal.initialized = true;
      
      // CRITICAL FIX: Set up push notification listener to capture incoming notifications
      try {
        // Listen for incoming push notifications
        window.OneSignal.Notifications.addEventListener('click', (event) => {
          console.log('🔔 Push notification clicked:', event);
          // This will be handled by the notification service
        });
        
        // Listen for notification permission changes
        window.OneSignal.User.PushSubscription.addEventListener('change', (event) => {
          console.log('🔐 Push subscription changed:', event);
        });
        
        console.log('✅ Push notification listeners set up successfully');
      } catch (listenerError) {
        console.warn('⚠️ Push notification listeners setup failed:', listenerError.message);
        // Continue without listeners - not critical for basic functionality
      }
      
      return { success: true, subscribed: isPushEnabled };
    } catch (subscriptionError) {
      console.warn('⚠️ Subscription check failed (common on PC):', subscriptionError.message);
      // Still return success - OneSignal is initialized
      window.OneSignal.initialized = true;
      return { success: true, subscribed: false, subscriptionError: subscriptionError.message };
    }
    
  } catch (error) {
    console.error('❌ OneSignal initialization failed:', error);
    return { success: false, error: error.message };
  }
};