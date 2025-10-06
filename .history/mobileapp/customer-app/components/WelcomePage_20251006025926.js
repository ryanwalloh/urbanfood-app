import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, Animated, TouchableOpacity } from 'react-native';

const { width, height } = Dimensions.get('window');

const WelcomePage = ({ onGetStarted, onCreateAccount }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Start entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image 
        source={require('../assets/welcomePage.png')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Dark Overlay */}
      <View style={styles.darkOverlay} />

      {/* Content Container */}
      <Animated.View style={[
        styles.contentContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}>
        {/* Logo */}
        <Animated.View style={[
          styles.logoContainer,
          {
            transform: [{ scale: logoScaleAnim }]
          }
        ]}>
          <Image 
            source={require('../assets/sotihorizontal.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Subtitle */}
        <View style={styles.textContainer}>
          <Text style={styles.subtitle}>
            It's the <Text style={styles.highlightedText}>food</Text> you love, delivered with care
          </Text>
        </View>

        {/* Login Button */}
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={onGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        {/* Create Account Button */}
        <TouchableOpacity 
          style={styles.createAccountButton}
          onPress={onCreateAccount}
          activeOpacity={0.8}
        >
          <Text style={styles.createAccountButtonText}>Register</Text>
        </TouchableOpacity>

        {/* Registration Subtitle */}
        <View style={styles.registrationSubtitleContainer}>
          <Text style={styles.registrationSubtitle}>
            Don't have an account? <Text style={styles.registerHighlight}>Register</Text>
          </Text>
        </View>

        {/* Community Subtitle */}
        <View style={styles.communitySubtitleContainer}>
          <Text style={styles.communitySubtitle}>Empowering local restaurants. Supporting riders. Serving the community.</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
    bottom: 240,
  },
  logo: {
    width: 250,
    height: 80,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
    bottom: 280,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nexa-ExtraLight',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
  },
  highlightedText: {
    color: '#F43332',
    fontFamily: 'Nexa-ExtraLight',
  },
  loginButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 60,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 16,
    width: 300,
    alignSelf: 'center',
  },
  loginButtonText: {
    color: '#F43332',
    fontSize: 18,
    fontFamily: 'Nexa-Heavy',
    textAlign: 'center',
  },
  createAccountButton: {
    backgroundColor: '#F43332',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 60,
    shadowColor: '#F43332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    width: 300,
    alignSelf: 'center',
  },
  createAccountButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Nexa-Heavy',
    textAlign: 'center',
  },
  registrationSubtitleContainer: {
    marginTop: 20,
    alignItems: 'center',
  
  },
  registrationSubtitle: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  registerHighlight: {
    fontWeight: '600',
    fontFamily: 'Nexa-ExtraLight',
  },
  communitySubtitleContainer: {
    marginTop: 26,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  communitySubtitle: {
    fontSize: 12,
    fontFamily: 'Nexa-ExtraLight',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.8,
  },
});

export default WelcomePage;
