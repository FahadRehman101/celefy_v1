// OneSignal App Configuration
export const ONESIGNAL_CONFIG = {
  // App ID from OneSignal dashboard
  appId: import.meta.env.VITE_ONESIGNAL_APP_ID || "b714db0f-1b9e-4b4b-87fb-1d52c3309714",
  
  // Safari Web ID
  safariWebId: import.meta.env.VITE_ONESIGNAL_SAFARI_WEB_ID || "web.onesignal.auto.145f18a4-510a-4781-b676-50fa3f7fa700",
  
  // REST API Key for server-side operations
  restApiKey: import.meta.env.VITE_ONESIGNAL_REST_API_KEY,
  
  // Enhanced notification settings for better reliability
  notificationSettings: {
    androidAccentColor: "FF9C27B0",
    priority: 10,
    requireInteraction: true, // Keep notifications visible until user interacts
    persistNotification: true, // Don't auto-dismiss notifications
    showCreatedAt: true, // Show timestamp
    autoResubscribe: true // Auto-resubscribe if permission granted again
  }
};

// Enhanced configuration validation
export const isOneSignalConfigured = () => {
  const hasAppId = !!(ONESIGNAL_CONFIG.appId && ONESIGNAL_CONFIG.appId !== "your_app_id_here");
  const hasRestApiKey = !!(ONESIGNAL_CONFIG.restApiKey && ONESIGNAL_CONFIG.restApiKey !== "your_rest_api_key_here");
  
  // Log configuration status for debugging
  console.log('🔧 OneSignal Configuration Check:', {
    appId: hasAppId ? '✅ Configured' : '❌ Missing',
    restApiKey: hasRestApiKey ? '✅ Configured' : '❌ Missing',
    appIdValue: ONESIGNAL_CONFIG.appId ? `${ONESIGNAL_CONFIG.appId.substring(0, 8)}...` : 'Not set',
    environment: window.location.hostname
  });
  
  return hasAppId && hasRestApiKey;
};

// Enhanced configuration getter with detailed validation
export const getOneSignalConfig = () => {
  const config = ONESIGNAL_CONFIG;
  
  if (!config.appId || config.appId === "your_app_id_here") {
    console.warn('⚠️ OneSignal App ID not configured. Set VITE_ONESIGNAL_APP_ID in your .env file');
  }
  
  if (!config.restApiKey || config.restApiKey === "your_rest_api_key_here") {
    console.warn('⚠️ OneSignal REST API Key not configured. Set VITE_ONESIGNAL_REST_API_KEY in your .env file');
  }
  
  return config;
};

// Enhanced OneSignal initialization options
export const getOneSignalInitOptions = () => {
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.includes('localhost');
  
  console.log('🔧 Environment detected:', {
    hostname: window.location.hostname,
    isLocalhost,
    protocol: window.location.protocol
  });
  
  const baseOptions = {
    appId: ONESIGNAL_CONFIG.appId,
    safari_web_id: ONESIGNAL_CONFIG.safariWebId,
    
    // CRITICAL FIX: Enable automatic subscription
    autoRegister: true, // This will automatically register users
    autoResubscribe: true, // Auto-resubscribe if user re-enables notifications
    
    // CRITICAL FIX: Enable notification button to trigger subscription
    notifyButton: { 
      enable: true, // Enable the notification button
      showAfterSubscribed: false, // Show even after subscription
      text: {
        "tip.state.unsubscribed": "Subscribe to notifications",
        "tip.state.subscribed": "You're subscribed!",
        "tip.state.blocked": "You've blocked notifications"
      }
    },
    
    // CRITICAL FIX: Enable welcome notification
    welcomeNotification: {
      disable: false, // Show welcome notification
      title: "Welcome to Celefy! 🎉",
      message: "You'll now receive birthday reminders and notifications."
    },
    
    // Service worker path (important for production)
    path: "/",
    serviceWorkerPath: "/OneSignalSDKWorker.js",
    
    // CRITICAL FIX: Enable automatic prompts
    promptOptions: {
      slidedown: {
        enabled: true, // Enable the slidedown prompt
        autoPrompt: true, // Automatically show the prompt
        text: {
          "prompt.action.subscribe": "Subscribe",
          "prompt.action.cancel": "Not now",
          "prompt.message": "Get notified about birthdays and reminders!"
        }
      },
      native: {
        enabled: true, // Enable native browser prompt
        autoPrompt: true // Automatically trigger native prompt
      }
    }
  };

  // Add development-specific options for localhost
  if (isLocalhost) {
    console.log('🔧 Adding localhost-specific options');
    return {
      ...baseOptions,
      allowLocalhostAsSecureOrigin: true,
      subdomainName: undefined, // Disable subdomain for localhost
      httpPermissionRequest: {
        enable: true,
        useCustomModal: true
      }
    };
  }

  return baseOptions;
};

