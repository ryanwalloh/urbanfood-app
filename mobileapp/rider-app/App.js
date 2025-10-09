import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { Animated, View, AppState } from 'react-native';
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

  // Add AppState listener to save/restore state when app is backgrounded/foregrounded
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'background') {
        // App going to background - save current state
        try {
          const appState = {
            currentScreen,
          };
          await AsyncStorage.setItem('rider:app_state', JSON.stringify(appState));
          console.log('💾 Saved rider app state:', appState);
        } catch (error) {
          console.log('Error saving app state:', error);
        }
      } else if (nextAppState === 'active' && currentScreen === 'landing') {
        // App came to foreground, check for existing session
        try {
          const storedUser = await AsyncStorage.getItem('rider:user');
          const appState = await AsyncStorage.getItem('rider:app_state');
          
          if (storedUser) {
            console.log('🔄 App resumed - restored rider session');
            
            // Restore app state
            if (appState) {
              const state = JSON.parse(appState);
              console.log('🔄 Restored rider app state:', state);
              setCurrentScreen(state.currentScreen || 'main');
            } else {
              setCurrentScreen('main');
            }
          }
        } catch (error) {
          console.log('Error restoring session on resume:', error);
        }
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [currentScreen]);

  useEffect(() => {
    if (!fontsLoaded) return;
    
    // Check if rider is already logged in and restore app state
    const checkExistingSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('rider:user');
        const appState = await AsyncStorage.getItem('rider:app_state');
        
        if (storedUser) {
          console.log('Found existing rider session:', storedUser);
          
          // Restore app state if it exists
          if (appState) {
            const state = JSON.parse(appState);
            console.log('🔄 Restoring rider app state:', state);
            setCurrentScreen(state.currentScreen || 'main');
          } else {
            setCurrentScreen('main');
          }
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

  const handleVerificationSuccess = async (userData) => {
    console.log('Verification successful:', userData);
    
    // Store user data in AsyncStorage for login
    try {
      await AsyncStorage.setItem('rider:user', JSON.stringify(userData));
      console.log('✅ User data stored for login');
    } catch (error) {
      console.error('❌ Error storing user data:', error);
    }
    
    // Clear verification data
    setVerificationData(null);
    
    // Redirect to main page (rider is now logged in)
    setCurrentScreen('main');
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
          onCreateAccount={handleCreateAccountComplete}
        />
      )}

      {currentScreen === 'code-confirmation' && verificationData && (
        <CodeConfirmation 
          verificationId={verificationData.verificationId}
          phoneNumber={verificationData.phoneNumber}
          onVerificationSuccess={handleVerificationSuccess}
          onBack={() => setCurrentScreen('create2')}
        />
      )}

      {currentScreen === 'main' && (
        <RiderMainPage onLogout={handleLogout} />
      )}
      
      <StatusBar style="light" />
    </>
  );
}
