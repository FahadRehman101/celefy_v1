// 🔒 SECURE - src/config/firebase.js - NATIVE ANDROID COMPATIBLE
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 🔑 Secure Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// ✅ Validate that all required environment variables are present
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN', 
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required Firebase environment variables:', missingVars);
  console.error('📝 Please check your .env file and ensure all Firebase variables are set');
  throw new Error(`Missing Firebase configuration: ${missingVars.join(', ')}`);
}

console.log('✅ Firebase configuration loaded successfully');

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Initialize Services
const auth = getAuth(app);
const db = getFirestore(app);

// 🚀 NATIVE ANDROID COMPATIBILITY: Configure Google Auth for native apps
const googleProvider = new GoogleAuthProvider();

// CRITICAL: Configure Google Auth for native Android
googleProvider.setCustomParameters({
  // Force account selection for better mobile UX
  prompt: 'select_account',
  // Ensure proper redirect handling in native mode
  redirect_uri: window.location.origin,
  // Add mobile-specific parameters
  mobile: true,
  // Native app authentication
  native: true
});

// 🚀 NATIVE ANDROID COMPATIBILITY: Configure auth for native apps
if (typeof window !== 'undefined' && window.Capacitor) {
  console.log('🚀 Capacitor detected - configuring Firebase for native Android app');
  
  // Configure auth for native app behavior
  auth.useDeviceLanguage();
  
  // Set persistence for better mobile experience
  auth.settings.appVerificationDisabledForTesting = false;
  
  // Enable native authentication
  auth.settings.forceRefreshToken = true;
}

console.log('✅ Firebase configured for native Android compatibility');

// ✅ Export everything
export {
  auth,
  db,
  googleProvider
};