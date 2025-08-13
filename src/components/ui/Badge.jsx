/**
 * Badge Component
 * Small status or label indicator with multiple variants
 */

import React from 'react';

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = ''
}) => {
  // Base badge styles
  const baseStyles = 'inline-flex items-center font-medium rounded-full whitespace-nowrap';
  
  // Variant styles
  const variants = {
    default: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200',
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
    secondary: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-300',
    accent: 'bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    outline: 'border border-neutral-300 text-neutral-700 bg-transparent dark:border-neutral-600 dark:text-neutral-300'
  };
  
  // Size styles
  const sizes = {
    sm: dot ? 'w-2 h-2' : 'px-2 py-0.5 text-xs',
    md: dot ? 'w-2.5 h-2.5' : 'px-2.5 py-1 text-xs',
    lg: dot ? 'w-3 h-3' : 'px-3 py-1 text-sm'
  };
  
  // Combine all styles
  const badgeStyles = `
    ${baseStyles}
    ${variants[variant] || variants.default}
    ${sizes[size] || sizes.md}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // Render dot badge
  if (dot) {
    return <span className={badgeStyles} />;
  }

  return (
    <span className={badgeStyles}>
      {children}
    </span>
  );
};

// Predefined badge variants for common use cases
export const StatusBadge = ({ status, className = '' }) => {
  const statusConfig = {
    active: { variant: 'success', text: 'Active' },
    inactive: { variant: 'default', text: 'Inactive' },
    pending: { variant: 'warning', text: 'Pending' },
    error: { variant: 'danger', text: 'Error' },
    success: { variant: 'success', text: 'Success' }
  };
  
  const config = statusConfig[status] || statusConfig.inactive;
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.text}
    </Badge>
  );
};

// Count badge for showing numbers
export const CountBadge = ({ count, max = 99, className = '' }) => {
  const displayCount = count > max ? `${max}+` : count;
  
  return (
    <Badge variant="primary" size="sm" className={className}>
      {displayCount}
    </Badge>
  );
};

// Notification dot
export const NotificationDot = ({ show = true, className = '' }) => {
  if (!show) return null;
  
  return (
    <Badge
      dot
      variant="danger"
      size="sm"
      className={`absolute -top-1 -right-1 ${className}`}
    />
  );
};

export default Badge;