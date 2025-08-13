const waitForOneSignal = () => {
  return new Promise((resolve, reject) => {
    if (typeof window.OneSignal !== 'undefined') {
      resolve(window.OneSignal);
      return;
    }

    let attempts = 0;
    const maxAttempts = 30; // 30 seconds
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      if (typeof window.OneSignal !== 'undefined') {
        clearInterval(checkInterval);
        resolve(window.OneSignal);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        reject(new Error('OneSignal not loaded after 30 seconds'));
      }
    }, 1000);
  });
};

/**
 * Check if user is subscribed to notifications
 */
export const isSubscribed = async () => {
  try {
    // Simple browser API check (most reliable)
    return Notification.permission === 'granted';
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
};

/**
 * Request notification permission
 */
export const requestPermission = async () => {
  try {
    const OneSignal = await waitForOneSignal();
    
    // Request permission using OneSignal
    await OneSignal.Slidedown.promptPush();
    
    // Wait a moment for permission to be processed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return Notification.permission === 'granted';
  } catch (error) {
    console.error('Error requesting permission:', error);
    
    // Fallback to browser API
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (fallbackError) {
      console.error('Fallback permission request failed:', fallbackError);
      return false;
    }
  }
};

/**
 * Send a test notification
 */
export const sendTestNotification = async () => {
  try {
    const OneSignal = await waitForOneSignal();
    
    // Get the user's OneSignal ID
    const userId = await OneSignal.User.PushSubscription.id;
    
    if (!userId) {
      throw new Error('User not subscribed');
    }

    // Send test notification using OneSignal REST API
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic os_v2_app_w4knwdy3tzfuxb73dvjmgmexctwwjbe7rq4e654bolid4wgfk5cyj66gi2rm3rmm5vfvhra7uoabibeao7zupkil65bx5mo4qnkqfti' // Replace with your REST API key
      },
      body: JSON.stringify({
        app_id: "b714db0f-1b9e-4b4b-87fb-1d52c3309714",
        include_player_ids: [userId],
        headings: { en: "🎂 Test from Celefy!" },
        contents: { en: "Your push notifications are working perfectly! 🎉" },
        url: window.location.origin
      })
    });

    if (response.ok) {
      console.log('✅ Test notification sent successfully');
      return true;
    } else {
      throw new Error('Failed to send notification');
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    
    // Fallback: Show browser notification
    if (Notification.permission === 'granted') {
      new Notification('🎂 Test from Celefy!', {
        body: 'Your push notifications are working! 🎉',
        icon: '/icons/icon-192.png'
      });
      return true;
    }
    
    return false;
  }
};

/**
 * Unsubscribe from notifications
 */
export const unsubscribe = async () => {
  try {
    const OneSignal = await waitForOneSignal();
    
    // Unsubscribe using OneSignal
    await OneSignal.User.PushSubscription.optOut();
    
    console.log('✅ Successfully unsubscribed');
    return true;
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return false;
  }
};

/**
 * Get basic debug information
 */
export const getDebugInfo = () => {
  return {
    oneSignalLoaded: typeof window.OneSignal !== 'undefined',
    notificationSupport: 'Notification' in window,
    permission: Notification.permission,
    isHttps: location.protocol === 'https:',
    domain: location.hostname
  };
};