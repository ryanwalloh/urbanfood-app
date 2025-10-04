import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { Animated } from 'react-native';
import RiderMainPage from './components/RiderMainPage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LandingPage from './components/LandingPage';
import RiderLoginForm from './components/RiderLoginForm';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [fadeAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
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
  }, []);

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
    // TODO: Navigate to create account page
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('rider:user');
    setCurrentScreen('login');
  };

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

      {currentScreen === 'main' && (
        <RiderMainPage onLogout={handleLogout} />
      )}
      
      <StatusBar style="light" />
    </>
  );
}
