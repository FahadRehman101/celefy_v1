// OneSignalSDKWorker.js - OneSignal v16 Compatible Service Worker
// This file should be placed in your public folder as OneSignalSDKWorker.js

// CRITICAL FIX: Import OneSignal v16 service worker with proper error handling
try {
  importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
  console.log('✅ OneSignal v16 service worker imported successfully');
} catch (error) {
  console.error('❌ Failed to import OneSignal service worker:', error);
}

// CRITICAL FIX: Minimal event handling to prevent warnings
// Let OneSignal handle everything internally