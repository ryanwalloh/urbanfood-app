import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;

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
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: isSmallScreen ? 20 : 24,
    paddingTop: isSmallScreen ? 50 : 60, // Increased to avoid status bar
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
    paddingBottom: isSmallScreen ? 30 : 40, // Add bottom padding for better scrolling
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
  cardTitle: { 
    fontSize: isSmallScreen ? 15 : 16, 
    marginBottom: isSmallScreen ? 8 : 10, 
    color: '#333', 
    fontFamily: 'Nexa-Heavy' 
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


