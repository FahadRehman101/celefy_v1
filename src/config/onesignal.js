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
export const getOneSignalInitOptions = () => ({
  appId: ONESIGNAL_CONFIG.appId,
  safari_web_id: ONESIGNAL_CONFIG.safariWebId,
  
  // Enhanced initialization settings
  notifyButton: { 
    enable: false // We'll use custom permission flow
  },
  
  allowLocalhostAsSecureOrigin: true, // For development
  autoRegister: false, // We'll handle registration manually
  autoResubscribe: true, // Auto-resubscribe if user re-enables notifications
  
  // Enhanced welcome notification
  welcomeNotification: {
    disable: true // We'll show custom welcome message
  },
  
  // Service worker path (important for production)
  path: "/",
  serviceWorkerPath: "/OneSignalSDKWorker.js",
  
  // Enhanced prompt settings
  promptOptions: {
    slidedown: {
      enabled: false // We'll use custom prompts
    },
    native: {
      enabled: false // We'll trigger native prompt ourselves
    }
  }
});

export default ONESIGNAL_CONFIG;
