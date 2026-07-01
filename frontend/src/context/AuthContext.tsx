'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/api';

interface IUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin';
  placementReadinessScore: number;
  aptitudeScore: number;
  codingScore: number;
  hrScore: number;
  resumeScore: number;
  streak: number;
  subscription: {
    plan: 'Free' | 'Monthly' | 'Yearly';
    status: 'active' | 'inactive' | 'cancelled';
    currentPeriodEnd?: string;
  };
  bookmarks: string[];
}

interface AuthContextType {
  user: IUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  googleLogin: (payload: { credential?: string; name: string; email: string; avatar?: string }) => Promise<{ success: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        setUser(response.data.user);
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        router.push('/dashboard');
        return { success: true };
      }
      return { success: false, message: response.data.message || 'Login failed' };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Invalid credentials' 
      };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      if (response.data.success) {
        setUser(response.data.user);
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        router.push('/dashboard');
        return { success: true };
      }
      return { success: false, message: response.data.message || 'Registration failed' };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error occurred during registration' 
      };
    }
  };

  const googleLogin = async (payload: { credential?: string; name: string; email: string; avatar?: string }) => {
    try {
      const response = await api.post('/auth/google', payload);
      if (response.data.success) {
        setUser(response.data.user);
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        router.push('/dashboard');
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error('Google login auth error:', error);
      return { success: false };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // ignore logout errors
    } finally {
      setUser(null);
      localStorage.removeItem('token');
      router.push('/auth/login');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, googleLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