// CRITICAL FIX: Enhanced OneSignal initialization function for v16 API
export const initializeOneSignal = async () => {
  try {
    console.log('🔧 Starting OneSignal initialization...');
    console.log('🔧 Current window.OneSignal state:', {
      exists: !!window.OneSignal,
      type: typeof window.OneSignal,
      hasInit: !!(window.OneSignal && typeof window.OneSignal.init === 'function'),
      hasUser: !!(window.OneSignal && window.OneSignal.User)
    });
    
    // Check if OneSignal is already initialized
    if (window.OneSignal && window.OneSignal.User) {
      console.log('✅ OneSignal already initialized');
      return window.OneSignal;
    }

    // Wait for OneSignal SDK to be available
    let attempts = 0;
    const maxAttempts = 100; // 10 second timeout for localhost
    
    console.log('⏳ Waiting for OneSignal SDK to be available...');
    
    while (attempts < maxAttempts) {
      if (window.OneSignal && typeof window.OneSignal.init === 'function') {
        console.log('✅ OneSignal SDK found, initializing...');
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
      
      if (attempts % 10 === 0) {
        console.log(`⏳ Still waiting... (${attempts}/${maxAttempts})`);
      }
    }
    
    if (!window.OneSignal || typeof window.OneSignal.init !== 'function') {
      throw new Error('OneSignal SDK not available after timeout');
    }

    // Initialize OneSignal with proper error handling
    const options = getOneSignalInitOptions();
    console.log('🔧 Initializing OneSignal with options:', options);
    
    // Use the v16 API initialization method
    await new Promise((resolve, reject) => {
      try {
        console.log('🔧 Calling OneSignal.init...');
        window.OneSignal.init(options);
        
        // Wait for initialization to complete
        window.OneSignal.on('initialized', () => {
          console.log('✅ OneSignal initialization completed');
          resolve();
        });
        
        // Set a timeout for initialization
        setTimeout(() => {
          if (window.OneSignal.User) {
            console.log('✅ OneSignal User object available');
            resolve();
          } else {
            console.log('⚠️ OneSignal User object not available after timeout');
            reject(new Error('OneSignal initialization timeout'));
          }
        }, 5000);
        
      } catch (error) {
        console.error('❌ Error during OneSignal.init:', error);
        reject(error);
      }
    });
    
    console.log('✅ OneSignal initialized successfully');
    return window.OneSignal;
    
  } catch (error) {
    console.error('❌ OneSignal initialization failed:', error);
    
    // For localhost, try a fallback initialization
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('localhost')) {
      console.log('🔄 Trying fallback initialization for localhost...');
      try {
        // Simple initialization without complex options
        const fallbackOptions = {
          appId: ONESIGNAL_CONFIG.appId,
          allowLocalhostAsSecureOrigin: true,
          autoRegister: false
        };
        
        console.log('🔧 Fallback options:', fallbackOptions);
        window.OneSignal.init(fallbackOptions);
        console.log('✅ OneSignal fallback initialization successful');
        return window.OneSignal;
      } catch (fallbackError) {
        console.error('❌ Fallback initialization also failed:', fallbackError);
      }
    }
    
    return null;
  }
};

