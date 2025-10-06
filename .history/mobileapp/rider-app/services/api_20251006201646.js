// Lightweight API client for rider-app using fetch (no axios required)

let cachedWorkingUrl = null;

async function findWorkingUrl() {
  if (cachedWorkingUrl) return cachedWorkingUrl;

  const candidates = [
    'http://192.168.254.104:8000', // Current host IP (working URL)
    'http://192.168.254.111:8000', // Previous host IP
    'http://10.0.2.2:8000',      // Android emulator
    'http://127.0.0.1:8000',     // iOS simulator
    'http://localhost:8000',     // Alternative localhost
    'http://192.168.254.103:8000', // Previous host IP
  ];

  console.log('🔍 Testing multiple URLs to find working one...');
  
  for (const base of candidates) {
    try {
      console.log(`🔍 Testing URL: ${base}`);
      const res = await fetch(base + '/', { 
        method: 'GET',
        timeout: 5000 
      });
      if (res.ok) {
        cachedWorkingUrl = base;
        console.log(`✅ Found working URL: ${base}`);
        return base;
      }
    } catch (e) {
      console.log(`❌ URL failed: ${base} - ${e.message}`);
    }
  }

  // Fallback to last known cachedWorkingUrl or throw
  throw new Error('No working backend URL found');
}

