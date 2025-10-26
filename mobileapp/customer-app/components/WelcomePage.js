import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, Animated, TouchableOpacity, ScrollView, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;

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
        source={require('../assets/welcomePage.webp')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Dark Overlay */}
      <View style={styles.darkOverlay} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Logo and Subtitle at Top */}
        <View style={styles.topSection}>
          <Animated.View style={[
            styles.topContainer,
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
                It's the <Text style={styles.highlightedText}>food</Text> you love, delivered to you
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Buttons and Text Container - Fixed at Bottom */}
        <View style={styles.bottomSection}>
          <View style={styles.buttonsAndTextContainer}>
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

          {/* Footer */}
          <Text style={styles.footer}>© 2025 Soti Delivery. All rights reserved.</Text>
          </View>
        </View>
      </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    minHeight: height,
  },
  topSection: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  topContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: isSmallScreen ? 40 : 80,
  },
  bottomSection: {
    justifyContent: 'flex-end',
    paddingBottom: isSmallScreen ? 20 : 30,
  },
  logoContainer: {
    marginBottom: isSmallScreen ? 10 : 15,
  },
  logo: {
    width: width * 0.7,
    maxWidth: 250,
    height: 80,
    resizeMode: 'contain',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
    width: '100%',
  },
  subtitle: {
    fontSize: isSmallScreen ? 13 : 15,
    fontFamily: 'Nexa-ExtraLight',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: isSmallScreen ? 18 : 22,
    paddingHorizontal: 10,
  },
  highlightedText: {
    color: '#F43332',
    fontFamily: 'Nexa-ExtraLight',
  },
  buttonsAndTextContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  loginButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 35,
    paddingVertical: isSmallScreen ? 14 : 16,
    paddingHorizontal: 60,
    marginBottom: 14,
    width: width * 0.85,
    maxWidth: 320,
    alignSelf: 'center',
  },
  loginButtonText: {
    color: '#F43332',
    fontSize: isSmallScreen ? 16 : 18,
    fontFamily: 'Nexa-Heavy',
    textAlign: 'center',
  },
  createAccountButton: {
    backgroundColor: '#F43332',
    borderRadius: 35,
    paddingVertical: isSmallScreen ? 14 : 16,
    paddingHorizontal: 60,
    width: width * 0.85,
    maxWidth: 320,
    alignSelf: 'center',
  },
  createAccountButtonText: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 16 : 18,
    fontFamily: 'Nexa-Heavy',
    textAlign: 'center',
  },
  registrationSubtitleContainer: {
    marginTop: isSmallScreen ? 15 : 20,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  registrationSubtitle: {
    fontSize: isSmallScreen ? 12 : 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  registerHighlight: {
    fontWeight: '600',
    fontFamily: 'Nexa-ExtraLight',
  },
  communitySubtitleContainer: {
    marginTop: isSmallScreen ? 20 : 26,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  communitySubtitle: {
    fontSize: isSmallScreen ? 11 : 12,
    fontFamily: 'Nexa-ExtraLight',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: isSmallScreen ? 14 : 16,
    opacity: 0.8,
  },
  footer: {
    fontSize: isSmallScreen ? 10 : 11,
    fontFamily: 'Nexa-ExtraLight',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: isSmallScreen ? 15 : 20,
    marginBottom: 20,
    opacity: 0.7,
    paddingHorizontal: 20,
  },
});

export default WelcomePage;
