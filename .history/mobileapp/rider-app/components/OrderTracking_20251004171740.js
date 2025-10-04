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
  Platform,
  PanResponder,
  Animated,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
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
    latitude: 8.2275 + (0.005 * 0.3), // Iligan City coordinates with 30% upward offset for center top positioning
    longitude: 124.2458,
    latitudeDelta: 0.005, // Tighter zoom for better route visibility
    longitudeDelta: 0.005,
  });

  // Draggable bottom sheet states
  const [isCollapsed, setIsCollapsed] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;
  
  // Define drag limits
  const INITIAL_HEIGHT = height * 0.6; // 60% of screen height (initial state)
  const COLLAPSED_HEIGHT = height * 0.3; // 30% of screen height (collapsed state)
  const MAX_DOWNWARD_DRAG = INITIAL_HEIGHT - COLLAPSED_HEIGHT; // Maximum downward movement

  // Custom Map Style - Soti Delivery Brand
  const mapStyle = [
    {
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#F4F2F1"
        }
      ]
    },
    {
      "elementType": "labels.icon",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#6B6B6B"
        }
      ]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [
        {
          "color": "#F7F7F7"
        }
      ]
    },
    {
      "featureType": "administrative",
      "elementType": "geometry",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "administrative.land_parcel",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "administrative.neighborhood",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "poi",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "poi.business",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "geometry.fill",
      "stylers": [
        {
          "color": "#DADADA"
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "labels.icon",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry.fill",
      "stylers": [
        {
          "color": "#C5C5C5"
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry.stroke",
      "stylers": [
        {
          "color": "#B0B0B0"
        }
      ]
    },
    {
      "featureType": "road.local",
      "elementType": "labels",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "transit",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#A8C5E5"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#6B6B6B"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.stroke",
      "stylers": [
        {
          "color": "#F7F7F7"
        }
      ]
    }
  ];

  // PanResponder for optimized drag gestures with strict constraints
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to vertical gestures with minimal threshold
        const isVerticalGesture = Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
        const hasMinimumMovement = Math.abs(gestureState.dy) > 5;
        
        if (!isVerticalGesture || !hasMinimumMovement) {
          return false;
        }
        
        // Get current position to determine allowed directions
        const currentY = translateY._value;
        
        // Define drag restrictions based on current position
        const isAtInitialState = currentY <= 5; // Within 5px of initial state (0)
        const isAtCollapsedState = currentY >= MAX_DOWNWARD_DRAG - 5; // Within 5px of collapsed state
        
        // Restrict drag up when at initial state
        if (gestureState.dy < 0 && isAtInitialState) {
          return false;
        }
        
        // Restrict drag down when at collapsed state
        if (gestureState.dy > 0 && isAtCollapsedState) {
          return false;
        }
        
        return true;
      },
      onPanResponderGrant: (evt, gestureState) => {
        // Store current position and reset gesture
        translateY.setOffset(translateY._value);
        translateY.setValue(0);
        // Update collapsed state based on current position
        setIsCollapsed(translateY._value > MAX_DOWNWARD_DRAG / 2);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Get current absolute position
        const currentAbsoluteY = translateY._offset + gestureState.dy;
        
        // Define strict boundaries
        const MIN_Y = 0; // Initial state (60% height)
        const MAX_Y = MAX_DOWNWARD_DRAG; // Collapsed state (30% height)
        
        // Apply strict constraints
        let constrainedValue;
        
        if (currentAbsoluteY < MIN_Y) {
          // Prevent dragging above initial state
          constrainedValue = MIN_Y - translateY._offset;
        } else if (currentAbsoluteY > MAX_Y) {
          // Prevent dragging below collapsed state
          constrainedValue = MAX_Y - translateY._offset;
        } else {
          // Allow normal movement within bounds
          constrainedValue = gestureState.dy;
        }
        
        translateY.setValue(constrainedValue);
        
        // Update collapsed state for visual feedback
        const finalY = translateY._offset + constrainedValue;
        setIsCollapsed(finalY > MAX_DOWNWARD_DRAG / 2);
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Flatten offset to make current position permanent
        translateY.flattenOffset();
        
        // Final constraint check to ensure we're within bounds
        const finalValue = translateY._value;
        const clampedValue = Math.max(0, Math.min(MAX_DOWNWARD_DRAG, finalValue));
        
        // If value was out of bounds, clamp it
        if (clampedValue !== finalValue) {
          translateY.setValue(clampedValue);
        }
        
        // Update collapsed state based on final position
        setIsCollapsed(clampedValue > MAX_DOWNWARD_DRAG / 2);
      },
    })
  ).current;

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

  // Adjust map region to fit route when route coordinates are available
  useEffect(() => {
    if (routeCoordinates.length > 0 && riderLocation) {
      adjustMapRegionToFitRoute();
    }
  }, [routeCoordinates, riderLocation]);

  // Function to adjust map region to fit the entire route while keeping rider at center top
  const adjustMapRegionToFitRoute = () => {
    if (routeCoordinates.length === 0 || !riderLocation) return;

    // Calculate bounds of the route
    let minLat = routeCoordinates[0].latitude;
    let maxLat = routeCoordinates[0].latitude;
    let minLng = routeCoordinates[0].longitude;
    let maxLng = routeCoordinates[0].longitude;

    routeCoordinates.forEach(coord => {
      minLat = Math.min(minLat, coord.latitude);
      maxLat = Math.max(maxLat, coord.latitude);
      minLng = Math.min(minLng, coord.longitude);
      maxLng = Math.max(maxLng, coord.longitude);
    });

    // Add padding to the bounds
    const latPadding = (maxLat - minLat) * 0.1;
    const lngPadding = (maxLng - minLng) * 0.1;

    // Calculate deltas to fit the route
    const latDelta = Math.max(maxLat - minLat + latPadding, 0.005); // Minimum zoom level
    const lngDelta = Math.max(maxLng - minLng + lngPadding, 0.005);

    // Position the map so rider appears at center top
    // Move the map center upward by 30% of the latitude delta to place rider at top
    const centerLat = riderLocation.latitude + (latDelta * -0.8);
    const centerLng = riderLocation.longitude; // Keep rider horizontally centered

    const routeRegion = {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
    
    console.log('🗺️ Adjusting region to fit route with rider at center top:', {
      riderLocation,
      routeRegion,
      routeBounds: { minLat, maxLat, minLng, maxLng }
    });
    
    setRegion(routeRegion);
  };

  // ---

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
      
      // Position rider at center top of map layout
      const adjustedRegion = {
        latitude: latitude + (0.005 * 0.8), // Move center 30% of latitudeDelta upward to place rider at top
        longitude, // Keep rider horizontally centered
        latitudeDelta: 0.005, // Tighter zoom for better route visibility
        longitudeDelta: 0.005,
      };
      
      console.log('📍 Setting initial region with rider at center top:', {
        riderLocation: { latitude, longitude },
        mapCenter: adjustedRegion,
        offset: 0.005 * 0.3
      });
      
      setRegion(adjustedRegion);
      
        // Calculate route when both rider and restaurant locations are available
        if (restaurantLocation && orderDetails) {
          calculateRouteFromAddress(riderCoords, orderDetails.restaurant_street);
        }
    } catch (error) {
      console.log('Location error:', error);
      setError('Unable to get your current location. Please enable location services and try again.');
    }
  };

  // Function to geocode addresses to coordinates
  const geocodeAddresses = async (orderData) => {
    try {
      // Geocode restaurant address
      if (orderData.restaurant_street) {
        const restaurantResponse = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(orderData.restaurant_street + ', ' + orderData.restaurant_barangay)}&key=AIzaSyCCuDLJMhB-23kQiXYpXwi-yYGvKz7OgSQ`
        );
        const restaurantData = await restaurantResponse.json();
        
        if (restaurantData.status === 'OK' && restaurantData.results.length > 0) {
          const location = restaurantData.results[0].geometry.location;
          const restaurantCoords = {
            latitude: location.lat,
            longitude: location.lng,
          };
          setRestaurantLocation(restaurantCoords);
          console.log('✅ Restaurant location geocoded:', restaurantCoords);
        } else {
          console.log('❌ Failed to geocode restaurant address');
          setError('Unable to locate restaurant address. Please check your connection and try again.');
        }
      }

      // Geocode customer address
      if (orderData.customer_barangay) {
        const customerResponse = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(orderData.customer_barangay)}&key=AIzaSyCCuDLJMhB-23kQiXYpXwi-yYGvKz7OgSQ`
        );
        const customerData = await customerResponse.json();
        
        if (customerData.status === 'OK' && customerData.results.length > 0) {
          const location = customerData.results[0].geometry.location;
          const customerCoords = {
            latitude: location.lat,
            longitude: location.lng,
          };
          setCustomerLocation(customerCoords);
          console.log('✅ Customer location geocoded:', customerCoords);
        } else {
          console.log('❌ Failed to geocode customer address');
          setError('Unable to locate customer address. Please check your connection and try again.');
        }
      }
    } catch (error) {
      console.log('❌ Geocoding error:', error);
      setError('Unable to load location data. Please check your internet connection and try again.');
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
        
        // Geocode restaurant and customer addresses to get real coordinates
        await geocodeAddresses(response);
        
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
      {/* Map Container - Full Screen Background */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={region}
          showsUserLocation={true}
          showsMyLocationButton={false}
          customMapStyle={mapStyle}
          mapType="standard"
          showsBuildings={false}
          showsIndoors={false}
          showsTraffic={false}
          showsPointsOfInterest={false}
        >
          {/* Route Line - Brand Red with Enhanced Visibility */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#F43332"
              strokeWidth={6}
              strokeOpacity={0.9}
            />
          )}
          
          {/* Rider Location - Custom Asset Marker */}
          {riderLocation && (
            <Marker
              coordinate={riderLocation}
              title="Your Location"
              pinColor="transparent"
            >
              <View style={styles.customMarkerContainer}>
                <Image 
                  source={require('../assets/ridermarker.png')} 
                  style={styles.markerImage}
                  resizeMode="contain"
                />
              </View>
            </Marker>
          )}
          
          {/* Restaurant Location - Custom Asset Marker */}
          {restaurantLocation && (
            <Marker
              coordinate={restaurantLocation}
              title="Restaurant"
              pinColor="transparent"
            >
              <View style={styles.customMarkerContainer}>
                <Image 
                  source={require('../assets/restaurantmarker.png')} 
                  style={styles.markerImage}
                  resizeMode="contain"
                />
              </View>
            </Marker>
          )}
          
          {/* Customer Location - Custom Asset Marker */}
          {customerLocation && (
            <Marker
              coordinate={customerLocation}
              title="Customer"
              pinColor="transparent"
            >
              <View style={styles.customMarkerContainer}>
                <Image 
                  source={require('../assets/customermarker.png')} 
                  style={styles.markerImage}
                  resizeMode="contain"
                />
              </View>
            </Marker>
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

        {/* Map Controls - Brand Styled */}
        <View style={styles.mapControls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => {
              // Zoom in centered on rider location
              if (riderLocation) {
                setRegion({
                  latitude: riderLocation.latitude + (region.latitudeDelta * 0.5 * 0.3), // Keep rider at top
                  longitude: riderLocation.longitude,
                  latitudeDelta: region.latitudeDelta * 0.5,
                  longitudeDelta: region.longitudeDelta * 0.5,
                });
              }
            }}
          >
            <Text style={styles.controlButtonText}>+</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => {
              // Zoom out centered on rider location
              if (riderLocation) {
                setRegion({
                  latitude: riderLocation.latitude + (region.latitudeDelta * 2 * 0.3), // Keep rider at top
                  longitude: riderLocation.longitude,
                  latitudeDelta: region.latitudeDelta * 2,
                  longitudeDelta: region.longitudeDelta * 2,
                });
              }
            }}
          >
            <Text style={styles.controlButtonText}>−</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Draggable Content Container - Overlay Layer */}
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            transform: [{ translateY: translateY }],
            height: INITIAL_HEIGHT,
          }
        ]}
        {...panResponder.panHandlers}
      >
        {/* Drag Handle */}
        <View style={styles.dragHandle} />
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          bounces={false}
          nestedScrollEnabled={false}
        >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading order details...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Image 
              source={require('../assets/sotiloading.png')} 
              style={styles.errorIcon}
              resizeMode="contain"
            />
            <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchOrderDetails}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          renderOrderDetails()
        )}
        </ScrollView>
      </Animated.View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mapContainer: {
    height: height * 0.8, // 80% of screen height
    position: 'relative',
    zIndex: 0,
  },
  map: {
    flex: 1,
  },
  floatingContainer: {
    position: 'absolute',
    top: 35,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    paddingVertical: 4,
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
    fontSize: 14,
    fontFamily: 'Nexa-Heavy',
    color: '#999',
    textAlign: 'left',
    marginBottom: 0,
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
  bottomSheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: '#E0E0E0',
    width: 40,
    height: 4,
  },
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 20,
    flexGrow: 1,
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
    padding: 12,
    paddingVertical: 8,
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
    fontSize: 14,
    fontFamily: 'Nexa-Heavy',
    color: '#1A1A1A',
    marginBottom: 0,
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
  errorIcon: {
    width: 80,
    height: 80,
    marginBottom: 20,
    opacity: 0.6,
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

  // Custom Marker Styles - Asset Images
  customMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerImage: {
    width: 50,
    height: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // Map Controls - Brand Styled
  mapControls: {
    position: 'absolute',
    right: 20,
    bottom: 120,
    flexDirection: 'column',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F7F7F7',
  },
  controlButtonText: {
    fontSize: 24,
    fontFamily: 'Nexa-Heavy',
    color: '#F43332',
  },
});

export default OrderTracking;
