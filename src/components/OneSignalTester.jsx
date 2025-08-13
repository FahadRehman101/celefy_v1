import React, { useState, useEffect } from 'react';
import { isSubscribed, requestPermission, sendTestNotification, unsubscribe, getDebugInfo } from '@/utils/onesignal';

const OneSignalTester = () => {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const status = await isSubscribed();
      setSubscribed(status);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setRequesting(true);
    try {
      const granted = await requestPermission();
      setSubscribed(granted);
      
      if (granted) {
        alert('🎉 Successfully subscribed to notifications!');
      } else {
        alert('❌ Permission denied. Please check your browser settings.');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('❌ Failed to subscribe. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      const success = await sendTestNotification();
      if (success) {
        alert('✅ Test notification sent!');
      } else {
        alert('❌ Failed to send test notification');
      }
    } catch (error) {
      console.error('Test notification error:', error);
      alert('❌ Failed to send test notification');
    }
  };

  const handleUnsubscribe = async () => {
    try {
      const success = await unsubscribe();
      if (success) {
        setSubscribed(false);
        alert('✅ Successfully unsubscribed');
      } else {
        alert('❌ Failed to unsubscribe');
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
      alert('❌ Failed to unsubscribe');
    }
  };

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 m-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-blue-700">Loading OneSignal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 m-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <span className="mr-2">🔔</span>
        Push Notifications
      </h3>
      
      <div className="space-y-3">
        <div className="text-sm">
          <span className="font-medium">Status: </span>
          <span className={subscribed ? 'text-green-600' : 'text-gray-600'}>
            {subscribed ? '✅ Subscribed' : '⭕ Not Subscribed'}
          </span>
        </div>

        <div className="flex gap-2">
          {!subscribed ? (
            <button
              onClick={handleSubscribe}
              disabled={requesting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {requesting ? 'Requesting...' : '🔔 Subscribe'}
            </button>
          ) : (
            <>
              <button
                onClick={handleTestNotification}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                🧪 Test Notification
              </button>
              <button
                onClick={handleUnsubscribe}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                🔕 Unsubscribe
              </button>
            </>
          )}
        </div>

        {/* Simple Debug Info */}
        <details className="text-xs text-gray-600">
          <summary className="cursor-pointer">Debug Info</summary>
          <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto">
            {JSON.stringify(getDebugInfo(), null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default OneSignalTester;
