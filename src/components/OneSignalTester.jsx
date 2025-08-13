import React, { useEffect, useState, useRef } from 'react';
import { 
  initializeOneSignal, 
  isSubscribed, 
  requestPermission, 
  unsubscribe,
  sendTestNotification,
  getUserId,
  isOneSignalReady,
  getDebugInfo,
  detectOneSignalAPI,
  checkLocalNotificationState
} from '@/utils/onesignal';

export default function OneSignalTester() {
  const [isReady, setIsReady] = useState(false);
  const [isSubscribedState, setIsSubscribedState] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [initProgress, setInitProgress] = useState('Starting...');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  
  // Critical: Prevent useEffect from re-running after successful operations
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized.current) {
      console.log('🚀 OneSignalTester: Already initialized, skipping...');
      return;
    }
    
    hasInitialized.current = true;
    
    const initOneSignal = async () => {
      try {
        setLoading(true);
        setError(null);
        setInitProgress('Starting OneSignal v16 initialization...');
        
        console.log('🚀 OneSignalTester: Starting initialization...');
        
        // Show progress updates
        const progressInterval = setInterval(() => {
          setInitProgress(prev => {
            if (prev.includes('Starting')) return 'Loading OneSignal v16 SDK...';
            if (prev.includes('Loading')) return 'Configuring OneSignal...';
            if (prev.includes('Configuring')) return 'Finalizing setup...';
            return 'OneSignal v16 ready!';
          });
        }, 1500);
        
        // Initialize OneSignal
        await initializeOneSignal();
        clearInterval(progressInterval);
        setInitProgress('OneSignal v16 ready!');
        
        // Wait a moment for everything to settle
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get subscription status
        const subscribed = await isSubscribed();
        const userId = await getUserId();
        const ready = isOneSignalReady();
        const debug = await getDebugInfo();
        
        // Detect actual OneSignal v16 API structure
        const apiStructure = detectOneSignalAPI();
        
        setIsSubscribedState(subscribed);
        setIsReady(ready);
        setDebugInfo({
          ...debug,
          userId: userId,
          subscriptionStatus: subscribed,
          apiStructure: apiStructure
        });
        
        console.log('✅ OneSignalTester: Initialization completed successfully');
        console.log('📊 Debug info:', debug);
        console.log('🔍 API Structure:', apiStructure);
        
      } catch (err) {
        console.error('❌ OneSignalTester: Initialization error:', err);
        setError(err.message);
        
        // Get debug info even on error
        try {
          const debug = await getDebugInfo();
          setDebugInfo({
            ...debug,
            error: err.message,
            errorStack: err.stack
          });
        } catch (debugErr) {
          console.error('Failed to get debug info:', debugErr);
        }
      } finally {
        setLoading(false);
      }
    };

    initOneSignal();
  }, []);

  const handleRequestPermission = async () => {
    try {
      // Prevent multiple simultaneous requests
      if (isRequestingPermission) {
        console.log('🔔 OneSignalTester: Permission request already in progress');
        return;
      }
      
      setIsRequestingPermission(true);
      setError(null);
      
      if (!isReady) {
        setError('OneSignal is not ready yet. Please wait or refresh the page.');
        setIsRequestingPermission(false);
        return;
      }

      console.log('🔔 OneSignalTester: Requesting permission...');
      
      const granted = await requestPermission();
      setIsSubscribedState(granted);
      
      if (granted) {
        console.log('✅ OneSignalTester: Permission granted successfully!');
        
        // Update debug info WITHOUT calling OneSignal APIs to prevent loops
        setDebugInfo(prev => ({
          ...prev,
          subscriptionStatus: granted,
          permission: 'granted'
        }));
        
        // Get user ID safely without triggering OneSignal loops
        try {
          const userId = await getUserId();
          setDebugInfo(prev => ({
            ...prev,
            userId: userId
          }));
        } catch (userIdError) {
          console.warn('Could not get user ID:', userIdError);
          // Don't fail the whole operation for this
        }
        
      } else {
        console.log('❌ OneSignalTester: Permission denied by user');
        
        // Update debug info safely
        setDebugInfo(prev => ({
          ...prev,
          subscriptionStatus: false,
          permission: 'denied'
        }));
      }
      
    } catch (err) {
      console.error('❌ OneSignalTester: Permission request error:', err);
      setError('Failed to request permission: ' + err.message);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      setError(null);
      const result = await unsubscribe();
      
      if (result.success) {
        setIsSubscribedState(false);
        
        // Update debug info safely WITHOUT calling OneSignal APIs
        setDebugInfo(prev => ({
          ...prev,
          subscriptionStatus: false,
          locallyDisabled: true,
          permission: 'denied'
        }));
        
        console.log('✅ OneSignalTester: Unsubscribed successfully');
        
        // Show informative message
        if (result.requiresBrowserAction) {
          setError(`✅ ${result.message} 📱 To completely disable, go to browser settings and block notifications for this site.`);
        } else {
          setError(`✅ ${result.message}`);
        }
      } else {
        setError('Failed to unsubscribe: ' + (result.message || 'Unknown error'));
      }
      
    } catch (err) {
      console.error('❌ OneSignalTester: Unsubscribe error:', err);
      setError('Failed to unsubscribe: ' + err.message);
    }
  };

  const handleTestNotification = async () => {
    try {
      setError(null);
      
      // Prevent test notification if OneSignal is not stable
      if (!isReady || isRequestingPermission) {
        setError('OneSignal is not ready or busy. Please wait.');
        return;
      }
      
      console.log('🧪 OneSignalTester: Sending test notification...');
      
      // Check and potentially reset local notification state
      const stateCheck = checkLocalNotificationState();
      if (stateCheck.isNowEnabled) {
        console.log('🔄 Notifications re-enabled:', stateCheck.message);
        // Update the UI to reflect the change
        setIsSubscribedState(true);
      }
      
      const success = await sendTestNotification(
        'Test from Celefy! 🎉', 
        'This is a test notification to verify OneSignal v16 is working correctly!'
      );
      
      if (success) {
        console.log('✅ OneSignalTester: Test notification sent successfully!');
        
        // Update debug info safely without API calls
        setDebugInfo(prev => ({
          ...prev,
          lastTestNotification: new Date().toISOString(),
          notificationState: 'enabled'
        }));
        
        // Show success message
        setError(null);
      } else {
        console.log('⚠️ OneSignalTester: Test notification skipped (notifications disabled)');
        setError('Test notification skipped. Notifications are currently disabled. Please enable notifications first.');
      }
      
    } catch (err) {
      console.error('❌ OneSignalTester: Test notification error:', err);
      setError('Failed to send test notification: ' + err.message);
    }
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setInitProgress('Retrying...');
    window.location.reload();
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 m-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-600 text-sm font-medium">Initializing OneSignal v16...</span>
          </div>
          <div className="text-blue-600 text-xs space-y-1">
            <div className="font-medium">Progress: {initProgress}</div>
            <div className="text-blue-500">This should take about 3-5 seconds</div>
            <div className="text-blue-400">Setting up push notification system...</div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <h3 className="text-red-800 font-medium mb-2">OneSignal v16 Error</h3>
        <p className="text-red-600 text-sm mb-3">{error}</p>
        
        {/* Debug Information */}
        <div className="bg-gray-100 p-3 rounded text-xs space-y-1">
          <div className="font-medium text-gray-700">Debug Information:</div>
          <div>OneSignal Available: {debugInfo.oneSignalExists ? '✅' : '❌'}</div>
          <div>Initialized: {debugInfo.isInitialized ? '✅' : '❌'}</div>
          <div>Browser Support: {debugInfo.browserNotificationSupport ? '✅' : '❌'}</div>
          <div>HTTPS: {debugInfo.isHttps ? '✅' : '❌'}</div>
          <div>Domain: {debugInfo.domain}</div>
          {debugInfo.oneSignalVersion && (
            <div>OneSignal Version: {debugInfo.oneSignalVersion}</div>
          )}
          {debugInfo.errorStack && (
            <div className="mt-2 p-2 bg-red-100 rounded">
              <div className="font-medium text-red-700">Error Details:</div>
              <div className="text-red-600 text-xs font-mono">{debugInfo.errorStack}</div>
            </div>
          )}
        </div>
        
        <button 
          onClick={handleRetry} 
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
        >
          Retry Initialization
        </button>
      </div>
    );
  }

  // Success state
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 m-4">
      <h3 className="text-green-800 font-medium mb-3 flex items-center">
        <span className="mr-2">🔔</span>
        Push Notifications (OneSignal v16)
      </h3>
      
      <div className="space-y-3">
        {/* Status */}
        <div className="text-green-700 text-sm">
          <div className="font-medium">
            Status: {isReady ? (isSubscribedState ? '✅ Subscribed' : '⭕ Not Subscribed') : '⏳ Loading...'}
          </div>
          <div className="text-green-600 text-xs">
            OneSignal v16 is ready and functioning properly
          </div>
        </div>
        
        {/* Action Buttons */}
        {isReady && (
          <div className="space-y-2">
            {!isSubscribedState ? (
              <button
                onClick={handleRequestPermission}
                disabled={isRequestingPermission}
                className={`w-full px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium ${
                  isRequestingPermission 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isRequestingPermission ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Requesting Permission...
                  </span>
                ) : (
                  '🔔 Subscribe to Notifications'
                )}
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleTestNotification}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  🧪 Test Notification
                </button>
                <button
                  onClick={handleUnsubscribe}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  🔕 Disable Notifications
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Debug Information */}
        <details className="bg-white p-3 rounded border text-xs">
          <summary className="cursor-pointer font-medium text-gray-700 mb-2">
            📊 Debug Information
          </summary>
          <div className="space-y-1 text-gray-600">
            <div>OneSignal Available: {debugInfo.oneSignalExists ? '✅' : '❌'}</div>
            <div>Initialized: {debugInfo.isInitialized ? '✅' : '❌'}</div>
            <div>OneSignal Version: {debugInfo.oneSignalVersion || 'Unknown'}</div>
            <div>User ID: {debugInfo.userId || 'Not set'}</div>
            <div>Browser Notifications: {debugInfo.browserNotificationSupport ? '✅' : '❌'}</div>
            <div>Service Worker: {debugInfo.serviceWorkerSupport ? '✅' : '❌'}</div>
            <div>Permission: {debugInfo.permission}</div>
            <div>HTTPS: {debugInfo.isHttps ? '✅' : '❌'}</div>
            <div>Domain: {debugInfo.domain}</div>
            <div>Subscription Status: {debugInfo.subscriptionStatus ? '✅ Active' : '❌ Inactive'}</div>
            {debugInfo.locallyDisabled && (
              <div className="text-orange-600">⚠️ Locally disabled by user</div>
            )}
            
            {/* OneSignal API Structure */}
            {debugInfo.apiStructure && !debugInfo.apiStructure.error && (
              <div className="mt-2 p-2 bg-blue-50 rounded">
                <div className="font-medium text-blue-700">🔍 OneSignal v16 API Structure:</div>
                <div className="text-blue-600 text-xs">
                  <div>Version: {debugInfo.apiStructure.version}</div>
                  <div>User Object: {debugInfo.apiStructure.hasUser ? '✅' : '❌'}</div>
                  <div>Notifications Object: {debugInfo.apiStructure.hasNotifications ? '✅' : '❌'}</div>
                  <div>Slidedown Object: {debugInfo.apiStructure.hasSlidedown ? '✅' : '❌'}</div>
                  {debugInfo.apiStructure.methods.User && (
                    <div>User Methods: {debugInfo.apiStructure.methods.User.join(', ')}</div>
                  )}
                  {debugInfo.apiStructure.methods.Notifications && (
                    <div>Notifications Methods: {debugInfo.apiStructure.methods.Notifications.join(', ')}</div>
                  )}
                  {debugInfo.apiStructure.methods.Slidedown && (
                    <div>Slidedown Methods: {debugInfo.apiStructure.methods.Slidedown.join(', ')}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </details>
      </div>
    </div>
  );
}