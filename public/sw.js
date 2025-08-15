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
          if (cacheName !== CACHE_NAME && cacheName !== 'celefy-notifications') {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// CRITICAL FIX: Background sync for offline notifications
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-notification-sync') {
    console.log('🔄 Background sync triggered for notifications');
    event.waitUntil(syncNotifications());
  }
});

// CRITICAL FIX: Listen for messages from main app
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'TRIGGER_BACKGROUND_SYNC') {
    console.log('🔄 Background sync triggered by main app');
    event.waitUntil(syncNotifications());
  }
});

// CRITICAL FIX: Sync notifications when app comes back online
async function syncNotifications() {
  try {
    const cache = await caches.open('celefy-notifications');
    const keys = await cache.keys();
    
    console.log(`🔄 Syncing ${keys.length} offline notifications`);
    
    for (const key of keys) {
      const response = await cache.match(key);
      const notificationData = await response.json();
      
      // CRITICAL FIX: Enhanced mobile notification retry logic
      if (notificationData.retryCount && notificationData.retryCount >= 3) {
        console.log('⚠️ Notification retry limit reached, removing from cache');
        await cache.delete(key);
        continue;
      }
      
      // Try to send to main app
      const clients = await self.clients.matchAll();
      let syncSuccess = false;
      
      for (const client of clients) {
        try {
          client.postMessage({
            type: 'OFFLINE_NOTIFICATION_SYNC',
            notification: notificationData
          });
          syncSuccess = true;
          console.log('✅ Offline notification sent to client successfully');
        } catch (error) {
          console.error('❌ Failed to send to client:', error);
        }
      }
      
      if (syncSuccess) {
        // Remove from cache after successful sync
        await cache.delete(key);
        console.log('✅ Offline notification synced and removed from cache');
      } else {
        // Increment retry count for failed syncs
        const updatedData = {
          ...notificationData,
          retryCount: (notificationData.retryCount || 0) + 1,
          lastRetry: Date.now()
        };
        await cache.put(key, new Response(JSON.stringify(updatedData)));
        console.log(`⚠️ Notification sync failed, retry count: ${updatedData.retryCount}`);
      }
    }
    
    console.log('✅ Offline notifications sync completed');
  } catch (error) {
    console.error('❌ Failed to sync offline notifications:', error);
  }
}

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
      
      // CRITICAL FIX: Enhanced mobile notification options
      const options = {
        body: notificationData.body || notificationData.message || 'New notification',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: notificationData.tag || 'celefy-notification',
        data: {
          ...notificationData,
          timestamp: Date.now(),
          source: 'service-worker',
          mobileOptimized: true
        },
        requireInteraction: false,
        silent: false,
        vibrate: [200, 100, 200], // Mobile vibration
        actions: [
          {
            action: 'view',
            title: 'View',
            icon: '/icons/icon-192.png'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ]
      };
      
      // CRITICAL FIX: Show notification with mobile optimization
      event.waitUntil(
        self.registration.showNotification(
          notificationData.title || 'Celefy',
          options
        ).then(() => {
          console.log('✅ Mobile notification displayed successfully');
        }).catch(error => {
          console.error('❌ Failed to display mobile notification:', error);
          // Fallback notification
          return self.registration.showNotification('Celefy', {
            body: 'New notification',
            icon: '/icons/icon-192.png'
          });
        })
      );
      
      // CRITICAL FIX: Send message to main app to save notification
      event.waitUntil(
        clients.matchAll().then(function(clientList) {
          if (clientList.length > 0) {
            clientList.forEach(function(client) {
              client.postMessage({
                type: 'PUSH_NOTIFICATION_RECEIVED',
                notification: notificationData
              });
            });
            console.log('✅ Notification sent to main app');
          } else {
            console.log('📱 No clients available, storing for later sync');
          }
        })
      );
      
      // CRITICAL FIX: Enhanced mobile notification caching
      event.waitUntil(
        caches.open('celefy-notifications').then(function(cache) {
          const notificationKey = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const enhancedData = {
            ...notificationData,
            cachedAt: Date.now(),
            mobileDevice: true,
            retryCount: 0
          };
          return cache.put(notificationKey, new Response(JSON.stringify(enhancedData)));
        }).then(() => {
          console.log('✅ Mobile notification cached successfully');
        }).catch(error => {
          console.error('❌ Failed to cache mobile notification:', error);
        })
      );
      
    } catch (error) {
      console.error('❌ Failed to process push notification:', error);
      
      // Enhanced fallback for mobile
      event.waitUntil(
        self.registration.showNotification('Celefy', {
          body: 'You have a new notification',
          icon: '/icons/icon-192.png',
          tag: 'fallback-notification',
          data: { error: true, timestamp: Date.now() }
        })
      );
    }
  }
});