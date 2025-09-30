import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { apiService } from '../services/api';

const { width } = Dimensions.get('window');

const Cart = ({ restaurant, cartItems, onBack, user }) => {
  const [items, setItems] = useState(cartItems || []);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Calculate totals
  const subtotal = items.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);
  const deliveryFee = 39.00;
  const serviceFee = 9.00;
  const vat = 8.00;
  const total = subtotal + deliveryFee + serviceFee + vat;

  // Fetch suggested products
  useEffect(() => {
    if (restaurant?.id) {
      fetchSuggestedProducts();
    }
  }, [restaurant?.id]);

  const fetchSuggestedProducts = async () => {
    try {
      setLoading(true);
      const result = await apiService.getRestaurantProducts(restaurant.id);
      if (result.success) {
        // Filter out items already in cart
        const cartProductIds = items.map(item => item.product_id);
        const suggested = result.products.filter(product => !cartProductIds.includes(product.id));
        setSuggestedProducts(suggested.slice(0, 5)); // Limit to 5 suggestions
      }
    } catch (error) {
      console.log('Error fetching suggested products:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or less
      setItems(items.filter(item => item.product_id !== productId));
    } else {
      // Update quantity
      setItems(items.map(item => 
        item.product_id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const removeItem = async (productId) => {
    try {
      const result = await apiService.removeFromCart(user.id, productId);
      if (result.success) {
        // Remove from local cart
        setItems(items.filter(item => item.product_id !== productId));
        console.log('Item removed from cart:', result.message);
      } else {
        console.log('Failed to remove from cart:', result.error);
      }
    } catch (error) {
      console.log('Error removing from cart:', error);
    }
  };

  const addSuggestedProduct = async (product) => {
    try {
      const result = await apiService.addToCart(user.id, product.id, 1);
      if (result.success) {
        // Add to local cart
        const existingItemIndex = items.findIndex(item => item.product_id === product.id);
        let updatedItems;
        if (existingItemIndex > -1) {
          updatedItems = [...items];
          updatedItems[existingItemIndex].quantity += 1;
        } else {
          updatedItems = [...items, {
            product_id: product.id,
            product_name: product.name,
            quantity: 1,
            price: product.price,
            product_picture: product.product_picture
          }];
        }
        setItems(updatedItems);
        
        // Update suggested products to remove the added item
        const updatedSuggestedProducts = suggestedProducts.filter(suggestedProduct => suggestedProduct.id !== product.id);
        setSuggestedProducts(updatedSuggestedProducts);
      }
    } catch (error) {
      console.log('Error adding suggested product:', error);
    }
  };

  // Icons
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

  const MinusIcon = () => (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12H19"
        stroke="#666666"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const PlusIcon = () => (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5V19M5 12H19"
        stroke="#666666"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const WhitePlusIcon = () => (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5V19M5 12H19"
        stroke="rgba(0, 0, 0, 0.6)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const DeleteIcon = () => (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
        stroke="#FF4444"
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
        <TouchableOpacity style={styles.closeButton} onPress={onBack}>
          <CloseIcon />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Cart</Text>
          <Text style={styles.subtitle}>
            {restaurant?.name || 'Restaurant Name'} — {restaurant?.barangay || 'Barangay'}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressLineContainer}>
          <View style={styles.progressLine}>
            <View style={styles.progressLineActive} />
            <View style={styles.progressLineInactive} />
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
            <View style={[styles.progressStepIcon, styles.progressStepIconInactive]}>
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
        {/* Delivery Estimate */}
        <View style={styles.deliveryContainer}>
          <View style={styles.deliveryContent}>
            <Image 
              source={require('../assets/delivery2.png')} 
              style={styles.deliveryIcon} 
              resizeMode="contain"
            />
            <View style={styles.deliveryTextContainer}>
              <Text style={styles.deliveryLabel}>Estimated Delivery</Text>
              <Text style={styles.deliveryTime}>Standard (30–60 mins)</Text>
              <TouchableOpacity style={styles.changeButton}>
                <Text style={styles.changeButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Cart Items */}
        <View style={styles.cartItemsContainer}>
          {items.map((item, index) => (
            <View key={item.product_id || index}>
              <View style={styles.cartItem}>
                <View style={styles.cartItemImageContainer}>
                  {item.product_picture ? (
                    <Image 
                      source={{ uri: item.product_picture }} 
                      style={styles.cartItemImage} 
                      resizeMode="cover"
                    />
                  ) : (
                    <Image 
                      source={require('../assets/mock-product.jpg')} 
                      style={styles.cartItemImage} 
                      resizeMode="cover"
                    />
                  )}
                </View>
                
                <View style={styles.cartItemContent}>
                  <Text style={styles.cartItemName}>{item.product_name}</Text>
                  
                  <View style={styles.quantityContainer}>
                    <View style={styles.quantityControl}>
                      <TouchableOpacity 
                        style={styles.quantityMinus}
                        onPress={() => {
                          if (item.quantity === 1) {
                            removeItem(item.product_id);
                          } else {
                            updateQuantity(item.product_id, item.quantity - 1);
                          }
                        }}
                      >
                        {item.quantity === 1 ? <DeleteIcon /> : <MinusIcon />}
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                      <TouchableOpacity 
                        style={styles.quantityPlus}
                        onPress={() => updateQuantity(item.product_id, item.quantity + 1)}
                      >
                        <PlusIcon />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                
                <Text style={styles.cartItemPrice}>₱{(parseFloat(item.price) * item.quantity).toFixed(2)}</Text>
              </View>
              <View style={styles.separator} />
            </View>
          ))}
          
          {/* Add More Items Button */}
          <TouchableOpacity style={styles.addMoreButton}>
            <Text style={styles.addMoreText}>+ Add more items</Text>
          </TouchableOpacity>
        </View>

        {/* Suggested Products */}
        {suggestedProducts.length > 0 && (
          <View style={styles.suggestedContainer}>
            <Text style={styles.suggestedTitle}>Popular with your order</Text>
            <Text style={styles.suggestedSubtitle}>Other customers also bought these</Text>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.suggestedScroll}
            >
              {suggestedProducts.map((product, index) => (
                <TouchableOpacity 
                  key={product.id || index} 
                  style={styles.suggestedProductCard}
                  onPress={() => addSuggestedProduct(product)}
                >
                  <View style={styles.suggestedProductImageContainer}>
                    {product.product_picture ? (
                      <Image 
                        source={{ uri: product.product_picture }} 
                        style={styles.suggestedProductImage} 
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.suggestedProductImage} />
                    )}
                    <TouchableOpacity 
                      style={styles.suggestedPlusButton}
                      onPress={() => addSuggestedProduct(product)}
                    >
                      <WhitePlusIcon />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.suggestedProductInfo}>
                    <Text style={styles.suggestedProductName}>{product.name}</Text>
                    <Text style={styles.suggestedProductPrice}>₱{product.price}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Subtotal & Fees */}
        <View style={styles.feesContainer}>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Subtotal</Text>
            <Text style={styles.feeValue}>₱{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeSubLabel}>Standard delivery</Text>
            <Text style={styles.feeSubValue}>₱{deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeSubLabel}>Service fee</Text>
            <Text style={styles.feeSubValue}>₱{serviceFee.toFixed(2)}</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeSubLabel}>VAT</Text>
            <Text style={styles.feeSubValue}>₱{vat.toFixed(2)}</Text>
          </View>
          
          <View style={styles.voucherContainer}>
            <Image 
              source={require('../assets/voucher.png')} 
              style={styles.voucherIcon} 
              resizeMode="contain"
            />
            <Text style={styles.voucherText}>Apply a voucher</Text>
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
        <TouchableOpacity style={styles.checkoutButton}>
          <Text style={styles.checkoutButtonText}>Review payment and address</Text>
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
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 0,
  },
  headerSpacer: {
    width: 40,
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 0,
    paddingHorizontal: 0,
  },

  // Progress Bar
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  progressLineContainer: {
    position: 'relative',
    height: 32,
    marginBottom: 20,
    justifyContent: 'center',
  },
  progressLine: {
    height: 2,
    backgroundColor: '#E0E0E0',
    position: 'relative',
  },
  progressLineActive: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '50%',
    height: 2,
    backgroundColor: '#333333',
  },
  progressLineInactive: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '50%',
    height: 2,
    backgroundColor: '#E0E0E0',
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
    transform: [{ translateX: -16 }], // Center the icon on the line
  },
  progressStepIcon2: {
    left: '50%',
    transform: [{ translateX: -16 }], // Center the icon on the line
  },
  progressStepIcon3: {
    right: 30,
    transform: [{ translateX: 16 }], // Center the icon on the line
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStep: {
    alignItems: 'center',
  },
  progressStepLabel1: {
    alignItems: 'center',
    left: 15,
    // Add custom positioning here
  },
  progressStepLabel2: {
    alignItems: 'center',
    left: 10,
    // Add custom positioning here
  },
  progressStepLabel3: {
    alignItems: 'center',
    right: 3,
    // Add custom positioning here
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
  progressStepIconInactive: {
    backgroundColor: '#E0E0E0',
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

  // Delivery Estimate
  deliveryContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
   
 
    paddingVertical: 10,
    marginHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  deliveryLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 0,
  },
  deliveryTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  changeButton: {
    marginTop: 0,
    alignSelf: 'flex-start',
  },
  changeButtonText: {
    fontSize: 12,
    color: '#F43332',
    fontWeight: '600',
  },
  deliveryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deliveryTextContainer: {
    flex: 1,
  },
  deliveryIcon: {
    width: 50,
    height: 50,
    marginRight: 16,
  },

  // Cart Items
  cartItemsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,

    marginHorizontal: 20,
    borderRadius: 8,
    paddingVertical: 10,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  cartItemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 16,
    overflow: 'hidden',
  },
  cartItemImage: {
    width: '100%',
    height: '100%',
  },
  cartItemContent: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quantityMinus: {
    padding: 4,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  quantityPlus: {
    padding: 4,
  },
  cartItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F43332',
    marginLeft: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 0,
  },

  // Add More Button
  addMoreButton: {
    paddingVertical: 6,
    alignItems: 'flex-start',
    marginTop: 10,
  },
  addMoreText: {
    fontSize: 14,
    color: '#666666',
  },

  // Suggested Products
  suggestedContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 8,
    paddingVertical: 10,
  },
  suggestedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  suggestedSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  suggestedScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  suggestedProductCard: {
    width: 140,
    marginRight: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  suggestedProductImageContainer: {
    position: 'relative',
    height: 100,
    borderRadius: 12,
  },
  suggestedProductImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#c0b8b8',
    borderRadius: 12,
  },
  suggestedPlusButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestedProductInfo: {
    padding: 12,
  },
  suggestedProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  suggestedProductPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F43332',
  },

  // Fees Container
  feesContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 8,
    paddingVertical: 20,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feeLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  feeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  feeSubLabel: {
    fontSize: 14,
    color: '#666666',
  },
  feeSubValue: {
    fontSize: 14,
    color: '#666666',
  },
  voucherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  voucherIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  voucherText: {
    fontSize: 14,
    color: '#F43332',
    fontWeight: 'bold',
  },

  // Bottom Padding
  bottomPadding: {
    height: 180, // Space for sticky total
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
  checkoutButton: {
    backgroundColor: '#F43332',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default Cart;
