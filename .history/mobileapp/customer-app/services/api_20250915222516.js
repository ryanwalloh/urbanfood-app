import axios from 'axios';

// API Base URL - Try different options based on your setup
// Option 1: Android emulator (most common)
const API_BASE_URL = 'http://10.0.2.2:8000';

// Option 2: If above doesn't work, try these:
// const API_BASE_URL = 'http://127.0.0.1:8000'; // iOS simulator
// const API_BASE_URL = 'http://localhost:8000'; // Alternative localhost
// const API_BASE_URL = 'http://192.168.1.100:8000'; // Replace with your actual IP

console.log('🌐 Using API Base URL:', API_BASE_URL);

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

// Test multiple URLs to find the working one
const testMultipleUrls = async () => {
  const urls = [
    'http://10.0.2.2:8000',  // Android emulator
    'http://127.0.0.1:8000',  // iOS simulator
    'http://localhost:8000',  // Alternative localhost
    'http://192.168.254.103:8000',  // Your computer's IP address
  ];
  
  for (const url of urls) {
    try {
      console.log(`🔍 Testing URL: ${url}`);
      const testApi = axios.create({ baseURL: url, timeout: 5000 });
      const response = await testApi.get('/');
      console.log(`✅ Working URL found: ${url}`);
      return url;
    } catch (error) {
      console.log(`❌ URL failed: ${url} - ${error.message}`);
    }
  }
  
  return null;
};

// API Service Functions
export const apiService = {
  // Test connection to Django backend
  testConnection: async () => {
    console.log('🔍 Testing connection to:', API_BASE_URL);
    
    // First try to find a working URL
    console.log('🔍 Testing multiple URLs to find working one...');
    const workingUrl = await testMultipleUrls();
    
    if (!workingUrl) {
      return {
        success: false,
        error: 'No working URL found',
        message: 'Cannot reach Django server on any URL!',
        details: {
          testedUrls: ['http://10.0.2.2:8000', 'http://127.0.0.1:8000', 'http://localhost:8000', 'http://192.168.254.103:8000'],
          suggestion: 'Make sure Django server is running: python manage.py runserver'
        }
      };
    }
    
    console.log(`✅ Using working URL: ${workingUrl}`);
    
    // Now test the API endpoint with the working URL
    try {
      const testApi = axios.create({ baseURL: workingUrl, timeout: 10000 });
      console.log('📡 Making request to /api/users/');
      const response = await testApi.get('/api/users/');
      console.log('✅ API request successful!', response.data);
      return {
        success: true,
        data: response.data,
        message: `Connection successful! Using URL: ${workingUrl}`,
        workingUrl: workingUrl
      };
    } catch (error) {
      console.log('❌ API request failed:', error);
      return {
        success: false,
        error: error.message,
        message: 'API request failed!',
        details: {
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: `${workingUrl}/api/users/`,
          workingUrl: workingUrl
        }
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
