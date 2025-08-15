import React, { useState, useEffect } from 'react';
import { X, User, Calendar, LogOut, Crown, Shield, Settings, Edit3, Check, X as XIcon } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { signOut } from 'firebase/auth';
import { auth } from '@/config/firebase';
import userProfileService from '@/services/userProfileService';

const Profile = ({ isOpen, onClose, user, darkMode, setDarkMode }) => {
  // Edit state management
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({
    displayName: user?.displayName || user?.email?.split('@')[0] || 'User',
    birthday: user?.birthday || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Load user profile data when modal opens
  useEffect(() => {
    if (isOpen && user?.uid) {
      loadUserProfile();
    }
  }, [isOpen, user?.uid]);

  // Load user profile from Firebase
  const loadUserProfile = async () => {
    try {
      console.log('🎯 Loading user profile from Firebase...');
      const result = await userProfileService.getUserProfile(user.uid);
      
      if (result.success && result.exists) {
        const profileData = result.data;
        setEditValues({
          displayName: profileData.displayName || user?.displayName || user?.email?.split('@')[0] || 'User',
          birthday: profileData.birthday || ''
        });
        console.log('✅ Profile loaded successfully:', profileData);
      } else {
        console.log('ℹ️ No profile found, using default values');
      }
    } catch (error) {
      console.error('❌ Failed to load profile:', error);
      // Keep default values if loading fails
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('Signing out...');
      await signOut(auth);
      console.log('Sign out successful');
      onClose();
    } catch (error) {
      console.error('Sign out error:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  // Start editing a field
  const startEditing = (field) => {
    setEditingField(field);
    setIsEditing(true);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingField(null);
    setIsEditing(false);
    setSaveMessage('');
    // Reset to original values
    setEditValues({
      displayName: user?.displayName || user?.email?.split('@')[0] || 'User',
      birthday: user?.birthday || ''
    });
  };

  // Save profile changes
  const saveProfileChanges = async () => {
    if (!editingField) return;

    setIsSaving(true);
    setSaveMessage('');

    try {
      console.log('🎯 Saving profile changes to Firebase...');
      
      const updates = {};
      updates[editingField] = editValues[editingField];

      const result = await userProfileService.updateProfileFields(user.uid, updates);
      
      if (result.success) {
        console.log('✅ Profile updated successfully');
        setSaveMessage('Profile updated successfully!');
        
        // Update local user object if displayName was changed
        if (editingField === 'displayName') {
          user.displayName = editValues.displayName;
        }
        
        // Exit editing mode after a short delay
        setTimeout(() => {
          setEditingField(null);
          setIsEditing(false);
          setSaveMessage('');
        }, 1500);
      } else {
        throw new Error('Failed to update profile');
      }
      
    } catch (error) {
      console.error('❌ Failed to save profile changes:', error);
      setSaveMessage(`Failed to save: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  };

  // Get user's display name or email
  const displayName = editValues.displayName || user?.displayName || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || 'No email available';
  const userBirthday = editValues.birthday || user?.birthday || null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      className="max-w-md w-full"
    >
      {/* Profile Header */}
      <div className="text-center mb-6">
        {/* Profile Avatar */}
        <div className="w-20 h-20 bg-gradient-to-br from-pink-400 via-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
          <span className="text-3xl font-bold text-white">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </div>
        
        {/* User Name */}
        <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
          {displayName}
        </h2>
        
        {/* User Email */}
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {userEmail}
        </p>
      </div>

      {/* Profile Information */}
      <div className="space-y-4 mb-6">
        {/* User Info Section */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-pink-200 dark:border-pink-700">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-500 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Personal Information
            </h3>
          </div>
          
          <div className="space-y-3">
            {/* Display Name - Editable */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Name:</span>
              <div className="flex items-center space-x-2">
                {editingField === 'displayName' ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editValues.displayName}
                      onChange={(e) => handleInputChange('displayName', e.target.value)}
                      className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      autoFocus
                    />
                    <button
                      onClick={saveProfileChanges}
                      disabled={isSaving}
                      className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                      title="Save"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Cancel"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {editValues.displayName}
                    </span>
                    <button
                      onClick={() => startEditing('displayName')}
                      className="p-1 text-gray-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded transition-colors"
                      title="Edit name"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Birthday - Editable */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Birthday:</span>
              <div className="flex items-center space-x-2">
                {editingField === 'birthday' ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="date"
                      value={editValues.birthday}
                      onChange={(e) => handleInputChange('birthday', e.target.value)}
                      className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                    <button
                      onClick={saveProfileChanges}
                      disabled={isSaving}
                      className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                      title="Save"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Cancel"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {userBirthday ? new Date(userBirthday).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric'
                      }) : 'Not set'}
                    </span>
                    <button
                      onClick={() => startEditing('birthday')}
                      className="p-1 text-gray-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded transition-colors"
                      title="Edit birthday"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div className={`p-3 rounded-lg text-sm ${
            saveMessage.includes('successfully') 
              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700'
              : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700'
          }`}>
            {saveMessage}
          </div>
        )}

        {/* App Features Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              App Features
            </h3>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Birthday reminders & notifications</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Cross-device synchronization</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Personalized birthday tracking</span>
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-slate-500 rounded-lg flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Preferences
            </h3>
          </div>
          
          <div className="space-y-3">
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Dark Mode:</span>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-pink-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={handleSignOut}
          className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </Button>
      </div>
    </Modal>
  );
};

export default Profile;
