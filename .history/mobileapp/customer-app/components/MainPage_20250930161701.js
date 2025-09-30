import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

const MainPage = ({ user, onLogout }) => (
  <View style={styles.mainContainer}>
    <View style={styles.mainHeader}>
      <Image 
        source={require('../assets/sotilogo.png')} 
        style={styles.mainLogo}
        resizeMode="contain"
      />
      <Text style={styles.welcomeText}>Connected to DB!!!!!!</Text>
      <Text style={styles.userEmail}>{user?.email}</Text>
    </View>
    
    <View style={styles.mainContent}>
      <Text style={styles.mainTitle}>SotiDelivery Customer App</Text>
      <Text style={styles.mainSubtitle}>Success Test</Text>
      
      
      
      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutButtonText}>Logout Test</Text>
      </TouchableOpacity>
    </View>
  </View>
);

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
});

export default MainPage;
