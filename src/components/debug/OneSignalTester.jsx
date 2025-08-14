// 🔧 FIXED OneSignal Tester for v16 API
import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

const OneSignalTester = () => {
  const [status, setStatus] = useState({
    sdkLoaded: false,
    userSubscribed: false,
    userId: null,
    permission: 'default',
    testResult: null
  });
  
  const [testing, setTesting] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  // Check OneSignal status using v16 API
  useEffect(() => {
    const checkStatus = async () => {
        console.log('🔍 Checking OneSignal status...');
        
        const newStatus = {
          sdkLoaded: typeof window.OneSignal !== 'undefined',
          userSubscribed: false,
          userId: null,
          permission: Notification.permission,
          testResult: null
        };
      
        if (window.OneSignal) {
          try {
            // 🔧 IMPROVED: Multiple methods to detect subscription status
            window.OneSignal.push(async function() {
              try {
                console.log('🔍 Checking subscription with v16 API...');
                
                // Method 1: Try v16 API
                const subscriptionOptedIn = await window.OneSignal.User?.PushSubscription?.optedIn;
                const subscriptionId = await window.OneSignal.User?.PushSubscription?.id;
                
                console.log('v16 API Results:', { 
                  optedIn: subscriptionOptedIn, 
                  id: subscriptionId 
                });
                
                if (subscriptionOptedIn !== undefined) {
                  newStatus.userSubscribed = subscriptionOptedIn;
                  newStatus.userId = subscriptionId;
                } else {
                  // Method 2: Try legacy API
                  console.log('🔍 Trying legacy API...');
                  const legacyEnabled = await window.OneSignal.isPushNotificationsEnabled?.();
                  const legacyUserId = await window.OneSignal.getUserId?.();
                  
                  console.log('Legacy API Results:', { 
                    enabled: legacyEnabled, 
                    userId: legacyUserId 
                  });
                  
                  newStatus.userSubscribed = legacyEnabled || false;
                  newStatus.userId = legacyUserId;
                }
                
                // Method 3: Fallback - check browser permission
                if (!newStatus.userSubscribed && Notification.permission === 'granted') {
                  console.log('🔍 Using browser permission as fallback...');
                  newStatus.userSubscribed = true;
                  // Try to get userId from different methods
                  try {
                    const userId = await window.OneSignal.getUserId?.() || 
                                 await window.OneSignal.User?.PushSubscription?.id;
                    newStatus.userId = userId;
                  } catch (e) {
                    console.log('Could not get user ID:', e);
                  }
                }
                
                console.log('Final OneSignal Status:', newStatus);
              } catch (apiError) {
                console.error('OneSignal API error:', apiError);
                
                // Last resort: just check browser permission
                if (Notification.permission === 'granted') {
                  newStatus.userSubscribed = true;
                  console.log('Using browser permission as final fallback');
                }
              }
            });
          } catch (error) {
            console.error('Error in OneSignal.push:', error);
          }
        }
        
        setStatus(newStatus);
      };

      checkStatus();
  }, []);

  // Subscribe to notifications using v16 API
  const handleSubscribe = async () => {
    if (!window.OneSignal) {
      alert('OneSignal not loaded!');
      return;
    }

    try {
      setSubscribing(true);
      console.log('🔔 Requesting notification permission using v16 API...');
      
      window.OneSignal.push(async function() {
        try {
          // 🔧 FIXED: Use v16 API for permission request
          await window.OneSignal.Slidedown.promptPush();
          
          // Wait a moment for permission to be processed
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check status using v16 API
          const isSubscribed = await window.OneSignal.User.PushSubscription.optedIn;
          const userId = await window.OneSignal.User.PushSubscription.id;
          
          setStatus(prev => ({
            ...prev,
            userSubscribed: isSubscribed,
            userId: userId,
            permission: Notification.permission
          }));
          
          if (isSubscribed) {
            console.log('✅ Successfully subscribed to notifications!');
            console.log('OneSignal Player ID:', userId);
            alert('✅ Successfully subscribed to notifications!');
          } else {
            console.log('❌ Subscription failed or was denied');
            alert('❌ Subscription failed or was denied');
          }
        } catch (v16Error) {
          console.error('v16 API error, trying fallback:', v16Error);
          
          // Fallback to older API
          try {
            await window.OneSignal.showSlidedownPrompt?.();
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const isSubscribed = await window.OneSignal.isPushNotificationsEnabled?.();
            const userId = await window.OneSignal.getUserId?.();
            
            setStatus(prev => ({
              ...prev,
              userSubscribed: isSubscribed || false,
              userId: userId,
              permission: Notification.permission
            }));
            
            if (isSubscribed) {
              console.log('✅ Successfully subscribed (fallback)!');
              alert('✅ Successfully subscribed to notifications!');
            } else {
              alert('❌ Subscription failed or was denied');
            }
          } catch (fallbackError) {
            console.error('Fallback subscription error:', fallbackError);
            alert(`❌ Subscription error: ${fallbackError.message}`);
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Subscription error:', error);
      alert(`❌ Subscription error: ${error.message}`);
    } finally {
      setSubscribing(false);
    }
  };

  // Test notification scheduling
  const testNotificationScheduling = async () => {
    if (!status.userSubscribed) {
      alert('Please subscribe to notifications first!');
      return;
    }

    if (!status.userId) {
      alert('No OneSignal User ID available. Please try subscribing again.');
      return;
    }

    setTesting(true);
    
    try {
      console.log('🧪 Testing notification scheduling...');
      console.log('Using OneSignal User ID:', status.userId);
      
      // Import your scheduler function
      const { scheduleBirthdayReminders } = await import('@/services/notificationScheduler');
      
      // Create a test birthday (tomorrow for quick testing)
      const testDate = new Date();
      testDate.setDate(testDate.getDate() + 1);
      
      const testBirthday = {
        id: 'test-' + Date.now(),
        name: 'Test Person',
        date: testDate.toISOString().split('T')[0] // Format: YYYY-MM-DD
      };
      
      console.log('Test birthday:', testBirthday);
      
      // Get current user ID from Firebase
      const { auth } = await import('@/config/firebase');
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      console.log('Firebase User ID:', currentUser.uid);
      console.log('OneSignal Player ID:', status.userId);
      
      const result = await scheduleBirthdayReminders(testBirthday, currentUser.uid);
      
      console.log('Scheduling result:', result);
      
      setStatus(prev => ({
        ...prev,
        testResult: result
      }));
      
      if (result.success) {
        alert(`✅ Test successful! Scheduled ${result.scheduledCount || 0} notifications. Check console for notification IDs.`);
      } else {
        alert(`❌ Test failed: ${result.error}`);
      }
      
    } catch (error) {
      console.error('❌ Test error:', error);
      alert(`❌ Test error: ${error.message}`);
      setStatus(prev => ({
        ...prev,
        testResult: { success: false, error: error.message }
      }));
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Bell className="w-5 h-5 text-blue-600" />
        <h4 className="text-lg font-semibold text-gray-900">
          OneSignal Status
        </h4>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          SDK v16
        </span>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            {status.sdkLoaded ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600" />
            )}
            <span className="text-sm font-medium">SDK Loaded</span>
          </div>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            {status.userSubscribed ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600" />
            )}
            <span className="text-sm font-medium">Subscribed</span>
          </div>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg col-span-2">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">Permission: {status.permission}</span>
          </div>
        </div>

        {status.userId && (
          <div className="p-3 bg-gray-50 rounded-lg col-span-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs font-mono text-gray-600 break-all">
                Player ID: {status.userId}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {!status.userSubscribed && (
          <button
            onClick={handleSubscribe}
            disabled={subscribing || !status.sdkLoaded}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {subscribing ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Subscribing...</span>
              </div>
            ) : (
              'Subscribe to Notifications'
            )}
          </button>
        )}

        {status.userSubscribed && status.userId && (
          <button
            onClick={testNotificationScheduling}
            disabled={testing}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {testing ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Testing...</span>
              </div>
            ) : (
              'Test Notification Scheduling'
            )}
          </button>
        )}
      </div>

      {/* Test Results */}
      {status.testResult && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h5 className="text-sm font-medium mb-2">Last Test Result:</h5>
          <div className="text-xs space-y-1">
            <div>
              <strong>Success:</strong> {status.testResult.success ? '✅' : '❌'}
            </div>
            {status.testResult.scheduledCount && (
              <div>
                <strong>Scheduled:</strong> {status.testResult.scheduledCount} notifications
              </div>
            )}
            {status.testResult.notificationIds && status.testResult.notificationIds.length > 0 && (
              <div>
                <strong>IDs:</strong> {status.testResult.notificationIds.join(', ')}
              </div>
            )}
            {status.testResult.error && (
              <div className="text-red-600">
                <strong>Error:</strong> {status.testResult.error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h5 className="text-sm font-medium text-blue-800 mb-1">
          Quick Test Steps:
        </h5>
        <ol className="text-xs text-blue-700 list-decimal list-inside space-y-1">
          <li>Check that SDK is loaded ✓</li>
          <li>Click "Subscribe to Notifications"</li>
          <li>Allow permission when browser prompts</li>
          <li>Verify you see a Player ID</li>
          <li>Click "Test Notification Scheduling"</li>
          <li>Check console for notification IDs</li>
        </ol>
      </div>
    </div>
  );
};

export default OneSignalTester;