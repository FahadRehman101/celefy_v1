// 🔧 FIXED OneSignal Tester for v16 API
import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle, RefreshCw, TestTube } from 'lucide-react';
import { getOneSignalStatus, requestNotificationPermission } from '@/config/onesignal';
import { testNotificationSystem, testOneSignalRestAPI } from '@/services/notificationScheduler';

const OneSignalTester = () => {
  const [status, setStatus] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [testing, setTesting] = useState(false);
  const [environment, setEnvironment] = useState('unknown');

  useEffect(() => {
    // Determine environment
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      setEnvironment('localhost');
    } else if (hostname.includes('netlify.app')) {
      setEnvironment('production');
    } else {
      setEnvironment('development');
    }
    
    updateStatus();
  }, []);

  const updateStatus = async () => {
    const currentStatus = await getOneSignalStatus();
    setStatus(currentStatus);
  };

  const handleSubscribe = async () => {
    try {
      await requestNotificationPermission();
      await updateStatus();
    } catch (error) {
      console.error('Subscription failed:', error);
    }
  };

  const handleTestScheduling = async () => {
    setTesting(true);
    setTestResults(null);
    
    try {
      console.log('🧪 Testing notification scheduling system...');
      
      // Test the basic notification system
      const basicTest = await testNotificationSystem();
      console.log('📱 Basic notification test result:', basicTest);
      
      // Test the OneSignal REST API
      const restApiTest = await testOneSignalRestAPI();
      console.log('📡 OneSignal REST API test result:', restApiTest);
      
      setTestResults({
        basic: basicTest,
        restApi: restApiTest,
        timestamp: new Date().toLocaleString()
      });
      
    } catch (error) {
      console.error('❌ Testing failed:', error);
      setTestResults({
        error: error.message,
        timestamp: new Date().toLocaleString()
      });
    } finally {
      setTesting(false);
    }
  };

  if (!status) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin text-gray-500" />
          <span className="text-gray-500">Loading OneSignal status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <Bell className="w-5 h-5" />
          <span>OneSignal Status & Testing</span>
        </h3>
        <button
          onClick={updateStatus}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Environment Warning */}
      {environment === 'localhost' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Localhost Environment
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Some OneSignal features may be limited on localhost. Test on Netlify for full functionality.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-white">OneSignal Status</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">SDK Loaded:</span>
              <span className={status.sdkLoaded ? 'text-green-600' : 'text-red-600'}>
                {status.sdkLoaded ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Initialized:</span>
              <span className={status.initialized ? 'text-green-600' : 'text-red-600'}>
                {status.initialized ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">User Subscribed:</span>
              <span className={status.userSubscribed ? 'text-green-600' : 'text-red-600'}>
                {status.userSubscribed ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Permission:</span>
              <span className="text-blue-600">{status.permission}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-white">Environment</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Environment:</span>
              <span className="text-blue-600 capitalize">{environment}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">User ID:</span>
              <span className="text-gray-900 dark:text-white font-mono text-xs">
                {status.userId ? `${status.userId.substring(0, 8)}...` : 'Not set'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSubscribe}
          disabled={status.userSubscribed}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
        >
          {status.userSubscribed ? 'Already Subscribed' : 'Subscribe to Notifications'}
        </button>
        
        <button
          onClick={handleTestScheduling}
          disabled={testing}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <TestTube className="w-4 h-4" />
          <span>{testing ? 'Testing...' : 'Test Scheduling'}</span>
        </button>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Test Results</h4>
          
          {testResults.error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-700 dark:text-red-300">
                  Test failed: {testResults.error}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Basic Notification Test */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Basic Notification Test</h5>
                <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <div><strong>Status:</strong> {testResults.basic.success ? '✅ Success' : '❌ Failed'}</div>
                  <div><strong>Immediate:</strong> {testResults.basic.immediate}</div>
                  <div><strong>Scheduled:</strong> {testResults.basic.scheduled}</div>
                  <div><strong>Message:</strong> {testResults.basic.message}</div>
                </div>
              </div>

              {/* OneSignal REST API Test */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <h5 className="font-medium text-green-800 dark:text-green-200 mb-2">OneSignal REST API Test</h5>
                <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                  <div><strong>Status:</strong> {testResults.restApi.success ? '✅ Success' : '❌ Failed'}</div>
                  <div><strong>Scheduled For:</strong> {testResults.restApi.scheduledFor}</div>
                  <div><strong>Notification ID:</strong> {testResults.restApi.notificationId || 'Not provided'}</div>
                  <div><strong>Message:</strong> {testResults.restApi.message}</div>
                </div>
              </div>

              <div className="text-xs text-gray-500 text-center">
                Test completed at: {testResults.timestamp}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OneSignalTester;