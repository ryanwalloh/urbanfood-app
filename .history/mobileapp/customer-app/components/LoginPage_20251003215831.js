import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, Animated, Keyboard } from 'react-native';
import LoginForm from './LoginForm';

const { width } = Dimensions.get('window');

const LoginPage = ({ onLoginSuccess, onCreateAccount }) => {
  // Animation for form container lift
  const formContainerTranslateY = useRef(new Animated.Value(0)).current;

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      Animated.timing(formContainerTranslateY, {
        toValue: -150, // Lift the form container up
        duration: 250,
        useNativeDriver: true,
      }).start();
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(formContainerTranslateY, {
        toValue: 0, // Return to original position
        duration: 250,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [formContainerTranslateY]);

  return (
    <View style={styles.loginContainer}>
      {/* Background Image */}
      <Image 
        source={require('../assets/loginbg.png')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Login Form Container */}
      <Animated.View style={[
        styles.formContainer,
        {
          transform: [{ translateY: formContainerTranslateY }]
        }
      ]}>
        {/* Welcome Message */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Welcome to SotiDelivery</Text>
          <Text style={styles.loginTitle}>Login now!</Text>
        </View>

        {/* Login Form */}
        <LoginForm onLoginSuccess={onLoginSuccess} onCreateAccount={onCreateAccount} />
      </Animated.View>
    </View>
  );
};

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
