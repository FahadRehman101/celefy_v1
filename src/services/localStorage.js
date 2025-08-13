/**
 * localStorage Manager for Celefy
 * Handles client-side data caching with smart sync
 */

const STORAGE_PREFIX = 'celefy_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const SYNC_THRESHOLD = 5 * 60 * 1000; // 5 minutes

// Storage keys
const STORAGE_KEYS = {
  BIRTHDAYS: `${STORAGE_PREFIX}birthdays`,
  USER_PROFILE: `${STORAGE_PREFIX}user_profile`,
  LAST_SYNC: `${STORAGE_PREFIX}last_sync`,
  PENDING_CHANGES: `${STORAGE_PREFIX}pending_changes`,
  APP_SETTINGS: `${STORAGE_PREFIX}settings`,
  SYNC_QUEUE: `${STORAGE_PREFIX}sync_queue`
};

/**
 * Check if localStorage is available
 */
const isLocalStorageAvailable = () => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    console.warn('localStorage not available:', e);
    return false;
  }
};

/**
 * Safe localStorage operations with error handling
 */
const safeStorage = {
  get: (key) => {
    if (!isLocalStorageAvailable()) return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },

  set: (key, value) => {
    if (!isLocalStorageAvailable()) return false;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      // Handle quota exceeded
      if (error.name === 'QuotaExceededError') {
        clearOldCache();
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch (retryError) {
          console.error('Still failed after clearing cache:', retryError);
          return false;
        }
      }
      return false;
    }
  },

  remove: (key) => {
    if (!isLocalStorageAvailable()) return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  },

  clear: () => {
    if (!isLocalStorageAvailable()) return false;
    try {
      // Only clear Celefy-specific items
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
};

/**
 * Clear old cache data to free up space
 */
const clearOldCache = () => {
  console.log('🧹 Clearing old cache data...');
  const keysToCheck = Object.values(STORAGE_KEYS);
  
  keysToCheck.forEach(key => {
    const data = safeStorage.get(key);
    if (data && data.timestamp) {
      const age = Date.now() - data.timestamp;
      if (age > CACHE_DURATION * 2) { // Remove data older than 48 hours
        safeStorage.remove(key);
        console.log(`Removed old cache: ${key}`);
      }
    }
  });
};

/**
 * Get cached birthdays for a user
 */
export const getCachedBirthdays = (userId) => {
  const cached = safeStorage.get(STORAGE_KEYS.BIRTHDAYS);
  
  if (!cached || !cached[userId]) {
    console.log('📱 No cached birthdays found for user:', userId);
    return { data: [], timestamp: null, isStale: true };
  }

  const userCache = cached[userId];
  const age = Date.now() - userCache.timestamp;
  const isStale = age > CACHE_DURATION;

  console.log(`📱 Found cached birthdays for user ${userId}:`, {
    count: userCache.data.length,
    age: Math.round(age / (1000 * 60)), // minutes
    isStale
  });

  return {
    data: userCache.data || [],
    timestamp: userCache.timestamp,
    isStale
  };
};

/**
 * Cache birthdays for a user
 */
export const cacheBirthdays = (userId, birthdays) => {
  const existingCache = safeStorage.get(STORAGE_KEYS.BIRTHDAYS) || {};
  
  existingCache[userId] = {
    data: birthdays,
    timestamp: Date.now()
  };

  const success = safeStorage.set(STORAGE_KEYS.BIRTHDAYS, existingCache);
  
  if (success) {
    console.log(`📱 Cached ${birthdays.length} birthdays for user:`, userId);
  } else {
    console.error('📱 Failed to cache birthdays');
  }

  return success;
};

/**
 * Check if we need to sync with server
 */
export const shouldSync = (userId) => {
  const lastSync = getLastSyncTime(userId);
  const timeSinceSync = Date.now() - lastSync;
  
  const needsSync = timeSinceSync > SYNC_THRESHOLD;
  
  console.log(`🔄 Sync check for user ${userId}:`, {
    lastSync: new Date(lastSync).toLocaleTimeString(),
    timeSinceSync: Math.round(timeSinceSync / (1000 * 60)), // minutes
    needsSync
  });

  return needsSync;
};

/**
 * Update last sync time
 */
export const updateLastSyncTime = (userId) => {
  const syncData = safeStorage.get(STORAGE_KEYS.LAST_SYNC) || {};
  syncData[userId] = Date.now();
  
  safeStorage.set(STORAGE_KEYS.LAST_SYNC, syncData);
  console.log(`🔄 Updated sync time for user:`, userId);
};

/**
 * Get last sync time for user
 */
export const getLastSyncTime = (userId) => {
  const syncData = safeStorage.get(STORAGE_KEYS.LAST_SYNC) || {};
  return syncData[userId] || 0;
};

/**
 * Add item to sync queue (for offline changes)
 */
export const addToSyncQueue = (userId, operation) => {
  const queue = getSyncQueue(userId);
  
  const queueItem = {
    id: `${operation.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    operation,
    timestamp: Date.now(),
    retries: 0
  };

  queue.push(queueItem);
  
  const allQueues = safeStorage.get(STORAGE_KEYS.SYNC_QUEUE) || {};
  allQueues[userId] = queue;
  
  safeStorage.set(STORAGE_KEYS.SYNC_QUEUE, allQueues);
  
  console.log('📤 Added to sync queue:', queueItem);
  return queueItem.id;
};

/**
 * Get sync queue for user
 */
export const getSyncQueue = (userId) => {
  const allQueues = safeStorage.get(STORAGE_KEYS.SYNC_QUEUE) || {};
  return allQueues[userId] || [];
};

/**
 * Remove item from sync queue
 */
export const removeFromSyncQueue = (userId, itemId) => {
  const allQueues = safeStorage.get(STORAGE_KEYS.SYNC_QUEUE) || {};
  const userQueue = allQueues[userId] || [];
  
  allQueues[userId] = userQueue.filter(item => item.id !== itemId);
  
  safeStorage.set(STORAGE_KEYS.SYNC_QUEUE, allQueues);
  console.log('📤 Removed from sync queue:', itemId);
};

/**
 * Clear sync queue for user
 */
export const clearSyncQueue = (userId) => {
  const allQueues = safeStorage.get(STORAGE_KEYS.SYNC_QUEUE) || {};
  delete allQueues[userId];
  
  safeStorage.set(STORAGE_KEYS.SYNC_QUEUE, allQueues);
  console.log('📤 Cleared sync queue for user:', userId);
};

/**
 * Cache user profile
 */
export const cacheUserProfile = (userId, profileData) => {
  const profiles = safeStorage.get(STORAGE_KEYS.USER_PROFILE) || {};
  
  profiles[userId] = {
    ...profileData,
    timestamp: Date.now()
  };

  return safeStorage.set(STORAGE_KEYS.USER_PROFILE, profiles);
};

/**
 * Get cached user profile
 */
export const getCachedUserProfile = (userId) => {
  const profiles = safeStorage.get(STORAGE_KEYS.USER_PROFILE) || {};
  return profiles[userId] || null;
};

/**
 * Get storage usage info
 */
export const getStorageInfo = () => {
  if (!isLocalStorageAvailable()) {
    return { available: false };
  }

  try {
    let totalSize = 0;
    const breakdown = {};

    Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
      const data = localStorage.getItem(storageKey);
      const size = data ? data.length : 0;
      breakdown[key] = size;
      totalSize += size;
    });

    return {
      available: true,
      totalSize,
      breakdown,
      quota: 5 * 1024 * 1024, // Approximate 5MB limit
      usagePercent: (totalSize / (5 * 1024 * 1024)) * 100
    };
  } catch (error) {
    return { available: false, error: error.message };
  }
};

/**
 * Export all data (for backup)
 */
export const exportAllData = () => {
  const data = {};
  
  Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
    data[key] = safeStorage.get(storageKey);
  });

  return {
    exportDate: new Date().toISOString(),
    version: '1.0.0',
    data
  };
};

/**
 * Import data (for restore)
 */
export const importData = (importedData) => {
  try {
    Object.entries(importedData.data).forEach(([key, value]) => {
      const storageKey = STORAGE_KEYS[key];
      if (storageKey && value) {
        safeStorage.set(storageKey, value);
      }
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Network status detection
export const isOnline = () => {
  return navigator.onLine !== false; // Default to true if undefined
};

// Listen for online/offline events
export const setupNetworkListeners = (onOnline, onOffline) => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};

export default {
  getCachedBirthdays,
  cacheBirthdays,
  shouldSync,
  updateLastSyncTime,
  getLastSyncTime,
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
  clearSyncQueue,
  cacheUserProfile,
  getCachedUserProfile,
  getStorageInfo,
  exportAllData,
  importData,
  isOnline,
  setupNetworkListeners,
  clear: safeStorage.clear
};