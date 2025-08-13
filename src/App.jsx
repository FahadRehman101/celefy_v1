import React, { useState, useEffect } from 'react';
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
// REMOVED: import OneSignalTester from '@/components/OneSignalTester';

import {
  mockBirthdays,
  mockCelebrityBirthdays,
  mockStories
} from '@/utils/placeholders';

const App = () => {
  // User auth placeholder
  const [user, setUser] = useState({ displayName: 'Fahad Rehman', uid: 'placeholder-user-id' });
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

  // Onboarding form
  const [onboardingForm, setOnboardingForm] = useState({ fullName: '', birthday: '' });
  const handleCompleteOnboarding = () => {
    console.log('Onboarding completed:', onboardingForm);
  };

  // Birthday filters
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
    if (selectedFilter === 'Today') return isToday(b.date);
    if (selectedFilter === 'This Month') return isThisMonth(b.date);
    if (selectedFilter === 'Upcoming') return isUpcoming(b.date);
    return true;
  }).filter((b) =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todaysBirthdays = birthdays.filter((b) => isToday(b.date)).length;
  const thisMonthBirthdays = birthdays.filter((b) => isThisMonth(b.date)).length;
  const next7DaysBirthdays = birthdays.filter((b) => isUpcoming(b.date)).length;

  // Stories
  const [storyForm, setStoryForm] = useState({ title: '', story: '' });
  const [stories, setStories] = useState(mockStories);
  const handleAddStory = () => {
    if (!storyForm.title || !storyForm.story) return;
    const newStory = {
      id: stories.length + 1,
      title: storyForm.title,
      story: storyForm.story,
      author: user.displayName || 'Anonymous',
      date: new Date().toISOString(),
      likes: 0,
    };
    setStories([newStory, ...stories]);
    setStoryForm({ title: '', story: '' });
  };

  const handleLikeStory = (id) => {
    const updated = stories.map(s => s.id === id ? { ...s, likes: s.likes + 1 } : s);
    setStories(updated);
  };

  const handleSignOut = () => {
    console.log('User signed out');
    setUser(null);
  };

  if (!user) return <Login />;

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

      {/* Beautiful notification modals */}
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