import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Animated, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { apiService } from '../services/api';
import API_CONFIG from '../config/apiConfig.js';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;

// Custom map styling for cleaner appearance
const customMapStyle = [
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
    "elementType": "labels.text",
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
    "elementType": "labels",
    "stylers": [
      {
        "visibility": "off"
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
    "featureType": "transit",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  }
];

// Route Line Component that follows actual route
const RouteLine = ({ riderLocation, customerLocation }) => {
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  useEffect(() => {
    if (!riderLocation || !customerLocation) {
      setRouteCoordinates([]);
      return;
    }

    // Fetch route from Google Directions API
    const fetchRoute = async () => {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${riderLocation.latitude},${riderLocation.longitude}&destination=${customerLocation.latitude},${customerLocation.longitude}&key=${API_CONFIG.GOOGLE_MAPS_API_KEY}`
        );
        
        const data = await response.json();
        
        if (data.status === 'OK' && data.routes.length > 0) {
          const route = data.routes[0];
          const coordinates = route.overview_polyline.points;
          
          // Decode polyline coordinates
          const decodedCoordinates = decodePolyline(coordinates);
          setRouteCoordinates(decodedCoordinates);
          
          console.log('🗺️ Route fetched with', decodedCoordinates.length, 'points');
        }
      } catch (error) {
        console.log('❌ Error fetching route:', error);
        // Fallback to straight line if route fails
        setRouteCoordinates([riderLocation, customerLocation]);
      }
    };

    fetchRoute();
  }, [riderLocation, customerLocation]);

  if (routeCoordinates.length === 0) return null;

  return (
    <Polyline
      coordinates={routeCoordinates}
      strokeColor="#F43332"
      strokeWidth={4}
    />
  );
};

// Decode polyline coordinates helper function
const decodePolyline = (encoded) => {
  const poly = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    poly.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return poly;
};

const OrderTracking = ({ order: initialOrder, restaurant, cartItems, user, onBack, onHome, address }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [order, setOrder] = useState(initialOrder);
  const [currentStatus, setCurrentStatus] = useState(initialOrder?.status || 'pending');
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  
  // Map and location tracking state
  const [riderLocation, setRiderLocation] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [isTrackingRider, setIsTrackingRider] = useState(false);
  const trackingIntervalRef = useRef(null);
  
  // Animation for live dot pulsing effect
  const liveDotOpacity = useRef(new Animated.Value(1)).current;

  // Start live dot pulsing animation
  const startLiveDotAnimation = () => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(liveDotOpacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(liveDotOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => {
        pulse(); // Always continue pulsing
      });
    };
    pulse();
  };

  // Stop live dot animation
  const stopLiveDotAnimation = () => {
    liveDotOpacity.stopAnimation();
    liveDotOpacity.setValue(1);
  };
  

  // Poll for order status updates every 5 seconds
  useEffect(() => {
    if (!order?.id) return;

    const pollInterval = setInterval(async () => {
      const result = await apiService.getOrderStatus(order.id);
      if (result.success) {
        const newStatus = result.order.status;
      console.log('📊 Status check:', currentStatus, '→', newStatus);
      console.log('📋 Order data:', result.order);
      console.log('👤 Assigned rider ID:', result.order?.assigned_rider_id);
      
      // Update status if changed
      if (newStatus !== currentStatus) {
        console.log('📊 Status changed:', currentStatus, '→', newStatus);
        setCurrentStatus(newStatus);
        setOrder(result.order);
        
        // Start rider tracking if status is 'otw'
        if (newStatus === 'otw') {
          startRiderTracking(result.order);
        } else if (currentStatus === 'otw' && newStatus !== 'otw') {
          // Stop tracking if no longer 'otw'
          stopRiderTracking();
        }
      }
        
        // Continue tracking rider location if still 'otw'
        if (newStatus === 'otw' && isTrackingRider) {
          fetchRiderLocation(result.order);
        }
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [order?.id, currentStatus, isTrackingRider]);

  // Start rider location tracking
  const startRiderTracking = async (orderData) => {
    console.log('🚀 Starting rider tracking for order:', orderData.id);
    setIsTrackingRider(true);
    
    // Set customer location from address
    console.log('🏠 Address data:', address);
    if (address?.latitude && address?.longitude) {
      const customerLoc = {
        latitude: parseFloat(address.latitude),
        longitude: parseFloat(address.longitude)
      };
      console.log('📍 Setting customer location:', customerLoc);
      setCustomerLocation(customerLoc);
    } else {
      console.log('⚠️ No customer location available from address');
    }
    
    // Fetch initial rider location
    await fetchRiderLocation(orderData);
    
    // Start periodic tracking every 10 seconds
    trackingIntervalRef.current = setInterval(() => {
      fetchRiderLocation(orderData);
    }, 10000);
  };

  // Stop rider location tracking
  const stopRiderTracking = () => {
    console.log('🛑 Stopping rider tracking');
    setIsTrackingRider(false);
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
  };

  // Fetch rider location from backend
  const fetchRiderLocation = async (orderData) => {
    try {
      console.log('🔍 Checking order data for rider assignment:', {
        orderId: orderData?.id,
        assigned_rider_id: orderData?.assigned_rider_id,
        assigned_rider_name: orderData?.assigned_rider_name,
        fullOrderData: orderData
      });
      
      if (!orderData?.assigned_rider_id) {
        console.log('⚠️ No assigned rider found for order');
        return;
      }

      console.log('📍 Fetching rider location for rider:', orderData.assigned_rider_id);
      const response = await apiService.getRiderLocation(orderData.assigned_rider_id);
      
      console.log('📍 Rider location API response:', response);
      
      if (response.success && response.location) {
        const newRiderLocation = {
          latitude: parseFloat(response.location.latitude),
          longitude: parseFloat(response.location.longitude)
        };
        
        console.log('📍 Rider location updated:', newRiderLocation);
        setRiderLocation(newRiderLocation);
        
        // Update map region to fit both locations
        updateMapRegion(newRiderLocation, customerLocation);
      }
    } catch (error) {
      console.log('❌ Error fetching rider location:', error);
    }
  };




  // Update map region to fit both locations
  const updateMapRegion = (riderLoc, customerLoc) => {
    if (!riderLoc || !customerLoc) return;

    const minLat = Math.min(riderLoc.latitude, customerLoc.latitude);
    const maxLat = Math.max(riderLoc.latitude, customerLoc.latitude);
    const minLng = Math.min(riderLoc.longitude, customerLoc.longitude);
    const maxLng = Math.max(riderLoc.longitude, customerLoc.longitude);

    // Calculate distance between points
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;

    // Add padding (30% of the distance or minimum padding)
    const latPadding = Math.max(latDiff * 0.3, 0.005);
    const lngPadding = Math.max(lngDiff * 0.3, 0.005);

    const newRegion = {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: latDiff + (latPadding * 2),
      longitudeDelta: lngDiff + (lngPadding * 2),
    };

    console.log('🗺️ Updating map region:', newRegion);
    setMapRegion(newRegion);
  };

  // Update map region when both locations are available
  useEffect(() => {
    if (riderLocation && customerLocation) {
      updateMapRegion(riderLocation, customerLocation);
    }
  }, [riderLocation, customerLocation]);

  // Manage live dot animation based on status
  useEffect(() => {
    if (currentStatus === 'otw') {
      startLiveDotAnimation();
    } else {
      stopLiveDotAnimation();
    }
  }, [currentStatus]);

  // Cleanup tracking on unmount
  useEffect(() => {
    return () => {
      stopRiderTracking();
    };
  }, []);

  // Animate the progress bar based on status
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(progressAnimation, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  // Calculate subtotal from cart items
  const subtotal = cartItems.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);
  const deliveryFee = 29.00; // rider_fee
  const platformFee = 19.00; // small_order_fee
  const orderLineCount = cartItems.length;

  const CloseIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6L18 18"
        stroke="#333333"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const ChevronIcon = ({ isUp }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path
        d={isUp ? "M18 15L12 9L6 15" : "M6 9L12 15L18 9"}
        stroke="#F43332"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  // Handle view details toggle with scroll
  const handleViewDetailsToggle = () => {
    setShowDetails(!showDetails);
    
    // If expanding, scroll to bottom after a short delay
    if (!showDetails) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // Get status-based content
  const getStatusContent = () => {
    switch (currentStatus) {
      case 'preparing':
        return {
          image: require('../assets/preparing.png'),
          subtitle1: 'Estimated delivery time',
          title1: '15-25 mins',
          subtitle2: 'Preparing your food. Your rider will pick it up once it\'s ready.',
          activeBar: 1, // Second bar
        };
      case 'ready':
        return {
          image: require('../assets/ready.png'),
          subtitle1: 'Cooked With Love',
          title1: 'Order Ready',
          subtitle2: 'Waiting for your rider to pick up the order',
          activeBar: 2, // Third bar
        };
      case 'otw':
        return {
          image: null, // No image for OTW - will show map instead
          subtitle1: 'Estimated delivery time',
          title1: '6-10 mins',
          subtitle2: 'Your rider has picked up your food.',
          activeBar: 3, // Fourth bar
        };
      case 'arrived':
        return {
          image: require('../assets/arrived.png'),
          subtitle1: 'You can now receive your order outside',
          title1: 'Your Rider Arrived',
          subtitle2: (
            <>
              It's the <Text style={{ color: '#F43332', fontWeight: 'bold' }}>food</Text> you love, delivered to you.
            </>
          ),
          activeBar: 4, // All bars completed
        };
      case 'delivered':
        return {
          image: require('../assets/delivered.png'),
          subtitle1: null, // No subtitle1
          title1: 'Delivered',
          subtitle2: null, // No subtitle2
          deliverySuccessText: 'Enjoy your meal!',
          activeBar: 5, // Beyond all bars (no progress bars shown)
        };
      default: // pending
        return {
          image: require('../assets/pending.png'),
          subtitle1: 'Chef is reviewing the ingredients needed',
          title1: 'Shopping for Ingredients',
          subtitle2: (
            <>
              <Text style={styles.funFactBold}>Fun Fact:</Text> Did you know that{' '}
              <Text style={styles.highlightedText}>Soti Delivery</Text> is the First major tech breakthrough in Marawi, 
              empowering local restaurants, riders, and the community toward a new era of innovation?
            </>
          ),
          activeBar: 0, // First bar
        };
    }
  };

  const statusContent = getStatusContent();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBack} style={styles.closeButton}>
            <CloseIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your order</Text>
        </View>
        <TouchableOpacity onPress={onHome || onBack} style={styles.homeButton}>
          <Text style={styles.homeButtonText}>Home</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        {/* Main Content Container */}
        <View style={styles.mainContentContainer}>
          {/* Image Graphic Container or Map Container */}
          {currentStatus === 'otw' ? (
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              region={mapRegion || (customerLocation ? {
                latitude: customerLocation.latitude,
                longitude: customerLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              } : undefined)}
              showsUserLocation={false}
              showsMyLocationButton={false}
              mapType="standard"
              loadingEnabled={true}
              customMapStyle={customMapStyle}
            >
              {/* Rider Location Marker */}
              {riderLocation && (
                <Marker
                  coordinate={riderLocation}
                  title="Your Rider"
                  anchor={{ x: 0.5, y: 1 }}
                  {...(Platform.OS === 'android' ? { icon: require('../assets/ridermarker.png') } : {})}
                >
                  {Platform.OS === 'ios' && (
                    <Image
                      source={require('../assets/ridermarker.png')}
                      style={styles.markerImage}
                      resizeMode="contain"
                    />
                  )}
                </Marker>
              )}

              {/* Customer Location Marker */}
              {customerLocation && (
                <Marker
                  coordinate={customerLocation}
                  title="Your Location"
                  anchor={{ x: 0.5, y: 1 }}
                  {...(Platform.OS === 'android' ? { icon: require('../assets/customermarker.png') } : {})}
                >
                  {Platform.OS === 'ios' && (
                    <Image
                      source={require('../assets/customermarker.png')}
                      style={styles.markerImage}
                      resizeMode="contain"
                    />
                  )}
                </Marker>
              )}

              {/* Route Line following roads */}
              {riderLocation && customerLocation && (
                <RouteLine
                  riderLocation={riderLocation}
                  customerLocation={customerLocation}
                />
              )}
            </MapView>
            
            {/* Live Tracking Indicator */}
            {currentStatus === 'otw' && (
              <View style={styles.liveIndicator}>
                <Animated.View style={[styles.liveDot, { opacity: liveDotOpacity }]} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.imageContainer}>
            <Image 
              source={statusContent.image} 
              style={styles.statusImage}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Subtitle 1 */}
        {statusContent.subtitle1 && (
          <Text style={styles.subtitle1}>{statusContent.subtitle1}</Text>
        )}

        {/* Title 1 */}
        <Text style={styles.title1}>{statusContent.title1}</Text>

        {/* Progress Bar */}
        {statusContent.activeBar <= 4 && (
          <View style={styles.progressContainer}>
          {/* Bar 1 */}
          <View style={styles.progressBarWrapper}>
            <View style={[
              styles.progressBar, 
              statusContent.activeBar > 0 && styles.progressBarFilled
            ]} />
            {currentStatus === 'pending' && (
              <Animated.View
                style={[
                  styles.progressBarActive,
                  {
                    transform: [
                      {
                        translateX: progressAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-100, 100],
                        }),
                      },
                    ],
                  },
                ]}
              />
            )}
          </View>
          
          {/* Bar 2 */}
          <View style={styles.progressBarWrapper}>
            <View style={[
              styles.progressBar, 
              statusContent.activeBar > 1 && styles.progressBarFilled
            ]} />
            {currentStatus === 'preparing' && (
              <Animated.View
                style={[
                  styles.progressBarActive,
                  {
                    transform: [
                      {
                        translateX: progressAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-100, 100],
                        }),
                      },
                    ],
                  },
                ]}
              />
            )}
          </View>
          
          {/* Bar 3 */}
          <View style={styles.progressBarWrapper}>
            <View style={[
              styles.progressBar, 
              statusContent.activeBar > 2 && styles.progressBarFilled
            ]} />
            {currentStatus === 'ready' && (
              <Animated.View
                style={[
                  styles.progressBarActive,
                  {
                    transform: [
                      {
                        translateX: progressAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-100, 100],
                        }),
                      },
                    ],
                  },
                ]}
              />
            )}
          </View>
          
          {/* Bar 4 */}
          <View style={styles.progressBarWrapper}>
            <View style={[
              styles.progressBar,
              statusContent.activeBar > 3 && styles.progressBarFilled
            ]} />
            {currentStatus === 'otw' && (
              <Animated.View
                style={[
                  styles.progressBarActive,
                  {
                    transform: [
                      {
                        translateX: progressAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-100, 100],
                        }),
                      },
                    ],
                  },
                ]}
              />
            )}
          </View>
        </View>
        )}

        {/* Subtitle 2 */}
        {statusContent.subtitle2 && (
          <Text style={[
            styles.subtitle2,
            currentStatus === 'pending' && styles.subtitle2Justified
          ]}>
            {statusContent.subtitle2}
          </Text>
        )}

        {/* Delivery Success Text */}
        {statusContent.deliverySuccessText && (
          <Text style={styles.deliverySuccessText}>
            {statusContent.deliverySuccessText}
          </Text>
        )}
        </View>

        {/* Order Details Container */}
        <View style={styles.orderDetailsContainer}>
          <Text style={styles.orderDetailsTitle}>Order Details</Text>

          {/* Order Number */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order number</Text>
            <Text style={styles.detailValue}>{order?.token_number || 'N/A'}</Text>
          </View>

          {/* Order From */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order from</Text>
            <Text style={styles.detailValue}>{restaurant?.name || 'N/A'}</Text>
          </View>

          {/* Delivery Address */}
          <View style={styles.detailRowNoBorder}>
            <Text style={styles.detailLabel}>Delivery address</Text>
            <Text style={styles.detailValue}>{address?.street || 'Not set'}</Text>
          </View>

          {/* Total */}
          <View style={styles.totalRowNoBorder}>
            <Text style={styles.totalLabel}>Total (incl. fees and tax)</Text>
            <View style={styles.totalValueContainer}>
              <Text style={styles.totalValue}>₱{order?.total_amount || '0.00'}</Text>
              {order?.payment_method === 'Card Payment' && order?.payment_status === 'succeeded' && (
                <Text style={styles.paidBadge}>Paid</Text>
              )}
            </View>
          </View>

          {/* Separator before View Details */}
          <View style={styles.separator} />

          {/* View Details Toggle */}
          <TouchableOpacity 
            style={styles.viewDetailsButton} 
            onPress={handleViewDetailsToggle}
          >
            <Text style={styles.viewDetailsText}>View details ({orderLineCount})</Text>
            <ChevronIcon isUp={showDetails} />
          </TouchableOpacity>

          {/* Expandable Details */}
          {showDetails && (
            <View style={styles.expandedDetails}>
              {/* Separator after View Details */}
              <View style={styles.separator} />

              {/* Subtotal */}
              <View style={styles.detailRowExpanded}>
                <Text style={styles.detailLabel}>Subtotal</Text>
                <Text style={styles.detailValue}>₱{subtotal.toFixed(2)}</Text>
              </View>

              {/* Delivery Fee */}
              <View style={styles.detailRowExpanded}>
                <Text style={styles.detailLabel}>Delivery fee</Text>
                <Text style={styles.detailValue}>₱{deliveryFee.toFixed(2)}</Text>
              </View>

              {/* Platform Fee */}
              <View style={styles.detailRowExpanded}>
                <Text style={styles.detailLabel}>Platform fee</Text>
                <Text style={styles.detailValue}>₱{platformFee.toFixed(2)}</Text>
              </View>

              {/* Separator */}
              <View style={styles.separator} />

              {/* Total (repeated in expanded view) */}
              <View style={styles.totalRowExpanded}>
                <Text style={styles.totalLabel}>Total (incl. fees and tax)</Text>
                <Text style={styles.totalValue}>₱{order?.total_amount || '0.00'}</Text>
              </View>

              {/* Separator */}
              <View style={styles.separator} />

              {/* Paid With */}
              <Text style={styles.paidWithLabel}>Paid with</Text>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentMethod}>
                  {order?.payment_method === 'Card Payment' ? 'Card Payment' : 
                   order?.payment_method === 'Cash on Delivery' ? 'Cash On Delivery' :
                   order?.payment_method || 'Cash On Delivery'}
                </Text>
                <Text style={styles.paymentAmount}>₱{order?.total_amount || '0.00'}</Text>
              </View>
              {order?.payment_method === 'Card Payment' && order?.payment_status && (
                <View style={styles.paymentStatusRow}>
                  <Text style={styles.paymentStatusLabel}> </Text>
                  <Text style={[
                    styles.paymentStatusValue,
                    order.payment_status === 'succeeded' && styles.paymentStatusSuccess
                  ]}>
                    {order.payment_status === 'succeeded' ? 'Paid' :
                     order.payment_status === 'pending' ? 'Pending' :
                     order.payment_status === 'failed' ? 'Failed' :
                     'Pending'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>© 2025 Soti Delivery. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  mainContentContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    marginTop: 0,
    paddingTop: 0,
    marginBottom: 10,
    paddingBottom: 0,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: isSmallScreen ? 15 : 20,
    paddingVertical: isSmallScreen ? 12 : 16,
    paddingTop: Platform.OS === 'android' ? (isSmallScreen ? 45 : 50) : 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isSmallScreen ? 6 : 8,
  },
  closeButton: {
    width: isSmallScreen ? 36 : 40,
    height: isSmallScreen ? 36 : 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: 'bold',
    color: '#333333',
    fontFamily: 'Nexa-Heavy',
  },
  homeButton: {
    paddingHorizontal: isSmallScreen ? 12 : 16,
    paddingVertical: isSmallScreen ? 6 : 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  
  },
  homeButtonText: {
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: 'bold',
    color: '#999',
    fontFamily: 'Nexa-Heavy',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  statusImage: {
    width: isSmallScreen ? 160 : 200,
    height: isSmallScreen ? 160 : 200,
  },
  mapContainer: {
    height: isSmallScreen ? 200 : 250,
    marginHorizontal: 0,
    borderRadius: 0,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 0,
  },
  map: {
    flex: 1,
  },
  markerImage: {
    width: isSmallScreen ? 25 : 30,
    height: isSmallScreen ? 25 : 30,
  },
  liveIndicator: {
    position: 'absolute',
    top: isSmallScreen ? 8 : 10,
    right: isSmallScreen ? 8 : 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F43332',
    paddingHorizontal: isSmallScreen ? 6 : 8,
    paddingVertical: isSmallScreen ? 3 : 4,
    borderRadius: 12,
  },
  liveDot: {
    width: isSmallScreen ? 5 : 6,
    height: isSmallScreen ? 5 : 6,
    borderRadius: isSmallScreen ? 2.5 : 3,
    backgroundColor: '#FFFFFF',
    marginRight: isSmallScreen ? 3 : 4,
  },
  liveText: {
    fontSize: isSmallScreen ? 9 : 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'Nexa-Heavy',
  },
  subtitle1: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: isSmallScreen ? 30 : 40,
    marginBottom: 4,
    marginTop: 10,
    fontFamily: 'Nexa-ExtraLight',
  },
  title1: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    paddingHorizontal: isSmallScreen ? 30 : 40,
    marginBottom: isSmallScreen ? 20 : 24,
    fontFamily: 'Nexa-Heavy',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: isSmallScreen ? 6 : 8,
    paddingHorizontal: isSmallScreen ? 30 : 40,
    marginBottom: isSmallScreen ? 12 : 14,
  },
  progressBarWrapper: {
    flex: 1,
    height: isSmallScreen ? 3 : 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    flex: 1,
    height: isSmallScreen ? 3 : 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  progressBarFilled: {
    backgroundColor: '#F43332',
  },
  progressBarActive: {
    position: 'absolute',
    width: isSmallScreen ? 50 : 60,
    height: isSmallScreen ? 3 : 4,
    backgroundColor: '#F43332',
    borderRadius: 2,
    opacity: 0.6,
    shadowColor: '#F43332',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  subtitle2: {
    fontSize: isSmallScreen ? 11 : 12,
    color: '#999999',
    textAlign: 'center',
    paddingHorizontal: isSmallScreen ? 25 : 30,
    lineHeight: isSmallScreen ? 14 : 15,
    marginBottom: isSmallScreen ? 20 : 30,
    fontStyle: 'italic',
    fontFamily: 'Nexa-ExtraLight',
  },
  deliverySuccessText: {
    fontSize: isSmallScreen ? 14 : 16,
    color: '#999999',
    textAlign: 'center',
    paddingHorizontal: isSmallScreen ? 25 : 30,
    lineHeight: isSmallScreen ? 16 : 18,
    marginBottom: isSmallScreen ? 20 : 30,
    fontWeight: 'lighter',
    bottom: 15,
    fontFamily: 'Nexa-ExtraLight',
  },
  subtitle2Justified: {
    textAlign: 'justify',
    alignSelf: 'center',
    maxWidth: isSmallScreen ? width - 50 : width - 60,
  },
  funFactBold: {
    fontWeight: 'bold',
    color: '#F43332',
    fontFamily: 'Nexa-Heavy',
  },
  highlightedText: {
    color: '#F43332',
    fontFamily: 'Nexa-Heavy',
  },
  orderDetailsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: isSmallScreen ? 15 : 20,
    marginBottom: isSmallScreen ? 20 : 30,
    borderRadius: 12,
    padding: isSmallScreen ? 15 : 20,
  },
  orderDetailsTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: isSmallScreen ? 12 : 16,
    fontFamily: 'Nexa-Heavy',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: isSmallScreen ? 10 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailRowNoBorder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: isSmallScreen ? 10 : 12,
  },
  detailLabel: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#666666',
    fontFamily: 'Nexa-ExtraLight',
  },
  detailValue: {
    fontSize: isSmallScreen ? 12 : 14,
    fontWeight: '500',
    color: '#333333',
    flex: 1,
    textAlign: 'right',
    fontFamily: 'Nexa-Heavy',
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: isSmallScreen ? 10 : 12,
  },
  totalRowNoBorder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: isSmallScreen ? 10 : 12,
  },
  totalLabel: {
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Nexa-Heavy',
  },
  totalValue: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: 'bold',
    color: '#333333',
    fontFamily: 'Nexa-Heavy',
  },
  totalValueContainer: {
    alignItems: 'flex-end',
  },
  paidBadge: {
    fontSize: isSmallScreen ? 11 : 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
    backgroundColor: '#F433329E',
    paddingHorizontal: isSmallScreen ? 12 : 15,
    paddingVertical: 2,
    borderRadius: 20,
    fontFamily: 'Nexa-Heavy',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: isSmallScreen ? 10 : 12,
  },
  viewDetailsText: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#F43332',
    fontWeight: '600',
    fontFamily: 'Nexa-Heavy',
  },
  expandedDetails: {
    backgroundColor: '#F8F8F8',
    marginHorizontal: isSmallScreen ? -15 : -20,
    paddingHorizontal: isSmallScreen ? 15 : 20,
    marginBottom: isSmallScreen ? -15 : -20,
    paddingBottom: isSmallScreen ? 15 : 20,
  },
  detailRowExpanded: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: isSmallScreen ? 10 : 12,
  },
  totalRowExpanded: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: isSmallScreen ? 10 : 12,
  },
  paidWithLabel: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#666666',
    marginBottom: isSmallScreen ? 10 : 12,
    fontFamily: 'Nexa-ExtraLight',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: isSmallScreen ? 10 : 12,
  },
  paymentMethod: {
    fontSize: isSmallScreen ? 12 : 14,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Nexa-Heavy',
  },
  paymentAmount: {
    fontSize: isSmallScreen ? 12 : 14,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Nexa-Heavy',
  },
  paymentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: isSmallScreen ? 6 : 8,
  },
  paymentStatusLabel: {
    fontSize: isSmallScreen ? 11 : 12,
    color: '#999999',
    fontFamily: 'Nexa-ExtraLight',
  },
  paymentStatusValue: {
    fontSize: isSmallScreen ? 12 : 14,
    fontWeight: '600',
    marginTop: 2,
    backgroundColor: '#F433329E',
    paddingHorizontal: isSmallScreen ? 12 : 15,
    paddingVertical: 2,
    borderRadius: 20,
    fontFamily: 'Nexa-Heavy',
  },
  paymentStatusSuccess: {
    color: '#FFFFFF',
  },

  // Footer
  footerContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 11,
    color: '#999999',
    fontFamily: 'Nexa-ExtraLight',
  },
});

export default OrderTracking;

