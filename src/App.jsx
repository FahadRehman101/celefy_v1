// 🔧 CLEAN App.jsx - Fixed version
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { Gift } from 'lucide-react';

import BirthdayNotificationPrompt from '@/components/notifications/BirthdayNotificationPrompt';
import NotificationPermissionModal from '@/components/notifications/NotificationPermissionModal';
import { NotificationSuccessModal, NotificationDeniedModal } from '@/components/notifications/NotificationFeedback';
import { useSmartNotifications } from '@/hooks/useSmartNotifications';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import CelebrityBirthdays from '@/pages/CelebrityBirthdays';
import Stories from '@/pages/Stories';

import OnboardingModal from '@/components/onboarding/OnboardingModal';
import Navigation from '@/components/layout/Navigation';

import {
  mockBirthdays,
  mockCelebrityBirthdays,
  mockStories
} from '@/utils/placeholders';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Smart notifications hook
  const {
    showPrompt,
    showSuccess,
    showDenied,
    promptData,
    handlePromptResponse,
    setShowSuccess,
    setShowDenied
  } = useSmartNotifications();

  // 🔧 NEW: Notification permission hook
  const {
    showPermissionModal,
    handlePermissionResponse,
    isNotificationEnabled
  } = useNotificationPermission();

  // Enhanced Firebase authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, 
      async (user) => {
        console.log('Auth state changed:', user ? `${user.email} logged in` : 'User logged out');
        
        if (user) {
          try {
            // Initialize user profile in Firestore
            const { initializeUserProfile } = await import('@/services/firestore');
            await initializeUserProfile(user.uid, {
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              lastLogin: new Date()
            });
            
            setUser(user);
            setAuthError(null);
            
            // Process notification queue when user logs in and notifications are enabled
            if (navigator.onLine && isNotificationEnabled) {
              console.log('🔄 User logged in and notifications enabled - processing notification queue...');
              try {
                const { processNotificationQueue, getQueueStats } = await import('@/services/notificationQueue');
                const queueStats = getQueueStats();
                
                if (queueStats.total > 0) {
                  console.log(`📊 Found ${queueStats.total} queued notifications to process`);
                  const result = await processNotificationQueue();
                  
                  if (result.success && result.processed > 0) {
                    console.log(`✅ Successfully processed ${result.processed} queued notifications!`);
                  }
                }
              } catch (queueError) {
                console.error('❌ Error processing notification queue:', queueError);
              }
            }
            
          } catch (error) {
            console.error('Error initializing user profile:', error);
            setAuthError('Failed to initialize user profile');
          }
        } else {
          setUser(null);
        }
        
        setLoading(false);
      },
      (error) => {
        console.error('Auth state change error:', error);
        setAuthError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isNotificationEnabled]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = async () => {
      console.log('📶 Back online! Processing queued notifications...');
      
      if (user && isNotificationEnabled) {
        try {
          const { processNotificationQueue } = await import('@/services/notificationQueue');
          await processNotificationQueue();
        } catch (error) {
          console.error('❌ Error processing queue on reconnect:', error);
        }
      }
    };

    const handleOffline = () => {
      console.log('📴 Gone offline. Notifications will be queued.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, isNotificationEnabled]);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('celefy-theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  // Handle theme toggle
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('celefy-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('celefy-theme', 'light');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
        <div className="text-center">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 rounded-2xl mx-auto w-fit mb-4 shadow-lg animate-pulse">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Loading Celefy...
          </h2>
          <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-500 p-4 rounded-2xl mx-auto w-fit mb-4 shadow-lg">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{authError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`min-h-screen transition-colors duration-300 ${
        darkMode ? 'dark bg-gray-900' : 'bg-gray-50'
      }`}>
        
        {/* Main App Content */}
        {!user ? (
          <Login />
        ) : (
          <>
            <Navigation 
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              darkMode={darkMode}
              setDarkMode={toggleDarkMode}
              user={user}
            />
            
            <main className="pb-20">
              {/* Page content based on currentPage */}
              {currentPage === 'dashboard' && (
                <Dashboard 
                  user={user}
                  darkMode={darkMode}
                />
              )}
              {currentPage === 'celebrity' && (
                <CelebrityBirthdays 
                  birthdays={mockCelebrityBirthdays}
                  darkMode={darkMode}
                />
              )}
              {currentPage === 'stories' && (
                <Stories 
                  stories={mockStories}
                  darkMode={darkMode}
                />
              )}
            </main>
          </>
        )}

        {/* 🔧 NEW: Notification Permission Modal */}
        <NotificationPermissionModal
          isOpen={showPermissionModal}
          onResponse={handlePermissionResponse}
        />
        
        {/* Existing Notification Modals */}
        {showPrompt && (
          <BirthdayNotificationPrompt
            isOpen={showPrompt}
            onResponse={handlePromptResponse}
            data={promptData}
          />
        )}
        
        <NotificationSuccessModal 
          isOpen={showSuccess}
          onClose={() => setShowSuccess(false)}
        />
        
        <NotificationDeniedModal 
          isOpen={showDenied}
          onClose={() => setShowDenied(false)}
        />
      </div>
    </ErrorBoundary>
  );
};

export default App;