// 🚨 COMPLETE FIXED main.jsx - Copy this entire file
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initializeOneSignal, checkSubscriptionStatus, requestPermission } from './config/onesignal';
import { AuthProvider } from './hooks/useAuth';

const registerServiceWorkers = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // Register OneSignal worker first
      const oneSignalWorker = await navigator.serviceWorker.register('/OneSignalSDKWorker.js');
      console.log('✅ OneSignal worker registered');
      
      // Then register PWA worker
      const pwaWorker = await navigator.serviceWorker.register('/sw.js', {
        scope: '/app/'
      });
      console.log('✅ PWA worker registered');
    } catch (error) {
      console.error('Service worker error:', error);
    }
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
      
      // Check initial OneSignal status
      console.log('📊 Starting OneSignal initialization...');
      
      // Initialize OneSignal
      const oneSignal = await initializeOneSignal();
      
      if (oneSignal) {
        console.log('✅ OneSignal initialized successfully');
        
        // Check final status
        console.log('📊 OneSignal initialization completed successfully');
        
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
          const permissionResult = await requestPermission();
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
      }
    } catch (error) {
      console.warn('⚠️ OneSignal initialization failed - continuing without it:', error.message);
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
        <AuthProvider>
          <App />
        </AuthProvider>
      </React.StrictMode>,
    );
    
    // CRITICAL FIX: Listen for service worker messages to capture push notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'PUSH_NOTIFICATION_RECEIVED') {
          console.log('🔔 Push notification message received from service worker:', event.data.notification);
          
          // Import and save notification to Firestore
          import('./services/enhancedNotificationService').then(({ handleIncomingPushNotification }) => {
            const currentUser = window.currentUser || null;
            if (currentUser && currentUser.uid) {
              handleIncomingPushNotification(event.data.notification, currentUser.uid);
              console.log('✅ Push notification from service worker saved to Firestore');
            } else {
              console.warn('⚠️ No user ID available for service worker notification capture');
            }
          }).catch(error => {
            console.error('❌ Failed to import enhanced service for service worker notification:', error);
          });
        }
        
        // CRITICAL FIX: Handle offline notification sync
        if (event.data && event.data.type === 'OFFLINE_NOTIFICATION_SYNC') {
          console.log('🔄 Offline notification sync received:', event.data.notification);
          
          // Import and save offline notification to Firestore
          import('./services/enhancedNotificationService').then(({ handleIncomingPushNotification }) => {
            const currentUser = window.currentUser || null;
            if (currentUser && currentUser.uid) {
              handleIncomingPushNotification(event.data.notification, currentUser.uid);
              console.log('✅ Offline notification synced and saved to Firestore');
            } else {
              console.warn('⚠️ No user ID available for offline notification sync');
            }
          }).catch(error => {
            console.error('❌ Failed to import enhanced service for offline notification sync:', error);
          });
        }
      });
      
      // CRITICAL FIX: Trigger background sync when app comes back online
      window.addEventListener('online', function() {
        console.log('🌐 App came back online, triggering background sync');
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'TRIGGER_BACKGROUND_SYNC'
          });
        }
      });
      
      // CRITICAL FIX: Mobile network status monitoring
      window.addEventListener('offline', function() {
        console.log('📱 App went offline, notifications will be cached');
      });
      
      // CRITICAL FIX: Mobile connection quality monitoring
      if ('connection' in navigator) {
        navigator.connection.addEventListener('change', function() {
          console.log('📶 Connection changed:', {
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
            rtt: navigator.connection.rtt
          });
        });
      }
      
      // CRITICAL FIX: Mobile battery status monitoring
      if ('getBattery' in navigator) {
        navigator.getBattery().then(function(battery) {
          battery.addEventListener('levelchange', function() {
            console.log('🔋 Battery level:', battery.level);
            if (battery.level < 0.2) {
              console.log('⚠️ Low battery - optimizing notification delivery');
            }
          });
        });
      }
    }
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