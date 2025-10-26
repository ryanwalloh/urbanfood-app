import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { apiService } from '../services/api';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;

const CustomerProfile = ({ user, onLogout, onBackHome }) => {
  // Edit mode states
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Personal details state
  const [personalData, setPersonalData] = useState({
    firstName: user?.firstName || user?.first_name || '',
    lastName: user?.lastName || user?.last_name || '',
    phone: user?.phone_number || user?.phone || '',
  });

  // Compute full name from personal data or user props
  const fullName = personalData.firstName || personalData.lastName
    ? `${personalData.firstName} ${personalData.lastName}`.trim()
    : user?.firstName || user?.first_name
    ? `${user.firstName || user.first_name} ${user.lastName || user.last_name || ''}`.trim()
    : user?.username || '';

  // Address state
  const [addressData, setAddressData] = useState({
    street: user?.street || '',
    barangay: user?.barangay || '',
    label: user?.label || 'home',
    note: user?.note || '',
  });

  const handleSavePersonalDetails = async () => {
    setIsLoading(true);
    try {
      // Call API to update personal details
      const result = await apiService.updatePersonalDetails({
        user_id: user?.id,
        first_name: personalData.firstName,
        last_name: personalData.lastName,
        phone: personalData.phone,
      });

      if (result.success) {
        setIsEditingPersonal(false);
        // Update local state to reflect changes
        // In a production app, you might want to call a callback to update the parent component
      } else {
        Alert.alert('Error', result.error || 'Failed to update personal details');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save personal details: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAddress = async () => {
    setIsLoading(true);
    try {
      // Call API to update address
      const result = await apiService.saveAddress({
        user_id: user?.id,
        street: addressData.street,
        barangay: addressData.barangay,
        label: addressData.label,
        note: addressData.note,
      });

      if (result.success) {
        setIsEditingAddress(false);
        // Update local state to reflect changes
        // In a production app, you might want to call a callback to update the parent component
      } else {
        Alert.alert('Error', result.error || 'Failed to update address');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save address: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={onBackHome}>
          <Text style={styles.headerLink}>Home</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Image source={require('../assets/profile.png')} style={styles.avatar} resizeMode="contain" />
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.username}>@{user?.username}</Text>
        </View>

        {/* Personal Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Personal Details</Text>
            {!isEditingPersonal ? (
              <TouchableOpacity onPress={() => setIsEditingPersonal(true)}>
                <Text style={styles.editButton}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.saveCancelRow}>
                <TouchableOpacity onPress={handleSavePersonalDetails} disabled={isLoading}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#4CAF50" />
                  ) : (
                    <Text style={styles.saveButton}>Save</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsEditingPersonal(false)} disabled={isLoading} style={{ marginLeft: 12 }}>
                  <Text style={styles.cancelButton}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email || '-'}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>First Name</Text>
            {isEditingPersonal ? (
              <TextInput
                style={styles.input}
                value={personalData.firstName}
                onChangeText={(text) => setPersonalData({...personalData, firstName: text})}
                placeholder="First Name"
                placeholderTextColor="#999"
              />
            ) : (
              <Text style={styles.value}>{personalData.firstName || '-'}</Text>
            )}
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Last Name</Text>
            {isEditingPersonal ? (
              <TextInput
                style={styles.input}
                value={personalData.lastName}
                onChangeText={(text) => setPersonalData({...personalData, lastName: text})}
                placeholder="Last Name"
                placeholderTextColor="#999"
              />
            ) : (
              <Text style={styles.value}>{personalData.lastName || '-'}</Text>
            )}
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Phone</Text>
            {isEditingPersonal ? (
              <TextInput
                style={styles.input}
                value={personalData.phone}
                onChangeText={(text) => setPersonalData({...personalData, phone: text})}
                placeholder="Phone"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.value}>{personalData.phone || '-'}</Text>
            )}
          </View>
        </View>

        {/* Address */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Address</Text>
            {!isEditingAddress ? (
              <TouchableOpacity onPress={() => setIsEditingAddress(true)}>
                <Text style={styles.editButton}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.saveCancelRow}>
                <TouchableOpacity onPress={handleSaveAddress} disabled={isLoading}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#4CAF50" />
                  ) : (
                    <Text style={styles.saveButton}>Save</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsEditingAddress(false)} disabled={isLoading} style={{ marginLeft: 12 }}>
                  <Text style={styles.cancelButton}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Street</Text>
            {isEditingAddress ? (
              <TextInput
                style={[styles.input, styles.readOnlyInput]}
                value={addressData.street}
                editable={false}
                placeholder="Street"
                placeholderTextColor="#999"
              />
            ) : (
              <Text style={styles.value}>{addressData.street || '-'}</Text>
            )}
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Barangay</Text>
            {isEditingAddress ? (
              <TextInput
                style={styles.input}
                value={addressData.barangay}
                onChangeText={(text) => setAddressData({...addressData, barangay: text})}
                placeholder="Barangay"
                placeholderTextColor="#999"
              />
            ) : (
              <Text style={styles.value}>{addressData.barangay || '-'}</Text>
            )}
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Label</Text>
            {isEditingAddress ? (
              <TextInput
                style={styles.input}
                value={addressData.label}
                onChangeText={(text) => setAddressData({...addressData, label: text})}
                placeholder="Label (e.g., Home, Work)"
                placeholderTextColor="#999"
              />
            ) : (
              <Text style={styles.value}>{addressData.label || '-'}</Text>
            )}
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Note</Text>
            {isEditingAddress ? (
              <TextInput
                style={styles.input}
                value={addressData.note}
                onChangeText={(text) => setAddressData({...addressData, note: text})}
                placeholder="Additional notes"
                placeholderTextColor="#999"
                multiline
              />
            ) : (
              <Text style={styles.value}>{addressData.note || '-'}</Text>
            )}
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: isSmallScreen ? 20 : 24,
    paddingTop: isSmallScreen ? 50 : 60,
    paddingBottom: isSmallScreen ? 12 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  headerTitle: { 
    fontSize: isSmallScreen ? 18 : 20, 
    color: '#333', 
    fontFamily: 'Nexa-Heavy' 
  },
  headerLink: { 
    fontSize: isSmallScreen ? 13 : 14, 
    color: '#F43332', 
    fontFamily: 'Nexa-ExtraLight' 
  },
  scroll: { 
    flex: 1 
  },
  scrollContent: { 
    padding: isSmallScreen ? 16 : 20,
    paddingBottom: isSmallScreen ? (Platform.OS === 'android' ? 40 : 30) : (Platform.OS === 'android' ? 50 : 40),
  },
  avatarContainer: { 
    alignItems: 'center', 
    marginBottom: isSmallScreen ? 16 : 20 
  },
  avatar: { 
    width: isSmallScreen ? 70 : 80, 
    height: isSmallScreen ? 70 : 80 
  },
  name: { 
    fontSize: isSmallScreen ? 18 : 20, 
    marginTop: isSmallScreen ? 6 : 8, 
    color: '#333', 
    fontFamily: 'Nexa-Heavy' 
  },
  username: { 
    fontSize: isSmallScreen ? 13 : 14, 
    color: '#666', 
    fontFamily: 'Nexa-ExtraLight',
    marginTop: 4,
  },
  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: isSmallScreen ? 10 : 12, 
    borderWidth: 1, 
    borderColor: '#EAEAEA', 
    padding: isSmallScreen ? 14 : 16, 
    marginBottom: isSmallScreen ? 12 : 16 
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isSmallScreen ? 8 : 10,
  },
  cardTitle: { 
    fontSize: isSmallScreen ? 15 : 16, 
    color: '#333', 
    fontFamily: 'Nexa-Heavy' 
  },
  editButton: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#F43332',
    fontFamily: 'Nexa-ExtraLight',
  },
  saveCancelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButton: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#4CAF50',
    fontFamily: 'Nexa-ExtraLight',
    fontWeight: '600',
  },
  cancelButton: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#999',
    fontFamily: 'Nexa-ExtraLight',
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: isSmallScreen ? 6 : 8,
    alignItems: 'flex-start',
  },
  label: { 
    fontSize: isSmallScreen ? 13 : 14, 
    color: '#777', 
    fontFamily: 'Nexa-ExtraLight',
    flex: 1,
  },
  value: { 
    fontSize: isSmallScreen ? 13 : 14, 
    color: '#333', 
    fontFamily: 'Nexa-ExtraLight', 
    maxWidth: width * 0.55, 
    textAlign: 'right',
    flex: 1,
    flexWrap: 'wrap',
  },
  input: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#333',
    fontFamily: 'Nexa-ExtraLight',
    flex: 1,
    textAlign: 'right',
    borderBottomWidth: 1,
    borderBottomColor: '#F43332',
    paddingBottom: 2,
  },
  readOnlyInput: {
    borderBottomColor: '#CCC',
    color: '#999',
  },
  logoutButton: { 
    backgroundColor: '#F43332', 
    paddingVertical: isSmallScreen ? 12 : 14, 
    borderRadius: isSmallScreen ? 10 : 12, 
    alignItems: 'center', 
    marginTop: isSmallScreen ? 8 : 10,
    marginBottom: isSmallScreen ? 10 : 0,
  },
  logoutText: { 
    color: '#FFFFFF', 
    fontSize: isSmallScreen ? 15 : 16, 
    fontFamily: 'Nexa-ExtraLight' 
  },
});

export default CustomerProfile;


