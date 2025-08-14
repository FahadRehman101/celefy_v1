import React, { useState, useEffect } from 'react';
import { Home, Star, BookOpen, LogOut, Sun, Moon, Bell, Edit2, Check, X } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/config/firebase';
import NotificationBell from '@/components/ui/NotificationBell';
import NotificationCenter from '@/components/ui/NotificationCenter';

const Navigation = ({ user, currentPage, setCurrentPage, darkMode, setDarkMode }) => {
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [customUserName, setCustomUserName] = useState('');
  const [tempUserName, setTempUserName] = useState('');
  
  // Load custom user name from localStorage on component mount
  useEffect(() => {
    const savedName = localStorage.getItem('celefy_custom_user_name');
    if (savedName) {
      setCustomUserName(savedName);
    }
  }, []);

  const handleSignOut = async () => {
    try {
      console.log('Signing out...');
      await signOut(auth);
      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  const openNotificationCenter = () => {
    setIsNotificationCenterOpen(true);
  };

  const closeNotificationCenter = () => {
    setIsNotificationCenterOpen(false);
  };

  const startEditingName = () => {
    setTempUserName(customUserName || user?.displayName || user?.email?.split('@')[0] || '');
    setIsEditingName(true);
  };

  const saveUserName = () => {
    const trimmedName = tempUserName.trim();
    if (trimmedName) {
      setCustomUserName(trimmedName);
      localStorage.setItem('celefy_custom_user_name', trimmedName);
      setIsEditingName(false);
    }
  };

  const cancelEditing = () => {
    setIsEditingName(false);
    setTempUserName('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      saveUserName();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  // Get the display name with priority: custom name > user.displayName > email username > 'User'
  const getDisplayName = () => {
    return customUserName || user?.displayName || user?.email?.split('@')[0] || 'User';
  };

  // Get the first letter for the avatar
  const getAvatarLetter = () => {
    const name = getDisplayName();
    return name.charAt(0).toUpperCase();
  };

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-md border-b border-pink-200 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setCurrentPage('dashboard')}>
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-2 rounded-xl">
              <Home className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 text-transparent bg-clip-text">
              Celefy
            </span>
          </div>
          
          <button
            onClick={() => setCurrentPage('dashboard')}
            className={`ml-6 text-sm font-medium ${currentPage === 'dashboard' ? 'text-pink-600' : 'text-gray-600 hover:text-pink-600'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentPage('celebrities')}
            className={`text-sm font-medium ${currentPage === 'celebrities' ? 'text-pink-600' : 'text-gray-600 hover:text-pink-600'}`}
          >
            Celebrities
          </button>
          <button
            onClick={() => setCurrentPage('stories')}
            className={`text-sm font-medium ${currentPage === 'stories' ? 'text-pink-600' : 'text-gray-600 hover:text-pink-600'}`}
          >
            Stories
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <button onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
          </button>
          
          {/* 🎯 NEW: Notification Bell */}
          <NotificationBell 
            onClick={openNotificationCenter}
            className="ml-2"
          />
          
          {/* User Info */}
          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full flex items-center justify-center font-semibold">
            {getAvatarLetter()}
          </div>
          
          {/* Editable User Name */}
          {isEditingName ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={tempUserName}
                onChange={(e) => setTempUserName(e.target.value)}
                onKeyDown={handleKeyPress}
                className="px-2 py-1 text-sm border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Enter your name"
                autoFocus
              />
              <button
                onClick={saveUserName}
                className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                title="Save name"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={cancelEditing}
                className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 group">
              <span className="text-sm font-medium text-gray-700 max-w-32 truncate">
                {getDisplayName()}
              </span>
              <button
                onClick={startEditingName}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-all duration-200"
                title="Edit name"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}
          
          {/* Logout Button */}
          <button 
            onClick={handleSignOut}
            className="text-gray-600 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* 🎯 NEW: Notification Center Modal */}
      <NotificationCenter 
        isOpen={isNotificationCenterOpen}
        onClose={closeNotificationCenter}
      />
    </>
  );
};

export default Navigation;