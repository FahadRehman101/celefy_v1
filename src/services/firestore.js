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
  import { validateEnvironment } from '@/config/environment';
  // Validate environment on module load
const envCheck = validateEnvironment();
if (!envCheck.valid) {
  console.error('🔧 Environment configuration required:', envCheck.missing);
}

export const secureOperation = async (operation, fallback = null) => {
  try {
    return await operation();
  } catch (error) {
    console.error('🔒 Secure operation failed:', error);
    
    // Don't expose sensitive error details to user
    if (error.code === 'permission-denied') {
      throw new Error('Access denied. Please check your permissions.');
    }
    
    if (error.code === 'unauthenticated') {
      throw new Error('Authentication required. Please sign in.');
    }
    
    // Generic error for other cases
    throw new Error('Operation failed. Please try again.');
  }
};
  /**
   * Firestore service for birthday management
   * 🔧 CRITICAL FIX: Using subcollection structure: users/{userId}/birthdays
   * This matches the structure used in birthdayService.js
   */
  
  // Collection references
  const BIRTHDAYS_COLLECTION = 'birthdays';
  const USERS_COLLECTION = 'users';
  
  /**
   * Add a new birthday for a user
   * @param {string} userId - User's unique ID
   * @param {Object} birthdayData - Birthday data object
   * @returns {Promise<string>} - Document ID of created birthday
   */
  export const addBirthday = async (userId, birthdayData) => {
    try {
      console.log('🔥 Adding birthday to Firestore:', birthdayData);
      
      // 🔧 CRITICAL FIX: Use subcollection structure to match birthdayService.js
      const birthdaysRef = collection(db, USERS_COLLECTION, userId, BIRTHDAYS_COLLECTION);
      const docData = {
        ...birthdayData,
        userId: userId, // Keep userId field for compatibility
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(birthdaysRef, docData);
      console.log('✅ Birthday added with ID:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Error adding birthday:', error);
      throw new Error(`Failed to add birthday: ${error.message}`);
    }
  };
  
  /**
   * Get all birthdays for a user
   * @param {string} userId - User's unique ID
   * @returns {Promise<Array>} - Array of birthday objects with IDs
   */
  export const getBirthdays = async (userId) => {
    try {
      console.log('🔥 Fetching birthdays from Firestore for user:', userId);
      
      // 🔧 CRITICAL FIX: Use subcollection structure to match birthdayService.js
      const birthdaysRef = collection(db, USERS_COLLECTION, userId, BIRTHDAYS_COLLECTION);
      // No need for userId filter since we're already in the user's subcollection
      const q = query(birthdaysRef);
      
      const querySnapshot = await getDocs(q);
      const birthdays = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        birthdays.push({
          id: doc.id,
          ...data,
          // Convert Firestore timestamps to JavaScript dates
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        });
      });
      
      // Sort in JavaScript instead of Firestore (newest first)
      birthdays.sort((a, b) => {
        const dateA = a.createdAt || new Date(0);
        const dateB = b.createdAt || new Date(0);
        return dateB - dateA;
      });
      
      console.log('✅ Fetched birthdays:', birthdays.length);
      return birthdays;
    } catch (error) {
      console.error('❌ Error fetching birthdays:', error);
      throw new Error(`Failed to fetch birthdays: ${error.message}`);
    }
  };
  
  /**
   * Update an existing birthday
   * @param {string} userId - User's unique ID
   * @param {string} birthdayId - Birthday document ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<void>}
   */
  export const updateBirthday = async (userId, birthdayId, updateData) => {
    try {
      console.log('🔥 Updating birthday:', birthdayId);
      
      // 🔧 CRITICAL FIX: Use subcollection structure to match birthdayService.js
      const birthdayRef = doc(db, USERS_COLLECTION, userId, BIRTHDAYS_COLLECTION, birthdayId);
      const docData = {
        ...updateData,
        userId: userId, // Ensure userId is maintained
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(birthdayRef, docData);
      console.log('✅ Birthday updated successfully');
    } catch (error) {
      console.error('❌ Error updating birthday:', error);
      throw new Error(`Failed to update birthday: ${error.message}`);
    }
  };
  
  /**
   * Delete a birthday
   * @param {string} userId - User's unique ID (for security)
   * @param {string} birthdayId - Birthday document ID
   * @returns {Promise<void>}
   */
  export const deleteBirthday = async (userId, birthdayId) => {
    try {
      console.log('🔥 Deleting birthday:', birthdayId);
      
      // 🔧 CRITICAL FIX: Use subcollection structure to match birthdayService.js
      const birthdayRef = doc(db, USERS_COLLECTION, userId, BIRTHDAYS_COLLECTION, birthdayId);
      await deleteDoc(birthdayRef);
      
      console.log('✅ Birthday deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting birthday:', error);
      throw new Error(`Failed to delete birthday: ${error.message}`);
    }
  };
  
  /**
   * Initialize user document (called on first login)
   * @param {string} userId - User's unique ID
   * @param {Object} userData - User profile data
   * @returns {Promise<void>}
   */
  export const initializeUserProfile = async (userId, userData) => {
    try {
      console.log('🔥 Initializing user profile:', userId);
      
      const userRef = doc(db, USERS_COLLECTION, userId);
      const profileData = {
        ...userData,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      };
      
      await setDoc(userRef, profileData, { merge: true });
      console.log('✅ User profile initialized');
    } catch (error) {
      console.error('❌ Error initializing user profile:', error);
      throw new Error(`Failed to initialize user profile: ${error.message}`);
    }
  };
  
  /**
   * Debug function to check user data
   */
  export const debugUserData = async (userId) => {
    try {
      console.log('🔍 Debugging user data for:', userId);
      
      // 🔧 CRITICAL FIX: Use subcollection structure to match birthdayService.js
      const birthdaysRef = collection(db, USERS_COLLECTION, userId, BIRTHDAYS_COLLECTION);
      const q = query(birthdaysRef);
      const birthdaysSnapshot = await getDocs(q);
      
      console.log('Birthdays collection path:', `users/${userId}/birthdays (subcollection)`);
      console.log('Birthdays found:', birthdaysSnapshot.size);
      
      const birthdays = [];
      birthdaysSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Birthday document:', doc.id, data);
        birthdays.push({ id: doc.id, ...data });
      });
      
      return {
        birthdaysCount: birthdaysSnapshot.size,
        birthdays: birthdays
      };
    } catch (error) {
      console.error('Debug error:', error);
      return { error: error.message };
    }
  };