import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// If any request gets 401, clear the stored login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const path = window.location.pathname;
      // Only clear if we're in admin and it's not the login request itself
      if (path.startsWith('/admin') && !err.config.url.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('admin');
        window.location.href = '/admin';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
