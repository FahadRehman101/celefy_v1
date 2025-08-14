import React, { useState } from 'react';
import { Menu, X, Sun, Moon, User, LogOut } from 'lucide-react';
import NotificationBell from '@/components/ui/NotificationBell';
import NotificationCenter from '@/components/ui/NotificationCenter';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const openNotificationCenter = () => {
    setIsNotificationCenterOpen(true);
  };

  const closeNotificationCenter = () => {
    setIsNotificationCenterOpen(false);
  };

  return (
    <>
      <nav className="bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                  🎂 Celefy
                </h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {/* 🎯 NEW: Notification Bell */}
              <div className="relative z-10 bg-blue-100 dark:bg-blue-900 p-1 rounded">
                <button 
                  onClick={openNotificationCenter}
                  className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                  aria-label="Test Notifications"
                >
                  🔔 TEST
                </button>
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Test User
                </div>
                <button
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
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

export default Navbar;
