// 🚨 COMPLETE FIXED App.jsx - Copy this entire file
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { Gift } from 'lucide-react';
// OneSignal import removed - initialization handled in main.jsx

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
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

import {
  mockBirthdays,
  mockCelebrityBirthdays,
  mockStories
} from '@/utils/placeholders';

const App = () => {
  // OneSignal is now initialized in main.jsx to prevent conflicts
  // This useEffect removed to prevent double initialization

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    // CRITICAL FIX: Safe localStorage access
    try {
      return localStorage.getItem('darkMode') === 'true';
    } catch {
      return false;
    }
  });
  const [currentPage, setCurrentPage] = useState('dashboard');

  // CRITICAL FIX: Safe hook usage with error handling
  let smartNotifications, notificationPermission;
  try {
    smartNotifications = useSmartNotifications();
    notificationPermission = useNotificationPermission();
  } catch (error) {
    console.warn('⚠️ Hook initialization failed:', error.message);
    // Fallback hooks
    smartNotifications = {
      showPrompt: false,
      showSuccess: false,
      showDenied: false,
      promptData: null,
      handlePromptResponse: () => {},
      setShowSuccess: () => {},
      setShowDenied: () => {}
    };
    notificationPermission = {
      showPermissionModal: false,
      handlePermissionResponse: () => {},
      isNotificationEnabled: false
    };
  }

  const {
    showPrompt,
    showSuccess,
    showDenied,
    promptData,
    handlePromptResponse,
    setShowSuccess,
    setShowDenied
  } = smartNotifications;

  const {
    showPermissionModal,
    handlePermissionResponse,
    isNotificationEnabled
  } = notificationPermission;

  // CRITICAL FIX: Safe dark mode toggle
  const toggleDarkMode = () => {
    try {
      const newDarkMode = !darkMode;
      setDarkMode(newDarkMode);
      localStorage.setItem('darkMode', newDarkMode.toString());
    } catch (error) {
      console.warn('⚠️ Dark mode toggle failed:', error.message);
    }
  };

  // CRITICAL FIX: Enhanced Firebase authentication listener with proper error handling
  useEffect(() => {
    let unsubscribe;
    
    try {
      unsubscribe = onAuthStateChanged(auth, 
        async (user) => {
          try {
            console.log('Auth state changed:', user ? `${user.email} logged in` : 'User logged out');
            setUser(user);
            setAuthError(null);
          } catch (error) {
            console.error('❌ Auth state change error:', error);
            setAuthError(error.message);
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error('❌ Firebase auth error:', error);
          setAuthError(error.message);
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('❌ Firebase auth setup failed:', error);
      setAuthError('Authentication system failed to initialize');
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('⚠️ Auth cleanup failed:', error.message);
        }
      }
    };
  }, []);

  // CRITICAL FIX: Loading state with safe rendering
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Celefy...</p>
        </div>
      </div>
    );
  }

  // CRITICAL FIX: Auth error state with retry
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
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all w-full"
            >
              Reload App
            </button>
            <button
              onClick={() => setAuthError(null)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-all w-full"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CRITICAL FIX: Main app render with comprehensive error boundaries
  return (
    <ErrorBoundary>
      <div className={`min-h-screen transition-colors duration-300 ${
        darkMode ? 'dark bg-gray-900' : 'bg-gray-50'
      }`}>
        
        {/* Main App Content */}
        {!user ? (
          <ErrorBoundary>
            <Login />
          </ErrorBoundary>
        ) : (
          <ErrorBoundary>
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
                <ErrorBoundary>
                  <Dashboard 
                    user={user}
                    darkMode={darkMode}
                  />
                </ErrorBoundary>
              )}
              {currentPage === 'celebrity' && (
                <ErrorBoundary>
                  <CelebrityBirthdays 
                    birthdays={mockCelebrityBirthdays}
                    darkMode={darkMode}
                  />
                </ErrorBoundary>
              )}
              {currentPage === 'stories' && (
                <ErrorBoundary>
                  <Stories 
                    stories={mockStories}
                    darkMode={darkMode}
                  />
                </ErrorBoundary>
              )}
            </main>
          </ErrorBoundary>
        )}

        {/* CRITICAL FIX: Safe modal rendering with error boundaries */}
        {showPermissionModal && (
          <ErrorBoundary>
            <NotificationPermissionModal
              isOpen={showPermissionModal}
              onResponse={handlePermissionResponse}
            />
          </ErrorBoundary>
        )}
        
        {/* Existing Notification Modals */}
        {showPrompt && (
          <ErrorBoundary>
            <BirthdayNotificationPrompt
              isOpen={showPrompt}
              onResponse={handlePromptResponse}
              data={promptData}
            />
          </ErrorBoundary>
        )}
        
        {showSuccess && (
          <ErrorBoundary>
            <NotificationSuccessModal 
              isOpen={showSuccess}
              onClose={() => setShowSuccess(false)}
            />
          </ErrorBoundary>
        )}
        
        {showDenied && (
          <ErrorBoundary>
            <NotificationDeniedModal 
              isOpen={showDenied}
              onClose={() => setShowDenied(false)}
            />
          </ErrorBoundary>
        )}
        
        {/* PWA Install Prompt */}
        <PWAInstallPrompt />
      </div>
    </ErrorBoundary>
  );
};

export default App;