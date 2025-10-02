// Weather service using OpenWeatherMap API for real-time weather data
// 
// SETUP INSTRUCTIONS:
// 1. Go to https://openweathermap.org/api
// 2. Sign up for a free account
// 3. Go to "API keys" section
// 4. Copy your API key
// 5. Replace 'YOUR_OPENWEATHER_API_KEY_HERE' below with your actual key
//
// FREE TIER LIMITS: 1,000 calls/day, 60 calls/minute
// Perfect for personal/testing use!

const OPENWEATHER_API_KEY = 'YOUR_OPENWEATHER_API_KEY_HERE';

// Google API key for geocoding (location names)
const GOOGLE_API_KEY = 'AIzaSyCCuDLJMhB-23kQiXYpXwi-yYGvKz7OgSQ';

export const weatherService = {
  // Get current weather using Open-Meteo API (FREE, NO API KEY REQUIRED!)
  getWeatherData: async (latitude, longitude) => {
    try {
      console.log('🌤️ Fetching real-time weather data from Open-Meteo for:', latitude, longitude);
      
      // Open-Meteo API endpoint (FREE, no API key required!)
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.current_weather) {
        throw new Error('Invalid response from Open-Meteo API');
      }
      
      console.log('✅ Real-time weather data fetched successfully from Open-Meteo:', {
        temperature: data.current_weather.temperature,
        condition: data.current_weather.weathercode,
        windSpeed: data.current_weather.windspeed
      });
      
      return {
        success: true,
        current: {
          temperature: Math.round(data.current_weather.temperature),
          weatherCode: weatherService.mapOpenMeteoWeatherCode(data.current_weather.weathercode),
          windSpeed: Math.round(data.current_weather.windspeed), // Already in km/h
          humidity: data.hourly ? data.hourly.relative_humidity_2m[0] : null,
          time: new Date().toISOString(),
          description: weatherService.getWeatherDescription(weatherService.mapOpenMeteoWeatherCode(data.current_weather.weathercode)),
          icon: weatherService.getWeatherIcon(weatherService.mapOpenMeteoWeatherCode(data.current_weather.weathercode))
        },
        location: {
          latitude: latitude,
          longitude: longitude,
          city: 'Current Location', // Open-Meteo doesn't provide city names
          country: 'PH'
        },
        isRealTime: true,
        apiSource: 'Open-Meteo'
      };
    } catch (error) {
      console.log('❌ Open-Meteo API error:', error.message);
      throw error; // Re-throw to let caller handle the error
    }
  },

  // Fallback to OpenWeatherMap if Open-Meteo fails
  getWeatherDataOpenWeatherMap: async (latitude, longitude) => {
    try {
      console.log('🌤️ Fallback: Fetching weather data from OpenWeatherMap for:', latitude, longitude);
      
      // Check if API key is configured
      if (OPENWEATHER_API_KEY === 'YOUR_OPENWEATHER_API_KEY_HERE') {
        throw new Error('OpenWeatherMap API key not configured');
      }
      
      // OpenWeatherMap API endpoint
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.cod !== 200) {
        throw new Error(data.message || 'Weather API error');
      }
      
      console.log('✅ OpenWeatherMap fallback data fetched successfully');
      
      return {
        success: true,
        current: {
          temperature: Math.round(data.main.temp),
          weatherCode: weatherService.mapWeatherCode(data.weather[0].id),
          windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
          humidity: data.main.humidity,
          time: new Date().toISOString(),
          description: data.weather[0].description,
          icon: data.weather[0].icon
        },
        location: {
          latitude: latitude,
          longitude: longitude,
          city: data.name,
          country: data.sys.country
        },
        isRealTime: true,
        apiSource: 'OpenWeatherMap'
      };
    } catch (error) {
      console.log('❌ OpenWeatherMap fallback error:', error.message);
      throw error;
    }
  },

  // Fallback weather data (only used when API fails completely)
  getFallbackWeather: () => {
    console.log('🌤️ Using fallback weather data');
    return {
      success: false,
      error: 'Weather service unavailable',
      fallback: true
    };
  },


  // Map OpenWeatherMap weather codes to our system
  mapWeatherCode: (openWeatherCode) => {
    // OpenWeatherMap uses different codes, map them to our system
    if (openWeatherCode >= 200 && openWeatherCode < 300) return 95; // Thunderstorm
    if (openWeatherCode >= 300 && openWeatherCode < 400) return 51; // Drizzle
    if (openWeatherCode >= 500 && openWeatherCode < 600) return 61; // Rain
    if (openWeatherCode >= 600 && openWeatherCode < 700) return 71; // Snow
    if (openWeatherCode >= 700 && openWeatherCode < 800) return 45; // Fog
    if (openWeatherCode === 800) return 0; // Clear sky
    if (openWeatherCode >= 801 && openWeatherCode < 810) return 2; // Partly cloudy
    return 2; // Default to partly cloudy
  },


  // Get location name from coordinates using Google Geocoding API
  getLocationName: async (latitude, longitude) => {
    try {
      console.log('📍 Getting location name from Google Geocoding API for:', latitude, longitude);
      
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('📍 Google Geocoding response:', JSON.stringify(data, null, 2));
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const addressComponents = result.address_components;
        
        // Extract city and country code with better priority logic
        let city = 'Unknown';
        let countryCode = '63';
        
        // Priority order: locality > administrative_area_level_2 > administrative_area_level_1
        // This ensures we get the city name instead of province name
        for (const component of addressComponents) {
          if (component.types.includes('locality')) {
            city = component.long_name;
            break; // Prioritize locality (city) over other levels
          }
        }
        
        // If no locality found, try administrative_area_level_2 (municipality/city)
        if (city === 'Unknown') {
          for (const component of addressComponents) {
            if (component.types.includes('administrative_area_level_2')) {
              city = component.long_name;
              break;
            }
          }
        }
        
        // If still no city found, try administrative_area_level_1 (province/state)
        if (city === 'Unknown') {
          for (const component of addressComponents) {
            if (component.types.includes('administrative_area_level_1')) {
              city = component.long_name;
              break;
            }
          }
        }
        
        // Get country code
        for (const component of addressComponents) {
          if (component.types.includes('country')) {
            countryCode = component.short_name;
          }
        }
        
        const locationString = `+${countryCode}, ${city}`;
        console.log('📍 Google formatted location:', locationString);
        
        return {
          success: true,
          location: locationString
        };
      } else {
        console.log('📍 Google Geocoding failed:', data.status);
        return weatherService.getCoordinateBasedLocation(latitude, longitude);
      }
    } catch (error) {
      console.log('❌ Google Geocoding error:', error);
      return weatherService.getCoordinateBasedLocation(latitude, longitude);
    }
  },

  // Fallback location detection based on coordinates
  getCoordinateBasedLocation: (latitude, longitude) => {
    console.log('📍 Using coordinate-based location detection');
    const city = weatherService.getCityFromCoordinates(latitude, longitude);
    return {
      success: true,
      location: `+63, ${city}`
    };
  },

  // Helper function to determine city based on coordinates
  getCityFromCoordinates: (latitude, longitude) => {
    console.log('📍 Checking coordinates for city:', latitude, longitude);
    
    // Iligan City coordinates: approximately 8.2474, 124.2452
    const iliganLat = 8.2474;
    const iliganLng = 124.2452;
    const tolerance = 0.2; // Increased tolerance to ~22km to cover more of Iligan City
    
    const latDiff = Math.abs(latitude - iliganLat);
    const lngDiff = Math.abs(longitude - iliganLng);
    
    console.log('📍 Distance from Iligan:', latDiff, lngDiff, 'tolerance:', tolerance);
    
    if (latDiff < tolerance && lngDiff < tolerance) {
      console.log('📍 Detected Iligan City based on coordinates');
      return 'Iligan City';
    }
    
    // Add more cities as needed
    const cebuLat = 10.3157;
    const cebuLng = 123.8854;
    if (Math.abs(latitude - cebuLat) < tolerance && Math.abs(longitude - cebuLng) < tolerance) {
      return 'Cebu City';
    }
    
    const manilaLat = 14.5995;
    const manilaLng = 120.9842;
    if (Math.abs(latitude - manilaLat) < tolerance && Math.abs(longitude - manilaLng) < tolerance) {
      return 'Manila';
    }
    
    // Default fallback - if we're in the Philippines and close to Iligan area, assume Iligan City
    if (latitude > 7 && latitude < 9 && longitude > 123 && longitude < 125) {
      console.log('📍 Assuming Iligan City based on general Philippine coordinates');
      return 'Iligan City';
    }
    
    // Final fallback
    return 'Iligan City';
  },

  // Get weather condition description from weather code
  getWeatherDescription: (weatherCode) => {
    const weatherCodes = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Light freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };
    return weatherCodes[weatherCode] || 'Unknown';
  },

  // Get weather icon emoji from weather code and time
  getWeatherIcon: (weatherCode, isNight = false) => {
    // Determine if it's night time
    const currentHour = new Date().getHours();
    const isNightTime = currentHour < 6 || currentHour > 18;
    
    // Clear sky
    if (weatherCode === 0 || weatherCode === 1) {
      return isNightTime ? '🌙' : '☀️';
    }
    
    // Partly cloudy / Overcast
    if (weatherCode === 2 || weatherCode === 3) {
      return isNightTime ? '☁️' : '⛅';
    }
    
    // Fog
    if (weatherCode >= 45 && weatherCode <= 48) {
      return '🌫️';
    }
    
    // Rain / Drizzle
    if (weatherCode >= 51 && weatherCode <= 67) {
      return '🌧️';
    }
    
    // Snow
    if (weatherCode >= 71 && weatherCode <= 77) {
      return '❄️';
    }
    
    // Rain showers
    if (weatherCode >= 80 && weatherCode <= 86) {
      return '🌦️';
    }
    
    // Thunderstorm
    if (weatherCode >= 95 && weatherCode <= 99) {
      return '⛈️';
    }
    
    // Default based on time
    return isNightTime ? '🌙' : '☀️';
  },

  // Get friendly message based on weather conditions
  getWeatherMessage: (weatherCode, temperature, windSpeed, isGoogleAPI = false) => {
    if (isGoogleAPI) {
      return '💬 Live weather data from Google API';
    }
    
    // Rain conditions
    if (weatherCode >= 51 && weatherCode <= 67) {
      return '🌧️ Bring your raincoat!';
    }
    if (weatherCode >= 80 && weatherCode <= 82) {
      return '🌦️ Wear your raincoat!';
    }
    
    // Snow conditions
    if (weatherCode >= 71 && weatherCode <= 77) {
      return '❄️ Be careful on slippery roads!';
    }
    
    // Thunderstorm
    if (weatherCode >= 95 && weatherCode <= 99) {
      return '⛈️ Stay at home during the storm!';
    }
    
    // High wind
    if (windSpeed > 20) {
      return '💨 Strong winds - drive carefully!';
    }
    
    // Hot weather
    if (temperature > 35) {
      return '🌡️ Stay hydrated in this heat!';
    }
    
    // Cold weather
    if (temperature < 10) {
      return '🧥 Bundle up - it\'s chilly!';
    }
    
    // Clear weather
    if (weatherCode === 0 || weatherCode === 1) {
      return '☀️ Perfect weather for deliveries!';
    }
    
    // Default
    return '💬 Safe delivery!';
  }
};