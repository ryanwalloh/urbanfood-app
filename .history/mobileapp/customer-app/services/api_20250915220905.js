import axios from 'axios';

// API Base URL - Update this to your Django server URL
// For Android emulator, use 10.0.2.2 instead of 127.0.0.1
// For physical device, use your computer's IP address
const API_BASE_URL = 'http://10.0.2.2:8000'; // Android emulator
// const API_BASE_URL = 'http://127.0.0.1:8000'; // iOS simulator
// const API_BASE_URL = 'http://YOUR_COMPUTER_IP:8000'; // Physical device

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      headers: config.headers,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.log('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.log('❌ API Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown',
      responseData: error.response?.data,
    });
    return Promise.reject(error);
  }
);

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
