import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import MapView, { Marker } from 'react-native-maps';
import { apiService } from '../services/api';

const { width } = Dimensions.get('window');

const Checkout = ({ cartItems, restaurant, user, onBack, onPlaceOrder }) => {
  const [selectedPayment, setSelectedPayment] = useState('Cash on Delivery');
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(true);

  // Calculate totals
  const subtotal = cartItems.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);
  const deliveryFee = 39.00;
  const serviceFee = 9.00;
  const vat = 8.00;
  const total = subtotal + deliveryFee + serviceFee + vat;

  // Fetch user address
  useEffect(() => {
    fetchUserAddress();
  }, []);

  const fetchUserAddress = async () => {
    try {
      console.log('🔍 Checkout - User data:', JSON.stringify(user, null, 2));
      
      if (!user?.id) {
        console.log('❌ No user ID available in Checkout');
        setLoading(false);
        return;
      }

      console.log('🌐 Fetching address for user ID:', user.id);
      const result = await apiService.getUserAddress(user.id);
      if (result.success) {
        setAddress(result.address);
        console.log('✅ Address loaded:', result.address);
      } else {
        console.log('❌ Failed to load address:', result.error);
        // Set default address if none found
        setAddress({
          label: 'Home',
          street: 'No address set',
          barangay: 'Please add an address',
          latitude: 14.5995,
          longitude: 120.9842,
        });
      }
    } catch (error) {
      console.log('Error fetching address:', error);
      // Set default address on error
      setAddress({
        label: 'Home',
        street: 'Error loading address',
        barangay: 'Please try again',
        latitude: 14.5995,
        longitude: 120.9842,
      });
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { id: 'visa', name: 'Visa', icon: '💳' },
    { id: 'gcash', name: 'GCash', icon: '📱' },
    { id: 'paymaya', name: 'PayMaya', icon: '💳' },
    { id: 'cod', name: 'Cash on Delivery', icon: '💰' },
  ];

  // Icons
  const BackIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19L5 12L12 5"
        stroke="#333333"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const EditIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z"
        stroke="#F43332"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const RadioIcon = ({ selected }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"
        stroke={selected ? "#F43332" : "#E0E0E0"}
        strokeWidth="2"
        fill={selected ? "#F43332" : "none"}
      />
      {selected && (
        <Path
          d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6Z"
          fill="#FFFFFF"
        />
      )}
    </Svg>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <BackIcon />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Checkout</Text>
          <Text style={styles.headerSubtitle}>Powered by ryamazingw</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressLineContainer}>
          <View style={styles.progressLine}>
            <View style={styles.progressLineActive} />
          </View>
          
          {/* Progress Step Icons positioned on the line */}
          <View style={[styles.progressStepIconContainer, styles.progressStepIcon1]}>
            <View style={[styles.progressStepIcon, styles.progressStepIconActive]}>
              <Text style={styles.progressStepNumber}>1</Text>
            </View>
          </View>
          
          <View style={[styles.progressStepIconContainer, styles.progressStepIcon2]}>
            <View style={[styles.progressStepIcon, styles.progressStepIconActive]}>
              <Text style={styles.progressStepNumber}>2</Text>
            </View>
          </View>
          
          <View style={[styles.progressStepIconContainer, styles.progressStepIcon3]}>
            <View style={[styles.progressStepIcon, styles.progressStepIconActive]}>
              <Text style={styles.progressStepNumber}>3</Text>
            </View>
          </View>
        </View>
        
        {/* Progress Step Labels below */}
        <View style={styles.progressSteps}>
          <View style={styles.progressStepLabel1}>
            <Text style={styles.progressStepLabel}>Menu</Text>
          </View>
          <View style={styles.progressStepLabel2}>
            <Text style={styles.progressStepLabel}>Cart</Text>
          </View>
          <View style={styles.progressStepLabel3}>
            <Text style={styles.progressStepLabel}>Checkout</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Delivery Address Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity style={styles.editButton}>
              <EditIcon />
            </TouchableOpacity>
          </View>
          
          {address && (
            <>
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: address.latitude,
                    longitude: address.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: address.latitude,
                      longitude: address.longitude,
                    }}
                    title="Delivery Address"
                  />
                </MapView>
              </View>
              
              <View style={styles.addressInfo}>
                <Text style={styles.addressLabel}>{address.label}</Text>
                <Text style={styles.addressDetails}>
                  {address.street}, {address.barangay}
                </Text>
                <TouchableOpacity style={styles.addInstructionButton}>
                  <Text style={styles.addInstructionText}>+ Add delivery instruction</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Payment Method Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <View style={styles.paymentMethods}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={styles.paymentMethod}
                onPress={() => setSelectedPayment(method.name)}
              >
                <View style={styles.paymentMethodContent}>
                  <Text style={styles.paymentIcon}>{method.icon}</Text>
                  <Text style={styles.paymentName}>{method.name}</Text>
                </View>
                <RadioIcon selected={selectedPayment === method.name} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Order Summary Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          
          <View style={styles.orderItems}>
            {cartItems.map((item, index) => (
              <View key={item.product_id || index}>
                <View style={styles.orderItem}>
                  <Text style={styles.orderItemText}>
                    {item.quantity}x {item.product_name}
                  </Text>
                  <Text style={styles.orderItemPrice}>
                    ₱{(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </Text>
                </View>
                {index === cartItems.length - 1 && <View style={styles.separator} />}
              </View>
            ))}
          </View>
          
          <View style={styles.orderSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₱{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summarySubLabel}>Delivery fee</Text>
              <Text style={styles.summarySubValue}>₱{deliveryFee.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summarySubLabel}>Service fee</Text>
              <Text style={styles.summarySubValue}>₱{serviceFee.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summarySubLabel}>VAT</Text>
              <Text style={styles.summarySubValue}>₱{vat.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Bottom padding for sticky total */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Sticky Bottom Total */}
      <View style={styles.stickyTotalContainer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total (incl. fees and tax)</Text>
          <Text style={styles.totalAmount}>₱{total.toFixed(2)}</Text>
        </View>
        <View style={styles.totalSeparator} />
        <TouchableOpacity style={styles.placeOrderButton} onPress={onPlaceOrder}>
          <Text style={styles.placeOrderButtonText}>Place Order</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666666',
  },
  headerSpacer: {
    width: 40,
  },

  // Progress Bar
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 0,
    bottom: 15,
  },
  progressLineContainer: {
    position: 'relative',
    height: 32,
    marginBottom: 20,
    justifyContent: 'center',
  },
  progressLine: {
    height: 2,
    backgroundColor: '#333333',
    position: 'relative',
  },
  progressLineActive: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: 2,
    backgroundColor: '#333333',
  },
  progressStepIconContainer: {
    position: 'absolute',
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
    height: 32,
  },
  progressStepIcon1: {
    left: 30,
    transform: [{ translateX: -16 }],
  },
  progressStepIcon2: {
    left: '50%',
    transform: [{ translateX: -16 }],
  },
  progressStepIcon3: {
    right: 30,
    transform: [{ translateX: 16 }],
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStepLabel1: {
    alignItems: 'center',
    left: 15,
  },
  progressStepLabel2: {
    alignItems: 'center',
    left: 10,
  },
  progressStepLabel3: {
    alignItems: 'center',
    right: 3,
  },
  progressStepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  progressStepIconActive: {
    backgroundColor: '#333333',
  },
  progressStepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressStepLabel: {
    fontSize: 12,
    color: '#666666',
    top: -15,
  },

  // Scroll Container
  scrollContainer: {
    flex: 1,
  },

  // Section Container
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  editButton: {
    padding: 4,
  },

  // Map Container
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  map: {
    width: '100%',
    height: '100%',
  },

  // Address Info
  addressInfo: {
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  addressDetails: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  addInstructionButton: {
    alignSelf: 'flex-start',
  },
  addInstructionText: {
    fontSize: 14,
    color: '#F43332',
    fontWeight: '600',
  },

  // Payment Methods
  paymentMethods: {
    marginTop: 16,
  },
  paymentMethod: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  paymentName: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },

  // Order Items
  orderItems: {
    marginTop: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  orderItemText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  orderItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F43332',
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 0,
  },

  // Order Summary
  orderSummary: {
    marginTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  summarySubLabel: {
    fontSize: 14,
    color: '#666666',
  },
  summarySubValue: {
    fontSize: 14,
    color: '#666666',
  },

  // Bottom Padding
  bottomPadding: {
    height: 180,
  },

  // Sticky Total
  stickyTotalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F43332',
  },
  totalSeparator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 16,
  },
  placeOrderButton: {
    backgroundColor: '#F43332',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  placeOrderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default Checkout;
