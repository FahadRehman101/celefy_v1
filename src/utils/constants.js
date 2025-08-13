/**
 * Application Constants
 * Centralized place for all app constants and configuration
 */

// App metadata
export const APP_NAME = 'Celefy';
export const APP_DESCRIPTION = 'Never miss a birthday again';
export const APP_VERSION = '2.0.0';

// Firebase collection names
export const COLLECTIONS = {
  BIRTHDAYS: 'birthdays',
  USERS: 'users',
  NOTIFICATIONS: 'notifications'
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  SHORT: 'MMM dd',
  LONG: 'MMMM dd, yyyy'
};

// Relationship options for birthday entries
export const RELATIONSHIP_OPTIONS = [
  'Family',
  'Friend',
  'Colleague',
  'Partner',
  'Sibling',
  'Parent',
  'Child',
  'Grandparent',
  'Cousin',
  'Neighbor',
  'Mentor',
  'Other'
];

// Theme options
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// Breakpoints (matching Tailwind)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536
};

// Animation durations (in milliseconds)
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500
};

// Storage keys for localStorage
export const STORAGE_KEYS = {
  THEME: 'celefy-theme',
  VIEW_PREFERENCE: 'celefy-view',
  LAST_VISITED: 'celefy-last-visit',
  NOTIFICATION_PROMPT_DELAY: 'celefy-notification-prompt-delay',
  NOTIFICATION_PROMPT_DISMISSED: 'celefy-notification-prompt-dismissed'
};

// Filter options
export const FILTER_OPTIONS = {
  ALL: 'all',
  THIS_MONTH: 'this-month',
  UPCOMING: 'upcoming',
  TODAY: 'today'
};

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  AUTH_FAILED: 'Authentication failed. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  VALIDATION: 'Please fill in all required fields.',
  DELETE_FAILED: 'Failed to delete birthday. Please try again.',
  ADD_FAILED: 'Failed to add birthday. Please try again.'
};