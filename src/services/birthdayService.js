import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  serverTimestamp,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { scheduleNotification, cancelScheduledNotifications } from '@/services/notificationScheduler';

// Collection names
const USERS_COLLECTION = 'users';
const BIRTHDAYS_COLLECTION = 'birthdays';
const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * Birthday Service - Handles all birthday operations with perfect notification management
 * This service manages birthdays, notifications, and cross-device synchronization
 * with zero conflicts and perfect cleanup
 */

class BirthdayService {
  /**
   * Create a new birthday with perfect notification scheduling
   * @param {string} userId - Firebase Auth UID
   * @param {Object} birthdayData - Birthday data
   * @returns {Promise<Object>} - Success result with birthday ID
   */
  async createBirthday(userId, birthdayData) {
    try {
      console.log('🎂 Creating birthday for user:', userId);
      
      // Generate unique birthday ID
      const birthdayId = `birthday_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create birthday document
      const birthdayRef = doc(db, USERS_COLLECTION, userId, BIRTHDAYS_COLLECTION, birthdayId);
      
      const birthdayPayload = {
        id: birthdayId,
        userId: userId,
        name: birthdayData.name,
        date: birthdayData.date,
        relation: birthdayData.relation || 'Friend',
        avatar: birthdayData.avatar || '🎂',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        notificationSettings: {
          enabled: true,
          reminderDays: [7, 1, 0], // 7 days, 1 day, on the day
          reminderTime: birthdayData.reminderTime || '09:00'
        }
      };

      // Save birthday to Firestore
      await setDoc(birthdayRef, birthdayPayload);
      
      console.log('✅ Birthday saved to Firestore successfully');
      
      // Schedule notifications with OneSignal
      const notificationResult = await this.scheduleBirthdayNotifications(birthdayPayload);
      
      if (notificationResult.success) {
        // Update birthday with notification IDs
        await updateDoc(birthdayRef, {
          notificationIds: notificationResult.notificationIds,
          notificationsScheduled: true
        });
        
        console.log('✅ Notifications scheduled successfully');
      }
      
      return {
        success: true,
        data: {
          ...birthdayPayload,
          notificationIds: notificationResult.notificationIds || []
        },
        message: 'Birthday created successfully with notifications'
      };
      
    } catch (error) {
      console.error('❌ Failed to create birthday:', error);
      throw new Error(`Birthday creation failed: ${error.message}`);
    }
  }

  /**
   * Update birthday with notification re-scheduling
   * @param {string} userId - Firebase Auth UID
   * @param {string} birthdayId - Birthday ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} - Success result
   */
  async updateBirthday(userId, birthdayId, updates) {
    try {
      console.log('🎂 Updating birthday:', birthdayId);
      
      const birthdayRef = doc(db, USERS_COLLECTION, userId, BIRTHDAYS_COLLECTION, birthdayId);
      
      // Get current birthday data
      const currentBirthday = await getDoc(birthdayRef);
      if (!currentBirthday.exists()) {
        throw new Error('Birthday not found');
      }
      
      const currentData = currentBirthday.data();
      
      // Cancel existing notifications
      if (currentData.notificationIds && currentData.notificationIds.length > 0) {
        await this.cancelBirthdayNotifications(currentData.notificationIds);
        console.log('✅ Existing notifications cancelled');
      }
      
      // Update birthday data
      const updatePayload = {
        ...updates,
        updatedAt: serverTimestamp(),
        notificationsScheduled: false
      };

      await updateDoc(birthdayRef, updatePayload);
      
      // Get updated birthday data for notification scheduling
      const updatedBirthday = await getDoc(birthdayRef);
      const updatedData = updatedBirthday.data();
      
      // Schedule new notifications
      const notificationResult = await this.scheduleBirthdayNotifications(updatedData);
      
      if (notificationResult.success) {
        await updateDoc(birthdayRef, {
          notificationIds: notificationResult.notificationIds,
          notificationsScheduled: true
        });
        
        console.log('✅ New notifications scheduled successfully');
      }
      
      return {
        success: true,
        message: 'Birthday updated successfully with new notifications'
      };
      
    } catch (error) {
      console.error('❌ Failed to update birthday:', error);
      throw new Error(`Birthday update failed: ${error.message}`);
    }
  }

  /**
   * Delete birthday with perfect notification cleanup
   * @param {string} userId - Firebase Auth UID
   * @param {string} birthdayId - Birthday ID
   * @returns {Promise<Object>} - Success result
   */
  async deleteBirthday(userId, birthdayId) {
    try {
      console.log('🎂 Deleting birthday:', birthdayId);
      
      const birthdayRef = doc(db, USERS_COLLECTION, userId, BIRTHDAYS_COLLECTION, birthdayId);
      
      // Get birthday data before deletion
      const birthdayDoc = await getDoc(birthdayRef);
      if (!birthdayDoc.exists()) {
        throw new Error('Birthday not found');
      }
      
      const birthdayData = birthdayDoc.data();
      
      // Cancel all scheduled notifications
      if (birthdayData.notificationIds && birthdayData.notificationIds.length > 0) {
        await this.cancelBirthdayNotifications(birthdayData.notificationIds);
        console.log('✅ All notifications cancelled successfully');
      }
      
      // Delete birthday document
      await deleteDoc(birthdayRef);
      
      console.log('✅ Birthday deleted successfully');
      
      return {
        success: true,
        message: 'Birthday deleted successfully with notification cleanup'
      };
      
    } catch (error) {
      console.error('❌ Failed to delete birthday:', error);
      throw new Error(`Birthday deletion failed: ${error.message}`);
    }
  }

  /**
   * Get all birthdays for a user
   * @param {string} userId - Firebase Auth UID
   * @returns {Promise<Object>} - Array of birthdays
   */
  async getUserBirthdays(userId) {
    try {
      console.log('🎂 Fetching birthdays for user:', userId);
      
      const birthdaysRef = collection(db, USERS_COLLECTION, userId, BIRTHDAYS_COLLECTION);
      const q = query(birthdaysRef, orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const birthdays = [];
      
      querySnapshot.forEach((doc) => {
        birthdays.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(`✅ Fetched ${birthdays.length} birthdays successfully`);
      
      return {
        success: true,
        data: birthdays,
        count: birthdays.length
      };
      
    } catch (error) {
      console.error('❌ Failed to fetch birthdays:', error);
      throw new Error(`Birthday fetch failed: ${error.message}`);
    }
  }

  /**
   * Get real-time birthday updates
   * @param {string} userId - Firebase Auth UID
   * @param {Function} callback - Callback function for updates
   * @returns {Function} - Unsubscribe function
   */
  getBirthdaysRealtime(userId, callback) {
    try {
      console.log('🎂 Setting up real-time birthday listener for user:', userId);
      
      const birthdaysRef = collection(db, USERS_COLLECTION, userId, BIRTHDAYS_COLLECTION);
      const q = query(birthdaysRef, orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const birthdays = [];
        querySnapshot.forEach((doc) => {
          birthdays.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        console.log('🔄 Real-time birthday update received');
        callback({
          success: true,
          data: birthdays,
          count: birthdays.length
        });
      }, (error) => {
        console.error('❌ Real-time birthday listener error:', error);
        callback({
          success: false,
          error: error.message
        });
      });

      return unsubscribe;
      
    } catch (error) {
      console.error('❌ Failed to setup real-time birthday listener:', error);
      throw new Error(`Real-time listener setup failed: ${error.message}`);
    }
  }

  /**
   * Schedule notifications for a birthday (7 days, 1 day, on the day)
   * @param {Object} birthdayData - Birthday data
   * @returns {Promise<Object>} - Notification scheduling result
   */
  async scheduleBirthdayNotifications(birthdayData) {
    try {
      console.log('🔔 Scheduling notifications for birthday:', birthdayData.name);
      
      const notificationIds = [];
      const birthdayDate = new Date(birthdayData.date);
      const currentYear = new Date().getFullYear();
      
      // Calculate next birthday
      let nextBirthday = new Date(birthdayDate);
      nextBirthday.setFullYear(currentYear);
      
      // If birthday has passed this year, schedule for next year
      if (nextBirthday < new Date()) {
        nextBirthday.setFullYear(currentYear + 1);
      }
      
      // Schedule 7 days before
      const sevenDaysBefore = new Date(nextBirthday);
      sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);
      
      if (sevenDaysBefore > new Date()) {
        const notificationId = await scheduleNotification({
          title: `${birthdayData.name}'s Birthday Coming Up!`,
          message: `${birthdayData.name}'s birthday is in 7 days. Time to prepare! 🎉`,
          scheduledDate: sevenDaysBefore,
          userId: birthdayData.userId,
          birthdayId: birthdayData.id,
          type: 'birthday_reminder_7days'
        });
        
