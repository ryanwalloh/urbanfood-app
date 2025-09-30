import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, TextInput, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

const MainPage = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('restaurants');
  const [activeNav, setActiveNav] = useState('home');

  // Mock data
  const categories = [
    { name: 'Sandwich', icon: require('../assets/sandwich.png') },
    { name: 'Pizza', icon: require('../assets/pizza.png') },
    { name: 'Salad', icon: require('../assets/salad.png') },
    { name: 'Shawarma', icon: require('../assets/shawarma.png') },
    { name: 'Coffee', icon: require('../assets/coffee.png') },
    { name: 'Chicken', icon: require('../assets/chicken.png') },
    { name: 'Meal', icon: require('../assets/meal.png') },
  ];

  const restaurants = [
    { name: 'McDonald\'s', address: '123 Main St, Barangay 1, City', barangay: 'Barangay 1' },
    { name: 'KFC', address: '456 Oak Ave, Barangay 2, City', barangay: 'Barangay 2' },
    { name: 'Jollibee', address: '789 Pine Rd, Barangay 3, City', barangay: 'Barangay 3' },
    { name: 'Burger King', address: '321 Elm St, Barangay 4, City', barangay: 'Barangay 4' },
  ];

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
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.titleText}>Order your{'\n'}favorite food</Text>
        </View>

        {/* Search Field */}
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

        {/* Categories Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Restaurants</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {restaurants.map((restaurant, index) => (
            <TouchableOpacity key={index} style={styles.restaurantCard}>
              <View style={styles.restaurantImageContainer}>
                <View style={styles.restaurantImage} />
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
          ))}
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
  mainHeader: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    backgroundColor: '#F8F9FA',
  },
  mainLogo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  userEmail: {
    fontSize: 16,
    color: '#666666',
  },
  mainContent: {
    flex: 1,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
    textAlign: 'center',
  },
  mainSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  userDetailsContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
});

export default MainPage;
