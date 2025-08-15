// 🔧 FIXED AddBirthdayModal.jsx - Proper auth handling
import React, { useState } from 'react';
import { Gift, X, CheckCircle, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { RELATIONSHIP_OPTIONS } from '@/utils/constants';
import { addBirthdayOptimized } from '@/services/firestore-cached';
import { scheduleBirthdayReminders } from '@/services/notificationScheduler';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { auth } from '@/config/firebase'; // 🔧 ADD THIS IMPORT
import { addNotificationToHistory, NOTIFICATION_TYPES, NOTIFICATION_PRIORITY } from '@/services/notificationHistory';

const AddBirthdayModal = ({ isOpen, onClose, onAdd }) => {
  const [form, setForm] = useState({
    name: '',
    date: '',
    relation: '',
    avatar: '🎉',
    isOnline: true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState('');

  // 🔧 NEW: Use notification permission hook
  const { 
    triggerPermissionPrompt, 
    isNotificationEnabled,
    permissionStatus 
  } = useNotificationPermission();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name.trim() || !form.date) {
      setError('Please fill in all required fields.');
      return;
    }

    setSaving(true);
    setError('');
    setNotificationStatus('');

    try {
      console.log('💾 Saving birthday (optimized)...');
      
      // 🔧 FIXED: Get user from Firebase Auth directly
      const currentUser = auth.currentUser;
      const userId = currentUser?.uid;
      
      if (!userId) {
        throw new Error('User not authenticated. Please refresh and try again.');
      }

      console.log('✅ User authenticated:', userId);

      const birthdayData = {
        ...form,
        name: form.name.trim(),
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const birthdayId = await addBirthdayOptimized(userId, birthdayData);
      console.log('✅ Birthday saved (optimized) with ID:', birthdayId);

      // Schedule birthday reminders
      try {
        const reminderResult = await scheduleBirthdayReminders(
          { ...birthdayData, id: birthdayId },
          userId
        );
        if (reminderResult.success) {
          console.log(`✅ Scheduled ${reminderResult.scheduledCount} birthday reminders!`);
          setNotificationStatus(`Perfect! ${reminderResult.scheduledCount} reminders scheduled!`);
        }
      } catch (error) {
        console.warn('Could not schedule reminders:', error);
        // Don't block the birthday save
      }

      // 🎯 NEW: Add birthday added notification to history
      addNotificationToHistory({
        type: NOTIFICATION_TYPES.BIRTHDAY_ADDED,
        priority: NOTIFICATION_PRIORITY.MEDIUM,
        title: 'Birthday Added Successfully! 🎉',
        message: `${birthdayData.name}'s birthday has been added to your celebration list!`,
        data: {
          birthdayId: birthdayId,
          birthdayName: birthdayData.name,
          birthdayDate: birthdayData.date,
          addedAt: new Date().toISOString()
        }
      });

      // 🔧 NEW: Trigger permission prompt if this might be their first birthday
      if (permissionStatus === 'default') {
        console.log('🔔 Triggering permission prompt for first birthday...');
        triggerPermissionPrompt(form.name.trim());
      }

      // CRITICAL FIX: Make notification scheduling completely non-blocking
      // This ensures birthdays always appear even if OneSignal fails
      const scheduleNotifications = async () => {
        try {
          if (navigator.onLine) {
            console.log('📶 Online - attempting immediate notification scheduling...');
            console.log('🎯 Calling scheduleBirthdayReminders with:', {
              birthday: { ...birthdayData, id: birthdayId },
              userId: userId
            });
            
            const notificationResult = await scheduleBirthdayReminders(
              { ...birthdayData, id: birthdayId }, 
              userId
            );
            
            console.log('📊 Notification scheduling result:', notificationResult);
            
            // CRITICAL FIX: Handle the actual response format from scheduleBirthdayReminders
            if (notificationResult.success && notificationResult.scheduledCount > 0) {
              console.log('🔔 Birthday reminders scheduled successfully!');
              const statusMessage = `Perfect! ${notificationResult.scheduledCount} reminders scheduled for 7 days before, 1 day before, and on the day! 🔔`;
              console.log('📝 Setting notification status:', statusMessage);
              
              // CRITICAL FIX: Multiple attempts to ensure status is displayed
              setNotificationStatus(statusMessage);
              console.log('✅ Status set to:', statusMessage);
              
              // CRITICAL FIX: Force multiple re-renders to ensure status is displayed
              setTimeout(() => {
                console.log('🔄 Forcing notification status update (100ms)...');
                setNotificationStatus(statusMessage);
              }, 100);
              
              setTimeout(() => {
                console.log('🔄 Forcing notification status update (500ms)...');
                setNotificationStatus(statusMessage);
              }, 500);
              
              setTimeout(() => {
                console.log('🔄 Forcing notification status update (1000ms)...');
                setNotificationStatus(statusMessage);
              }, 1000);
              
            } else if (notificationResult.birthdaySaved && notificationResult.fallbackMessage) {
              // Handle fallback case where birthday was saved but notifications failed
              console.warn('⚠️ Notification scheduling failed but birthday saved:', notificationResult.error);
              setNotificationStatus(notificationResult.fallbackMessage);
            } else if (notificationResult.birthdaySaved) {
              // Birthday was saved but no specific notification info
              console.log('✅ Birthday saved successfully!');
              setNotificationStatus('Birthday saved! 🔔 Notifications will be retried later.');
            } else {
              // Unexpected format - show generic success
              console.warn('⚠️ Unexpected notification result format:', notificationResult);
              setNotificationStatus('Birthday saved! 🔔 Notification status unclear.');
            }
            
            // CRITICAL FIX: Force UI update to show notification status
            console.log('🔄 Forcing UI update to show notification status...');
            console.log('📊 Current notificationStatus state:', notificationStatus);
          } else {
            throw new Error('Currently offline');
          }
          
        } catch (schedulingError) {
          console.error('❌ Notification scheduling error:', schedulingError);
          console.error('❌ Error stack:', schedulingError.stack);
          console.warn('⚠️ Immediate scheduling failed, queuing for when online:', schedulingError.message);
          
          try {
            const { queueNotificationScheduling } = await import('@/services/notificationQueue');
            const queueResult = await queueNotificationScheduling(birthdayId, birthdayData, userId);
            
            if (queueResult.success) {
              setNotificationStatus('Birthday saved! 📱 Reminders will be scheduled automatically when you\'re back online.');
            } else {
              setNotificationStatus('Birthday saved, but reminder scheduling failed. You can manually enable notifications later.');
            }
          } catch (queueError) {
            console.error('Failed to queue notification:', queueError);
            setNotificationStatus('Birthday saved! You can set up notifications in settings.');
          }
        }
      };

      // CRITICAL FIX: Start notification scheduling in background, don't wait for it
      scheduleNotifications().catch(error => {
        console.error('❌ Notification scheduling completely failed:', error);
        setNotificationStatus('Birthday saved! 🔔 Notifications will be retried later.');
      });

      // CRITICAL FIX: Success UI updates happen IMMEDIATELY after birthday save
      setSuccess(true);
      
      // Trigger install prompt after first successful birthday add
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        const birthdayCount = localStorage.getItem('total_birthdays_added') || '0';
        if (birthdayCount === '0') {
          window.dispatchEvent(new Event('show-pwa-prompt'));
        }
        localStorage.setItem('total_birthdays_added', String(parseInt(birthdayCount) + 1));
      }
      
      // CRITICAL FIX: Set a default notification status immediately and force display
      const initialStatus = 'Birthday saved successfully! 🔔 Setting up birthday reminders...';
      setNotificationStatus(initialStatus);
      
      // CRITICAL FIX: Force immediate UI update
      setTimeout(() => {
        console.log('🔄 Forcing immediate status display...');
        setNotificationStatus(initialStatus);
      }, 50);
      
      // CRITICAL FIX: Show immediate success notification
      try {
        if (Notification.permission === 'granted') {
          const successNotification = new Notification('🎉 Birthday Added Successfully!', {
            body: `${birthdayData.name}'s birthday has been added to your celebration list!`,
            icon: '/icons/icon-192.png',
            tag: 'birthday_added_success',
            data: {
              type: 'success',
              birthday_name: birthdayData.name,
              birthday_id: birthdayId
            }
          });
          
          successNotification.onclick = () => {
            window.focus();
            console.log('✅ Success notification clicked');
          };
          
          console.log('✅ Immediate success notification shown');
        }
      } catch (notificationError) {
        console.warn('⚠️ Could not show success notification:', notificationError.message);
      }

      // CRITICAL FIX: Call parent callback to refresh birthday list IMMEDIATELY
      if (onAdd) {
        const birthdayToAdd = {
          id: birthdayId,
          name: birthdayData.name,
          date: birthdayData.date,
          relation: birthdayData.relation,
          avatar: birthdayData.avatar,
          isOnline: birthdayData.isOnline,
          userId: birthdayData.userId,
          createdAt: birthdayData.createdAt,
          updatedAt: birthdayData.updatedAt
        };
        
        console.log('🎂 Calling onAdd callback with new birthday:', birthdayToAdd);
        console.log('🎂 Birthday ID:', birthdayId);
        console.log('🎂 Birthday name:', birthdayData.name);
        console.log('🎂 Birthday date:', birthdayData.date);
        
        onAdd(birthdayToAdd);
      }

      // Auto-close modal after short delay
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (error) {
      console.error('❌ Error saving birthday:', error);
      setError(error.message || 'Failed to save birthday. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    
    setForm({
      name: '',
      date: '',
      relation: '',
      avatar: '🎉',
      isOnline: true,
    });
    setError('');
    setSuccess(false);
    setNotificationStatus('');
    setSaving(false);
    onClose();
  };

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  return (
    <ErrorBoundary>
      <Modal 
        isOpen={isOpen} 
        onClose={handleClose}
        fullScreen={true} // 🎯 NEW: Full screen experience!
        className="overflow-hidden"
      >
        {/* 🎯 FULL SCREEN HEADER - Compact & Beautiful */}
        <div className="text-center mb-6 md:mb-8">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-pink-400 via-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Gift className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Add Birthday
          </h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Celebrate every special moment! 🎉
          </p>
        </div>

        {/* 🎯 ONE-SCREEN FORM - Perfect Fit, No Scrolling */}
        {!success ? (
          <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4 md:space-y-5">
            {/* Name Input - Compact */}
            <div className="space-y-2">
              <label className="block text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200">
                Person's Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter the person's full name..."
                className="w-full px-4 py-3 border-2 border-pink-200 dark:border-pink-700 rounded-xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base transition-all duration-200 shadow-md hover:shadow-lg"
                disabled={saving}
                required
              />
            </div>

            {/* Date Input - Compact */}
            <div className="space-y-2">
              <label className="block text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200">
                Birthday Date *
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full px-4 py-3 border-2 border-pink-200 dark:border-pink-700 rounded-xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base transition-all duration-200 shadow-md hover:shadow-lg"
                disabled={saving}
                required
              />
            </div>

            {/* Relationship Input - Compact */}
            <div className="space-y-2">
              <label className="block text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200">
                Relationship
              </label>
              <select
                value={form.relation}
                onChange={(e) => handleInputChange('relation', e.target.value)}
                className="w-full px-4 py-3 border-2 border-pink-200 dark:border-pink-700 rounded-xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base transition-all duration-200 shadow-md hover:shadow-lg"
                disabled={saving}
              >
                <option value="">Select relationship...</option>
                {RELATIONSHIP_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Avatar Selection - Compact & Perfectly Contained */}
            <div className="space-y-3">
              <label className="block text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200">
                Choose Avatar
              </label>
              <div className="grid grid-cols-6 gap-2 md:gap-3">
                {['🎉', '🎂', '🎈', '🎁', '🌟', '💝', '🎊', '🥳', '🎀', '🌸', '💐', '🍰'].map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleInputChange('avatar', emoji)}
                    className={`aspect-square p-2 md:p-3 text-lg md:text-xl rounded-lg border-2 transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center justify-center ${
                      form.avatar === emoji
                        ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/30 dark:to-purple-900/30 shadow-md ring-1 ring-pink-500/50'
                        : 'border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20'
                    }`}
                    disabled={saving}
                  >
                    <span className="leading-none">{emoji}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Display - Compact */}
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-center space-x-2 shadow-md">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
              </div>
            )}

            {/* Notification Status Display - Compact */}
            {notificationStatus && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 flex items-center space-x-2 shadow-md">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">{notificationStatus}</p>
              </div>
            )}

            {/* Action Buttons - Compact */}
            <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={saving}
                className="flex-1 px-6 py-3 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 text-base font-semibold shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !form.name.trim() || !form.date}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 hover:from-pink-600 hover:via-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 text-white rounded-xl font-bold text-base transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:hover:shadow-lg"
              >
                {saving ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>🎉</span>
                    <span>Add Birthday</span>
                    <span>✨</span>
                  </div>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Success State - Compact */
          <div className="text-center max-w-lg mx-auto">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
              <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-white" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-3">
              Birthday Added Successfully! 🎉
            </h3>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-6">
              {form.name}'s birthday has been added to your celebration list! 💖
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl font-bold text-base transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Continue Celebrating! 🎊
            </button>
          </div>
        )}
      </Modal>
    </ErrorBoundary>
  );
};

export default AddBirthdayModal;