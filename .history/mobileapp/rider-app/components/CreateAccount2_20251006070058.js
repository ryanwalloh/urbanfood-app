import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CreateAccount2 = ({ userData, onBack }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account 2</Text>
      <Text style={styles.subtitle}>This page is under development</Text>
      <Text style={styles.userData}>
        User Data: {JSON.stringify(userData, null, 2)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Nexa-Heavy',
    color: '#F43332',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  userData: {
    fontSize: 12,
    fontFamily: 'Nexa-ExtraLight',
    color: '#999',
    textAlign: 'center',
  },
});

export default CreateAccount2;
