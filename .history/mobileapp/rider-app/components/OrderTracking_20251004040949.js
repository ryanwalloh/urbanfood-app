import React, { useState, useEffect } from 'react';
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
import { apiService } from '../services/api';

const { width } = Dimensions.get('window');

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

  useEffect(() => {
    fetchOrderDetails();
    requestLocationPermission();
  }, [orderId]);

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to show your position on the map.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        } else {
          Alert.alert('Permission denied', 'Location permission is required to track delivery.');
        }
      } else {
        getCurrentLocation();
      }
    } catch (error) {
      console.log('Location permission error:', error);
    }
  };

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const riderCoords = { latitude, longitude };
        setRiderLocation(riderCoords);
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        
        // Calculate route when both rider and restaurant locations are available
        if (restaurantLocation) {
          calculateRoute(riderCoords, restaurantLocation);
        }
      },
      (error) => {
        console.log('Location error:', error);
        Alert.alert('Location Error', 'Unable to get your current location.');
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    );
  };

  const calculateRoute = (start, end) => {
    // For now, create a simple straight line between points
    // In a real app, you would use Google Directions API
    const coordinates = [
      { latitude: start.latitude, longitude: start.longitude },
      { latitude: end.latitude, longitude: end.longitude }
    ];
    setRouteCoordinates(coordinates);
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
          calculateRoute(riderLocation, restaurantCoords);
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Order Tracking</Text>
          <Text style={styles.headerSubtitle}>Order #{orderId}</Text>
        </View>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
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
          <Text style={styles.destinationLabel}>Destination</Text>
          <Text style={styles.destinationAddress}>
            {orderDetails?.restaurant_street}, {orderDetails?.restaurant_barangay}
          </Text>
          <Text style={styles.formattedAddress}>
            X7Q3+FF Marawi City, Lanao del Sur, Philippines
          </Text>
        </View>
      </View>

      {/* Content */}
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

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => onBack()}
        >
          <View style={styles.navIconContainer}>
            <Image source={require('../assets/home.png')} style={styles.navIcon} resizeMode="contain" />
          </View>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => {}} // Already on orders page
        >
          <View style={[styles.navIconContainer, styles.navIconActive]}>
            <Image source={require('../assets/orders.png')} style={styles.navIcon} resizeMode="contain" />
          </View>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Orders</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => {}} // TODO: Add support functionality
        >
          <View style={styles.navIconContainer}>
            <Image source={require('../assets/support.png')} style={styles.navIcon} resizeMode="contain" />
          </View>
          <Text style={styles.navLabel}>Support</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => {}} // TODO: Add profile navigation
        >
          <View style={styles.navIconContainer}>
            <Image source={require('../assets/profile.png')} style={styles.navIcon} resizeMode="contain" />
          </View>
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    marginRight: 15,
  },
  backIcon: {
    fontSize: 24,
    color: '#F43332',
    fontWeight: 'bold',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Nexa-Heavy',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666666',
    marginTop: 2,
  },
  mapContainer: {
    height: 300,
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
    alignSelf: 'center',
    marginBottom: 8,
  },
  destinationLabel: {
    fontSize: 16,
    fontFamily: 'Nexa-Heavy',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 5,
  },
  destinationAddress: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 5,
  },
  formattedAddress: {
    fontSize: 12,
    fontFamily: 'Nexa-ExtraLight',
    color: '#999999',
    textAlign: 'center',
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
    fontFamily: 'Nexa-ExtraLight',
    color: '#999',
  },
  navLabelActive: {
    color: '#F43332',
    fontFamily: 'Nexa-Heavy',
  },

  // Bottom Padding
  bottomPadding: {
    height: 20,
  },
});

export default OrderTracking;
