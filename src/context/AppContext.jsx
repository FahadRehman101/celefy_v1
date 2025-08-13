import React, { createContext, useState } from 'react';

// Create context
export const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const value = {
    selectedFilter,
    setSelectedFilter
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
