importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Add custom notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.message || 'You have a new notification!',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: 1
        },
        actions: [
          {
            action: 'explore',
            title: 'View',
            icon: '/icons/icon-192.png'
          },
          {
            action: 'close',
            title: 'Close',
            icon: '/icons/icon-192.png'
          }
        ]
      };

      event.waitUntil(
        self.registration.showNotification(data.title || 'Celefy Notification', options)
      );
    } catch (error) {
      console.error('Error handling push notification:', error);
    }
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});