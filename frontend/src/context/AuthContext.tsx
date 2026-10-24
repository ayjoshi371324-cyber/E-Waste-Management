import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  balance: number;
  refreshUser: () => Promise<void>;
  login: (email: string, pass: string) => Promise<User>;
  register: (data: { email: string; password: string; full_name: string; role_id?: number; phone?: string }) => Promise<User>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isCenterRep: boolean;
  isCitizen: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const me = await api.getMe();
      setUser(me);
      if (me) {
        try {
          const bal = await api.getMyBalance();
          setBalance(bal.current_balance);
        } catch {
          // ignore balance fetch if unneeded
        }
      }
    } catch {
      setUser(null);
      setBalance(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const u = await api.login({ email, password: pass });
      setUser(u);
      const bal = await api.getMyBalance();
      setBalance(bal.current_balance);
      return u;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: { email: string; password: string; full_name: string; role_id?: number; phone?: string }) => {
    setLoading(true);
    try {
      const u = await api.register(data);
      // automatically login after register
      await api.login({ email: data.email, password: data.password });
      setUser(u);
      setBalance(0);
      return u;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setBalance(0);
    }
  };

  const isAdmin = user?.role === 'admin' || user?.role_id === 1;
  const isCenterRep = user?.role === 'center_representative' || user?.role_id === 3;
  const isCitizen = user?.role === 'user' || user?.role_id === 2;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        balance,
        refreshUser,
        login,
        register,
        logout,
        isAdmin,
        isCenterRep,
        isCitizen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
