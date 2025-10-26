import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Animated, Platform } from 'react-native';
import { apiService } from '../services/api';
import API_CONFIG from '../config/apiConfig.js';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;

const Orders = ({ user, onBack }) => {
  const [activeOrders, setActiveOrders] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);
  const [elapsedTimes, setElapsedTimes] = useState({});
  const elapsedTimerRef = useRef(null);

  useEffect(() => {
    fetchOrders();
    // setupWebSocket(); // Will be implemented in next step
    
    // Start elapsed time timer
    elapsedTimerRef.current = setInterval(() => {
      updateElapsedTimes();
    }, 1000);
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
      }
    };
  }, [activeOrders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('📦 Fetching customer orders...');
      
      const result = await apiService.getCustomerOrders(user?.id);
      
      if (result.success) {
        setActiveOrders(result.activeOrders || []);
        setRecentOrders(result.recentOrders || []);
        console.log(`✅ Orders fetched: ${result.activeOrders?.length || 0} active, ${result.recentOrders?.length || 0} recent`);
        
        // Initialize elapsed times for active orders
        const times = {};
        result.activeOrders?.forEach(order => {
          if (order.created_at) {
            times[order.id] = calculateElapsedTime(order.created_at);
          }
        });
        setElapsedTimes(times);
      } else {
        console.log('❌ Failed to fetch orders:', result.error);
        setActiveOrders([]);
        setRecentOrders([]);
      }
    } catch (error) {
      console.log('Error fetching orders:', error);
      setActiveOrders([]);
      setRecentOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateElapsedTime = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diff = Math.floor((now - created) / 1000); // Difference in seconds
    
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const updateElapsedTimes = () => {
    const times = {};
    activeOrders.forEach(order => {
      if (order.created_at) {
        times[order.id] = calculateElapsedTime(order.created_at);
      }
    });
    setElapsedTimes(times);
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      'pending': 'Pending',
      'accepted': 'Accepted',
      'preparing': 'Preparing',
      'assigned': 'Assigned',
      'ready': 'Ready',
      'otw': 'On the Way',
      'arrived': 'Arrived',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
    };
    return statusMap[status] || status;
  };

  const getStatusActiveBar = (status) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'accepted':
        return 1;
      case 'preparing':
        return 1;
      case 'assigned':
        return 2;
      case 'ready':
        return 2;
      case 'otw':
        return 3;
      case 'arrived':
        return 4;
      default:
        return 0;
    }
  };

  const renderActiveOrder = () => {
    if (activeOrders.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Active Orders</Text>
          <Text style={styles.emptyMessage}>You don't have any active orders at the moment.</Text>
          <TouchableOpacity style={styles.orderNowButton} onPress={onBack}>
            <Text style={styles.orderNowButtonText}>Order Now</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return activeOrders.map((order) => {
      const activeBar = getStatusActiveBar(order.status);

      return (
        <View key={order.id} style={styles.activeOrderCard}>
          {/* Restaurant Name and Status */}
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.restaurantName}>{order.restaurant_name}</Text>
              <Text style={styles.orderTime}>{elapsedTimes[order.id] || '...'} ago</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <Text style={styles.statusBadgeText}>{getStatusDisplay(order.status)}</Text>
            </View>
          </View>

          {/* Progress Bars */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarWrapper}>
              <View style={[styles.progressBar, activeBar > 0 && styles.progressBarFilled]} />
            </View>
            <View style={styles.progressBarWrapper}>
              <View style={[styles.progressBar, activeBar > 1 && styles.progressBarFilled]} />
            </View>
            <View style={styles.progressBarWrapper}>
              <View style={[styles.progressBar, activeBar > 2 && styles.progressBarFilled]} />
            </View>
            <View style={styles.progressBarWrapper}>
              <View style={[styles.progressBar, activeBar > 3 && styles.progressBarFilled]} />
            </View>
          </View>

          {/* Order Details */}
          <View style={styles.orderDetails}>
            <View style={styles.orderDetailRow}>
              <Text style={styles.orderDetailLabel}>Order #{order.token_number}</Text>
              <Text style={styles.orderDetailValue}>₱{order.total_amount}</Text>
            </View>
            <View style={styles.orderDetailRow}>
              <Text style={styles.orderDetailLabel}>Payment Method</Text>
              <Text style={styles.orderDetailValue}>{order.payment_method}</Text>
            </View>
          </View>
        </View>
      );
    });
  };

  const renderRecentOrders = () => {
    if (recentOrders.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyMessage}>No recent orders</Text>
        </View>
      );
    }

    return recentOrders.map((order) => {
      const date = new Date(order.created_at);
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      return (
        <TouchableOpacity key={order.id} style={styles.recentOrderCard}>
          <View style={styles.recentOrderHeader}>
            <View>
              <Text style={styles.recentRestaurantName}>{order.restaurant_name}</Text>
              <Text style={styles.recentOrderDate}>{formattedDate}</Text>
            </View>
            <View style={[styles.statusBadge, styles.statusBadgeDelivered]}>
              <Text style={styles.statusBadgeText}>{getStatusDisplay(order.status)}</Text>
            </View>
          </View>
          <View style={styles.recentOrderDetails}>
            <Text style={styles.recentOrderToken}>Order #{order.token_number}</Text>
            <Text style={styles.recentOrderAmount}>₱{order.total_amount}</Text>
          </View>
        </TouchableOpacity>
      );
    });
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'pending': '#FFA500',
      'accepted': '#FFA500',
      'preparing': '#FFA500',
      'assigned': '#2196F3',
      'ready': '#2196F3',
      'otw': '#4CAF50',
      'arrived': '#4CAF50',
      'delivered': '#4CAF50',
      'cancelled': '#F44336',
    };
    return colorMap[status] || '#666';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.headerLink}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Orders Container */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Active Orders</Text>
          <View style={styles.ordersCard}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : (
              renderActiveOrder()
            )}
          </View>
        </View>

        {/* Recent Orders Container */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <View style={styles.ordersCard}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : (
              renderRecentOrders()
            )}
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: isSmallScreen ? 20 : 24,
    paddingTop: isSmallScreen ? 50 : 60,
    paddingBottom: isSmallScreen ? 12 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  headerTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    color: '#333',
    fontFamily: 'Nexa-Heavy',
  },
  headerLink: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#F43332',
    fontFamily: 'Nexa-ExtraLight',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: isSmallScreen ? 16 : 20,
    paddingBottom: 30,
  },
  sectionContainer: {
    marginBottom: isSmallScreen ? 18 : 24,
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontFamily: 'Nexa-Heavy',
    color: '#333',
    marginBottom: 12,
  },
  ordersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: isSmallScreen ? 14 : 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontFamily: 'Nexa-Heavy',
    color: '#333',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: isSmallScreen ? 13 : 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  orderNowButton: {
    backgroundColor: '#F43332',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  orderNowButtonText: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 14 : 16,
    fontFamily: 'Nexa-ExtraLight',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: isSmallScreen ? 12 : 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666',
  },
  // Active Order Card
  activeOrderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: isSmallScreen ? 12 : 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: isSmallScreen ? 12 : 16,
  },
  restaurantName: {
    fontSize: isSmallScreen ? 16 : 18,
    fontFamily: 'Nexa-Heavy',
    color: '#333',
    marginBottom: 4,
  },
  orderTime: {
    fontSize: isSmallScreen ? 12 : 13,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: isSmallScreen ? 10 : 12,
    paddingVertical: isSmallScreen ? 5 : 6,
    borderRadius: 16,
  },
  statusBadgeDelivered: {
    backgroundColor: '#4CAF50',
  },
  statusBadgeText: {
    fontSize: isSmallScreen ? 10 : 11,
    fontFamily: 'Nexa-ExtraLight',
    color: '#FFFFFF',
  },
  // Progress Bars
  progressContainer: {
    flexDirection: 'row',
    gap: isSmallScreen ? 6 : 8,
    marginBottom: isSmallScreen ? 12 : 16,
  },
  progressBarWrapper: {
    flex: 1,
    height: isSmallScreen ? 3 : 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    flex: 1,
    backgroundColor: '#E0E0E0',
  },
  progressBarFilled: {
    backgroundColor: '#F43332',
  },
  // Order Details
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
    paddingTop: isSmallScreen ? 10 : 12,
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: isSmallScreen ? 6 : 8,
  },
  orderDetailLabel: {
    fontSize: isSmallScreen ? 13 : 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666',
  },
  orderDetailValue: {
    fontSize: isSmallScreen ? 13 : 14,
    fontFamily: 'Nexa-Heavy',
    color: '#333',
  },
  // Recent Order Card
  recentOrderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: isSmallScreen ? 12 : 16,
    marginBottom: 12,
  },
  recentOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: isSmallScreen ? 10 : 12,
  },
  recentRestaurantName: {
    fontSize: isSmallScreen ? 15 : 16,
    fontFamily: 'Nexa-Heavy',
    color: '#333',
    marginBottom: 4,
  },
  recentOrderDate: {
    fontSize: isSmallScreen ? 12 : 13,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666',
  },
  recentOrderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: isSmallScreen ? 10 : 12,
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
  },
  recentOrderToken: {
    fontSize: isSmallScreen ? 13 : 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666',
  },
  recentOrderAmount: {
    fontSize: isSmallScreen ? 15 : 16,
    fontFamily: 'Nexa-Heavy',
    color: '#F43332',
  },
});

export default Orders;
