import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const CustomerProfile = ({ user, onLogout, onBackHome }) => {
  const fullName = user?.firstName || user?.first_name
    ? `${user.firstName || user.first_name} ${user.lastName || user.last_name || ''}`.trim()
    : user?.username || '';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={onBackHome}>
          <Text style={styles.headerLink}>← Home</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Image source={require('../assets/profile.png')} style={styles.avatar} resizeMode="contain" />
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.username}>@{user?.username}</Text>
        </View>

        {/* Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Details</Text>
          <View style={styles.row}><Text style={styles.label}>Email</Text><Text style={styles.value}>{user?.email || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Phone</Text><Text style={styles.value}>{user?.phone_number || user?.phone || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Role</Text><Text style={styles.value}>{user?.role || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Verified</Text><Text style={styles.value}>{user?.is_phone_verified ? 'Yes' : 'No'}</Text></View>
        </View>

        {/* Address */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Address</Text>
          <View style={styles.row}><Text style={styles.label}>Street</Text><Text style={styles.value}>{user?.street || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Barangay</Text><Text style={styles.value}>{user?.barangay || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Label</Text><Text style={styles.value}>{user?.label || '-'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Note</Text><Text style={styles.value}>{user?.note || '-'}</Text></View>
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10, backgroundColor: '#FFFFFF' },
  headerTitle: { fontSize: 20, color: '#333', fontFamily: 'Nexa-Heavy' },
  headerLink: { fontSize: 14, color: '#F43332', fontFamily: 'Nexa-ExtraLight' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  avatarContainer: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 80, height: 80 },
  name: { fontSize: 20, marginTop: 8, color: '#333', fontFamily: 'Nexa-Heavy' },
  username: { fontSize: 14, color: '#666', fontFamily: 'Nexa-ExtraLight' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#EAEAEA', padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 16, marginBottom: 10, color: '#333', fontFamily: 'Nexa-Heavy' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  label: { fontSize: 14, color: '#777', fontFamily: 'Nexa-ExtraLight' },
  value: { fontSize: 14, color: '#333', fontFamily: 'Nexa-ExtraLight', maxWidth: width * 0.55, textAlign: 'right' },
  logoutButton: { backgroundColor: '#F43332', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  logoutText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Nexa-ExtraLight' },
});

export default CustomerProfile;


