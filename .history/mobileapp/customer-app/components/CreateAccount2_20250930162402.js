import React, { useState, useRef, useCallback } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, Alert, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { apiService } from '../services/api';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCCuDLJMhB-23kQiXYpXwi-yYGvKz7OgSQ';

const CreateAccount2 = ({ regData, addressData, onSuccess }) => {
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
        onSuccess();
      } else {
        const msg = (res.error || res.message || '').toString();
        if (/email already registered/i.test(msg)) {
          // Try to sign in with the provided credentials; proceed if valid
          const loginRes = await apiService.login(regData.email, regData.password);
          if (loginRes?.success) {
            onSuccess();
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
        <Image source={require('../assets/sotilogo.png')} style={styles.headerLogoSmall} resizeMode="contain" />
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
        <TouchableOpacity style={styles.secondaryButton} onPress={useMyLocation}>
          <Text style={styles.secondaryButtonText}>Use my current location</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
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
        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input} 
            placeholder="Street" 
            placeholderTextColor="#999" 
            value={localAddr.street} 
            onChangeText={(t) => setLocalAddr({...localAddr, street: t})} 
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input} 
            placeholder="Barangay" 
            placeholderTextColor="#999" 
            value={localAddr.barangay} 
            onChangeText={(t) => setLocalAddr({...localAddr, barangay: t})} 
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input} 
            placeholder="Note (optional)" 
            placeholderTextColor="#999" 
            value={localAddr.note} 
            onChangeText={(t) => setLocalAddr({...localAddr, note: t})} 
          />
        </View>
        <TouchableOpacity style={styles.loginButton} onPress={submitRegistration} disabled={isSubmitting}>
          <Text style={styles.loginButtonText}>{isSubmitting ? 'Submitting...' : 'Submit'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  createContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLogoSmall: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  map: {
    width: '100%',
    height: 200,
    marginBottom: 20,
    borderRadius: 12,
  },
  formContainer: {
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  labelPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  labelPillActive: {
    backgroundColor: '#007AFF',
  },
  labelPillText: {
    fontSize: 12,
    color: '#666',
  },
  labelPillTextActive: {
    color: '#FFFFFF',
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
    backgroundColor: '#F8F9FA',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateAccount2;
