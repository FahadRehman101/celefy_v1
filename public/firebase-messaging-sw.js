/* firebase-messaging-sw.js */

// Import Firebase core and messaging libraries (compat versions for service workers)
importScripts('https://www.gstatic.com/firebasejs/10.5.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.5.2/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyA1crKWsxSQvXlHffDHmppxq1Y0pI9R_Zc",
  authDomain: "happieday-ca67f.firebaseapp.com",
  projectId: "happieday-ca67f",
  storageBucket: "happieday-ca67f.appspot.com",
  messagingSenderId: "65364282102",
  appId: "1:65364282102:web:f9a996467e9eb49dd83ad7",
  measurementId: "G-55Z4M7QXK9"
});

// Initialize messaging in the background
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192.png' // You can change this icon path if needed
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
