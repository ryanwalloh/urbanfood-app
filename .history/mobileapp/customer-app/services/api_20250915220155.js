import axios from 'axios';

// API Base URL - Update this to your Django server URL
const API_BASE_URL = 'http://127.0.0.1:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API Service Functions
export const apiService = {
  // Test connection to Django backend
  testConnection: async () => {
    try {
      const response = await api.get('/api/users/');
      return {
        success: true,
        data: response.data,
        message: 'Connection successful!'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Connection failed!'
      };
    }
  },

  // Login with email and password
  login: async (email, password) => {
    try {
      const response = await api.post('/loginByPassword/', {
        email: email,
        password: password,
      }, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      return {
        success: true,
        data: response.data,
        message: 'Login successful!'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        message: 'Login failed!'
      };
    }
  },

  // Request magic link
  requestMagicLink: async (email) => {
    try {
      const response = await api.post('/request-magic-link/', {
        email: email,
      }, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      return {
        success: true,
        data: response.data,
        message: 'Magic link sent!'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        message: 'Magic link request failed!'
      };
    }
  },

  // Register new account
  register: async (email, password, firstName, lastName, role = 'customer') => {
    try {
      const response = await api.post('/registerAccount/', {
        email: email,
        password: password,
        first_name: firstName,
        last_name: lastName,
        role: role,
      }, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      return {
        success: true,
        data: response.data,
        message: 'Registration successful!'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        message: 'Registration failed!'
      };
    }
  },

  // Get restaurants
  getRestaurants: async () => {
    try {
      const response = await api.get('/api/products/');
      return {
        success: true,
        data: response.data,
        message: 'Restaurants loaded!'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to load restaurants!'
      };
    }
  },
};

export default api;
