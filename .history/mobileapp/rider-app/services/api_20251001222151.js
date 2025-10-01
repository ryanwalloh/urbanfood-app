// Lightweight API client for rider-app using fetch (no axios required)

let cachedWorkingUrl = null;

async function findWorkingUrl() {
  if (cachedWorkingUrl) return cachedWorkingUrl;

  const candidates = [
    'http://10.0.2.2:8000',      // Android emulator
    'http://127.0.0.1:8000',     // iOS simulator
    'http://localhost:8000',     // Alternative localhost
    'http://192.168.254.103:8000', // Local network IP
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
  // POST /loginByPassword/ with { email, password }
  login: async (email, password) => {
    const baseURL = await findWorkingUrl();
    const url = baseURL + '/loginByPassword/';

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({ success: false, error: 'Invalid JSON response' }));
      return data;
    } catch (error) {
      return { success: false, error: error.message || 'Network error' };
    }
  },
};


