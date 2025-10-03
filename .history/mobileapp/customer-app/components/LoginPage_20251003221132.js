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

      {/* Background Text Overlay */}
      <View style={styles.backgroundTextContainer}>
        <Text style={styles.backgroundText}>
          The food you love,{'\n'}Delivered to you
        </Text>
      </View>

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
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: '70%',
    zIndex: 0,
  },
  backgroundTextContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    paddingHorizontal: 30,
  },
  backgroundText: {
    fontSize: 32,
    fontFamily: 'Nexa-Heavy',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    lineHeight: 40,
  },
  formContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 44,
    borderTopRightRadius: 44,
    paddingHorizontal: 30,
    paddingTop: 50,
    paddingBottom: 40,
    minHeight: 400,
    zIndex: 2,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 28,
    fontFamily: 'Nexa-Heavy',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  loginTitle: {
    fontSize: 16,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666',
    textAlign: 'center',
  },
});

export default LoginPage;
