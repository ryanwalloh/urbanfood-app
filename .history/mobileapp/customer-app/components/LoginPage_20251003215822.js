import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, Animated, Keyboard } from 'react-native';
import LoginForm from './LoginForm';

const { width } = Dimensions.get('window');

const LoginPage = ({ onLoginSuccess, onCreateAccount }) => (
  <View style={styles.loginContainer}>
    {/* Logo at top */}
    <View style={styles.loginLogoContainer}>
      <Image 
        source={require('../assets/sotilogo.png')} 
        style={styles.loginLogo}
        resizeMode="contain"
      />
    </View>

    {/* Welcome Text */}
    <View style={styles.welcomeContainer}>
      <Text style={styles.welcomeTitle}>Welcome to SotiDelivery</Text>
      <Text style={styles.loginTitle}>Login now!</Text>
    </View>

    {/* Login Form */}
    <LoginForm onLoginSuccess={onLoginSuccess} onCreateAccount={onCreateAccount} />
  </View>
);

const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  loginLogoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  loginLogo: {
    width: 80,
    height: 80,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  loginTitle: {
    fontSize: 18,
    color: '#666',
  },
});

export default LoginPage;
