import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * Bloomcraft Authentication Model
 * Differentiates between 'customer' (store exploration, checkout, wishlist)
 * and 'maker' (studio management, live order pipeline, inventory control).
 */
export type UserRole = 'customer' | 'maker';

export interface AuthUser {
  identifier: string; // email, phone, or username
  email?: string;
  name: string;
  role: UserRole;
  avatar: string;
  loggedInAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isMaker: boolean;
  isCustomer: boolean;
  loginCustomer: (identifier: string, name?: string) => void;
  loginMaker: (identifier: string, name?: string) => void;
  login: (identifier: string, name?: string, role?: UserRole) => void;
  logout: () => void;
}

const STORAGE_KEY = 'bloomcraft_auth_user_session_v2';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback for private browsing / blocked storage
    }
    return null;
  });

  const loginCustomer = useCallback((identifier: string, name?: string) => {
    const cleanId = identifier.trim();
    const cleanName = name?.trim() || (cleanId.includes('@') 
      ? cleanId.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : 'Lovely Customer');

    const customerUser: AuthUser = {
      identifier: cleanId,
      email: cleanId.includes('@') ? cleanId : undefined,
      name: cleanName,
      role: 'customer',
      avatar: '🌸',
      loggedInAt: new Date().toISOString(),
    };

    setUser(customerUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customerUser));
    } catch {
      // ignore
    }
  }, []);

  const loginMaker = useCallback((identifier: string, name?: string) => {
    const cleanId = identifier.trim();
    const cleanName = name?.trim() || (cleanId.toLowerCase().includes('vidhi') 
      ? 'Vidhi Singh' 
      : 'Studio Maker');

    const makerUser: AuthUser = {
      identifier: cleanId,
      email: cleanId.includes('@') ? cleanId : `${cleanId}@bloomcraft.com`,
      name: cleanName,
      role: 'maker',
      avatar: '✨',
      loggedInAt: new Date().toISOString(),
    };

    setUser(makerUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(makerUser));
    } catch {
      // ignore
    }
  }, []);

  const login = useCallback((identifier: string, name?: string, role: UserRole = 'customer') => {
    if (role === 'maker') {
      loginMaker(identifier, name);
    } else {
      loginCustomer(identifier, name);
    }
  }, [loginMaker, loginCustomer]);

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    // Multi-tab synchronization
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setUser(null);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const isMaker = user?.role === 'maker';
  const isCustomer = user?.role === 'customer';

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user, 
        isMaker, 
        isCustomer, 
        loginCustomer, 
        loginMaker, 
        login, 
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
