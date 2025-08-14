// Create: src/components/common/Modal.jsx
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ 
  isOpen, 
  onClose, 
  children, 
  showCloseButton = true,
  className = '',
  overlayClassName = '' 
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
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${overlayClassName}`}
      onClick={handleBackdropClick}
    >
      <div 
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;