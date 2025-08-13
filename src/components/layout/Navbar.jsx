import React from 'react';
import { Gift, Home, Star, BookOpen, LogOut, Sun, Moon } from 'lucide-react';
import Button from '@/components/ui/Button';


const Navbar = ({ user, currentPage, setCurrentPage, darkMode, setDarkMode, handleSignOut }) => {
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-pink-200 px-4 py-4 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-2xl mr-3 shadow-lg">
              <Gift className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              Celefy
            </h1>
          </div>

          <div className="hidden md:flex space-x-2">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                currentPage === 'dashboard'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
              }`}
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setCurrentPage('celebrities')}
              className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                currentPage === 'celebrities'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
              }`}
            >
              <Star className="w-4 h-4 mr-2" />
              Celebrities
            </button>
            <button
              onClick={() => setCurrentPage('stories')}
              className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                currentPage === 'stories'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
              }`}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Stories
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-3 text-gray-400 hover:text-pink-500 rounded-xl hover:bg-pink-50 transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 w-10 h-10 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-sm font-bold">
                {user?.displayName?.charAt(0) || 'F'}
              </span>
            </div>
            <span className="hidden md:block text-sm font-medium text-gray-700">
              {user?.displayName || 'Fahad Rehman'}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="md:hidden mt-4 flex space-x-2 overflow-x-auto pb-2">
        <button
          onClick={() => setCurrentPage('dashboard')}
          className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
            currentPage === 'dashboard'
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
              : 'text-gray-600 bg-white border border-pink-200'
          }`}
        >
          <Home className="w-4 h-4 mr-2" />
          Dashboard
        </button>
        <button
          onClick={() => setCurrentPage('celebrities')}
          className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
            currentPage === 'celebrities'
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
              : 'text-gray-600 bg-white border border-pink-200'
          }`}
        >
          <Star className="w-4 h-4 mr-2" />
          Celebrities
        </button>
        <button
          onClick={() => setCurrentPage('stories')}
          className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
            currentPage === 'stories'
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
              : 'text-gray-600 bg-white border border-pink-200'
          }`}
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Stories
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
