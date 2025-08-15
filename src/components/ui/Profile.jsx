import React, { useState } from 'react';
import { X, User, Calendar, LogOut, Crown, Shield, Settings, Edit3, Check, X as XIcon } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { signOut } from 'firebase/auth';
import { auth } from '@/config/firebase';

const Profile = ({ isOpen, onClose, user, darkMode, setDarkMode }) => {
  // Edit state management
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({
    displayName: user?.displayName || user?.email?.split('@')[0] || 'User',
    birthday: user?.birthday || ''
  });

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

  // Get user's display name or email
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || 'No email available';
  
  // Get user's birthday if available (you can extend this later)
  const userBirthday = user?.birthday || null;

  // Handle field editing
  const handleEditField = (field) => {
    setEditingField(field);
    setIsEditing(true);
  };

  // Handle save field
  const handleSaveField = async (field) => {
    try {
      // Here you would typically update the user's profile in Firebase
      // For now, we'll just update local state
      console.log(`Saving ${field}:`, editValues[field]);
      
      // TODO: Implement Firebase profile update
      // await updateUserProfile(user.uid, { [field]: editValues[field] });
      
      setEditingField(null);
      setIsEditing(false);
      
      // Show success feedback
      // You can add a toast notification here
      
    } catch (error) {
      console.error('Failed to save field:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingField(null);
    setIsEditing(false);
    // Reset to original values
    setEditValues({
      displayName: user?.displayName || user?.email?.split('@')[0] || 'User',
      birthday: user?.birthday || ''
    });
  };

  // Handle input change
  const handleInputChange = (field, value) => {
    setEditValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
            {editValues.displayName.charAt(0).toUpperCase()}
          </span>
        </div>
        
        {/* User Name */}
        <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
          {editValues.displayName}
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
              <span className="text-gray-600 dark:text-gray-400 text-sm">Display Name</span>
              <div className="flex items-center space-x-2">
                {editingField === 'displayName' ? (
                  <>
                    <input
                      type="text"
                      value={editValues.displayName}
                      onChange={(e) => handleInputChange('displayName', e.target.value)}
                      className="px-2 py-1 text-sm border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveField('displayName')}
                      className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                      title="Save"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Cancel"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{editValues.displayName}</span>
                    <button
                      onClick={() => handleEditField('displayName')}
                      className="p-1 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                      title="Edit name"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Birthday - Editable */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Birthday</span>
              <div className="flex items-center space-x-2">
                {editingField === 'birthday' ? (
                  <>
                    <input
                      type="date"
                      value={editValues.birthday}
                      onChange={(e) => handleInputChange('birthday', e.target.value)}
                      className="px-2 py-1 text-sm border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveField('birthday')}
                      className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                      title="Save"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Cancel"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    {editValues.birthday ? (
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {new Date(editValues.birthday).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 text-sm italic">Not set</span>
                    )}
                    <button
                      onClick={() => handleEditField('birthday')}
                      className="p-1 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                      title="Edit birthday"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account Status */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-700">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Account Status
            </h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-700 dark:text-green-400 font-medium">
              Account Verified
            </span>
          </div>
        </div>

        {/* Premium Features (Future) */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-700">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Premium Features
            </h3>
          </div>
          
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            Unlock advanced features and customization options
          </p>
          
          <button className="mt-3 w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
            Upgrade to Premium
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Settings Button (Future) */}
        <button className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:border-pink-300 dark:hover:border-pink-600 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-200">
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
        
        {/* Logout Button */}
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </Modal>
  );
};

export default Profile;
