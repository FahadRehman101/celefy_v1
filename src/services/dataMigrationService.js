import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  getDocs,
  writeBatch,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { getCachedBirthdays } from '@/services/localStorage';
import userProfileService from './userProfileService';
import birthdayService from './birthdayService';

// Collection names
const USERS_COLLECTION = 'users';
const BIRTHDAYS_COLLECTION = 'birthdays';
const LEGACY_BIRTHDAYS_COLLECTION = 'birthdays'; // Old collection

/**
 * Data Migration Service - Handles migrating data from old structure to new Firestore structure
 * This ensures no data loss and smooth transition for existing users
 */

/**
 * Check if user needs data migration
 * @param {string} userId - Firebase Auth UID
 * @returns {Promise<Object>} - Migration status
 */
export const checkMigrationStatus = async (userId) => {
  try {
    console.log('🔄 Checking migration status for user:', userId);
    
    // Check if user has new profile structure
    const profileExists = await userProfileService.profileExists(userId);
    
    // Check if user has birthdays in new structure
    const newBirthdays = await birthdayService.getUserBirthdays(userId);
    const hasNewBirthdays = newBirthdays.success && newBirthdays.count > 0;
    
    // Check if user has birthdays in old structure
    const oldBirthdays = await getLegacyBirthdays(userId);
    const hasOldBirthdays = oldBirthdays.success && oldBirthdays.count > 0;
    
    // Check local cache
    const cachedBirthdays = getCachedBirthdays(userId);
    const hasCachedBirthdays = cachedBirthdays && cachedBirthdays.length > 0;
    
    const migrationStatus = {
      needsMigration: false,
      hasProfile: profileExists,
      hasNewBirthdays: hasNewBirthdays,
      hasOldBirthdays: hasOldBirthdays,
      hasCachedBirthdays: hasCachedBirthdays,
      migrationSteps: []
    };
    
    // Determine what needs to be migrated
    if (!profileExists) {
      migrationStatus.needsMigration = true;
      migrationStatus.migrationSteps.push('profile');
    }
    
    if (!hasNewBirthdays && (hasOldBirthdays || hasCachedBirthdays)) {
      migrationStatus.needsMigration = true;
      migrationStatus.migrationSteps.push('birthdays');
    }
    
    console.log('✅ Migration status checked:', migrationStatus);
    return migrationStatus;
    
  } catch (error) {
    console.error('❌ Failed to check migration status:', error);
    return {
      needsMigration: false,
      error: error.message
    };
  }
};

/**
 * Perform complete data migration for a user
 * @param {string} userId - Firebase Auth UID
 * @param {Object} userData - Basic user data from auth
 * @returns {Promise<Object>} - Migration result
 */
