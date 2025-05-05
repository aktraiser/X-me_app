'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type NavVisibilityContextType = {
  isNavVisible: boolean;
  setNavVisible: (visible: boolean) => void;
};

const NavVisibilityContext = createContext<NavVisibilityContextType | undefined>(undefined);

export function NavVisibilityProvider({ children }: { children: ReactNode }) {
  const [isNavVisible, setIsNavVisible] = useState(true);

  const setNavVisible = (visible: boolean) => {
    setIsNavVisible(visible);
  };

  return (
    <NavVisibilityContext.Provider value={{ isNavVisible, setNavVisible }}>
      {children}
    </NavVisibilityContext.Provider>
  );
}

export function useNavVisibility() {
  const context = useContext(NavVisibilityContext);
  
  if (context === undefined) {
    throw new Error('useNavVisibility doit être utilisé avec NavVisibilityProvider');
  }
  
  return context;
} 