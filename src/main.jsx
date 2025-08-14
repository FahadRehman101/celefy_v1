// 🚨 COMPLETE FIXED main.jsx - Copy this entire file
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initializeOneSignal, getOneSignalStatus, debugOneSignalState, requestNotificationPermission } from './config/onesignal';

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

// CRITICAL FIX: Enhanced app initialization with proper error handling
const initializeApp = async () => {
  console.log('🚀 Enhanced Celefy app initialization starting...');
  
  try {
    // Register service workers first (non-blocking)
    await registerServiceWorkers();
    
    // CRITICAL FIX: Enhanced OneSignal initialization with timeout and error handling
    try {
      console.log('🔧 Starting OneSignal initialization...');
      
      // Debug OneSignal state before initialization
      debugOneSignalState();
      
      // Check initial OneSignal status
      const initialStatus = getOneSignalStatus();
      console.log('📊 Initial OneSignal status:', initialStatus);
      
      // Initialize OneSignal
      const oneSignal = await initializeOneSignal();
      
      if (oneSignal) {
        console.log('✅ OneSignal initialized successfully');
        
        // Debug OneSignal state after initialization
        debugOneSignalState();
        
        // Check final status
        const finalStatus = getOneSignalStatus();
        console.log('📊 Final OneSignal status:', finalStatus);
        
        // Set up OneSignal event listeners
        try {
          // CRITICAL FIX: Use v16 API event listeners with proper error handling
          if (typeof oneSignal.on === 'function') {
            oneSignal.on('initialized', () => {
              console.log('🎯 OneSignal initialization event fired');
            });
            
            oneSignal.on('subscriptionChange', (isSubscribed) => {
              console.log('🔔 OneSignal subscription changed:', isSubscribed);
            });
            
            oneSignal.on('notificationPermissionChange', (permission) => {
              console.log('🔐 OneSignal permission changed:', permission);
            });
            
            console.log('✅ OneSignal event listeners set up successfully');
          } else if (oneSignal.User && oneSignal.User.PushSubscription) {
            // Alternative: Set up event listeners using v16 User API
            console.log('✅ OneSignal v16 User API available - event listeners not needed');
          } else {
            console.log('⚠️ OneSignal event listeners not available in this version');
          }
        } catch (eventError) {
          console.warn('⚠️ Failed to set up OneSignal event listeners:', eventError);
          // Continue without event listeners - not critical for functionality
        }
        
        // CRITICAL FIX: Automatically request notification permission and trigger subscription
        console.log('🔔 Automatically requesting notification permission...');
        try {
          const permissionResult = await requestNotificationPermission();
          if (permissionResult) {
            console.log('✅ Notification permission and subscription setup completed');
          } else {
            console.warn('⚠️ Notification permission setup failed, but OneSignal is initialized');
          }
        } catch (permissionError) {
          console.warn('⚠️ Error during automatic permission request:', permissionError);
        }
        
      } else {
        console.warn('⚠️ OneSignal initialization failed - continuing without it');
        // Debug OneSignal state after failed initialization
        debugOneSignalState();
      }
    } catch (error) {
      console.warn('⚠️ OneSignal initialization failed - continuing without it:', error.message);
      // Debug OneSignal state after error
      debugOneSignalState();
      // Don't fail the entire app initialization for OneSignal issues
    }
    
    console.log('🎉 Enhanced Celefy app ready to render');
    return true;
    
  } catch (error) {
    console.error('❌ App initialization failed:', error);
    return false;
  }
};

// CRITICAL FIX: Enhanced React app rendering with error boundary
const renderApp = () => {
  try {
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  } catch (error) {
    console.error('❌ React app rendering failed:', error);
    
    // Fallback: render basic error page
    document.getElementById('root').innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #fee2e2; font-family: system-ui;">
        <div style="text-align: center; padding: 2rem; background: white; border-radius: 0.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
          <h1 style="color: #dc2626; margin-bottom: 1rem; font-size: 1.5rem;">App Failed to Load</h1>
          <p style="color: #7f1d1d; margin-bottom: 1rem;">There was a critical error loading Celefy.</p>
          <button onclick="window.location.reload()" style="background: #dc2626; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.25rem; cursor: pointer;">
            Reload Page
          </button>
        </div>
      </div>
    `;
  }
};

// CRITICAL FIX: Start enhanced initialization with proper error handling
initializeApp().then((success) => {
  if (success) {
    renderApp();
  } else {
    console.error('❌ Enhanced app initialization failed');
    // Render app anyway, but without enhanced features
    renderApp();
  }
}).catch((error) => {
  console.error('❌ Critical app startup failure:', error);
  // Emergency fallback rendering
  renderApp();
});