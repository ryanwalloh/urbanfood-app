# Railway Deployment & Mobile App Installation Guide

## Overview
This guide covers the complete process of deploying the SOTI Delivery backend to Railway.com and installing the mobile apps on your personal device.

## Prerequisites
- Railway.com account
- Git repository access
- Mobile device (Android/iOS)
- Development environment setup

---

## Phase 1: Backend Preparation

### 1.1 Environment Variables Setup
Create a `.env` file in the project root with the following variables:

```env
# Django Settings
SECRET_KEY=your-super-secret-django-key-here
DEBUG=False
ALLOWED_HOSTS=your-railway-domain.railway.app,localhost,127.0.0.1

# Database (Railway will provide these)
DATABASE_URL=postgresql://username:password@host:port/database

# Email Configuration
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Twilio Configuration
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# Google Maps API
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Redis (Railway will provide)
REDIS_URL=redis://username:password@host:port
```

### 1.2 Railway Configuration Files

#### Create `railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "python manage.py migrate && python manage.py collectstatic --noinput && gunicorn soti_delivery.wsgi:application --bind 0.0.0.0:$PORT",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### Create `Procfile`:
```
web: python manage.py migrate && python manage.py collectstatic --noinput && gunicorn soti_delivery.wsgi:application --bind 0.0.0.0:$PORT
```

### 1.3 Django Settings Updates

Update `soti_delivery/settings.py`:

```python
import os
from decouple import config

# Environment variables
SECRET_KEY = config('SECRET_KEY', default='django-insecure-fallback-key-change-in-production')
DEBUG = config('DEBUG', default=False)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',') if config('ALLOWED_HOSTS', default='') else ['localhost']

# Database
DATABASES = {
    'default': dj_database_url.parse(config('DATABASE_URL', default='sqlite:///db.sqlite3'))
}

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Email settings
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('EMAIL_HOST_USER', default='')

# Twilio settings
TWILIO_ACCOUNT_SID = config('TWILIO_ACCOUNT_SID', default='')
TWILIO_AUTH_TOKEN = config('TWILIO_AUTH_TOKEN', default='')
TWILIO_PHONE_NUMBER = config('TWILIO_PHONE_NUMBER', default='')

# Google Maps API
GOOGLE_MAPS_API_KEY = config('GOOGLE_MAPS_API_KEY', default='')

# Redis for Django Channels
REDIS_URL = config('REDIS_URL', default='redis://localhost:6379')
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [REDIS_URL],
        },
    },
}
```

### 1.4 Requirements Update

Update `requirements.txt`:
```
Django==4.2.7
djangorestframework==3.14.0
django-cors-headers==4.3.1
psycopg2-binary==2.9.9
gunicorn==21.2.0
python-decouple==3.8
dj-database-url==2.1.0
channels==4.0.0
channels-redis==4.1.0
Pillow==10.1.0
twilio==8.10.0
requests==2.31.0
```

---

## Phase 2: Railway Deployment

