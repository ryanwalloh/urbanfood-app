import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RiderMainPage = ({ onLogout }) => {
  const [rider, setRider] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem('rider:user');
        if (stored) setRider(JSON.parse(stored));
      } catch (e) {}
    };
    load();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('rider:user');
    onLogout?.();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rider Main Page</Text>
      {rider ? (
        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{rider.email}</Text>

          <Text style={styles.label}>Username</Text>
          <Text style={styles.value}>{rider.username}</Text>

          <Text style={styles.label}>Role</Text>
          <Text style={styles.value}>{rider.role}</Text>

          {rider.vehicle_type && (
            <>
              <Text style={styles.label}>Vehicle Type</Text>
              <Text style={styles.value}>{rider.vehicle_type}</Text>
            </>
          )}

          {rider.license_number && (
            <>
              <Text style={styles.label}>License Number</Text>
              <Text style={styles.value}>{rider.license_number}</Text>
            </>
          )}

          {rider.phone && (
            <>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>{rider.phone}</Text>
            </>
          )}

          <Text style={styles.label}>Status</Text>
          <Text style={[styles.value, { color: rider.is_available ? '#4CAF50' : '#F44336' }]}>
            {rider.is_available ? 'Available' : 'Unavailable'}
          </Text>
        </View>
      ) : (
        <Text style={styles.loading}>Loading rider from session...</Text>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    color: '#111',
    fontWeight: '600',
  },
  loading: {
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#F43332',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RiderMainPage;


