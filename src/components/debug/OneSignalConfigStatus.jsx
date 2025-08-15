import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, Bell, Settings, RefreshCw } from 'lucide-react';
import { isOneSignalConfigured, getOneSignalConfig } from '@/config/onesignal';

const OneSignalConfigStatus = () => {
  const [configStatus, setConfigStatus] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = () => {
    const config = getOneSignalConfig();
    const isConfigured = isOneSignalConfigured();
    
    setConfigStatus({
      isConfigured,
      config,
      timestamp: new Date().toLocaleString()
    });
  };

  const testNotificationScheduling = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      // Test if OneSignal is available
      if (!window.OneSignal) {
        throw new Error('OneSignal SDK not loaded');
      }

      // Test if user is subscribed
      const isSubscribed = await window.OneSignal.User.PushSubscription.optedIn;
      
      if (!isSubscribed) {
        throw new Error('User not subscribed to notifications');
      }

      // Test configuration
      const config = getOneSignalConfig();
      if (!config.restApiKey) {
        throw new Error('REST API key not configured');
      }

      // Test a simple notification scheduling (this won't actually send, just test the API)
      const testPayload = {
        app_id: config.appId,
        included_segments: ["Subscribed Users"],
        headings: { en: "Test Notification" },
        contents: { en: "This is a test notification to verify OneSignal configuration" },
        send_after: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
        delayed_option: "timezone",
        ttl: 300 // 5 minutes TTL for test
      };

      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${config.restApiKey}`
        },
        body: JSON.stringify(testPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OneSignal API test failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      setTestResult({
        success: true,
        message: 'OneSignal configuration test successful!',
        details: {
          notificationId: result.id,
          status: response.status,
          response: result
        }
      });

    } catch (error) {
      setTestResult({
        success: false,
        message: 'OneSignal configuration test failed',
        error: error.message,
        details: {
          timestamp: new Date().toLocaleString(),
          userAgent: navigator.userAgent
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    if (status) return <CheckCircle className="w-5 h-5 text-green-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusColor = (status) => {
    if (status) return 'text-green-600';
    return 'text-red-600';
  };

  if (!configStatus) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Checking configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            OneSignal Configuration Status
          </h2>
        </div>
        <button
          onClick={checkConfiguration}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Configuration Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            Configuration Status
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Overall Status:</span>
              <div className="flex items-center space-x-2">
                {getStatusIcon(configStatus.isConfigured)}
                <span className={getStatusColor(configStatus.isConfigured)}>
                  {configStatus.isConfigured ? 'Configured' : 'Not Configured'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">App ID:</span>
              <span className="text-sm font-mono bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                {configStatus.config.appId ? `${configStatus.config.appId.substring(0, 8)}...` : 'Missing'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">REST API Key:</span>
              <span className="text-sm font-mono bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                {configStatus.config.restApiKey ? `${configStatus.config.restApiKey.substring(0, 8)}...` : 'Missing'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Safari Web ID:</span>
              <span className="text-sm font-mono bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                {configStatus.config.safariWebId ? `${configStatus.config.safariWebId.substring(0, 8)}...` : 'Missing'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
            <Info className="w-4 h-4 mr-2" />
            System Information
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Environment:</span>
              <span className="font-mono">{window.location.hostname}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Protocol:</span>
              <span className="font-mono">{window.location.protocol}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">OneSignal SDK:</span>
              <span className="font-mono">{window.OneSignal ? 'Loaded' : 'Not Loaded'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Last Check:</span>
              <span className="font-mono text-xs">{configStatus.timestamp}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Test Button */}
      <div className="flex justify-center">
        <button
          onClick={testNotificationScheduling}
          disabled={isLoading || !configStatus.isConfigured}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            isLoading || !configStatus.isConfigured
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-500 text-white hover:bg-green-600 hover:scale-105'
          }`}
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Bell className="w-4 h-4" />
          )}
          <span>
            {isLoading ? 'Testing...' : 'Test Notification System'}
          </span>
        </button>
      </div>

      {/* Test Results */}
      {testResult && (
        <div className={`rounded-lg p-4 ${
          testResult.success 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-start space-x-3">
            {testResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className={`font-semibold ${
                testResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
              }`}>
                {testResult.message}
              </h4>
              {testResult.error && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                  Error: {testResult.error}
                </p>
              )}
              {testResult.details && (
                <div className="mt-2 text-sm">
                  <details className="cursor-pointer">
                    <summary className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                      View Details
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
                      {JSON.stringify(testResult.details, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {!configStatus.isConfigured && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                Configuration Required
              </h4>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                To enable birthday notifications, you need to:
              </p>
              <ul className="text-yellow-700 dark:text-yellow-300 text-sm mt-2 ml-4 list-disc">
                <li>Create a <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">.env</code> file in your project root</li>
                <li>Add your OneSignal REST API key: <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">VITE_ONESIGNAL_REST_API_KEY=your_key_here</code></li>
                <li>Restart your development server</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OneSignalConfigStatus;
