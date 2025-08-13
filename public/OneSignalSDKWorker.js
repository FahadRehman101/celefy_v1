// OneSignalSDKWorker.js - OneSignal v16 Compatible Service Worker
// This file should be placed in your public folder as OneSignalSDKWorker.js

// Import OneSignal v16 service worker
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

// Optional: Add custom notification handling
self.addEventListener('notificationclick', function(event) {
  console.log('OneSignal v16: Notification clicked', event);
  
  // Close the notification
  event.notification.close();
  
  // Handle the click action
  event.waitUntil(
    clients.matchAll().then(function(clientList) {
      // If a client is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Otherwise open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Custom notification display for Celefy
self.addEventListener('push', function(event) {
  console.log('OneSignal v16: Push notification received', event);
  
  // Let OneSignal handle the push event
  // But you can add custom logic here if needed
});

// Service worker install event
self.addEventListener('install', function(event) {
  console.log('OneSignal v16: Service worker installing');
  self.skipWaiting(); // Force activation
});

// Service worker activate event
self.addEventListener('activate', function(event) {
  console.log('OneSignal v16: Service worker activated');
  event.waitUntil(self.clients.claim()); // Take control immediately
});