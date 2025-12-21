import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const checkLoginStatus = useCallback(async () => {
    setAuthLoading(true);
    try {
      const response = await api.get('/login/check');
      if (response.data.data.isLoggedIn) {
        const userRes = await api.get('/user/mine');
        setCurrentUser(userRes.data.data);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Failed to check login status:', error);
      setIsLoggedIn(false);
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

  const logout = useCallback(async () => {
    try {
      await api.delete('/api/logout');
    } catch (error) {
      console.error('Failed to logout:', error);
    } finally {
      setIsLoggedIn(false);
      setCurrentUser(null);
    }
  }, []);

  const value = useMemo(() => ({
    isLoggedIn,
    currentUser,
    authLoading,
    checkLoginStatus,
    logout
  }), [isLoggedIn, currentUser, authLoading, checkLoginStatus, logout]);

  return (
    <AuthContext.Provider value={value}>
      {!authLoading && children}
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
