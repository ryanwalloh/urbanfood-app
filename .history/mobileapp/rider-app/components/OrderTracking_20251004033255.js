import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  Dimensions,
  Alert
} from 'react-native';
import { apiService } from '../services/api';

const { width } = Dimensions.get('window');

const OrderTracking = ({ orderId, onBack }) => {
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📋 Fetching order details for tracking:', orderId);
      
      const response = await apiService.getOrderDetails(orderId);
      
      if (response.success) {
        setOrderDetails(response);
        console.log('✅ Order details fetched successfully:', response);
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
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <Text style={styles.orderTitle}>Order #{orderDetails.order_id}</Text>
          <Text style={styles.orderStatus}>Status: Accepted</Text>
        </View>

        {/* Progress Guide */}
        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Delivery Progress</Text>
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
                <Text style={styles.progressText}>Your Location</Text>
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
                <Text style={styles.progressText}>{orderDetails.restaurant_name || 'Restaurant'}</Text>
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
              <View style={styles.progressTextContainer}>
                <Text style={styles.progressText}>
                  {orderDetails.customer_first_name} {orderDetails.customer_last_name}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Order Information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Customer:</Text>
              <Text style={styles.infoValue}>{orderDetails.customer?.username || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Restaurant:</Text>
              <Text style={styles.infoValue}>{orderDetails.restaurant?.username || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Rider:</Text>
              <Text style={styles.infoValue}>{orderDetails.rider?.username || 'Not Assigned'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Payment Method:</Text>
              <Text style={styles.infoValue}>{orderDetails.payment_method || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Created:</Text>
              <Text style={styles.infoValue}>
                {orderDetails.created_at ? new Date(orderDetails.created_at).toLocaleString() : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        {orderDetails.items && orderDetails.items.length > 0 && (
          <View style={styles.itemsSection}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            <View style={styles.itemsCard}>
              {orderDetails.items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.product_name}</Text>
                  <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                  <Text style={styles.itemPrice}>₱{item.price}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Amount Summary */}
        <View style={styles.amountSection}>
          <Text style={styles.sectionTitle}>Amount Summary</Text>
          <View style={styles.amountCard}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Subtotal:</Text>
              <Text style={styles.amountValue}>₱{orderDetails.subtotal || '0.00'}</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Service Fee:</Text>
              <Text style={styles.amountValue}>₱{orderDetails.small_order_fee || '0.00'}</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Rider Fee:</Text>
              <Text style={styles.amountValue}>₱{orderDetails.rider_fee || '0.00'}</Text>
            </View>
            <View style={[styles.amountRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalValue}>₱{orderDetails.total_amount || '0.00'}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          {orderDetails.status === 'accepted' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleUpdateStatus('otw')}
            >
              <Text style={styles.actionButtonText}>Mark as On the Way</Text>
            </TouchableOpacity>
          )}
          
          {orderDetails.status === 'otw' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleUpdateStatus('delivered')}
            >
              <Text style={styles.actionButtonText}>Mark as Delivered</Text>
            </TouchableOpacity>
          )}
        </View>

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
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  orderHeader: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  orderTitle: {
    fontSize: 24,
    fontFamily: 'Nexa-Heavy',
    color: '#1A1A1A',
    marginBottom: 5,
  },
  orderToken: {
    fontSize: 16,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666666',
    marginBottom: 5,
  },
  orderStatus: {
    fontSize: 16,
    fontFamily: 'Nexa-Heavy',
    color: '#F43332',
  },
  progressSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nexa-Heavy',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  progressGuide: {
    backgroundColor: '#FFFFFF',
    padding: 20,
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
  infoSection: {
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666666',
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Nexa-Heavy',
    color: '#1A1A1A',
  },
  itemsSection: {
    marginBottom: 20,
  },
  itemsCard: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemName: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#1A1A1A',
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666666',
    marginHorizontal: 10,
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: 'Nexa-Heavy',
    color: '#1A1A1A',
  },
  amountSection: {
    marginBottom: 20,
  },
  amountCard: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  amountLabel: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666666',
  },
  amountValue: {
    fontSize: 14,
    fontFamily: 'Nexa-Heavy',
    color: '#1A1A1A',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 10,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'Nexa-Heavy',
    color: '#1A1A1A',
  },
  totalValue: {
    fontSize: 16,
    fontFamily: 'Nexa-Heavy',
    color: '#F43332',
  },
  actionsSection: {
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#F43332',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
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
