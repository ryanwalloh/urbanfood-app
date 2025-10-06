import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, StyleSheet, Dimensions, Animated, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';

const { width } = Dimensions.get('window');

// Props expected:
// - email (string): where the code was sent (for display)
// - onVerifyCode: async (codeString) => { success: boolean, error?: string }
// - onResend: async () => { success: boolean, error?: string }
// - onSuccess: (optional) callback when verified and countdown completes
// - onBack: () => void
const CustomerCodeConfirmation = ({ email, onVerifyCode, onResend, onSuccess, onBack }) => {
  const [code, setCode] = useState(['', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // seconds
  const [canResend, setCanResend] = useState(false);
  const [hasVerified, setHasVerified] = useState(false);
  const [currentFocus, setCurrentFocus] = useState(0);
  const [showError, setShowError] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  const isMountedRef = useRef(true);
  const countdownTimerRef = useRef(null);
  const inputRefs = useRef([]);

  const formContainerTranslateY = useRef(new Animated.Value(0)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // Timer for resend
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  // Keyboard lift animation
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => {
      Animated.timing(formContainerTranslateY, { toValue: -260, duration: 250, useNativeDriver: true }).start();
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(formContainerTranslateY, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    });
    return () => { show?.remove(); hide?.remove(); };
  }, [formContainerTranslateY]);

  const triggerShakeAnimation = () => {
    setShowError(true);
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start(() => setShowError(false));
  };

  const resetCode = () => {
    setCode(['', '', '', '', '']);
    setCurrentFocus(0);
    setShowError(false);
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  };

  const handleVerifyCode = async () => {
    const codeString = code.join('');
    if (!codeString || codeString.length !== 5) {
      Alert.alert('Error', 'Please enter a valid 5-digit code');
      return;
    }
    if (isLoading || hasVerified || !isMountedRef.current) return;
    setIsLoading(true);
    try {
      const result = await onVerifyCode?.(codeString);
      const ok = result?.success === true;
      if (ok) {
        setHasVerified(true);
        setVerifiedSuccess(true);
        setRedirectCountdown(5);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = setInterval(() => {
          setRedirectCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownTimerRef.current);
              onSuccess?.();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        triggerShakeAnimation();
        resetCode();
        Alert.alert('Error', result?.error || 'Verification failed');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    setIsResending(true);
    try {
      const result = await onResend?.();
      if (result?.success) {
        setTimeLeft(300);
        setCanResend(false);
        setCode(['', '', '', '', '']);
        Alert.alert('Success', 'New verification code sent!');
      } else {
        Alert.alert('Error', result?.error || 'Failed to resend code');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleInputChange = (value, index) => {
    const digit = value.replace(/[^0-9]/g, '');
    if (digit.length > 1) {
      const digits = digit.split('').slice(0, 5);
      const newCode = [...code];
      digits.forEach((d, i) => { if (index + i < 5) newCode[index + i] = d; });
      setCode(newCode);
      const lastIndex = Math.min(index + digits.length - 1, 4);
      const nextIndex = Math.min(lastIndex + 1, 4);
      setCurrentFocus(nextIndex);
      inputRefs.current[nextIndex]?.focus();
    } else {
      const newCode = [...code];
      newCode[index] = digit;
      setCode(newCode);
      if (digit && index < 4) {
        setCurrentFocus(index + 1);
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (event, index) => {
    if (event.nativeEvent.key === 'Backspace') {
      if (code[index] === '' && index > 0) {
        setCurrentFocus(index - 1);
        inputRefs.current[index - 1]?.focus();
      } else {
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
      const timer = setTimeout(() => { if (isMountedRef.current) handleVerifyCode(); }, 300);
      return () => clearTimeout(timer);
    }
  }, [code, isLoading, hasVerified]);

  if (verifiedSuccess) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          {/* Using an existing customer asset here */}
          <Image source={require('../assets/delivered.png')} style={styles.successIcon} resizeMode="contain" />
          <Text style={styles.successTitle}>Verified Successfully</Text>
          <Text style={styles.successSubtitle}>Redirecting in {redirectCountdown}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Image (reuse customer create background if available) */}
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
          source={require('../assets/sotihorizontal2.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Verification Form Container */}
      <Animated.View style={[styles.formContainer, { transform: [{ translateY: formContainerTranslateY }] }]}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Verify Your Email</Text>
          <Text style={styles.subtitleText}>
            We sent a 5-digit code to{`\n`}
            <Text style={styles.emailText}>{email}</Text>
          </Text>
        </View>

        <Animated.View style={[styles.codeInputContainer, { transform: [{ translateX: shakeAnimation }] }]}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[
                styles.otpBox,
                currentFocus === index && styles.otpBoxFocused,
                digit !== '' && styles.otpBoxFilled,
                showError && styles.otpBoxError,
              ]}
              value={digit}
              onChangeText={(value) => handleInputChange(value, index)}
              onKeyPress={(event) => handleKeyPress(event, index)}
              onFocus={() => setCurrentFocus(index)}
              keyboardType="numeric"
              maxLength={5}
              textAlign="center"
              autoFocus={index === 0}
              selectTextOnFocus
            />
          ))}
        </Animated.View>

        <View style={styles.timerContainer}>
          {!canResend ? (
            <Text style={styles.timerText}>Code expires in {formatTime(timeLeft)}</Text>
          ) : (
            <TouchableOpacity style={styles.resendButton} onPress={handleResendCode} disabled={isResending}>
              <Text style={styles.resendButtonText}>{isResending ? 'Sending...' : 'Resend Code'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, (isLoading || code.length !== 5) && styles.verifyButtonDisabled]}
          onPress={handleVerifyCode}
          disabled={isLoading || code.length !== 5}
        >
          <Text style={styles.verifyButtonText}>{isLoading ? 'Verifying...' : 'Verify Code'}</Text>
        </TouchableOpacity>

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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  successIcon: { width: 120, height: 120, marginBottom: 24 },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  successSubtitle: { fontSize: 16, color: '#666' },
  backgroundImage: { position: 'absolute', top: 0, left: 0, width: width, height: '75%', zIndex: 0 },
  darkOverlay: { position: 'absolute', top: 0, left: 0, width: width, height: '75%', backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 0.5 },
  logoContainer: { position: 'absolute', top: 10, right: 20, zIndex: 1 },
  logo: { width: 150, height: 150 },
  welcomeContainer: { alignItems: 'center', marginBottom: 40 },
  welcomeText: { fontSize: 24, color: '#333333', marginBottom: 10, textAlign: 'center' },
  subtitleText: { fontSize: 14, color: '#666666', textAlign: 'center', opacity: 0.9, lineHeight: 20 },
  emailText: { color: '#F43332' },
  formContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', borderTopLeftRadius: 44, borderTopRightRadius: 44, paddingHorizontal: 30, paddingTop: 30, paddingBottom: 40, minHeight: 400, alignItems: 'center' },
  codeInputContainer: { marginBottom: 30, width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  otpBox: { width: 50, height: 60, borderWidth: 1, borderColor: '#DDD', borderRadius: 12, textAlign: 'center', fontSize: 24, color: '#333', backgroundColor: '#FFFFFF' },
  otpBoxFocused: { borderColor: '#F43332', borderWidth: 2, shadowColor: '#F43332', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  otpBoxFilled: { borderColor: '#4CAF50', backgroundColor: '#F8FFF8' },
  otpBoxError: { borderColor: '#FF5722', backgroundColor: '#FFF5F5' },
  timerContainer: { marginBottom: 30, alignItems: 'center' },
  timerText: { fontSize: 14, color: '#666666', textAlign: 'center' },
  resendButton: { paddingVertical: 8, paddingHorizontal: 16 },
  resendButtonText: { fontSize: 14, color: '#F43332', textAlign: 'center' },
  verifyButton: { backgroundColor: '#F43332', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 40, alignItems: 'center', marginBottom: 20, width: '100%' },
  verifyButtonDisabled: { backgroundColor: '#B0B0B0' },
  verifyButtonText: { color: '#FFFFFF', fontSize: 18 },
  backContainer: { alignItems: 'center' },
  backLink: { fontSize: 16, color: '#F43332', textDecorationLine: 'underline' },
});

export default CustomerCodeConfirmation;


