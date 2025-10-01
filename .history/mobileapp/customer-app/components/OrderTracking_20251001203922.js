import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

const OrderTracking = ({ order, restaurant, cartItems, user, onBack, address }) => {
  const [showDetails, setShowDetails] = useState(false);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

  // Animate the first progress bar
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
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.content} 
        showsVerticalScrollIndicator={false}
      >
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
          {/* First bar with animation */}
          <View style={styles.progressBarWrapper}>
            <View style={styles.progressBar} />
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
          </View>
          {/* Other bars (grey) */}
          <View style={styles.progressBar} />
          <View style={styles.progressBar} />
          <View style={styles.progressBar} />
        </View>

        {/* Subtitle 2 - Fun Fact */}
        <Text style={styles.subtitle2}>
          <Text style={styles.funFactBold}>Fun Fact:</Text> Did you know that{' '}
          <Text style={styles.highlightedText}>Soti Delivery</Text> is the First major tech breakthrough in Marawi, 
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
          <View style={styles.detailRowNoBorder}>
            <Text style={styles.detailLabel}>Delivery address</Text>
            <Text style={styles.detailValue}>{address?.street || 'Not set'}</Text>
          </View>

          {/* Total */}
          <View style={styles.totalRowNoBorder}>
            <Text style={styles.totalLabel}>Total (incl. fees and tax)</Text>
            <Text style={styles.totalValue}>₱{order?.total_amount || '0.00'}</Text>
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
                <Text style={styles.paymentMethod}>COD</Text>
                <Text style={styles.paymentAmount}>₱{order?.total_amount || '0.00'}</Text>
              </View>
            </View>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  statusImage: {
    width: 200,
    height: 200,
  },
  subtitle1: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 4,
  },
  title1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 40,
    marginBottom: 14,
  },
  progressBarWrapper: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  progressBarActive: {
    position: 'absolute',
    width: 60,
    height: 4,
    backgroundColor: '#F43332',
    borderRadius: 2,
    shadowColor: '#F43332',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  subtitle2: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'justify',
    paddingHorizontal: 30,
    lineHeight: 15,
    marginBottom: 30,
    fontStyle: 'italic',
  },
  funFactBold: {
    fontWeight: 'bold',
    color: '#F43332',
  },
  highlightedText: {
    color: '#F43332',
  },
  orderDetailsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 12,
    padding: 20,
  },
  orderDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailRowNoBorder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    flex: 1,
    textAlign: 'right',
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  totalRowNoBorder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#F43332',
    fontWeight: '600',
  },
  expandedDetails: {
    backgroundColor: '#F8F8F8',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    marginBottom: -20,
    paddingBottom: 20,
  },
  detailRowExpanded: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  totalRowExpanded: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  paidWithLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  paymentMethod: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
});

export default OrderTracking;

