import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosInstance';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(window.localStorage.getItem('pp_clipper_access_token'));
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      setUser(res.data.user);
      setAccessToken(res.data.accessToken);
      window.localStorage.setItem('pp_clipper_access_token', res.data.accessToken);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      setUser(null);
      setAccessToken(null);
      window.localStorage.removeItem('pp_clipper_access_token');
    }
  };

  const silentRefresh = async () => {
    try {
      const res = await api.get('/api/auth/refresh');
      setUser(res.data.user);
      setAccessToken(res.data.accessToken);
      window.localStorage.setItem('pp_clipper_access_token', res.data.accessToken);
    } catch (err) {
      setUser(null);
      setAccessToken(null);
      window.localStorage.removeItem('pp_clipper_access_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    silentRefresh();
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
