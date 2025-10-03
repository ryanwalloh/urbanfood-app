import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, StyleSheet, Dimensions, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';

const { width } = Dimensions.get('window');

const RiderLoginForm = ({ onLoginSuccess, onCreateAccount }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation for spinning logo
  const spinValue = useRef(new Animated.Value(0)).current;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔐 Attempting rider login for:', email);
      const result = await apiService.login(email, password);
      console.log('📱 Login response:', result);

      if (result.success) {
        // Check if the redirect_url indicates this is for riders
        if (result.redirect_url && result.redirect_url.includes('rider')) {
          // Use user data from login response
          const userData = result.user || {
            email: email,
            username: email,
            role: 'rider'
          };
          console.log('✅ Rider login successful, user data:', userData);
          
          // Persist rider session
          await AsyncStorage.setItem('rider:user', JSON.stringify(userData));
          
          onLoginSuccess(userData);
        } else {
          Alert.alert('Error', 'This app is for riders only. Please use the appropriate app for your role.');
        }
      } else {
        Alert.alert('Login Failed', result.error || result.message || 'Invalid email or password');
      }
    } catch (error) {
      console.log('❌ Login error:', error);
      Alert.alert('Error', 'Login failed: ' + (error?.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image 
        source={require('../assets/loginbg.png')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Header with Logo */}
      <View style={styles.header}>
        <Image 
          source={require('../assets/sotiloading.png')} 
          style={styles.loadingLogo}
          resizeMode="cover"
        />
        <Image 
          source={require('../assets/loginlogowhite.png')} 
          style={styles.logo}
          resizeMode="cover"
        />
      </View>

      {/* Login Form Container */}
      <View style={styles.formContainer}>
        {/* Welcome Message */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Welcome Back, Rider!</Text>
          <Text style={styles.subtitleText}>Sign in to start delivering</Text>
        </View>
        {/* Email Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Image 
              source={showPassword ? require('../assets/hide.png') : require('../assets/eye.png')} 
              style={styles.eyeIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Remember Me */}
        <View style={styles.rememberContainer}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.rememberText}>Remember me</Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        {/* Create Account */}
        <View style={styles.createAccountContainer}>
          <Text style={styles.createAccountText}>Don't have an account? </Text>
          <TouchableOpacity onPress={onCreateAccount}>
            <Text style={styles.createAccountLink}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: '70%',
    zIndex: 0,
  },
  header: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 60,
    zIndex: 1,
  },
  loadingLogo: {
    width: 80,
    height: 80,
    position: 'absolute',
    top: 45,
    right: 285,
    zIndex: 2,
  },
  logo: {
    width: '55%',
    height: 180,
    top: 55,
    right: 90,
    zIndex: 1,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 28,
    fontFamily: 'Nexa-Heavy',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    fontFamily: 'Nexa-ExtraLight',
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  formContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F43332',
    borderTopLeftRadius: 44,
    borderTopRightRadius: 44,
    paddingHorizontal: 30,
    paddingTop: 50,
    paddingBottom: 40,
    minHeight: 400,
  },
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  input: {
    backgroundColor: '#EEEEEE',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'Nexa-ExtraLight',
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  eyeIcon: {
    width: 20,
    height: 20,
    tintColor: '#F43332',
  },
  rememberContainer: {
    marginBottom: 30,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FFFFFF',
  },
  checkmark: {
    color: '#F43332',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rememberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Nexa-ExtraLight',
  },
  loginButton: {
    backgroundColor: '#EEEEEE',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#F43332',
    fontSize: 18,
    fontFamily: 'Nexa-Heavy',
  },
  createAccountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createAccountText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Nexa-ExtraLight',
  },
  createAccountLink: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Nexa-Heavy',
    textDecorationLine: 'underline',
  },
});

export default RiderLoginForm;
