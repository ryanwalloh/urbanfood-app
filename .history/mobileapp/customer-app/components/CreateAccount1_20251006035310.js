import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, Alert, StyleSheet, Dimensions, Animated, Keyboard } from 'react-native';

const { width } = Dimensions.get('window');

const CreateAccount1 = ({ regData, onNext }) => {
  const [local, setLocal] = useState(regData);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation for form container lift
  const formContainerTranslateY = useRef(new Animated.Value(0)).current;
  
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
  
  const handleNext = () => {
    if (!local.username || !local.firstName || !local.lastName || !local.email || !local.password) {
      Alert.alert('Incomplete', 'Please complete all fields.');
      return;
    }
    onNext(local);
  };

  return (
    <View style={styles.createContainer}>
      {/* Background Image */}
      <Image 
        source={require('../assets/createaccountbg.png')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Dark Overlay */}
      <View style={styles.darkOverlay} />

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
          
          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.input} 
              placeholder="First name" 
              placeholderTextColor="#999" 
              value={local.firstName} 
              onChangeText={(t) => setLocal({...local, firstName: t})}
              fontFamily="Nexa-ExtraLight"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.input} 
              placeholder="Last name" 
              placeholderTextColor="#999" 
              value={local.lastName} 
              onChangeText={(t) => setLocal({...local, lastName: t})}
              fontFamily="Nexa-ExtraLight"
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
    top: 0,
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
    minHeight: 600,
    zIndex: 2,
  },
  welcomeContainer: {
    alignItems: 'left',
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 28,
    fontFamily: 'Nexa-ExtraLight',
    color: '#333',
    marginBottom: 0,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666',
    textAlign: 'left',
  },
  inputsContainer: {
    flex: 1,
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
    backgroundColor: '#FFFFFF',
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
  },
  nextButton: {
    backgroundColor: '#F43332',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  nextButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateAccount1;