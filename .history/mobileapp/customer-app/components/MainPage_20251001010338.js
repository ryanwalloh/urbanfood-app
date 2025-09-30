import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, TextInput, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { apiService } from '../services/api';
import RestaurantOrder from './RestaurantOrder';

const { width } = Dimensions.get('window');

const MainPage = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('restaurants');
  const [activeNav, setActiveNav] = useState('home');
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

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

  return (
    <View style={styles.mainContainer}>
      {/* Hero Image Container */}
      <View style={styles.heroContainer}>
        <Image 
          source={require('../assets/imageHero.png')} 
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
      </View>

      {/* Search Field - Positioned over hero image */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Looking for something?"
            placeholderTextColor="#999"
          />
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>

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
    fontWeight: '600',
  },
  heroTitleContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
  },
  heroTitleText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 38,

  },
  // Scroll Container
  scrollContainer: {
    flex: 1,
  },
  // Search Section
  searchContainer: {
    position: 'absolute',
    top: 335,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
    borderRadius: 42,
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 12,
    
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  // Section Styles
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 0,
    marginTop: 50,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: '#F43332',
    fontWeight: '600',
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
    fontWeight: '600',
  },
  restaurantInfo: {
    padding: 16,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: 14,
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
    color: '#666',
  },
  navLabelActive: {
    color: '#F43332',
    fontWeight: '600',
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
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default MainPage;
