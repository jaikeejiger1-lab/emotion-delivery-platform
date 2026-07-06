/**
 * AuthContext.jsx
 *
 * Provides authentication state (user, token) to the entire app.
 * Persists token in localStorage; exposes login/logout/register helpers.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('edp_user');
    const savedToken = localStorage.getItem('edp_token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      document.cookie = `edp_token=${savedToken}; path=/; max-age=604800; samesite=lax`;
    }
    setLoading(false);
  }, []);

  const persistAuth = (token, userData) => {
    localStorage.setItem('edp_token', token);
    localStorage.setItem('edp_user', JSON.stringify(userData));
    document.cookie = `edp_token=${token}; path=/; max-age=604800; samesite=lax`;
    setUser(userData);
  };

  const register = useCallback(async (formData) => {
    const res = await axiosClient.post('/auth/register', formData);
    if (res && res.token && res.data) {
      persistAuth(res.token, res.data);
    }
    toast.success(res.message || 'Registration successful! Welcome! 🎉');
    return res;
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await axiosClient.post('/auth/login', { email, password });
    persistAuth(res.token, res.data);
    toast.success(`Welcome back, ${res.data.firstName}! 💖`);
    return res;
  }, []);

  const forgotPassword = useCallback(async (phone) => {
    const res = await axiosClient.post('/auth/forgot-password', { phone });
    toast.success(res.message || 'OTP sent successfully! 📱');
    return res;
  }, []);

  const verifyOtpReset = useCallback(async (phone, otp, newPassword) => {
    const res = await axiosClient.post('/auth/verify-otp-reset', { phone, otp, newPassword });
    persistAuth(res.token, res.data);
    toast.success(`Password reset successful! Welcome, ${res.data.firstName}! 💖`);
    return res;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('edp_token');
    localStorage.removeItem('edp_user');
    document.cookie = 'edp_token=; path=/; max-age=0';
    setUser(null);
    toast('Logged out', { icon: '👋' });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, forgotPassword, verifyOtpReset, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
