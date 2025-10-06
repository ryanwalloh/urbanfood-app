import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, StyleSheet, Dimensions, Animated, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { findWorkingUrl } from '../services/api';

const { width } = Dimensions.get('window');

const CreateAccount2 = ({ userData, onBack, onCreateAccount }) => {
  const [vehicleType, setVehicleType] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation for form container lift
  const formContainerTranslateY = useRef(new Animated.Value(0)).current;
  
  // Animation values for floating labels
  const vehicleTypeLabelAnimation = useRef(new Animated.Value(0)).current;
  const licenseNumberLabelAnimation = useRef(new Animated.Value(0)).current;
  const phoneNumberLabelAnimation = useRef(new Animated.Value(0)).current;
  
  // Focus states
  const [vehicleTypeFocused, setVehicleTypeFocused] = useState(false);
  const [licenseNumberFocused, setLicenseNumberFocused] = useState(false);
  const [phoneNumberFocused, setPhoneNumberFocused] = useState(false);

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

  const handleVehicleTypeFocus = () => {
    setVehicleTypeFocused(true);
    animateLabelUp(vehicleTypeLabelAnimation);
  };

  const handleVehicleTypeBlur = () => {
    setVehicleTypeFocused(false);
    if (!vehicleType) {
      animateLabelDown(vehicleTypeLabelAnimation);
    }
  };

  const handleLicenseNumberFocus = () => {
    setLicenseNumberFocused(true);
    animateLabelUp(licenseNumberLabelAnimation);
  };

  const handleLicenseNumberBlur = () => {
    setLicenseNumberFocused(false);
    if (!licenseNumber) {
      animateLabelDown(licenseNumberLabelAnimation);
    }
  };

  const handlePhoneNumberFocus = () => {
    setPhoneNumberFocused(true);
    animateLabelUp(phoneNumberLabelAnimation);
  };

  const handlePhoneNumberBlur = () => {
    setPhoneNumberFocused(false);
    if (!phoneNumber) {
      animateLabelDown(phoneNumberLabelAnimation);
    }
  };

  // Keyboard event listeners
  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      Animated.timing(formContainerTranslateY, {
        toValue: -200,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(formContainerTranslateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [formContainerTranslateY]);

  const handleCreateAccount = async () => {
    if (!vehicleType || !licenseNumber || !phoneNumber) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Basic phone number validation
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    // Save step 2 data locally
    const step2Data = {
      vehicleType,
      licenseNumber,
      phoneNumber,
    };

    try {
      await AsyncStorage.setItem('rider_registration_step2', JSON.stringify(step2Data));
      console.log('✅ Step 2 data saved locally:', step2Data);
    } catch (error) {
      console.error('❌ Error saving step 2 data:', error);
    }

    setIsLoading(true);
    try {
      // Find working URL dynamically
      const baseURL = await findWorkingUrl();
      console.log('🌐 Using working URL for SMS verification:', baseURL);
      
      // Send SMS verification code
      const response = await fetch(`${baseURL}/users/send-verification-code/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          email: userData.email, // Include email for primary verification method
        }),
      });

      const result = await response.json();

      if (result.success) {
        // If backend is in DEBUG fallback, show the code for local testing
        if (result.debug_fallback && result.twilio_error) {
          console.log('⚠️ Twilio send failed (debug). Proceeding with fallback:', result.twilio_error);
          Alert.alert('Debug', 'SMS not sent (debug). Please check server logs for the code.');
        }
        // Redirect to code confirmation
        onCreateAccount({
          verificationId: result.verification_id,
          phoneNumber: phoneNumber,
        });
      } else {
        Alert.alert('Error', result.error || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Create account error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image 
        source={require('../assets/createaccount2.png')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Dark Overlay */}
      <View style={styles.darkOverlay} />
      
      {/* Header with Logo */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/sotihorizontal.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Create Account Form Container */}
      <Animated.View style={[
        styles.formContainer,
        {
          transform: [{ translateY: formContainerTranslateY }]
        }
      ]}>
        {/* Welcome Message */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Rider Information</Text>
          <Text style={styles.subtitleText}>Complete your rider profile</Text>
        </View>

        {/* Vehicle Type Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder=""
            placeholderTextColor="#999"
            value={vehicleType}
            onChangeText={setVehicleType}
            onFocus={handleVehicleTypeFocus}
            onBlur={handleVehicleTypeBlur}
            autoCapitalize="words"
            autoCorrect={false}
            blurOnSubmit={false}
            returnKeyType="next"
          />
          <Animated.Text style={[
            styles.floatingLabel,
            {
              top: vehicleTypeLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [16, -8],
              }),
              fontSize: vehicleTypeLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 12],
              }),
              color: vehicleTypeLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', '#666'],
              }),
              borderWidth: vehicleTypeLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
              borderColor: vehicleTypeLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', '#666'],
              }),
              borderRadius: vehicleTypeLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 8],
              }),
              paddingHorizontal: vehicleTypeLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 4],
              }),
              backgroundColor: vehicleTypeLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', '#fff'],
              }),
            }
          ]}>
            Vehicle Type
          </Animated.Text>
        </View>

        {/* License Number Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder=""
            placeholderTextColor="#999"
            value={licenseNumber}
            onChangeText={setLicenseNumber}
            onFocus={handleLicenseNumberFocus}
            onBlur={handleLicenseNumberBlur}
            autoCapitalize="characters"
            autoCorrect={false}
            blurOnSubmit={false}
            returnKeyType="next"
          />
          <Animated.Text style={[
            styles.floatingLabel,
            {
              top: licenseNumberLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [16, -8],
              }),
              fontSize: licenseNumberLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 12],
              }),
              color: licenseNumberLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', '#666'],
              }),
              borderWidth: licenseNumberLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
              borderColor: licenseNumberLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', '#666'],
              }),
              borderRadius: licenseNumberLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 8],
              }),
              paddingHorizontal: licenseNumberLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 4],
              }),
              backgroundColor: licenseNumberLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', '#fff'],
              }),
            }
          ]}>
            License Number
          </Animated.Text>
        </View>

        {/* Phone Number Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder=""
            placeholderTextColor="#999"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            onFocus={handlePhoneNumberFocus}
            onBlur={handlePhoneNumberBlur}
            keyboardType="phone-pad"
            autoCorrect={false}
            blurOnSubmit={false}
            returnKeyType="done"
            onSubmitEditing={handleCreateAccount}
          />
          <Animated.Text style={[
            styles.floatingLabel,
            {
              top: phoneNumberLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [16, -8],
              }),
              fontSize: phoneNumberLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 12],
              }),
              color: phoneNumberLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', '#666'],
              }),
              borderWidth: phoneNumberLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
              borderColor: phoneNumberLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', '#666'],
              }),
              borderRadius: phoneNumberLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 8],
              }),
              paddingHorizontal: phoneNumberLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 4],
              }),
              backgroundColor: phoneNumberLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', '#fff'],
              }),
            }
          ]}>
            Phone Number
          </Animated.Text>
        </View>

        {/* Create Account Button */}
        <TouchableOpacity
          style={[styles.createAccountButton, isLoading && styles.createAccountButtonDisabled]}
          onPress={handleCreateAccount}
          disabled={isLoading}
        >
          <Text style={styles.createAccountButtonText}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        {/* Back to Previous Step */}
        <View style={styles.backToPreviousContainer}>
          <Text style={styles.backToPreviousText}>Need to go back? </Text>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backToPreviousLink}>Previous Step</Text>
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
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: '75%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 0.5,
  },
  logoContainer: {
    position: 'absolute',
    top: 10,
    right: 20,
    zIndex: 1,
  },
  logo: {
    width: 150,
    height: 150,
  },
  welcomeContainer: {
    alignItems: 'left',
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 24,
    fontFamily: 'Nexa-Heavy',
    color: '#333333',
    marginBottom: 0,
    textAlign: 'left',
  },
  subtitleText: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666666',
    textAlign: 'left',
    opacity: 0.9,
  },
  formContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 4,
    color: '#666',
    fontFamily: 'Nexa-ExtraLight',
  },
  createAccountButton: {
    backgroundColor: '#F43332',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  createAccountButtonDisabled: {
    opacity: 0.7,
  },
  createAccountButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Nexa-Heavy',
  },
  backToPreviousContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backToPreviousText: {
    color: '#666666',
    fontSize: 16,
    fontFamily: 'Nexa-ExtraLight',
  },
  backToPreviousLink: {
    color: '#F43332',
    fontSize: 16,
    fontFamily: 'Nexa-Heavy',
    textDecorationLine: 'underline',
  },
});

export default CreateAccount2;
