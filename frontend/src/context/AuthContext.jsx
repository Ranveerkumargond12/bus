import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('safarsathi_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('safarsathi_token') || null);
  const [loading, setLoading] = useState(true);

  // Sync with server on initial mount if token exists
  useEffect(() => {
    async function verifySession() {
      if (token) {
        try {
          const res = await api.auth.me();
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('safarsathi_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('Session verification failed, logging out:', err);
          logout();
        }
      }
      setLoading(false);
    }
    verifySession();
  }, [token]);

  const login = async (credentials) => {
    const res = await api.auth.login(credentials);
    if (res.success && res.user) {
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('safarsathi_user', JSON.stringify(res.user));
      localStorage.setItem('safarsathi_token', res.token);
      // Legacy compatibility
      localStorage.setItem('travelgo_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (userData) => {
    const res = await api.auth.register(userData);
    if (res.success && res.user) {
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('safarsathi_user', JSON.stringify(res.user));
      localStorage.setItem('safarsathi_token', res.token);
      localStorage.setItem('travelgo_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('safarsathi_user');
    localStorage.removeItem('safarsathi_token');
    localStorage.removeItem('travelgo_user');
  };

  const updateWalletBalance = (newBalance) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, wallet_balance: newBalance };
      localStorage.setItem('safarsathi_user', JSON.stringify(updated));
      localStorage.setItem('travelgo_user', JSON.stringify(updated));
      return updated;
    });
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await api.auth.me();
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('safarsathi_user', JSON.stringify(res.user));
      }
    } catch (e) {}
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateWalletBalance,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

