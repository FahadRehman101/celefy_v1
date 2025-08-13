import React, { useState } from 'react';
import { scheduleBirthdayReminders } from '@/services/notificationScheduler'; // ✅ YES, import here
import { useSmartNotifications } from '@/hooks/useSmartNotifications';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Plus, Loader2, AlertCircle, CheckCircle, WifiOff, Bell } from 'lucide-react';
import { addBirthdayOptimized } from '@/services/firestore-cached';
import localStorage from '@/services/localStorage';

const AddBirthdayModal = ({ isOpen, onClose, onAdd, userId }) => {
  const { triggerNotificationPrompt } = useSmartNotifications();
  
  // Form state
  const [form, setForm] = useState({
    name: '',
    date: '',
    relation: '',
    avatar: '🎉',
    isOnline: true,
  });

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState(''); // NEW: Track notification scheduling
  const [isOnline] = useState(localStorage.isOnline());

  /**
   * Handle form submission with notification scheduling
   */
 /**
 * Handle form submission with offline notification queue support
 */
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validation
  if (!form.name.trim() || !form.date || !form.relation.trim()) {
    setError('Please fill in all required fields');
    return;
  }

  // Clear previous states
  setError('');
  setSaving(true);
  setNotificationStatus('Saving birthday...');

  try {
    console.log('💾 Saving birthday (optimized)...');
    
    // Save using optimized service (instant cache + background sync)
    const birthdayId = await addBirthdayOptimized(userId, {
      name: form.name.trim(),
      date: form.date,
      relation: form.relation.trim(),
      avatar: form.avatar,
      isOnline: form.isOnline
    });

    console.log('✅ Birthday saved (optimized) with ID:', birthdayId);
    
    // Prepare birthday data for notification scheduling
    const birthdayData = {
      id: birthdayId,
      name: form.name.trim(),
      date: form.date,
      relation: form.relation.trim(),
      avatar: form.avatar
    };

    // 🔑 NEW: Smart notification scheduling with offline support
    setNotificationStatus('Scheduling reminders...');
    
    try {
      // Check if we're online and try immediate scheduling
      if (navigator.onLine) {
        console.log('📶 Online - attempting immediate notification scheduling...');
        
        const notificationResult = await scheduleBirthdayReminders(birthdayData, userId);
        
        if (notificationResult.success) {
          console.log('🔔 Birthday reminders scheduled successfully!');
          setNotificationStatus('Perfect! Reminders scheduled for 7 days before, 1 day before, and on the day! 🔔');
        } else if (notificationResult.requiresConfig) {
          // OneSignal not configured - show helpful message
          console.warn('⚠️ OneSignal not configured:', notificationResult.error);
          setNotificationStatus('Birthday saved! 🔔 Enable notifications in settings to get birthday reminders.');
        } else {
          throw new Error(notificationResult.error || 'Scheduling failed');
        }
      } else {
        // We're offline, queue for later
        throw new Error('Currently offline');
      }
      
    } catch (schedulingError) {
      console.warn('⚠️ Immediate scheduling failed, queuing for when online:', schedulingError.message);
      
      // Import queue function dynamically to avoid circular dependencies
      const { queueNotificationScheduling } = await import('@/services/notificationQueue');
      
      const queueResult = await queueNotificationScheduling(birthdayId, birthdayData, userId);
      
      if (queueResult.success) {
        setNotificationStatus('Birthday saved! 📱 Reminders will be scheduled automatically when you\'re back online.');
      } else {
        setNotificationStatus('Birthday saved, but reminder scheduling failed. You can manually enable notifications later.');
      }
    }

    // Success UI updates
    setSuccess(true);
    
    // Call parent callback to refresh birthday list
    if (onAdd) {
      onAdd({
        id: birthdayId,
        ...birthdayData
      });
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
  /**
   * Close modal and reset form
   */
  const handleClose = () => {
    if (saving) return; // Prevent closing while saving
    
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

  /**
   * Handle input changes
   */
  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  return (
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
            ) : saving ? (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : (
              <Plus className="w-8 h-8 text-white" />
            )}
          </div>
          
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {success ? '🎉 Birthday Added!' : 'Add a Birthday 🎂'}
          </h3>
          
          <p className="text-gray-600">
            {success 
              ? !isOnline 
                ? `${form.name}'s birthday saved locally! Will sync when back online.`
                : `${form.name}'s birthday has been saved successfully!`
              : 'Add a friend\'s birthday to start celebrating!'
            }
          </p>

          {/* Offline indicator */}
          {!isOnline && !success && (
            <div className="mt-3 flex items-center justify-center space-x-2 text-sm text-gray-500">
              <WifiOff className="w-4 h-4" />
              <span>Offline - will sync when reconnected</span>
            </div>
          )}
        </div>

        {/* Success State with Notification Status */}
        {success && (
          <div className="text-center py-4 space-y-3">
            <div className={`font-medium ${
              isOnline ? 'text-green-600' : 'text-blue-600'
            }`}>
              {isOnline 
                ? 'Birthday saved successfully! 🎉'
                : 'Birthday saved offline! Will sync automatically. 📱'
              }
            </div>
            
            {/* Notification Status */}
            {notificationStatus && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-center space-x-2 text-blue-700">
                  <Bell className="w-4 h-4" />
                  <span className="text-sm">{notificationStatus}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading Status */}
        {saving && notificationStatus && (
          <div className="text-center py-2">
            <div className="text-sm text-gray-600">
              {notificationStatus}
            </div>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {/* Name Input */}
            <Input
              label="Friend's Name *"
              value={form.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter their name"
              disabled={saving}
              required
              maxLength={50}
            />

            {/* Date Input */}
            <Input
              label="Birthday *"
              type="date"
              value={form.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              disabled={saving}
              required
              max={new Date().toISOString().split('T')[0]} // Can't be future date
            />

            {/* Relation Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relationship *
              </label>
              <select
                value={form.relation}
                onChange={(e) => handleInputChange('relation', e.target.value)}
                disabled={saving}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select relationship</option>
                <option value="Family">Family</option>
                <option value="Best Friend">Best Friend</option>
                <option value="Friend">Friend</option>
                <option value="Colleague">Colleague</option>
                <option value="Partner">Partner</option>
                <option value="Sibling">Sibling</option>
                <option value="Parent">Parent</option>
                <option value="Child">Child</option>
                <option value="Grandparent">Grandparent</option>
                <option value="Cousin">Cousin</option>
                <option value="Neighbor">Neighbor</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Avatar Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose an Avatar
              </label>
              <div className="flex flex-wrap gap-2">
                {['🎉', '🎂', '🎈', '🎁', '🎊', '🥳', '💝', '🌟'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleInputChange('avatar', emoji)}
                    disabled={saving}
                    className={`w-12 h-12 text-2xl rounded-lg border-2 transition-all hover:scale-110 disabled:hover:scale-100 disabled:opacity-50 ${
                      form.avatar === emoji
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button 
                type="submit" 
                variant="primary"
                disabled={saving || !form.name.trim() || !form.date || !form.relation.trim()}
                loading={saving}
                fullWidth
              >
                {saving ? 'Saving Birthday...' : 'Save Birthday'}
              </Button>
              
              {/* Cancel Button */}
              {!saving && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full mt-3 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default AddBirthdayModal;
