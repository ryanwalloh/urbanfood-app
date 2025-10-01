import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const LandingPage = () => {
  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/sotilogowhite.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F43332', // Red hex code
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.6, // 60% of screen width
    height: height * 0.3, // 30% of screen height
  },
});

export default LandingPage;
