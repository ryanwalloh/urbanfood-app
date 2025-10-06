import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, Alert, StyleSheet, Platform, Dimensions, Animated, Keyboard } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { apiService } from '../services/api';

const { width } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = 'AIzaSyCCuDLJMhB-23kQiXYpXwi-yYGvKz7OgSQ';

const CreateAccount2 = ({ regData, addressData, onSuccess }) => {
  const [localAddr, setLocalAddr] = useState(addressData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const mapRef = useRef(null);
  
  // Animation for form container lift
  const formContainerTranslateY = useRef(new Animated.Value(0)).current;
  // Animation for marker bouncing
  const markerAnimation = useRef(new Animated.Value(0)).current;
  
  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      Animated.timing(formContainerTranslateY, {
        toValue: -100, // Lift the form container up
        duration: 250,
        useNativeDriver: true,
      }).start();
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(formContainerTranslateY, {
        toValue: 0, // Return to original position
        duration: 250,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [formContainerTranslateY]);

  // Animate marker down when map stops
  useEffect(() => {
    if (!isMapMoving) {
      Animated.spring(markerAnimation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    }
  }, [isMapMoving, markerAnimation]);

  // Initialize location on component mount
  useEffect(() => {
    // Set initial location if not already set
    if (!localAddr.latitude || !localAddr.longitude) {
      setLocalAddr(prev => ({
        ...prev,
        latitude: DEFAULT_LAT,
        longitude: DEFAULT_LNG
      }));
      // Reverse geocode the initial location
      reverseGeocode(DEFAULT_LAT, DEFAULT_LNG);
    }
  }, []);

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
      // Recenter map to user location
      const region = { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 };
      mapRef.current?.animateToRegion(region, 1000);
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
        // Pass user data to success callback
        const userData = {
          id: res.data?.user?.id,
          email: regData.email,
          username: regData.username,
          firstName: regData.firstName,
          lastName: regData.lastName,
          role: 'customer',
          address: {
            street: localAddr.street,
            barangay: localAddr.barangay,
            note: localAddr.note,
            label: localAddr.label,
            latitude: localAddr.latitude,
            longitude: localAddr.longitude,
          }
        };
        onSuccess(userData);
      } else {
        const msg = (res.error || res.message || '').toString();
        if (/email already registered/i.test(msg)) {
          // Try to sign in with the provided credentials; proceed if valid
          const loginRes = await apiService.login(regData.email, regData.password);
          if (loginRes?.success) {
            const userData = {
              email: regData.email,
              username: regData.username,
              firstName: regData.firstName,
              lastName: regData.lastName,
              role: 'customer',
              address: {
                street: localAddr.street,
                barangay: localAddr.barangay,
                note: localAddr.note,
                label: localAddr.label,
                latitude: localAddr.latitude,
                longitude: localAddr.longitude,
              }
            };
            onSuccess(userData);
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
      {/* Full Width Background Map */}
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.backgroundMap}
        initialRegion={{
          latitude: DEFAULT_LAT,
          longitude: DEFAULT_LNG,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onRegionChange={() => {
          setIsMapMoving(true);
          // Animate marker up when map is moving
          Animated.spring(markerAnimation, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        }}
        onRegionChangeComplete={(region) => {
          setIsMapMoving(false);
          // Update location when user pans the map
          setLocalAddr({ ...localAddr, latitude: region.latitude, longitude: region.longitude });
          reverseGeocode(region.latitude, region.longitude);
        }}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={false}
        rotateEnabled={false}
      >
      </MapView>

      {/* Fixed Marker in Center */}
      <View style={styles.markerFixed} pointerEvents="none">
        <Animated.View 
          style={[
            styles.markerContainer,
            {
              transform: [
                {
                  translateY: markerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -15],
                  }),
                },
              ],
            },
          ]}
        >
          <Svg width="40" height="50" viewBox="0 0 24 30">
            <Path
              d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 14 8 14s8-8.75 8-14c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"
              fill="#F43332"
            />
          </Svg>
        </Animated.View>
        {/* Shadow */}
        <Animated.View 
          style={[
            styles.markerShadow,
            {
              opacity: markerAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.1],
              }),
              transform: [
                {
                  scale: markerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2],
                  }),
                },
              ],
            },
          ]}
        />
      </View>

      {/* Dark Overlay */}
      <View style={styles.darkOverlay} />

      {/* White Logo */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/sotihorizontal2.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Address Form Container */}
      <Animated.View style={[
        styles.formContainer,
        {
          transform: [{ translateY: formContainerTranslateY }]
        }
      ]}>
        {/* Welcome Message */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Delivery location</Text>
          <Text style={styles.subtitle}>Or click the button below to use your current location</Text>
        </View>

        {/* Use My Location Button */}
        <TouchableOpacity style={styles.locationButton} onPress={useMyLocation}>
          <Text style={styles.locationButtonText}>📍 Use my current location</Text>
        </TouchableOpacity>

        {/* Address Label Pills */}
        <View style={styles.labelContainer}>
          {['home', 'work', 'partner', 'other'].map(l => (
            <TouchableOpacity 
              key={l} 
              onPress={() => setLocalAddr({...localAddr, label: l})} 
              style={[styles.labelPill, localAddr.label === l && styles.labelPillActive]}
            >
              <Text style={[styles.labelPillText, localAddr.label === l && styles.labelPillTextActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Address Input Fields */}
        <View style={styles.inputsContainer}>
          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.input} 
              placeholder="Street" 
              placeholderTextColor="#999" 
              value={localAddr.street} 
              onChangeText={(t) => setLocalAddr({...localAddr, street: t})}
              fontFamily="Nexa-ExtraLight"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.input} 
              placeholder="Barangay" 
              placeholderTextColor="#999" 
              value={localAddr.barangay} 
              onChangeText={(t) => setLocalAddr({...localAddr, barangay: t})}
              fontFamily="Nexa-ExtraLight"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.input} 
              placeholder="Note (optional)" 
              placeholderTextColor="#999" 
              value={localAddr.note} 
              onChangeText={(t) => setLocalAddr({...localAddr, note: t})}
              fontFamily="Nexa-ExtraLight"
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
          onPress={submitRegistration} 
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  createContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  backgroundMap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: width,
    height: '50%',
    zIndex: 0,
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: width,
    height: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 0.5,
    pointerEvents: 'none',
  },
  logoContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  logo: {
    width: 120,
    height: 120,
  },
  markerFixed: {
    position: 'absolute',
    top: '25%',
    left: '50%',
    marginLeft: -20,
    marginTop: -25,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerShadow: {
    width: 20,
    height: 8,
    borderRadius: 10,
    backgroundColor: '#000000',
    opacity: 0.3,
    marginTop: -8,
  },
  formContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 44,
    borderTopRightRadius: 44,
    paddingHorizontal: 30,
    paddingTop: 30,
    paddingBottom: 40,
    minHeight: 500,
    zIndex: 2,
  },
  welcomeContainer: {
    alignItems: 'left',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontFamily: 'Nexa-ExtraLight',
    color: '#333',
    marginBottom: 0,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    color: '#666',
    textAlign: 'left',
  },
  locationButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#999999',
  },
  locationButtonText: {
    color: '#333',
    fontSize: 14,
    fontFamily: 'Nexa-ExtraLight',
    fontWeight: '500',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  labelPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    minWidth: 60,
    alignItems: 'center',
  },
  labelPillActive: {
    backgroundColor: '#F43332',
  },
  labelPillText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Nexa-ExtraLight',
  },
  labelPillTextActive: {
    color: '#FFFFFF',
    fontFamily: 'Nexa-ExtraLight',
  },
  inputsContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Nexa-ExtraLight',
  },
  submitButton: {
    backgroundColor: '#F43332',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nexa-ExtraLight',
  },
});

export default CreateAccount2;