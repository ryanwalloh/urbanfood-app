# Mobile App Backend Integration Guide

## Overview
This guide documents how we successfully connected the React Native mobile app to the Django backend, specifically focusing on authentication and API communication.

## Project Structure
```
soti_delivery/
├── mobileapp/
│   └── customer-app/          # React Native Expo app
│       ├── App.js            # Main app component
│       ├── services/
│       │   └── api.js        # API service layer
│       └── assets/           # Images and icons
├── core/
│   ├── views.py              # Django views (login endpoints)
│   └── urls.py               # URL routing
├── users/
│   └── models.py             # User model with roles
└── soti_delivery/
    └── settings.py           # Django settings
```

## Key Components

### 1. Django Backend Setup

#### User Model (`users/models.py`)
```python
class User(AbstractUser):
    ROLE_CHOICES = (
        ('customer', 'Customer'),
        ('restaurant', 'Restaurant'),
        ('rider', 'Rider'),
        ('admin', 'Admin'),
        ('demo', 'Demo'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
```

#### Login View (`core/views.py`)
```python
@csrf_exempt
def login_by_password(request):
    if request.method == 'POST' and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Invalid email or password'})
        
        user = authenticate(request, username=user.username, password=password)
        
        if user is not None:
            login(request, user)
            if user.role == 'customer':
                return JsonResponse({'success': True, 'redirect_url': reverse('core:customer_home')})
            # ... other roles
        else:
            return JsonResponse({'success': False, 'error': 'Invalid email or password'})
```

#### Django Settings (`soti_delivery/settings.py`)
```python
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '192.168.254.103',  # Your computer's IP address
    '10.0.2.2',         # Android emulator
]

CORS_ALLOW_ALL_ORIGINS = True
```

### 2. Mobile App API Service

#### API Service (`mobileapp/customer-app/services/api.js`)
```javascript
import axios from 'axios';

// Cache the working URL to avoid repeated testing
let cachedWorkingUrl = 'http://192.168.254.103:8000';

// Test multiple URLs to find the working one
const testMultipleUrls = async () => {
  if (cachedWorkingUrl) {
    return cachedWorkingUrl;
  }
  
  const urls = [
    'http://10.0.2.2:8000',      // Android emulator
    'http://127.0.0.1:8000',     // iOS simulator
    'http://localhost:8000',     // Alternative localhost
    'http://192.168.254.103:8000', // Your computer's IP address
  ];
  
  for (const url of urls) {
    try {
      const testApi = axios.create({ baseURL: url, timeout: 5000 });
      const response = await testApi.get('/');
      cachedWorkingUrl = url;
      return url;
    } catch (error) {
      console.log(`❌ URL failed: ${url} - ${error.message}`);
    }
  }
  return null;
};

export const apiService = {
  login: async (email, password) => {
    try {
      let workingUrl = cachedWorkingUrl;
      if (!workingUrl) {
        workingUrl = await testMultipleUrls();
        if (!workingUrl) {
          return { success: false, error: 'No working URL found' };
        }
      }
      
      const loginApi = axios.create({
        baseURL: workingUrl,
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
      });
      
      const response = await loginApi.post('/loginByPassword/', {
        email: email,
        password: password,
      }, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      
      return response.data;
    } catch (error) {
      cachedWorkingUrl = null; // Clear cache on failure
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Login failed'
      };
    }
  }
};
```

### 3. Mobile App Components

#### Independent LoginForm Component (`App.js`)
```javascript
const LoginForm = ({ onLoginSuccess }) => {
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
          Alert.alert('Error', 'This app is for customers only.');
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
      {/* TextInput components with stable focus */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        blurOnSubmit={false}
        returnKeyType="next"
      />
      {/* ... other form elements */}
    </View>
  );
};
```

## Key Solutions Implemented

### 1. Network Connectivity Issues
**Problem**: Mobile app couldn't connect to Django server
**Solution**: 
- Added multiple URL testing (`testMultipleUrls`)
- Cached working URL to avoid repeated testing
- Added IP address to `ALLOWED_HOSTS` in Django settings

### 2. CSRF Protection Issues
**Problem**: 403 Forbidden errors due to CSRF protection
**Solution**: 
- Added `@csrf_exempt` decorator to login view
- Used `X-Requested-With: XMLHttpRequest` header

### 3. Keyboard Disappearing Issue
**Problem**: TextInput lost focus on every keystroke
**Solution**: 
- Created independent `LoginForm` component with its own state
- Removed form state from main App component
- Used `useRef` for Animated values to prevent recreation
- Disabled React Native's new architecture (`newArchEnabled: false`)

### 4. Role-Based Authentication
**Problem**: Need to restrict app access to customers only
**Solution**: 
- Check user role in Django backend
- Return appropriate redirect URL based on role
- Validate role in mobile app before allowing access

## Configuration Files

### Mobile App (`mobileapp/customer-app/app.json`)
```json
{
  "expo": {
    "name": "customer-app",
    "newArchEnabled": false,
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    }
  }
}
```

### Package Dependencies (`mobileapp/customer-app/package.json`)
```json
{
  "dependencies": {
    "axios": "^1.12.2",
    "expo": "~54.0.7",
    "react": "19.1.0",
    "react-native": "0.81.4"
  }
}
```

## Testing & Debugging

### Connection Testing
```javascript
// Test database connection
const testConnection = async () => {
  const result = await apiService.testConnection();
  console.log('Connection result:', result);
};
```

### Debug Logging
```javascript
// API request logging
api.interceptors.request.use((config) => {
  console.log('🚀 API Request:', config);
  return config;
});

api.interceptors.response.use((response) => {
  console.log('✅ API Response:', response.data);
  return response;
});
```

## Common Issues & Solutions

### 1. "Network Error" on Android Emulator
**Solution**: Use `http://10.0.2.2:8000` instead of `http://127.0.0.1:8000`

### 2. "403 Forbidden" CSRF Error
**Solution**: Add `@csrf_exempt` decorator to Django view

### 3. Keyboard Disappears While Typing
**Solution**: Create independent component with its own state

### 4. "No working URL found"
**Solution**: Check Django server is running and IP address is correct

## Best Practices

1. **Always cache working URLs** to avoid repeated network testing
2. **Use independent components** for forms to prevent re-render issues
3. **Add comprehensive error handling** with user-friendly messages
4. **Test on both Android and iOS** emulators/simulators
5. **Use proper HTTP headers** (`X-Requested-With`, `Content-Type`)
6. **Implement role-based access control** for security
7. **Add loading states** for better UX
8. **Log API requests/responses** for debugging

## Future Enhancements

1. **Token-based authentication** (JWT)
2. **Offline support** with local storage
3. **Push notifications** for order updates
4. **Image upload** for profile pictures
5. **Real-time updates** using WebSockets
6. **Biometric authentication** (fingerprint/face ID)
7. **Deep linking** for order tracking
8. **Analytics integration** for user behavior

## Troubleshooting Checklist

- [ ] Django server is running (`python manage.py runserver`)
- [ ] IP address is added to `ALLOWED_HOSTS`
- [ ] CORS is enabled (`CORS_ALLOW_ALL_ORIGINS = True`)
- [ ] CSRF exemption is added to login view
- [ ] Mobile app is using correct API base URL
- [ ] Network connectivity is working (test connection)
- [ ] User has correct role in database
- [ ] TextInput components are in independent component

---

*This guide was created during the development of the SotiDelivery mobile app integration. Keep it updated as new features are added.*
