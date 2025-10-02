// Lightweight API client for rider-app using fetch (no axios required)

let cachedWorkingUrl = null;

async function findWorkingUrl() {
  if (cachedWorkingUrl) return cachedWorkingUrl;

  const candidates = [
    'http://192.168.254.111:8000', // Current host IP (working URL)
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

  // POST /rider/toggle-status/ to toggle rider availability
  toggleStatus: async () => {
    try {
      console.log('🔄 Toggling rider status...');
      
      const baseURL = await findWorkingUrl();
      const url = baseURL + '/rider/toggle-status/';
      
      console.log('🌐 Using working URL for status toggle:', baseURL);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include', // Include cookies for authentication
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

  // Try WebSocket first, fallback to polling
  connectToOrderUpdates: (onUpdate, onError) => {
    let connectionType = 'websocket';
    let wsConnection = null;
    let pollingInterval = null;
    
    const startPolling = () => {
      console.log('📡 Starting polling fallback for order updates...');
      connectionType = 'polling';
      
      const poll = async () => {
        try {
          const response = await apiService.getPendingOrdersCount();
          if (response.success) {
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
        };
        
        wsConnection.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📦 Received order update via WebSocket:', data);
            
            if (data.type === 'order_count_update') {
              onUpdate(data);
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
};


