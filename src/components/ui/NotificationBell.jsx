// 🎯 Notification Bell Component - Elegant & User-Friendly
// Beautiful bell icon with animated notification count and smooth interactions

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { getUnreadNotificationCount } from '@/services/notificationHistory';

const NotificationBell = ({ onClick, className = '' }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Update unread count when component mounts and periodically
  useEffect(() => {
    const updateCount = () => {
      const count = getUnreadNotificationCount();
      setUnreadCount(count);
    };

    // Initial count
    updateCount();

    // Update every 30 seconds
    const interval = setInterval(updateCount, 30000);

    // Listen for storage changes (when notifications are added/removed)
    const handleStorageChange = (e) => {
      if (e.key === 'celefy_notification_history') {
        updateCount();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Animate when count changes
  useEffect(() => {
    if (unreadCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  const handleClick = () => {
    // Add subtle click animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 200);
    
    if (onClick) {
      onClick();
    }
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Bell Icon */}
      <button
        onClick={handleClick}
        className={`
          relative p-2 rounded-full transition-all duration-300 ease-out
          hover:bg-gray-100 dark:hover:bg-gray-800
          active:scale-95 transform
          focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
          ${isAnimating ? 'animate-pulse' : ''}
          border border-gray-300 dark:border-gray-600
        `}
        aria-label="Notifications"
      >
        <Bell 
          className={`
            w-6 h-6 transition-all duration-300
            text-gray-600 dark:text-gray-300
            group-hover:text-pink-500 group-hover:scale-110
            ${isAnimating ? 'text-pink-500' : ''}
          `}
        />
        
        {/* Notification Count Badge */}
        {unreadCount > 0 && (
          <div className={`
            absolute -top-1 -right-1
            min-w-[20px] h-5 px-1.5
            bg-gradient-to-r from-pink-500 to-purple-600
            text-white text-xs font-bold
            rounded-full flex items-center justify-center
            transition-all duration-300 ease-out
            ${isAnimating ? 'scale-125 animate-bounce' : 'scale-100'}
            shadow-lg
          `}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
        
        {/* Hover Effect Ring */}
        <div className={`
          absolute inset-0 rounded-full
          bg-gradient-to-r from-pink-500/20 to-purple-600/20
          opacity-0 group-hover:opacity-100
          scale-0 group-hover:scale-100
          transform transition-all duration-300 ease-out
        `} />
      </button>
      
      {/* Tooltip */}
      <div className={`
        absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
        px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900
        text-sm font-medium rounded-lg shadow-lg
        opacity-0 group-hover:opacity-100
        transition-opacity duration-200 pointer-events-none
        whitespace-nowrap z-50
      `}>
        {unreadCount > 0 
          ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
          : 'No new notifications'
        }
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100" />
      </div>
    </div>
  );
};

export default NotificationBell;
