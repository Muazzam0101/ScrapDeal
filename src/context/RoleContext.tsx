import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole } from '../types';

interface RoleContextType {
  role: UserRole | null;
  setRole: (role: UserRole | null) => void;
  switchRole: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole | null>(null);

  const switchRole = () => {
    setRole((prev) => (prev === 'collector' ? 'recycler' : 'collector'));
  };

  return (
    <RoleContext.Provider value={{ role, setRole, switchRole }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
