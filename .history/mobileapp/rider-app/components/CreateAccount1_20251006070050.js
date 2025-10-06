import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, StyleSheet, Dimensions, Animated, Keyboard } from 'react-native';

const { width } = Dimensions.get('window');

const CreateAccount1 = ({ onNext, onBack }) => {
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation for form container lift
  const formContainerTranslateY = useRef(new Animated.Value(0)).current;
  
  // Animation values for floating labels
  const usernameLabelAnimation = useRef(new Animated.Value(0)).current;
  const firstNameLabelAnimation = useRef(new Animated.Value(0)).current;
  const lastNameLabelAnimation = useRef(new Animated.Value(0)).current;
  const emailLabelAnimation = useRef(new Animated.Value(0)).current;
  
  // Focus states
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

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

  const handleUsernameFocus = () => {
    setUsernameFocused(true);
    animateLabelUp(usernameLabelAnimation);
  };

  const handleUsernameBlur = () => {
    setUsernameFocused(false);
    if (!username) {
      animateLabelDown(usernameLabelAnimation);
    }
  };

  const handleFirstNameFocus = () => {
    setFirstNameFocused(true);
    animateLabelUp(firstNameLabelAnimation);
  };

  const handleFirstNameBlur = () => {
    setFirstNameFocused(false);
    if (!firstName) {
      animateLabelDown(firstNameLabelAnimation);
    }
  };

  const handleLastNameFocus = () => {
    setLastNameFocused(true);
    animateLabelUp(lastNameLabelAnimation);
  };

  const handleLastNameBlur = () => {
    setLastNameFocused(false);
    if (!lastName) {
      animateLabelDown(lastNameLabelAnimation);
    }
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

  // Keyboard event listeners
  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      Animated.timing(formContainerTranslateY, {
        toValue: -150,
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

  const handleNext = () => {
    if (!username || !firstName || !lastName || !email) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    const userData = {
      username,
      firstName,
      lastName,
      email,
    };

    onNext(userData);
  };

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image 
        source={require('../assets/loginbg1.png')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Dark Overlay */}
      <View style={styles.darkOverlay} />
      
      {/* Header with Logo */}
      <View style={styles.header}>
        <Image 
          source={require('../assets/loginlogo.png')} 
          style={styles.logo}
          resizeMode="cover"
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
          <Text style={styles.welcomeText}>Create Account</Text>
          <Text style={styles.subtitleText}>Let's setup your account and start earning</Text>
        </View>

        {/* Username Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder=""
            placeholderTextColor="#999"
            value={username}
            onChangeText={setUsername}
            onFocus={handleUsernameFocus}
            onBlur={handleUsernameBlur}
            autoCapitalize="none"
            autoCorrect={false}
            blurOnSubmit={false}
            returnKeyType="next"
          />
          <Animated.Text style={[
            styles.floatingLabel,
            {
              top: usernameLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [16, -8],
              }),
              fontSize: usernameLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 12],
              }),
              color: usernameLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', '#666'],
              }),
              borderWidth: usernameLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
              borderColor: usernameLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', '#666'],
              }),
              borderRadius: usernameLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 8],
              }),
              paddingHorizontal: usernameLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 4],
              }),
              backgroundColor: usernameLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', '#fff'],
              }),
            }
          ]}>
            Username
          </Animated.Text>
        </View>

        {/* First Name Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder=""
            placeholderTextColor="#999"
            value={firstName}
            onChangeText={setFirstName}
            onFocus={handleFirstNameFocus}
            onBlur={handleFirstNameBlur}
            autoCapitalize="words"
            autoCorrect={false}
            blurOnSubmit={false}
            returnKeyType="next"
          />
          <Animated.Text style={[
            styles.floatingLabel,
            {
              top: firstNameLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [16, -8],
              }),
              fontSize: firstNameLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 12],
              }),
              color: firstNameLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', '#666'],
              }),
              borderWidth: firstNameLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
              borderColor: firstNameLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', '#666'],
              }),
              borderRadius: firstNameLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 8],
              }),
              paddingHorizontal: firstNameLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 4],
              }),
              backgroundColor: firstNameLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', '#fff'],
              }),
            }
          ]}>
            First Name
          </Animated.Text>
        </View>

        {/* Last Name Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder=""
            placeholderTextColor="#999"
            value={lastName}
            onChangeText={setLastName}
            onFocus={handleLastNameFocus}
            onBlur={handleLastNameBlur}
            autoCapitalize="words"
            autoCorrect={false}
            blurOnSubmit={false}
            returnKeyType="next"
          />
          <Animated.Text style={[
            styles.floatingLabel,
            {
              top: lastNameLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [16, -8],
              }),
              fontSize: lastNameLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 12],
              }),
              color: lastNameLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', '#666'],
              }),
              borderWidth: lastNameLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
              borderColor: lastNameLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', '#666'],
              }),
              borderRadius: lastNameLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 8],
              }),
              paddingHorizontal: lastNameLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 4],
              }),
              backgroundColor: lastNameLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', '#fff'],
              }),
            }
          ]}>
            Last Name
          </Animated.Text>
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder=""
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            onFocus={handleEmailFocus}
            onBlur={handleEmailBlur}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            blurOnSubmit={false}
            returnKeyType="done"
            onSubmitEditing={handleNext}
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
              borderWidth: emailLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
              borderColor: emailLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', '#666'],
              }),
              borderRadius: emailLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 8],
              }),
              paddingHorizontal: emailLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 4],
              }),
              backgroundColor: emailLabelAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', '#fff'],
              }),
            }
          ]}>
            Email
          </Animated.Text>
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

        {/* Back to Login */}
        <View style={styles.backToLoginContainer}>
          <Text style={styles.backToLoginText}>Already have an account? </Text>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backToLoginLink}>Sign In</Text>
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
  header: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 60,
    zIndex: 1,
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
    fontSize: 28,
    fontFamily: 'Nexa-Heavy',
    color: '#FFFFFF',
    marginBottom: 0,
    textAlign: 'left',
  },
  subtitleText: {
    fontSize: 16,
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
    paddingTop: 50,
    paddingBottom: 40,
    minHeight: 500,
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
  nextButton: {
    backgroundColor: '#EEEEEE',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  nextButtonDisabled: {
    opacity: 0.7,
  },
  nextButtonText: {
    color: '#F43332',
    fontSize: 18,
    fontFamily: 'Nexa-Heavy',
  },
  backToLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backToLoginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Nexa-ExtraLight',
  },
  backToLoginLink: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Nexa-Heavy',
    textDecorationLine: 'underline',
  },
});

export default CreateAccount1;
