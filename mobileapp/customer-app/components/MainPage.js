import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, TextInput, Dimensions, Animated, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { apiService } from '../services/api';
import RestaurantOrder from './RestaurantOrder';
import CustomerProfile from './CustomerProfile';
import Orders from './Orders';
import Support from './Support';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;

const MainPage = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('restaurants');
  const [activeNav, setActiveNav] = useState('home');
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ products: [], restaurants: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef(null);
  // Animated values for search field transition
  // Initial: -30 (overlapping hero), Scrolled: 30 (with top padding)
  const searchTranslateY = useRef(new Animated.Value(-30)).current;

  // Mock data for categories
  const categories = [
    { name: 'Sandwich', icon: require('../assets/sandwich.png') },
    { name: 'Pizza', icon: require('../assets/pizza.png') },
    { name: 'Salad', icon: require('../assets/salad.png') },
    { name: 'Shawarma', icon: require('../assets/shawarma.png') },
    { name: 'Coffee', icon: require('../assets/coffee.png') },
    { name: 'Chicken', icon: require('../assets/chicken.png') },
    { name: 'Meal', icon: require('../assets/meal.png') },
  ];

  // Fetch restaurants on component mount
  useEffect(() => {
    fetchRestaurants();
  }, []);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Debug: Monitor selectedRestaurant changes
  useEffect(() => {
    if (selectedRestaurant) {
      console.log('🎯 selectedRestaurant changed:', selectedRestaurant);
      console.log('🎯 Restaurant ID:', selectedRestaurant.id);
      console.log('🎯 Restaurant Name:', selectedRestaurant.name);
    }
  }, [selectedRestaurant]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const result = await apiService.getRestaurants();
      if (result.success) {
        setRestaurants(result.restaurants);
      } else {
        console.log('Failed to fetch restaurants:', result.error);
        // Keep empty array on error
        setRestaurants([]);
      }
    } catch (error) {
      console.log('Error fetching restaurants:', error);
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantPress = (restaurant) => {
    setSelectedRestaurant(restaurant);
  };

  const handleBackFromRestaurant = () => {
    setSelectedRestaurant(null);
  };

  // Handle search input change with debouncing
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!text.trim()) {
      setSearchResults({ products: [], restaurants: [] });
      setShowSearchResults(false);
      setIsSearching(false);
      return;
    }

    // Only search if user typed at least 2 characters (optimization)
    if (text.trim().length < 2) {
      setSearchResults({ products: [], restaurants: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    // Debounce search (wait 400ms after user stops typing for better backend optimization)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await apiService.searchProductsAndRestaurants(text);
        if (result.success) {
          setSearchResults({
            products: result.products || [],
            restaurants: result.restaurants || [],
          });
          setShowSearchResults(true);
        }
      } catch (error) {
        console.log('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 400); // Increased from 300ms to 400ms for better optimization
  };

  // Handle product selection - navigate to restaurant page
  const handleProductSelect = async (product) => {
    console.log('🎯 ========== PRODUCT SELECTED ==========');
    console.log('🔍 Product selected:', product);
    console.log('🔍 Product restaurant_id:', product.restaurant_id);
    console.log('🔍 Product restaurant_id type:', typeof product.restaurant_id);
    console.log('🔍 Loaded restaurants count:', restaurants.length);
    console.log('🔍 Loaded restaurant IDs:', restaurants.map(r => ({ id: r.id, type: typeof r.id })));
    
    // Close search results immediately
    setShowSearchResults(false);
    
    try {
      // Normalize restaurant_id to number for comparison
      const restaurantId = typeof product.restaurant_id === 'string' ? parseInt(product.restaurant_id, 10) : product.restaurant_id;
      console.log('🔍 Normalized restaurant_id:', restaurantId);
      
      // Try to find in loaded restaurants first
      let restaurantData = restaurants.find(r => r.id === restaurantId);
      
      console.log('🔍 Found in loaded restaurants:', restaurantData ? 'YES' : 'NO');
      
      // If not found in loaded restaurants, fetch all restaurants and find it
      if (!restaurantData) {
        console.log('⚠️ Restaurant not found in loaded restaurants, fetching all restaurants...');
        try {
          const result = await apiService.getRestaurants();
          if (result.success && result.restaurants) {
            console.log('📋 Fetched restaurants:', result.restaurants.map(r => ({ id: r.id, name: r.name })));
            restaurantData = result.restaurants.find(r => r.id === restaurantId);
            console.log('🔍 Found after fetching:', restaurantData ? 'YES' : 'NO');
          }
        } catch (error) {
          console.log('❌ Error fetching restaurants:', error);
        }
      }
      
      // If still not found, create from product data as fallback
      if (!restaurantData) {
        console.log('⚠️ Restaurant not found anywhere, creating from product data...');
        restaurantData = {
          id: restaurantId,
          name: product.restaurant_name,
          address: '',
          barangay: '',
          street: '',
          restaurant_type: 'Unknown',
          phone: '',
          profile_picture: null,
        };
        console.log('📝 Created fallback restaurant data:', restaurantData);
      }
      
      console.log('✅ Final restaurant data:', restaurantData);
      console.log('✅ Restaurant ID:', restaurantData?.id);
      console.log('✅ Restaurant ID type:', typeof restaurantData?.id);
    
      // Always try to navigate
      // Reset activeNav to 'home' to ensure proper navigation
      setActiveNav('home');
      setSearchQuery('');
      setSelectedRestaurant(restaurantData);
      console.log('✅ Navigation triggered with restaurant:', restaurantData?.name);
    } catch (error) {
      console.error('❌ Error in handleProductSelect:', error);
    }
  };

  // Handle restaurant selection from search
  const handleRestaurantSelectFromSearch = (restaurant) => {
    console.log('🏪 ========== RESTAURANT SELECTED ==========');
    console.log('🏪 Restaurant selected from search:', restaurant);
    console.log('🏪 Restaurant data type check:', typeof restaurant);
    console.log('🏪 Restaurant ID:', restaurant?.id);
    
    // Close search results immediately
    setShowSearchResults(false);
    
    // Reset activeNav to 'home' to ensure proper navigation
    setActiveNav('home');
    setSearchQuery('');
    setSelectedRestaurant(restaurant);
    console.log('✅ Navigating to restaurant:', restaurant?.name);
  };

  // Handle scroll to detect when search becomes sticky
  const handleScroll = (event) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const threshold = 320;
    
    // Update state
    const shouldBeScrolled = scrollY > threshold;
    if (shouldBeScrolled !== isScrolled) {
      setIsScrolled(shouldBeScrolled);
      
      // Animate translateY to adjust position smoothly
      // When scrolled: move to 30px (with top padding, fully visible)
      // When not scrolled: stay at -30px (overlapping hero)
      Animated.timing(searchTranslateY, {
        toValue: shouldBeScrolled ? 60 : -30,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

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

  // Show RestaurantOrder page if a restaurant is selected (only if activeNav is 'home')
  // This prevents Orders/Profile pages from blocking RestaurantOrder
  if (selectedRestaurant && activeNav === 'home') {
    console.log('🎯 Rendering RestaurantOrder for:', selectedRestaurant?.name);
    return (
      <RestaurantOrder 
        restaurant={selectedRestaurant} 
        onBack={handleBackFromRestaurant}
        user={user}
      />
    );
  }

  // Show Orders page when orders tab is active
  if (activeNav === 'orders') {
    return (
      <View style={styles.mainContainer}>
        <Orders user={user} onBack={() => setActiveNav('home')} />
        {/* Sticky Bottom Navigation */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => setActiveNav('home')}
          >
            <View style={[styles.navIconContainer, activeNav === 'home' && styles.navIconActive]}>
              <Image source={require('../assets/home.png')} style={styles.navIcon} resizeMode="contain" />
            </View>
            <Text style={[styles.navLabel, activeNav === 'home' && styles.navLabelActive]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveNav('orders')}>
            <View style={[styles.navIconContainer, activeNav === 'orders' && styles.navIconActive]}>
              <Image source={require('../assets/orders.png')} style={styles.navIcon} resizeMode="contain" />
            </View>
            <Text style={[styles.navLabel, activeNav === 'orders' && styles.navLabelActive]}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveNav('support')}>
            <View style={[styles.navIconContainer, activeNav === 'support' && styles.navIconActive]}>
              <Image source={require('../assets/support.png')} style={styles.navIcon} resizeMode="contain" />
            </View>
            <Text style={[styles.navLabel, activeNav === 'support' && styles.navLabelActive]}>Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveNav('profile')}>
            <View style={[styles.navIconContainer, activeNav === 'profile' && styles.navIconActive]}>
              <Image source={require('../assets/profile.png')} style={styles.navIcon} resizeMode="contain" />
            </View>
            <Text style={[styles.navLabel, activeNav === 'profile' && styles.navLabelActive]}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show Profile page when profile tab is active
  if (activeNav === 'profile') {
    return (
      <View style={styles.mainContainer}>
        <CustomerProfile user={user} onLogout={onLogout} onBackHome={() => setActiveNav('home')} />
        {/* Sticky Bottom Navigation */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => setActiveNav('home')}
          >
            <View style={[styles.navIconContainer, activeNav === 'home' && styles.navIconActive]}>
              <Image source={require('../assets/home.png')} style={styles.navIcon} resizeMode="contain" />
            </View>
            <Text style={[styles.navLabel, activeNav === 'home' && styles.navLabelActive]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveNav('orders')}>
            <View style={[styles.navIconContainer, activeNav === 'orders' && styles.navIconActive]}>
              <Image source={require('../assets/orders.png')} style={styles.navIcon} resizeMode="contain" />
            </View>
            <Text style={[styles.navLabel, activeNav === 'orders' && styles.navLabelActive]}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveNav('support')}>
            <View style={[styles.navIconContainer, activeNav === 'support' && styles.navIconActive]}>
              <Image source={require('../assets/support.png')} style={styles.navIcon} resizeMode="contain" />
            </View>
            <Text style={[styles.navLabel, activeNav === 'support' && styles.navLabelActive]}>Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveNav('profile')}>
            <View style={[styles.navIconContainer, activeNav === 'profile' && styles.navIconActive]}>
              <Image source={require('../assets/profile.png')} style={styles.navIcon} resizeMode="contain" />
            </View>
            <Text style={[styles.navLabel, activeNav === 'profile' && styles.navLabelActive]}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show Support page when support tab is active
  if (activeNav === 'support') {
    return (
      <View style={styles.mainContainer}>
        <Support onBack={() => setActiveNav('home')} />
        {/* Sticky Bottom Navigation */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => setActiveNav('home')}
          >
            <View style={[styles.navIconContainer, activeNav === 'home' && styles.navIconActive]}>
              <Image source={require('../assets/home.png')} style={styles.navIcon} resizeMode="contain" />
            </View>
            <Text style={[styles.navLabel, activeNav === 'home' && styles.navLabelActive]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveNav('orders')}>
            <View style={[styles.navIconContainer, activeNav === 'orders' && styles.navIconActive]}>
              <Image source={require('../assets/orders.png')} style={styles.navIcon} resizeMode="contain" />
            </View>
            <Text style={[styles.navLabel, activeNav === 'orders' && styles.navLabelActive]}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveNav('support')}>
            <View style={[styles.navIconContainer, activeNav === 'support' && styles.navIconActive]}>
              <Image source={require('../assets/support.png')} style={styles.navIcon} resizeMode="contain" />
            </View>
            <Text style={[styles.navLabel, activeNav === 'support' && styles.navLabelActive]}>Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveNav('profile')}>
            <View style={[styles.navIconContainer, activeNav === 'profile' && styles.navIconActive]}>
              <Image source={require('../assets/profile.png')} style={styles.navIcon} resizeMode="contain" />
            </View>
            <Text style={[styles.navLabel, activeNav === 'profile' && styles.navLabelActive]}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]} // Make the search container (index 1) sticky
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Hero Image Container */}
        <View style={styles.heroContainer}>
          <Image 
            source={require('../assets/imageHero.webp')} 
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroButtons}>
            <TouchableOpacity 
              style={[styles.heroButton, activeTab === 'restaurants' && styles.heroButtonActive]}
              onPress={() => setActiveTab('restaurants')}
            >
              <Text style={styles.heroButtonText}>Restaurants</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.heroButton, activeTab === 'pharmacies' && styles.heroButtonActive]}
              onPress={() => setActiveTab('pharmacies')}
            >
              <Text style={styles.heroButtonText}>Pharmacies</Text>
            </TouchableOpacity>
          </View>
          {/* Title inside hero image */}
          <View style={styles.heroTitleContainer}>
            <Text style={styles.heroTitleText}>Order your{'\n'}favorite food</Text>
          </View>
          
          {/* Spacer to create overlap effect */}
          <View style={styles.searchSpacer} />
        </View>

        {/* Search Field - Sticky Container with overlap */}
        <View style={styles.searchContainer}>
          <Animated.View style={[
            styles.searchWrapper,
            {
              transform: [{ translateY: searchTranslateY }]
            }
          ]}>
            <View style={styles.searchInputContainer}>
              <SearchIcon />
              <TextInput
                style={styles.searchInput}
                placeholder="Looking for something?"
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={handleSearchChange}
                onFocus={() => {
                  if (searchQuery.trim() && searchResults.products.length === 0 && searchResults.restaurants.length === 0) {
                    setShowSearchResults(false);
                  } else if (searchQuery.trim()) {
                    setShowSearchResults(true);
                  }
                }}
              />
            </View>
          </Animated.View>
          
          {/* Search Results Dropdown */}
          {showSearchResults && (
            <View style={styles.searchResultsContainer}>
              {/* Products Section */}
              {searchResults.products.length > 0 && (
                <View style={styles.searchResultsSection}>
                  <Text style={styles.searchResultsSectionTitle}>Products</Text>
                  {searchResults.products.map((product, index) => (
                    <TouchableOpacity
                      key={`product-${product.id}-${index}`}
                      style={styles.searchResultItem}
                      activeOpacity={0.7}
                      onPress={() => {
                        console.log('🖱️ Product item pressed:', product.name);
                        handleProductSelect(product);
                      }}
                    >
                      <View style={styles.searchResultItemContent}>
                        <Text style={styles.searchResultProductName}>{product.name}</Text>
                        <Text style={styles.searchResultRestaurantLabel}>from {product.restaurant_name}</Text>
                      </View>
                      <Text style={styles.searchResultPrice}>₱{product.price}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {/* Restaurants Section */}
              {searchResults.restaurants.length > 0 && (
                <View style={styles.searchResultsSection}>
                  <Text style={styles.searchResultsSectionTitle}>Restaurants</Text>
                  {searchResults.restaurants.map((restaurant, index) => (
                    <TouchableOpacity
                      key={`restaurant-${restaurant.id}-${index}`}
                      style={styles.searchResultItem}
                      activeOpacity={0.7}
                      onPress={() => {
                        console.log('🖱️ Restaurant item pressed:', restaurant.name);
                        handleRestaurantSelectFromSearch(restaurant);
                      }}
                    >
                      <View style={styles.searchResultItemContent}>
                        <Text style={styles.searchResultRestaurantName}>{restaurant.name}</Text>
                        <Text style={styles.searchResultAddress}>{restaurant.barangay}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {/* No Results */}
              {searchResults.products.length === 0 && searchResults.restaurants.length === 0 && !isSearching && (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No results found</Text>
                </View>
              )}
              
              {/* Loading */}
              {isSearching && (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.loadingText}>Searching...</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Categories Section */}
        <View style={styles.sectionContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
          >
            {categories.map((category, index) => (
              <TouchableOpacity key={index} style={styles.categoryItem}>
                <View style={styles.categoryIconContainer}>
                  <Image source={category.icon} style={styles.categoryIcon} resizeMode="contain" />
                </View>
                <Text style={styles.categoryLabel}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Restaurants Section */}
        <View style={styles.sectionContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading restaurants...</Text>
            </View>
          ) : restaurants.length > 0 ? (
            restaurants.map((restaurant, index) => (
              <TouchableOpacity 
                key={restaurant.id || index} 
                style={styles.restaurantCard}
                onPress={() => handleRestaurantPress(restaurant)}
              >
                <View style={styles.restaurantImageContainer}>
                  {restaurant.profile_picture ? (
                    <Image 
                      source={{ uri: restaurant.profile_picture }} 
                      style={styles.restaurantImage} 
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.restaurantImage} />
                  )}
                  <TouchableOpacity style={styles.heartIcon}>
                    <Text style={styles.heartIconText}>♡</Text>
                  </TouchableOpacity>
                  <View style={styles.barangayOverlay}>
                    <Text style={styles.barangayText}>{restaurant.barangay}</Text>
                  </View>
                </View>
                <View style={styles.restaurantInfo}>
                  <Text style={styles.restaurantName}>{restaurant.name}</Text>
                  <Text style={styles.restaurantAddress}>{restaurant.address}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No restaurants available</Text>
            </View>
          )}
        </View>

        {/* Copyright Footer */}
        <View style={styles.copyrightContainer}>
          <Text style={styles.copyrightText}>© 2025 Soti Delivery. All rights reserved.</Text>
        </View>

        {/* Bottom padding for navigation */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Sticky Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setActiveNav('home')}
        >
          <View style={[styles.navIconContainer, activeNav === 'home' && styles.navIconActive]}>
            <Image source={require('../assets/home.png')} style={styles.navIcon} resizeMode="contain" />
          </View>
          <Text style={[styles.navLabel, activeNav === 'home' && styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setActiveNav('orders')}
        >
          <View style={[styles.navIconContainer, activeNav === 'orders' && styles.navIconActive]}>
            <Image source={require('../assets/orders.png')} style={styles.navIcon} resizeMode="contain" />
          </View>
          <Text style={[styles.navLabel, activeNav === 'orders' && styles.navLabelActive]}>Orders</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setActiveNav('support')}
        >
          <View style={[styles.navIconContainer, activeNav === 'support' && styles.navIconActive]}>
            <Image source={require('../assets/support.png')} style={styles.navIcon} resizeMode="contain" />
          </View>
          <Text style={[styles.navLabel, activeNav === 'support' && styles.navLabelActive]}>Support</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setActiveNav('profile')}
        >
          <View style={[styles.navIconContainer, activeNav === 'profile' && styles.navIconActive]}>
            <Image source={require('../assets/profile.png')} style={styles.navIcon} resizeMode="contain" />
          </View>
          <Text style={[styles.navLabel, activeNav === 'profile' && styles.navLabelActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // Hero Section
  heroContainer: {
    position: 'relative',
    height: isSmallScreen ? height * 0.45 : height * 0.5,
    minHeight: 280,
    maxHeight: 370,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroButtons: {
    position: 'absolute',
    top: isSmallScreen ? 50 : 70,
    left: 20,
    flexDirection: 'row',
    gap: 8,
  },
  heroButton: {
    paddingHorizontal: isSmallScreen ? 12 : 16,
    paddingVertical: isSmallScreen ? 6 : 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  heroButtonActive: {
    backgroundColor: '#F43332',
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 12 : 14,
    fontFamily: 'Nexa-Heavy',
  },
  heroTitleContainer: {
    position: 'absolute',
    bottom: isSmallScreen ? 30 : 50,
    left: 20,
    right: 20,
  },
  heroTitleText: {
    fontSize: isSmallScreen ? 24 : 32,
    fontFamily: 'Nexa-Heavy',
    color: '#FFFFFF',
    lineHeight: isSmallScreen ? 28 : 38,
  },
  // Scroll Container
  scrollContainer: {
    flex: 1,
  },
  // Search Section
  searchSpacer: {
    height: 30, // Half of the search field height to create overlap
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 10,
  },
  searchWrapper: {
    paddingHorizontal: 20,

  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
    borderRadius: 42,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 12,
    
  },
  searchInput: {
    flex: 1,
    fontSize: isSmallScreen ? 14 : 16,
    fontFamily: 'Nexa-ExtraLight',
    color: '#333',
  },
  // Section Styles
  sectionContainer: {
    paddingHorizontal: isSmallScreen ? 15 : 20,
    marginBottom: isSmallScreen ? 25 : 40,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Nexa-Heavy',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Nexa-Heavy',
    color: '#F43332',
  },
  // Categories
  categoriesScroll: {
    marginHorizontal: isSmallScreen ? -15 : -20,
    paddingHorizontal: isSmallScreen ? 15 : 20,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: isSmallScreen ? 15 : 20,
    width: isSmallScreen ? 60 : 70,
  },
  categoryIconContainer: {
    width: isSmallScreen ? 50 : 60,
    height: isSmallScreen ? 50 : 60,
    borderRadius: 20,
    marginBottom: 8,
    overflow: 'hidden',
  },
  categoryIcon: {
    width: isSmallScreen ? 50 : 60,
    height: isSmallScreen ? 50 : 60,
    resizeMode: 'cover',
  },
  categoryLabel: {
    fontSize: isSmallScreen ? 11 : 12,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666',
    textAlign: 'center',
  },
  // Restaurants
  restaurantCard: {
    backgroundColor: '#F4F4F4',
    borderRadius: 16,
    marginBottom: isSmallScreen ? 12 : 16,
    bottom: isSmallScreen ? 15 : 20,
   
  },
  restaurantImageContainer: {
    position: 'relative',
    height: isSmallScreen ? 120 : 150,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fde4e4',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  heartIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: isSmallScreen ? 28 : 32,
    height: isSmallScreen ? 28 : 32,
    borderRadius: isSmallScreen ? 14 : 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIconText: {
    fontSize: isSmallScreen ? 14 : 16,
    color: '#F43332',
  },
  barangayOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  barangayText: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 10 : 12,
    fontFamily: 'Nexa-Heavy',
  },
  restaurantInfo: {
    padding: isSmallScreen ? 12 : 16,
  },
  restaurantName: {
    fontSize: isSmallScreen ? 14 : 16,
    fontFamily: 'Nexa-Heavy',
    color: '#333',
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: isSmallScreen ? 12 : 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666',
  },
  // Bottom Navigation
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: isSmallScreen ? 8 : 12,
    paddingHorizontal: isSmallScreen ? 10 : 20,
    paddingBottom: Platform.OS === 'android' ? (isSmallScreen ? 8 : 12) + 10 : (isSmallScreen ? 8 : 12),
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
    width: isSmallScreen ? 36 : 40,
    height: isSmallScreen ? 36 : 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  navIconActive: {
    backgroundColor: 'rgba(244, 51, 50, 0.1)',
    borderRadius: 10,
  },
  navIcon: {
    width: isSmallScreen ? 20 : 24,
    height: isSmallScreen ? 20 : 24,
  },
  navLabel: {
    fontSize: isSmallScreen ? 10 : 12,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666',
  },
  navLabelActive: {
    color: '#F43332',
    fontFamily: 'Nexa-Heavy',
  },
  // Bottom Padding
  bottomPadding: {
    height: isSmallScreen ? 80 : 100,
  },
  // Loading and Empty States
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: isSmallScreen ? 14 : 16,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: isSmallScreen ? 14 : 16,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666',
  },
  // Search Results Dropdown
  searchResultsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 0,
    marginHorizontal: isSmallScreen ? 15 : 20,
    maxHeight: isSmallScreen ? 300 : 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchResultsSection: {
    paddingVertical: 8,
  },
  searchResultsSectionTitle: {
    fontSize: isSmallScreen ? 12 : 14,
    fontFamily: 'Nexa-Heavy',
    color: '#666',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F8F8',
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: isSmallScreen ? 8 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchResultItemContent: {
    flex: 1,
  },
  searchResultProductName: {
    fontSize: isSmallScreen ? 13 : 15,
    fontFamily: 'Nexa-Heavy',
    color: '#333',
    marginBottom: 4,
  },
  searchResultRestaurantLabel: {
    fontSize: isSmallScreen ? 11 : 13,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666',
  },
  searchResultRestaurantName: {
    fontSize: isSmallScreen ? 13 : 15,
    fontFamily: 'Nexa-Heavy',
    color: '#333',
    marginBottom: 4,
  },
  searchResultAddress: {
    fontSize: isSmallScreen ? 11 : 13,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666',
  },
  searchResultPrice: {
    fontSize: isSmallScreen ? 13 : 15,
    fontFamily: 'Nexa-Heavy',
    color: '#F43332',
  },
  noResultsContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: isSmallScreen ? 12 : 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#999',
  },
  // Copyright Footer
  copyrightContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  copyrightText: {
    fontSize: isSmallScreen ? 11 : 13,
    fontFamily: 'Nexa-ExtraLight',
    color: '#999',
    textAlign: 'center',
  },
});

export default MainPage;
