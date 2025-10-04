import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  Dimensions,
  RefreshControl
} from 'react-native';
import { apiService } from '../services/api';

const { width } = Dimensions.get('window');

const Orders = ({ onBack }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);

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

  const handleAcceptOrder = (orderId) => {
    // TODO: Implement accept order functionality
    console.log('Accepting order:', orderId);
  };

  const renderOrderItem = (order) => {
    const isExpanded = expandedOrder === order.order_id;
    
    return (
      <View key={order.order_id} style={styles.orderItem}>
        {/* Initial Details */}
        <TouchableOpacity 
          style={styles.initialDetails}
          onPress={() => toggleOrderDetails(order.order_id)}
        >
          <Text style={styles.orderNumber}>#{order.order_id}</Text>
          <Text style={styles.pickupPoint}>{order.restaurant_barangay || 'Restaurant'}</Text>
          <Text style={styles.dropPoint}>{order.customer_barangay || 'Customer'}</Text>
          <Text style={styles.viewDetails}>View</Text>
        </TouchableOpacity>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.dropDown}>
            {/* Your Location */}
            <View style={styles.locationItem}>
              <Image 
                source={require('../assets/starting-point.png')} 
                style={styles.markerIcon}
                resizeMode="contain"
              />
              <Text style={styles.locationText}>Your location</Text>
            </View>

            {/* Line Break Design */}
            <View style={styles.lineBreakDesign}>
              <View style={styles.square}>
                <View style={styles.squareDot} />
                <View style={styles.squareDot} />
                <View style={styles.squareDot} />
              </View>
              <View style={styles.horizontalLine} />
            </View>

            {/* Pickup Point */}
            <View style={styles.locationItem}>
              <Image 
                source={require('../assets/pickup-point.png')} 
                style={styles.markerIcon}
                resizeMode="contain"
              />
              <Text style={styles.locationText}>{order.restaurant?.name || 'Restaurant'}</Text>
            </View>

            {/* Line Break Design */}
            <View style={styles.lineBreakDesign}>
              <View style={styles.square}>
                <View style={styles.squareDot} />
                <View style={styles.squareDot} />
                <View style={styles.squareDot} />
              </View>
              <View style={styles.horizontalLine} />
            </View>

            {/* Drop Point */}
            <View style={styles.locationItem}>
              <Image 
                source={require('../assets/drop-point.png')} 
                style={styles.markerIcon}
                resizeMode="contain"
              />
              <Text style={styles.locationText}>{order.customer_barangay}</Text>
            </View>

            {/* Amount Summary */}
            <View style={styles.amountSummary}>
              <View style={styles.totalAmountContainer}>
                <Text style={styles.amountLabel}>Total Amount:</Text>
                <Text style={styles.totalAmount}>₱{order.total_amount}</Text>
              </View>

              <View style={styles.amountBreakdown}>
                <View style={styles.breakdownColumn}>
                  <Text style={styles.breakdownLabel}>Restaurant Bill:</Text>
                  <Text style={styles.breakdownAmount}>₱{order.subtotal}</Text>
                </View>
                <View style={styles.verticalLine} />
                <View style={styles.breakdownColumn}>
                  <Text style={styles.breakdownLabel}>Delivery Fee:</Text>
                  <Text style={styles.breakdownAmount}>₱{order.small_order_fee}</Text>
                </View>
              </View>

              <View style={styles.earningsContainer}>
                <View style={styles.earningsRow}>
                  <Text style={styles.earningsLabel}>Delivery Earnings:</Text>
                  <Text style={styles.earningsAmount}>₱{order.rider_fee}</Text>
                </View>

                <TouchableOpacity 
                  style={styles.acceptOrderButton}
                  onPress={() => handleAcceptOrder(order.order_id)}
                >
                  <Image 
                    source={require('../assets/rider.png')} 
                    style={styles.riderIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.acceptOrderText}>Accept Delivery</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
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
        <Text style={styles.headerTitle}>Orders</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Navigation Headers */}
      <View style={styles.navigationHeaders}>
        <View style={styles.orderNoHeader}>
          <Text style={styles.headerText}>Order #</Text>
        </View>
        <View style={styles.pickupHeader}>
          <Image 
            source={require('../assets/pickup-point.png')} 
            style={styles.headerIcon}
            resizeMode="contain"
          />
          <Text style={styles.headerText}>Pickup Point</Text>
        </View>
        <View style={styles.dropHeader}>
          <Image 
            source={require('../assets/drop-point.png')} 
            style={styles.headerIcon}
            resizeMode="contain"
          />
          <Text style={styles.headerText}>Drop Point</Text>
        </View>
        <View style={styles.spacer} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#45BA73']}
            tintColor="#45BA73"
          />
        }
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Nexa-ExtraLight',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 0,
    width: '100%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 1000,
    zIndex: 1000,
    paddingTop: 50,
    paddingBottom: 20,
    paddingLeft: 20,
    paddingRight: 20,
    height: 100,
  },
  backButton: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#F43332',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Nexa-Heavy',
    color: '#1A1A1A',
    fontWeight: '300',
  },
  headerSpacer: {
    width: 70,
    opacity: 0,
  },
  navigationHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 30,
    paddingRight: 30,
    paddingTop: 120,
    paddingBottom: 0,
    marginBottom: 0,
  },
  orderNoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#45BA73',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    height: 35,
    marginRight: 10,
  },
  pickupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BE5050',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    height: 35,
    marginRight: 10,
  },
  dropHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#45BA73',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    height: 35,
  },
  headerIcon: {
    width: 16,
    height: 16,
    marginRight: 5,
  },
  headerText: {
    fontSize: 12,
    fontFamily: 'Nexa-ExtraLight',
    color: '#1A1A1A',
  },
  spacer: {
    borderWidth: 1,
    borderColor: 'red',
    marginRight: 50,
    opacity: 0,
  },
  content: {
    flex: 1,
    marginTop: 0,
  },
  ordersList: {
    paddingTop: 40,
  },
  orderItem: {
    marginBottom: 20,
  },
  initialDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 5,
    paddingHorizontal: 0,
    paddingVertical: 20,
    marginHorizontal: 30,
  },
  orderNumber: {
    fontSize: 14,
    fontFamily: 'Nexa-Heavy',
    color: '#1A1A1A',
    right: 10,
  },
  pickupPoint: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#1A1A1A',
    left: 4,
  },
  dropPoint: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#1A1A1A',
    left: 10,
  },
  viewDetails: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#1A1A1A',
    left: 10,
  },
  dropDown: {
    flexDirection: 'column',
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markerIcon: {
    width: 25,
    height: 25,
    marginRight: 10,
    marginBottom: 5,
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#1A1A1A',
  },
  lineBreakDesign: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  square: {
    flexDirection: 'column',
    paddingRight: 20,
    paddingLeft: 10,
  },
  squareDot: {
    width: 5,
    height: 5,
    backgroundColor: '#CCCCCC',
    marginBottom: 5,
  },
  horizontalLine: {
    width: '90%',
    height: 1,
    backgroundColor: '#CCCCCC',
  },
  amountSummary: {
    width: width,
    marginTop: 20,
  },
  totalAmountContainer: {
    flexDirection: 'column',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E5E5',
  },
  amountLabel: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#727272',
  },
  totalAmount: {
    fontSize: 24,
    fontFamily: 'Nexa-Heavy',
    color: '#111111',
    fontWeight: '500',
  },
  amountBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: '#E5E5E5',
    paddingBottom: 15,
    paddingTop: 15,
  },
  breakdownColumn: {
    flexDirection: 'column',
    flex: 1,
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#727272',
    textAlign: 'center',
  },
  breakdownAmount: {
    fontSize: 20,
    fontFamily: 'Nexa-Heavy',
    color: '#111111',
    fontWeight: '400',
    textAlign: 'center',
  },
  verticalLine: {
    width: 1,
    height: 100,
    backgroundColor: '#CCCCCC',
  },
  earningsContainer: {
    backgroundColor: '#F5F5F5',
    width: '100%',
    paddingRight: 140,
    paddingBottom: 40,
    paddingTop: 20,
    paddingLeft: 20,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  earningsLabel: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#727272',
  },
  earningsAmount: {
    fontSize: 18,
    fontFamily: 'Nexa-Heavy',
    color: '#111111',
    fontWeight: '400',
  },
  acceptOrderButton: {
    backgroundColor: '#45BA73',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  riderIcon: {
    width: 30,
    height: 30,
    marginRight: 20,
  },
  acceptOrderText: {
    fontSize: 16,
    fontFamily: 'Nexa-Heavy',
    color: '#FFFFFF',
    fontWeight: '500',
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
});

export default Orders;