export const performMigration = async (userId, userData) => {
  try {
    console.log('🚀 Starting data migration for user:', userId);
    
    const migrationStatus = await checkMigrationStatus(userId);
    if (!migrationStatus.needsMigration) {
      return {
        success: true,
        message: 'No migration needed',
        migratedData: {}
      };
    }
    
    const migratedData = {};
    
    // Migrate profile if needed
    if (migrationStatus.migrationSteps.includes('profile')) {
      console.log('👤 Migrating user profile...');
      const profileResult = await userProfileService.createUserProfile(userId, userData);
      migratedData.profile = profileResult;
    }
    
    // Migrate birthdays if needed
    if (migrationStatus.migrationSteps.includes('birthdays')) {
      console.log('🎂 Migrating birthdays...');
      const birthdayResult = await migrateBirthdaysToSubcollections(userId);
      migratedData.birthdays = birthdayResult;
    }
    
    console.log('✅ Data migration completed successfully');
    return {
      success: true,
      message: 'Migration completed successfully',
      migratedData
    };
    
  } catch (error) {
    console.error('❌ Data migration failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get birthdays from legacy collection structure
 * @param {string} userId - Firebase Auth UID
 * @returns {Promise<Object>} - Legacy birthdays data
 */
export const getLegacyBirthdays = async (userId) => {
  try {
    console.log('📚 Getting birthdays from legacy collection for user:', userId);
    
    const legacyRef = collection(db, LEGACY_BIRTHDAYS_COLLECTION);
    const legacyQuery = query(legacyRef, where('userId', '==', userId));
    const legacySnapshot = await getDocs(legacyQuery);
    
    const birthdays = legacySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`✅ Found ${birthdays.length} birthdays in legacy collection`);
    return {
      success: true,
      count: birthdays.length,
      data: birthdays
    };
    
  } catch (error) {
    console.error('❌ Failed to get legacy birthdays:', error);
    return {
      success: false,
      error: error.message,
      count: 0,
      data: []
    };
  }
};

/**
 * 🔧 CRITICAL FIX: Migrate birthdays from legacy collection to new subcollection structure
 * This ensures all existing birthdays are moved to the correct location
 */
export const migrateBirthdaysToSubcollections = async (userId) => {
  try {
    console.log('🔄 Starting birthday migration to subcollections for user:', userId);
    
    // Step 1: Check if user already has birthdays in subcollection
    const subcollectionRef = collection(db, USERS_COLLECTION, userId, BIRTHDAYS_COLLECTION);
    const subcollectionSnapshot = await getDocs(subcollectionRef);
    
    if (subcollectionSnapshot.size > 0) {
      console.log(`✅ User already has ${subcollectionSnapshot.size} birthdays in subcollection`);
      return {
        success: true,
        message: 'Birthdays already migrated',
        existingCount: subcollectionSnapshot.size
      };
    }
    
    // Step 2: Get birthdays from legacy collection
    const legacyRef = collection(db, LEGACY_BIRTHDAYS_COLLECTION);
    const legacyQuery = query(legacyRef, where('userId', '==', userId));
    const legacySnapshot = await getDocs(legacyQuery);
    
    if (legacySnapshot.size === 0) {
      console.log('ℹ️ No birthdays found in legacy collection');
      return {
        success: true,
        message: 'No birthdays to migrate',
        migratedCount: 0
      };
    }
    
    console.log(`📦 Found ${legacySnapshot.size} birthdays in legacy collection`);
    
    // Step 3: Migrate each birthday to subcollection
    const batch = writeBatch(db);
    let migratedCount = 0;
    let failedCount = 0;
    
    for (const legacyDoc of legacySnapshot.docs) {
      try {
        const legacyData = legacyDoc.data();
        
        // Create new document in subcollection
        const newBirthdayRef = doc(db, USERS_COLLECTION, userId, BIRTHDAYS_COLLECTION, legacyDoc.id);
        
        // Prepare data for new location
        const newBirthdayData = {
          ...legacyData,
          // Ensure timestamps are properly handled
          createdAt: legacyData.createdAt || serverTimestamp(),
          updatedAt: legacyData.updatedAt || serverTimestamp(),
          // Mark as migrated
          _migrated: true,
          _migratedAt: serverTimestamp(),
          _originalCollection: LEGACY_BIRTHDAYS_COLLECTION
        };
        
        batch.set(newBirthdayRef, newBirthdayData);
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Failed to migrate birthday ${legacyDoc.id}:`, error);
        failedCount++;
      }
    }
    
    // Step 4: Commit the batch
    if (migratedCount > 0) {
      await batch.commit();
      console.log(`✅ Successfully migrated ${migratedCount} birthdays to subcollection`);
    }
    
    return {
      success: true,
      message: `Migration completed: ${migratedCount} migrated, ${failedCount} failed`,
      migratedCount,
      failedCount,
      totalLegacy: legacySnapshot.size
    };
    
  } catch (error) {
    console.error('❌ Birthday migration failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 🔧 CRITICAL FIX: Clean up legacy birthdays collection after successful migration
 * Only call this after confirming all users have been migrated
 */
export const cleanupLegacyBirthdaysCollection = async () => {
  try {
    console.log('🧹 Starting cleanup of legacy birthdays collection...');
    
    // Get all documents from legacy collection
    const legacyRef = collection(db, LEGACY_BIRTHDAYS_COLLECTION);
    const legacySnapshot = await getDocs(legacyRef);
    
    if (legacySnapshot.size === 0) {
      console.log('ℹ️ Legacy collection is already empty');
      return {
        success: true,
        message: 'Legacy collection already empty',
        deletedCount: 0
      };
    }
    
    console.log(`📦 Found ${legacySnapshot.size} documents in legacy collection`);
    
    // Delete all documents in batches
    const batchSize = 500; // Firestore batch limit
    let deletedCount = 0;
    
    for (let i = 0; i < legacySnapshot.docs.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchDocs = legacySnapshot.docs.slice(i, i + batchSize);
      
      batchDocs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      deletedCount += batchDocs.length;
      
      console.log(`✅ Deleted batch ${Math.floor(i / batchSize) + 1}: ${batchDocs.length} documents`);
    }
    
    console.log(`✅ Legacy collection cleanup completed: ${deletedCount} documents deleted`);
    
    return {
      success: true,
      message: `Cleanup completed: ${deletedCount} documents deleted`,
      deletedCount
    };
    
  } catch (error) {
    console.error('❌ Legacy collection cleanup failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
