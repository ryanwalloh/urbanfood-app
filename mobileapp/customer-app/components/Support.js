import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;

const Support = ({ onBack }) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Support</Text>
      </View>

      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
      >
        {/* Coming Soon Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={require('../assets/comingsoon.png')} 
            style={styles.comingSoonImage} 
            resizeMode="contain"
          />
        </View>

        {/* Friendly Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.title}>Chat Support Coming Soon</Text>
          <Text style={styles.message}>
            We're working hard to bring you a seamless chat support experience. 
            Our team is currently developing this feature to better assist you.
          </Text>
          <Text style={styles.contactMessage}>
            If you have any questions, concerns, or need assistance, please feel free to contact us at:
          </Text>
          <Text style={styles.email}>soti@support.com</Text>
          <Text style={styles.footerText}>
            We appreciate your patience and look forward to serving you better.
          </Text>
        </View>

        {/* Copyright Footer */}
        <View style={styles.copyrightContainer}>
          <Text style={styles.copyrightText}>© 2025 Soti Delivery. All rights reserved.</Text>
        </View>

        {/* Bottom padding for navigation */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: isSmallScreen ? 20 : 24,
    paddingTop: isSmallScreen ? 45 : 50,
    paddingBottom: isSmallScreen ? 15 : 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  headerTitle: {
    fontSize: isSmallScreen ? 20 : 22,
    fontWeight: 'bold',
    color: '#333333',
    fontFamily: 'Nexa-Heavy',
  },
  scrollContainer: {
    flex: 1,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: isSmallScreen ? 20 : 30,
    marginBottom: isSmallScreen ? 20 : 30,
    paddingHorizontal: 20,
  },
  comingSoonImage: {
    width: isSmallScreen ? width * 0.5 : width * 0.6,
    height: isSmallScreen ? width * 0.5 : width * 0.6,
  },
  messageContainer: {
    paddingHorizontal: isSmallScreen ? 20 : 30,
    paddingBottom: isSmallScreen ? 20 : 30,
  },
  title: {
    fontSize: isSmallScreen ? 18 : 22,
    fontFamily: 'Nexa-Heavy',
    color: '#333333',
    textAlign: 'center',
    marginBottom: isSmallScreen ? 12 : 16,
  },
  message: {
    fontSize: isSmallScreen ? 13 : 15,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666666',
    textAlign: 'center',
    lineHeight: isSmallScreen ? 20 : 24,
    marginBottom: isSmallScreen ? 12 : 16,
  },
  contactMessage: {
    fontSize: isSmallScreen ? 13 : 15,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666666',
    textAlign: 'center',
    lineHeight: isSmallScreen ? 20 : 24,
    marginBottom: isSmallScreen ? 8 : 12,
  },
  email: {
    fontSize: isSmallScreen ? 14 : 16,
    fontFamily: 'Nexa-Heavy',
    color: '#F43332',
    textAlign: 'center',
    marginBottom: isSmallScreen ? 12 : 16,
  },
  footerText: {
    fontSize: isSmallScreen ? 12 : 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#999999',
    textAlign: 'center',
    lineHeight: isSmallScreen ? 18 : 22,
  },
  bottomPadding: {
    height: isSmallScreen ? 100 : 120,
  },
  // Copyright Footer
  copyrightContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isSmallScreen ? 15 : 20,
    paddingHorizontal: 20,
  },
  copyrightText: {
    fontSize: isSmallScreen ? 10 : 12,
    fontFamily: 'Nexa-ExtraLight',
    color: '#999',
    textAlign: 'center',
  },
});

export default Support;

