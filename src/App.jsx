import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { Gift } from 'lucide-react';

import BirthdayNotificationPrompt from '@/components/notifications/BirthdayNotificationPrompt';
import { NotificationSuccessModal, NotificationDeniedModal } from '@/components/notifications/NotificationFeedback';
import { useSmartNotifications } from '@/hooks/useSmartNotifications';

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
  // ✅ CHANGED: Real authentication state
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

  // ✅ NEW: Firebase authentication listener
  // Find this section in your App.jsx and replace it:

// ✅ NEW: Firebase authentication listener
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
}, []);
  // Onboarding form
  const [onboardingForm, setOnboardingForm] = useState({ fullName: '', birthday: '' });
  const handleCompleteOnboarding = () => {
    console.log('Onboarding completed:', onboardingForm);
  };

  // Birthday filters (keep existing logic)
  const [birthdays, setBirthdays] = useState(mockBirthdays);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const today = new Date();
  const isToday = (dateStr) => {
    const date = new Date(dateStr);
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
  };

  const isThisMonth = (dateStr) => {
    const date = new Date(dateStr);
    return date.getMonth() === today.getMonth();
  };

  const isUpcoming = (dateStr) => {
    const date = new Date(dateStr);
    const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    return diff >= 1 && diff <= 7;
  };

  const filteredBirthdays = birthdays.filter((b) => {
    if (selectedFilter === 'Today') return isToday(b.date) && b.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (selectedFilter === 'This Month') return isThisMonth(b.date) && b.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (selectedFilter === 'Upcoming') return isUpcoming(b.date) && b.name.toLowerCase().includes(searchTerm.toLowerCase());
    return b.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const todaysBirthdays = birthdays.filter(isToday);
  const thisMonthBirthdays = birthdays.filter(isThisMonth);
  const next7DaysBirthdays = birthdays.filter(isUpcoming);

  // Stories (keep existing)
  const [storyForm, setStoryForm] = useState({ title: '', content: '', image: '' });
  const [stories, setStories] = useState(mockStories);

  const handleAddStory = () => {
    if (storyForm.title && storyForm.content) {
      const newStory = {
        id: Date.now(),
        ...storyForm,
        author: user?.displayName || user?.email || 'Anonymous',
        date: new Date().toLocaleDateString(),
        likes: 0
      };
      setStories([newStory, ...stories]);
      setStoryForm({ title: '', content: '', image: '' });
    }
  };

  const handleLikeStory = (id) => {
    const updated = stories.map(s => s.id === id ? { ...s, likes: s.likes + 1 } : s);
    setStories(updated);
  };

  const handleSignOut = async () => {
    try {
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // ✅ NEW: Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="text-center">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 rounded-2xl mx-auto w-fit mb-4 animate-pulse">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <div className="text-xl font-semibold text-gray-700">Loading Celefy...</div>
        </div>
      </div>
    );
  }

  // ✅ NEW: Auth error state
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="text-red-500 mb-4">Authentication Error</div>
          <div className="text-gray-700 mb-4">{authError}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ✅ NEW: Show login if no user
  if (!user) {
    return <Login />;
  }

  // ✅ EXISTING: Main app when user is authenticated
  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50'}`}>
      <Navigation
        user={user}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        setDarkMode={setDarkMode}
        darkMode={darkMode}
        handleSignOut={handleSignOut}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentPage === 'dashboard' && (
          <Dashboard
            user={user}
            birthdays={birthdays}
            setBirthdays={setBirthdays}
            filteredBirthdays={filteredBirthdays}
            todaysBirthdays={todaysBirthdays}
            thisMonthBirthdays={thisMonthBirthdays}
            next7DaysBirthdays={next7DaysBirthdays}
            selectedFilter={selectedFilter}
            setSelectedFilter={setSelectedFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        )}
        {currentPage === 'celebrities' && (
          <CelebrityBirthdays
            celebrityBirthdays={mockCelebrityBirthdays}
          />
        )}
        {currentPage === 'stories' && (
          <Stories
            storyForm={storyForm}
            setStoryForm={setStoryForm}
            stories={stories}
            handleAddStory={handleAddStory}
            handleLikeStory={handleLikeStory}
          />
        )}
      </main>

      <OnboardingModal
        onboardingForm={onboardingForm}
        setOnboardingForm={setOnboardingForm}
        handleCompleteOnboarding={handleCompleteOnboarding}
      />

      <BirthdayNotificationPrompt
        isOpen={showPrompt}
        onClose={handlePromptResponse}
        friendName={promptData.friendName}
      />

      <NotificationSuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
      />

      <NotificationDeniedModal
        isOpen={showDenied}
        onClose={() => setShowDenied(false)}
      />

      <footer className="bg-white/80 backdrop-blur-md border-t border-pink-200 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-2 rounded-xl mr-3">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              Celefy
            </h3>
          </div>
          <p className="text-gray-600 mb-4">Making every birthday celebration magical ✨</p>
          <div className="flex justify-center space-x-6 text-sm text-gray-500">
            <span>Made with 💖 for birthday lovers</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;