import React, { useState, useEffect } from 'react';
import { getQueueStats, processNotificationQueue, clearQueue } from '@/services/notificationQueue';
import { isOneSignalConfigured } from '@/config/onesignal';

const NotificationQueueDebug = () => {
  const [stats, setStats] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const refreshStats = () => {
    setStats(getQueueStats());
  };

  useEffect(() => {
    refreshStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleProcessQueue = async () => {
    setProcessing(true);
    try {
      const result = await processNotificationQueue();
      console.log('Queue processing result:', result);
      refreshStats();
      
      // Show result for a moment
      setTimeout(() => {
        alert(`Processed: ${result.processed}, Failed: ${result.failed}, Remaining: ${result.remaining}`);
      }, 100);
    } catch (error) {
      console.error('Error processing queue:', error);
      alert('Error processing queue: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleClearQueue = () => {
    if (confirm('Are you sure you want to clear the notification queue? This cannot be undone.')) {
      clearQueue();
      refreshStats();
    }
  };

  if (!stats) return null;

  // Don't show if queue is empty and collapsed
  if (stats.total === 0 && isCollapsed) {
    return (
      <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2 shadow-lg text-xs z-50">
        <button
          onClick={() => setIsCollapsed(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          🔔 Queue (0)
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg text-sm z-50 max-w-xs">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer border-b border-gray-200 dark:border-gray-600"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center space-x-2">
          <h3 className="font-bold text-gray-800 dark:text-gray-200">
            🔔 Queue ({stats.total})
          </h3>
          <div className={`w-2 h-2 rounded-full ${isOneSignalConfigured() ? 'bg-green-500' : 'bg-red-500'}`} 
               title={isOneSignalConfigured() ? 'OneSignal Configured' : 'OneSignal Not Configured'} />
        </div>
        <span className="text-gray-500 dark:text-gray-400">
          {isCollapsed ? '▼' : '▲'}
        </span>
      </div>
      
      {!isCollapsed && (
        <div className="p-3">
          <div className="space-y-2 mb-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{stats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Pending:</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">{stats.pending}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Retrying:</span>
              <span className="font-medium text-yellow-600 dark:text-yellow-400">{stats.retrying}</span>
            </div>
            {stats.oldestAge !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Oldest:</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{stats.oldestAge}m ago</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Online:</span>
              <span className={`font-medium ${navigator.onLine ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {navigator.onLine ? '✅' : '❌'}
              </span>
            </div>
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={handleProcessQueue}
              disabled={processing || !navigator.onLine}
              className="flex-1 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              title={!navigator.onLine ? "Can't process while offline" : "Process queue now"}
            >
              {processing ? '⏳' : '▶️'}
            </button>
            
            <button
              onClick={handleClearQueue}
              className="flex-1 px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
              title="Clear all queued items"
            >
              🗑️
            </button>
            
            <button
              onClick={refreshStats}
              className="flex-1 px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
              title="Refresh stats"
            >
              🔄
            </button>
          </div>
          
          {stats.total > 0 && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
              💡 Notifications will auto-process when online
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationQueueDebug;