/**
 * Date Utility Functions
 * Helper functions for date manipulation and formatting
 */

/**
 * Format a date string for display
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {string} format - Format type ('short', 'long', 'display')
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, format = 'display') => {
  if (!dateString) return '';
  
  const date = new Date(dateString + 'T00:00:00');
  
  const options = {
    short: { month: 'short', day: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    display: { month: 'short', day: 'numeric', year: 'numeric' }
  };
  
  return date.toLocaleDateString('en-US', options[format] || options.display);
};

/**
 * Get the current date in YYYY-MM-DD format
 * @returns {string} Current date string
 */
export const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

/**
 * Check if a birthday is today
 * @param {string} birthdayDate - Birthday date in YYYY-MM-DD format
 * @returns {boolean} True if birthday is today
 */
export const isBirthdayToday = (birthdayDate) => {
  if (!birthdayDate) return false;
  
  const today = new Date();
  const birthday = new Date(birthdayDate + 'T00:00:00');
  
  return today.getMonth() === birthday.getMonth() && 
         today.getDate() === birthday.getDate();
};

/**
 * Check if a birthday is in the current month
 * @param {string} birthdayDate - Birthday date in YYYY-MM-DD format
 * @returns {boolean} True if birthday is this month
 */
export const isBirthdayThisMonth = (birthdayDate) => {
  if (!birthdayDate) return false;
  
  const today = new Date();
  const birthday = new Date(birthdayDate + 'T00:00:00');
  
  return today.getMonth() === birthday.getMonth();
};

/**
 * Calculate days until next birthday
 * @param {string} birthdayDate - Birthday date in YYYY-MM-DD format
 * @returns {number} Days until birthday (0 if today, negative if passed this year)
 */
export const getDaysUntilBirthday = (birthdayDate) => {
  if (!birthdayDate) return 0;
  
  const today = new Date();
  const birthday = new Date(birthdayDate + 'T00:00:00');
  
  // Set birthday to current year
  const nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
  
  // If birthday has passed this year, set to next year
  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }
  
  // Calculate difference in days
  const diffTime = nextBirthday - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Get upcoming birthdays within a specified number of days
 * @param {Array} birthdays - Array of birthday objects
 * @param {number} days - Number of days to look ahead (default: 30)
 * @returns {Array} Filtered and sorted array of upcoming birthdays
 */
export const getUpcomingBirthdays = (birthdays, days = 30) => {
  return birthdays
    .filter(birthday => {
      const daysUntil = getDaysUntilBirthday(birthday.date);
      return daysUntil >= 0 && daysUntil <= days;
    })
    .sort((a, b) => getDaysUntilBirthday(a.date) - getDaysUntilBirthday(b.date));
};

/**
 * Get birthdays for the current month
 * @param {Array} birthdays - Array of birthday objects
 * @returns {Array} Filtered array of birthdays this month
 */
export const getThisMonthBirthdays = (birthdays) => {
  return birthdays.filter(birthday => isBirthdayThisMonth(birthday.date));
};

/**
 * Get today's birthdays
 * @param {Array} birthdays - Array of birthday objects
 * @returns {Array} Filtered array of today's birthdays
 */
export const getTodayBirthdays = (birthdays) => {
  return birthdays.filter(birthday => isBirthdayToday(birthday.date));
};

/**
 * Calculate age based on birthday
 * @param {string} birthdayDate - Birthday date in YYYY-MM-DD format
 * @returns {number} Current age
 */
export const calculateAge = (birthdayDate) => {
  if (!birthdayDate) return 0;
  
  const today = new Date();
  const birthday = new Date(birthdayDate + 'T00:00:00');
  let age = today.getFullYear() - birthday.getFullYear();
  
  const monthDiff = today.getMonth() - birthday.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Get a human-readable time until birthday
 * @param {string} birthdayDate - Birthday date in YYYY-MM-DD format
 * @returns {string} Human-readable time until birthday
 */
export const getTimeUntilBirthday = (birthdayDate) => {
  const days = getDaysUntilBirthday(birthdayDate);
  
  if (days === 0) return 'Today!';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `${days} days`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? '1 week' : `${weeks} weeks`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? '1 month' : `${months} months`;
  }
  
  return 'Next year';
};
export const calculateDaysUntilBirthday = getDaysUntilBirthday;
