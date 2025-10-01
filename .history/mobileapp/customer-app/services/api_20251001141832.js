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

// Cache the working URL to avoid repeated testing (null to force detection on first call)
let cachedWorkingUrl = null;

// Test multiple URLs to find the working one
const testMultipleUrls = async () => {
  // Return cached URL if available
  if (cachedWorkingUrl) {
    console.log(`🚀 Using cached working URL: ${cachedWorkingUrl}`);
    return cachedWorkingUrl;
  }

  const urls = [
    'http://10.0.2.2:8000',  // Android emulator
    'http://127.0.0.1:8000',  // iOS simulator
    'http://localhost:8000',  // Alternative localhost
    'http://192.168.254.111:8000',  // Detected current host IP
    'http://192.168.254.103:8000',  // Previous host IP
  ];
  
  for (const url of urls) {
    try {
      console.log(`🔍 Testing URL: ${url}`);
      const testApi = axios.create({ baseURL: url, timeout: 5000 });
      const response = await testApi.get('/');
      console.log(`✅ Working URL found: ${url}`);
      // Cache the working URL
      cachedWorkingUrl = url;
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
      console.log('🔐 Attempting login for:', email);
      
      // Use cached URL or find working URL
      let workingUrl = cachedWorkingUrl;
      if (!workingUrl) {
        workingUrl = await testMultipleUrls();
        if (!workingUrl) {
          return {
            success: false,
            error: 'No working URL found',
            message: 'Cannot reach Django server!'
          };
        }
      }
      
      console.log('🌐 Using working URL for login:', workingUrl);
      
      // Create a new axios instance with the working URL
      const loginApi = axios.create({
        baseURL: workingUrl,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await loginApi.post('/loginByPassword/', {
        email: email,
        password: password,
      }, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      console.log('✅ Login response:', response.data);
      
      // Return the response data directly (Django already sends success/error)
      return response.data;
    } catch (error) {
      console.log('❌ Login error:', error);
      // If login fails, clear cached URL and try again next time
      cachedWorkingUrl = null;
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Login failed',
        message: 'Login failed!'
      };
    }
  },

  // Request magic link
  requestMagicLink: async (email) => {
    try {
      // Use cached URL or find working URL
      let workingUrl = cachedWorkingUrl;
      if (!workingUrl) {
        workingUrl = await testMultipleUrls();
        if (!workingUrl) {
          return {
            success: false,
            error: 'No working URL found',
            message: 'Cannot reach Django server!'
          };
        }
      }
      
      const magicLinkApi = axios.create({
        baseURL: workingUrl,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await magicLinkApi.post('/request-magic-link/', {
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

  // Get user data by email
  getUserData: async (email) => {
    try {
      console.log('👤 Fetching user data for:', email);
      
      // Use cached URL or find working URL
      let workingUrl = cachedWorkingUrl;
      if (!workingUrl) {
        workingUrl = await testMultipleUrls();
        if (!workingUrl) {
          return {
            success: false,
            error: 'No working URL found',
            message: 'Cannot reach Django server!'
          };
        }
      }
      
      const userApi = axios.create({
        baseURL: workingUrl,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await userApi.get(`/api/users/?email=${email}`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      
      console.log('✅ User data response:', response.data);
      
      if (response.data && response.data.length > 0) {
        const user = response.data[0];
        return {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          // Note: Address data would need to be fetched separately if needed
        };
      } else {
        return {
          success: false,
          error: 'User not found',
          message: 'User data not found!'
        };
      }
    } catch (error) {
      console.log('❌ Get user data error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch user data!'
      };
    }
  },

  // Get restaurants list
  getRestaurants: async () => {
    try {
      console.log('🍽️ Fetching restaurants...');
      
      // Use cached URL or find working URL
      let workingUrl = cachedWorkingUrl;
      if (!workingUrl) {
        workingUrl = await testMultipleUrls();
        if (!workingUrl) {
          return {
            success: false,
            error: 'No working URL found',
            message: 'Cannot reach Django server!'
          };
        }
      }
      
      console.log('🌐 Using working URL for restaurants:', workingUrl);
      
      const restaurantApi = axios.create({
        baseURL: workingUrl,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await restaurantApi.get('/getRestaurants/', {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      
      console.log('✅ Restaurants response:', response.data);
      
      if (response.data.success) {
        return {
          success: true,
          restaurants: response.data.restaurants,
          message: 'Restaurants fetched successfully!'
        };
      } else {
        return {
          success: false,
          error: response.data.error,
          message: 'Failed to fetch restaurants!'
        };
      }
    } catch (error) {
      console.log('❌ Get restaurants error:', error);
      // Clear cache on failure so URL re-checks next time
      cachedWorkingUrl = null;
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch restaurants!'
      };
    }
  },

  // Get restaurant products
  getRestaurantProducts: async (restaurantId) => {
    try {
      console.log('🍽️ Fetching products for restaurant:', restaurantId);
      
      // Use cached URL or find working URL
      let workingUrl = cachedWorkingUrl;
      if (!workingUrl) {
        workingUrl = await testMultipleUrls();
        if (!workingUrl) {
          return {
            success: false,
            error: 'No working URL found',
            message: 'Cannot reach Django server!'
          };
        }
      }
      
      console.log('🌐 Using working URL for products:', workingUrl);
      
      const productsApi = axios.create({
        baseURL: workingUrl,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await productsApi.get(`/getRestaurantProducts/${restaurantId}/`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      
      console.log('✅ Products response:', response.data);
      
      if (response.data.success) {
        return {
          success: true,
          products: response.data.products,
          message: 'Products fetched successfully!'
        };
      } else {
        return {
          success: false,
          error: response.data.error,
          message: 'Failed to fetch products!'
        };
      }
    } catch (error) {
      console.log('❌ Get products error:', error);
      // Clear cache on failure so URL re-checks next time
      cachedWorkingUrl = null;
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch products!'
      };
    }
  },

  // Add item to cart
  addToCart: async (userId, productId, quantity = 1) => {
    try {
      console.log('🛒 Adding to cart:', { userId, productId, quantity });
      
      // Use cached URL or find working URL
      let workingUrl = cachedWorkingUrl;
      if (!workingUrl) {
        workingUrl = await testMultipleUrls();
        if (!workingUrl) {
          return {
            success: false,
            error: 'No working URL found',
            message: 'Cannot reach Django server!'
          };
        }
      }
      
      console.log('🌐 Using working URL for add to cart:', workingUrl);
      
      const cartApi = axios.create({
        baseURL: workingUrl,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await cartApi.post('/addToCart/', {
        user_id: userId,
        product_id: productId,
        quantity: quantity,
      }, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      
      console.log('✅ Add to cart response:', response.data);
      
      if (response.data.success) {
        return {
          success: true,
          cartItem: response.data.cart_item,
          message: response.data.message || 'Item added to cart!'
        };
      } else {
        return {
          success: false,
          error: response.data.error,
          message: 'Failed to add item to cart!'
        };
      }
    } catch (error) {
      console.log('❌ Add to cart error:', error);
      // Clear cache on failure so URL re-checks next time
      cachedWorkingUrl = null;
      return {
        success: false,
        error: error.message,
        message: 'Failed to add item to cart!'
      };
    }
  },

  // Register new account (with optional address fields)
  register: async ({ username, email, password, firstName, lastName, role = 'customer', street, barangay, note, label }) => {
    try {
      // Use cached URL or find working URL
      let workingUrl = cachedWorkingUrl;
      if (!workingUrl) {
        workingUrl = await testMultipleUrls();
        if (!workingUrl) {
          return { success: false, error: 'No working URL found', message: 'Cannot reach Django server!' };
        }
      }

      const registerApi = axios.create({
        baseURL: workingUrl,
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
      });

      const payload = {
        username: username,
        email: email,
        password: password,
        first_name: firstName,
        last_name: lastName,
        role: role,
        // Optional address fields (backend handles defaults)
        street: street,
        barangay: barangay,
        note: note,
        label: label,
      };

      const response = await registerApi.post('/registerAccount/', payload, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      return { success: true, data: response.data, message: 'Registration successful!' };
    } catch (error) {
      // Clear cache on failure so URL re-checks next time
      cachedWorkingUrl = null;
      return { success: false, error: error.response?.data?.error || error.message, message: 'Registration failed!' };
    }
  },

  // Remove item from cart
  removeFromCart: async (userId, productId) => {
    try {
      console.log('🗑️ Removing from cart:', { userId, productId });
      
      // Use cached URL or find working URL
      let workingUrl = cachedWorkingUrl;
      if (!workingUrl) {
        workingUrl = await testMultipleUrls();
        if (!workingUrl) {
          return {
            success: false,
            error: 'No working URL found',
            message: 'Cannot reach Django server!'
          };
        }
      }
      
      console.log('🌐 Using working URL for remove from cart:', workingUrl);
      
      const cartApi = axios.create({
        baseURL: workingUrl,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await cartApi.post('/removeFromCart/', {
        user_id: userId,
        product_id: productId,
      }, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      
      console.log('✅ Remove from cart response:', response.data);
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Item removed from cart!'
        };
      } else {
        return {
          success: false,
          error: response.data.error,
          message: 'Failed to remove item from cart!'
        };
      }
    } catch (error) {
      console.log('❌ Remove from cart error:', error);
      // Clear cache on failure so URL re-checks next time
      cachedWorkingUrl = null;
      return {
        success: false,
        error: error.message,
        message: 'Failed to remove item from cart!'
      };
    }
  },

  // Get user address
  getUserAddress: async (user) => {
    try {
      // Accept either user object or user ID
      const userId = typeof user === 'object' ? user.id : user;
      const username = typeof user === 'object' ? user.username : null;
      const email = typeof user === 'object' ? user.email : null;
      
      console.log('🏠 Getting user address:', { userId, username, email });
      
      // Use cached URL or find working URL
      let workingUrl = cachedWorkingUrl;
      if (!workingUrl) {
        workingUrl = await testMultipleUrls();
        if (!workingUrl) {
          return {
            success: false,
            error: 'No working URL found',
            message: 'Cannot reach Django server!'
          };
        }
      }
      
      console.log('🌐 Using working URL for get user address:', workingUrl);
      
      const addressApi = axios.create({
        baseURL: workingUrl,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Send multiple identifiers to increase chance of success
      const payload = {
        user_id: userId,
      };
      
      if (username) payload.username = username;
      if (email) payload.email = email;
      
      console.log('📦 Sending address request payload:', payload);
      
      const response = await addressApi.post('/getUserAddress/', payload, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      
      console.log('✅ Get user address response:', response.data);
      
      if (response.data.success) {
        return {
          success: true,
          address: response.data.address
        };
      } else {
        return {
          success: false,
          error: response.data.error,
          message: response.data.message || 'Failed to get user address!'
        };
      }
    } catch (error) {
      console.log('❌ Get user address error:', error);
      // Clear cache on failure so URL re-checks next time
      cachedWorkingUrl = null;
      return {
        success: false,
        error: error.message,
        message: 'Failed to get user address!'
      };
    }
  },

  // Save user address
  saveAddress: async (addressData) => {
    try {
      console.log('💾 Saving address:', addressData);
      
      // Use cached URL or find working URL
      let workingUrl = cachedWorkingUrl;
      if (!workingUrl) {
        workingUrl = await testMultipleUrls();
        if (!workingUrl) {
          return {
            success: false,
            error: 'No working URL found',
            message: 'Cannot reach Django server!'
          };
        }
      }
      
      console.log('🌐 Using working URL for save address:', workingUrl);
      
      const saveApi = axios.create({
        baseURL: workingUrl,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const response = await saveApi.post('/saveAddress/', addressData, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      
      console.log('✅ Save address response:', response.data);
      
      if (response.data.success) {
        return {
          success: true,
          address: response.data
        };
      } else {
        return {
          success: false,
          error: response.data.error,
          message: response.data.message || 'Failed to save address!'
        };
      }
    } catch (error) {
      console.log('❌ Save address error:', error);
      cachedWorkingUrl = null;
      return {
        success: false,
        error: error.message,
        message: 'Failed to save address!'
      };
    }
  },

};

export default api;
