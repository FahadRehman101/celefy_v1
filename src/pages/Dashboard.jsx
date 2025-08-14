import React, { useState, useEffect } from 'react';
import BirthdayList from '@/components/birthday/BirthdayList';
import OneSignalTester from '@/components/debug/OneSignalTester';
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
import Card from '@/components/ui/Card';
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

  // Debug filtered birthdays
  useEffect(() => {
    console.log('🎂 Dashboard filtered birthdays:', {
      count: filteredBirthdays.length,
      filter: selectedFilter,
      search: searchTerm,
      birthdays: filteredBirthdays.map(b => ({ id: b.id, name: b.name, date: b.date }))
    });
  }, [filteredBirthdays, selectedFilter, searchTerm]);

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
  <OneSignalTester />

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
      case 'Upcoming':
        return daysUntil <= 7 && nameMatch;
      default:
        return nameMatch;
    }
  });

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
        <Card variant="gradient" padding="lg">
          <div className="flex items-center justify-center text-white py-8">
            <Loader2 className="w-8 h-8 animate-spin mr-3" />
            <span className="text-xl">Loading your birthdays...</span>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-8">
        <Card variant="gradient" padding="lg">
          <div className="text-center text-white">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-300" />
            <h1 className="text-2xl font-bold mb-2">Oops! Something went wrong</h1>
            <p className="text-blue-100 mb-4">{error}</p>
            <button
              onClick={() => loadBirthdaysOptimized()}
              className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-lg transition-colors flex items-center mx-auto"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        {/* Welcome Header with Status Indicators */}
        <Card variant="gradient" padding="lg">
          <div className="flex items-start justify-between text-white">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.displayName?.split(' ')[0] || 'Friend'}! 🎉
              </h1>
              <p className="text-blue-100 text-lg mb-4">
                {birthdays.length === 0 
                  ? "Ready to add your first birthday?" 
                  : `You're tracking ${birthdays.length} birthdays`}
              </p>
              
              {/* Status indicators */}
              <div className="flex items-center space-x-4 mb-4">
                {/* Network Status */}
                <div className="flex items-center space-x-2">
                  {isOnline ? (
                    <Wifi className="w-4 h-4 text-green-300" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-300" />
                  )}
                  <span className="text-sm text-blue-100">
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                {/* Sync Status */}
                <div className="flex items-center space-x-2">
                  <SyncIcon className={`w-4 h-4 ${syncInfo.color} ${syncInfo.spin ? 'animate-spin' : ''}`} />
                  <span className="text-sm text-blue-100">{syncInfo.text}</span>
                </div>

                {/* Data Source */}
                <div className="text-sm text-blue-200">
                  Data: {dataSource === 'cache' ? '⚡ Cached' : '☁️ Live'}
                </div>

                {/* Pending Changes */}
                {pendingChanges > 0 && (
                  <div className="text-sm text-yellow-200">
                    {pendingChanges} pending change{pendingChanges !== 1 ? 's' : ''}
                  </div>
                )}
                
                {/* CRITICAL DEBUG: Manual cache check button */}
                <button
                  onClick={() => {
                    if (user?.uid) {
                      try {
                        const cached = getCachedBirthdays(user.uid);
                        console.log('🔍 MANUAL CACHE CHECK:', {
                          count: cached.data.length,
                          data: cached.data.map(b => ({ id: b.id, name: b.name, date: b.date }))
                        });
                        alert(`Cache has ${cached.data.length} birthdays. Check console for details.`);
                      } catch (error) {
                        console.error('❌ Manual cache check failed:', error);
                        alert('Cache check failed. Check console for details.');
                      }
                    }
                  }}
                  className="text-sm text-blue-200 hover:text-blue-100 bg-blue-500/20 px-2 py-1 rounded"
                >
                  🔍 Check Cache
                </button>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors flex items-center disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Syncing...' : 'Refresh'}
                </button>

                {/* Sync Pending Changes Button */}
                {pendingChanges > 0 && isOnline && (
                  <button
                    onClick={handleSyncPendingChanges}
                    disabled={syncStatus === 'syncing'}
                    className="bg-yellow-500/20 hover:bg-yellow-500/30 px-4 py-2 rounded-lg transition-colors flex items-center disabled:opacity-50"
                  >
                    <Cloud className={`w-4 h-4 mr-2 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                    Sync Changes
                  </button>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <Gift className="w-16 h-16 mb-2 opacity-80" />
              <div className="text-sm text-blue-100">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-blue-500" />
            <div className="text-2xl font-bold text-gray-800">{countToday}</div>
            <div className="text-gray-600">Today</div>
          </Card>
          
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <div className="text-2xl font-bold text-gray-800">{countMonth}</div>
            <div className="text-gray-600">This Month</div>
          </Card>
          
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <Gift className="w-12 h-12 mx-auto mb-3 text-purple-500" />
            <div className="text-2xl font-bold text-gray-800">{countUpcoming}</div>
            <div className="text-gray-600">Coming Soon</div>
          </Card>
        </div>

        {/* Search and Filter Section */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search birthdays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-2">
              {['All', 'Today', 'This Month', 'Upcoming'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedFilter === filter
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all flex items-center"
            >
              <Gift className="w-4 h-4 mr-2" />
              Add Birthday
            </button>
          </div>
        </Card>

        {/* Birthday List */}
        <BirthdayList 
          birthdays={filteredBirthdays}
          onRefresh={handleRefresh}
          loading={refreshing}
          userId={user?.uid}
          onDataChange={() => {
            checkPendingChanges();
            // Small delay to let cache update
            setTimeout(() => loadBirthdaysOptimized(), 100);
          }}
        />

        {/* Add Birthday Modal */}
        <AddBirthdayModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onAdd={handleAddBirthday}
         
        />




{/* 🔧 ADD: OneSignal Debug Tester - Remove this in production */}
{process.env.NODE_ENV === 'development' && (
  <div className="mt-8">
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">🔧 OneSignal Debug Tester</h3>
      <OneSignalTester />
    </Card>
  </div>
)}

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