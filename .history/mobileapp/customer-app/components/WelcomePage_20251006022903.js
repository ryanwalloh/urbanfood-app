import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, Animated, TouchableOpacity } from 'react-native';

const { width, height } = Dimensions.get('window');

const WelcomePage = ({ onGetStarted }) => {
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

        {/* Get Started Button */}
        <TouchableOpacity 
          style={styles.getStartedButton}
          onPress={onGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
        </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 200,
    height: 80,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'bgtext',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
  },
  highlightedText: {
    color: '#F43332',
    fontFamily: 'bgtext',
  },
  getStartedButton: {
    backgroundColor: '#F43332',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 60,
    shadowColor: '#F43332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Nexa-Heavy',
    textAlign: 'center',
  },
});

export default WelcomePage;
