/**
 * OneSignal Configuration
 * Centralized configuration for OneSignal push notifications
 */

// OneSignal App Configuration
export const ONESIGNAL_CONFIG = {
  // App ID from OneSignal dashboard
  appId: import.meta.env.VITE_ONESIGNAL_APP_ID || "b714db0f-1b9e-4b4b-87fb-1d52c3309714",
  
  // Safari Web ID
  safariWebId: import.meta.env.VITE_ONESIGNAL_SAFARI_WEB_ID || "web.onesignal.auto.145f18a4-510a-4781-b676-50fa3f7fa700",
  
  // REST API Key for server-side operations
  restApiKey: import.meta.env.VITE_ONESIGNAL_REST_API_KEY || "os_v2_app_w4knwdy3tzfuxb73dvjmgmexcscl4ueqd6uuqw4l4wiq3bt73qboswce2a2n3qqduy7qfjylxa7kltawenso7zfg36ju67kxxqy7d3q",
  
  // 🔧 FIXED: Simplified notification settings (removed problematic androidChannelId)
  notificationSettings: {
    androidAccentColor: "FF9C27B0",
    priority: 10
    // Removed: smallIcon, largeIcon, androidChannelId (these need to be set up in OneSignal dashboard first)
  }
};

// Check if OneSignal is properly configured
export const isOneSignalConfigured = () => {
  return !!(ONESIGNAL_CONFIG.appId && ONESIGNAL_CONFIG.restApiKey);
};

// Get OneSignal configuration with validation
export const getOneSignalConfig = () => {
  if (!isOneSignalConfigured()) {
    console.warn('⚠️ OneSignal configuration incomplete. Some features may not work properly.');
    console.warn('Required environment variables: VITE_ONESIGNAL_APP_ID, VITE_ONESIGNAL_REST_API_KEY');
  }
  
  return ONESIGNAL_CONFIG;
};

// OneSignal initialization options
export const getOneSignalInitOptions = () => ({
  appId: ONESIGNAL_CONFIG.appId,
  safari_web_id: ONESIGNAL_CONFIG.safariWebId,
  notifyButton: { enable: true },
  allowLocalhostAsSecureOrigin: true,
  autoRegister: false,
  welcomeNotification: {
    title: "Welcome to Celefy! 🎉",
    message: "Get notified about birthdays and celebrations!"
  }
});

export default ONESIGNAL_CONFIG;