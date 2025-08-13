import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Edit3, Loader2, AlertCircle, CheckCircle, WifiOff } from 'lucide-react';
import { updateBirthdayOptimized } from '@/services/firestore-cached'; // Updated import
import localStorage from '@/services/localStorage'; // Add localStorage import

const EditBirthdayModal = ({ isOpen, onClose, onUpdate, userId, birthday }) => {
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
  const [isOnline] = useState(localStorage.isOnline());

  // Populate form when birthday changes or modal opens
  useEffect(() => {
    if (birthday && isOpen) {
      setForm({
        name: birthday.name || '',
        date: birthday.date || '',
        relation: birthday.relation || '',
        avatar: birthday.avatar || '🎉',
        isOnline: birthday.isOnline !== undefined ? birthday.isOnline : true,
      });
      setError('');
      setSuccess(false);
    }
  }, [birthday, isOpen]);

  /**
   * Handle form submission with optimized caching
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

    try {
      console.log('💾 Updating birthday (optimized)...');
      
      // Update using optimized service (instant cache + background sync)
      await updateBirthdayOptimized(userId, birthday.id, {
        name: form.name.trim(),
        date: form.date,
        relation: form.relation.trim(),
        avatar: form.avatar,
        isOnline: form.isOnline
      });

      console.log('✅ Birthday updated successfully (optimized)');

      // Show success state briefly
      setSuccess(true);

      // Update parent component
      onUpdate({
        ...birthday,
        ...form,
        name: form.name.trim(),
        relation: form.relation.trim()
      });

      // Close modal after brief success display
      setTimeout(() => {
        handleClose();
      }, 1000);

    } catch (err) {
      console.error('❌ Failed to update birthday:', err);
      
      // For offline errors, still show success since it's cached locally
      if (!isOnline) {
        setSuccess(true);
        setError(''); // Clear any error since offline save is valid
        
        // Update parent component with updated data
        onUpdate({
          ...birthday,
          ...form,
          name: form.name.trim(),
          relation: form.relation.trim()
        });
        
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setError(err.message || 'Failed to update birthday. Please try again.');
      }
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

  if (!birthday) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} showCloseButton={!saving}>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl transition-all duration-300 ${
            success 
              ? 'bg-gradient-to-r from-green-400 to-green-600' 
              : 'bg-gradient-to-r from-blue-400 to-blue-600'
          }`}>
            {success ? (
              <CheckCircle className="w-8 h-8 text-white" />
            ) : saving ? (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : (
              <Edit3 className="w-8 h-8 text-white" />
            )}
          </div>
          
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {success ? '✅ Birthday Updated!' : 'Edit Birthday 📝'}
          </h3>
          
          <p className="text-gray-600">
            {success 
              ? !isOnline 
                ? `${form.name}'s birthday updated locally! Will sync when back online.`
                : `${form.name}'s birthday has been updated successfully!`
              : `Update ${birthday.name}'s birthday information`
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

        {/* Success State */}
        {success && (
          <div className="text-center py-4">
            <div className={`font-medium ${
              isOnline ? 'text-green-600' : 'text-blue-600'
            }`}>
              {isOnline 
                ? 'Changes saved and synced! 🎉'
                : 'Changes saved offline! Will sync automatically. 📱'
              }
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button 
                type="button"
                variant="outline" 
                onClick={handleClose}
                disabled={saving}
                fullWidth
              >
                Cancel
              </Button>
              
              <Button 
                type="submit" 
                variant="primary"
                disabled={saving || !form.name.trim() || !form.date || !form.relation.trim()}
                loading={saving}
                fullWidth
              >
                {saving ? 'Updating...' : 'Update Birthday'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default EditBirthdayModal;