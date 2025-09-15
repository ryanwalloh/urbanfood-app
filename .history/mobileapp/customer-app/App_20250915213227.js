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
  Easing
} from 'react-native';
import { useState, useEffect } from 'react';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Animation values
  const fadeAnim = new Animated.Value(1);
  const logoScaleAnim = new Animated.Value(1);
  const logoPositionAnim = new Animated.Value(0);
  const loginFadeAnim = new Animated.Value(0);
  const loginLogoAnim = new Animated.Value(0);

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
        
        // Start logo animation with ease
        Animated.timing(loginLogoAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

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

  const LoginPage = () => (
    <View style={styles.loginContainer}>
      {/* Logo - starts centered, animates to top */}
      <Animated.View style={[
        styles.loginLogoContainer,
        {
          transform: [
            {
              translateY: loginLogoAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [height * 0.2, 0], // Start centered, move to top
              })
            },
            {
              scale: loginLogoAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.4], // Start large, scale down
              })
            }
          ]
        }
      ]}>
        <Image 
          source={require('./assets/sotilogo.png')} 
          style={styles.loginLogoLarge}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Welcome Text */}
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeTitle}>Welcome to SotiDelivery</Text>
        <Text style={styles.loginTitle}>Login now!</Text>
      </View>

      {/* Login Form */}
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
        <TouchableOpacity style={styles.loginButton}>
          <Text style={styles.loginButtonText}>Login</Text>
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
    </View>
  );

  return (
    <View style={styles.container}>
      {showLanding && <LandingPage />}
      {showLogin && <LoginPage />}
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
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  loginLogo: {
    width: 80,
    height: 80,
  },
  loginLogoLarge: {
    width: 200,
    height: 200,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 120, // Space for animated logo
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
    marginBottom: 20,
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
});
