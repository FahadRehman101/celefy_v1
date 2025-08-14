// src/config/onesignal.js - Simplified without Identity Verification
export const ONESIGNAL_CONFIG = {
  appId: 'b714db0f-1b9e-4b4b-87fb-1d52c3309714',
  restApiKey: import.meta.env.VITE_ONESIGNAL_REST_API_KEY || 'os_v2_app_w4knwdy3tzfuxb73dvjmgmexcscl4ueqd6uuqw4l4wiq3bt73qboswce2a2n3qqduy7qfjylxa7kltawenso7zfg36ju67kxxqy7d3q',
  safariWebId: 'web.onesignal.auto.145f18a4-510a-4781-b676-50fa3f7fa700'
};

export const initializeOneSignal = async () => {
  try {
    console.log('🔧 Initializing OneSignal (Simplified)...');
    
    // Wait for OneSignal to load
    if (!window.OneSignal) {
      console.log('⏳ Waiting for OneSignal SDK to load...');
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (window.OneSignal) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }
    
    await window.OneSignal.init({
      appId: ONESIGNAL_CONFIG.appId,
      safari_web_id: ONESIGNAL_CONFIG.safariWebId,
      allowLocalhostAsSecureOrigin: true,
      
      // Auto prompt after 3 seconds
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
                timeDelay: 3
              }
            }
          ]
        }
      },
      
      notifyButton: {
        enable: true,
        position: 'bottom-right'
      }
    });
    
    console.log('✅ OneSignal initialized successfully!');
    
    // Check subscription status
    const isPushEnabled = await window.OneSignal.User.PushSubscription.optedIn;
    console.log('📱 Push notifications enabled:', isPushEnabled);
    
    if (isPushEnabled) {
      const pushId = await window.OneSignal.User.PushSubscription.id;
      console.log('🔑 Subscription ID:', pushId);
    }
    
  } catch (error) {
    console.error('❌ OneSignal initialization failed:', error);
  }
};

export const checkSubscriptionStatus = async () => {
  try {
    if (!window.OneSignal) return false;
    const isSubscribed = await window.OneSignal.User.PushSubscription.optedIn;
    return isSubscribed;
  } catch (error) {
    console.error('❌ Failed to check subscription:', error);
    return false;
  }
};

export const requestPermission = async () => {
  try {
    if (!window.OneSignal) {
      throw new Error('OneSignal not initialized');
    }
    await window.OneSignal.Slidedown.promptPush();
    return await checkSubscriptionStatus();
  } catch (error) {
    console.error('❌ Failed to request permission:', error);
    return false;
  }
};

export const isOneSignalConfigured = () => {
  return !!(ONESIGNAL_CONFIG.appId && ONESIGNAL_CONFIG.restApiKey);
};

export const getOneSignalConfig = () => ONESIGNAL_CONFIG;