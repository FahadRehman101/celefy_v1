import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Enhanced service worker registration with OneSignal priority
const registerServiceWorkers = async () => {
  if ('serviceWorker' in navigator) {
    try {
      console.log('🔧 Enhanced service worker registration starting...');
      
      // CRITICAL: OneSignal service worker MUST be registered first
      console.log('📡 Registering OneSignal service worker first...');
      const oneSignalWorker = await navigator.serviceWorker.register('/OneSignalSDKWorker.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      console.log('✅ OneSignal service worker registered:', oneSignalWorker.scope);
      
      // Wait a bit to ensure OneSignal worker is fully active
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Then register PWA service worker with different scope
      console.log('💾 Registering PWA service worker...');
      const pwaWorker = await navigator.serviceWorker.register('/sw.js', {
        scope: '/app/',
        updateViaCache: 'none'
      });
      console.log('✅ PWA service worker registered:', pwaWorker.scope);
      
      // Enhanced update handling
      oneSignalWorker.addEventListener('updatefound', () => {
        console.log('🔄 OneSignal service worker update found');
      });
      
      pwaWorker.addEventListener('updatefound', () => {
        console.log('🔄 PWA service worker update found');
      });
      
      console.log('🎊 All service workers registered successfully');
      
    } catch (error) {
      console.error('❌ Enhanced service worker registration failed:', error);
    }
  } else {
    console.warn('⚠️ Service workers not supported in this browser');
  }
};

// Enhanced app initialization
const initializeApp = async () => {
  console.log('🚀 Enhanced Celefy app initialization starting...');
  
  // Register service workers first
  await registerServiceWorkers();
  
  // CRITICAL FIX: Safe OneSignal initialization with error handling
  try {
    // Wait for OneSignal to be available
    let oneSignalCheckCount = 0;
    const waitForOneSignal = () => {
      return new Promise((resolve) => {
        const checkOneSignal = () => {
          oneSignalCheckCount++;
          try {
            if (window.OneSignal && window.OneSignal.User) {
              console.log('✅ OneSignal SDK is ready');
              resolve();
            } else if (oneSignalCheckCount < 50) { // 5 second timeout
              setTimeout(checkOneSignal, 100);
            } else {
              console.warn('⚠️ OneSignal SDK timeout - continuing without it');
              resolve();
            }
          } catch (error) {
            console.warn('⚠️ OneSignal check error - continuing without it:', error.message);
            resolve();
          }
        };
        checkOneSignal();
      });
    };
    
    await waitForOneSignal();
  } catch (error) {
    console.warn('⚠️ OneSignal initialization failed - continuing without it:', error.message);
    // Don't fail the entire app initialization for OneSignal issues
  }
  
  console.log('🎉 Enhanced Celefy app ready to render');
};

// Enhanced React app rendering
const renderApp = () => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
};

// Start enhanced initialization
initializeApp().then(() => {
  renderApp();
}).catch((error) => {
  console.error('❌ Enhanced app initialization failed:', error);
  // Render app anyway, but without enhanced features
  renderApp();
});