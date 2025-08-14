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
            
            const notificationResult = await scheduleBirthdayReminders(
              { ...birthdayData, id: birthdayId }, 
              userId
            );
            
            // CRITICAL FIX: Handle new response format with birthdaySaved flag
            if (notificationResult.birthdaySaved) {
              console.log('✅ Birthday saved successfully!');
              
              if (notificationResult.success && notificationResult.scheduledCount > 0) {
                console.log('🔔 Birthday reminders scheduled successfully!');
                setNotificationStatus(`Perfect! ${notificationResult.scheduledCount} reminders scheduled for 7 days before, 1 day before, and on the day! 🔔`);
              } else if (notificationResult.requiresSubscription) {
                console.warn('⚠️ User not subscribed to notifications:', notificationResult.error);
                setNotificationStatus('Birthday saved! 🔔 Please enable notifications to get birthday reminders.');
              } else if (notificationResult.requiresConfig) {
                console.warn('⚠️ OneSignal not configured:', notificationResult.error);
                setNotificationStatus('Birthday saved! 🔔 Notifications will be available when properly configured.');
              } else if (notificationResult.requiresReload) {
                console.warn('⚠️ OneSignal not ready:', notificationResult.error);
                setNotificationStatus('Birthday saved! 🔔 Notifications will be available after page refresh.');
              } else if (notificationResult.fallbackMessage) {
                console.warn('⚠️ Notification scheduling failed but birthday saved:', notificationResult.error);
                setNotificationStatus(notificationResult.fallbackMessage);
              } else {
                console.warn('⚠️ Notification scheduling failed:', notificationResult.error);
                setNotificationStatus('Birthday saved! 🔔 Notifications will be retried later.');
              }
            } else {
              // This shouldn't happen with our updated scheduler, but handle it gracefully
              console.warn('⚠️ Unexpected notification result format:', notificationResult);
              setNotificationStatus('Birthday saved! 🔔 Notification status unclear.');
            }
          } else {
            throw new Error('Currently offline');
          }
          
        } catch (schedulingError) {
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
      <Modal isOpen={isOpen} onClose={handleClose} showCloseButton={!saving}>
        <div className="space-y-6">
          
          {/* Header */}
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl transition-all duration-300 ${
              success 
                ? 'bg-gradient-to-r from-green-400 to-green-600' 
                : 'bg-gradient-to-r from-pink-400 to-purple-500'
            }`}>
              {success ? (
                <CheckCircle className="w-8 h-8 text-white" />
              ) : (
                <Gift className="w-8 h-8 text-white" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {success ? 'Birthday Added!' : 'Add New Birthday'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {success 
                ? 'Successfully added to your celebration list!' 
                : 'Add someone special to never miss their birthday'
              }
            </p>
          </div>

          {/* Success state */}
          {success && (
            <div className="text-center space-y-3">
              <div className="text-6xl animate-bounce">🎉</div>
              {notificationStatus && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {notificationStatus}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter their name..."
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                  disabled={saving}
                  required
                />
              </div>

              {/* Date Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Birthday *
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
                  disabled={saving}
                  required
                />
              </div>

              {/* Relationship Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Relationship
                </label>
                <select
                  value={form.relation}
                  onChange={(e) => handleInputChange('relation', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
                  disabled={saving}
                >
                  <option value="">Select relationship...</option>
                  {RELATIONSHIP_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              {/* Avatar Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Choose Avatar
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {['🎉', '🎂', '🎈', '🎁', '🌟', '💝', '🎊', '🥳', '🎀', '🌸', '💐', '🍰'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleInputChange('avatar', emoji)}
                      className={`p-3 text-2xl rounded-lg border-2 transition-all hover:scale-110 ${
                        form.avatar === emoji
                          ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
                      }`}
                      disabled={saving}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={saving}
                  className="flex-1 px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.name.trim() || !form.date}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
                >
                  {saving ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    'Add Birthday'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </ErrorBoundary>
  );
};

export default AddBirthdayModal;