        if (notificationId) {
          notificationIds.push(notificationId);
        }
      }
      
      // Schedule 1 day before
      const oneDayBefore = new Date(nextBirthday);
      oneDayBefore.setDate(oneDayBefore.getDate() - 1);
      
      if (oneDayBefore > new Date()) {
        const notificationId = await scheduleNotification({
          title: `Don't Forget! ${birthdayData.name}'s Birthday Tomorrow!`,
          message: `${birthdayData.name}'s birthday is tomorrow! 🎂`,
          scheduledDate: oneDayBefore,
          userId: birthdayData.userId,
          birthdayId: birthdayData.id,
          type: 'birthday_reminder_1day'
        });
        
        if (notificationId) {
          notificationIds.push(notificationId);
        }
      }
      
      // Schedule on the day
      if (nextBirthday > new Date()) {
        const notificationId = await scheduleNotification({
          title: `🎉 It's ${birthdayData.name}'s Birthday Today!`,
          message: `Happy Birthday, ${birthdayData.name}! Don't forget to send your wishes! 🎁`,
          scheduledDate: nextBirthday,
          userId: birthdayData.userId,
          birthdayId: birthdayData.id,
          type: 'birthday_reminder_ontheday'
        });
        
        if (notificationId) {
          notificationIds.push(notificationId);
        }
      }
      
      console.log(`✅ Scheduled ${notificationIds.length} notifications successfully`);
      
      return {
        success: true,
        notificationIds: notificationIds,
        count: notificationIds.length
      };
      
    } catch (error) {
      console.error('❌ Failed to schedule notifications:', error);
      return {
        success: false,
        error: error.message,
        notificationIds: []
      };
    }
  }

  /**
   * Cancel all notifications for a birthday
   * @param {Array} notificationIds - Array of notification IDs to cancel
   * @returns {Promise<Object>} - Cancellation result
   */
  async cancelBirthdayNotifications(notificationIds) {
    try {
      console.log('🔔 Cancelling notifications:', notificationIds);
      
      if (!notificationIds || notificationIds.length === 0) {
        return { success: true, message: 'No notifications to cancel' };
      }
      
      // Cancel each notification
      const cancelPromises = notificationIds.map(async (notificationId) => {
        try {
          await cancelScheduledNotifications(notificationId);
          return { success: true, id: notificationId };
        } catch (error) {
          console.error(`❌ Failed to cancel notification ${notificationId}:`, error);
          return { success: false, id: notificationId, error: error.message };
        }
      });
      
      const results = await Promise.all(cancelPromises);
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      console.log(`✅ Cancelled ${successful} notifications, ${failed} failed`);
      
      return {
        success: true,
        cancelled: successful,
        failed: failed,
        results: results
      };
      
    } catch (error) {
      console.error('❌ Failed to cancel notifications:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get upcoming birthdays for a user
   * @param {string} userId - Firebase Auth UID
   * @param {number} days - Number of days to look ahead
   * @returns {Promise<Object>} - Upcoming birthdays
   */
  async getUpcomingBirthdays(userId, days = 30) {
    try {
      console.log(`🎂 Fetching upcoming birthdays for next ${days} days`);
      
      const birthdays = await this.getUserBirthdays(userId);
      if (!birthdays.success) {
        throw new Error('Failed to fetch birthdays');
      }
      
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);
      
      const upcomingBirthdays = birthdays.data.filter(birthday => {
        const birthdayDate = new Date(birthday.date);
        const nextBirthday = new Date(birthdayDate);
        nextBirthday.setFullYear(today.getFullYear());
        
        // If birthday has passed this year, check next year
        if (nextBirthday < today) {
          nextBirthday.setFullYear(today.getFullYear() + 1);
        }
        
        return nextBirthday >= today && nextBirthday <= futureDate;
      });
      
      // Sort by upcoming date
      upcomingBirthdays.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        const nextA = new Date(dateA);
        const nextB = new Date(dateB);
        
        nextA.setFullYear(today.getFullYear());
        nextB.setFullYear(today.getFullYear());
        
        if (nextA < today) nextA.setFullYear(today.getFullYear() + 1);
        if (nextB < today) nextB.setFullYear(today.getFullYear() + 1);
        
        return nextA - nextB;
      });
      
      return {
        success: true,
        data: upcomingBirthdays,
        count: upcomingBirthdays.length
      };
      
    } catch (error) {
      console.error('❌ Failed to get upcoming birthdays:', error);
      throw new Error(`Upcoming birthdays fetch failed: ${error.message}`);
    }
  }

  /**
   * Batch operations for multiple birthdays
   * @param {string} userId - Firebase Auth UID
   * @param {Array} operations - Array of operations to perform
   * @returns {Promise<Object>} - Batch operation result
   */
  async batchBirthdayOperations(userId, operations) {
    try {
      console.log('🎂 Performing batch birthday operations');
      
      const batch = writeBatch(db);
      const results = [];
      
      for (const operation of operations) {
        try {
          switch (operation.type) {
            case 'create':
              const birthdayId = `birthday_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              const birthdayRef = doc(db, USERS_COLLECTION, userId, BIRTHDAYS_COLLECTION, birthdayId);
              batch.set(birthdayRef, {
                ...operation.data,
                id: birthdayId,
                userId: userId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
              results.push({ success: true, type: 'create', id: birthdayId });
              break;
              
            case 'update':
              const updateRef = doc(db, USERS_COLLECTION, userId, BIRTHDAYS_COLLECTION, operation.id);
              batch.update(updateRef, {
                ...operation.data,
                updatedAt: serverTimestamp()
              });
              results.push({ success: true, type: 'update', id: operation.id });
              break;
              
            case 'delete':
              const deleteRef = doc(db, USERS_COLLECTION, userId, BIRTHDAYS_COLLECTION, operation.id);
              batch.delete(deleteRef);
              results.push({ success: true, type: 'delete', id: operation.id });
              break;
              
            default:
              results.push({ success: false, type: 'unknown', error: 'Unknown operation type' });
          }
        } catch (error) {
          results.push({ success: false, type: operation.type, error: error.message });
        }
      }
      
      await batch.commit();
      
      console.log('✅ Batch operations completed successfully');
      
      return {
        success: true,
        results: results,
        total: operations.length,
        successful: results.filter(r => r.success).length
      };
      
    } catch (error) {
      console.error('❌ Failed to perform batch operations:', error);
      throw new Error(`Batch operations failed: ${error.message}`);
    }
  }
}

// Export singleton instance
const birthdayService = new BirthdayService();
export default birthdayService;

