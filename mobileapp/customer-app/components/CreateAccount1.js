import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';

const CreateAccount1 = ({ regData, onNext }) => {
  const [local, setLocal] = useState(regData);
  
  const handleNext = () => {
    if (!local.username || !local.firstName || !local.lastName || !local.email || !local.password) {
      Alert.alert('Incomplete', 'Please complete all fields.');
      return;
    }
    onNext(local);
  };

  return (
    <View style={styles.createContainer}>
      <View style={styles.loginLogoContainer}>
        <Image source={require('../assets/sotilogo.png')} style={styles.loginLogo} resizeMode="contain" />
      </View>
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeTitle}>Create your account</Text>
      </View>
      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input} 
            placeholder="Username" 
            placeholderTextColor="#999" 
            value={local.username} 
            onChangeText={(t) => setLocal({...local, username: t})} 
            autoCapitalize="none" 
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input} 
            placeholder="First name" 
            placeholderTextColor="#999" 
            value={local.firstName} 
            onChangeText={(t) => setLocal({...local, firstName: t})} 
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input} 
            placeholder="Last name" 
            placeholderTextColor="#999" 
            value={local.lastName} 
            onChangeText={(t) => setLocal({...local, lastName: t})} 
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input} 
            placeholder="Email address" 
            placeholderTextColor="#999" 
            value={local.email} 
            onChangeText={(t) => setLocal({...local, email: t})} 
            keyboardType="email-address" 
            autoCapitalize="none" 
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input} 
            placeholder="Password" 
            placeholderTextColor="#999" 
            value={local.password} 
            onChangeText={(t) => setLocal({...local, password: t})} 
            secureTextEntry 
          />
        </View>
        <TouchableOpacity style={styles.loginButton} onPress={handleNext}>
          <Text style={styles.loginButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  createContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  loginLogoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  loginLogo: {
    width: 80,
    height: 80,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateAccount1;
