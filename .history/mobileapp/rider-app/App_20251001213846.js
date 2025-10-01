import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { Animated } from 'react-native';
import LandingPage from './components/LandingPage';
import RiderLoginForm from './components/RiderLoginForm';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [fadeAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Auto transition to login after 2 seconds
    const timer = setTimeout(() => {
      transitionToLogin();
    }, 2000);

    return () => clearTimeout(timer);
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

  const handleLoginSuccess = (userData) => {
    console.log('Rider login successful:', userData);
    // TODO: Navigate to rider dashboard
  };

  const handleCreateAccount = () => {
    console.log('Create rider account');
    // TODO: Navigate to create account page
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
      
      <StatusBar style="light" />
    </>
  );
}
