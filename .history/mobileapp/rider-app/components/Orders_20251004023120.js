import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Orders = ({ onBack }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Orders Page - Ready for Redesign</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  text: {
    fontSize: 18,
    fontFamily: 'Nexa-Heavy',
    color: '#1A1A1A',
  },
});

export default Orders;