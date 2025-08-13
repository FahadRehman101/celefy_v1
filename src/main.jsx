import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// OneSignal v16 Compatible Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      console.log('🔧 Starting OneSignal v16 service worker registration...');
      
      // Register OneSignal service worker ONLY (avoid conflicts)
      const registration = await navigator.serviceWorker.register('/OneSignalSDKWorker.js', {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      });
      
      console.log('✅ OneSignal v16 service worker registered successfully:', registration);
      
      // Wait for the service worker to be ready
      const swRegistration = await navigator.serviceWorker.ready;
      console.log('✅ OneSignal v16 service worker is ready:', swRegistration);
      
      // Check service worker state
      if (registration.installing) {
        console.log('🔧 OneSignal service worker installing...');
      } else if (registration.waiting) {
        console.log('⏳ OneSignal service worker waiting...');
      } else if (registration.active) {
        console.log('🟢 OneSignal service worker active and running');
      }
      
      // Listen for service worker updates
      registration.addEventListener('updatefound', () => {
        console.log('🔄 OneSignal service worker update found');
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          console.log('🔄 OneSignal service worker state changed:', newWorker.state);
          
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            console.log('✨ New OneSignal service worker available');
          }
        });
      });
      
    } catch (error) {
      console.error('❌ OneSignal v16 service worker registration failed:', error);
      
      // Provide helpful error information
      if (error.name === 'SecurityError') {
        console.error('🚨 Security Error: Make sure you are on HTTPS or localhost');
      } else if (error.message.includes('not found')) {
        console.error('🚨 File Not Found: Make sure OneSignalSDKWorker.js exists in your public folder');
      } else {
        console.error('🚨 Unknown Error:', error.message);
      }
    }
  });
  
  // Listen for service worker messages
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('💬 Message from OneSignal service worker:', event.data);
  });
  
  // Handle service worker controller changes
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('🔄 OneSignal service worker controller changed - reloading page');
    window.location.reload();
  });
} else {
  console.warn('⚠️ Service Workers not supported in this browser');
}