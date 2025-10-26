import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, Alert, StyleSheet, Dimensions, Animated, Keyboard, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;

const CreateAccount1 = ({ regData, onNext, onBack }) => {
  const [local, setLocal] = useState(regData);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation for form container lift
  const formContainerTranslateY = useRef(new Animated.Value(0)).current;
  
  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      Animated.timing(formContainerTranslateY, {
        toValue: -200, // Lift the form container up
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

  // Load saved step 1 data on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('customer_registration_step1');
        if (saved) {
          const parsed = JSON.parse(saved);
          // Merge to preserve any defaults coming from props
          setLocal(prev => ({ ...prev, ...parsed }));
        }
      } catch {}
    })();
  }, []);

  // Persist as user types
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem('customer_registration_step1', JSON.stringify(local));
      } catch {}
    })();
  }, [local]);
  
  const handleNext = () => {
    if (!local.username || !local.firstName || !local.lastName || !local.email || !local.password) {
      Alert.alert('Incomplete', 'Please complete all fields.');
      return;
    }
    if ((local.confirmPassword || '') !== local.password) {
      Alert.alert('Password mismatch', 'Password and Confirm Password must match.');
      return;
    }
    // Ensure latest snapshot is stored before moving on
    try { AsyncStorage.setItem('customer_registration_step1', JSON.stringify(local)); } catch {}
    onNext(local);
  };

  return (
    <View style={styles.createContainer}>
      {/* Background Image */}
      <Image 
        source={require('../assets/createaccountbg.webp')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Dark Overlay */}
      <View style={styles.darkOverlay} />

      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={onBack}
      >
        <Image 
          source={require('../assets/back.png')}
          style={styles.backIcon}
        />
      </TouchableOpacity>

      {/* White Logo */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/sotihorizontal2.png')} 
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
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Welcome Message */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Create Account</Text>
            <Text style={styles.subtitle}>Fill in your details to get started</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.inputsContainer}>
          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.input} 
              placeholder="Username" 
              placeholderTextColor="#999" 
              value={local.username} 
              onChangeText={(t) => setLocal({...local, username: t})} 
              autoCapitalize="none"
              fontFamily="Nexa-ExtraLight"
            />
          </View>
          
          <View style={styles.nameRow}>
            <View style={[styles.inputContainer, styles.nameInputWrapper, { marginRight: 10 }]}>
              <TextInput 
                style={styles.input} 
                placeholder="First name" 
                placeholderTextColor="#999" 
                value={local.firstName} 
                onChangeText={(t) => setLocal({...local, firstName: t})}
                fontFamily="Nexa-ExtraLight"
              />
            </View>
            <View style={[styles.inputContainer, styles.nameInputWrapper]}>
              <TextInput 
                style={styles.input} 
                placeholder="Last name" 
                placeholderTextColor="#999" 
                value={local.lastName} 
                onChangeText={(t) => setLocal({...local, lastName: t})}
                fontFamily="Nexa-ExtraLight"
              />
            </View>
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
              fontFamily="Nexa-ExtraLight"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.input} 
              placeholder="Password" 
              placeholderTextColor="#999" 
              value={local.password} 
              onChangeText={(t) => setLocal({...local, password: t})} 
              secureTextEntry={!showPassword}
              fontFamily="Nexa-ExtraLight"
            />
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

          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.input} 
              placeholder="Confirm password" 
              placeholderTextColor="#999" 
              value={local.confirmPassword || ''} 
              onChangeText={(t) => setLocal({...local, confirmPassword: t})} 
              secureTextEntry={!showConfirmPassword}
              fontFamily="Nexa-ExtraLight"
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Image 
                source={showConfirmPassword ? require('../assets/hide.png') : require('../assets/eye.png')}
                style={styles.eyeIcon}
              />
            </TouchableOpacity>
          </View>
          </View>

          {/* Next Button */}
          <TouchableOpacity 
            style={[styles.nextButton, isLoading && styles.nextButtonDisabled]} 
            onPress={handleNext}
            disabled={isLoading}
          >
            <Text style={styles.nextButtonText}>
              {isLoading ? 'Processing...' : 'Next'}
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={styles.footer}>© 2025 Soti Delivery. All rights reserved.</Text>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  createContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  backgroundImage: {
    position: 'absolute',
    top: -90,
    bottom: 30,
    left: 0,
    width: width,
    height: '50%',
    zIndex: 0,
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 30,
    left: 0,
    width: width,
    height: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 0.5,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 3,
    padding: 10,
  },
  backIcon: {
    width: 32,
    height: 32,
  },
  logoContainer: {
    position: 'absolute',
    top: isSmallScreen ? 20 : 40,
    right: 20,
    zIndex: 1,
  },
  logo: {
    width: width * 0.35,
    maxWidth: 150,
    height: width * 0.35,
    maxHeight: 150,
    resizeMode: 'contain',
  },
  formContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 44,
    borderTopRightRadius: 44,
    paddingHorizontal: isSmallScreen ? 20 : 30,
    paddingTop: isSmallScreen ? 20 : 30,
    paddingBottom: isSmallScreen ? 10 : 10,
    maxHeight: height * 0.75,
    minHeight: isSmallScreen ? height * 0.7 : 650,
    zIndex: 2,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  welcomeContainer: {
    alignItems: 'left',
    marginBottom: isSmallScreen ? 20 : 30,
  },
  welcomeTitle: {
    fontSize: isSmallScreen ? 24 : 28,
    fontFamily: 'Nexa-ExtraLight',
    color: '#333',
    marginBottom: 0,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: isSmallScreen ? 14 : 16,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666',
    textAlign: 'left',
  },
  inputsContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nameInputWrapper: {
    flex: 1,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: isSmallScreen ? 12 : 16,
    fontSize: isSmallScreen ? 14 : 16,
    backgroundColor: '#FFFFFF',
    color: '#000000',
    fontFamily: 'Nexa-ExtraLight',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: isSmallScreen ? 12 : 16,
    padding: 4,
  },
  eyeIcon: {
    width: 20,
    height: 20,
  },
  nextButton: {
    backgroundColor: '#F43332',
    borderRadius: 12,
    paddingVertical: isSmallScreen ? 14 : 16,
    alignItems: 'center',
    marginTop: isSmallScreen ? 15 : 20,
  },
  nextButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
  },
  footer: {
    fontSize: isSmallScreen ? 10 : 11,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666',
    textAlign: 'center',
    marginTop: isSmallScreen ? 10 : 15,
    marginBottom: 10,
  },
});

export default CreateAccount1;