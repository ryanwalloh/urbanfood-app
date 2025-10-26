import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;

const OnboardingPage3 = ({ onBack, onGetStarted, onSkip }) => (
  <View style={styles.onbContainer}>
    <View style={styles.onbTopBar}>
      <TouchableOpacity onPress={onBack}><Text style={styles.onbBack}>Back</Text></TouchableOpacity>
      <View style={{ width: 60 }} />
    </View>
    <Image source={require('../assets/onboarding3.png')} style={styles.onbImage} resizeMode="contain" />
    <Text style={styles.onbTitle}>Delivery at Door-Step</Text>
    <Text style={styles.onbText}>It's the food you love, delivered with care.</Text>
    <View style={styles.onbProgressRow}>
      <View style={styles.onbDot} />
      <View style={styles.onbDot} />
      <View style={[styles.onbDot, styles.onbDotActive]} />
    </View>
    <TouchableOpacity style={styles.onbNextBtn} onPress={onGetStarted}>
      <Text style={styles.onbNextText}>GET STARTED</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  onbContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: isSmallScreen ? 40 : 60,
    paddingHorizontal: isSmallScreen ? 20 : 24,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  onbTopBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isSmallScreen ? 8 : 16,
  },
  onbSkip: {
    color: '#F43332',
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    fontFamily: 'Nexa-Heavy',
  },
  onbBack: {
    color: '#999999',
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    fontFamily: 'Nexa-Heavy',
  },
  onbImage: {
    width: '100%',
    height: isSmallScreen ? 200 : 260,
    marginBottom: isSmallScreen ? 16 : 24,
  },
  onbTitle: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 0,
    fontFamily: 'Nexa-Heavy',
  },
  onbText: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: isSmallScreen ? 18 : 20,
    marginTop: isSmallScreen ? -40 : -68,
    marginBottom: isSmallScreen ? 8 : 12,
    fontFamily: 'Nexa-ExtraLight',
  },
  onbProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isSmallScreen ? 16 : 20,
    gap: 8,
  },
  onbDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  onbDotActive: {
    width: 20,
    backgroundColor: '#F43332',
  },
  onbNextBtn: {
    backgroundColor: '#F43332',
    borderRadius: 12,
    paddingVertical: isSmallScreen ? 12 : 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: isSmallScreen ? 30 : 50,
  },
  onbNextText: {
    color: '#fff',
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    fontFamily: 'Nexa-Heavy',
  },
});

export default OnboardingPage3;
