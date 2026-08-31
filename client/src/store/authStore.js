import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  initAuth: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('agentflow_token');
      const userStr = localStorage.getItem('agentflow_user');
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({ user, token, isAuthenticated: true });
        } catch (e) {
          localStorage.removeItem('agentflow_token');
          localStorage.removeItem('agentflow_user');
        }
      }
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const payload = res.data?.data || res.data;
      const { user, token } = payload;
      if (token) localStorage.setItem('agentflow_token', token);
      if (user) localStorage.setItem('agentflow_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, loading: false });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.error || err.message || 'Login failed', loading: false });
      return false;
    }
  },

  register: async (name, email, password, role) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      const payload = res.data?.data || res.data;
      const { user, token } = payload;
      if (token) localStorage.setItem('agentflow_token', token);
      if (user) localStorage.setItem('agentflow_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, loading: false });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.error || err.message || 'Registration failed', loading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('agentflow_token');
    localStorage.removeItem('agentflow_user');
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  fetchProfile: async () => {
    try {
      const res = await api.get('/auth/me');
      const user = res.data;
      localStorage.setItem('agentflow_user', JSON.stringify(user));
      set({ user });
    } catch (err) {
      // Ignore or logout if invalid
    }
  }
}));
