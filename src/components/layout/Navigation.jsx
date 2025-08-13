import React from 'react';
import { Home, Star, BookOpen, LogOut, Sun, Moon } from 'lucide-react';

const Navigation = ({ user, currentPage, setCurrentPage, darkMode, setDarkMode, handleSignOut }) => {
  return (
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
        <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full flex items-center justify-center font-semibold">
          {user?.displayName?.charAt(0) || 'U'}
        </div>
        <span className="text-sm font-medium text-gray-700">{user?.displayName}</span>
        <button onClick={handleSignOut}>
          <LogOut className="w-5 h-5 text-gray-600 hover:text-red-500" />
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
