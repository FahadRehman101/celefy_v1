/**
 * Input Component
 * Reusable input component with multiple variants and states
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';

const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  icon = null,
  iconPosition = 'left',
  size = 'md',
  variant = 'default',
  fullWidth = true,
  className = '',
  ...props
}) => {
  // Base input styles
  const baseStyles = 'block border rounded-lg transition-all duration-200 focus:outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500';
  
  // Variant styles
  const variants = {
    default: `
      bg-white dark:bg-neutral-800 
      border-neutral-300 dark:border-neutral-600 
      text-neutral-900 dark:text-neutral-100
      focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 
      dark:focus:ring-primary-400/20 dark:focus:border-primary-400
    `,
    filled: `
      bg-neutral-100 dark:bg-neutral-800 
      border-transparent 
      text-neutral-900 dark:text-neutral-100
      focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white
      dark:focus:ring-primary-400/20 dark:focus:border-primary-400 dark:focus:bg-neutral-700
    `,
    ghost: `
      bg-transparent 
      border-transparent 
      text-neutral-900 dark:text-neutral-100
      focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white
      dark:focus:ring-primary-400/20 dark:focus:border-primary-400 dark:focus:bg-neutral-800
    `
  };
  
  // Size styles
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base'
  };
  
  // Error styles
  const errorStyles = error 
    ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' 
    : '';
  
  // Disabled styles
  const disabledStyles = disabled 
    ? 'opacity-50 cursor-not-allowed bg-neutral-50 dark:bg-neutral-900' 
    : '';
  
  // Width styles
  const widthStyles = fullWidth ? 'w-full' : '';
  
  // Icon padding adjustments
  const iconPadding = icon 
    ? iconPosition === 'left' 
      ? 'pl-10' 
      : 'pr-10' 
    : '';
  
  // Combine all styles
  const inputStyles = `
    ${baseStyles}
    ${variants[variant] || variants.default}
    ${sizes[size] || sizes.md}
    ${errorStyles}
    ${disabledStyles}
    ${widthStyles}
    ${iconPadding}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={`${fullWidth ? 'w-full' : ''} space-y-1`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Input container */}
      <div className="relative">
        {/* Left icon */}
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 dark:text-neutral-500">
            {icon}
          </div>
        )}
        
        {/* Input field */}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          required={required}
          disabled={disabled}
          className={inputStyles}
          {...props}
        />
        
        {/* Right icon */}
        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 dark:text-neutral-500">
            {icon}
          </div>
        )}
        
        {/* Error icon */}
        {error && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
            <AlertCircle className="w-4 h-4" />
          </div>
        )}
      </div>
      
      {/* Helper text or error message */}
      {(helperText || error) && (
        <p className={`text-xs ${error ? 'text-red-500' : 'text-neutral-500 dark:text-neutral-400'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

export default Input;