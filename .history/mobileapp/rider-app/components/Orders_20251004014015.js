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
    const isExpanded = expandedOrder === order.id;
    
    return (
      <View key={order.id} style={styles.orderItem}>
        {/* Initial Details */}
        <TouchableOpacity 
          style={styles.initialDetails}
          onPress={() => toggleOrderDetails(order.id)}
        >
          <Text style={styles.orderNumber}>Order #{order.id}</Text>
          <Text style={styles.pickupPoint}>Pickup Point: {order.restaurant_barangay || 'Restaurant'}</Text>
          <Text style={styles.dropPoint}>Drop Point: {order.customer_barangay || 'Customer'}</Text>
          <Text style={styles.viewDetails}>View Details</Text>
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
              <Text style={styles.locationText}>Restaurant Name: {order.restaurant_name}</Text>
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
              <Text style={styles.locationText}>Drop Point: {order.customer_barangay}</Text>
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
                  <Text style={styles.breakdownLabel}>Soti Delivery Fee:</Text>
                  <Text style={styles.breakdownAmount}>₱{order.delivery_fee}</Text>
                </View>
              </View>

              <View style={styles.earningsContainer}>
                <View style={styles.earningsRow}>
                  <Text style={styles.earningsLabel}>Delivery Earnings:</Text>
                  <Text style={styles.earningsAmount}>₱{order.rider_fee}</Text>
                </View>

                <TouchableOpacity 
                  style={styles.acceptOrderButton}
                  onPress={() => handleAcceptOrder(order.id)}
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
          <Image 
            source={require('../assets/back.png')} 
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Orders</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Navigation Headers */}
      <View style={styles.navigationHeaders}>
        <View style={styles.orderNoHeader}>
          <Text style={styles.headerText}>Order No.</Text>
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
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#F43332',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Nexa-Heavy',
    color: '#1A1A1A',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
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
  ordersList: {
    padding: 20,
  },
  orderItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontFamily: 'Nexa-Heavy',
    color: '#1A1A1A',
  },
  orderStatus: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#F43332',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderDetails: {
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 18,
    fontFamily: 'Nexa-Heavy',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    fontFamily: 'Nexa-ExtraLight',
    color: '#333333',
    marginBottom: 4,
  },
  orderAddress: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666666',
    marginBottom: 8,
  },
  orderAmount: {
    fontSize: 18,
    fontFamily: 'Nexa-Heavy',
    color: '#F43332',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTime: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#999999',
  },
  viewDetailsButton: {
    backgroundColor: '#F43332',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewDetailsText: {
    fontSize: 14,
    fontFamily: 'Nexa-Heavy',
    color: '#FFFFFF',
  },
});

export default Orders;
