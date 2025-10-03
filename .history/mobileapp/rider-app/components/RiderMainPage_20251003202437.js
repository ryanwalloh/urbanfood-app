import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, Alert, Animated, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { weatherService } from '../services/weatherService';
import { apiService } from '../services/api';
import Profile from './Profile';

const { width } = Dimensions.get('window');

const RiderMainPage = ({ onLogout }) => {
  const [rider, setRider] = useState(null);
  const [weather, setWeather] = useState(null);
  const [locationName, setLocationName] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [activeNav, setActiveNav] = useState('home');
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('main');
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [ordersCount, setOrdersCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessionStartTime, setSessionStartTime] = useState(new Date());
  
  // Animation values
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const toggleScale = useRef(new Animated.Value(1)).current;
  const shimmerOpacity = useRef(new Animated.Value(0.3)).current;
  const weatherLoadingRotation = useRef(new Animated.Value(0)).current;
  const weatherContentOpacity = useRef(new Animated.Value(0)).current;
  const weatherDelayTimeoutRef = useRef(null);
  const wsConnectionRef = useRef(null);
  
  // Sync mechanism
  const syncTimeoutRef = useRef(null);
  const lastSyncTime = useRef(null);
  const skeletonTimeoutRef = useRef(null);

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
          
          // Auto-set rider online when they log in (standard practice)
          await setRiderOnline();
          
          // Initial sync with backend to ensure consistency
          await syncWithBackend();
          
          // Start periodic sync
          scheduleSync(300000); // First sync in 5 minutes
          
          // Set skeleton timeout (max 2 seconds)
          skeletonTimeoutRef.current = setTimeout(() => {
            setLoading(false);
          }, 2000);
          
          // Get location and weather (non-blocking)
          getLocationAndWeather().finally(() => {
            setWeatherLoading(false);
          });
          
          // Get orders count (non-blocking)
          getOrdersCount();
          
          // Connect to WebSocket for order updates
          connectToOrderUpdates();
        }
      } catch (error) {
        console.log('Error loading data:', error);
      } finally {
        // Clear skeleton timeout if data loads before 2 seconds
        if (skeletonTimeoutRef.current) {
          clearTimeout(skeletonTimeoutRef.current);
        }
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

  // Initialize overlay opacity based on initial online status
  useEffect(() => {
    overlayOpacity.setValue(isOnline ? 0 : 1);
  }, [isOnline, overlayOpacity]);

  // App state listener to detect when rider backgrounds/closes app
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      console.log('📱 App state changed to:', nextAppState);
      console.log('📊 Current isOnline state:', isOnline);
      
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Rider is backgrounding the app or switching to another app
        console.log('🔄 Rider backgrounded app, setting offline...');
        setRiderOffline();
      } else if (nextAppState === 'active') {
        // Rider is returning to the app
        console.log('🔄 Rider returned to app, setting online...');
        console.log('📊 About to call setRiderOnline, current state:', isOnline);
        setRiderOnline();
      }
    };

    // Add app state listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup listener on unmount
    return () => {
      subscription?.remove();
    };
  }, [isOnline]);

  // Cleanup timeouts and connections on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      if (skeletonTimeoutRef.current) {
        clearTimeout(skeletonTimeoutRef.current);
      }
      if (weatherDelayTimeoutRef.current) {
        clearTimeout(weatherDelayTimeoutRef.current);
      }
      if (wsConnectionRef.current) {
        console.log('📡 Closing connection...');
        wsConnectionRef.current.close();
      }
    };
  }, []);

  const getOrdersCount = async () => {
    try {
      console.log('📦 Fetching orders count...');
      const response = await apiService.getPendingOrdersCount();
      
      if (response.success) {
        setOrdersCount(response.count);
        console.log('✅ Orders count updated:', response.count);
      } else {
        console.log('❌ Failed to get orders count:', response.error);
        setOrdersCount(0); // Fallback to 0
      }
    } catch (error) {
      console.log('❌ Orders count error:', error);
      setOrdersCount(0); // Fallback to 0
    }
  };

  const connectToOrderUpdates = () => {
    try {
      console.log('📡 Setting up connection for order updates...');
      
      const connection = apiService.connectToOrderUpdates(
        (data) => {
          // Handle incoming order count updates
          if (data.count !== undefined) {
            const connectionType = connection?.getConnectionType?.() || 'unknown';
            setOrdersCount(data.count);
            console.log('📦 Order count update received:', data.count);
            console.log(`🎯 Update method: ${connectionType.toUpperCase()}`);
            console.log(`📊 New order count: ${data.count} ${data.count === 1 ? 'order' : 'orders'} available`);
          }
        },
        (error) => {
          console.log('❌ Connection error:', error);
          // Connection will auto-fallback to polling
        }
      );
      
      wsConnectionRef.current = connection;
      
    } catch (error) {
      console.log('❌ Failed to setup connection:', error);
    }
  };

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
      // Try Open-Meteo first (free, no API key), then fallback to OpenWeatherMap
      const [weatherData, locationData] = await Promise.allSettled([
        weatherService.getWeatherData(latitude, longitude).catch(async (error) => {
          console.log('🔄 Open-Meteo failed, trying OpenWeatherMap fallback...');
          return weatherService.getWeatherDataOpenWeatherMap(latitude, longitude);
        }),
        weatherService.getLocationName(latitude, longitude)
      ]);

      // Handle weather data
      if (weatherData.status === 'fulfilled' && weatherData.value.success) {
        setWeather(weatherData.value);
        console.log('✅ Real-time weather loaded successfully from:', weatherData.value.apiSource);
      } else {
        console.log('❌ All weather APIs failed:', weatherData.reason || weatherData.value?.error);
        // Don't set weather data if all APIs fail - this will hide the weather container
      }

      // Handle location data
      if (locationData.status === 'fulfilled' && locationData.value.success) {
        setLocationName(locationData.value.location);
      } else {
        console.log('❌ Location fetch failed:', locationData.reason || locationData.value?.error);
        setLocationName('Iligan City'); // Fallback to Iligan City
      }
    } catch (error) {
      console.log('Location/Weather error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out rider...');
      
      // 1. Clean up all connections and timers
      console.log('🧹 Cleaning up connections and timers...');
      
      // Clear sync timeout
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
      
      // Clear skeleton timeout
      if (skeletonTimeoutRef.current) {
        clearTimeout(skeletonTimeoutRef.current);
        skeletonTimeoutRef.current = null;
      }
      
      // Clear weather delay timeout
      if (weatherDelayTimeoutRef.current) {
        clearTimeout(weatherDelayTimeoutRef.current);
        weatherDelayTimeoutRef.current = null;
      }
      
      // Close WebSocket connection
      if (wsConnectionRef.current) {
        console.log('📡 Closing WebSocket connection...');
        wsConnectionRef.current.close();
        wsConnectionRef.current = null;
      }
      
      // 2. Logout from backend (non-blocking)
      try {
        console.log('📤 Logging out from backend...');
        await apiService.logout();
        console.log('✅ Backend logout completed');
      } catch (error) {
        console.log('⚠️ Failed to logout from backend:', error.message);
        // Continue with logout even if backend call fails
      }
      
      // 3. Clear local storage
      console.log('🗑️ Clearing local storage...');
      await AsyncStorage.removeItem('rider:user');
      
      // 4. Reset all state
      setRider(null);
      setWeather(null);
      setLocationName(null);
      setIsOnline(false);
      setActiveNav('home');
      setCurrentScreen('main');
      setWeatherLoading(true);
      setOrdersCount(0);
      setCurrentTime(new Date());
      setSessionStartTime(new Date());
      
      console.log('✅ Logout completed successfully');
      
      // 5. Call parent logout handler
      onLogout?.();
      
    } catch (error) {
      console.log('❌ Error during logout:', error);
      // Even if there's an error, still try to logout
      await AsyncStorage.removeItem('rider:user');
      onLogout?.();
    }
  };

  const handleNavigateToProfile = () => {
    setCurrentScreen('profile');
    setActiveNav('profile');
  };

  const handleBackToMain = () => {
    setCurrentScreen('main');
    setActiveNav('home');
  };

  // Robust sync function to ensure frontend-backend consistency
  const syncWithBackend = async () => {
    try {
      console.log('🔄 Syncing with backend...');
      
      const response = await apiService.getRiderStatus();
      
      if (response.success && response.is_available !== undefined) {
        const backendStatus = response.is_available;
        const frontendStatus = isOnline;
        
        console.log('📊 Frontend status:', frontendStatus, 'Backend status:', backendStatus);
        
        // Check for inconsistency
        if (frontendStatus !== backendStatus) {
          console.log('⚠️ Status mismatch detected! Syncing backend to frontend...');
          console.log('📊 Frontend shows:', frontendStatus ? 'online.png' : 'offline.png');
          console.log('📊 Backend shows:', backendStatus ? 'online' : 'offline');
          
          // Update backend to match frontend (displayed button is source of truth)
          apiService.toggleStatus().then(response => {
            console.log('✅ Backend synced to frontend status:', response.new_status);
          }).catch(error => {
            console.log('❌ Failed to sync backend to frontend:', error.message);
          });
        } else {
          console.log('✅ Frontend and backend are in sync');
        }
        
        lastSyncTime.current = Date.now();
      }
    } catch (error) {
      console.log('❌ Sync error:', error);
    }
  };

  // Schedule periodic sync (every 5 minutes)
  const scheduleSync = (delay = 300000) => { // 5 minutes = 300,000ms
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      syncWithBackend();
      scheduleSync(300000); // Next sync in 5 minutes
    }, delay);
  };

  // Simple function to set rider online (for login/app open)
  const setRiderOnline = async () => {
    try {
      console.log('🔄 Setting rider online...');
      
      // Only request backend if currently not online
      if (!isOnline) {
        // 1. Update UI immediately
        setIsOnline(true);
        
        // 2. Update overlay animation
        Animated.timing(overlayOpacity, {
          toValue: 0, // Hide overlay (online)
          duration: 300,
          useNativeDriver: true,
        }).start();
        
        // 3. Update backend (non-blocking)
        apiService.toggleStatus().then(response => {
          console.log('✅ Backend updated to online:', response.new_status);
        }).catch(error => {
          console.log('❌ Backend update failed:', error.message);
        });
      } else {
        console.log('✅ Already online, no backend request needed');
      }
    } catch (error) {
      console.log('❌ Error setting online:', error);
    }
  };

  // Simple function to set rider offline (for app close/background)
  const setRiderOffline = async () => {
    try {
      console.log('🔄 Setting rider offline...');
      
      // Only request backend if currently online
      if (isOnline) {
        // 1. Update UI immediately
        setIsOnline(false);
        
        // 2. Update overlay animation
        Animated.timing(overlayOpacity, {
          toValue: 1, // Show overlay (offline)
          duration: 300,
          useNativeDriver: true,
        }).start();
        
        // 3. Update backend (non-blocking)
        apiService.toggleStatus().then(response => {
          console.log('✅ Backend updated to offline:', response.new_status);
        }).catch(error => {
          console.log('❌ Backend update failed:', error.message);
        });
      } else {
        console.log('✅ Already offline, no backend request needed');
      }
    } catch (error) {
      console.log('❌ Error setting offline:', error);
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      console.log('🔄 Toggling rider status...');
      
      // Animate toggle button press
      Animated.sequence([
        Animated.timing(toggleScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(toggleScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Determine new status based on current button state
      const currentStatus = isOnline;
      const newStatus = !currentStatus;
      
      // 1. Update UI immediately
      setIsOnline(newStatus);
      
      // 2. Update overlay animation
      Animated.timing(overlayOpacity, {
        toValue: newStatus ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // 3. Update backend (non-blocking)
      apiService.toggleStatus().then(response => {
        console.log('✅ Backend updated to:', response.new_status);
      }).catch(error => {
        console.log('❌ Backend update failed:', error.message);
        // Could show error alert here if needed
      });
    } catch (error) {
      console.log('❌ Unexpected error:', error);
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

  // Shimmer animation for skeleton loading
  useEffect(() => {
    if (loading) {
      const shimmerAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerOpacity, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerOpacity, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      shimmerAnimation.start();
      
      return () => shimmerAnimation.stop();
    }
  }, [loading, shimmerOpacity]);

  // Weather loading circle animation
  useEffect(() => {
    if (weatherLoading) {
      const rotationAnimation = Animated.loop(
        Animated.timing(weatherLoadingRotation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      );
      rotationAnimation.start();
      
      return () => rotationAnimation.stop();
    }
  }, [weatherLoading, weatherLoadingRotation]);

  // Weather content fade-in animation with delay
  useEffect(() => {
    if (weather && !weatherLoading) {
      // Clear any existing timeout
      if (weatherDelayTimeoutRef.current) {
        clearTimeout(weatherDelayTimeoutRef.current);
      }
      
      // Reset opacity to 0 first
      weatherContentOpacity.setValue(0);
      
      // Wait 0.8s before starting fade-in animation
      weatherDelayTimeoutRef.current = setTimeout(() => {
        Animated.timing(weatherContentOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, 800);
    }
    
    // Cleanup timeout on unmount or dependency change
    return () => {
      if (weatherDelayTimeoutRef.current) {
        clearTimeout(weatherDelayTimeoutRef.current);
      }
    };
  }, [weather, weatherLoading, weatherContentOpacity]);

  if (loading) {
    return (
      <View style={styles.skeletonContainer}>
        {/* Header Skeleton */}
        <View style={styles.skeletonHeader}>
          <Animated.View style={[styles.skeletonAvatar, { opacity: shimmerOpacity }]} />
          <View style={styles.skeletonHeaderText}>
            <Animated.View style={[styles.skeletonName, { opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.skeletonSubtitle, { opacity: shimmerOpacity }]} />
          </View>
        </View>

        {/* Main Info Container Skeleton */}
        <View style={styles.skeletonMainInfo}>
          {/* Weather Skeleton */}
          <View style={styles.skeletonWeather}>
            <Animated.View style={[styles.skeletonWeatherIcon, { opacity: shimmerOpacity }]} />
            <View style={styles.skeletonWeatherText}>
              <Animated.View style={[styles.skeletonTemperature, { opacity: shimmerOpacity }]} />
              <Animated.View style={[styles.skeletonLocation, { opacity: shimmerOpacity }]} />
            </View>
          </View>

          {/* Time Column Skeleton */}
          <View style={styles.skeletonTimeColumn}>
            <Animated.View style={[styles.skeletonClock, { opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.skeletonTimer, { opacity: shimmerOpacity }]} />
          </View>
        </View>

        {/* Toggle Button Skeleton */}
        <View style={styles.skeletonToggleContainer}>
          <Animated.View style={[styles.skeletonToggleButton, { opacity: shimmerOpacity }]} />
        </View>

        {/* Orders Container Skeleton */}
        <View style={styles.skeletonOrdersContainer}>
          <Animated.View style={[styles.skeletonOrdersTitle, { opacity: shimmerOpacity }]} />
          <Animated.View style={[styles.skeletonOrderItem, { opacity: shimmerOpacity }]} />
          <Animated.View style={[styles.skeletonOrderItem, { opacity: shimmerOpacity }]} />
        </View>
      </View>
    );
  }

  // Show Profile screen when currentScreen is 'profile'
  if (currentScreen === 'profile') {
    return (
      <Profile 
        onLogout={handleLogout}
        onBack={handleBackToMain}
      />
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
              <View style={styles.weatherContainer}>
                {weatherLoading ? (
                  <View style={styles.weatherLoadingContainer}>
                    <Animated.View 
                      style={[
                        styles.weatherLoadingImageContainer,
                        {
                          transform: [{
                            rotate: weatherLoadingRotation.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '360deg'],
                            }),
                          }],
                        },
                      ]}
                    >
                      <Image 
                        source={require('../assets/sotiloading.png')} 
                        style={styles.weatherLoadingImage}
                        resizeMode="contain"
                      />
                    </Animated.View>
                    <Text style={styles.weatherLoadingText}>How's the weather?</Text>
                  </View>
                ) : weather ? (
                  <Animated.View style={{ opacity: weatherContentOpacity }}>
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
                  </Animated.View>
                ) : (
                  <Text style={styles.weatherErrorText}>
                    Weather unavailable
                  </Text>
                )}
              </View>
              
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
            <Animated.View style={{ transform: [{ scale: toggleScale }] }}>
              <TouchableOpacity 
                style={[styles.toggleButton, isOnline && styles.toggleButtonActive]}
                onPress={toggleOnlineStatus}
              >
                <View style={[styles.toggleCircle, isOnline && styles.toggleCircleActive]} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* Orders Container */}
        <View style={styles.ordersContainer}>
          <View style={styles.ordersContent}>
            <Image source={require('../assets/foodPack.png')} style={styles.ordersIcon} />
            <View style={styles.ordersTextContainer}>
              <Text style={styles.ordersTitle}>
                {ordersCount} {ordersCount === 1 ? 'delivery order' : 'delivery orders'} found!
              </Text>
              <TouchableOpacity>
                <Text style={styles.viewOrdersText}>View details</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Offline Overlay */}
          <Animated.View style={[styles.offlineOverlay, { opacity: overlayOpacity }]}>
            <Text style={styles.offlineText}>Taking a break</Text>
            <Text style={styles.offlineSubtext}>Turn on when ready to receive orders</Text>
          </Animated.View>
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
          onPress={handleNavigateToProfile}
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
  // Skeleton Loading Styles
  skeletonContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingTop: 100,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  skeletonAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E9ECEF',
    marginRight: 12,
  },
  skeletonHeaderText: {
    flex: 1,
  },
  skeletonName: {
    height: 20,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    marginBottom: 8,
    width: '60%',
  },
  skeletonSubtitle: {
    height: 14,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    width: '40%',
  },
  skeletonMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  skeletonWeather: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    flex: 1,
    maxWidth: '70%',
  },
  skeletonWeatherIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#E9ECEF',
    borderRadius: 20,
    marginRight: 12,
  },
  skeletonWeatherText: {
    flex: 1,
  },
  skeletonTemperature: {
    height: 24,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    marginBottom: 6,
    width: '70%',
  },
  skeletonLocation: {
    height: 14,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    width: '50%',
  },
  skeletonTimeColumn: {
    alignItems: 'flex-end',
    gap: 8,
  },
  skeletonClock: {
    width: 80,
    height: 32,
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  skeletonTimer: {
    width: 100,
    height: 28,
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  skeletonToggleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  skeletonToggleButton: {
    width: 120,
    height: 120,
    backgroundColor: '#E9ECEF',
    borderRadius: 60,
  },
  skeletonOrdersContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  skeletonOrdersTitle: {
    height: 20,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    marginBottom: 16,
    width: '40%',
  },
  skeletonOrderItem: {
    height: 60,
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
    marginBottom: 12,
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
    fontFamily: 'Nexa-Heavy',
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
  // Weather Loading PNG Styles
  weatherLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  weatherLoadingImageContainer: {
    width: 50,
    height: 50,
    marginBottom: 8,
  },
  weatherLoadingImage: {
    width: '100%',
    height: '100%',
  },
  weatherLoadingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  weatherErrorText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontStyle: 'italic',
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
    fontFamily: 'Nexa-Heavy',
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
    fontFamily: 'Nexa-ExtraLight',
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 0,
  },
  locationText: {
    fontSize: 12,
    fontFamily: 'Nexa-ExtraLight',
    color: '#F43332',
    opacity: 0.8,
    marginBottom: 4,
  },
  weatherMessage: {
    fontSize: 12,
    fontFamily: 'Nexa-ExtraLight',
    color: '#FFFFFF',
    opacity: 0.8,
    fontStyle: 'italic',
  },
  clockText: {
    fontSize: 16,
    fontFamily: 'Nexa-Heavy',
    color: '#FFFFFF',
    marginBottom: 0,
  },
  clockDescription: {
    fontSize: 11,
    fontFamily: 'Nexa-ExtraLight',
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
    fontFamily: 'Nexa-Heavy',
    color: '#FFFFFF',
    marginBottom: 0,
  },
  sessionTimerDescription: {
    fontSize: 11,
    fontFamily: 'Nexa-ExtraLight',
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
    fontFamily: 'Nexa-Heavy',
    color: '#333',
    marginBottom: 0,
    left: 10,
  },
  statusSubtitle: {
    fontSize: 12,
    fontFamily: 'Nexa-ExtraLight',
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
    fontFamily: 'Nexa-Heavy',
    color: '#333',
    marginBottom: 0,
  },
  viewOrdersText: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#F43332',
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
    fontFamily: 'Nexa-Heavy',
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


