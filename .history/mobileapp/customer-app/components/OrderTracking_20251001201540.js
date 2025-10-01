import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

const OrderTracking = ({ order, restaurant, cartItems, user, onBack, address }) => {
  const [showDetails, setShowDetails] = useState(false);

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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.closeButton}>
          <CloseIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your order</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Graphic Container */}
        <View style={styles.imageContainer}>
          <Image 
            source={require('../assets/pending.png')} 
            style={styles.statusImage}
            resizeMode="contain"
          />
        </View>

        {/* Subtitle 1 */}
        <Text style={styles.subtitle1}>Chef is reviewing the ingredients needed</Text>

        {/* Title 1 */}
        <Text style={styles.title1}>Shopping for Ingredients</Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar} />
          <View style={styles.progressBar} />
          <View style={styles.progressBar} />
          <View style={styles.progressBar} />
        </View>

        {/* Subtitle 2 - Fun Fact */}
        <Text style={styles.subtitle2}>
          Fun Fact: Did you know that Soti Delivery is the First major tech breakthrough in Marawi, 
          empowering local restaurants, riders, and the community toward a new era of innovation?
        </Text>

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
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Delivery address</Text>
            <Text style={styles.detailValue}>{address?.street || 'Not set'}</Text>
          </View>

          {/* Separator */}
          <View style={styles.separator} />

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total (incl. fees and tax)</Text>
            <Text style={styles.totalValue}>₱{order?.total_amount || '0.00'}</Text>
          </View>

          {/* View Details Toggle */}
          <TouchableOpacity 
            style={styles.viewDetailsButton} 
            onPress={() => setShowDetails(!showDetails)}
          >
            <Text style={styles.viewDetailsText}>View details ({orderLineCount})</Text>
            <ChevronIcon isUp={showDetails} />
          </TouchableOpacity>

          {/* Expandable Details */}
          {showDetails && (
            <>
              {/* Subtotal */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Subtotal</Text>
                <Text style={styles.detailValue}>₱{subtotal.toFixed(2)}</Text>
              </View>

              {/* Delivery Fee */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Delivery fee</Text>
                <Text style={styles.detailValue}>₱{deliveryFee.toFixed(2)}</Text>
              </View>

              {/* Platform Fee */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Platform fee</Text>
                <Text style={styles.detailValue}>₱{platformFee.toFixed(2)}</Text>
              </View>

              {/* Separator */}
              <View style={styles.separator} />

              {/* Total (repeated in expanded view) */}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total (incl. fees and tax)</Text>
                <Text style={styles.totalValue}>₱{order?.total_amount || '0.00'}</Text>
              </View>

              {/* Separator */}
              <View style={styles.separator} />

              {/* Paid With */}
              <Text style={styles.paidWithLabel}>Paid with</Text>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentMethod}>COD</Text>
                <Text style={styles.paymentAmount}>₱{order?.total_amount || '0.00'}</Text>
              </View>
            </>
          )}
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
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#F43332',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  content: {
    flex: 1,
  },
  successContainer: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    margin: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
    textAlign: 'right',
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F43332',
    width: 40,
  },
  itemName: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  errorText: {
    fontSize: 14,
    color: '#F43332',
    textAlign: 'center',
    padding: 20,
  },
});

export default OrderTracking;

