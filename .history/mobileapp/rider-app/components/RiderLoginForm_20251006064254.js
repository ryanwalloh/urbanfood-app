import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, StyleSheet, Dimensions, Animated, Keyboard } from 'react-native';
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
  
  // Animation for form container lift
  const formContainerTranslateY = useRef(new Animated.Value(0)).current;
  
  // Animation values for floating labels
  const emailLabelAnimation = useRef(new Animated.Value(0)).current;
  const passwordLabelAnimation = useRef(new Animated.Value(0)).current;
  
  // Focus states
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Animation functions
  const animateLabelUp = (animation) => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const animateLabelDown = (animation) => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleEmailFocus = () => {
    setEmailFocused(true);
    animateLabelUp(emailLabelAnimation);
  };

  const handleEmailBlur = () => {
    setEmailFocused(false);
    if (!email) {
      animateLabelDown(emailLabelAnimation);
    }
  };

  const handlePasswordFocus = () => {
    setPasswordFocused(true);
    animateLabelUp(passwordLabelAnimation);
  };

  const handlePasswordBlur = () => {
    setPasswordFocused(false);
    if (!password) {
      animateLabelDown(passwordLabelAnimation);
    }
  };

  useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000, // 2 seconds per rotation
        useNativeDriver: true,
      })
    );
    spinAnimation.start();

    return () => spinAnimation.stop();
  }, [spinValue]);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      Animated.timing(formContainerTranslateY, {
        toValue: -150, // Lift the form container up
        duration: 250,
        useNativeDriver: true,
      }).start();
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(formContainerTranslateY, {
        toValue: 0, // Return to original position
        duration: 250,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [formContainerTranslateY]);

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
        source={require('../assets/loginbg1.png')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Header with Logo */}
      <View style={styles.header}>
        <Animated.Image 
          source={require('../assets/sotiloading.png')} 
          style={[
            styles.loadingLogo,
            {
              transform: [{
                rotate: spinValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                })
              }]
            }
          ]}
          resizeMode="cover"
        />
        <Image 
          source={require('../assets/loginlogo.png')} 
          style={styles.logo}
          resizeMode="cover"
        />
      </View>

      {/* Login Form Container */}
      <Animated.View style={[
        styles.formContainer,
        {
          transform: [{ translateY: formContainerTranslateY }]
        }
      ]}>
        {/* Welcome Message */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Welcome Back, Partner!</Text>
          <Text style={styles.subtitleText}>Sign in, complete assignments, earn more.</Text>
        </View>
        {/* Email Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            onFocus={handleEmailFocus}
            onBlur={handleEmailBlur}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            blurOnSubmit={false}
            returnKeyType="next"
          />
          <Animated.Text style={[
            styles.floatingLabel,
            {
              top: emailLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [16, -8],
              }),
              fontSize: emailLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 12],
              }),
              color: emailLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', '#666'],
              }),
            }
          ]}>
            Email
          </Animated.Text>
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            onFocus={handlePasswordFocus}
            onBlur={handlePasswordBlur}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            blurOnSubmit={false}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
          <Animated.Text style={[
            styles.floatingLabel,
            {
              top: passwordLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [16, -8],
              }),
              fontSize: passwordLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 12],
              }),
              color: passwordLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', '#666'],
              }),
            }
          ]}>
            Password
          </Animated.Text>
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
      </Animated.View>
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
    height: '75%',
    zIndex: 0,
  },
  header: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 60,
    zIndex: 1,
  },
  loadingLogo: {
    width: 70,
    height: 70,
    position: 'absolute',
    top: 55,
    right: 280,
    zIndex: 2,
  },
  logo: {
    width: '55%',
    height: 180,
    top: 55,
    right: 80,
    zIndex: 1,
  },
  welcomeContainer: {
    alignItems: 'left',
    marginBottom: 30,

  },
  welcomeText: {
    fontSize: 24,
    fontFamily: 'Nexa-Heavy',
    color: '#FFFFFF',
    marginBottom: 0,
    textAlign: 'left',
  },
  subtitleText: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#FFFFFF',
    textAlign: 'left',
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
    paddingTop: 30,
    paddingBottom: 40,
    minHeight: 400,
  },
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Nexa-ExtraLight',
    color: '#333',
  },
  floatingLabel: {
    position: 'absolute',
    left: 16,
    backgroundColor: '#F43332',
    paddingHorizontal: 4,
    color: '#666',
    fontFamily: 'Nexa-ExtraLight',
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
