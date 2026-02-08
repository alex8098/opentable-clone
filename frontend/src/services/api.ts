import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AuthResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  
  register: (name: string, email: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { name, email, password }),
  
  me: () => api.get('/auth/me'),
};

// Restaurant API
export const restaurantAPI = {
  getAll: (params?: { cuisine?: string; city?: string; search?: string }) =>
    api.get('/restaurants', { params }),
  
  getById: (id: string) => api.get(`/restaurants/${id}`),
  
  getAvailableSlots: (id: string, date: string, partySize: number) =>
    api.get(`/restaurants/${id}/availability`, { params: { date, partySize } }),
};

// Booking API
export const bookingAPI = {
  create: (data: {
    restaurantId: string;
    date: string;
    time: string;
    partySize: number;
    specialRequests?: string;
  }) => api.post('/bookings', data),
  
  getMyBookings: () => api.get('/bookings/my'),
  
  cancel: (id: string) => api.patch(`/bookings/${id}/cancel`),
};

// Review API
export const reviewAPI = {
  getByRestaurant: (restaurantId: string) =>
    api.get(`/reviews/restaurant/${restaurantId}`),
  
  create: (data: {
    restaurantId: string;
    rating: number;
    comment: string;
  }) => api.post('/reviews', data),
};

export default api;
