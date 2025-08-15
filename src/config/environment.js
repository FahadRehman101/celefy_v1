// 🔧 NEW FILE - src/config/environment.js
export const validateEnvironment = () => {
    const requiredVars = {
      // Firebase (Critical)
      VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
      VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
      
      // OneSignal (Optional for notifications)
      VITE_ONESIGNAL_APP_ID: import.meta.env.VITE_ONESIGNAL_APP_ID,
      VITE_ONESIGNAL_REST_API_KEY: import.meta.env.VITE_ONESIGNAL_REST_API_KEY,
    };
  
    const missing = Object.entries(requiredVars)
      .filter(([, value]) => !value)
      .map(([key]) => key);
  
    if (missing.length > 0) {
      console.error('❌ Missing environment variables:', missing);
      return { valid: false, missing };
    }
  
    console.log('✅ All environment variables configured');
    return { valid: true, missing: [] };
  };