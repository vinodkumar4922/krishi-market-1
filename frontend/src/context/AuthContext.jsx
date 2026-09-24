import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('krishi_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.data.user);
          setFarmer(res.data.data.farmer);
        }
      } catch (err) {
        localStorage.removeItem('krishi_token');
        localStorage.removeItem('krishi_user');
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { user, farmer, accessToken } = res.data.data;
      localStorage.setItem('krishi_token', accessToken);
      localStorage.setItem('krishi_user', JSON.stringify(user));
      setUser(user);
      setFarmer(farmer);
      return { success: true, user, farmer };
    }
    return { success: false, message: res.data.message };
  };

  const signupConsumer = async (formData) => {
    const res = await api.post('/auth/signup/consumer', formData);
    if (res.data.success) {
      const { user, accessToken } = res.data.data;
      localStorage.setItem('krishi_token', accessToken);
      localStorage.setItem('krishi_user', JSON.stringify(user));
      setUser(user);
      return { success: true, user };
    }
    return { success: false, message: res.data.message };
  };

  const signupFarmer = async (formData) => {
    const res = await api.post('/auth/signup/farmer', formData);
    if (res.data.success) {
      const { user, farmer, accessToken } = res.data.data;
      localStorage.setItem('krishi_token', accessToken);
      localStorage.setItem('krishi_user', JSON.stringify(user));
      setUser(user);
      setFarmer(farmer);
      return { success: true, user, farmer };
    }
    return { success: false, message: res.data.message };
  };

  const logout = () => {
    localStorage.removeItem('krishi_token');
    localStorage.removeItem('krishi_user');
    setUser(null);
    setFarmer(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        farmer,
        loading,
        isAuthenticated: !!user,
        role: user?.role || null,
        login,
        signupConsumer,
        signupFarmer,
        logout,
        setFarmer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
