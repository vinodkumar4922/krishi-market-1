import api from './api';
import { storage } from '../utils/storage';

export const authService = {
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    if (res.data?.data?.accessToken) {
      storage.setToken(res.data.data.accessToken);
      storage.setUser(res.data.data.user);
    }
    return res.data;
  },

  registerConsumer: async (data) => {
    const res = await api.post('/auth/signup/consumer', data);
    if (res.data?.data?.accessToken) {
      storage.setToken(res.data.data.accessToken);
      storage.setUser(res.data.data.user);
    }
    return res.data;
  },

  registerFarmer: async (data) => {
    const res = await api.post('/auth/signup/farmer', data);
    if (res.data?.data?.accessToken) {
      storage.setToken(res.data.data.accessToken);
      storage.setUser(res.data.data.user);
    }
    return res.data;
  },

  getCurrentUser: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Continue cleanup on client regardless
    } finally {
      storage.clear();
    }
  },
};
