import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // Send HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for unified error formatting
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      (typeof error.response?.data === 'string' && error.response?.data.length < 200 ? error.response?.data : null) ||
      error.message ||
      'An unexpected network error occurred';
    return Promise.reject(new Error(message));
  }
);

export default api;
