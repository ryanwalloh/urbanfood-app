import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  View, 
  Image, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Animated,
  Dimensions,
  Easing,
  Alert,
  AppState
} from 'react-native';
import { Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Font from 'expo-font';
import { useState, useEffect, useCallback, useRef, memo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './services/api';
import API_CONFIG from './config/apiConfig';
import MainPage from './components/MainPage';
import WelcomePage from './components/WelcomePage';
import LoginPage from './components/LoginPage';
import CreateAccount1 from './components/CreateAccount1';
import CreateAccount2 from './components/CreateAccount2';
import CustomerCodeConfirmation from './components/CustomerCodeConfirmation';
import OnboardingPage1 from './components/OnboardingPage1';
import OnboardingPage2 from './components/OnboardingPage2';
import OnboardingPage3 from './components/OnboardingPage3';

const { width, height } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = API_CONFIG.GOOGLE_MAPS_API_KEY;

// Independent LoginForm component with its own state

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [currentPage, setCurrentPage] = useState('landing'); // 'landing', 'welcome', 'login', 'create1', 'create2', 'verify', 'onboarding1', 'main'
  const [user, setUser] = useState(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  // Verification state
  const [verificationData, setVerificationData] = useState(null);
  // Registration form temp state (step 1)
  const [regData, setRegData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  // Address selection (step 2)
  const [addressData, setAddressData] = useState({
    street: '',
    barangay: '',
    note: '',
    label: 'home',
    latitude: null,
    longitude: null,
  });

  // Animation values - using useRef to prevent recreation on every render
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const logoScaleAnim = useRef(new Animated.Value(1)).current;
  const logoPositionAnim = useRef(new Animated.Value(0)).current;
  const loginFadeAnim = useRef(new Animated.Value(0)).current;
  const loginLogoAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Load fonts and check for existing session
    const loadFonts = async () => {
      try {
        await Font.loadAsync({
          'Nexa-Heavy': require('./assets/fonts/Nexa-Heavy.ttf'),
          'Nexa-ExtraLight': require('./assets/fonts/Nexa-ExtraLight.ttf'),
          'bgtext': require('./assets/fonts/bgtext.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.log('Error loading fonts:', error);
        setFontsLoaded(true); // Continue even if fonts fail to load
      }
    };

    const loadSession = async () => {
      try {
        const sessionData = await AsyncStorage.getItem('user_session');
        if (sessionData) {
          const userData = JSON.parse(sessionData);
          console.log('📱 Loaded existing session:', userData);
          setUser(userData);
          setCurrentPage('main');
        }
      } catch (error) {
        console.log('Error loading session:', error);
      }
    };

    loadFonts();
    loadSession();
  }, []);

  // Add AppState listener to restore session when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        // App came to foreground, restore session if user is null
        if (!user) {
          try {
            const sessionData = await AsyncStorage.getItem('user_session');
            if (sessionData) {
              const userData = JSON.parse(sessionData);
              console.log('🔄 App resumed - restored session:', userData);
              setUser(userData);
              setCurrentPage('main');
            }
          } catch (error) {
            console.log('Error restoring session on resume:', error);
          }
        }
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [user]);

  useEffect(() => {
    if (!fontsLoaded) return;
    
    // Start transition after 2 seconds
    const timer = setTimeout(() => {
      // Fade out landing page
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // After landing page fades out, switch to welcome page
        setShowLanding(false);
        setCurrentPage('welcome');
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [fontsLoaded]);

  // Handle successful login
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentPage('main');
  };

  // Handle successful registration
  const handleRegistrationSuccess = (userData) => {
    if (userData.pendingVerification) {
      // Navigate to verification screen
      setVerificationData(userData);
      setCurrentPage('verify');
    } else {
      // Direct success (legacy flow)
      setUser(userData);
      setCurrentPage('onboarding1');
    }
  };

  // Handle verification success
  const handleVerificationSuccess = async () => {
    try {
      // Load the user session that was stored during verification
      const sessionData = await AsyncStorage.getItem('user_session');
      if (sessionData) {
        const userData = JSON.parse(sessionData);
        console.log('✅ Verification success - loaded user session:', userData);
        setUser(userData);
        setCurrentPage('onboarding1');
      } else {
        console.log('❌ No session found after verification');
        setCurrentPage('onboarding1');
      }
    } catch (error) {
      console.log('Error loading session after verification:', error);
      setCurrentPage('onboarding1');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      // Clear the session from AsyncStorage
      await AsyncStorage.removeItem('user_session');
      console.log('🚪 User logged out, session cleared');
    } catch (error) {
      console.log('Error clearing session:', error);
    }
    setUser(null);
    setCurrentPage('landing');
    setShowLanding(true);
    setShowLogin(false);
    // Reset landing page animation
    fadeAnim.setValue(1);
  };

  const openCreateAccount = () => setCurrentPage('create1');
  
  const handleGetStarted = () => setCurrentPage('login');

  const LandingPage = () => (
    <Animated.View style={[styles.landingContainer, { opacity: fadeAnim }]}>
      <Animated.View style={[
        styles.logoContainer,
        {
          transform: [
            { scale: logoScaleAnim },
            { translateY: logoPositionAnim }
          ]
        }
      ]}>
        <Image 
          source={require('./assets/sotilogored.png')} 
          style={styles.landingLogo}
          resizeMode="contain"
        />
      </Animated.View>
    </Animated.View>
  );






  // Don't render anything until fonts are loaded
  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {currentPage === 'landing' && showLanding && <LandingPage />}
      {currentPage === 'welcome' && <WelcomePage onGetStarted={handleGetStarted} onCreateAccount={openCreateAccount} />}
      {currentPage === 'login' && <LoginPage onLoginSuccess={handleLoginSuccess} onCreateAccount={openCreateAccount} />}
      {currentPage === 'create1' && <CreateAccount1 regData={regData} onNext={(data) => { setRegData(data); setCurrentPage('create2'); }} />}
      {currentPage === 'create2' && <CreateAccount2 regData={regData} addressData={addressData} onSuccess={handleRegistrationSuccess} />}
      {currentPage === 'verify' && verificationData && (
        <CustomerCodeConfirmation 
          email={verificationData.userData.email}
          verificationId={verificationData.verificationId}
          userData={verificationData.userData}
          onSuccess={handleVerificationSuccess}
          onBack={() => setCurrentPage('create2')}
        />
      )}
      {currentPage === 'onboarding1' && <OnboardingPage1 onNext={() => setCurrentPage('onboarding2')} />}
      {currentPage === 'onboarding2' && <OnboardingPage2 onBack={() => setCurrentPage('onboarding1')} onNext={() => setCurrentPage('onboarding3')} />}
      {currentPage === 'onboarding3' && <OnboardingPage3 onBack={() => setCurrentPage('onboarding2')} onGetStarted={() => setCurrentPage('main')} />}
      {currentPage === 'main' && <MainPage user={user} onLogout={handleLogout} />}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  // Landing Page Styles
  landingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  landingLogo: {
    width: 200,
    height: 200,
  },
  // Login Page Styles
  loginContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  loginLogoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  loginLogo: {
    width: 80,
    height: 80,
  },
  loginLogoLarge: {
    width: 150,
    height: 150,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  loginTitle: {
    fontSize: 18,
    color: '#666',
  },
  
});
