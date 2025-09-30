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
import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { apiService } from './services/api';

const { width, height } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = 'AIzaSyCCuDLJMhB-23kQiXYpXwi-yYGvKz7OgSQ';

// Independent LoginForm component with its own state
const LoginForm = ({ onLoginSuccess, onCreateAccount }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiService.login(email, password);
      
      if (result.success) {
        if (result.redirect_url && result.redirect_url.includes('customer')) {
          onLoginSuccess(email);
          Alert.alert('Success', 'Welcome to SotiDelivery!');
        } else {
          Alert.alert('Error', 'This app is for customers only. Please use the appropriate app for your role.');
        }
      } else {
        Alert.alert('Login Failed', result.error || result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.formContainer}>
      {/* Email Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          blurOnSubmit={false}
          returnKeyType="next"
        />
        <Text style={styles.floatingLabel}>Email</Text>
      </View>

      {/* Password Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCorrect={false}
          blurOnSubmit={false}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />
        <Text style={styles.floatingLabel}>Password</Text>
        <TouchableOpacity 
          style={styles.eyeButton}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Image 
            source={showPassword ? require('./assets/hide.png') : require('./assets/eye.png')}
            style={styles.eyeIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Remember Me & Forgot Password */}
      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={styles.rememberMeContainer}
          onPress={() => setRememberMe(!rememberMe)}
        >
          <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
            {rememberMe && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.rememberMeText}>Remember me</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      {/* Login Button */}
      <TouchableOpacity 
        style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.loginButtonText}>
          {isLoading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>

      {/* Google Login */}
      <TouchableOpacity style={styles.googleButton}>
        <Image 
          source={require('./assets/googlelogo.png')}
          style={styles.googleIcon}
        />
        <Text style={styles.googleButtonText}>Login with Google</Text>
      </TouchableOpacity>

      {/* Create Account */}
      <View style={styles.createAccountContainer}>
        <Text style={styles.createAccountText}>
          Don't have an account yet?{' '}
          <Text style={styles.createAccountLink} onPress={onCreateAccount}>Create Account</Text>
        </Text>
      </View>
    </View>
  );
};

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [currentPage, setCurrentPage] = useState('landing'); // 'landing', 'login', 'create1', 'create2', 'onboarding1', 'main'
  const [user, setUser] = useState(null);
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
    // Start transition after 2 seconds
    const timer = setTimeout(() => {
      // Fade out landing page
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // After landing page fades out, switch to login page
        setShowLanding(false);
        setShowLogin(true);
        setCurrentPage('login');
        
        // No animation needed - logo will be positioned normally
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Handle successful login
  const handleLoginSuccess = (email) => {
    setUser({ email: email, role: 'customer' });
    setCurrentPage('main');
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
    setCurrentPage('landing');
    setShowLanding(true);
    setShowLogin(false);
  };

  const openCreateAccount = () => setCurrentPage('create1');

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
          source={require('./assets/sotilogo.png')} 
          style={styles.landingLogo}
          resizeMode="contain"
        />
      </Animated.View>
    </Animated.View>
  );

  // Main Page Component
const MainPage = ({ user, onLogout }) => (
  <View style={styles.mainContainer}>
    <View style={styles.mainHeader}>
      <Image 
        source={require('./assets/sotilogo.png')} 
        style={styles.mainLogo}
        resizeMode="contain"
      />
      <Text style={styles.welcomeText}>Connected to DB!!!!!!</Text>
      <Text style={styles.userEmail}>{user?.email}</Text>
    </View>
    
    <View style={styles.mainContent}>
      <Text style={styles.mainTitle}>SotiDelivery Customer App</Text>
      <Text style={styles.mainSubtitle}>Success Test</Text>
      
      
      
      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutButtonText}>Logout Test</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const LoginPage = () => (
    <View style={styles.loginContainer}>
      {/* Logo at top */}
      <View style={styles.loginLogoContainer}>
        <Image 
          source={require('./assets/sotilogo.png')} 
          style={styles.loginLogo}
          resizeMode="contain"
        />
      </View>

      {/* Welcome Text */}
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeTitle}>Welcome to SotiDelivery</Text>
        <Text style={styles.loginTitle}>Login now!</Text>
      </View>

      {/* Login Form */}
      <LoginForm onLoginSuccess={handleLoginSuccess} onCreateAccount={openCreateAccount} />
    </View>
  );

  // Create Account Step 1
  const CreateAccount1 = () => {
    const [local, setLocal] = useState(regData);
    const onNext = () => {
      if (!local.username || !local.firstName || !local.lastName || !local.email || !local.password) {
        Alert.alert('Incomplete', 'Please complete all fields.');
        return;
      }
      setRegData(local);
      setCurrentPage('create2');
    };
    return (
      <View style={styles.createContainer}>
        <View style={styles.loginLogoContainer}>
          <Image source={require('./assets/sotilogo.png')} style={styles.loginLogo} resizeMode="contain" />
        </View>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Create your account</Text>
        </View>
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}><TextInput style={styles.input} placeholder="Username" placeholderTextColor="#999" value={local.username} onChangeText={(t)=>setLocal({...local, username:t})} autoCapitalize="none" /></View>
          <View style={styles.inputContainer}><TextInput style={styles.input} placeholder="First name" placeholderTextColor="#999" value={local.firstName} onChangeText={(t)=>setLocal({...local, firstName:t})} /></View>
          <View style={styles.inputContainer}><TextInput style={styles.input} placeholder="Last name" placeholderTextColor="#999" value={local.lastName} onChangeText={(t)=>setLocal({...local, lastName:t})} /></View>
          <View style={styles.inputContainer}><TextInput style={styles.input} placeholder="Email address" placeholderTextColor="#999" value={local.email} onChangeText={(t)=>setLocal({...local, email:t})} keyboardType="email-address" autoCapitalize="none" /></View>
          <View style={styles.inputContainer}><TextInput style={styles.input} placeholder="Password" placeholderTextColor="#999" value={local.password} onChangeText={(t)=>setLocal({...local, password:t})} secureTextEntry /></View>
          <TouchableOpacity style={styles.loginButton} onPress={onNext}><Text style={styles.loginButtonText}>Next</Text></TouchableOpacity>
        </View>
      </View>
    );
  };

  // Lazy import components to avoid bundler issues in this edit: inline simple map using WebView fallback or placeholder.
  // Create Account Step 2 (Map and address)
  const CreateAccount2 = () => {
    const [localAddr, setLocalAddr] = useState(addressData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const mapRef = useRef(null);

    const DEFAULT_LAT = localAddr.latitude || 14.5995; // Manila fallback
    const DEFAULT_LNG = localAddr.longitude || 120.9842;

    const reverseGeocode = useCallback(async (lat, lng) => {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        let inferred = '';
        if (data?.plus_code?.global_code) {
          inferred = data.plus_code.global_code; // e.g., 7FG8V4WC+W2
        } else if (data?.results?.[0]?.formatted_address) {
          inferred = data.results[0].formatted_address;
        }
        setLocalAddr((prev) => ({ ...prev, street: inferred || prev.street, latitude: lat, longitude: lng }));
      } catch (e) {
        // Silent fallback; keep user-entered street
      }
    }, []);

    const useMyLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Location permission is required.');
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: 3 });
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocalAddr({ ...localAddr, latitude: lat, longitude: lng });
        // Recenter map
        const region = { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 };
        mapRef.current?.animateToRegion(region, 500);
        reverseGeocode(lat, lng);
      } catch (e) {
        Alert.alert('Error', 'Unable to fetch location.');
      }
    };

    const submitRegistration = async () => {
      setIsSubmitting(true);
      try {
        const payload = {
          username: regData.username,
          email: regData.email,
          password: regData.password,
          firstName: regData.firstName,
          lastName: regData.lastName,
          role: 'customer',
          street: localAddr.street,
          barangay: localAddr.barangay,
          note: localAddr.note,
          label: localAddr.label,
        };
        const res = await apiService.register(payload);
        if (res.success) {
          setCurrentPage('onboarding1');
        } else {
          const msg = (res.error || res.message || '').toString();
          if (/email already registered/i.test(msg)) {
            // Try to sign in with the provided credentials; proceed if valid
            const loginRes = await apiService.login(regData.email, regData.password);
            if (loginRes?.success) {
              setCurrentPage('onboarding1');
            } else {
              Alert.alert('Account exists', 'That email is already registered. Please enter the correct password on the Login page.');
            }
          } else {
            Alert.alert('Registration failed', msg || 'Please try again.');
          }
        }
      } catch (e) {
        Alert.alert('Error', e.message);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <View style={styles.createContainer}>
        <View style={styles.headerRow}>
          <Image source={require('./assets/sotilogo.png')} style={styles.headerLogoSmall} resizeMode="contain" />
          <Text style={styles.headerTitle}>Set your address</Text>
        </View>
        <MapView
          ref={mapRef}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          style={styles.map}
          initialRegion={{
            latitude: DEFAULT_LAT,
            longitude: DEFAULT_LNG,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onPress={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            setLocalAddr({ ...localAddr, latitude, longitude });
            mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 300);
            reverseGeocode(latitude, longitude);
          }}
        >
          <Marker
            draggable
            coordinate={{
              latitude: localAddr.latitude || DEFAULT_LAT,
              longitude: localAddr.longitude || DEFAULT_LNG,
            }}
            onDragEnd={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              setLocalAddr({ ...localAddr, latitude, longitude });
              reverseGeocode(latitude, longitude);
            }}
          />
        </MapView>
        <View style={styles.formContainer}>
          <TouchableOpacity style={styles.secondaryButton} onPress={useMyLocation}><Text style={styles.secondaryButtonText}>Use my current location</Text></TouchableOpacity>
          <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:16 }}>
            {['home','work','partner','other'].map(l=> (
              <TouchableOpacity key={l} onPress={()=>setLocalAddr({...localAddr, label:l})} style={[styles.labelPill, localAddr.label===l && styles.labelPillActive]}>
                <Text style={[styles.labelPillText, localAddr.label===l && styles.labelPillTextActive]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.inputContainer}><TextInput style={styles.input} placeholder="Street" placeholderTextColor="#999" value={localAddr.street} onChangeText={(t)=>setLocalAddr({...localAddr, street:t})} /></View>
          <View style={styles.inputContainer}><TextInput style={styles.input} placeholder="Barangay" placeholderTextColor="#999" value={localAddr.barangay} onChangeText={(t)=>setLocalAddr({...localAddr, barangay:t})} /></View>
          <View style={styles.inputContainer}><TextInput style={styles.input} placeholder="Note (optional)" placeholderTextColor="#999" value={localAddr.note} onChangeText={(t)=>setLocalAddr({...localAddr, note:t})} /></View>
          <TouchableOpacity style={styles.loginButton} onPress={submitRegistration} disabled={isSubmitting}>
            <Text style={styles.loginButtonText}>{isSubmitting ? 'Submitting...' : 'Submit'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Onboarding Pages
  const CustomerOnboardingPage1 = () => (
    <View style={styles.onbContainer}>
      <View style={styles.onbTopBar}>
        <View style={{ width: 60 }} />
        <TouchableOpacity><Text style={styles.onbSkip}>Skip</Text></TouchableOpacity>
      </View>
      <Image source={require('./assets/onboarding1.png')} style={styles.onbImage} resizeMode="contain" />
      <Text style={styles.onbTitle}>Order Your Favorites</Text>
      <Text style={styles.onbText}>Find the best restaurants and choose{"\n"}your most favourite meals to tempt your{ "\n" }taste buds.</Text>
      <View style={styles.onbProgressRow}>
        <View style={[styles.onbDot, styles.onbDotActive]} />
        <View style={styles.onbDot} />
        <View style={styles.onbDot} />
      </View>
      <TouchableOpacity style={styles.onbNextBtn} onPress={()=> setCurrentPage('onboarding2')}>
        <Text style={styles.onbNextText}>Next</Text>
      </TouchableOpacity>
    </View>
  );

  const CustomerOnboardingPage2 = () => (
    <View style={styles.onbContainer}>
      <View style={styles.onbTopBar}>
        <TouchableOpacity onPress={()=> setCurrentPage('onboarding1')}><Text style={styles.onbBack}>Back</Text></TouchableOpacity>
        <TouchableOpacity><Text style={styles.onbSkip}>Skip</Text></TouchableOpacity>
      </View>
      <Image source={require('./assets/onboarding2.png')} style={styles.onbImage} resizeMode="contain" />
      <Text style={styles.onbTitle}>Best Chefs in Lake City</Text>
      <Text style={styles.onbText}>Food quality is the core of food, which{"\n"}famishes your cravings by our best chefs{"\n"}in the lake city.</Text>
      <View style={styles.onbProgressRow}>
        <View style={styles.onbDot} />
        <View style={[styles.onbDot, styles.onbDotActive]} />
        <View style={styles.onbDot} />
      </View>
      <TouchableOpacity style={styles.onbNextBtn} onPress={()=> setCurrentPage('onboarding3')}>
        <Text style={styles.onbNextText}>Next</Text>
      </TouchableOpacity>
    </View>
  );

  const CustomerOnboardingPage3 = () => (
    <View style={styles.onbContainer}>
      <View style={styles.onbTopBar}>
        <TouchableOpacity onPress={()=> setCurrentPage('onboarding2')}><Text style={styles.onbBack}>Back</Text></TouchableOpacity>
        <TouchableOpacity><Text style={styles.onbSkip}>Skip</Text></TouchableOpacity>
      </View>
      <Image source={require('./assets/onboarding3.png')} style={styles.onbImage} resizeMode="contain" />
      <Text style={styles.onbTitle}>Delivery at Door-Step</Text>
      <Text style={styles.onbText}>The Food you Love{"\n"}Delivered with Care.</Text>
      <View style={styles.onbProgressRow}>
        <View style={styles.onbDot} />
        <View style={styles.onbDot} />
        <View style={[styles.onbDot, styles.onbDotActive]} />
      </View>
      <TouchableOpacity style={styles.onbNextBtn} onPress={()=> setCurrentPage('main')}>
        <Text style={styles.onbNextText}>GET STARTED</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {currentPage === 'landing' && showLanding && <LandingPage />}
      {currentPage === 'login' && showLogin && <LoginPage />}
      {currentPage === 'create1' && <CreateAccount1 />}
      {currentPage === 'create2' && <CreateAccount2 />}
      {currentPage === 'onboarding1' && <CustomerOnboardingPage1 />}
      {currentPage === 'onboarding2' && <CustomerOnboardingPage2 />}
      {currentPage === 'onboarding3' && <CustomerOnboardingPage3 />}
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
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  floatingLabel: {
    position: 'absolute',
    left: 16,
    top: -8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    fontSize: 12,
    color: '#666',
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
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rememberMeText: {
    fontSize: 14,
    color: '#666',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#007AFF',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 15,
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 30,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    color: '#333',
  },
  createAccountContainer: {
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 30,
  },
  createAccountText: {
    fontSize: 14,
    color: '#666',
  },
  createAccountLink: {
    color: '#007AFF',
    fontWeight: 'bold',
  },

  // Create Account shared styles
  createContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLogoSmall: {
    width: 36,
    height: 36,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  labelPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  labelPillActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  labelPillText: {
    color: '#333',
    textTransform: 'capitalize',
  },
  labelPillTextActive: {
    color: '#fff',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  map: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  
  // Main Page Styles
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainHeader: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    backgroundColor: '#F8F9FA',
  },
  mainLogo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666666',
  },
  mainContent: {
    flex: 1,
    padding: 30,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 10,
  },
  mainSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 40,
  },

 
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Onboarding styles
  onbContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  onbTopBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  onbSkip: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  onbBack: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  onbImage: {
    width: '100%',
    height: 260,
    marginBottom: 24,
  },
  onbTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 0,
  },
  onbText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 10,
    marginBottom: 24,
  },
  onbProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  onbDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  onbDotActive: {
    width: 20,
    backgroundColor: '#007AFF',
  },
  onbNextBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  onbNextText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
