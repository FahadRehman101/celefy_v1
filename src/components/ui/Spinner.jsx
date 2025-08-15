/**
 * Spinner Component
 * Loading spinner with multiple sizes and variants
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

const Spinner = ({
  size = 'md',
  variant = 'primary',
  className = '',
  text = null,
  fullScreen = false
}) => {
  // Size styles
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };
  
  // Variant styles
  const variants = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    accent: 'text-accent-600',
    neutral: 'text-neutral-600',
    white: 'text-white'
  };
  
  // Spinner styles
  const spinnerStyles = `
    animate-spin
    ${sizes[size] || sizes.md}
    ${variants[variant] || variants.primary}
    ${className}
  `.trim().replace(/\s+/g, ' ');
  
  // Container styles
  const containerStyles = fullScreen 
    ? 'fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm z-50'
    : 'flex items-center justify-center';

  const content = (
    <div className={`${containerStyles} ${text ? 'flex-col space-y-2' : ''}`}>
      <Loader2 className={spinnerStyles} />
      {text && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  return content;
};

// Inline spinner for buttons and small spaces
export const InlineSpinner = ({ size = 'sm', className = '' }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };
  
  return (
    <Loader2 className={`animate-spin ${sizeClasses[size] || 'w-4 h-4'} ${className}`} />
  );
};

// Page loading spinner
export const PageSpinner = ({ text = 'Loading...' }) => (
  <Spinner size="lg" fullScreen text={text} />
);

// Button spinner
export const ButtonSpinner = ({ size = 'sm' }) => (
  <Spinner size={size} variant="white" />
);

export default Spinner;