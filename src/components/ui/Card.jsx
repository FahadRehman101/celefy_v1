/**
 * Card Component
 * Reusable card component with multiple variants and interactive states
 */

import React from 'react';

const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  interactive = false,
  onClick,
  className = '',
  ...props
}) => {
  // Base card styles
  const baseStyles = 'rounded-xl transition-all duration-200 border';
  
  // Variant styles
  const variants = {
    default: 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-soft',
    elevated: 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-medium',
    outlined: 'bg-white dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-600',
    ghost: 'bg-neutral-50 dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800',
    gradient: 'bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border-primary-200 dark:border-primary-700'
  };
  
  // Padding styles
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };
  
  // Hover styles
  const hoverStyles = hover || interactive 
    ? 'hover:shadow-medium hover:-translate-y-1 hover:border-primary-300 dark:hover:border-primary-600' 
    : '';
  
  // Interactive styles
  const interactiveStyles = interactive 
    ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-400' 
    : '';
  
  // Combine all styles
  const cardStyles = `
    ${baseStyles}
    ${variants[variant] || variants.default}
    ${paddings[padding] || paddings.md}
    ${hoverStyles}
    ${interactiveStyles}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // Handle click events
  const handleClick = (e) => {
    if (interactive && onClick) {
      onClick(e);
    }
  };

  const handleKeyDown = (e) => {
    if (interactive && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e);
    }
  };

  const CardComponent = interactive ? 'button' : 'div';

  return (
    <CardComponent
      className={cardStyles}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? 'button' : undefined}
      {...props}
    >
      {children}
    </CardComponent>
  );
};

// Card Header Component
const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    {children}
  </div>
);

// Card Title Component
const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-neutral-900 dark:text-neutral-100 ${className}`}>
    {children}
  </h3>
);

// Card Description Component
const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-neutral-600 dark:text-neutral-400 ${className}`}>
    {children}
  </p>
);

// Card Content Component
const CardContent = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

// Card Footer Component
const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700 ${className}`}>
    {children}
  </div>
);

// Export all components
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;