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

      {/* Dark Overlay */}
      <View style={styles.darkOverlay} />

      {/* White Logo */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/sotilogowhite.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
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
          <Text style={styles.welcomeTitle}>Welcome Back</Text>
          <Text style={styles.loginTitle}>Login to order your favorite food</Text>
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
    bottom: 30,
    left: 0,
    width: width,
    height: '70%',
    zIndex: 0,
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 30,
    left: 0,
    width: width,
    height: '70%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 0.5,
  },
  backgroundTextContainer: {
    position: 'absolute',
    top: -230,
    left: 120,
    right: 0,
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    paddingHorizontal: 30,
  },
  backgroundText: {
    fontSize: 26,
    fontFamily: 'bgtext',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    lineHeight: 30,
  },
  highlightedText: {
    color: '#F43332',
    fontFamily: 'bgtext',
    fontSize: 26,
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
    paddingTop: 30,
    paddingBottom: 40,
    minHeight: 400,
    zIndex: 2,
  },
  welcomeContainer: {
    alignItems: 'left',
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 28,
    fontFamily: 'Nexa-Heavy',
    color: '#333',
    marginBottom: 0,
    textAlign: 'left',
  },
  loginTitle: {
    fontSize: 16,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666',
    textAlign: 'left',
  },
});

export default LoginPage;
