import React, { useEffect, useState } from 'react';
import { 
  initializeOneSignal, 
  isSubscribed, 
  requestPermission, 
  unsubscribe,
  sendTestNotification,
  getUserId 
} from '@/utils/onesignal';

export default function OneSignalTester() {
  const [isReady, setIsReady] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [initProgress, setInitProgress] = useState('Starting...');

  useEffect(() => {
    const initOneSignal = async () => {
      try {
        setLoading(true);
        setInitProgress('Starting OneSignal initialization...');
        console.log('Starting OneSignal initialization...');
        
        // Show progress updates
        const progressInterval = setInterval(() => {
          setInitProgress(prev => {
            if (prev.includes('Starting')) return 'Loading OneSignal SDK...';
            if (prev.includes('Loading SDK')) return 'Initializing OneSignal...';
            if (prev.includes('Initializing')) return 'Finalizing setup...';
            return 'OneSignal ready!';
          });
        }, 1500); // Update every 1.5 seconds
        
        await initializeOneSignal();
        clearInterval(progressInterval);
        setInitProgress('OneSignal ready!');
        
        // Get basic info without complex OneSignal calls
        const subscribed = await isSubscribed();
        const userId = await getUserId();
        
        setIsSubscribed(subscribed);
        setIsReady(true);
        setError(null);
        
        // Collect debug info safely
        setDebugInfo({
          oneSignalAvailable: !!window.OneSignal,
          oneSignalVersion: window.OneSignal?.VERSION || 'Unknown',
          userId: userId,
          serviceWorkerSupported: 'serviceWorker' in navigator,
          notificationSupported: 'Notification' in window,
          permission: Notification.permission,
          oneSignalFunctions: {
            init: typeof window.OneSignal?.init === 'function',
            initialized: !!window.OneSignal?.initialized,
            browserNotifications: 'Notification' in window
          }
        });
        
        console.log('OneSignal initialization completed successfully');
      } catch (err) {
        console.error('OneSignal initialization error:', err);
        setError(err.message);
        setDebugInfo({
          oneSignalAvailable: !!window.OneSignal,
          error: err.message,
          oneSignalFunctions: {
            init: typeof window.OneSignal?.init === 'function',
            initialized: !!window.OneSignal?.initialized,
            browserNotifications: 'Notification' in window
          }
        });
      } finally {
        setLoading(false);
      }
    };

    initOneSignal();
  }, []);

  const askPermission = async () => {
    try {
      if (!isReady) {
        setError('OneSignal is not ready yet');
        return;
      }

      console.log('Requesting notification permission...');
      
      const newStatus = await requestPermission();
      setIsSubscribed(newStatus);
      
      if (newStatus) {
        console.log('Successfully subscribed to notifications!');
        // Refresh debug info
        const userId = await getUserId();
        setDebugInfo(prev => ({ ...prev, userId, permission: Notification.permission }));
      }
      
    } catch (err) {
      console.error('Permission request error:', err);
      setError('Failed to request permission: ' + err.message);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      await unsubscribe();
      setIsSubscribed(false);
      setDebugInfo(prev => ({ ...prev, permission: Notification.permission }));
    } catch (err) {
      console.error('Unsubscribe error:', err);
      setError('Failed to unsubscribe: ' + err.message);
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification('Test from Celefy! 🎉', 'This is a test notification to verify OneSignal is working!');
      console.log('Test notification sent successfully!');
    } catch (err) {
      setError('Failed to send test notification: ' + err.message);
    }
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setInitProgress('Starting...');
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 m-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-600 text-sm">Initializing OneSignal...</span>
          </div>
          <div className="text-blue-600 text-xs">
            <div>Progress: {initProgress}</div>
            <div className="text-blue-500">This should take about 3-5 seconds</div>
            <div className="text-blue-400 text-xs mt-1">OneSignal needs time to load and initialize properly</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <h3 className="text-red-800 font-medium">OneSignal Error</h3>
        <p className="text-red-600 text-sm">{error}</p>
        <div className="mt-3 p-2 bg-gray-100 rounded text-xs">
          <strong>Debug Info:</strong>
          <div>OneSignal Available: {debugInfo.oneSignalAvailable ? '✅' : '❌'}</div>
          <div>Error: {debugInfo.error}</div>
        </div>
        <button 
          onClick={handleRetry} 
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 m-4">
      <h3 className="text-blue-800 font-medium mb-2">Push Notifications</h3>
      <div className="space-y-2">
        <p className="text-blue-600 text-sm">
          Status: {isReady ? (isSubscribed ? 'Subscribed' : 'Not Subscribed') : 'Loading...'}
        </p>
        
        {/* Debug Information */}
        <div className="bg-white p-3 rounded border text-xs">
          <h4 className="font-medium mb-2">Debug Info:</h4>
          <div className="space-y-1">
            <div>OneSignal Available: {debugInfo.oneSignalAvailable ? '✅' : '❌'}</div>
            <div>OneSignal Version: {debugInfo.oneSignalVersion}</div>
            <div>User ID: {debugInfo.userId || 'Not set'}</div>
            <div>Service Worker: {debugInfo.serviceWorkerSupported ? '✅' : '❌'}</div>
            <div>Notifications: {debugInfo.notificationSupported ? '✅' : '❌'}</div>
            <div>Permission: {debugInfo.permission}</div>
            {debugInfo.oneSignalFunctions && (
              <div className="mt-2 pt-2 border-t">
                <strong>OneSignal Functions:</strong>
                <div>init: {debugInfo.oneSignalFunctions.init ? '✅' : '❌'}</div>
                <div>initialized: {debugInfo.oneSignalFunctions.initialized ? '✅' : '❌'}</div>
                <div>Browser Notifications: {debugInfo.oneSignalFunctions.browserNotifications ? '✅' : '❌'}</div>
              </div>
            )}
          </div>
        </div>
        
        {isReady && (
          <div className="space-x-2">
            {!isSubscribed ? (
              <button
                onClick={askPermission}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isReady}
              >
                Subscribe to Notifications
              </button>
            ) : (
              <>
                <button
                  onClick={handleUnsubscribe}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Unsubscribe
                </button>
                <button
                  onClick={handleTestNotification}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Test Notification
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
