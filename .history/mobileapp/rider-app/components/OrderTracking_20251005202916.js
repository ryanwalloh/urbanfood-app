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
  Modal,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
// Using backend presigned URLs; no direct S3 client needed on device
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
  // Marker loaded flags to control tracksViewChanges for reliability
  const [riderMarkerLoaded, setRiderMarkerLoaded] = useState(false);
  const [restaurantMarkerLoaded, setRestaurantMarkerLoaded] = useState(false);
  const [customerMarkerLoaded, setCustomerMarkerLoaded] = useState(false);
  const [riderMarkerError, setRiderMarkerError] = useState(false);
  const [restaurantMarkerError, setRestaurantMarkerError] = useState(false);
  const [customerMarkerError, setCustomerMarkerError] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // Proof of delivery state

  // --- Map interaction controls -------------------------------------------
  const RIDER_TOP_OFFSET_FACTOR = 0.8; // keep rider near top by this fraction of latDelta
  const SUPPRESS_AUTOFIT_MS = 1800; // time window to avoid auto-fit after user interaction
  const suppressAutoFitUntilRef = useRef(0);

  const setRegionManually = (nextRegion) => {
    setRegion(nextRegion);
    suppressAutoFitUntilRef.current = Date.now() + SUPPRESS_AUTOFIT_MS;
  };
  const [proofOfDeliveryImage, setProofOfDeliveryImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showImagePreviewModal, setShowImagePreviewModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // AWS S3 Configuration
  const AWS_CONFIG = {
    accessKeyId: 'AKIA5RA7TEOC2ZAU5MG2',
    secretAccessKey: 'QF/s9jHf5EGYkbx7SnLodzFgQCHaeYmvYV0V1Gzd',
    region: 'ap-southeast-2',
    bucket: 'pharmago-user-uploads'
  };

  // Cloudinary Configuration (replace cloud name)
  const CLOUDINARY_CLOUD_NAME = 'dwqrkobq1';
  const CLOUDINARY_UPLOAD_PRESET = 'capstone_file_uploads';

  // Handle proof of delivery camera
  const handleProofOfDelivery = async () => {
    try {
      // Request camera permissions
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraPermission.status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take proof of delivery photos.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4], // Portrait ratio (3:4)
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const image = result.assets[0];
        console.log('📸 Setting proofOfDeliveryImage state to:', image);
        setProofOfDeliveryImage(image);
        setShowImagePreviewModal(true); // Show preview modal
        console.log('📸 Proof of delivery photo captured:', image.uri);
        console.log('📸 Full image object:', image);
        console.log('📸 Current order status:', orderDetails?.status);
      } else {
        console.log('📸 Camera was canceled or no image captured');
      }
    } catch (error) {
      console.log('❌ Camera error:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  // Handle retake photo
  const handleRetakePhoto = () => {
    setShowImagePreviewModal(false);
    setProofOfDeliveryImage(null);
    // Reopen camera
    setTimeout(() => {
      handleProofOfDelivery();
    }, 100);
  };

  // Handle "More Orders" button - redirect to main page
  const handleMoreOrders = () => {
    setShowSuccessModal(false);
    if (onBack) {
      onBack();
    }
  };

  // Handle upload photo via presigned URL (no credentials on device)
  const handleUploadPhoto = async () => {
    if (!proofOfDeliveryImage || !orderDetails?.order_id) {
      Alert.alert('Error', 'No image or order ID found');
      return;
    }

    try {
      setIsUploading(true);
      setShowImagePreviewModal(false);

      console.log('📤 Starting upload...');

      // 1) Upload to Cloudinary (unsigned preset)
      const timestamp = new Date().getTime();
      const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
      const form = new FormData();
      form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      form.append('folder', `file-uploads/${orderDetails.order_id}`);
      form.append('file', {
        uri: proofOfDeliveryImage.uri,
        type: proofOfDeliveryImage.mimeType || 'image/jpeg',
        name: `${timestamp}_${proofOfDeliveryImage.fileName}`,
      });

      const cloudRes = await fetch(uploadUrl, {
        method: 'POST',
        body: form,
      });
      const cloudJson = await cloudRes.json().catch(() => ({}));
      if (!cloudRes.ok || !cloudJson.secure_url) {
        throw new Error(cloudJson?.error?.message || `Cloudinary upload failed (status ${cloudRes.status})`);
      }

      const cloudUrl = cloudJson.secure_url;
      console.log('✅ Cloudinary upload URL:', cloudUrl);

      // Update order with S3 URL and status
      const updateResult = await apiService.updateOrderWithProofOfDelivery(
        orderDetails.order_id, 
        cloudUrl
      );

      if (updateResult.success) {
        console.log('✅ Order updated successfully');
        setShowSuccessModal(true);
      } else {
        throw new Error(updateResult.error || 'Failed to update order');
      }

    } catch (error) {
      console.log('❌ Upload error:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload proof of delivery');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle order status update button
  const handleOrderStatusUpdate = async () => {
    if (!orderDetails?.order_id) {
      Alert.alert('Error', 'Order ID not found');
      return;
    }

    if (isUpdatingStatus) {
      return; // Prevent multiple clicks
    }

    // If status is 'arrived' and no proof of delivery image, handle camera
    if (orderDetails.status === 'arrived' && !proofOfDeliveryImage) {
      await handleProofOfDelivery();
      return;
    }

    setIsUpdatingStatus(true);

    try {
      let newStatus;
      if (orderDetails.status === 'assigned' || orderDetails.status === 'ready') {
        newStatus = 'otw';
      } else if (orderDetails.status === 'otw') {
        newStatus = 'arrived';
      } else if (orderDetails.status === 'arrived') {
        newStatus = 'delivered';
      } else {
        Alert.alert('Error', 'Invalid order status');
        return;
      }

      console.log(`📦 Updating order status to ${newStatus.toUpperCase()} for order:`, orderDetails.order_id);
      
      const result = await apiService.updateOrderStatus(orderDetails.order_id, newStatus);
      
      if (result.success) {
        console.log('✅ Order status updated successfully:', result.message);
        
        // Refresh order details to get updated information
        await fetchOrderDetails();
      } else {
        Alert.alert('Error', result.error || 'Failed to update order status');
        console.log('❌ Failed to update order status:', result.error);
      }
    } catch (error) {
      console.log('❌ Error updating order status:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };
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
  const INITIAL_HEIGHT = height * 0.5; // 60% of screen height (initial state)
  const COLLAPSED_HEIGHT = height * 0.3; // 30% of screen height (collapsed state)
  const MAX_DOWNWARD_DRAG = INITIAL_HEIGHT - COLLAPSED_HEIGHT; // Maximum downward movement

  // Map Style
  const mapStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#1d2c4d" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#8ec3b9" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#1a3646" }] },
    { "featureType": "administrative.country", "elementType": "geometry.stroke", "stylers": [{ "color": "#4b6878" }] },
    { "featureType": "administrative.land_parcel", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
    { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#64779e" }] },
    { "featureType": "administrative.province", "elementType": "geometry.stroke", "stylers": [{ "color": "#4b6878" }] },
    { "featureType": "landscape.man_made", "elementType": "geometry.stroke", "stylers": [{ "color": "#334e87" }] },
    { "featureType": "landscape.natural", "elementType": "geometry", "stylers": [{ "color": "#023e58" }] },
    { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#283d6a" }] },
    { "featureType": "poi", "elementType": "labels.text", "stylers": [{ "visibility": "off" }] },
    { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#6f9ba5" }] },
    { "featureType": "poi", "elementType": "labels.text.stroke", "stylers": [{ "color": "#1d2c4d" }] },
    { "featureType": "poi.business", "stylers": [{ "visibility": "off" }] },
    { "featureType": "poi.park", "elementType": "geometry.fill", "stylers": [{ "color": "#023e58" }] },
    { "featureType": "poi.park", "elementType": "labels.text", "stylers": [{ "visibility": "off" }] },
    { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#3C7680" }] },
    { "featureType": "poi.school", "stylers": [{ "color": "#d7873c" }, { "visibility": "simplified" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#304a7d" }] },
    { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#98a5be" }] },
    { "featureType": "road", "elementType": "labels.text.stroke", "stylers": [{ "color": "#1d2c4d" }] },
    { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#2c6675" }] },
    { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#255763" }] },
    { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#b0d5ce" }] },
    { "featureType": "road.highway", "elementType": "labels.text.stroke", "stylers": [{ "color": "#023e58" }] },
    { "featureType": "road.local", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
    { "featureType": "transit", "elementType": "labels.text.fill", "stylers": [{ "color": "#98a5be" }] },
    { "featureType": "transit", "elementType": "labels.text.stroke", "stylers": [{ "color": "#1d2c4d" }] },
    { "featureType": "transit.line", "elementType": "geometry.fill", "stylers": [{ "color": "#283d6a" }] },
    { "featureType": "transit.station", "elementType": "geometry", "stylers": [{ "color": "#3a4762" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0e1626" }] },
    { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#4e6d70" }] }
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

  // Recalculate route based on order status
  useEffect(() => {
    if (!riderLocation || !orderDetails) return;

    if (orderDetails.status === 'otw' && orderDetails.customer_street) {
      // Prefer precise coords if we have them
      if (customerLocation) {
        calculateRouteToCoords(riderLocation, customerLocation);
        return;
      }
      // Use the exact address displayed in the floating container
      const customerAddress = getDisplayedDestinationAddress(orderDetails);
      calculateRouteFromAddress(riderLocation, customerAddress);
    } else if (orderDetails.restaurant_street) {
      // Prefer precise coords if we have them
      if (restaurantLocation) {
        calculateRouteToCoords(riderLocation, restaurantLocation);
        return;
      }
      // Use the exact same address format as the floating destination container
      const restaurantAddress = getDisplayedDestinationAddress(orderDetails);
      console.log('🗺️ Calculating route to restaurant address:', restaurantAddress);
      calculateRouteFromAddress(riderLocation, restaurantAddress);
    }
  }, [riderLocation, orderDetails, restaurantLocation, customerLocation]);

  // Adjust map region to fit route when route coordinates are available
  useEffect(() => {
    if (routeCoordinates.length > 0 && riderLocation) {
      // Avoid overriding user's recent manual zoom/pan
      if (Date.now() < suppressAutoFitUntilRef.current) {
        console.log('⏸️ Suppressing auto-fit due to recent manual interaction');
        return;
      }
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
      
        // Calculate route based on order status
        if (orderDetails) {
          if (orderDetails.status === 'otw' && orderDetails.customer_street) {
            if (customerLocation) {
              calculateRouteToCoords(riderCoords, customerLocation);
            } else {
              const customerAddress = getDisplayedDestinationAddress(orderDetails);
              calculateRouteFromAddress(riderCoords, customerAddress);
            }
          } else if (orderDetails.restaurant_street) {
            if (restaurantLocation) {
              calculateRouteToCoords(riderCoords, restaurantLocation);
            } else {
              const restaurantAddress = getDisplayedDestinationAddress(orderDetails);
              console.log('🗺️ Calculating route to restaurant address (location update):', restaurantAddress);
              calculateRouteFromAddress(riderCoords, restaurantAddress);
            }
          }
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
        const restaurantQuery = buildRestaurantAddress(orderData);
        console.log('🧭 Geocoding restaurant with query:', restaurantQuery);
        const restaurantResponse = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(restaurantQuery)}&key=AIzaSyCCuDLJMhB-23kQiXYpXwi-yYGvKz7OgSQ`
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
        const customerQuery = buildCustomerAddress(orderData);
        console.log('🧭 Geocoding customer with query:', customerQuery);
        const customerResponse = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(customerQuery)}&key=AIzaSyCCuDLJMhB-23kQiXYpXwi-yYGvKz7OgSQ`
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
      // Clear any existing route to avoid showing stale polylines while recalculating
      setRouteCoordinates([]);
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
        console.log('🗺️ Falling back to geocoding for address:', destinationAddress);
        // Fallback: Try to geocode the destination address directly
        try {
          const geocodeResponse = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destinationAddress)}&key=AIzaSyCCuDLJMhB-23kQiXYpXwi-yYGvKz7OgSQ`
          );
          const geocodeData = await geocodeResponse.json();
          
          if (geocodeData.status === 'OK' && geocodeData.results.length > 0) {
            const destination = geocodeData.results[0].geometry.location;
            const coordinates = [
              { latitude: start.latitude, longitude: start.longitude },
              { latitude: destination.lat, longitude: destination.lng }
            ];
            setRouteCoordinates(coordinates);
            console.log('✅ Fallback geocoding successful');
          } else {
            // Final fallback to straight line
            const coordinates = [
              { latitude: start.latitude, longitude: start.longitude },
              { latitude: start.latitude, longitude: start.longitude }
            ];
            setRouteCoordinates(coordinates);
            console.log('❌ Fallback geocoding failed, using straight line');
          }
        } catch (geocodeError) {
          console.log('❌ Fallback geocoding error:', geocodeError);
          // Final fallback to straight line
          const coordinates = [
            { latitude: start.latitude, longitude: start.longitude },
            { latitude: start.latitude, longitude: start.longitude }
          ];
          setRouteCoordinates(coordinates);
        }
      }
    } catch (error) {
      console.log('Route calculation error:', error);
      console.log('🗺️ Catch block fallback for address:', destinationAddress);
      // Fallback: Try to geocode the destination address directly
      try {
        const geocodeResponse = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destinationAddress)}&key=AIzaSyCCuDLJMhB-23kQiXYpXwi-yYGvKz7OgSQ`
        );
        const geocodeData = await geocodeResponse.json();
        
        if (geocodeData.status === 'OK' && geocodeData.results.length > 0) {
          const destination = geocodeData.results[0].geometry.location;
          const coordinates = [
            { latitude: start.latitude, longitude: start.longitude },
            { latitude: destination.lat, longitude: destination.lng }
          ];
          setRouteCoordinates(coordinates);
          console.log('✅ Catch block fallback geocoding successful');
        } else {
          // Final fallback to straight line
          const coordinates = [
            { latitude: start.latitude, longitude: start.longitude },
            { latitude: start.latitude, longitude: start.longitude }
          ];
          setRouteCoordinates(coordinates);
          console.log('❌ Catch block fallback geocoding failed, using straight line');
        }
      } catch (geocodeError) {
        console.log('❌ Catch block fallback geocoding error:', geocodeError);
        // Final fallback to straight line
        const coordinates = [
          { latitude: start.latitude, longitude: start.longitude },
          { latitude: start.latitude, longitude: start.longitude }
        ];
        setRouteCoordinates(coordinates);
      }
    }
  };

  // Prefer precise lat/lng routing when we already have geocoded coordinates
  const calculateRouteToCoords = async (start, destination) => {
    try {
      // Clear any existing route to avoid showing stale polylines while recalculating
      setRouteCoordinates([]);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${start.latitude},${start.longitude}&destination=${destination.latitude},${destination.longitude}&key=AIzaSyCCuDLJMhB-23kQiXYpXwi-yYGvKz7OgSQ`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = [];

        route.legs.forEach(leg => {
          leg.steps.forEach(step => {
            const points = decodePolyline(step.polyline.points);
            coordinates.push(...points);
          });
        });

        setRouteCoordinates(coordinates);
        console.log('✅ Route (coords) calculated successfully with', coordinates.length, 'points');
      } else {
        console.log('Directions API error (coords):', data.status);
        // Fallback to a straight line if directions fail
        const coordinates = [
          { latitude: start.latitude, longitude: start.longitude },
          { latitude: destination.latitude, longitude: destination.longitude }
        ];
        setRouteCoordinates(coordinates);
      }
    } catch (error) {
      console.log('Route calculation error (coords):', error);
      // Final fallback to straight line
      const coordinates = [
        { latitude: start.latitude, longitude: start.longitude },
        { latitude: destination.latitude, longitude: destination.longitude }
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
        
        // Calculate route based on order status
        if (riderLocation) {
          if (response.status === 'otw' && response.customer_street) {
            // Route to customer when order is picked up (OTW)
            const customerAddress = response.customer_street ? 
              `${response.customer_street}, ${response.customer_barangay}` : 
              response.customer_barangay;
            calculateRouteFromAddress(riderLocation, customerAddress);
          } else if (response.restaurant_street) {
            // Route to restaurant when order is not picked up yet
            // Use the exact same address format as the floating destination container
            const restaurantAddress = response.restaurant_street ? 
              `${response.restaurant_street}, ${response.restaurant_barangay}` : 
              response.restaurant_barangay;
            console.log('🗺️ Calculating route to restaurant address (fetch order):', restaurantAddress);
            calculateRouteFromAddress(riderLocation, restaurantAddress);
          }
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

  // --- Address helpers ------------------------------------------------------
  // Build a normalized address string for Google APIs from order details.
  // For restaurant: prefers plus-code format "PLUSCODE, City, Province, Philippines".
  const buildRestaurantAddress = (orderData) => {
    if (!orderData) return '';
    const street = orderData.restaurant_street || '';
    const barangay = orderData.restaurant_barangay || '';

    // Detect plus code token at start of street (e.g., "66HX+MX Iligan City, Lanao del Norte")
    // Extract the leading token containing "+" and the remaining locality string
    const plusCodeMatch = street.match(/^([^\s]+\+[^\s]+)\s+(.*)$/);
    if (plusCodeMatch) {
      const plusCode = plusCodeMatch[1];
      const locality = plusCodeMatch[2]; // e.g., "Iligan City, Lanao del Norte"
      // Prefer not to append barangay after plus-code; keep locality and country explicit
      return `${plusCode}, ${locality}, Philippines`;
    }

    // Fallback: Combine street + barangay + Philippines
    // Ensure we don’t duplicate commas
    const parts = [];
    if (street) parts.push(street);
    if (barangay) parts.push(barangay);
    parts.push('Philippines');
    return parts.join(', ');
  };

  const buildCustomerAddress = (orderData) => {
    if (!orderData) return '';
    const barangay = orderData.customer_barangay || '';
    // Append country to reduce ambiguity
    return barangay ? `${barangay}, Philippines` : 'Philippines';
  };

  // Exact string used in the floating destination container (UI is source of truth)
  const getDisplayedDestinationAddress = (orderData) => {
    if (!orderData) return '';
    if (orderData.status === 'otw') {
      return orderData.customer_street 
        ? `${orderData.customer_street}, ${orderData.customer_barangay}`
        : (orderData.customer_barangay || '');
    }
    return orderData.restaurant_street 
      ? `${orderData.restaurant_street}, ${orderData.restaurant_barangay}`
      : (orderData.restaurant_barangay || '');
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

        {/* Restaurant/Customer Calling Card */}
        <View style={styles.callingCard}>
          <View style={styles.profileIconContainer}>
            {orderDetails?.status === 'otw' || orderDetails?.status === 'arrived' ? (
              <Image 
                source={require('../assets/cat.png')} 
                style={styles.profileIcon}
                resizeMode="contain"
              />
            ) : (
              <>
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
              </>
            )}
          </View>
          <View style={styles.callingCardInfo}>
            <Text style={styles.callingCardTitle}>
              {orderDetails?.status === 'otw' || orderDetails?.status === 'arrived' ? 
                `${orderDetails.customer_first_name} ${orderDetails.customer_last_name}` :
                `${orderDetails.restaurant_name} - ${orderDetails.restaurant_barangay}`
              }
            </Text>
            <Text style={styles.callingCardSubtitle}>
              {orderDetails?.status === 'otw' || orderDetails?.status === 'arrived' ? 
                orderDetails.customer_phone : 
                'Restaurant'
              }
            </Text>
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
        <TouchableOpacity 
          style={[
            styles.pickedUpButton, 
            isUpdatingStatus && styles.pickedUpButtonDisabled,
            orderDetails?.status === 'arrived' && styles.arrivedButton
          ]}
          onPress={handleOrderStatusUpdate}
          disabled={isUpdatingStatus}
        >
          <Image 
            source={
              orderDetails?.status === 'otw' ? require('../assets/arrived.png') :
              orderDetails?.status === 'arrived' ? require('../assets/camera.png') :
              require('../assets/bag.png')
            } 
            style={styles.bagIcon}
            resizeMode="contain"
          />
          <Text style={styles.pickedUpButtonText}>
            {isUpdatingStatus ? 'Updating...' : 
              orderDetails?.status === 'otw' ? 'Arrived' : 
              orderDetails?.status === 'arrived' ? 
                (proofOfDeliveryImage ? 'Upload' : 'Proof of Delivery') : 
              'Order Picked Up'}
          </Text>
        </TouchableOpacity>


        {/* Bottom padding for navigation */}
        <View style={styles.bottomPadding} />
      </View>
    );
  };

  // Image Preview Modal
  const renderImagePreviewModal = () => (
    <Modal
      visible={showImagePreviewModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowImagePreviewModal(false)}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Proof of Delivery</Text>
          
          {/* Image Preview */}
          {proofOfDeliveryImage && (
            <View style={styles.imagePreviewContainer}>
              <Image 
                source={{ uri: proofOfDeliveryImage.uri }} 
                style={styles.imagePreview}
                resizeMode="contain"
              />
            </View>
          )}
          
          {/* File Info */}
          {proofOfDeliveryImage && (
            <View style={styles.fileInfoContainer}>
              <Text style={styles.fileInfoLabel}>File:</Text>
              <Text style={styles.fileInfoText} numberOfLines={2}>
                {proofOfDeliveryImage.fileName || proofOfDeliveryImage.uri}
              </Text>
              {proofOfDeliveryImage.fileSize && (
                <Text style={styles.fileSizeText}>
                  Size: {Math.round(proofOfDeliveryImage.fileSize / 1024)}KB
                </Text>
              )}
            </View>
          )}
          
          {/* Action Buttons */}
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={styles.retakeButton}
              onPress={handleRetakePhoto}
            >
              <Text style={styles.retakeButtonText}>Retake</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
              onPress={handleUploadPhoto}
              disabled={isUploading}
            >
              <Text style={styles.uploadButtonText}>
                {isUploading ? 'Uploading...' : 'Upload'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Success Modal
  const renderSuccessModal = () => (
    <Modal
      visible={showSuccessModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowSuccessModal(false)}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.successModalContent}>
          <View style={styles.successIconContainer}>
            <Text style={styles.successIcon}>✅</Text>
          </View>
          
          <Text style={styles.successTitle}>Order Delivered!</Text>
          <Text style={styles.successMessage}>
            Proof of delivery uploaded successfully. Order status updated to delivered.
          </Text>
          
          <TouchableOpacity 
            style={styles.moreOrdersButton}
            onPress={handleMoreOrders}
          >
            <Text style={styles.moreOrdersButtonText}>More Orders</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Map Container - Full Screen Background */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          showsUserLocation={false}
          showsMyLocationButton={false}
          customMapStyle={mapStyle}
          mapType="standard"
          showsBuildings={false}
          showsIndoors={false}
          showsTraffic={false}
          showsPointsOfInterest={true}
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
              anchor={{ x: 0.5, y: 1 }}
              pinColor={riderMarkerError ? '#F43332' : undefined}
              tracksViewChanges={Platform.OS === 'ios' ? !riderMarkerLoaded : false}
              {...(Platform.OS === 'android' && !riderMarkerError ? { icon: require('../assets/ridermarker.png') } : {})}
            >
              {Platform.OS === 'ios' && !riderMarkerError && (
                <Image
                  source={require('../assets/ridermarker.png')}
                  style={styles.markerImage}
                  resizeMode="contain"
                  onLoad={() => setTimeout(() => setRiderMarkerLoaded(true), 0)}
                  onLoadEnd={() => setTimeout(() => setRiderMarkerLoaded(true), 0)}
                  onError={() => setRiderMarkerError(true)}
                />
              )}
            </Marker>
          )}
          
          {/* Restaurant Location - Custom Asset Marker (shown when order not picked up) */}
          {restaurantLocation && orderDetails?.status !== 'otw' && (
            <Marker
              coordinate={restaurantLocation}
              title="Restaurant"
              anchor={{ x: 0.5, y: 1 }}
              pinColor={restaurantMarkerError ? '#F43332' : undefined}
              tracksViewChanges={Platform.OS === 'ios' ? !restaurantMarkerLoaded : false}
              {...(Platform.OS === 'android' && !restaurantMarkerError ? { icon: require('../assets/restaurantmarker.png') } : {})}
            >
              {Platform.OS === 'ios' && !restaurantMarkerError && (
                <Image
                  source={require('../assets/restaurantmarker.png')}
                  style={styles.markerImage}
                  resizeMode="contain"
                  onLoad={() => setTimeout(() => setRestaurantMarkerLoaded(true), 0)}
                  onLoadEnd={() => setTimeout(() => setRestaurantMarkerLoaded(true), 0)}
                  onError={() => setRestaurantMarkerError(true)}
                />
              )}
            </Marker>
          )}

          {/* Customer Location - Custom Asset Marker (shown when order is picked up) */}
          {customerLocation && orderDetails?.status === 'otw' && (
            <Marker
              coordinate={customerLocation}
              title="Customer"
              anchor={{ x: 0.5, y: 1 }}
              pinColor={customerMarkerError ? '#F43332' : undefined}
              tracksViewChanges={Platform.OS === 'ios' ? !customerMarkerLoaded : false}
              {...(Platform.OS === 'android' && !customerMarkerError ? { icon: require('../assets/customermarker.png') } : {})}
            >
              {Platform.OS === 'ios' && !customerMarkerError && (
                <Image
                  source={require('../assets/customermarker.png')}
                  style={styles.markerImage}
                  resizeMode="contain"
                  onLoad={() => setTimeout(() => setCustomerMarkerLoaded(true), 0)}
                  onLoadEnd={() => setTimeout(() => setCustomerMarkerLoaded(true), 0)}
                  onError={() => setCustomerMarkerError(true)}
                />
              )}
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
              {orderDetails?.status === 'otw' ? 
                (orderDetails?.customer_street ? 
                  `${orderDetails.customer_street}, ${orderDetails.customer_barangay}` : 
                  orderDetails?.customer_barangay) :
                (orderDetails?.restaurant_street ? 
                  `${orderDetails.restaurant_street}, ${orderDetails.restaurant_barangay}` : 
                  orderDetails?.restaurant_barangay)
              }
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
                  latitude: riderLocation.latitude + (region.latitudeDelta * 0.5 * -0.8), // Keep rider at top
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
                  latitude: riderLocation.latitude + (region.latitudeDelta * 2 * -0.8), // Keep rider at top
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

      {/* Image Preview Modal */}
      {renderImagePreviewModal()}

      {/* Success Modal */}
      {renderSuccessModal()}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mapContainer: {
    height: height * 0.9, // 80% of screen height
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
    opacity: 0.8,
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
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
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
    paddingHorizontal: 10,
    bottom: 10,
    
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
    backgroundColor: '#FFFFFF',
    padding: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 0,
    bottom: 20,
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
 
    padding: 20,
    width: '100%',
    borderRadius: 12,
    marginBottom: 0,
    bottom: 20,
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
    top: 10,
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
    marginBottom: 0,
  
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
    padding: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    bottom: 20,
  },
  
  deliveryTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  deliveryTypeLabel: {
    fontSize: 12,
    fontFamily: 'Nexa-ExtraLight',
    color: '#999999',
  },
  amountLabel: {
    fontSize: 12,
    fontFamily: 'Nexa-ExtraLight',
    color: '#999999',
  
  },
  deliveryTypeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryTypeTitle: {
    fontSize: 14,
    fontFamily: 'Nexa-Heavy',
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 16,
    fontFamily: 'Nexa-Heavy',
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  pickedUpButton: {
    backgroundColor: '#F43332',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 20,
    bottom: 20,
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
  pickedUpButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.7,
  },
  arrivedButton: {
    backgroundColor: '#295D6C',
  },
  proofOfDeliveryInfo: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  proofOfDeliveryLabel: {
    fontSize: 12,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666666',
    marginBottom: 4,
  },
  proofOfDeliveryUrl: {
    fontSize: 11,
    fontFamily: 'Nexa-ExtraLight',
    color: '#999999',
    fontStyle: 'italic',
  },
  proofOfDeliverySize: {
    fontSize: 10,
    fontFamily: 'Nexa-ExtraLight',
    color: '#CCCCCC',
    marginTop: 2,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Nexa-Heavy',
    color: '#1A1A1A',
    marginBottom: 20,
    textAlign: 'center',
  },
  imagePreviewContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  fileInfoContainer: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  fileInfoLabel: {
    fontSize: 14,
    fontFamily: 'Nexa-Heavy',
    color: '#666666',
    marginBottom: 5,
  },
  fileInfoText: {
    fontSize: 12,
    fontFamily: 'Nexa-ExtraLight',
    color: '#999999',
    marginBottom: 5,
  },
  fileSizeText: {
    fontSize: 11,
    fontFamily: 'Nexa-ExtraLight',
    color: '#CCCCCC',
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 15,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  retakeButtonText: {
    fontSize: 16,
    fontFamily: 'Nexa-Heavy',
    color: '#666666',
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#F43332',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  uploadButtonText: {
    fontSize: 16,
    fontFamily: 'Nexa-Heavy',
    color: '#FFFFFF',
  },
  successModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    width: '90%',
    maxWidth: 350,
    alignItems: 'center',
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcon: {
    fontSize: 40,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: 'Nexa-Heavy',
    color: '#1A1A1A',
    marginBottom: 15,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  moreOrdersButton: {
    backgroundColor: '#F43332',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  moreOrdersButtonText: {
    fontSize: 18,
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
  markerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
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
    bottom: 420,
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
