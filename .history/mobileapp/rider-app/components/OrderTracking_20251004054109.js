import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  Dimensions,
  Alert,
  PermissionsAndroid,
  Platform
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { apiService } from '../services/api';

const { width, height } = Dimensions.get('window');

const OrderTracking = ({ orderId, onBack }) => {
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [restaurantLocation, setRestaurantLocation] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [region, setRegion] = useState({
    latitude: 8.2275, // Iligan City coordinates
    longitude: 124.2458,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Animation values
  const translateY = useSharedValue(0);
  const mapHeight = useSharedValue(350);
  const contentHeight = useSharedValue(height - 350);
  
  // Constants for snap points
  const SNAP_POINTS = {
    COLLAPSED: height - 200, // Show only 200px of content
    EXPANDED: 100, // Show most of the content
    FULL: 0, // Show all content
  };
  
  const currentSnapPoint = useRef('COLLAPSED');

  useEffect(() => {
    fetchOrderDetails();
    requestLocationPermission();
  }, [orderId]);

  // Recalculate route when both rider and restaurant locations are available
  useEffect(() => {
    if (riderLocation && orderDetails?.restaurant_street) {
      calculateRouteFromAddress(riderLocation, orderDetails.restaurant_street);
    }
  }, [riderLocation, orderDetails]);

  // Gesture handler for dragging
  const panGesture = Gesture.Pan()
    .onStart((event) => {
      'worklet';
    })
    .onUpdate((event) => {
      'worklet';
      const newTranslateY = translateY.value + event.translationY;
      const clampedTranslateY = Math.max(SNAP_POINTS.FULL, Math.min(SNAP_POINTS.COLLAPSED, newTranslateY));
      translateY.value = clampedTranslateY;
      
      // Update map and content heights based on drag
      const progress = (clampedTranslateY - SNAP_POINTS.FULL) / (SNAP_POINTS.COLLAPSED - SNAP_POINTS.FULL);
      mapHeight.value = 350 + (progress * (height - 350));
      contentHeight.value = height - 350 - (progress * (height - 350));
    })
    .onEnd((event) => {
      'worklet';
      const velocity = event.velocityY;
      const currentY = translateY.value;
      
      let targetSnapPoint;
      
      // Determine snap point based on velocity and current position
      if (velocity > 500) {
        // Fast downward swipe
        if (currentSnapPoint.current === 'FULL') {
          targetSnapPoint = 'EXPANDED';
        } else if (currentSnapPoint.current === 'EXPANDED') {
          targetSnapPoint = 'COLLAPSED';
        } else {
          targetSnapPoint = 'COLLAPSED';
        }
      } else if (velocity < -500) {
        // Fast upward swipe
        if (currentSnapPoint.current === 'COLLAPSED') {
          targetSnapPoint = 'EXPANDED';
        } else if (currentSnapPoint.current === 'EXPANDED') {
          targetSnapPoint = 'FULL';
        } else {
          targetSnapPoint = 'FULL';
        }
      } else {
        // Slow drag - snap to nearest point
        const distances = {
          COLLAPSED: Math.abs(currentY - SNAP_POINTS.COLLAPSED),
          EXPANDED: Math.abs(currentY - SNAP_POINTS.EXPANDED),
          FULL: Math.abs(currentY - SNAP_POINTS.FULL),
        };
        
        targetSnapPoint = Object.keys(distances).reduce((a, b) => 
          distances[a] < distances[b] ? a : b
        );
      }
      
      currentSnapPoint.current = targetSnapPoint;
      
      // Animate to target snap point
      translateY.value = withSpring(SNAP_POINTS[targetSnapPoint], {
        damping: 15,
        stiffness: 150,
      });
      
      // Update map and content heights
      const progress = (SNAP_POINTS[targetSnapPoint] - SNAP_POINTS.FULL) / (SNAP_POINTS.COLLAPSED - SNAP_POINTS.FULL);
      mapHeight.value = withSpring(350 + (progress * (height - 350)), {
        damping: 15,
        stiffness: 150,
      });
      contentHeight.value = withSpring(height - 350 - (progress * (height - 350)), {
        damping: 15,
        stiffness: 150,
      });
    });

  // Animated styles
  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const animatedMapStyle = useAnimatedStyle(() => {
    return {
      height: mapHeight.value,
    };
  });

  const animatedContentContainerStyle = useAnimatedStyle(() => {
    return {
      height: contentHeight.value,
    };
  });

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to track delivery.');
        return;
      }
      getCurrentLocation();
    } catch (error) {
      console.log('Location permission error:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const { latitude, longitude } = location.coords;
      const riderCoords = { latitude, longitude };
      setRiderLocation(riderCoords);
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      
        // Calculate route when both rider and restaurant locations are available
        if (restaurantLocation && orderDetails) {
          calculateRouteFromAddress(riderCoords, orderDetails.restaurant_street);
        }
    } catch (error) {
      console.log('Location error:', error);
      Alert.alert('Location Error', 'Unable to get your current location.');
    }
  };

  const calculateRouteFromAddress = async (start, destinationAddress) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${start.latitude},${start.longitude}&destination=${encodeURIComponent(destinationAddress)}&key=AIzaSyCCuDLJMhB-23kQiXYpXwi-yYGvKz7OgSQ`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = [];
        
        // Decode the polyline points from the route
        route.legs.forEach(leg => {
          leg.steps.forEach(step => {
            const points = decodePolyline(step.polyline.points);
            coordinates.push(...points);
          });
        });
        
        setRouteCoordinates(coordinates);
        console.log('✅ Route calculated successfully with', coordinates.length, 'points');
      } else {
        console.log('Directions API error:', data.status);
        // Fallback to straight line
        const coordinates = [
          { latitude: start.latitude, longitude: start.longitude },
          { latitude: restaurantLocation?.latitude || start.latitude, longitude: restaurantLocation?.longitude || start.longitude }
        ];
        setRouteCoordinates(coordinates);
      }
    } catch (error) {
      console.log('Route calculation error:', error);
      // Fallback to straight line
      const coordinates = [
        { latitude: start.latitude, longitude: start.longitude },
        { latitude: restaurantLocation?.latitude || start.latitude, longitude: restaurantLocation?.longitude || start.longitude }
      ];
      setRouteCoordinates(coordinates);
    }
  };

  // Simple polyline decoder
  const decodePolyline = (encoded) => {
    const points = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charAt(index++).charCodeAt(0) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charAt(index++).charCodeAt(0) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📋 Fetching order details for tracking:', orderId);
      
      const response = await apiService.getOrderDetails(orderId);
      
      if (response.success) {
        setOrderDetails(response);
        console.log('✅ Order details fetched successfully:', response);
        
        // Set restaurant and customer locations (using mock coordinates for now)
        // In a real app, you would geocode the addresses
        const restaurantCoords = {
          latitude: 8.2280,
          longitude: 124.2460,
        };
        const customerCoords = {
          latitude: 8.2270,
          longitude: 124.2455,
        };
        
        setRestaurantLocation(restaurantCoords);
        setCustomerLocation(customerCoords);
        
        // Calculate route when both rider and restaurant locations are available
        if (riderLocation) {
          calculateRouteFromAddress(riderLocation, response.restaurant_street);
        }
      } else {
        setError(response.error || 'Failed to fetch order details');
        console.log('❌ Failed to fetch order details:', response.error);
      }
    } catch (error) {
      console.log('❌ Order details fetch error:', error);
      setError(error.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      console.log('🔄 Updating order status to:', newStatus);
      
      const response = await apiService.acceptOrder(orderId);
      
      if (response.success) {
        Alert.alert('Success', response.message || 'Order status updated successfully');
        // Refresh order details
        fetchOrderDetails();
      } else {
        Alert.alert('Error', response.error || 'Failed to update order status');
      }
    } catch (error) {
      console.log('❌ Update status error:', error);
      Alert.alert('Error', 'Network error occurred');
    }
  };

  const renderOrderDetails = () => {
    if (!orderDetails) return null;

    return (
      <View style={styles.content}>
        {/* Order Number */}
        <View style={styles.orderNumberContainer}>
          <Text style={styles.orderNumberLabel}>Order No.</Text>
          <Text style={styles.orderNumberValue}>#{orderDetails.order_id}</Text>
        </View>

        {/* Restaurant Calling Card */}
        <View style={styles.callingCard}>
          <View style={styles.profileIconContainer}>
            {orderDetails.restaurant_profile ? (
              <Image 
                source={{ uri: orderDetails.restaurant_profile }} 
                style={styles.profileIcon}
                onError={() => console.log('Failed to load restaurant profile image')}
              />
            ) : (
              <View style={styles.defaultProfileIcon}>
                <Text style={styles.defaultProfileText}>
                  {orderDetails.restaurant_name?.charAt(0) || 'R'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.callingCardInfo}>
            <Text style={styles.callingCardTitle}>
              {orderDetails.restaurant_name} - {orderDetails.restaurant_barangay}
            </Text>
            <Text style={styles.callingCardSubtitle}>Restaurant</Text>
          </View>
          <TouchableOpacity style={styles.callButton}>
            <Image 
              source={require('../assets/call.png')} 
              style={styles.callIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Progress Guide */}
        <View style={styles.progressGuide}>
          {/* Pickup Point */}
          <View style={styles.progressItem}>
            <View style={styles.iconContainer}>
              <Image 
                source={require('../assets/pickup-point.png')} 
                style={styles.progressIcon}
                resizeMode="contain"
              />
              <View style={styles.verticalLine} />
            </View>
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressTitle}>{orderDetails.restaurant_barangay}</Text>
              <Text style={styles.progressSubtitle}>Pickup Point</Text>
            </View>
          </View>

          {/* Drop Point */}
          <View style={styles.progressItem}>
            <View style={styles.iconContainer}>
              <Image 
                source={require('../assets/drop-point.png')} 
                style={styles.progressIcon}
                resizeMode="contain"
              />
            </View>
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressTitle}>{orderDetails.customer_barangay}</Text>
              <Text style={styles.progressSubtitle}>Drop Point</Text>
            </View>
          </View>
        </View>

        {/* Delivery Type and Amount */}
        <View style={styles.deliveryTypeContainer}>
          <View style={styles.deliveryTypeHeader}>
            <Text style={styles.deliveryTypeLabel}>Delivery Type</Text>
            <Text style={styles.amountLabel}>Amount</Text>
          </View>
          <View style={styles.deliveryTypeContent}>
            <Text style={styles.deliveryTypeTitle}>Cash On Delivery</Text>
            <Text style={styles.totalAmount}>₱{orderDetails.total_amount || '0.00'}</Text>
          </View>
        </View>

        {/* Order Picked Up Button */}
        <TouchableOpacity style={styles.pickedUpButton}>
          <Image 
            source={require('../assets/bag.png')} 
            style={styles.bagIcon}
            resizeMode="contain"
          />
          <Text style={styles.pickedUpButtonText}>Order Picked Up</Text>
        </TouchableOpacity>

        {/* Bottom padding for navigation */}
        <View style={styles.bottomPadding} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Map Container */}
      <Animated.View style={[styles.mapContainer, animatedMapStyle]}>
        <MapView
          style={styles.map}
          region={region}
          showsUserLocation={true}
          showsMyLocationButton={false}
        >
          {/* Route Line */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#F43332"
              strokeWidth={4}
              strokeOpacity={0.8}
            />
          )}
          
          {/* Rider Location */}
          {riderLocation && (
            <Marker
              coordinate={riderLocation}
              title="Your Location"
              pinColor="blue"
            />
          )}
          
          {/* Restaurant Location */}
          {restaurantLocation && (
            <Marker
              coordinate={restaurantLocation}
              title="Restaurant"
              pinColor="red"
            />
          )}
          
          {/* Customer Location */}
          {customerLocation && (
            <Marker
              coordinate={customerLocation}
              title="Customer"
              pinColor="green"
            />
          )}
        </MapView>

        {/* Floating Destination Container */}
        <View style={styles.floatingContainer}>
          <Image 
            source={require('../assets/pin.png')} 
            style={styles.pinIcon}
            resizeMode="contain"
          />
          <View style={styles.destinationTextContainer}>
            <Text style={styles.destinationLabel}>Destination</Text>
            <Text style={styles.destinationAddress}>
              {orderDetails?.restaurant_street}, {orderDetails?.restaurant_barangay}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.contentContainer, animatedContentContainerStyle, animatedContentStyle]}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />
          
          <ScrollView style={styles.scrollContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading order details...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Error</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchOrderDetails}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              renderOrderDetails()
            )}
          </ScrollView>
        </Animated.View>
      </GestureDetector>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mapContainer: {
    height: 350,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  floatingContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pinIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  destinationTextContainer: {
    flex: 1,
  },
  destinationLabel: {
    fontSize: 16,
    fontFamily: 'Nexa-Heavy',
    color: '#1A1A1A',
    textAlign: 'left',
    marginBottom: 2,
  },
  destinationAddress: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666666',
    textAlign: 'left',
  },
  formattedAddress: {
    fontSize: 12,
    fontFamily: 'Nexa-ExtraLight',
    color: '#999999',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  orderNumberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  orderNumberLabel: {
    fontSize: 16,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666666',
  },
  orderNumberValue: {
    fontSize: 18,
    fontFamily: 'Nexa-Heavy',
    color: '#1A1A1A',
  },
  callingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  profileIconContainer: {
    marginRight: 15,
  },
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultProfileIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F43332',
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultProfileText: {
    fontSize: 20,
    fontFamily: 'Nexa-Heavy',
    color: '#FFFFFF',
  },
  callingCardInfo: {
    flex: 1,
  },
  callingCardTitle: {
    fontSize: 16,
    fontFamily: 'Nexa-Heavy',
    color: '#1A1A1A',
    marginBottom: 5,
  },
  callingCardSubtitle: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666666',
  },
  callButton: {
    padding: 10,
  },
  callIcon: {
    width: 24,
    height: 24,
  },
  progressGuide: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginRight: 12,
    minWidth: 20,
  },
  progressIcon: {
    width: 20,
    height: 20,
  },
  progressTextContainer: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontFamily: 'Nexa-Heavy',
    color: '#1A1A1A',
    marginBottom: 5,
  },
  progressSubtitle: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666666',
  },
  verticalLine: {
    width: 2,
    height: 25,
    backgroundColor: '#E5E5E5',
    marginTop: 5,
  },
  deliveryTypeContainer: {
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  deliveryTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  deliveryTypeLabel: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#FFFFFF',
  },
  amountLabel: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#FFFFFF',
  },
  deliveryTypeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryTypeTitle: {
    fontSize: 16,
    fontFamily: 'Nexa-Heavy',
    color: '#FFFFFF',
  },
  totalAmount: {
    fontSize: 18,
    fontFamily: 'Nexa-Heavy',
    color: '#FFFFFF',
  },
  pickedUpButton: {
    backgroundColor: '#F43332',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  bagIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  pickedUpButtonText: {
    fontSize: 16,
    fontFamily: 'Nexa-Heavy',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  errorTitle: {
    fontSize: 24,
    fontFamily: 'Nexa-Heavy',
    color: '#1A1A1A',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#F43332',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Nexa-Heavy',
    color: '#FFFFFF',
  },

  // Bottom Padding
  bottomPadding: {
    height: 20,
  },
});

export default OrderTracking;
