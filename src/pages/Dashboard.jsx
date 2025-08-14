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
  CloudOff
} from 'lucide-react';
import AddBirthdayModal from '@/components/birthday/AddBirthdayModal';
import { calculateDaysUntilBirthday } from '@/utils/dates';
import { getBirthdaysOptimized, syncPendingChanges } from '@/services/firestore-cached'; // Updated import
import { getCachedBirthdays, isOnline as isOnlineCheck, setupNetworkListeners, getSyncQueue } from '@/services/localStorage'; // Fixed import
import ErrorBoundary from '@/components/ui/ErrorBoundary';

const Dashboard = ({ user }) => {
  // State management
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
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
    }
  }, [user?.uid]);

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
    setSelectedFilter(filterType);
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
      <div className="space-y-8">
        {/* Enhanced Header with notification status */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-4 md:mb-6">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl md:text-3xl">🎂</span>
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Celefy
                </h1>
                <p className="text-sm md:text-lg text-gray-600 dark:text-gray-400">
                  Celebrate every special moment! 🎉
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-600 hover:from-pink-600 hover:via-purple-600 hover:to-blue-700 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-bold text-base md:text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center space-x-2 md:space-x-3 border-2 border-white/20 w-full md:w-auto"
            >
              <span className="text-xl md:text-2xl">🎁</span>
              <span>Add Birthday</span>
              <span className="text-lg md:text-xl">✨</span>
            </button>
            
            {/* Emergency sync button - uncomment if needed
            <button
              onClick={async () => {
                console.log('🔄 Force syncing with Firebase...');
                localStorage.clear();
                await getBirthdaysOptimized(user.uid, true); // Force sync
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Force Sync (Emergency)
            </button>
            */}
          </div>
          
          {/* Simplified Stats - Only 4 Essential Sections */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
            <div 
              onClick={() => handleStatCardClick('All')}
              className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-2xl border border-pink-200 dark:border-pink-700 p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group min-h-[140px] md:min-h-[180px] flex flex-col justify-center"
            >
              <div className="text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-lg group-hover:shadow-2xl transition-all duration-300">
                  <span className="text-2xl md:text-3xl">🎂</span>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-pink-600 mb-2">
                  {birthdays.length}
                </div>
                <div className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total Birthdays
                </div>
                <div className="text-xs text-pink-500 mt-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                  Tap to view all
                </div>
              </div>
            </div>
            
            <div 
              onClick={() => handleStatCardClick('Today')}
              className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-700 p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group min-h-[140px] md:min-h-[180px] flex flex-col justify-center"
            >
              <div className="text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-lg group-hover:shadow-2xl transition-all duration-300">
                  <span className="text-2xl md:text-3xl">📅</span>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-green-600 mb-2">
                  {countToday}
                </div>
                <div className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                  Today
                </div>
                <div className="text-xs text-green-500 mt-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                  Tap to view today's
                </div>
              </div>
            </div>
            
            <div 
              onClick={() => handleStatCardClick('This Month')}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-700 p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group min-h-[140px] md:min-h-[180px] flex flex-col justify-center"
            >
              <div className="text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-lg group-hover:shadow-2xl transition-all duration-300">
                  <span className="text-2xl md:text-3xl">📈</span>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">
                  {countMonth}
                </div>
                <div className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                  This Month
                </div>
                <div className="text-xs text-blue-500 mt-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                  Tap to view month's
                </div>
              </div>
            </div>
            
            <div 
              onClick={() => handleStatCardClick('This Week')}
              className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-200 dark:border-purple-700 p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group min-h-[140px] md:min-h-[180px] flex flex-col justify-center"
            >
              <div className="text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-lg group-hover:shadow-2xl transition-all duration-300">
                  <span className="text-2xl md:text-3xl">🎁</span>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-2">
                  {countUpcoming}
                </div>
                <div className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                  This Week
                </div>
                <div className="text-xs text-purple-500 mt-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                  Tap to view week's
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Interactive Birthday List Section */}
        <div className="space-y-4 md:space-y-6">
            {/* Header with search - Mobile optimized */}
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  {selectedFilter === 'All' && 'All Birthdays'}
                  {selectedFilter === 'Today' && 'Today\'s Birthdays'}
                  {selectedFilter === 'This Month' && 'This Month\'s Birthdays'}
                  {selectedFilter === 'This Week' && 'This Week\'s Birthdays'}
                </h2>
              </div>
              
              {/* Search bar - Full width on mobile */}
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-pink-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="🔍 Search birthdays by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 md:py-3 border-2 border-pink-200 dark:border-pink-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 text-base"
                />
              </div>
            </div>

            {/* Birthday List or Empty State */}
            {filteredBirthdays.length > 0 ? (
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
            ) : (
              <div className="bg-gradient-to-br from-gray-50 via-pink-50 to-purple-50 dark:from-gray-900/20 dark:via-pink-900/10 dark:to-purple-900/10 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 md:p-16 text-center shadow-lg">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-lg">
                  <span className="text-3xl md:text-4xl">🎂</span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3 md:mb-4">
                  {selectedFilter === 'All' && 'No Birthdays Yet'}
                  {selectedFilter === 'Today' && 'No Birthdays Today'}
                  {selectedFilter === 'This Month' && 'No Birthdays This Month'}
                  {selectedFilter === 'This Week' && 'No Birthdays This Week'}
                </h3>
                <p className="text-sm md:text-lg text-gray-600 dark:text-gray-400 mb-6 md:mb-8 max-w-md mx-auto">
                  {selectedFilter === 'All' && 'Start celebrating by adding your first birthday! 🎉'}
                  {selectedFilter === 'Today' && 'No one has a birthday today, but you can still celebrate! 🎊'}
                  {selectedFilter === 'This Month' && 'This month is quiet, but next month might be exciting! 🌟'}
                  {selectedFilter === 'This Week' && 'This week is calm, but celebrations are coming soon! ✨'}
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2 md:space-x-3 mx-auto text-sm md:text-base"
                >
                  <span className="text-lg md:text-xl">🎁</span>
                  <span>Add Birthday</span>
                  <span className="text-base md:text-lg">✨</span>
                </button>
              </div>
            )}
          </div>

        {/* Add Birthday Modal */}
        <AddBirthdayModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onAdd={handleAddBirthday}
        />
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;