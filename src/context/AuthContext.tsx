import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, authStorage } from '../services/api';
import { UserRole } from '../types';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  preferredRole?: string;
  isBlocked?: boolean;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    fullName: string,
    email: string,
    password: string,
    role?: string,
    preferredRole?: string
  ) => Promise<{ success?: boolean; message?: string; token?: string; user?: any }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cachedUser = authStorage.getUser();
  const existingToken = authStorage.getToken();
  const [user, setUser] = useState<User | null>(cachedUser);
  const [token, setToken] = useState<string | null>(existingToken);
  // Only block if we have a token but no cached user yet
  const [isLoading, setIsLoading] = useState<boolean>(!!existingToken && !cachedUser);

  const fetchCurrentUser = async () => {
    const currentToken = authStorage.getToken();
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      // 5-second timeout fail-safe so slow connections never freeze the UI permanently
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Session verification timeout')), 5000)
      );
      const res = (await Promise.race([api.auth.me(), timeoutPromise])) as any;
      if (res && res.user) {
        setUser(res.user);
        authStorage.setUser(res.user);
      }
    } catch (err) {
      console.warn('Session check failed or timed out, clearing token:', err);
      authStorage.clearToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Synchronize authentication state across browser tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'interviewai_auth_token' || e.key === 'interviewai_user_cache') {
        const updatedToken = authStorage.getToken();
        const updatedUser = authStorage.getUser();
        setToken(updatedToken);
        setUser(updatedUser);
        if (updatedToken && !updatedUser) {
          fetchCurrentUser();
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = async (email: string, password: string) => {
    // Note: Do not set global setIsLoading(true) here! AuthModal maintains localized button loading state.
    const res = await api.auth.login({ email, password });
    authStorage.setToken(res.token);
    authStorage.setUser(res.user);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    role?: string,
    preferredRole?: string
  ) => {
    // Note: Do not set global setIsLoading(true) here!
    const res = await api.auth.register({ fullName, email, password, role, preferredRole });
    if (res.token && res.user) {
      authStorage.setToken(res.token);
      authStorage.setUser(res.user);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {}
    authStorage.clearToken();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
