import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

const OnboardingPage1 = ({ onNext }) => (
  <View style={styles.onbContainer}>
    <View style={styles.onbTopBar}>
      <View style={{ width: 60 }} />
      <TouchableOpacity><Text style={styles.onbSkip}>Skip</Text></TouchableOpacity>
    </View>
    <Image source={require('../assets/onboarding1.png')} style={styles.onbImage} resizeMode="contain" />
    <Text style={styles.onbTitle}>Order Your Favorites</Text>
    <Text style={styles.onbText}>Find the best restaurants and choose your most{"\n"}favourite meals to tempt your taste buds.</Text>
    <View style={styles.onbProgressRow}>
      <View style={[styles.onbDot, styles.onbDotActive]} />
      <View style={styles.onbDot} />
      <View style={styles.onbDot} />
    </View>
    <TouchableOpacity style={styles.onbNextBtn} onPress={onNext}>
      <Text style={styles.onbNextText}>Next</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  onbContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  onbTopBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  onbSkip: {
    color: '#F43332',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nexa-Heavy',
  },
  onbImage: {
    width: '100%',
    height: 260,
    marginBottom: 24,
  },
  onbTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 0,
    fontFamily: 'Nexa-Heavy',

  },
  onbText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: -68,
    marginBottom: 12,
    fontFamily: 'Nexa-ExtraLight',
    
  },
  onbProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 50,
  },
  onbNextText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingPage1;