export const apiService = {
  // Test connection to Django backend
  testConnection: async () => {
    console.log('🔍 Testing rider-app connection to backend...');
    
    try {
      const workingUrl = await findWorkingUrl();
      console.log(`✅ Using working URL: ${workingUrl}`);
      
      // Test the API endpoint
      const testRes = await fetch(workingUrl + '/api/users/', {
        method: 'GET',
        timeout: 5000
      });
      
      if (testRes.ok) {
        const data = await testRes.json().catch(() => ({}));
        return {
          success: true,
          data: data,
          message: `Connection successful! Using URL: ${workingUrl}`,
          workingUrl: workingUrl
        };
      } else {
        return {
          success: false,
          error: `HTTP ${testRes.status}`,
          message: 'API request failed!'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Cannot reach Django server!'
      };
    }
  },

  // Rider recent delivered transactions
  getRecentTransactions: async () => {
    try {
      const baseURL = await findWorkingUrl();
      const url = baseURL + '/rider/recent-transactions/';

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        timeout: 10000
      });

      if (!res.ok) {
        const errorText = await res.text();
        return { success: false, error: `HTTP ${res.status}: ${errorText}` };
      }

      const data = await res.json().catch(() => ({ success: false, error: 'Invalid JSON response' }));
      return data;
    } catch (error) {
      return { success: false, error: error.message || 'Network error' };
    }
  },

  // POST /loginByPassword/ with { email, password }
  login: async (email, password) => {
    try {
      console.log('🔐 Attempting rider login for:', email);
      
      const baseURL = await findWorkingUrl();
      const url = baseURL + '/loginByPassword/';
      
      console.log('🌐 Using working URL for login:', baseURL);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ email, password }),
        timeout: 10000
      });

      const data = await res.json().catch(() => ({ 
        success: false, 
        error: 'Invalid JSON response' 
      }));
      
      console.log('✅ Login response:', data);
      return data;
    } catch (error) {
      console.log('❌ Login error:', error);
      // If login fails, clear cached URL and try again next time
      cachedWorkingUrl = null;
      return { 
        success: false, 
        error: error.message || 'Network error' 
      };
    }
  },

  // POST /rider/toggle-status/ to set rider availability status
  toggleStatus: async (targetStatus = null) => {
    try {
      console.log('🔄 Setting rider status...', targetStatus ? `to ${targetStatus}` : '(toggle)');
      
      const baseURL = await findWorkingUrl();
      const url = baseURL + '/rider/toggle-status/';
      
      console.log('🌐 Using working URL for status toggle:', baseURL);

      const formData = new FormData();
      if (targetStatus !== null) {
        formData.append('status', targetStatus.toString());
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include', // Include cookies for authentication
        body: formData,
        timeout: 10000
      });

      console.log('📡 Response status:', res.status);
      console.log('📡 Response headers:', res.headers);

      if (!res.ok) {
        const errorText = await res.text();
        console.log('❌ Response error text:', errorText);
        return {
          success: false,
          error: `HTTP ${res.status}: ${errorText}`
        };
      }

      let data;
      try {
        data = await res.json();
      } catch (jsonError) {
        console.log('❌ JSON parsing error:', jsonError);
        const rawResponse = await res.text();
        console.log('❌ Raw response:', rawResponse);
        data = { 
          success: false, 
          error: 'Invalid JSON response',
          rawResponse: rawResponse
        };
      }
      
      console.log('✅ Toggle status response:', data);
      return data;
    } catch (error) {
      console.log('❌ Toggle status error:', error);
      return { 
        success: false, 
        error: error.message || 'Network error' 
      };
    }
  },

  // GET /rider/status/ to get current rider status from backend
  getRiderStatus: async () => {
    try {
      console.log('📊 Getting rider status from backend...');
      
      const baseURL = await findWorkingUrl();
      const url = baseURL + '/rider/status/';
      
      console.log('🌐 Using working URL for status check:', baseURL);

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        timeout: 10000
      });

      console.log('📡 Status response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.log('❌ Status response error text:', errorText);
        return {
          success: false,
          error: `HTTP ${res.status}: ${errorText}`
        };
      }

      const data = await res.json().catch((jsonError) => {
        console.log('❌ Status JSON parsing error:', jsonError);
        return { 
          success: false, 
          error: 'Invalid JSON response'
        };
      });
      
      console.log('✅ Rider status response:', data);
      return data;
    } catch (error) {
      console.log('❌ Get status error:', error);
      return { 
        success: false, 
        error: error.message || 'Network error' 
      };
    }
  },

  // GET /orders/pending-count/ to get count of pending orders
  getPendingOrdersCount: async () => {
    try {
      console.log('📦 Getting pending orders count...');
      
      const baseURL = await findWorkingUrl();
      const url = baseURL + '/orders/pending-count/';
      
      console.log('🌐 Using working URL for orders count:', baseURL);

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        timeout: 10000
      });

      console.log('📡 Orders count response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.log('❌ Orders count response error text:', errorText);
        return {
          success: false,
          error: `HTTP ${res.status}: ${errorText}`,
          count: 0
        };
      }

      const data = await res.json().catch((jsonError) => {
        console.log('❌ Orders count JSON parsing error:', jsonError);
        return { 
          success: false, 
          error: 'Invalid JSON response',
          count: 0
        };
      });
      
      console.log('✅ Pending orders count response:', data);
      return data;
    } catch (error) {
      console.log('❌ Get orders count error:', error);
      return { 
        success: false, 
        error: error.message || 'Network error',
        count: 0
      };
    }
  },

  // POST /rider/fetch-orders/ to get available orders for riders
  getRiderOrders: async () => {
    try {
      console.log('📦 Fetching available orders for rider...');
      
      const baseURL = await findWorkingUrl();
      const url = baseURL + '/rider/fetch-orders/';
      
      console.log('🌐 Using working URL for orders:', baseURL);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include', // Include cookies for authentication
        timeout: 10000
      });

      console.log('📡 Orders response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.log('❌ Orders response error text:', errorText);
        return {
          success: false,
          error: `HTTP ${res.status}: ${errorText}`,
          orders: []
        };
      }

      const data = await res.json().catch((jsonError) => {
        console.log('❌ Orders JSON parsing error:', jsonError);
        return { 
          success: false, 
          error: 'Invalid JSON response',
          orders: []
        };
      });
      
      console.log('✅ Rider orders response:', data);
      return data;
    } catch (error) {
      console.log('❌ Get rider orders error:', error);
      return { 
        success: false, 
        error: error.message || 'Network error',
        orders: []
      };
    }
  },

  // POST /logout/ to logout and clear session
  logout: async () => {
    try {
      console.log('🚪 Logging out from backend...');
      
      const baseURL = await findWorkingUrl();
      const url = baseURL + '/logout/';
      
      console.log('🌐 Using working URL for logout:', baseURL);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include', // Include cookies for session logout
        timeout: 10000
      });

      console.log('📡 Logout response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.log('❌ Logout response error text:', errorText);
        return {
          success: false,
          error: `HTTP ${res.status}: ${errorText}`
        };
      }

      const data = await res.json().catch((jsonError) => {
        console.log('❌ Logout JSON parsing error:', jsonError);
        return { 
          success: true, // Logout might succeed even without JSON response
          message: 'Logged out successfully'
        };
      });
      
      console.log('✅ Logout response:', data);
      return data;
    } catch (error) {
      console.log('❌ Logout error:', error);
      return { 
        success: false, 
        error: error.message || 'Network error' 
      };
    }
  },

  // Accept order (assign rider to order)
  acceptOrder: async (orderId) => {
    try {
      console.log('✅ Accepting order:', orderId);
      
      const baseURL = await findWorkingUrl();
      const url = baseURL + '/rider/update-order-status/';
      
      console.log('🌐 Using working URL for accept order:', baseURL);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        body: `order_id=${orderId}&status=assigned`,
        timeout: 10000
      });

      console.log('📡 Accept order response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.log('❌ Accept order response error text:', errorText);
        return {
          success: false,
          error: `HTTP ${res.status}: ${errorText}`
        };
      }

      const data = await res.json().catch((jsonError) => {
        console.log('❌ Accept order JSON parsing error:', jsonError);
        return { 
          success: false, 
          error: 'Invalid JSON response'
        };
      });
      
      console.log('✅ Accept order response:', data);
      return data;
    } catch (error) {
      console.log('❌ Accept order error:', error);
      return { 
        success: false, 
        error: error.message || 'Network error' 
      };
    }
  },

  // Update order status (OTW, Delivered, etc.)
  updateOrderStatus: async (orderId, status) => {
    try {
      console.log('✅ Updating order status:', orderId, 'to', status);
      
      const baseURL = await findWorkingUrl();
      const url = baseURL + '/rider/update-order-status/';
      
      console.log('🌐 Using working URL for update order status:', baseURL);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        body: `order_id=${orderId}&status=${status}`,
        timeout: 10000
      });

      console.log('📡 Update order status response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.log('❌ Update order status response error text:', errorText);
        return {
          success: false,
          error: `HTTP ${res.status}: ${errorText}`
        };
      }

      const data = await res.json().catch((jsonError) => {
        console.log('❌ Update order status JSON parsing error:', jsonError);
        return { 
          success: false, 
          error: 'Invalid JSON response'
        };
      });
      
      console.log('✅ Update order status response:', data);
      return data;
    } catch (error) {
      console.log('❌ Update order status error:', error);
      return { 
        success: false, 
        error: error.message || 'Network error' 
      };
    }
  },

  // Get order details
  getOrderDetails: async (orderId) => {
    try {
      console.log('📋 Fetching order details for:', orderId);
      
      const baseURL = await findWorkingUrl();
      const url = baseURL + '/rider/fetch-order-details/';
      
      console.log('🌐 Using working URL for order details:', baseURL);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        body: JSON.stringify({ order_id: orderId }),
        timeout: 10000
      });

      console.log('📡 Order details response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.log('❌ Order details response error text:', errorText);
        return {
          success: false,
          error: `HTTP ${res.status}: ${errorText}`
        };
      }

      const data = await res.json().catch((jsonError) => {
        console.log('❌ Order details JSON parsing error:', jsonError);
        return { 
          success: false, 
          error: 'Invalid JSON response'
        };
      });
      
      // Check if the response contains an error
      if (data.error) {
        console.log('❌ Order details API error:', data.error);
        return {
          success: false,
          error: data.error
        };
      }
      
      console.log('✅ Order details response:', data);
      return {
        success: true,
        ...data
      };
    } catch (error) {
      console.log('❌ Get order details error:', error);
      return { 
        success: false, 
        error: error.message || 'Network error' 
      };
    }
  },

  // Try WebSocket first, fallback to polling
  connectToOrderUpdates: (onUpdate, onError) => {
    let connectionType = 'websocket';
    let wsConnection = null;
    let pollingInterval = null;
    
    const startPolling = () => {
      console.log('📡 Starting polling fallback for order updates...');
      console.log('🔄 Switching from WebSocket to POLLING mode');
      connectionType = 'polling';
      
      const poll = async () => {
        try {
          const response = await apiService.getPendingOrdersCount();
          if (response.success) {
            console.log('📦 Polling update received:', response.count);
            onUpdate({
              type: 'order_count_update',
              count: response.count,
              timestamp: Date.now()
            });
          }
        } catch (error) {
          console.log('❌ Polling error:', error);
        }
      };
      
      // Poll immediately
      poll();
      
      // Then poll every 5 seconds (faster than 10s for better UX)
      pollingInterval = setInterval(poll, 5000);
    };
    
    const stopConnection = () => {
      if (connectionType === 'websocket' && wsConnection) {
        wsConnection.close();
      } else if (connectionType === 'polling' && pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
    
    try {
      console.log('📡 Attempting WebSocket connection for order updates...');
      
      findWorkingUrl().then(baseURL => {
        // Convert HTTP URL to WebSocket URL
        const wsUrl = baseURL.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws/orders/updates/';
        
        console.log('🌐 Connecting to WebSocket:', wsUrl);
        
        // Create WebSocket connection with timeout
        wsConnection = new WebSocket(wsUrl);
        
        const connectionTimeout = setTimeout(() => {
          if (wsConnection.readyState === WebSocket.CONNECTING) {
            console.log('⏰ WebSocket connection timeout, falling back to polling');
            wsConnection.close();
            startPolling();
          }
        }, 5000); // 5 second timeout
        
        wsConnection.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log('✅ WebSocket connected for order updates');
          console.log('🎉 WebSocket connection established successfully!');
          console.log('📡 Ready to receive real-time order count updates');
        };
        
        wsConnection.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📦 Received order update via WebSocket:', data);
            console.log('🔥 WebSocket message received successfully!');
            
            if (data.type === 'order_count_update') {
              console.log('📊 Processing order count update via WebSocket');
              onUpdate(data);
            } else if (data.type === 'heartbeat') {
              console.log('💓 WebSocket heartbeat received - connection healthy');
            }
          } catch (e) {
            console.log('❌ Error parsing WebSocket data:', e);
          }
        };
        
        wsConnection.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.log('❌ WebSocket error, falling back to polling:', error);
          startPolling();
        };
        
        wsConnection.onclose = (event) => {
          clearTimeout(connectionTimeout);
          console.log('📡 WebSocket connection closed:', event.code, event.reason);
          
          // Log different close codes
          if (event.code === 1000) {
            console.log('✅ WebSocket closed cleanly (normal closure)');
          } else if (event.code === 1006) {
            console.log('⚠️ WebSocket closed unexpectedly (no close frame)');
          } else {
            console.log(`⚠️ WebSocket closed with code ${event.code}: ${event.reason || 'No reason provided'}`);
          }
          
          // If not manually closed and not a clean close, start polling
          if (event.code !== 1000 && connectionType === 'websocket') {
            console.log('🔄 WebSocket failed, starting polling fallback...');
            startPolling();
          }
        };
        
      }).catch(error => {
        console.log('❌ Failed to setup WebSocket, using polling:', error);
        startPolling();
      });
      
    } catch (error) {
      console.log('❌ WebSocket setup error, using polling:', error);
      startPolling();
    }
    
    // Return cleanup function
    return {
      close: stopConnection,
      getConnectionType: () => connectionType
    };
  },

  // Update order with proof of delivery and set status to delivered
  updateOrderWithProofOfDelivery: async (orderId, proofOfDeliveryUrl) => {
    try {
      console.log('✅ Updating order with proof of delivery:', orderId, proofOfDeliveryUrl);
      
      const baseURL = await findWorkingUrl();
      const url = baseURL + '/rider/update-order-with-proof/';
      
      console.log('🌐 Using working URL for update order with proof:', baseURL);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        body: `order_id=${orderId}&proof_of_delivery_url=${encodeURIComponent(proofOfDeliveryUrl)}&status=delivered`,
        timeout: 10000
      });

      console.log('📡 Update order with proof response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.log('❌ Update order with proof response error text:', errorText);
        return {
          success: false,
          error: `HTTP ${res.status}: ${errorText}`
        };
      }

      const data = await res.json().catch((jsonError) => {
        console.log('❌ Update order with proof JSON parsing error:', jsonError);
        return { 
          success: false, 
          error: 'Invalid JSON response'
        };
      });
      
      console.log('✅ Update order with proof response:', data);
      return data;
    } catch (error) {
      console.log('❌ Update order with proof error:', error);
      return { 
        success: false, 
        error: error.message || 'Network error' 
      };
    }
  },

  // Update rider location
  updateRiderLocation: async (latitude, longitude) => {
    try {
      console.log('📍 Updating rider location:', latitude, longitude);
      
      const baseURL = await findWorkingUrl();
      const url = baseURL + '/delivery/update-rider-location/';
      
      console.log('🌐 Using working URL for update rider location:', baseURL);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        body: JSON.stringify({
          latitude: latitude,
          longitude: longitude
        }),
        timeout: 10000
      });

      console.log('📡 Update rider location response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.log('❌ Update rider location response error text:', errorText);
        return {
          success: false,
          error: `HTTP ${res.status}: ${errorText}`
        };
      }

      const data = await res.json().catch((jsonError) => {
        console.log('❌ Update rider location JSON parsing error:', jsonError);
        return { 
          success: false, 
          error: 'Invalid JSON response'
        };
      });
      
      console.log('✅ Update rider location response:', data);
      return data;
    } catch (error) {
      console.log('❌ Update rider location error:', error);
      return { 
        success: false, 
        error: error.message || 'Network error' 
      };
    }
  },

  // (Removed) Presigned S3 URL flow — replaced by Cloudinary direct upload
};

// Export the findWorkingUrl function for use in components
export { findWorkingUrl };


