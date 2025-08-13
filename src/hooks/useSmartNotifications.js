import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '@/utils/constants';

export const useSmartNotifications = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDenied, setShowDenied] = useState(false);
  const [promptData, setPromptData] = useState({});

  // Check if we should show notification prompt
  const shouldShowPrompt = () => {
    // Don't show if user already has notifications
    if (Notification.permission === 'granted') return false;
    
    // Don't show if user said "maybe later" recently
    const delayUntil = localStorage.getItem(STORAGE_KEYS.NOTIFICATION_PROMPT_DELAY);
    if (delayUntil && Date.now() < parseInt(delayUntil)) return false;
    
    // Don't show if user permanently dismissed
    if (localStorage.getItem(STORAGE_KEYS.NOTIFICATION_PROMPT_DISMISSED) === 'true') return false;
    
    return true;
  };

  // Trigger notification prompt when user adds first birthday
  const triggerNotificationPrompt = (friendName = null) => {
    if (shouldShowPrompt()) {
      setPromptData({ friendName });
      setShowPrompt(true);
    }
  };

  // Handle prompt responses
  const handlePromptResponse = (response) => {
    setShowPrompt(false);
    
    switch (response) {
      case 'success':
        setShowSuccess(true);
        break;
      case 'denied':
        setShowDenied(true);
        break;
      case 'later':
        // Already handled in component
        break;
      case 'dismissed':
        localStorage.setItem(STORAGE_KEYS.NOTIFICATION_PROMPT_DISMISSED, 'true');
        break;
    }
  };

  return {
    showPrompt,
    showSuccess,
    showDenied,
    promptData,
    triggerNotificationPrompt,
    handlePromptResponse,
    setShowSuccess,
    setShowDenied
  };
};
