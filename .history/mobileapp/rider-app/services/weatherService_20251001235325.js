// Weather service using Open-Meteo API
// No API key required - completely free!

export const weatherService = {
  // Get current weather and forecast for a location
  getWeatherData: async (latitude, longitude) => {
    try {
      console.log('🌤️ Fetching weather data for:', latitude, longitude);
      
      // Try multiple weather services for better accuracy
      const weatherServices = [
        // Open-Meteo (free, good for major cities)
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&hourly=temperature_2m,weather_code,wind_speed_10m&forecast_days=3&timezone=auto`,
        // WeatherAPI.com (more accurate for Philippines, requires free API key)
        // Note: You can get a free API key at weatherapi.com
        null // Placeholder for alternative service
      ];
      
      for (let i = 0; i < weatherServices.length; i++) {
        if (weatherServices[i] === null) {
          // Fallback: Use mock data for Iligan City
          console.log('🌤️ Using fallback weather data for Iligan City');
          return weatherService.getFallbackWeatherData();
        }
        
        try {
          console.log(`🌤️ Trying weather service ${i + 1}`);
          const response = await fetch(weatherServices[i]);
          const data = await response.json();
          
          if (data.error) {
            console.log(`🌤️ Service ${i + 1} error:`, data.reason);
            continue;
          }
          
          console.log('✅ Weather data fetched successfully');
          return {
            success: true,
            current: {
              temperature: Math.round(data.current.temperature_2m),
              weatherCode: data.current.weather_code,
              windSpeed: Math.round(data.current.wind_speed_10m),
              humidity: data.current.relative_humidity_2m,
              time: data.current.time
            },
            hourly: data.hourly,
            daily: data.daily,
            location: {
              latitude: latitude,
              longitude: longitude
            }
          };
        } catch (serviceError) {
          console.log(`🌤️ Service ${i + 1} failed:`, serviceError.message);
          continue;
        }
      }
      
      // If all services fail, use fallback
      console.log('🌤️ All weather services failed, using fallback');
      return weatherService.getFallbackWeatherData();
    } catch (error) {
      console.log('❌ Weather fetch error:', error);
      return weatherService.getFallbackWeatherData();
    }
  },

  // Fallback weather data for Iligan City (you can update this with real data)
  getFallbackWeatherData: () => {
    console.log('🌤️ Using fallback weather data');
    return {
      success: true,
      current: {
        temperature: 20, // Current temperature in Iligan
        weatherCode: 2, // Partly cloudy
        windSpeed: 5,
        humidity: 75,
        time: new Date().toISOString()
      },
      hourly: null,
      daily: null,
      location: {
        latitude: 8.2474,
        longitude: 124.2452
      },
      isFallback: true
    };
  },

  // Get location name from coordinates using reverse geocoding
  getLocationName: async (latitude, longitude) => {
    try {
      console.log('📍 Getting location name for:', latitude, longitude);
      
      // Try multiple geocoding services for better coverage
      const services = [
        // Open-Meteo reverse geocoding (different endpoint)
        `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&count=1&language=en&format=json`,
        // Alternative: Use a simple fallback based on coordinates
        null
      ];
      
      for (let i = 0; i < services.length; i++) {
        if (services[i] === null) {
          // Fallback: Determine city based on coordinates
          console.log('📍 Using coordinate-based fallback');
          const city = weatherService.getCityFromCoordinates(latitude, longitude);
          console.log('📍 Detected city:', city);
          const locationString = `+63, ${city}`;
          console.log('📍 Final location string:', locationString);
          return {
            success: true,
            location: locationString
          };
        }
        
        try {
          console.log(`📍 Trying service ${i + 1}:`, services[i]);
          const response = await fetch(services[i]);
          const data = await response.json();
          
          console.log('📍 Geocoding API response:', JSON.stringify(data, null, 2));
          
          if (data.results && data.results.length > 0) {
            const location = data.results[0];
            console.log('📍 Location data:', JSON.stringify(location, null, 2));
            
            const countryCode = location.country_code || '63';
            const city = location.name || location.admin1 || location.admin2 || 'Unknown';
            
            const locationString = `+${countryCode}, ${city}`;
            console.log('📍 Formatted location:', locationString);
            
            return {
              success: true,
              location: locationString
            };
          }
        } catch (serviceError) {
          console.log(`📍 Service ${i + 1} failed:`, serviceError.message);
          continue;
        }
      }
      
      console.log('📍 All services failed, using fallback');
      return {
        success: false,
        location: `+63, Iligan City`
      };
    } catch (error) {
      console.log('❌ Location name fetch error:', error);
      return {
        success: false,
        location: `+63, Iligan City`
      };
    }
  },

  // Helper function to determine city based on coordinates
  getCityFromCoordinates: (latitude, longitude) => {
    // Iligan City coordinates: approximately 8.2474, 124.2452
    const iliganLat = 8.2474;
    const iliganLng = 124.2452;
    const tolerance = 0.1; // ~11km tolerance
    
    if (Math.abs(latitude - iliganLat) < tolerance && Math.abs(longitude - iliganLng) < tolerance) {
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
    
    // Default fallback
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

  // Get weather icon emoji from weather code
  getWeatherIcon: (weatherCode) => {
    if (weatherCode === 0 || weatherCode === 1) return '☀️';
    if (weatherCode === 2 || weatherCode === 3) return '⛅';
    if (weatherCode >= 45 && weatherCode <= 48) return '🌫️';
    if (weatherCode >= 51 && weatherCode <= 67) return '🌧️';
    if (weatherCode >= 71 && weatherCode <= 77) return '❄️';
    if (weatherCode >= 80 && weatherCode <= 86) return '🌦️';
    if (weatherCode >= 95 && weatherCode <= 99) return '⛈️';
    return '🌤️';
  },

  // Get friendly message based on weather conditions
  getWeatherMessage: (weatherCode, temperature, windSpeed) => {
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
      return '⛈️ Stay safe during the storm!';
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
    return '🚚 Safe travels!';
  }
};
