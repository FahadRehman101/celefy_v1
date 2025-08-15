importScripts('https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js');

// Service Worker for Celefy - Focus on caching, let OneSignal handle push notifications
const CACHE_NAME = 'celefy-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache if available
self.addEventListener('fetch', (event) => {
  // Skip OneSignal requests
  if (event.request.url.includes('onesignal') || event.request.url.includes('cdn.onesignal.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Enhanced PC compatibility - try multiple approaches
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Try to focus existing window first
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes('celefy') && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no existing window, open new one
        if (clients.openWindow) {
          return clients.openWindow('https://celefy.netlify.app');
        }
        
        // Fallback for older browsers
        return clients.openWindow('/');
      })
  );
});

// CRITICAL FIX: Handle incoming push notifications
self.addEventListener('push', function(event) {
  console.log('🔔 Push notification received in service worker:', event);
  
  if (event.data) {
    try {
      const notificationData = event.data.json();
      console.log('📱 Processing push notification:', notificationData);
      
      // Store notification data for the app to process
      event.waitUntil(
        // You can add additional processing here if needed
        Promise.resolve()
      );
    } catch (error) {
      console.error('❌ Failed to process push notification:', error);
    }
  }
});