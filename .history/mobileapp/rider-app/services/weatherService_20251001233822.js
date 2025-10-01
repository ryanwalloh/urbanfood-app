// Weather service using Open-Meteo API
// No API key required - completely free!

export const weatherService = {
  // Get current weather and forecast for a location
  getWeatherData: async (latitude, longitude) => {
    try {
      console.log('🌤️ Fetching weather data for:', latitude, longitude);
      
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&hourly=temperature_2m,weather_code,wind_speed_10m&forecast_days=3&timezone=auto`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.reason || 'Weather API error');
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
        daily: data.daily
      };
    } catch (error) {
      console.log('❌ Weather fetch error:', error);
      return {
        success: false,
        error: error.message
      };
    }
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
