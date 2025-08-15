import React, { useState, useEffect } from 'react';
import BirthdayList from '@/components/birthday/BirthdayList';
import {
  Gift,
  Calendar,
  TrendingUp,
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  Sun,
  Moon,
  LogOut,
  ArrowLeft,
  X,
  Heart
} from 'lucide-react';
import AddBirthdayModal from '@/components/birthday/AddBirthdayModal';
import { calculateDaysUntilBirthday } from '@/utils/dates';
import { getBirthdaysOptimized, syncPendingChanges } from '@/services/firestore-cached'; // Updated import
import { getCachedBirthdays, isOnline as isOnlineCheck, setupNetworkListeners, getSyncQueue } from '@/services/localStorage'; // Fixed import
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { signOut } from 'firebase/auth';
import { auth } from '@/config/firebase';
import NotificationBell from '@/components/ui/NotificationBell';
import NotificationCenter from '@/components/ui/NotificationCenter';
import Profile from '@/components/ui/Profile';
import ProfileSetupModal from '@/components/ui/ProfileSetupModal';

const Dashboard = ({ user, darkMode, setDarkMode }) => {
  // State management
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Header controls state
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // 🎯 NEW: Profile setup state
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  
  // 🎯 NEW: Screen state management for mobile-first design
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home', 'filter', 'search'
  const [activeFilter, setActiveFilter] = useState('All');
  
  // New state for caching and offline support
  const [dataSource, setDataSource] = useState('cache'); // 'cache', 'server', 'offline'
  const [isOnline, setIsOnline] = useState(isOnlineCheck());
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'synced', 'error'
  const [pendingChanges, setPendingChanges] = useState(0);

  // Load birthdays on component mount
  useEffect(() => {
    if (user?.uid) {
      loadBirthdaysOptimized();
      checkPendingChanges();
      checkProfileSetup();
    }
  }, [user?.uid]);

  // 🎯 NEW: Check if user needs profile setup
  const checkProfileSetup = () => {
    // Check if user has completed profile setup
    // For now, we'll check if they have a display name and birthday
    // In a real app, you'd check a user profile document in Firestore
    const hasDisplayName = user?.displayName && user.displayName.trim().length > 0;
    const hasBirthday = user?.birthday && user.birthday.trim().length > 0;
    
    // Show profile setup if user doesn't have both name and birthday
    if (!hasDisplayName || !hasBirthday) {
      console.log('🎯 User needs profile setup:', { hasDisplayName, hasBirthday });
      setShowProfileSetup(true);
    }
  };

  // 🎯 NEW: Handle profile setup completion
  const handleProfileSetupComplete = async (profileData) => {
    try {
      console.log('🎯 Profile setup completed:', profileData);
      
      // TODO: Save profile data to Firestore user document
      // await updateUserProfile(user.uid, profileData);
      
      // Update local user object (in a real app, this would come from Firestore)
      // For now, we'll just close the modal and show success
      
      // Show success message
      alert('Profile setup completed successfully! Welcome to Celefy! 🎉');
      
      // Close profile setup modal
      setShowProfileSetup(false);
      
    } catch (error) {
      console.error('❌ Failed to complete profile setup:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  // Debug birthdays state changes
  useEffect(() => {
    console.log('🎂 Dashboard birthdays state updated:', {
      count: birthdays.length,
      birthdays: birthdays.map(b => ({ id: b.id, name: b.name, date: b.date }))
    });
    
    // CRITICAL DEBUG: Check cache directly
    if (user?.uid) {
      try {
        const cached = getCachedBirthdays(user.uid);
        console.log('📱 Direct cache check:', {
          count: cached.data.length,
          data: cached.data.map(b => ({ id: b.id, name: b.name, date: b.date }))
        });
      } catch (error) {
        console.error('❌ Failed to check cache directly:', error);
      }
    }
  }, [birthdays, user?.uid]);

  // Set up network listeners
  useEffect(() => {
    const cleanup = setupNetworkListeners(
      () => {
        console.log('🌐 Back online!');
        setIsOnline(true);
        // Auto-sync when back online
        if (user?.uid) {
          handleSyncPendingChanges();
        }
      },
      () => {
        console.log('📴 Gone offline');
        setIsOnline(false);
        setSyncStatus('offline');
      }
    );

    return cleanup;
  }, [user?.uid]);

  // 🎯 NEW: Handle mobile back button
  useEffect(() => {
    const handlePopState = () => {
      if (currentScreen === 'filter') {
        handleBackToHome();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentScreen]);

  // 🎯 NEW: Debug screen changes
  useEffect(() => {
    console.log('🔄 Screen changed to:', currentScreen);
    console.log('🔄 Active filter:', activeFilter);
    console.log('🔄 Search term:', searchTerm);
  }, [currentScreen, activeFilter, searchTerm]);

  // Header control handlers
  const handleSignOut = async () => {
    try {
      console.log('Signing out...');
      await signOut(auth);
      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  const openNotificationCenter = () => {
    setIsNotificationCenterOpen(true);
  };

  const closeNotificationCenter = () => {
    setIsNotificationCenterOpen(false);
  };

  const openProfile = () => {
    setIsProfileOpen(true);
  };

  const closeProfile = () => {
    setIsProfileOpen(false);
  };

  /**
   * Load birthdays using optimized cached service
   */
  const loadBirthdaysOptimized = async (forceSync = false) => {
    try {
      if (forceSync) {
        setRefreshing(true);
        setSyncStatus('syncing');
      } else {
        setLoading(true);
      }
      
      setError(null);
      
      console.log('📊 Loading birthdays (optimized) for user:', user.uid);
      
      const result = await getBirthdaysOptimized(user.uid, forceSync);
      
      setBirthdays(result.data);
      setDataSource(result.fromCache ? 'cache' : 'server');
      
      // Update sync status
      if (result.synced) {
        setSyncStatus('synced');
        setTimeout(() => setSyncStatus('idle'), 2000); // Reset after 2 seconds
      } else if (result.syncError) {
        setSyncStatus('error');
      } else if (result.syncing) {
        setSyncStatus('syncing');
      } else {
        setSyncStatus('idle');
      }
      
      console.log('✅ Birthdays loaded (optimized):', {
        count: result.data.length,
        source: result.fromCache ? 'cache' : 'server',
        syncing: result.syncing
      });
      
    } catch (err) {
      console.error('❌ Failed to load birthdays:', err);
      setError(err.message);
      setSyncStatus('error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Check for pending changes in sync queue
   */
  const checkPendingChanges = () => {
    if (user?.uid) {
      const queue = getSyncQueue(user.uid); // Assuming getSyncQueue returns the queue
      setPendingChanges(queue.length);
    }
  };

  /**
   * Sync pending changes manually
   */
  const handleSyncPendingChanges = async () => {
    if (!user?.uid || !isOnline) return;

    setSyncStatus('syncing');
    
    try {
      const result = await syncPendingChanges(user.uid);
      
      if (result.success) {
        console.log(`✅ Synced ${result.synced} pending changes`);
        setSyncStatus('synced');
        
        // Refresh data from server to get latest
        await loadBirthdaysOptimized(true);
        checkPendingChanges();
        
        setTimeout(() => setSyncStatus('idle'), 2000);
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('❌ Failed to sync pending changes:', error);
      setSyncStatus('error');
    }
  };

  /**
   * Handle adding a new birthday
   */
  /**
 * Handle adding a new birthday - FIXED VERSION
 */
const handleAddBirthday = (newBirthday) => {
  console.log('🎂 Dashboard: New birthday added:', newBirthday);
  console.log('🎂 Current birthdays count:', birthdays.length);
  console.log('🎂 New birthday ID:', newBirthday?.id);
  console.log('🎂 New birthday name:', newBirthday?.name);
  
  // CRITICAL FIX: Add the new birthday to local state immediately
  if (newBirthday && newBirthday.id) {
    setBirthdays(prevBirthdays => {
      console.log('🎂 Previous birthdays count:', prevBirthdays.length);
      
      // Check if birthday already exists to avoid duplicates
      const exists = prevBirthdays.find(b => b.id === newBirthday.id);
      if (exists) {
        console.log('🎂 Birthday already exists in state, updating...');
        return prevBirthdays.map(b => b.id === newBirthday.id ? newBirthday : b);
      } else {
        console.log('🎂 Adding new birthday to state...');
        const updatedBirthdays = [newBirthday, ...prevBirthdays];
        console.log('🎂 Updated birthdays count:', updatedBirthdays.length);
        return updatedBirthdays;
      }
    });
  } else {
    console.error('❌ Invalid birthday data received:', newBirthday);
  }
  
  // Close the modal
  setShowModal(false);
  
  // Check for pending changes
  checkPendingChanges();
  
  // CRITICAL FIX: Force refresh from cache to ensure consistency
  setTimeout(() => {
    console.log('🎂 Refreshing birthdays from cache...');
    loadBirthdaysOptimized(false); // false = don't force server sync
  }, 100);
};

  /**
   * Handle refreshing data
   */
  const handleRefresh = () => {
    loadBirthdaysOptimized(true);
  };

  /**
   * Handle clicking on stat cards to show filtered lists
   */
  const handleStatCardClick = (filterType) => {
    setActiveFilter(filterType);
    setSelectedFilter(filterType);
    setCurrentScreen('filter'); // Switch to filter screen
    
    // 🎯 NEW: Push to browser history for mobile back button support
    window.history.pushState({ filter: filterType }, '', `#${filterType.toLowerCase().replace(' ', '-')}`);
  };

  /**
   * Handle back navigation to home screen
   */
  const handleBackToHome = () => {
    setCurrentScreen('home');
    setSelectedFilter('All');
    setActiveFilter('All');
    
    // 🎯 NEW: Go back in browser history
    window.history.back();
  };

  /**
   * 🎯 NEW: Handle search screen navigation
   */
  const handleSearchClick = () => {
    console.log('🔍 Search bar clicked! Navigating to search screen...');
    console.log('🔍 Current screen before:', currentScreen);
    console.log('🔍 Current search term:', searchTerm);
    console.log('🔍 Function called successfully');
    
    try {
      setCurrentScreen('search');
      setSearchTerm(''); // Clear search term when opening search screen
      
      // Push to browser history for back button support
      window.history.pushState({ screen: 'search' }, '', '#search');
      
      console.log('🔍 Screen changed to:', 'search');
      console.log('🔍 Search term cleared');
      console.log('🔍 History state pushed');
      
      // Force a re-render to ensure the screen changes
      setTimeout(() => {
        console.log('🔍 After timeout - Current screen:', currentScreen);
        console.log('🔍 After timeout - Search term:', searchTerm);
      }, 100);
      
    } catch (error) {
      console.error('❌ Error in handleSearchClick:', error);
    }
  };

  /**
   * 🎯 NEW: Handle back from search screen
   */
  const handleBackFromSearch = () => {
    console.log('🔙 Back button clicked from search screen');
    console.log('🔙 Current screen:', currentScreen);
    console.log('🔙 Active filter:', activeFilter);
    
    if (currentScreen === 'search') {
      // Go back to previous screen (home or filter)
      if (activeFilter === 'All') {
        console.log('🔙 Going back to HOME screen');
        setCurrentScreen('home');
      } else {
        console.log('🔙 Going back to FILTER screen with filter:', activeFilter);
        setCurrentScreen('filter');
      }
      setSearchTerm(''); // Clear search term
      window.history.back();
      
      console.log('🔙 Navigation completed');
    } else {
      console.log('🔙 Not on search screen, current screen:', currentScreen);
    }
  };

  /**
   * 🎯 NEW: Get search results from ALL birthdays
   */
  const getSearchResults = () => {
    if (!searchTerm.trim()) return [];
    
    return birthdays.filter((b) => {
      const nameMatch = b.name?.toLowerCase().includes(searchTerm.toLowerCase().trim());
      return nameMatch;
    });
  };

  /**
   * Filter birthdays based on selected filter and search term
   */
  const filteredBirthdays = birthdays.filter((b) => {
    const nameMatch = b.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const today = new Date();
    const bday = new Date(b.date);
    const daysUntil = calculateDaysUntilBirthday(b.date);

    switch (selectedFilter) {
      case 'Today':
        return (
          bday.getDate() === today.getDate() &&
          bday.getMonth() === today.getMonth() &&
          nameMatch
        );
      case 'This Month':
        return bday.getMonth() === today.getMonth() && nameMatch;
      case 'This Week':
        return daysUntil <= 7 && nameMatch;
      default:
        return nameMatch;
    }
  });

  // Debug filtered birthdays - moved here after filteredBirthdays is defined
  useEffect(() => {
    console.log('🎂 Dashboard filtered birthdays:', {
      count: filteredBirthdays.length,
      filter: selectedFilter,
      search: searchTerm,
      birthdays: filteredBirthdays.map(b => ({ id: b.id, name: b.name, date: b.date }))
    });
  }, [filteredBirthdays, selectedFilter, searchTerm]);

  // Calculate statistics - add safety checks
  const countToday = birthdays.filter((b) => {
    const today = new Date();
    const bday = new Date(b.date);
    return (
      bday.getDate() === today.getDate() &&
      bday.getMonth() === today.getMonth()
    );
  }).length;

  const countMonth = birthdays.filter((b) => {
    const today = new Date();
    return new Date(b.date).getMonth() === today.getMonth();
  }).length;

  const countUpcoming = birthdays.filter(
    (b) => calculateDaysUntilBirthday(b.date) <= 7
  ).length;

  // Sync status indicator
  const getSyncStatusInfo = () => {
    switch (syncStatus) {
      case 'syncing':
        return { icon: RefreshCw, color: 'text-blue-500', text: 'Syncing...', spin: true };
      case 'synced':
        return { icon: Cloud, color: 'text-green-500', text: 'Synced', spin: false };
      case 'error':
        return { icon: CloudOff, color: 'text-red-500', text: 'Sync failed', spin: false };
      case 'offline':
        return { icon: WifiOff, color: 'text-gray-500', text: 'Offline', spin: false };
      default:
        return { icon: Cloud, color: 'text-gray-400', text: 'Ready', spin: false };
    }
  };

  const syncInfo = getSyncStatusInfo();
  const SyncIcon = syncInfo.icon;

  // Loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-blue-900/20 rounded-2xl border border-pink-200 dark:border-pink-800 p-12 shadow-lg">
          <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-600 rounded-2xl flex items-center justify-center mr-6 shadow-lg">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                Loading your celebrations... 🎉
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Preparing your birthday dashboard with love and care! 💖
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-br from-red-50 via-pink-50 to-purple-50 dark:from-red-900/20 dark:via-pink-900/20 dark:to-purple-900/20 rounded-2xl border border-red-200 dark:border-red-800 p-12 shadow-lg">
          <div className="text-center text-gray-800 dark:text-gray-200">
            <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              Oops! Something went wrong 😅
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
              {error}
            </p>
            <button
              onClick={() => loadBirthdaysOptimized()}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center mx-auto"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {/* 🎯 PERFECT SCREEN SEPARATION - Home vs Filter vs Search */}
      {currentScreen === 'home' ? (
        /* 🏠 HOME SCREEN - Stats Cards ONLY, No Scrolling - PREMIUM LOCKED */
        <div className="h-screen flex flex-col px-4 md:px-6 overflow-hidden max-h-screen" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'none',
          touchAction: 'none'
        }}>
          {/* Header - Fixed at top */}
          <div className="flex-shrink-0 mb-6 pt-4 md:pt-6">
            {/* Main Header Row - Logo + Controls */}
            <div className="flex items-center justify-between mb-6">
              {/* Left: Logo & Title */}
              <div className="flex items-center space-x-3 md:space-x-4">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-xl md:text-2xl">🎂</span>
                </div>
                <div>
                  <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    Celefy
                  </h1>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                    celebrate every special moment
                  </p>
                </div>
              </div>
              
              {/* Right: Controls */}
              <div className="flex items-center space-x-2 md:space-x-3">
                {/* Dark Mode Toggle */}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 md:p-3 text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-xl transition-all duration-200"
                >
                  {darkMode ? (
                    <Sun className="w-4 h-4 md:w-5 md:h-5" />
                  ) : (
                    <Moon className="w-4 h-4 md:w-5 md:h-5" />
                  )}
                </button>
                
                {/* Notification Bell */}
                <NotificationBell 
                  onClick={openNotificationCenter}
                  className="p-2 md:p-3 text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-xl transition-all duration-200"
                  userId={user?.uid}
                />
                
                {/* Profile Button */}
                <button
                  onClick={openProfile}
                  className="p-2 md:p-3 text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-xl transition-all duration-200"
                  title="User Profile"
                >
                  <div className="w-4 h-4 md:w-5 md:h-5 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                </button>
              </div>
            </div>
            
            {/* Add Birthday Button */}
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-3 md:py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2 text-base md:text-lg"
            >
              <span className="text-lg">🎁</span>
              <span>Add Birthday</span>
              <span className="text-lg">✨</span>
            </button>
            
            {/* Search Bar */}
            <div 
              className="mt-4 relative cursor-pointer"
              onClick={(e) => {
                console.log('🔍 Search container clicked! Event:', e);
                console.log('🔍 Target:', e.target);
                console.log('🔍 Current target:', e.currentTarget);
                handleSearchClick();
              }}
              onMouseDown={(e) => console.log('🔍 Search container mouse down:', e)}
              onMouseUp={(e) => console.log('🔍 Search container mouse up:', e)}
            >
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-pink-400 w-4 h-4 md:w-5 md:h-5 pointer-events-none" />
              <input
                type="text"
                placeholder="🔍 Search birthdays..."
                className="w-full pl-10 pr-4 py-3 md:py-3 border-2 border-pink-200 dark:border-pink-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 text-base shadow-lg cursor-pointer hover:border-pink-300 dark:hover:border-pink-600 pointer-events-none"
                readOnly
              />
              {/* REMOVED: The blocking transparent div that was preventing clicks */}
            </div>
          </div>
          
          {/* 🎯 STATS CARDS - PREVIOUS BEAUTIFUL DESIGN RESTORED + PERFECTLY LOCKED */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 items-center pb-4 md:pb-6 overflow-hidden">
            <div 
              onClick={() => handleStatCardClick('All')}
              className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl border border-pink-200 dark:border-pink-700 p-3 md:p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group flex flex-col justify-center"
            >
              <div className="text-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-2 md:mb-3 shadow-lg group-hover:shadow-2xl transition-all duration-300">
                  <span className="text-xl md:text-2xl">🎂</span>
                </div>
                <div className="text-lg md:text-xl font-bold text-pink-600 mb-1">
                  {birthdays.length}
                </div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Total Birthdays
                </div>
                <div className="text-xs text-pink-500 mt-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                  Tap to view all
                </div>
              </div>
            </div>
            
            <div 
              onClick={() => handleStatCardClick('Today')}
              className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-700 p-3 md:p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group flex flex-col justify-center"
            >
              <div className="text-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-2 md:mb-3 shadow-lg group-hover:shadow-2xl transition-all duration-300">
                  <span className="text-xl md:text-2xl">📅</span>
                </div>
                <div className="text-lg md:text-xl font-bold text-green-600 mb-1">
                  {countToday}
                </div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Today
                </div>
                <div className="text-xs text-green-500 mt-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                  Tap to view today's
                </div>
              </div>
            </div>
            
            <div 
              onClick={() => handleStatCardClick('This Month')}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700 p-3 md:p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group flex flex-col justify-center"
            >
              <div className="text-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2 md:mb-3 shadow-lg group-hover:shadow-2xl transition-all duration-300">
                  <span className="text-xl md:text-2xl">📈</span>
                </div>
                <div className="text-lg md:text-xl font-bold text-blue-600 mb-1">
                  {countMonth}
                </div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  This Month
                </div>
                <div className="text-xs text-blue-500 mt-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                  Tap to view month's
                </div>
              </div>
            </div>
            
            <div 
              onClick={() => handleStatCardClick('This Week')}
              className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-700 p-3 md:p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group flex flex-col justify-center"
            >
              <div className="text-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-2 md:mb-3 shadow-lg group-hover:shadow-2xl transition-all duration-300">
                  <span className="text-xl md:text-2xl">🎁</span>
                </div>
                <div className="text-lg md:text-xl font-bold text-purple-600 mb-1">
                  {countUpcoming}
                </div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  This Week
                </div>
                <div className="text-xs text-purple-500 mt-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                  Tap to view week's
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : currentScreen === 'filter' ? (
        /* 📱 FILTER SCREEN - COMPLETELY NEW SCREEN */
        <div className="h-screen flex flex-col px-4 md:px-6 overflow-x-hidden">
          {/*  FILTER HEADER - EXACTLY LIKE STATS CARDS */}
          <div className="flex-shrink-0 mb-4 pt-4 md:pt-6">
            {/* Back Button */}
            <div className="mb-4">
              <button
                onClick={handleBackToHome}
                className="flex items-center space-x-2 text-pink-600 hover:text-pink-700 transition-colors p-2 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Home</span>
              </button>
            </div>
            
            {/* 🎯 FILTER BUTTONS - COMPACT, ALL 4 FIT ON MOBILE */}
            <div className="flex gap-1.5 justify-between w-full">
              {/* All Filter - Pink Theme */}
              <button
                onClick={() => {
                  setActiveFilter('All');
                  setSelectedFilter('All');
                }}
                className={`bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg border border-pink-200 dark:border-pink-700 px-2 py-2 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer group flex flex-col items-center space-y-1 flex-1 mx-0.5 ${
                  activeFilter === 'All' ? 'ring-2 ring-pink-500 ring-offset-1' : ''
                }`}
              >
                <div className="w-6 h-6 bg-gradient-to-br from-pink-400 to-pink-600 rounded-md flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                  <span className="text-sm">🎂</span>
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  All
                </span>
              </button>
              
              {/* Today Filter - Green Theme */}
              <button
                onClick={() => {
                  setActiveFilter('Today');
                  setSelectedFilter('Today');
                }}
                className={`bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-700 px-2 py-2 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer group flex flex-col items-center space-y-1 flex-1 mx-0.5 ${
                  activeFilter === 'Today' ? 'ring-2 ring-green-500 ring-offset-1' : ''
                }`}
              >
                <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-md flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                  <span className="text-sm">📅</span>
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Today
                </span>
              </button>
              
              {/* This Month Filter - Blue Theme */}
              <button
                onClick={() => {
                  setActiveFilter('This Month');
                  setSelectedFilter('This Month');
                }}
                className={`bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700 px-2 py-2 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer group flex flex-col items-center space-y-1 flex-1 mx-0.5 ${
                  activeFilter === 'This Month' ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                }`}
              >
                <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-md flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                  <span className="text-sm">📈</span>
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Month
                </span>
              </button>
              
              {/* This Week Filter - Purple Theme */}
              <button
                onClick={() => {
                  setActiveFilter('This Week');
                  setSelectedFilter('This Week');
                }}
                className={`bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700 px-2 py-2 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer group flex flex-col items-center space-y-1 flex-1 mx-0.5 ${
                  activeFilter === 'This Week' ? 'ring-2 ring-purple-500 ring-offset-1' : ''
                }`}
              >
                <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-md flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                  <span className="text-sm">🎁</span>
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Week
                </span>
              </button>
            </div>
          </div>
          
          {/* 🎯 ADD BIRTHDAY & SEARCH - Compact for Mobile */}
          <div className="flex-shrink-0 mb-4 space-y-3">
            {/* Add Birthday Button */}
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-600 hover:from-pink-600 hover:via-purple-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-bold text-base md:text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center space-x-2 border-2 border-white/20"
            >
              <span className="text-lg">🎁</span>
              <span>Add Birthday</span>
              <span className="text-lg">✨</span>
            </button>
            
            {/* Search Bar */}
            <div 
              className="relative w-full cursor-pointer"
              onClick={handleSearchClick}
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder="🔍 Search birthdays by name..."
                value=""
                readOnly
                className="w-full pl-10 pr-4 py-3 border-2 border-pink-200 dark:border-pink-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 text-base shadow-lg cursor-pointer hover:border-pink-300 dark:hover:border-pink-600 pointer-events-none"
              />
              {/* REMOVED: The blocking transparent div that was preventing clicks */}
            </div>
          </div>
          
          {/* 🎯 BIRTHDAY LIST - Fill Remaining Space with PERFECT CONTAINMENT */}
          <div className="flex-1 space-y-4 pb-4 md:pb-6 overflow-y-auto">
            {/* Birthday List or Empty State */}
            {filteredBirthdays.length > 0 ? (
              <div className="w-full px-1">
                <BirthdayList 
                  birthdays={filteredBirthdays}
                  onRefresh={handleRefresh}
                  loading={refreshing}
                  userId={user?.uid}
                  onDataChange={() => {
                    checkPendingChanges();
                    setTimeout(() => loadBirthdaysOptimized(), 100);
                  }}
                />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-gray-50 via-pink-50 to-purple-50 dark:from-gray-900/20 dark:via-pink-900/10 dark:to-purple-900/10 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center shadow-lg mx-1">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-2xl">🎂</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
                  {selectedFilter === 'All' && 'No Birthdays Yet'}
                  {selectedFilter === 'Today' && 'No Birthdays Today'}
                  {selectedFilter === 'This Month' && 'No Birthdays This Month'}
                  {selectedFilter === 'This Week' && 'No Birthdays This Week'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-sm mx-auto">
                  {selectedFilter === 'All' && 'Start celebrating by adding your first birthday! 🎉'}
                  {selectedFilter === 'Today' && 'No one has a birthday today, but you can still celebrate! 🎊'}
                  {selectedFilter === 'This Month' && 'This month is quiet, but next month might be exciting! 🌟'}
                  {selectedFilter === 'This Week' && 'This week is calm, but celebrations are coming soon! ✨'}
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2 mx-auto text-sm"
                >
                  <span className="text-lg">🎁</span>
                  <span>Add Birthday</span>
                  <span className="text-lg">✨</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 🔍 SEARCH SCREEN - PROFESSIONAL SEARCH EXPERIENCE */
        <div className="h-screen flex flex-col px-4 md:px-6 overflow-x-hidden">
          {/* 🎯 SEARCH HEADER - Professional & Clean */}
          <div className="flex-shrink-0 mb-4 pt-4 md:pt-6">
            {/* Back Button */}
            <div className="mb-4">
              <button
                onClick={handleBackFromSearch}
                className="flex items-center space-x-2 text-pink-600 hover:text-pink-700 transition-colors p-2 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </button>
            </div>
            
            {/* 🎯 PROFESSIONAL SEARCH BAR - Prominent at Top */}
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-pink-400 w-5 h-5" />
              <input
                type="text"
                placeholder="🔍 Search all birthdays by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-12 py-4 border-2 border-pink-200 dark:border-pink-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 text-lg shadow-lg"
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          
          {/* 🎯 SEARCH RESULTS - Professional Display with PERFECT CONTAINMENT */}
          <div className="flex-1 space-y-4 pb-4 md:pb-6 overflow-y-auto overflow-x-hidden">
            {searchTerm.trim() ? (
              getSearchResults().length > 0 ? (
                /* 🎉 SEARCH RESULTS FOUND */
                <div className="space-y-4 w-full">
                  {/* Results Header */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                      Found {getSearchResults().length} birthday{getSearchResults().length !== 1 ? 's' : ''}
                    </h2>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Searching from all birthdays
                    </div>
                  </div>
                  
                  {/* Birthday List */}
                  <div className="w-full px-1">
                    <BirthdayList 
                      birthdays={getSearchResults()}
                      onRefresh={handleRefresh}
                      loading={refreshing}
                      userId={user?.uid}
                      onDataChange={() => {
                        checkPendingChanges();
                        setTimeout(() => loadBirthdaysOptimized(), 100);
                      }}
                    />
                  </div>
                </div>
              ) : (
                /* 🚫 NO SEARCH RESULTS - Professional Empty State */
                <div className="flex-1 flex items-center justify-center">
                  <div className="bg-gradient-to-br from-gray-50 via-pink-50 to-purple-50 dark:from-gray-900/20 dark:via-pink-900/10 dark:to-purple-900/10 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center shadow-lg max-w-md mx-auto">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Search className="w-10 h-10 text-gray-500 dark:text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">
                      No matches found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                      We couldn't find any birthdays matching <span className="font-semibold text-pink-600 dark:text-pink-400">"{searchTerm}"</span> in your birthday list.
                    </p>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        💡 Try:
                      </p>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• Checking the spelling</li>
                        <li>• Using a shorter name</li>
                        <li>• Adding the birthday first</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => setShowModal(true)}
                      className="mt-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2 mx-auto"
                    >
                      <span className="text-lg">🎁</span>
                      <span>Add New Birthday</span>
                      <span className="text-lg">✨</span>
                    </button>
                  </div>
                </div>
              )
            ) : (
              /* 🎯 SEARCH PLACEHOLDER - Professional Initial State */
              <div className="flex-1 flex items-center justify-center">
                <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-blue-900/20 rounded-2xl border border-pink-200 dark:border-pink-700 p-8 text-center shadow-lg max-w-md mx-auto">
                  <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Search className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
                    Search Birthdays
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Type a name above to search through all your saved birthdays. Find friends, family, and loved ones instantly! 🎂
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Add Birthday Modal */}
      <AddBirthdayModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAdd={handleAddBirthday}
      />

      {/* 🎯 Notification Center Modal */}
      <NotificationCenter 
        isOpen={isNotificationCenterOpen}
        onClose={closeNotificationCenter}
        userId={user?.uid}
      />

      {/* 🎯 Profile Modal */}
      <Profile 
        isOpen={isProfileOpen}
        onClose={closeProfile}
        user={user}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* 🎯 Profile Setup Modal */}
      <ProfileSetupModal
        isOpen={showProfileSetup}
        onClose={() => setShowProfileSetup(false)}
        user={user}
        onComplete={handleProfileSetupComplete}
      />
    </ErrorBoundary>
  );
};

export default Dashboard;