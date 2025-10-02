import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { weatherService } from '../services/weatherService';
import { apiService } from '../services/api';

const { width } = Dimensions.get('window');

const RiderMainPage = ({ onLogout }) => {
  const [rider, setRider] = useState(null);
  const [weather, setWeather] = useState(null);
  const [locationName, setLocationName] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [activeNav, setActiveNav] = useState('home');
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessionStartTime, setSessionStartTime] = useState(new Date());

  // Mock data for recent assignments
  const recentAssignments = [
    {
      id: 1,
      restaurant: 'Altitude Café',
      customer: 'John Doe',
      address: '123 Main St, Barangay 1',
      amount: '₱450.00',
      time: 'Tuesday, 1:43pm'
    },
    {
      id: 2,
      restaurant: 'Farm Grill',
      customer: 'Jane Smith',
      address: '456 Oak Ave, Barangay 2',
      amount: '₱320.00',
      time: 'Monday, 3:15pm'
    },
    {
      id: 3,
      restaurant: 'Binolawan Kape',
      customer: 'Mike Johnson',
      address: '789 Pine Rd, Barangay 3',
      amount: '₱180.00',
      time: 'Monday, 11:30am'
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
          
          // Initialize online status based on rider data if available
          if (riderData.is_available !== undefined) {
            setIsOnline(riderData.is_available);
          }
          
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

  // Clock timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
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

  const toggleOnlineStatus = async () => {
    try {
      console.log('🔄 Toggling rider status...');
      
      // Call backend API to toggle status
      const response = await apiService.toggleStatus();
      
      if (response.success !== false) {
        // Update local state based on backend response
        const newStatus = response.new_status === 'Online';
        setIsOnline(newStatus);
        
        console.log('✅ Status updated successfully:', response.new_status);
      } else {
        console.log('❌ Failed to update status:', response.error);
        Alert.alert(
          'Error',
          'Failed to update status. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.log('❌ Error toggling status:', error);
      Alert.alert(
        'Network Error',
        'Unable to connect to server. Please check your connection.',
        [{ text: 'OK' }]
      );
    }
  };

  // Format time as HH:MM:SS
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-GB', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Format session duration as HH:MM:SS
  const formatSessionDuration = () => {
    const now = new Date();
    const duration = Math.floor((now - sessionStartTime) / 1000); // Duration in seconds
    
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
          
          {/* Title, Weather and Clock */}
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Partner {rider?.username?.charAt(0).toUpperCase() + rider?.username?.slice(1).toLowerCase()}</Text>
            
            <View style={styles.mainInfoContainer}>
              {weather && (
                <View style={styles.weatherContainer}>
                  <Text style={styles.weatherText}>
                    {weatherService.getWeatherIcon(weather.current.weatherCode)} {weather.current.temperature}<Text style={styles.degreeSymbol}>°</Text><Text style={styles.degreeUnit}></Text>
                  </Text>
                  <Text style={styles.weatherDescription}>
                    {weatherService.getWeatherDescription(weather.current.weatherCode)}
                  </Text>
                  {locationName && (
                    <Text style={styles.locationText}>
                      {locationName}
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
              
              <View style={styles.timeColumn}>
                <View style={styles.clockContainer}>
                  <Text style={styles.clockText}>
                    {formatTime(currentTime)}
                  </Text>
                  <Text style={styles.clockDescription}>
                    Current Time
                  </Text>
                </View>
                
                <View style={styles.sessionTimerContainer}>
                  <Text style={styles.sessionTimerText}>
                    {formatSessionDuration()}
                  </Text>
                  <Text style={styles.sessionTimerDescription}>
                    Session Time
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Status Container */}
        <View style={styles.statusContainer}>
          <View style={styles.statusContent}>
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>{isOnline ? 'Online' : 'Offline'}</Text>
                <Text style={styles.statusSubtitle}>
                  {isOnline ? 'Open to any delivery.' : 'Turn on to receive Delivery Assignments'}
                </Text>
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
                <Text style={styles.viewOrdersText}>View details</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Offline Overlay */}
          {!isOnline && (
            <View style={styles.offlineOverlay}>
              <Text style={styles.offlineText}>Taking a break</Text>
              <Text style={styles.offlineSubtext}>Turn on when ready to receive orders</Text>
            </View>
          )}
        </View>

        {/* Recent Transactions */}
        <View style={styles.assignmentsContainer}>
          <View style={styles.transactionsContainer}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {recentAssignments.map((assignment, index) => (
              <View key={assignment.id}>
                <View style={styles.transactionItem}>
                  <Image source={require('../assets/down.png')} style={styles.transactionIcon} />
                  <View style={styles.transactionContent}>
                    <View style={styles.transactionHeader}>
                      <Text style={styles.restaurantName}>{assignment.restaurant}</Text>
                      <Text style={styles.assignmentAmount}>+ {assignment.amount}</Text>
                    </View>
                    <Text style={styles.customerName}>{assignment.customer}</Text>
                    <Text style={styles.assignmentAddress}>{assignment.address}</Text>
                    <Text style={styles.transactionTimestamp}>{assignment.time}</Text>
                  </View>
                </View>
                {index < recentAssignments.length - 1 && <View style={styles.separator} />}
              </View>
            ))}
          </View>
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
  mainInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    bottom: 10,
    gap: 12,
  },
  weatherContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    maxWidth: '70%',
    bottom: 8,
  },
  timeColumn: {
    alignItems: 'flex-end',
  },
  clockContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
    borderRadius: 12,
    marginBottom: 8,
    paddingVertical: 4,
  },
  weatherText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 0,
  },
  degreeSymbol: {
    fontSize: 26,
    fontWeight: 'normal',

  },
  degreeUnit: {
    fontSize: 12,
    fontWeight: 'normal',
    marginTop: -10, 
  },
  weatherDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 0,
  },
  locationText: {
    fontSize: 12,
    color: '#F43332',
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
  clockText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 0,
  },
  clockDescription: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.8,
    fontStyle: 'italic',
  },
  sessionTimerContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
    borderRadius: 12,
    paddingVertical: 4,
  },
  sessionTimerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 0,
  },
  sessionTimerDescription: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.8,
    fontStyle: 'italic',
  },

  // Status Container
  statusContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 20,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 0,
    left: 10,
  },
  statusSubtitle: {
    fontSize: 12,
    color: '#999',
    left: 10,
    bottom: 3,
  },
  toggleButton: {
    width: 40,
    height: 20,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    paddingHorizontal: 2,
    right: 10,
  },
  toggleButtonActive: {
    backgroundColor: '#F43332',
  },
  toggleCircle: {
    width: 16,
    height: 16,
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
    marginHorizontal: 0,
    borderRadius: 0,
    marginBottom: 20,
    position: 'relative',
  },
  ordersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  ordersIcon: {
    width: 70,
    height: 70,
    marginRight: 25,
    left: 6,
  },
  ordersTextContainer: {
    flex: 1,
  },
  ordersTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 0,
  },
  viewOrdersText: {
    fontSize: 14,
    color: '#F43332',
    fontWeight: '400',
    opacity: 0.8,
  },
  offlineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(244, 51, 50, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 0,
    padding: 20,
  },
  offlineText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  offlineSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    fontWeight: '500',
  },

  // Assignments Section
  assignmentsContainer: {
    paddingHorizontal: 0,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  assignmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
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
    marginBottom: 0,
  },
  assignmentAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 0,
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

  // New Transaction Styles
  transactionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
 
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
    opacity: 0.6,
  },
  transactionContent: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionTimestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginLeft: 65,
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


