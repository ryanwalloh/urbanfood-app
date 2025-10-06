import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, StyleSheet, Dimensions, Animated, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { findWorkingUrl } from '../services/api';

const { width } = Dimensions.get('window');

const CodeConfirmation = ({ verificationId, phoneNumber, onVerificationSuccess, onBack }) => {
  const [code, setCode] = useState(['', '', '', '', '']); // Array for individual digits
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [hasVerified, setHasVerified] = useState(false); // Prevent multiple verifications
  const [currentFocus, setCurrentFocus] = useState(0); // Track which box is focused
  const [showError, setShowError] = useState(false); // For shake animation
  const isMountedRef = useRef(true); // Track if component is mounted
  
  // Animation refs
  const formContainerTranslateY = useRef(new Animated.Value(0)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const inputRefs = useRef([]); // Refs for each input box
  
  // Timer effect
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Shake animation for error
  const triggerShakeAnimation = () => {
    setShowError(true);
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowError(false);
    });
  };

  // Reset code input
  const resetCode = () => {
    setCode(['', '', '', '', '']);
    setCurrentFocus(0);
    setShowError(false);
    // Focus first input
    setTimeout(() => {
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, 100);
  };

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      Animated.timing(formContainerTranslateY, {
        toValue: -240,
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

  const handleVerifyCode = async () => {
    const codeString = code.join('');
    
    if (!codeString || codeString.length !== 5) {
      Alert.alert('Error', 'Please enter a valid 5-digit code');
      return;
    }

    // Prevent multiple verification attempts
    if (isLoading || hasVerified || !isMountedRef.current) {
      return;
    }

    setIsLoading(true);
    try {
      // Get all user data from local storage
      const step1Data = await AsyncStorage.getItem('rider_registration_step1');
      const step2Data = await AsyncStorage.getItem('rider_registration_step2');
      
      if (!step1Data || !step2Data) {
        console.error('❌ Missing registration data:', { step1Data: !!step1Data, step2Data: !!step2Data });
        Alert.alert('Error', 'Registration data not found. Please start over.');
        setIsLoading(false);
        return;
      }

      const userData = {
        ...JSON.parse(step1Data),
        ...JSON.parse(step2Data)
      };

      console.log('📱 Sending verification with user data:', userData);

      // Find working URL dynamically
      const baseURL = await findWorkingUrl();
      console.log('🌐 Using working URL for verification:', baseURL);

      const response = await fetch(`${baseURL}/users/verify-sms-code/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verification_id: verificationId,
          code: codeString,
          user_data: userData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Mark as verified to prevent multiple attempts
        setHasVerified(true);
        
        // Clear local storage data
        await AsyncStorage.removeItem('rider_registration_step1');
        await AsyncStorage.removeItem('rider_registration_step2');
        
        Alert.alert('Success', 'Account created successfully!', [
          { text: 'OK', onPress: () => onVerificationSuccess(result.user) }
        ]);
      } else {
        // Show shake animation for incorrect code
        triggerShakeAnimation();
        resetCode();
        Alert.alert('Error', result.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    setIsResending(true);
    try {
      const response = await fetch('http://192.168.254.104:8000/users/resend-verification-code/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verification_id: verificationId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTimeLeft(300); // Reset timer to 5 minutes
        setCanResend(false);
        setCode(''); // Clear current code
        Alert.alert('Success', 'New verification code sent!');
      } else {
        Alert.alert('Error', result.error || 'Failed to resend code');
      }
    } catch (error) {
      console.error('Resend error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // Handle input change for individual boxes
  const handleInputChange = (value, index) => {
    // Only allow digits
    const digit = value.replace(/[^0-9]/g, '');
    
    if (digit.length > 1) {
      // Handle paste or multiple characters
      const digits = digit.split('').slice(0, 5);
      const newCode = [...code];
      digits.forEach((d, i) => {
        if (index + i < 5) {
          newCode[index + i] = d;
        }
      });
      setCode(newCode);
      
      // Focus the last filled box or next empty box
      const lastIndex = Math.min(index + digits.length - 1, 4);
      const nextIndex = Math.min(lastIndex + 1, 4);
      setCurrentFocus(nextIndex);
      
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex].focus();
      }
    } else {
      // Single digit input
      const newCode = [...code];
      newCode[index] = digit;
      setCode(newCode);
      
      // Move to next box if digit entered
      if (digit && index < 4) {
        setCurrentFocus(index + 1);
        if (inputRefs.current[index + 1]) {
          inputRefs.current[index + 1].focus();
        }
      }
    }
  };

  // Handle backspace
  const handleKeyPress = (event, index) => {
    if (event.nativeEvent.key === 'Backspace') {
      if (code[index] === '' && index > 0) {
        // Move to previous box if current is empty
        setCurrentFocus(index - 1);
        if (inputRefs.current[index - 1]) {
          inputRefs.current[index - 1].focus();
        }
      } else {
        // Clear current box
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
      }
    }
  };

  // Auto-submit when code reaches 5 digits
  useEffect(() => {
    const codeString = code.join('');
    if (codeString.length === 5 && !isLoading && !hasVerified && isMountedRef.current) {
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          handleVerifyCode();
        }
      }, 300); // Small delay to ensure user finished typing
      
      return () => clearTimeout(timer);
    }
  }, [code, isLoading, hasVerified]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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

      {/* Verification Form Container */}
      <Animated.View style={[
        styles.formContainer,
        {
          transform: [{ translateY: formContainerTranslateY }]
        }
      ]}>
        {/* Welcome Message */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Verify Your Phone</Text>
          <Text style={styles.subtitleText}>
            We sent a 5-digit code to{'\n'}
            <Text style={styles.phoneNumber}>{phoneNumber}</Text>
          </Text>
          <Text style={styles.emailFallbackText}>
            Didn't receive an SMS? Please check your email inbox for the verification code.
          </Text>
        </View>

        {/* OTP Input Container */}
        <Animated.View style={[
          styles.codeInputContainer,
          {
            transform: [{ translateX: shakeAnimation }]
          }
        ]}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.otpBox,
                currentFocus === index && styles.otpBoxFocused,
                digit !== '' && styles.otpBoxFilled,
                showError && styles.otpBoxError
              ]}
              value={digit}
              onChangeText={(value) => handleInputChange(value, index)}
              onKeyPress={(event) => handleKeyPress(event, index)}
              onFocus={() => setCurrentFocus(index)}
              keyboardType="numeric"
              maxLength={5} // Allow paste
              textAlign="center"
              autoFocus={index === 0}
              selectTextOnFocus
              fontFamily="Nexa-Heavy"
              fontSize={24}
            />
          ))}
        </Animated.View>

        {/* Timer */}
        <View style={styles.timerContainer}>
          {!canResend ? (
            <Text style={styles.timerText}>
              Code expires in {formatTime(timeLeft)}
            </Text>
          ) : (
            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResendCode}
              disabled={isResending}
            >
              <Text style={styles.resendButtonText}>
                {isResending ? 'Sending...' : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.verifyButton, (isLoading || code.length !== 5) && styles.verifyButtonDisabled]}
          onPress={handleVerifyCode}
          disabled={isLoading || code.length !== 5}
        >
          <Text style={styles.verifyButtonText}>
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </Text>
        </TouchableOpacity>

        {/* Back Button */}
        <View style={styles.backContainer}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backLink}>← Back to Registration</Text>
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
    left: 20,
    zIndex: 1,
  },
  logo: {
    width: 150,
    height: 150,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontFamily: 'Nexa-Heavy',
    color: '#333333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666666',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 20,
  },
  phoneNumber: {
    fontFamily: 'Nexa-Heavy',
    color: '#F43332',
  },
  emailFallbackText: {
    fontSize: 12,
    color: '#F43332',
    textAlign: 'center',
    fontFamily: 'Nexa-ExtraLight',
    fontStyle: 'italic',
    marginTop: 5,
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
    alignItems: 'center',
  },
  codeInputContainer: {
    marginBottom: 30,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  otpBox: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: '#DDD',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontFamily: 'Nexa-Heavy',
    color: '#333',
    backgroundColor: '#FFFFFF',
  },
  otpBoxFocused: {
    borderColor: '#F43332',
    borderWidth: 3,
    shadowColor: '#F43332',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  otpBoxFilled: {
    borderColor: '#4CAF50',
    backgroundColor: '#F8FFF8',
  },
  otpBoxError: {
    borderColor: '#FF5722',
    backgroundColor: '#FFF5F5',
  },
  timerContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666666',
    textAlign: 'center',
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonText: {
    fontSize: 14,
    fontFamily: 'Nexa-Heavy',
    color: '#F43332',
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: '#F43332',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  verifyButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Nexa-Heavy',
  },
  backContainer: {
    alignItems: 'center',
  },
  backLink: {
    fontSize: 16,
    fontFamily: 'Nexa-ExtraLight',
    color: '#F43332',
    textDecorationLine: 'underline',
  },
});

export default CodeConfirmation;
