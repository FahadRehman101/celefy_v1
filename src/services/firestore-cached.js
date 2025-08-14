import { 
    collection, 
    doc, 
    addDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    setDoc,
    query, 
    where, 
    serverTimestamp
  } from 'firebase/firestore';
  import { db } from '@/config/firebase';
  import { 
  getCachedBirthdays, 
  cacheBirthdays, 
  updateLastSyncTime, 
  isOnline, 
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
  cacheUserProfile
} from './localStorage';
  
  /**
   * Enhanced Firestore service with localStorage caching
   * FIXED VERSION - Better data flow and sync handling
   */
  
  // Collection references
  const BIRTHDAYS_COLLECTION = 'birthdays';
  const USERS_COLLECTION = 'users';
  
  /**
   * Get birthdays with improved caching strategy
   */
  export const getBirthdaysOptimized = async (userId, forceSync = false) => {
    console.log('🚀 getBirthdaysOptimized called:', { userId, forceSync });
  
    
  
    // Emergency check for stuck items
    if (forceSync) {
      console.log('🚨 Force sync requested - clearing all cache');
      localStorage.removeItem(`birthdays_${userId}`);
      localStorage.removeItem(`sync_time_${userId}`);
    }
  
    try {
      // Step 1: Get cached data for instant loading
      const cached = getCachedBirthdays(userId);
      
      // Step 2: If we have cached data and no force sync, return it immediately
      if (!forceSync && cached.data.length > 0 && !cached.isStale) {
        console.log('✅ Returning fresh cached data:', cached.data.length, 'birthdays');
        return {
          data: cached.data,
          fromCache: true,
          syncing: false
        };
      }
  
      // Step 3: If no cached data or stale/force sync, fetch from server
      console.log('🔄 Fetching from server...');
      const serverData = await getBirthdaysFromServer(userId);
      
      // Step 4: Update cache with server data
      cacheBirthdays(userId, serverData);
      updateLastSyncTime(userId);
      
      console.log('✅ Server data fetched and cached:', serverData.length, 'birthdays');
      
      return {
        data: serverData,
        fromCache: false,
        synced: true
      };
  
    } catch (error) {
      console.error('❌ getBirthdaysOptimized failed:', error);
      
      // Fallback to cached data if available
      const cached = getCachedBirthdays(userId);
      if (cached.data.length > 0) {
        console.log('📱 Fallback to cached data due to error');
        return {
          data: cached.data,
          fromCache: true,
          syncError: error.message
        };
      }
      
      throw error;
    }
  };
  
  /**
   * Get birthdays directly from server (internal function)
   */
  const getBirthdaysFromServer = async (userId) => {
    console.log('🔥 Fetching birthdays from Firestore for user:', userId);
    
    const birthdaysRef = collection(db, BIRTHDAYS_COLLECTION);
    const q = query(
      birthdaysRef, 
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const birthdays = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      birthdays.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      });
    });
    
    // Sort in JavaScript (newest first)
    birthdays.sort((a, b) => {
      const dateA = a.createdAt || new Date(0);
      const dateB = b.createdAt || new Date(0);
      return dateB - dateA;
    });
    
    console.log('📊 Server returned:', birthdays.length, 'birthdays');
    return birthdays;
  };
  
  /**
   * Add birthday with FIXED optimistic updates
   */
  export const addBirthdayOptimized = async (userId, birthdayData) => {
    console.log('💾 Adding birthday (optimized):', { userId, birthdayData });
  
    // Generate optimistic data
    const optimisticId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const optimisticBirthday = {
      id: optimisticId,
      ...birthdayData,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('🎂 Generated optimistic birthday:', optimisticBirthday);
  
    // IMMEDIATELY update cache for instant UI feedback
    const cached = getCachedBirthdays(userId);
    console.log('📱 Current cache:', { count: cached.data.length, data: cached.data });
    
    const updatedCache = [optimisticBirthday, ...cached.data];
    cacheBirthdays(userId, updatedCache);
    
    console.log('📱 Updated cache with optimistic birthday:', { 
      newCount: updatedCache.length, 
      optimisticId: optimisticBirthday.id 
    });
  
    // Try to sync to server
    if (isOnline()) {
      try {
        const docData = {
          ...birthdayData,
          userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const birthdaysRef = collection(db, BIRTHDAYS_COLLECTION);
        const docRef = await addDoc(birthdaysRef, docData);
        
        console.log('✅ Birthday added to Firestore:', docRef.id);
        
        // Replace optimistic entry with real one in cache
        const realBirthday = {
          ...optimisticBirthday,
          id: docRef.id
        };
        
        const finalCache = updatedCache.map(b => 
          b.id === optimisticId ? realBirthday : b
        );
        
        cacheBirthdays(userId, finalCache);
        updateLastSyncTime(userId);
        
        console.log('📱 Cache updated with real birthday ID:', { 
          finalCount: finalCache.length, 
          realId: docRef.id 
        });
        
        return docRef.id;
        
      } catch (error) {
        console.error('❌ Failed to add to server, keeping in cache:', error);
        
        // Add to sync queue for later
        addToSyncQueue(userId, {
          type: 'ADD_BIRTHDAY',
          data: birthdayData,
          optimisticId
        });
        
        // Don't throw error - cached data is still valid
        return optimisticId;
      }
    } else {
      // Offline: Add to sync queue
      console.log('📴 Offline: Adding to sync queue');
      
      addToSyncQueue(userId, {
        type: 'ADD_BIRTHDAY',
        data: birthdayData,
        optimisticId
      });
      
      return optimisticId;
    }
  };
  
  /**
   * Update birthday with FIXED optimistic updates
   */
  export const updateBirthdayOptimized = async (userId, birthdayId, updateData) => {
    console.log('✏️ Updating birthday (optimized):', birthdayId);
  
    // IMMEDIATELY update cache
    const cached = localStorage.getCachedBirthdays(userId);
    const updatedCache = cached.data.map(birthday => 
      birthday.id === birthdayId 
        ? { ...birthday, ...updateData, updatedAt: new Date() }
        : birthday
    );
    
    cacheBirthdays(userId, updatedCache);
    console.log('📱 Updated cache immediately');
  
    // Try to sync to server
    if (isOnline()) {
      try {
        const birthdayRef = doc(db, BIRTHDAYS_COLLECTION, birthdayId);
        const docData = {
          ...updateData,
          userId,
          updatedAt: serverTimestamp()
        };
        
        await updateDoc(birthdayRef, docData);
        console.log('✅ Birthday updated in Firestore');
        updateLastSyncTime(userId);
        
      } catch (error) {
        console.error('❌ Failed to update on server, keeping cached version:', error);
        
        addToSyncQueue(userId, {
          type: 'UPDATE_BIRTHDAY',
          birthdayId,
          data: updateData
        });
      }
    } else {
      console.log('📴 Offline: Adding update to sync queue');
      
      addToSyncQueue(userId, {
        type: 'UPDATE_BIRTHDAY',
        birthdayId,
        data: updateData
      });
    }
  };
  
  /**
   * Delete birthday with FIXED optimistic updates
   */
  export const deleteBirthdayOptimized = async (userId, birthdayId) => {
    console.log('🗑️ Deleting birthday (optimized):', birthdayId);
  
    // Store original for potential rollback
    const cached = getCachedBirthdays(userId);
    const originalData = cached.data;
    
    // IMMEDIATELY remove from cache
    const updatedCache = cached.data.filter(birthday => birthday.id !== birthdayId);
    cacheBirthdays(userId, updatedCache);
    console.log('📱 Removed from cache immediately');
  
    // Try to sync to server
    if (isOnline()) {
      try {
        const birthdayRef = doc(db, BIRTHDAYS_COLLECTION, birthdayId);
        await deleteDoc(birthdayRef);
        
        console.log('✅ Birthday deleted from Firestore');
        updateLastSyncTime(userId);
        
      } catch (error) {
        console.error('❌ Failed to delete from server, rolling back cache:', error);
        
        // Rollback cache
        cacheBirthdays(userId, originalData);
        
        addToSyncQueue(userId, {
          type: 'DELETE_BIRTHDAY',
          birthdayId
        });
        
        console.error('Delete failed, forcing cache clear');
        localStorage.removeItem(`birthdays_${userId}`);
        
        throw error; // Let UI know deletion failed
      }
    } else {
      console.log('📴 Offline: Adding deletion to sync queue');
      
      addToSyncQueue(userId, {
        type: 'DELETE_BIRTHDAY',
        birthdayId
      });
    }
  };
  
  /**
   * Sync pending changes when back online
   */
  export const syncPendingChanges = async (userId) => {
      if (!isOnline()) {
    console.log('📴 Still offline, skipping sync');
    return { success: false, reason: 'offline' };
  }

  const queue = getSyncQueue(userId);
    
    if (queue.length === 0) {
      console.log('📤 No pending changes to sync');
      return { success: true, synced: 0 };
    }
  
    console.log(`📤 Syncing ${queue.length} pending changes...`);
    
    let synced = 0;
    let failed = 0;
  
    for (const item of queue) {
      try {
        const { operation } = item;
        
        switch (operation.type) {
          case 'ADD_BIRTHDAY':
            const docRef = await addDoc(collection(db, BIRTHDAYS_COLLECTION), {
              ...operation.data,
              userId,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            
            // Update cached data with real ID
            const cached = getCachedBirthdays(userId);
            const updatedCache = cached.data.map(b => 
              b.id === operation.optimisticId 
                ? { ...b, id: docRef.id }
                : b
            );
            cacheBirthdays(userId, updatedCache);
            
            break;
            
          case 'UPDATE_BIRTHDAY':
            await updateDoc(doc(db, BIRTHDAYS_COLLECTION, operation.birthdayId), {
              ...operation.data,
              userId,
              updatedAt: serverTimestamp()
            });
            break;
            
          case 'DELETE_BIRTHDAY':
            await deleteDoc(doc(db, BIRTHDAYS_COLLECTION, operation.birthdayId));
            break;
            
          default:
            console.warn('Unknown operation type:', operation.type);
            continue;
        }
        
        removeFromSyncQueue(userId, item.id);
        synced++;
        
        console.log(`✅ Synced ${operation.type}`);
        
      } catch (error) {
        console.error(`❌ Failed to sync ${item.operation.type}:`, error);
        failed++;
      }
    }
  
    if (synced > 0) {
      updateLastSyncTime(userId);
    }
  
    return { 
      success: failed === 0, 
      synced, 
      failed,
      remaining: queue.length - synced
    };
  };
  
  /**
   * Initialize user profile with caching
   */
  export const initializeUserProfileOptimized = async (userId, userData) => {
    console.log('🔥 Initializing user profile (optimized):', userId);
    
    cacheUserProfile(userId, userData);
    
    if (isOnline()) {
      try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        const profileData = {
          ...userData,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        };
        
        await setDoc(userRef, profileData, { merge: true });
        console.log('✅ User profile synced to Firestore');
        
      } catch (error) {
        console.error('❌ Failed to sync user profile:', error);
      }
    }
  };
  
  // Export functions
  export { 
    getBirthdaysFromServer as getBirthdays,
    addBirthdayOptimized as addBirthday,
    updateBirthdayOptimized as updateBirthday,
    deleteBirthdayOptimized as deleteBirthday,
    initializeUserProfileOptimized as initializeUserProfile
  };