### 2.1 Create Railway Project
1. Go to [Railway.com](https://railway.com)
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository

### 2.2 Add Services
1. **PostgreSQL Database**:
   - Click "Add Service" → "Database" → "PostgreSQL"
   - Railway will automatically provide `DATABASE_URL`

2. **Redis**:
   - Click "Add Service" → "Database" → "Redis"
   - Railway will automatically provide `REDIS_URL`

### 2.3 Configure Environment Variables
In Railway dashboard:
1. Go to your project
2. Click on the web service
3. Go to "Variables" tab
4. Add all environment variables from your `.env` file

### 2.4 Deploy
1. Railway will automatically detect Django
2. It will run migrations and collect static files
3. Your backend will be available at `https://your-project-name.railway.app`

### 2.5 Verify Deployment
Test these endpoints:
- `GET https://your-project-name.railway.app/` (should return Django welcome)
- `GET https://your-project-name.railway.app/api/` (API endpoints)

---

## Phase 3: Mobile App Configuration

### 3.1 Update API Configuration Files

#### Customer App (`mobileapp/customer-app/config/apiConfig.js`):
```javascript
export const API_CONFIG = {
  // Google Maps API Key
  GOOGLE_MAPS_API_KEY: 'your-google-maps-api-key',
  
  // Backend API Base URL (Railway URL)
  API_BASE_URL: 'https://your-project-name.railway.app',
  
  // WebSocket URL (Railway URL with WSS)
  WS_BASE_URL: 'wss://your-project-name.railway.app',
};
```

#### Rider App (`mobileapp/rider-app/config/apiConfig.js`):
```javascript
export const API_CONFIG = {
  // Google Maps API Key
  GOOGLE_MAPS_API_KEY: 'your-google-maps-api-key',
  
  // OpenWeather API Key
  OPENWEATHER_API_KEY: 'your-openweather-api-key',
  
  // Cloudinary Configuration
  CLOUDINARY_CLOUD_NAME: 'your-cloudinary-cloud-name',
  CLOUDINARY_UPLOAD_PRESET: 'your-cloudinary-upload-preset',
  
  // Backend API Base URL (Railway URL)
  API_BASE_URL: 'https://your-project-name.railway.app',
  
  // WebSocket URL (Railway URL with WSS)
  WS_BASE_URL: 'wss://your-project-name.railway.app',
};
```

### 3.2 Update API Service Files

#### Customer App (`mobileapp/customer-app/services/api.js`):
```javascript
// Update baseURL to use Railway URL
const BASE_URL = API_CONFIG.API_BASE_URL;

// Update WebSocket URL
const WS_URL = API_CONFIG.WS_BASE_URL;
```

#### Rider App (`mobileapp/rider-app/services/api.js`):
```javascript
// Update baseURL to use Railway URL
const BASE_URL = API_CONFIG.API_BASE_URL;

// Update WebSocket URL
const WS_URL = API_CONFIG.WS_BASE_URL;
```

---

## Phase 4: Mobile App Installation

### 4.1 Development Build (Recommended for Testing)

#### For Android:
1. **Install Expo CLI**:
   ```bash
   npm install -g @expo/cli
   ```

2. **Navigate to app directory**:
   ```bash
   cd mobileapp/customer-app  # or mobileapp/rider-app
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start development server**:
   ```bash
   npx expo start
   ```

5. **Install Expo Go app** on your Android device from Google Play Store

6. **Scan QR code** with Expo Go app

#### For iOS:
1. Follow steps 1-4 above
2. **Install Expo Go app** on your iOS device from App Store
3. **Scan QR code** with Expo Go app

### 4.2 Production Build (For App Store Distribution)

#### Android APK Build:
1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Configure EAS Build**:
   ```bash
   eas build:configure
   ```

4. **Build APK**:
   ```bash
   eas build --platform android --profile preview
   ```

5. **Download and install** the generated APK on your device

#### iOS Build:
1. Follow steps 1-3 above
2. **Build for iOS**:
   ```bash
   eas build --platform ios --profile preview
   ```

3. **Install via TestFlight** or direct installation

---

## Phase 5: Testing & Verification

### 5.1 Backend Testing
Test these critical endpoints:
- **Authentication**: `/users/login/`, `/users/register/`
- **Orders**: `/orders/`, `/orders/create/`
- **Rider**: `/rider/orders/`, `/rider/accept-order/`
- **Customer**: `/customer/orders/`, `/customer/create-order/`

### 5.2 Mobile App Testing
1. **Login/Registration**: Test both customer and rider accounts
2. **Order Creation**: Create orders from customer app
3. **Order Acceptance**: Accept orders from rider app
4. **Real-time Updates**: Test WebSocket connections
5. **File Upload**: Test proof of delivery uploads
6. **Location Services**: Test GPS tracking and maps

### 5.3 Performance Testing
- **Load Testing**: Test with multiple concurrent users
- **Database Performance**: Monitor query performance
- **File Upload**: Test image upload speeds
- **Real-time Features**: Test WebSocket stability

---

## Phase 6: Security & Production Considerations

### 6.1 Security Checklist
- [ ] All API keys moved to environment variables
- [ ] `DEBUG=False` in production
- [ ] HTTPS enabled (Railway provides this)
- [ ] Database credentials secured
- [ ] CORS properly configured
- [ ] File uploads validated and secured

### 6.2 Monitoring & Logging
- **Railway Logs**: Monitor application logs in Railway dashboard
- **Error Tracking**: Consider adding Sentry for error monitoring
- **Performance Monitoring**: Monitor response times and database queries
- **Uptime Monitoring**: Set up uptime monitoring for critical endpoints

### 6.3 Backup Strategy
- **Database Backups**: Railway provides automatic PostgreSQL backups
- **Code Backups**: Ensure code is in version control
- **Environment Variables**: Keep secure backup of all environment variables

---

## Troubleshooting

### Common Issues:

#### 1. Database Connection Errors
- **Check**: `DATABASE_URL` environment variable
- **Verify**: PostgreSQL service is running in Railway
- **Solution**: Restart the web service

#### 2. Static Files Not Loading
- **Check**: `STATIC_ROOT` setting
- **Verify**: `collectstatic` command ran successfully
- **Solution**: Check Railway build logs

#### 3. WebSocket Connection Issues
- **Check**: `WS_BASE_URL` uses `wss://` (secure WebSocket)
- **Verify**: Redis service is running
- **Solution**: Test WebSocket connection separately

#### 4. Mobile App Connection Issues
- **Check**: `API_BASE_URL` points to Railway URL
- **Verify**: HTTPS is working
- **Solution**: Test API endpoints in browser first

#### 5. File Upload Issues
- **Check**: Cloudinary configuration
- **Verify**: Upload preset permissions
- **Solution**: Test upload with Postman first

---

## Maintenance & Updates

### Regular Tasks:
1. **Monitor Railway usage** and costs
2. **Update dependencies** regularly
3. **Backup database** before major updates
4. **Test mobile apps** after backend updates
5. **Monitor error logs** for issues

### Scaling Considerations:
- **Database**: Upgrade PostgreSQL plan if needed
- **Redis**: Monitor memory usage
- **Static Files**: Consider CDN for static assets
- **Mobile Apps**: Monitor app store reviews and crash reports

---

## Support & Resources

### Railway Documentation:
- [Railway Docs](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)

### Django Deployment:
- [Django Deployment Checklist](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)
- [Gunicorn Configuration](https://docs.gunicorn.org/en/stable/configure.html)

### React Native/Expo:
- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)

---

## Final Notes

This guide provides a complete roadmap for deploying your SOTI Delivery system to Railway and installing the mobile apps. The process involves several phases, so take your time with each step and test thoroughly before moving to the next phase.

Remember to:
- Keep your environment variables secure
- Test all functionality after deployment
- Monitor your Railway usage and costs
- Keep your mobile apps updated with the latest backend changes

Good luck with your deployment! 🚀
