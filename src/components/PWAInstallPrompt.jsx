import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Check if already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (isInstalled) return;

    // Check if already dismissed
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after 20 seconds (gives user time to explore)
      setTimeout(() => setShowPrompt(true), 20000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    
    // Listen for manual trigger after first birthday added
    const showPromptHandler = () => {
      if (!localStorage.getItem('pwa-prompt-dismissed')) {
        setShowPrompt(true);
      }
    };
    window.addEventListener('show-pwa-prompt', showPromptHandler);
    
    // iOS Safari manual prompt
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS && !isInstalled) {
      setTimeout(() => setShowPrompt(true), 20000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('show-pwa-prompt', showPromptHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now());
  };

  if (!showPrompt) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 z-50 animate-slide-up border border-gray-200 dark:border-gray-700">
      <button onClick={handleDismiss} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
        <X className="w-5 h-5" />
      </button>
      
      <div className="flex items-center space-x-3">
        <Download className="w-8 h-8 text-primary flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">Install Celefy App</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {isIOS 
              ? 'Tap share button and "Add to Home Screen"'
              : 'Quick access & offline reminders'}
          </p>
        </div>
        {!isIOS && (
          <button
            onClick={handleInstall}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Install
          </button>
        )}
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
