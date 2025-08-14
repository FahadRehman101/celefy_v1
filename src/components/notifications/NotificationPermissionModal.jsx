// 🔧 NEW FILE: src/components/notifications/NotificationPermissionModal.jsx
import React, { useState } from 'react';
import { Bell, X, Gift, Clock, CheckCircle } from 'lucide-react';

const NotificationPermissionModal = ({ isOpen, onResponse, friendName = null }) => {
  const [requesting, setRequesting] = useState(false);

  if (!isOpen) return null;

  const handleAllow = async () => {
    setRequesting(true);
    
    try {
      console.log('🔔 Requesting notification permission...');
      
      // First, try to get OneSignal permission
      if (window.OneSignal) {
        window.OneSignal.push(async function() {
          try {
            // Show OneSignal permission prompt
            await window.OneSignal.showSlidedownPrompt();
            
            // Wait a moment for permission to be processed
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const permission = await window.OneSignal.isPushNotificationsEnabled();
            
            if (permission) {
              console.log('✅ OneSignal permission granted');
              onResponse('success');
            } else {
              console.log('❌ OneSignal permission denied');
              onResponse('denied');
            }
          } catch (error) {
            console.error('OneSignal permission error:', error);
            // Fallback to browser permission
            await requestBrowserPermission();
          }
        });
      } else {
        // Fallback to browser permission if OneSignal not loaded
        await requestBrowserPermission();
      }
    } catch (error) {
      console.error('Permission request error:', error);
      onResponse('denied');
    } finally {
      setRequesting(false);
    }
  };

  const requestBrowserPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('✅ Browser permission granted');
        onResponse('success');
      } else {
        console.log('❌ Browser permission denied');
        onResponse('denied');
      }
    } catch (error) {
      console.error('Browser permission error:', error);
      onResponse('denied');
    }
  };

  const handleDeny = () => {
    console.log('🚫 User denied notification permission');
    onResponse('denied');
  };

  const handleLater = () => {
    console.log('⏰ User chose "maybe later"');
    // Set delay for 24 hours
    const delayUntil = Date.now() + (24 * 60 * 60 * 1000);
    localStorage.setItem('celefy-notification-prompt-delay', delayUntil.toString());
    onResponse('later');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        
        {/* Close button */}
        <button
          onClick={handleDeny}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={requesting}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-4 rounded-2xl mx-auto w-fit mb-4 shadow-lg">
            <Bell className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Never Miss a Birthday! 🎉
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {friendName 
              ? `Get reminded about ${friendName}'s birthday and others you add!`
              : 'Get notified about upcoming birthdays so you never forget to celebrate!'
            }
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-3 text-sm">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-gray-700 dark:text-gray-300">
              7-day and 1-day advance reminders
            </span>
          </div>
          
          <div className="flex items-center space-x-3 text-sm">
            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
              <Gift className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-gray-700 dark:text-gray-300">
              Birthday day notifications
            </span>
          </div>
          
          <div className="flex items-center space-x-3 text-sm">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
              <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-gray-700 dark:text-gray-300">
              Works even when app is closed
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={handleAllow}
            disabled={requesting}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
          >
            {requesting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Requesting Permission...</span>
              </div>
            ) : (
              'Enable Birthday Reminders'
            )}
          </button>
          
          <div className="flex space-x-2">
            <button
              onClick={handleLater}
              disabled={requesting}
              className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Maybe Later
            </button>
            
            <button
              onClick={handleDeny}
              disabled={requesting}
              className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              No Thanks
            </button>
          </div>
        </div>

        {/* Privacy note */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          You can change this setting anytime in your browser or app settings
        </p>
      </div>
    </div>
  );
};

export default NotificationPermissionModal;