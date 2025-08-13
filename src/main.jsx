import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Register OneSignal service worker first
      const oneSignalRegistration = await navigator.serviceWorker.register('/OneSignalSDKWorker.js', {
        scope: '/'
      });
      console.log('OneSignal SW registered: ', oneSignalRegistration);

      // Wait a bit for OneSignal service worker to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Then register our custom service worker
      const customRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('Custom SW registered: ', customRegistration);
    } catch (error) {
      console.log('Service Worker registration failed:', error);
    }
  });
}