// CRITICAL FIX: Function to manually trigger subscription prompt
export const triggerSubscriptionPrompt = async () => {
  try {
    console.log('🔔 Triggering OneSignal subscription prompt...');
    
    if (!window.OneSignal) {
      throw new Error('OneSignal not available');
    }
    
    // Method 1: Try v16 API
    if (window.OneSignal.Slidedown && typeof window.OneSignal.Slidedown.promptPush === 'function') {
      console.log('🎯 Using OneSignal.Slidedown.promptPush (v16 API)...');
      await window.OneSignal.Slidedown.promptPush();
      console.log('✅ Subscription prompt triggered via v16 API');
      return true;
    }
    
    // Method 2: Try legacy API
    if (typeof window.OneSignal.showSlidedownPrompt === 'function') {
      console.log('🎯 Using OneSignal.showSlidedownPrompt (legacy API)...');
      await window.OneSignal.showSlidedownPrompt();
      console.log('✅ Subscription prompt triggered via legacy API');
      return true;
    }
    
    // Method 3: Try native prompt
    if (typeof window.OneSignal.registerForPushNotifications === 'function') {
      console.log('🎯 Using OneSignal.registerForPushNotifications...');
      await window.OneSignal.registerForPushNotifications();
      console.log('✅ Native subscription prompt triggered');
      return true;
    }
    
    throw new Error('No subscription method available');
    
  } catch (error) {
    console.error('❌ Failed to trigger subscription prompt:', error);
    return false;
  }
};

// CRITICAL FIX: Function to check and request notification permission
export const requestNotificationPermission = async () => {
  try {
    console.log('🔐 Requesting notification permission...');
    
    // Check current permission status
    const currentPermission = Notification.permission;
    console.log('📊 Current notification permission:', currentPermission);
    
    if (currentPermission === 'granted') {
      console.log('✅ Notification permission already granted');
      return true;
    }
    
    if (currentPermission === 'denied') {
      console.log('❌ Notification permission denied by user');
      alert('Please enable notifications in your browser settings to receive birthday reminders.');
      return false;
    }
    
    // Request permission
    console.log('🔔 Requesting notification permission from user...');
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('✅ Notification permission granted by user');
      
      // Now trigger OneSignal subscription
      const subscriptionResult = await triggerSubscriptionPrompt();
      if (subscriptionResult) {
        console.log('✅ OneSignal subscription prompt triggered successfully');
        return true;
      } else {
        console.warn('⚠️ OneSignal subscription prompt failed, but permission granted');
        return true; // Permission granted, even if OneSignal prompt failed
      }
    } else {
      console.log('❌ Notification permission denied by user');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error requesting notification permission:', error);
    return false;
  }
};

// Utility function to check OneSignal status
export const getOneSignalStatus = () => {
  if (!window.OneSignal) {
    return { loaded: false, initialized: false, error: 'OneSignal SDK not loaded' };
  }
  
  try {
    const isInitialized = !!(window.OneSignal.User && window.OneSignal.User.PushSubscription);
    return {
      loaded: true,
      initialized: isInitialized,
      user: window.OneSignal.User,
      subscription: window.OneSignal.User?.PushSubscription
    };
  } catch (error) {
    return {
      loaded: true,
      initialized: false,
      error: error.message
    };
  }
};

// Debug function to log OneSignal state
export const debugOneSignalState = () => {
  console.log('🔍 OneSignal Debug State:', {
    windowExists: typeof window !== 'undefined',
    oneSignalExists: !!window.OneSignal,
    oneSignalType: typeof window.OneSignal,
    hasInit: !!(window.OneSignal && typeof window.OneSignal.init === 'function'),
    hasUser: !!(window.OneSignal && window.OneSignal.User),
    hasPushSubscription: !!(window.OneSignal && window.OneSignal.User && window.OneSignal.User.PushSubscription),
    location: window.location.href,
    userAgent: navigator.userAgent
  });
};

export default ONESIGNAL_CONFIG;
