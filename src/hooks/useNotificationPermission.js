// 🔧 NEW FILE: src/hooks/useNotificationPermission.js
import { useState, useEffect } from 'react';

export const useNotificationPermission = () => {
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [oneSignalReady, setOneSignalReady] = useState(false);

  // Check permission status on mount
  useEffect(() => {
    updatePermissionStatus();
    checkOneSignalStatus();
    
    // Listen for permission changes
    const handlePermissionChange = () => {
      updatePermissionStatus();
    };

    // Note: permission change events are not widely supported
    // This is more for future compatibility
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' })
        .then(permission => {
          permission.addEventListener('change', handlePermissionChange);
        })
        .catch(() => {
          // Silently fail if permissions API not supported
        });
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  const updatePermissionStatus = () => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  };

  const checkOneSignalStatus = () => {
    if (window.OneSignal) {
      setOneSignalReady(true);
    } else {
      // Check periodically for OneSignal to load
      const checkInterval = setInterval(() => {
        if (window.OneSignal) {
          setOneSignalReady(true);
          clearInterval(checkInterval);
        }
      }, 500);

      // Stop checking after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
      }, 10000);
    }
  };

  // Check if we should show the permission prompt
  const shouldShowPermissionPrompt = () => {
    // Don't show if user already granted permission
    if (permissionStatus === 'granted') return false;
    
    // Don't show if user already denied (unless they reset it)
    if (permissionStatus === 'denied') return false;
    
    // Don't show if user said "maybe later" recently
    const delayUntil = localStorage.getItem('celefy-notification-prompt-delay');
    if (delayUntil && Date.now() < parseInt(delayUntil)) return false;
    
    // Don't show if user permanently dismissed
    const dismissed = localStorage.getItem('celefy-notification-prompt-dismissed');
    if (dismissed === 'true') return false;
    
    return true;
  };

  // Trigger permission prompt (call this when user adds first birthday)
  const triggerPermissionPrompt = (friendName = null) => {
    console.log('🔔 Checking if should show permission prompt...');
    console.log('Permission status:', permissionStatus);
    console.log('Should show:', shouldShowPermissionPrompt());
    
    if (shouldShowPermissionPrompt()) {
      console.log('✅ Showing permission prompt');
      setShowPermissionModal(true);
    } else {
      console.log('⏭️ Skipping permission prompt');
    }
  };

  // Handle permission response
  const handlePermissionResponse = async (response) => {
    console.log('🎯 Permission response:', response);
    setShowPermissionModal(false);
    
    switch (response) {
      case 'success':
        updatePermissionStatus();
        console.log('🎉 Notifications enabled successfully!');
        break;
        
      case 'denied':
        updatePermissionStatus();
        console.log('❌ Notifications denied');
        break;
        
      case 'later':
        console.log('⏰ User chose "maybe later"');
        // Delay is already set in the modal component
        break;
        
      case 'dismissed':
        console.log('🚫 User permanently dismissed');
        localStorage.setItem('celefy-notification-prompt-dismissed', 'true');
        break;
    }
  };

  // Check if notifications are currently enabled
  const isNotificationEnabled = () => {
    return permissionStatus === 'granted';
  };

  // Manually request permission (for settings page, etc.)
  const requestPermission = async () => {
    try {
      let granted = false;
      
      if (window.OneSignal && oneSignalReady) {
        // Try OneSignal first
        window.OneSignal.push(async function() {
          await window.OneSignal.showSlidedownPrompt();
          await new Promise(resolve => setTimeout(resolve, 1000));
          granted = await window.OneSignal.isPushNotificationsEnabled();
        });
      } else {
        // Fallback to browser API
        const permission = await Notification.requestPermission();
        granted = permission === 'granted';
      }
      
      updatePermissionStatus();
      return granted;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  };

  return {
    // State
    showPermissionModal,
    permissionStatus,
    oneSignalReady,
    
    // Actions
    triggerPermissionPrompt,
    handlePermissionResponse,
    requestPermission,
    
    // Helpers
    isNotificationEnabled: isNotificationEnabled(),
    shouldShowPrompt: shouldShowPermissionPrompt()
  };
};