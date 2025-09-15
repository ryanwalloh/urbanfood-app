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
import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { apiService } from './services/api';

const { width, height } = Dimensions.get('window');

// Memoized LoginForm component to prevent re-renders
const LoginForm = memo(({ email, password, showPassword, isLoading, onEmailChange, onPasswordChange, onTogglePassword, onLogin }) => {
  return (
    <View style={styles.formContainer}>
      {/* Email Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={onEmailChange}
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
          onChangeText={onPasswordChange}
          secureTextEntry={!showPassword}
          autoCorrect={false}
          blurOnSubmit={false}
          returnKeyType="done"
          onSubmitEditing={onLogin}
        />
        <Text style={styles.floatingLabel}>Password</Text>
        <TouchableOpacity 
          style={styles.eyeButton}
          onPress={onTogglePassword}
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
          onPress={() => {/* handled in parent */}}
        >
          <View style={[styles.checkbox]}>
            {/* checkbox handled in parent */}
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
        onPress={onLogin}
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
          <Text style={styles.createAccountLink}>Create Account</Text>
        </Text>
      </View>
    </View>
  );
});

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState('landing'); // 'landing', 'login', 'main'
  const [user, setUser] = useState(null);

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

  // Memoized handlers to prevent re-renders
  const handleEmailChange = useCallback((text) => {
    setEmail(text);
  }, []);

  const handlePasswordChange = useCallback((text) => {
    setPassword(text);
  }, []);

  const handleTogglePassword = useCallback(() => {
    setShowPassword(!showPassword);
  }, [showPassword]);

  // Debug function to check if component is re-rendering
  console.log('App component rendered, email:', email, 'password length:', password.length);

  // Handle login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiService.login(email, password);
      console.log('📊 Login result:', result);
      
      if (result.success) {
        // Check if user has customer role
        if (result.redirect_url && result.redirect_url.includes('customer')) {
          // Store user data
          setUser({ email: email, role: 'customer' });
          // Navigate to main page
          setCurrentPage('main');
          Alert.alert('Success', 'Welcome to SotiDelivery!');
        } else {
          Alert.alert('Error', 'This app is for customers only. Please use the appropriate app for your role.');
        }
      } else {
        Alert.alert('Login Failed', result.error || result.message);
      }
    } catch (error) {
      console.log('❌ Login error:', error);
      Alert.alert('Error', 'Login failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
    setCurrentPage('landing');
    setShowLanding(true);
    setShowLogin(false);
    setEmail('');
    setPassword('');
    setRememberMe(false);
  };

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
      <Text style={styles.welcomeText}>Welcome back!</Text>
      <Text style={styles.userEmail}>{user?.email}</Text>
    </View>
    
    <View style={styles.mainContent}>
      <Text style={styles.mainTitle}>SotiDelivery Customer App</Text>
      <Text style={styles.mainSubtitle}>Your delivery experience starts here</Text>
      
      <View style={styles.featureContainer}>
        <Text style={styles.featureTitle}>Available Features:</Text>
        <Text style={styles.featureItem}>• Browse Restaurants</Text>
        <Text style={styles.featureItem}>• Order Food</Text>
        <Text style={styles.featureItem}>• Track Orders</Text>
        <Text style={styles.featureItem}>• Manage Profile</Text>
      </View>
      
      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
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
      <LoginForm 
        email={email}
        password={password}
        showPassword={showPassword}
        isLoading={isLoading}
        onEmailChange={handleEmailChange}
        onPasswordChange={handlePasswordChange}
        onTogglePassword={handleTogglePassword}
        onLogin={handleLogin}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {currentPage === 'landing' && showLanding && <LandingPage />}
      {currentPage === 'login' && showLogin && <LoginPage />}
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
  featureContainer: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    marginBottom: 40,
    width: '100%',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  featureItem: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
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
});
