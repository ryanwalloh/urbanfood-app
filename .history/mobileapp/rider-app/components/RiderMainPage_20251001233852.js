import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { weatherService } from '../services/weatherService';

const { width } = Dimensions.get('window');

const RiderMainPage = ({ onLogout }) => {
  const [rider, setRider] = useState(null);
  const [weather, setWeather] = useState(null);
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

      // Get weather data
      const weatherData = await weatherService.getWeatherData(latitude, longitude);
      if (weatherData.success) {
        setWeather(weatherData);
      } else {
        console.log('Weather fetch failed:', weatherData.error);
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
            <Text style={styles.heroTitle}>Partner {rider?.username}</Text>
            
            {weather && (
              <View style={styles.weatherContainer}>
                <Text style={styles.weatherText}>
                  {weatherService.getWeatherIcon(weather.current.weatherCode)} {weather.current.temperature}°C
                </Text>
                <Text style={styles.weatherDescription}>
                  {weatherService.getWeatherDescription(weather.current.weatherCode)}
                </Text>
                <Text style={styles.weatherMessage}>
                  {weatherService.getWeatherMessage(
                    weather.current.weatherCode, 
                    weather.current.temperature, 
                    weather.current.windSpeed
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
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    color: '#111',
    fontWeight: '600',
  },
  loading: {
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#F43332',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RiderMainPage;


