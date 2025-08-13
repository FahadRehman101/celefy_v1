import React, { useEffect, useState } from 'react';

export default function OneSignalTester() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkOneSignal = () => {
      if (window.OneSignal && window.OneSignal.isPushNotificationsEnabled) {
        window.OneSignal.isPushNotificationsEnabled().then(enabled => {
          console.log('Push enabled?', enabled);
          setIsReady(true);
        }).catch(() => {
          setTimeout(checkOneSignal, 500); // retry after 500ms
        });
      } else {
        setTimeout(checkOneSignal, 500); // retry after 500ms
      }
    };

    checkOneSignal();
  }, []);

  const askPermission = () => {
    if (isReady && window.OneSignal) {
      // Preferred prompt method
      if (window.OneSignal.showSlidedownPrompt) {
        window.OneSignal.showSlidedownPrompt();
      }
      // Fallback
      else if (window.OneSignal.registerForPushNotifications) {
        window.OneSignal.registerForPushNotifications();
      }
      else {
        alert('Push notification prompt method is not available.');
      }
    } else {
      alert('OneSignal is not ready yet, please wait a moment and try again.');
    }
  };

  return (
    <div style={{ margin: 20 }}>
      <button
        onClick={askPermission}
        disabled={!isReady}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: isReady ? 'pointer' : 'not-allowed',
          opacity: isReady ? 1 : 0.5,
        }}
      >
        Subscribe to Notifications
      </button>
      {!isReady && <p>Loading OneSignal...</p>}
    </div>
  );
}
