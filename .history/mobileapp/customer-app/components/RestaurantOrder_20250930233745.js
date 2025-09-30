import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, TextInput, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

const RestaurantOrder = ({ restaurant, onBack }) => {
  const [activeCategory, setActiveCategory] = useState('Popular');
  const [searchText, setSearchText] = useState('');

  // Mock data for products
  const products = [
    { id: 1, name: 'Chicken Burger', price: '₱120', image: require('../assets/mock-product.jpg') },
    { id: 2, name: 'Beef Steak', price: '₱250', image: require('../assets/mock-product.jpg') },
    { id: 3, name: 'Fish Fillet', price: '₱180', image: require('../assets/mock-product.jpg') },
    { id: 4, name: 'Pasta Carbonara', price: '₱150', image: require('../assets/mock-product.jpg') },
    { id: 5, name: 'Caesar Salad', price: '₱100', image: require('../assets/mock-product.jpg') },
    { id: 6, name: 'Chocolate Cake', price: '₱80', image: require('../assets/mock-product.jpg') },
  ];

  const categories = ['Popular', 'All', 'Appetizers', 'Main Course', 'Desserts'];

  const SearchIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z"
        stroke="#999"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const BackIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19L5 12L12 5"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const HeartIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.5783 8.50903 2.9987 7.05 2.9987C5.59096 2.9987 4.19169 3.5783 3.16 4.61C2.1283 5.6417 1.5487 7.04097 1.5487 8.5C1.5487 9.95903 2.1283 11.3583 3.16 12.39L12 21.23L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6053C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.06211 22.0329 6.39467C21.7563 5.72723 21.351 5.1208 20.84 4.61Z"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const StarIcon = () => (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        fill="#FFD700"
        stroke="#FFD700"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const PlusIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5V19M5 12H19"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  return (
    <View style={styles.container}>
      {/* Restaurant Header */}
      <View style={styles.headerContainer}>
        {restaurant?.profile_picture ? (
          <Image 
            source={{ uri: restaurant.profile_picture }} 
            style={styles.headerImage} 
            resizeMode="cover"
          />
        ) : (
          <View style={styles.headerImage} />
        )}
        
        {/* Floating Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <BackIcon />
        </TouchableOpacity>
        
        {/* Floating Heart Icon */}
        <TouchableOpacity style={styles.heartButton}>
          <HeartIcon />
        </TouchableOpacity>

        {/* Restaurant Info - Inside Image */}
        <View style={styles.restaurantInfoOverlay}>
          <Text style={styles.restaurantNameOverlay}>
            {restaurant?.name || 'Restaurant Name'} — {restaurant?.barangay || 'Barangay'}
          </Text>
          
          {/* Rating Stars */}
          <View style={styles.ratingContainerOverlay}>
            <StarIcon />
            <StarIcon />
            <StarIcon />
            <StarIcon />
            <StarIcon />
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>

        {/* Search Field */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <SearchIcon />
            <TextInput
              style={styles.searchInput}
              placeholder="Search menu"
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

        {/* Category Navigation Tabs */}
        <View style={styles.categoryTabsContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryTabs}
          >
            {categories.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={styles.categoryTab}
                onPress={() => setActiveCategory(category)}
              >
                <Text style={[
                  styles.categoryTabText,
                  activeCategory === category && styles.categoryTabTextActive
                ]}>
                  {category}
                </Text>
                {activeCategory === category && (
                  <View style={styles.categoryTabUnderline} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Category Section */}
        <View style={styles.categorySection}>
          <View style={styles.categoryTitleContainer}>
            <Image 
              source={require('../assets/popular.png')} 
              style={styles.categoryIcon} 
              resizeMode="contain"
            />
            <Text style={styles.categoryTitle}>Popular</Text>
          </View>
          <Text style={styles.categorySubtitle}>Most ordered right now.</Text>
        </View>

        {/* Product Cards Grid */}
        <View style={styles.productsGrid}>
          {products.map((product, index) => (
            <TouchableOpacity key={product.id} style={styles.productCard}>
              <View style={styles.productImageContainer}>
                <View style={styles.productImage} />
                <TouchableOpacity style={styles.plusButton}>
                  <PlusIcon />
                </TouchableOpacity>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>{product.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // Header
  headerContainer: {
    position: 'relative',
    height: 250,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Scroll Container
  scrollContainer: {
    flex: 1,
  },

  // Restaurant Info Overlay (Inside Image)
  restaurantInfoOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  restaurantNameOverlay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  ratingContainerOverlay: {
    flexDirection: 'row',
    gap: 4,
  },

  // Search Field
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
    borderRadius: 40,
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
    marginTop: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },

  // Category Tabs
  categoryTabsContainer: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  categoryTabs: {
    paddingHorizontal: 20,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 16,
    position: 'relative',
  },
  categoryTabText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  categoryTabTextActive: {
    color: '#F43332',
    fontWeight: '600',
  },
  categoryTabUnderline: {
    position: 'absolute',
    bottom: -1,
    left: 16,
    right: 16,
    height: 3,
    backgroundColor: '#F43332',
    borderRadius: 1,
    zIndex: 10,
  },

  // Category Section
  categorySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  categorySubtitle: {
    fontSize: 14,
    color: '#666666',
  },

  // Products Grid
  productsGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: (width - 60) / 2, // 2 columns with 20px padding on each side + 20px gap
    marginBottom: 20,
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
  productImageContainer: {
    position: 'relative',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  productImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#4CAF50', // Mock green background
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  plusButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F43332',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F43332',
  },

  // Bottom Padding
  bottomPadding: {
    height: 20,
  },
});

export default RestaurantOrder;
