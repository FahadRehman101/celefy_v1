// Create: src/components/common/Modal.jsx
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ 
  isOpen, 
  onClose, 
  children, 
  showCloseButton = true,
  className = '',
  overlayClassName = '',
  fullScreen = false // 🎯 NEW: Full screen option
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Don't render if not open
  if (!isOpen) return null;

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className={`fixed inset-0 bg-gradient-to-br from-black/80 via-purple-900/70 to-pink-900/70 backdrop-blur-sm flex items-center justify-center z-50 ${overlayClassName}`}
      onClick={handleBackdropClick}
    >
      <div 
        className={`${
          fullScreen 
            ? 'w-full h-full max-w-none max-h-none rounded-none' // 🎯 FULL SCREEN
            : 'max-w-md w-full max-h-[90vh] rounded-2xl' // 🎯 REGULAR MODAL
        } bg-gradient-to-br from-white via-pink-50 to-purple-50 dark:from-gray-900 dark:via-pink-900/20 dark:to-purple-900/20 shadow-2xl overflow-y-auto relative border border-pink-200/50 dark:border-pink-700/50 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 🎯 ENHANCED CLOSE BUTTON - Full screen optimized */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 z-10 ${
              fullScreen ? 'top-6 right-6 p-3' : 'top-4 right-4 p-2'
            }`}
          >
            <X className={`text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors ${
              fullScreen ? 'w-6 h-6' : 'w-5 h-5'
            }`} />
          </button>
        )}

        {/* 🎯 MODAL CONTENT - Full screen optimized */}
        <div className={`${
          fullScreen ? 'p-6 md:p-8 lg:p-12' : 'p-6'
        }`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;