import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, StyleSheet } from 'react-native';
import { apiService } from '../services/api';

const LoginForm = ({ onLoginSuccess, onCreateAccount }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiService.login(email, password);
      
      if (result.success) {
        if (result.redirect_url && result.redirect_url.includes('customer')) {
          // Use user data from login response
          const userData = result.user || {
            email: email,
            username: email,
            role: 'customer'
          };
          console.log('✅ Login successful, user data:', userData);
          onLoginSuccess(userData);
        } else {
          Alert.alert('Error', 'This app is for customers only. Please use the appropriate app for your role.');
        }
      } else {
        Alert.alert('Login Failed', result.error || result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.formContainer}>
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
          blurOnSubmit={false}
          returnKeyType="next"
        />
        <Text style={styles.floatingLabel}>Email</Text>
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
          autoCorrect={false}
          blurOnSubmit={false}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />
        <Text style={styles.floatingLabel}>Password</Text>
        <TouchableOpacity 
          style={styles.eyeButton}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Image 
            source={showPassword ? require('../assets/hide.png') : require('../assets/eye.png')}
            style={styles.eyeIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Remember Me & Forgot Password */}
      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={styles.rememberMeContainer}
          onPress={() => setRememberMe(!rememberMe)}
        >
          <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
            {rememberMe && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.rememberMeText}>Remember me</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      {/* Login Button */}
      <TouchableOpacity 
        style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.loginButtonText}>
          {isLoading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>

      {/* Google Login */}
      <TouchableOpacity style={styles.googleButton}>
        <Image 
          source={require('../assets/googlelogo.png')}
          style={styles.googleIcon}
        />
        <Text style={styles.googleButtonText}>Login with Google</Text>
      </TouchableOpacity>

      {/* Create Account */}
      <View style={styles.createAccountContainer}>
        <Text style={styles.createAccountText}>
          Don't have an account yet?{' '}
          <Text style={styles.createAccountLink} onPress={onCreateAccount}>Create Account</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    // Container styling moved to parent LoginPage
  },
  inputContainer: {
    position: 'relative',
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
  floatingLabel: {
    position: 'absolute',
    left: 16,
    top: -8,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 4,
    fontSize: 12,
    color: '#666',
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
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#F43332',
    borderColor: '#F43332',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rememberMeText: {
    fontSize: 14,
    color: '#666',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#F43332',
  },
  loginButton: {
    backgroundColor: '#F43332',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  googleButtonText: {
    fontSize: 16,
    color: '#333',
  },
  createAccountContainer: {
    alignItems: 'center',
  },
  createAccountText: {
    fontSize: 14,
    color: '#666',
  },
  createAccountLink: {
    color: '#F43332',
    fontWeight: '600',
  },
});

export default LoginForm;
