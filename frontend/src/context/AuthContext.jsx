import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import socketService from '../services/socket';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.getMe();
      setUser(response.data.data);
      setIsAuthenticated(true);

      // Connect socket (non-blocking)
      try {
        socketService.connect(token);
      } catch (socketError) {
        console.warn('Socket connection failed:', socketError);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { data, token } = response.data;

      localStorage.setItem('token', token);
      setUser(data);
      setIsAuthenticated(true);

      // Connect socket (non-blocking)
      try {
        socketService.connect(token);
      } catch (socketError) {
        console.warn('Socket connection failed:', socketError);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await authAPI.register({ name, email, password });
      const { data, token } = response.data;

      localStorage.setItem('token', token);
      setUser(data);
      setIsAuthenticated(true);

      // Connect socket (non-blocking)
      try {
        socketService.connect(token);
      } catch (socketError) {
        console.warn('Socket connection failed:', socketError);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    socketService.disconnect();
  };

  const handleGoogleLogin = () => {
    authAPI.googleLogin();
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    handleGoogleLogin,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
