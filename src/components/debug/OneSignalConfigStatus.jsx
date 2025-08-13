import React from 'react';
import { isOneSignalConfigured, getOneSignalConfig } from '@/config/onesignal';
import { getDebugInfo } from '@/utils/onesignal';
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';

const OneSignalConfigStatus = () => {
  const config = getOneSignalConfig();
  const debugInfo = getDebugInfo();
  const isConfigured = isOneSignalConfigured();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
      <div className="flex items-center space-x-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          OneSignal Configuration Status
        </h3>
        {isConfigured ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        )}
      </div>

      {/* Configuration Status */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            App ID
          </span>
          <span className={`text-sm ${config.appId ? 'text-green-600' : 'text-red-600'}`}>
            {config.appId ? '✅ Configured' : '❌ Missing'}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            REST API Key
          </span>
          <span className={`text-sm ${config.restApiKey ? 'text-green-600' : 'text-red-600'}`}>
            {config.restApiKey ? '✅ Configured' : '❌ Missing'}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Safari Web ID
          </span>
          <span className={`text-sm ${config.safariWebId ? 'text-green-600' : 'text-amber-600'}`}>
            {config.safariWebId ? '✅ Configured' : '⚠️ Optional'}
          </span>
        </div>
      </div>

      {/* Debug Information */}
      <div className="space-y-3">
        <h4 className="text-md font-medium text-gray-900 dark:text-white">
          Debug Information
        </h4>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <span className="font-medium text-gray-700 dark:text-gray-300">OneSignal Loaded:</span>
            <span className={`ml-2 ${debugInfo.oneSignalLoaded ? 'text-green-600' : 'text-red-600'}`}>
              {debugInfo.oneSignalLoaded ? 'Yes' : 'No'}
            </span>
          </div>
          
          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <span className="font-medium text-gray-700 dark:text-gray-300">Notifications:</span>
            <span className={`ml-2 ${debugInfo.notificationSupport ? 'text-green-600' : 'text-red-600'}`}>
              {debugInfo.notificationSupport ? 'Supported' : 'Not Supported'}
            </span>
          </div>
          
          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <span className="font-medium text-gray-700 dark:text-gray-300">Permission:</span>
            <span className={`ml-2 ${
              debugInfo.permission === 'granted' ? 'text-green-600' : 
              debugInfo.permission === 'denied' ? 'text-red-600' : 'text-amber-600'
            }`}>
              {debugInfo.permission}
            </span>
          </div>
          
          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <span className="font-medium text-gray-700 dark:text-gray-300">HTTPS:</span>
            <span className={`ml-2 ${debugInfo.isHttps ? 'text-green-600' : 'text-red-600'}`}>
              {debugInfo.isHttps ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>

      {/* Configuration Help */}
      {!isConfigured && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Configuration Required
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                OneSignal is not properly configured. Push notifications will not work until you set up the required environment variables.
              </p>
              <div className="text-sm text-amber-600 dark:text-amber-400">
                <p>Required variables:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">VITE_ONESIGNAL_APP_ID</code></li>
                  <li><code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">VITE_ONESIGNAL_REST_API_KEY</code></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Environment Setup Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Setup Instructions
            </h4>
            <ol className="text-sm text-blue-700 dark:text-blue-300 list-decimal list-inside space-y-1">
              <li>Copy <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">env.example</code> to <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">.env</code></li>
              <li>Fill in your OneSignal credentials from the dashboard</li>
              <li>Restart your development server</li>
              <li>Check this status panel to confirm configuration</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OneSignalConfigStatus;
