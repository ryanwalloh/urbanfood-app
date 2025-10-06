import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { Animated, View } from 'react-native';
import * as Font from 'expo-font';
import RiderMainPage from './components/RiderMainPage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LandingPage from './components/LandingPage';
import RiderLoginForm from './components/RiderLoginForm';
import CreateAccount1 from './components/CreateAccount1';
import CreateAccount2 from './components/CreateAccount2';
import CodeConfirmation from './components/CodeConfirmation';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [fadeAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [userData, setUserData] = useState(null);
  const [verificationData, setVerificationData] = useState(null);

  useEffect(() => {
    // Load fonts first
    const loadFonts = async () => {
      try {
        await Font.loadAsync({
          'Nexa-Heavy': require('./assets/fonts/Nexa-Heavy.ttf'),
          'Nexa-ExtraLight': require('./assets/fonts/Nexa-ExtraLight.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.log('Error loading fonts:', error);
        setFontsLoaded(true); // Continue even if fonts fail to load
      }
    };

    loadFonts();
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return;
    
    // Check if rider is already logged in
    const checkExistingSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('rider:user');
        if (storedUser) {
          console.log('Found existing rider session:', storedUser);
          setCurrentScreen('main');
          return;
        }
      } catch (error) {
        console.log('Error checking session:', error);
      }
      
      // Auto transition to login after 2 seconds if no session
      const timer = setTimeout(() => {
        transitionToLogin();
      }, 2000);

      return () => clearTimeout(timer);
    };

    checkExistingSession();
  }, [fontsLoaded]);

  const transitionToLogin = () => {
    // Fade out landing page and slide in login page
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentScreen('login');
    });
  };

  const handleLoginSuccess = async (userData) => {
    console.log('Rider login successful:', userData);
    setCurrentScreen('main');
  };

  const handleCreateAccount = () => {
    console.log('Create rider account');
    setCurrentScreen('create1');
  };

  const handleCreateAccountNext = (data) => {
    console.log('Create account step 1 data:', data);
    setUserData(data);
    setCurrentScreen('create2');
  };

  const handleCreateAccountBack = () => {
    if (currentScreen === 'create2') {
      setCurrentScreen('create1');
    } else if (currentScreen === 'create1') {
      setCurrentScreen('login');
    }
  };

  const handleCreateAccountComplete = (verificationData) => {
    console.log('Verification data:', verificationData);
    setVerificationData(verificationData);
    setCurrentScreen('code-confirmation');
  };

  const handleVerificationSuccess = (userData) => {
    console.log('Verification successful:', userData);
    // Store user data and redirect to login
    setCurrentScreen('login');
    // Clear verification data
    setVerificationData(null);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('rider:user');
    setCurrentScreen('login');
  };

  // Don't render anything until fonts are loaded
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <>
      {currentScreen === 'landing' && (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <LandingPage />
        </Animated.View>
      )}
      
      {currentScreen === 'login' && (
        <Animated.View 
          style={{ 
            flex: 1, 
            transform: [{ 
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              })
            }],
            opacity: slideAnim,
          }}
        >
          <RiderLoginForm 
            onLoginSuccess={handleLoginSuccess}
            onCreateAccount={handleCreateAccount}
          />
        </Animated.View>
      )}

      {currentScreen === 'create1' && (
        <CreateAccount1 
          onNext={handleCreateAccountNext}
          onBack={handleCreateAccountBack}
        />
      )}

      {currentScreen === 'create2' && (
        <CreateAccount2 
          userData={userData}
          onBack={handleCreateAccountBack}
        />
      )}

      {currentScreen === 'main' && (
        <RiderMainPage onLogout={handleLogout} />
      )}
      
      <StatusBar style="light" />
    </>
  );
}
