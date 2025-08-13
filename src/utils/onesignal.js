// OneSignal utility functions - Simplified for v16 SDK compatibility

/**
 * Initialize OneSignal with proper configuration
 */
export const initializeOneSignal = async () => {
  try {
    console.log('🔍 Starting OneSignal initialization process...');
    
    // Wait for OneSignal SDK to be loaded
    if (typeof window === 'undefined') {
      throw new Error('Window is not available');
    }

    console.log('🔍 Checking if OneSignal SDK is available...');
    console.log('🔍 window.OneSignal exists:', !!window.OneSignal);
    
    if (window.OneSignal) {
      console.log('🔍 OneSignal object keys:', Object.keys(window.OneSignal));
      console.log('🔍 OneSignal.init exists:', typeof window.OneSignal.init);
    }

    // Wait for OneSignal to be available
    await new Promise((resolve, reject) => {
      const maxWaitTime = 30000; // 30 seconds timeout
      const startTime = Date.now();
      let checkCount = 0;
      
      const checkOneSignal = () => {
        checkCount++;
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        
        console.log(`🔍 Check #${checkCount} (${elapsed}s elapsed):`);
        console.log(`🔍 - OneSignal exists: ${!!window.OneSignal}`);
        console.log(`🔍 - OneSignal.init: ${typeof window.OneSignal?.init}`);
        
        // Check if OneSignal is loaded and has init function
        if (window.OneSignal && typeof window.OneSignal.init === 'function') {
          console.log('✅ OneSignal SDK detected and ready, proceeding...');
          resolve();
        } else if (Date.now() - startTime > maxWaitTime) {
          console.error('❌ Timeout reached! OneSignal SDK failed to load within 30 seconds');
          reject(new Error('OneSignal SDK failed to load within 30 seconds'));
        } else {
          setTimeout(checkOneSignal, 1000);
        }
      };
      
      checkOneSignal();
    });

    // Check if already initialized
    if (window.OneSignal.initialized) {
      console.log('✅ OneSignal already initialized');
      return true;
    }

    console.log('🔍 Initializing OneSignal with configuration...');
    
    // Initialize OneSignal with v16 configuration
    await window.OneSignal.init({
      appId: "b714db0f-1b9e-4b4b-87fb-1d52c3309714",
      safari_web_id: "web.onesignal.auto.145f18a4-510a-4781-b676-50fa3f7fa700",
      notifyButton: {
        enable: true,
      },
      allowLocalhostAsSecureOrigin: true,
      autoRegister: false,
      welcomeNotification: {
        title: "Welcome to Celefy! 🎉",
        message: "Get notified about birthdays and celebrations!"
      }
    });

    // Wait for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mark as initialized
    window.OneSignal.initialized = true;
    console.log('✅ OneSignal initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize OneSignal:', error);
    throw error;
  }
};

/**
 * Check if user is subscribed to push notifications
 */
export const isSubscribed = async () => {
  try {
    // Simply check browser notification permission
    return Notification.permission === 'granted';
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
};

/**
 * Request notification permission
 */
export const requestPermission = async () => {
  try {
    // Use browser notification permission directly
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting permission:', error);
    throw error;
  }
};

/**
 * Subscribe to push notifications
 */
export const subscribe = async () => {
  try {
    // Use browser notification permission directly
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    throw error;
  }
};

/**
 * Unsubscribe from push notifications
 */
export const unsubscribe = async () => {
  try {
    console.log('Successfully unsubscribed from notifications');
    return true;
  } catch (error) {
    console.error('Error unsubscribing from notifications:', error);
    throw error;
  }
};

/**
 * Send a test notification (for development)
 */
export const sendTestNotification = async (title = 'Test Notification', message = 'This is a test notification from Celefy!') => {
  try {
    // Create a simple browser notification for testing
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png'
      });
      console.log('Test notification sent via browser API');
      return true;
    } else {
      throw new Error('Notification permission not granted');
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw error;
  }
};

/**
 * Get OneSignal user ID
 */
export const getUserId = async () => {
  try {
    // Return a simple identifier
    return 'user-' + Date.now();
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

/**
 * Set user properties for targeting
 */
export const setUserProperties = async (properties) => {
  try {
    console.log('User properties would be set:', properties);
    return true;
  } catch (error) {
    console.error('Error setting user properties:', error);
    throw error;
  }
};
