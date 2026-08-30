import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token from localStorage if available
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('agentflow_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('agentflow_token');
        localStorage.removeItem('agentflow_user');
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
