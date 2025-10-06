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
  Alert
} from 'react-native';
import { Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Font from 'expo-font';
import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { apiService } from './services/api';
import MainPage from './components/MainPage';
import WelcomePage from './components/WelcomePage';
import LoginPage from './components/LoginPage';
import CreateAccount1 from './components/CreateAccount1';
import CreateAccount2 from './components/CreateAccount2';
import OnboardingPage1 from './components/OnboardingPage1';
import OnboardingPage2 from './components/OnboardingPage2';
import OnboardingPage3 from './components/OnboardingPage3';

const { width, height } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = 'AIzaSyCCuDLJMhB-23kQiXYpXwi-yYGvKz7OgSQ';

// Independent LoginForm component with its own state

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [currentPage, setCurrentPage] = useState('landing'); // 'landing', 'welcome', 'login', 'create1', 'create2', 'onboarding1', 'main'
  const [user, setUser] = useState(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
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
    // Load fonts first
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

    loadFonts();
  }, []);

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
    setUser(userData);
    setCurrentPage('onboarding1');
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
    setCurrentPage('landing');
    setShowLanding(true);
    setShowLogin(false);
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
      {currentPage === 'welcome' && <WelcomePage onGetStarted={handleGetStarted} />}
      {currentPage === 'login' && <LoginPage onLoginSuccess={handleLoginSuccess} onCreateAccount={openCreateAccount} />}
      {currentPage === 'create1' && <CreateAccount1 regData={regData} onNext={(data) => { setRegData(data); setCurrentPage('create2'); }} />}
      {currentPage === 'create2' && <CreateAccount2 regData={regData} addressData={addressData} onSuccess={handleRegistrationSuccess} />}
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
