import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  Dimensions,
  RefreshControl,
  Alert,
  Platform,
  PermissionsAndroid,
  ActivityIndicator
} from 'react-native';
import * as Location from 'expo-location';
import { apiService } from '../services/api';
import OrderTracking from './OrderTracking';

const { width } = Dimensions.get('window');

const Orders = ({ onBack }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [riderLocation, setRiderLocation] = useState('Your Location');
  const [currentScreen, setCurrentScreen] = useState('orders'); // 'orders' or 'tracking'
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [acceptingOrderId, setAcceptingOrderId] = useState(null); // Track which order is being accepted

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('📦 Fetching orders...');
      const response = await apiService.getRiderOrders();
      
      if (response.success) {
        setOrders(response.orders || []);
        console.log('✅ Orders fetched successfully:', response.orders?.length || 0);
      } else {
        console.log('❌ Failed to fetch orders:', response.error);
        setOrders([]);
      }
    } catch (error) {
      console.log('❌ Orders fetch error:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  // Request location permission
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to track delivery.');
        return false;
      }
      return true;
    } catch (error) {
      console.log('Location permission error:', error);
      return false;
    }
  };

  // Get current location
  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const { latitude, longitude } = location.coords;
      console.log('📍 Current rider location:', { latitude, longitude });
      return { latitude, longitude };
    } catch (error) {
      console.log('Location error:', error);
      return null;
    }
  };

  const handleAcceptOrder = async (orderId) => {
    // Prevent double entry
    if (acceptingOrderId) {
      console.log('⚠️ Order acceptance already in progress');
      return;
    }

    try {
      setAcceptingOrderId(orderId); // Set loading state
      console.log('✅ Accepting order:', orderId);
      
      // Request location permission first
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Location Permission Required', 
          'Location permission is required to accept orders. Please enable location services in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get current location
      const location = await getCurrentLocation();
      if (!location) {
        Alert.alert(
          'Location Error', 
          'Unable to get your current location. Please check your location settings and try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Update rider location first
      console.log('📍 Updating rider location before accepting order');
      const locationResponse = await apiService.updateRiderLocation(location.latitude, location.longitude);
      
      if (!locationResponse.success) {
        console.log('⚠️ Failed to update rider location:', locationResponse.error);
        // Continue with order acceptance even if location update fails
      } else {
        console.log('✅ Rider location updated successfully');
      }

      // Accept the order
      const response = await apiService.acceptOrder(orderId);
      
      if (response.success) {
        // Navigate to order tracking page immediately
        setTrackingOrderId(orderId);
        setCurrentScreen('tracking');
        
        // Refresh orders list to remove accepted order
        fetchOrders();
      } else {
        Alert.alert(
          'Order Acceptance Failed', 
          response.error || 'Failed to accept order. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.log('❌ Accept order error:', error);
      Alert.alert(
        'Network Error', 
        'Unable to connect to the server. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setAcceptingOrderId(null); // Clear loading state
    }
  };

  const truncateText = (text, maxLength = 12) => {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 2) + '..';
  };

  const renderOrderItem = (order) => {
    const isExpanded = expandedOrder === order.order_id;
    
    return (
      <View key={order.order_id} style={styles.orderItem}>
        {/* Initial Details */}
        <View style={styles.initialDetailsCard}>
          <View style={styles.initialDetails}>
            <TouchableOpacity 
              style={styles.orderInfoContainer}
              onPress={() => toggleOrderDetails(order.order_id)}
            >
              <Text style={styles.orderNumber}>#{order.order_id}</Text>
              <Text style={styles.pickupPoint}>{truncateText(order.restaurant_barangay || 'Restaurant')}</Text>
              <Text style={styles.dropPoint}>{truncateText(order.customer_barangay || 'Customer')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.viewButton}
              onPress={() => toggleOrderDetails(order.order_id)}
            >
              <Text style={styles.viewButtonText}>View</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.expandedDetailsCard}>
            <View style={styles.expandedDetails}>
            {/* Progress Guide */}
            <View style={styles.progressGuide}>
              {/* Your Location */}
              <View style={styles.progressItem}>
                <View style={styles.iconContainer}>
                  <Image 
                    source={require('../assets/starting-point.png')} 
                    style={styles.progressIcon}
                    resizeMode="contain"
                  />
                  <View style={styles.verticalLine} />
                </View>
                <View style={styles.progressTextContainer}>
                  <Text style={styles.progressText}>{riderLocation}</Text>
                  <View style={styles.horizontalSeparator} />
                </View>
              </View>

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
                  <Text style={styles.progressText}>{order.restaurant?.name || 'Restaurant'}</Text>
                  <View style={styles.horizontalSeparator} />
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
                <Text style={styles.progressText}>{order.customer_barangay}</Text>
              </View>
            </View>

            {/* Amount Summary */}
            <View style={styles.amountSummary}>
              {/* Total Amount - Full Width */}
              <View style={styles.totalAmountTile}>
                <Text style={styles.totalAmountLabel}>Total Amount</Text>
                <Text style={styles.totalAmountValue}>₱{order.total_amount}</Text>
              </View>

              {/* Service Fee and Restaurant Bill - Two Tiles */}
              <View style={styles.amountRow}>
                <View style={styles.amountTile}>
                  <Text style={styles.amountLabel}>Service Fee</Text>
                  <Text style={styles.amountValue}>₱{order.small_order_fee}</Text>
                </View>
                <View style={styles.verticalSeparator} />
                <View style={[styles.amountTile, styles.restaurantBillTile]}>
                  <Text style={[styles.amountLabel, styles.restaurantBillLabel]}>Restaurant Bill</Text>
                  <Text style={[styles.amountValue, styles.restaurantBillValue]}>₱{order.subtotal}</Text>
                </View>
              </View>
            </View>

            {/* Delivery Earnings and Accept Button */}
            <View style={styles.earningsContainer}>
              <View style={styles.earningsRow}>
                <Text style={styles.earningsLabel}>Delivery Earnings:</Text>
                <Text style={styles.earningsValue}>₱{order.rider_fee}</Text>
              </View>

              <TouchableOpacity 
                style={[
                  styles.acceptButton,
                  (acceptingOrderId === order.order_id || acceptingOrderId) && styles.acceptButtonDisabled
                ]}
                onPress={() => handleAcceptOrder(order.order_id)}
                disabled={acceptingOrderId === order.order_id || acceptingOrderId}
              >
                {acceptingOrderId === order.order_id ? (
                  <ActivityIndicator size="small" color="#FFFFFF" style={styles.loadingSpinner} />
                ) : (
                  <Image 
                    source={require('../assets/rider.png')} 
                    style={styles.riderIcon}
                    resizeMode="contain"
                  />
                )}
                <Text style={[
                  styles.acceptButtonText,
                  (acceptingOrderId === order.order_id || acceptingOrderId) && styles.acceptButtonTextDisabled
                ]}>
                  {acceptingOrderId === order.order_id ? 'Accepting...' : 'Accept Delivery'}
                </Text>
              </TouchableOpacity>
            </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Handle navigation back from tracking
  const handleBackFromTracking = () => {
    setCurrentScreen('orders');
    setTrackingOrderId(null);
  };

  // Show order tracking page if currentScreen is 'tracking'
  if (currentScreen === 'tracking' && trackingOrderId) {
    return (
      <OrderTracking 
        orderId={trackingOrderId}
        onBack={handleBackFromTracking}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Orders</Text>
          <Text style={styles.headerSubtitle}>Pending Orders</Text>
        </View>
      </View>

      {/* Guide Icons */}
      <View style={styles.guideContainer}>
        <View style={[styles.guideItem, styles.orderNumberGuide]}>
          <Text style={[styles.guideText, styles.orderNumberGuideText]}>Order #</Text>
        </View>
        <View style={[styles.guideItem, styles.pickupGuide]}>
          <Image 
            source={require('../assets/pickup-point.png')} 
            style={styles.guideIcon}
            resizeMode="contain"
          />
          <Text style={styles.guideText}>Pickup Point</Text>
        </View>
        <View style={[styles.guideItem, styles.dropGuide]}>
          <Image 
            source={require('../assets/drop-point.png')} 
            style={styles.guideIcon}
            resizeMode="contain"
          />
          <Text style={styles.guideText}>Drop Point</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#F43332']}
            tintColor="#F43332"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Image 
              source={require('../assets/foodPack.png')} 
              style={styles.emptyIcon}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptySubtitle}>
              You don't have any orders yet. Check back later!
            </Text>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {orders.map(renderOrderItem)}
          </View>
        )}
        {/* Bottom padding for navigation */}
        <View style={styles.bottomPadding} />
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
  guideContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    marginTop: 20,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  guideIcon: {
    width: 16,
    height: 16,
    marginRight: 5,
    
  },
  guideText: {
    fontSize: 12,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666666',
  },
  orderNumberGuide: {
    backgroundColor: '#F43332',
    borderRadius: 20,
    width: 80,
    flex: 0,
  },
  orderNumberGuideText: {
    color: '#FFFFFF',
    fontFamily: 'Nexa-Heavy',
  },
  pickupGuide: {
    borderWidth: 1,
    borderColor: '#F43332',
    backgroundColor: 'transparent',
    borderRadius: 20,
    width: 110,
    flex: 0,
    right: 25,
  },
  dropGuide: {
    borderWidth: 1,
    borderColor: '#45BA73',
    backgroundColor: 'transparent',
    borderRadius: 20,
    width: 110,
    flex: 0,
    right: 50,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  ordersList: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  orderItem: {
    marginBottom: 15,
  },
  initialDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expandedDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    marginTop: 10,
    marginHorizontal: -20,
  },
  initialDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  orderInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontFamily: 'Nexa-Heavy',
    color: '#1A1A1A',
    width: 60,
    flex: 0,
  },
  pickupPoint: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666666',
    flex: 1,
    textAlign: 'center',
    numberOfLines: 1,
    ellipsizeMode: 'tail',
    marginHorizontal: 8,
  },
  dropPoint: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666666',
    flex: 1,
    textAlign: 'center',
    numberOfLines: 1,
    ellipsizeMode: 'tail',
    marginHorizontal: 8,
  },
  viewButton: {
    backgroundColor: '#F43332',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  viewButtonText: {
    fontSize: 12,
    fontFamily: 'Nexa-Heavy',
    color: '#FFFFFF',
  },
  expandedDetails: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 20,
  },
  progressGuide: {
    marginBottom: 20,
    left: 20,
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
  progressText: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#1A1A1A',
    lineHeight: 20,
  },
  horizontalSeparator: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginTop: 8,
    marginRight: 20,
  },
  verticalLine: {
    width: 2,
    height: 25,
    backgroundColor: '#E5E5E5',
    marginTop: 5,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  amountSummary: {
    marginBottom: 20,
    marginHorizontal: -20,
  },
  totalAmountTile: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E5E5',
  },
  totalAmountLabel: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666666',
    marginBottom: 5,
  },
  totalAmountValue: {
    fontSize: 24,
    fontFamily: 'Nexa-Heavy',
    color: '#F43332',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  verticalSeparator: {
    width: 1,
    backgroundColor: '#E5E5E5',
  },
  amountTile: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: '#E5E5E5',
  },
  amountLabel: {
    fontSize: 12,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666666',
    marginBottom: 5,
  },
  amountValue: {
    fontSize: 16,
    fontFamily: 'Nexa-Heavy',
    color: '#1A1A1A',
  },
  restaurantBillTile: {
    alignItems: 'flex-end',
  },
  restaurantBillLabel: {
    textAlign: 'right',
  },
  restaurantBillValue: {
    textAlign: 'right',
  },
  earningsContainer: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 0,
    marginHorizontal: -20,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  earningsLabel: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666666',
  },
  earningsValue: {
    fontSize: 18,
    fontFamily: 'Nexa-Heavy',
    color: '#F43332',
  },
  acceptButton: {
    backgroundColor: '#F43332',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  acceptButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.7,
  },
  riderIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  riderIconDisabled: {
    opacity: 0.5,
  },
  acceptButtonText: {
    fontSize: 16,
    fontFamily: 'Nexa-Heavy',
    color: '#FFFFFF',
  },
  acceptButtonTextDisabled: {
    color: '#999999',
  },
  loadingSpinner: {
    marginRight: 8,
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    marginBottom: 20,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'Nexa-Heavy',
    color: '#1A1A1A',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
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

export default Orders;