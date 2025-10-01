import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { weatherService } from '../services/weatherService';

const { width } = Dimensions.get('window');

const RiderMainPage = ({ onLogout }) => {
  const [rider, setRider] = useState(null);
  const [weather, setWeather] = useState(null);
  const [locationName, setLocationName] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [activeNav, setActiveNav] = useState('home');
  const [loading, setLoading] = useState(true);

  // Mock data for recent assignments
  const recentAssignments = [
    {
      id: 1,
      restaurant: 'Altitude Café',
      customer: 'John Doe',
      address: '123 Main St, Barangay 1',
      amount: '₱450.00',
      status: 'Completed',
      time: '2 hours ago'
    },
    {
      id: 2,
      restaurant: 'Farm Grill',
      customer: 'Jane Smith',
      address: '456 Oak Ave, Barangay 2',
      amount: '₱320.00',
      status: 'Completed',
      time: '5 hours ago'
    },
    {
      id: 3,
      restaurant: 'Binolawan Kape',
      customer: 'Mike Johnson',
      address: '789 Pine Rd, Barangay 3',
      amount: '₱180.00',
      status: 'Completed',
      time: 'Yesterday'
    }
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load rider data
        const stored = await AsyncStorage.getItem('rider:user');
        if (stored) {
          const riderData = JSON.parse(stored);
          setRider(riderData);
          
          // Get location and weather
          await getLocationAndWeather();
        }
      } catch (error) {
        console.log('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getLocationAndWeather = async () => {
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is needed to get weather data.');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      console.log('📍 Location:', latitude, longitude);

      // Get weather data and location name in parallel
      const [weatherData, locationData] = await Promise.all([
        weatherService.getWeatherData(latitude, longitude),
        weatherService.getLocationName(latitude, longitude)
      ]);

      if (weatherData.success) {
        setWeather(weatherData);
      } else {
        console.log('Weather fetch failed:', weatherData.error);
      }

      if (locationData.success) {
        setLocationName(locationData.location);
      } else {
        console.log('Location name fetch failed:', locationData.error);
        setLocationName('+63, Manila'); // Default fallback
      }
    } catch (error) {
      console.log('Location/Weather error:', error);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('rider:user');
    onLogout?.();
  };

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Hero Image Container */}
        <View style={styles.heroContainer}>
          <Image 
            source={require('../assets/riderHeader.png')} 
            style={styles.heroImage}
            resizeMode="cover"
          />
          
          {/* Semi-transparent button */}
          <TouchableOpacity style={styles.heroButton}>
            <Text style={styles.heroButtonText}>Soti Delivery</Text>
          </TouchableOpacity>
          
          {/* Title and Weather */}
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Partner {rider?.username?.charAt(0).toUpperCase() + rider?.username?.slice(1).toLowerCase()}</Text>
            
            {weather && (
              <View style={styles.weatherContainer}>
                <Text style={styles.weatherText}>
                  {weatherService.getWeatherIcon(weather.current.weatherCode)} {weather.current.temperature}°C
                </Text>
                <Text style={styles.weatherDescription}>
                  {weatherService.getWeatherDescription(weather.current.weatherCode)}
                </Text>
                {locationName && (
                  <Text style={styles.locationText}>
                    📍 {locationName}
                  </Text>
                )}
                <Text style={styles.weatherMessage}>
                  {weatherService.getWeatherMessage(
                    weather.current.weatherCode, 
                    weather.current.temperature, 
                    weather.current.windSpeed,
                    weather.isGoogleAPI
                  )}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Status Container */}
        <View style={styles.statusContainer}>
          <View style={styles.statusContent}>
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>Status: {isOnline ? 'Online' : 'Offline'}</Text>
              <Text style={styles.statusSubtitle}>Turn on Status to receive Delivery Assignments</Text>
            </View>
            <TouchableOpacity 
              style={[styles.toggleButton, isOnline && styles.toggleButtonActive]}
              onPress={toggleOnlineStatus}
            >
              <View style={[styles.toggleCircle, isOnline && styles.toggleCircleActive]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Orders Container */}
        <View style={styles.ordersContainer}>
          <View style={styles.ordersContent}>
            <Image source={require('../assets/foodPack.png')} style={styles.ordersIcon} />
            <View style={styles.ordersTextContainer}>
              <Text style={styles.ordersTitle}>1 delivery orders found!</Text>
              <TouchableOpacity>
                <Text style={styles.viewOrdersText}>View Orders</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Recent Assignments */}
        <View style={styles.assignmentsContainer}>
          <Text style={styles.sectionTitle}>Recent Assignment History</Text>
          {recentAssignments.map((assignment) => (
            <View key={assignment.id} style={styles.assignmentCard}>
              <View style={styles.assignmentHeader}>
                <Text style={styles.restaurantName}>{assignment.restaurant}</Text>
                <Text style={styles.assignmentAmount}>{assignment.amount}</Text>
              </View>
              <Text style={styles.customerName}>{assignment.customer}</Text>
              <Text style={styles.assignmentAddress}>{assignment.address}</Text>
              <View style={styles.assignmentFooter}>
                <Text style={styles.assignmentStatus}>{assignment.status}</Text>
                <Text style={styles.assignmentTime}>{assignment.time}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Bottom padding for navigation */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setActiveNav('home')}
        >
          <View style={[styles.navIconContainer, activeNav === 'home' && styles.navIconActive]}>
            <Image source={require('../assets/home.png')} style={styles.navIcon} resizeMode="contain" />
          </View>
          <Text style={[styles.navLabel, activeNav === 'home' && styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setActiveNav('orders')}
        >
          <View style={[styles.navIconContainer, activeNav === 'orders' && styles.navIconActive]}>
            <Image source={require('../assets/orders.png')} style={styles.navIcon} resizeMode="contain" />
          </View>
          <Text style={[styles.navLabel, activeNav === 'orders' && styles.navLabelActive]}>Orders</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setActiveNav('support')}
        >
          <View style={[styles.navIconContainer, activeNav === 'support' && styles.navIconActive]}>
            <Image source={require('../assets/support.png')} style={styles.navIcon} resizeMode="contain" />
          </View>
          <Text style={[styles.navLabel, activeNav === 'support' && styles.navLabelActive]}>Support</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setActiveNav('profile')}
        >
          <View style={[styles.navIconContainer, activeNav === 'profile' && styles.navIconActive]}>
            <Image source={require('../assets/profile.png')} style={styles.navIcon} resizeMode="contain" />
          </View>
          <Text style={[styles.navLabel, activeNav === 'profile' && styles.navLabelActive]}>Profile</Text>
      </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Main Container
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },

  // Hero Section
  heroContainer: {
    height: 350,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroButton: {
    position: 'absolute',
    top: 70,
    left: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    bottom: 60,

  },
  weatherContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 12,
    borderRadius: 12,
    
  },
  weatherText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  weatherDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 4,
    fontWeight: '500',
  },
  weatherMessage: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    fontStyle: 'italic',
  },

  // Status Container
  statusContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleButtonActive: {
    backgroundColor: '#F43332',
  },
  toggleCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  toggleCircleActive: {
    alignSelf: 'flex-end',
  },

  // Orders Container
  ordersContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  ordersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  ordersIcon: {
    width: 50,
    height: 50,
    marginRight: 15,
  },
  ordersTextContainer: {
    flex: 1,
  },
  ordersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  viewOrdersText: {
    fontSize: 14,
    color: '#F43332',
    fontWeight: '600',
  },

  // Assignments Section
  assignmentsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  assignmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  assignmentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F43332',
  },
  customerName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  assignmentAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  assignmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignmentStatus: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  assignmentTime: {
    fontSize: 12,
    color: '#999',
  },

  // Bottom Navigation
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navIconContainer: {
    width: 24,
    height: 24,
    marginBottom: 4,
    opacity: 0.6,
  },
  navIconActive: {
    opacity: 1,
  },
  navIcon: {
    width: 24,
    height: 24,
  },
  navLabel: {
    fontSize: 12,
    color: '#999',
  },
  navLabelActive: {
    color: '#F43332',
    fontWeight: '600',
  },

  // Bottom Padding
  bottomPadding: {
    height: 20,
  },
});

export default RiderMainPage;


