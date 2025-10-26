import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, TextInput, Dimensions, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { apiService } from '../services/api';
import RestaurantOrder from './RestaurantOrder';
import CustomerProfile from './CustomerProfile';
import Orders from './Orders';

const { width } = Dimensions.get('window');

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
    // Find the restaurant for this product
    const restaurantData = restaurants.find(r => r.id === product.restaurant_id);
    
    if (restaurantData) {
      // Close search results
      setShowSearchResults(false);
      setSearchQuery('');
      // Navigate to restaurant page
      setSelectedRestaurant(restaurantData);
    }
  };

  // Handle restaurant selection from search
  const handleRestaurantSelectFromSearch = (restaurant) => {
    setShowSearchResults(false);
    setSearchQuery('');
    setSelectedRestaurant(restaurant);
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

  // Show RestaurantOrder page if a restaurant is selected
  if (selectedRestaurant) {
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
                onBlur={() => {
                  // Delay hiding to allow selection
                  setTimeout(() => setShowSearchResults(false), 200);
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
                      onPress={() => handleProductSelect(product)}
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
                      onPress={() => handleRestaurantSelectFromSearch(restaurant)}
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
    height: 370,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroButtons: {
    position: 'absolute',
    top: 70,
    left: 20,
    flexDirection: 'row',
    gap: 8,
  },
  heroButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  heroButtonActive: {
    backgroundColor: '#F43332',
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Nexa-Heavy',
  },
  heroTitleContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
  },
  heroTitleText: {
    fontSize: 32,
    fontFamily: 'Nexa-Heavy',
    color: '#FFFFFF',
    lineHeight: 38,
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
    fontSize: 16,
    fontFamily: 'Nexa-ExtraLight',
    color: '#333',
  },
  // Section Styles
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 40,
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
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 70,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    marginBottom: 8,
    overflow: 'hidden',
  },
  categoryIcon: {
    width: 60,
    height: 60,
    resizeMode: 'cover',
  },
  categoryLabel: {
    fontSize: 12,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666',
    textAlign: 'center',
  },
  // Restaurants
  restaurantCard: {
    backgroundColor: '#F4F4F4',
    borderRadius: 16,
    marginBottom: 16,
    bottom: 20,
   
  },
  restaurantImageContainer: {
    position: 'relative',
    height: 150,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIconText: {
    fontSize: 16,
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
    fontSize: 12,
    fontFamily: 'Nexa-Heavy',
  },
  restaurantInfo: {
    padding: 16,
  },
  restaurantName: {
    fontSize: 16,
    fontFamily: 'Nexa-Heavy',
    color: '#333',
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666',
  },
  // Bottom Navigation
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
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
    width: 40,
    height: 40,
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
    width: 24,
    height: 24,
  },
  navLabel: {
    fontSize: 12,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666',
  },
  navLabelActive: {
    color: '#F43332',
    fontFamily: 'Nexa-Heavy',
  },
  // Bottom Padding
  bottomPadding: {
    height: 20,
  },
  // Loading and Empty States
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666',
  },
  // Search Results Dropdown
  searchResultsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 10,
    marginHorizontal: 20,
    maxHeight: 400,
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
    fontSize: 14,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchResultItemContent: {
    flex: 1,
  },
  searchResultProductName: {
    fontSize: 15,
    fontFamily: 'Nexa-Heavy',
    color: '#333',
    marginBottom: 4,
  },
  searchResultRestaurantLabel: {
    fontSize: 13,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666',
  },
  searchResultRestaurantName: {
    fontSize: 15,
    fontFamily: 'Nexa-Heavy',
    color: '#333',
    marginBottom: 4,
  },
  searchResultAddress: {
    fontSize: 13,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666',
  },
  searchResultPrice: {
    fontSize: 15,
    fontFamily: 'Nexa-Heavy',
    color: '#F43332',
  },
  noResultsContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#999',
  },
});

export default MainPage;
