import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, Modal, TextInput, Platform, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../styles/theme';
import { AuthService } from '../AuthService';
import config from '../config';
import UserAvatar from '../components/UserAvatar';
import Watermark from '../components/Watermark';
import PageAnimation from '../components/PageAnimation';

const API_BASE = config.API_URL;

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Edit Profile Modal
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Security Modal
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadProfile();
    const unsubscribe = AuthService.subscribeToUser((updatedUser) => {
      if (updatedUser) setUser(updatedUser);
    });
    return unsubscribe;
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const token = await AuthService.getToken();
      const response = await fetch(`${API_BASE}/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.data);
        setFullName(data.data.fullName || '');
        setPhone(data.data.phone || '');
        await AuthService.setUser(data.data);
      }
    } catch (error) {
      console.error('Profile Load Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickPhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Permission to access gallery is required!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedPhoto(result.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Full name cannot be empty');
      return;
    }
    setUpdating(true);
    try {
      const token = await AuthService.getToken();
      const formBody = new FormData();
      formBody.append('fullName', fullName.trim());
      formBody.append('phone', phone.trim());

      if (selectedPhoto) {
        const filename = selectedPhoto.split('/').pop();
        const match = /\.([a-zA-Z0-9]+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        formBody.append('profileImage', {
          uri: selectedPhoto,
          name: filename || 'profile.jpg',
          type
        });
      }

      const response = await fetch(`${API_BASE}/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
          // Let fetch set multipart/form-data boundary automatically
        },
        body: formBody
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.data);
        await AuthService.setUser(data.data);
        setEditProfileModalVisible(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update Profile Error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setUpdating(true);
    const result = await AuthService.updatePassword(currentPassword, newPassword);
    setUpdating(false);

    if (result.success) {
      Alert.alert('Success', 'Password updated successfully');
      setSecurityModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      Alert.alert('Error', result.message || 'Failed to update password');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: async () => {
        await AuthService.logout();
        // Reset navigation to Login screen at the root level
        navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Login' }] });
        // Fallback for different navigator structures
        navigation.navigate('Login');
      }}
    ]);
  };

  const handleBecomeHost = async () => {
    if (user?.hostApprovalStatus === 'pending') {
      Alert.alert('Application Pending', 'Your host application is already being reviewed by our team.');
      return;
    }
    
    Alert.alert(
      'Become a Host',
      'Apply to list and manage your own events on GentsConcerts. Your application will be reviewed by our admins.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Apply Now', onPress: async () => {
          setUpdating(true);
          const result = await AuthService.becomeHost();
          setUpdating(false);
          Alert.alert(result.success ? 'Success' : 'Error', result.message);
          if (result.success) loadProfile();
        }}
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.gold} size="large" />
      </View>
    );
  }

  return (
    <PageAnimation>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#F44336" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.profileHeader}>
            <UserAvatar user={user} size={100} />
            <Text style={styles.userName}>{user?.fullName}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={[styles.roleBadge, { backgroundColor: user?.role === 'host' ? theme.colors.gold : '#2196F3' }]}>
              <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
            </View>
            <TouchableOpacity 
              style={styles.editProfileBtn} 
              onPress={() => {
                setFullName(user?.fullName || '');
                setPhone(user?.phone || '');
                setSelectedPhoto(null);
                setEditProfileModalVisible(true);
              }}
            >
              <Ionicons name="create-outline" size={16} color={theme.colors.dark} style={{marginRight: 6}} />
              <Text style={styles.editProfileBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Actions</Text>
            
            <MenuItem 
              icon="log-out-outline" 
              title="Logout" 
              subtitle="Sign out of your account"
              onPress={handleLogout}
              color="#F44336"
            />

            {user?.role === 'attendee' && user?.hostApprovalStatus !== 'approved' && (
              <MenuItem 
                icon="microphone-outline" 
                title={user?.hostApprovalStatus === 'pending' ? "Host Application Pending" : "Become an Event Host"} 
                subtitle={user?.hostApprovalStatus === 'pending' ? "Under review by admins" : "List and sell tickets for your events"}
                onPress={handleBecomeHost}
                color={user?.hostApprovalStatus === 'pending' ? 'grey' : theme.colors.gold}
              />
            )}

            {user?.role === 'host' && user?.role !== 'admin' && (
              <MenuItem 
                icon="apps-outline" 
                title="Host Portal" 
                subtitle="Manage your events and analytics"
                onPress={() => navigation.navigate('AdminDashboard')}
              />
            )}

            <MenuItem 
              icon="shield-checkmark-outline" 
              title="Security" 
              subtitle="Update your password and account security"
              onPress={() => setSecurityModalVisible(true)}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support & Info</Text>
            <MenuItem 
              icon="help-circle-outline" 
              title="Help Center" 
              subtitle="Contact support and get assistance"
              onPress={() => navigation.navigate('Contact')} 
            />
            <MenuItem 
              icon="document-text-outline" 
              title="Terms of Service" 
              subtitle="Read our platform terms and conditions"
              onPress={() => navigation.navigate('TermsAndConditions')} 
            />
            <MenuItem 
              icon="lock-closed-outline" 
              title="Privacy Policy" 
              subtitle="Review how we protect your data"
              onPress={() => navigation.navigate('PrivacyPolicy')} 
            />
          </View>

          <Watermark />
        </ScrollView>

        {/* Edit Profile Modal */}
        <Modal visible={editProfileModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={() => setEditProfileModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={{alignItems: 'center', marginBottom: 20}}>
                <TouchableOpacity onPress={handlePickPhoto}>
                  {selectedPhoto ? (
                    <Image source={{ uri: selectedPhoto }} style={{width: 80, height: 80, borderRadius: 40}} />
                  ) : (
                    <UserAvatar user={user} size={80} />
                  )}
                  <View style={{position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.colors.gold, padding: 6, borderRadius: 15}}>
                    <Ionicons name="camera" size={14} color={theme.colors.dark} />
                  </View>
                </TouchableOpacity>
                <Text style={{color: 'grey', fontSize: 12, marginTop: 8}}>Tap to change profile picture</Text>
              </View>

              <Text style={styles.modalLabel}>Full Name</Text>
              <TextInput 
                style={styles.modalInput}
                placeholder="Your Full Name"
                placeholderTextColor="grey"
                value={fullName}
                onChangeText={setFullName}
              />

              <Text style={styles.modalLabel}>Phone Number</Text>
              <TextInput 
                style={styles.modalInput}
                placeholder="+250..."
                placeholderTextColor="grey"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <TouchableOpacity 
                style={styles.updateBtn} 
                onPress={handleSaveProfile}
                disabled={updating}
              >
                {updating ? <ActivityIndicator color={theme.colors.dark} /> : <Text style={styles.updateBtnText}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Security Modal */}
        <Modal visible={securityModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Account Security</Text>
                <TouchableOpacity onPress={() => setSecurityModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalLabel}>Current Password</Text>
              <TextInput 
                style={styles.modalInput}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor="grey"
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />

              <Text style={styles.modalLabel}>New Password</Text>
              <TextInput 
                style={styles.modalInput}
                secureTextEntry
                placeholder="•••••••• (min 6 chars)"
                placeholderTextColor="grey"
                value={newPassword}
                onChangeText={setNewPassword}
              />

              <Text style={styles.modalLabel}>Confirm New Password</Text>
              <TextInput 
                style={styles.modalInput}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor="grey"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <TouchableOpacity 
                style={styles.updateBtn} 
                onPress={handleUpdatePassword}
                disabled={updating}
              >
                {updating ? <ActivityIndicator color={theme.colors.dark} /> : <Text style={styles.updateBtnText}>Update Password</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </PageAnimation>
  );
}

const MenuItem = ({ icon, title, subtitle, onPress, color = '#FFFFFF' }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={[styles.menuIcon, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
      <Ionicons name={icon} size={22} color={color === '#FFFFFF' ? theme.colors.gold : color} />
    </View>
    <View style={styles.menuText}>
      <Text style={[styles.menuTitle, { color }]}>{title}</Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>
    <Ionicons name="chevron-forward" size={18} color="grey" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.dark },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.dark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15 },
  headerTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', fontFamily: theme.fonts.heading },
  scrollContent: { padding: 20 },
  profileHeader: { alignItems: 'center', marginBottom: 30 },
  userName: { color: '#FFFFFF', fontSize: 26, fontWeight: 'bold', marginTop: 15 },
  userEmail: { color: 'grey', fontSize: 16, marginTop: 4 },
  roleBadge: { marginTop: 10, paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20 },
  roleText: { color: theme.colors.dark, fontSize: 12, fontWeight: 'bold' },
  section: { marginBottom: 30 },
  sectionTitle: { color: theme.colors.gold, fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 15, letterSpacing: 1.2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.nearBlack, padding: 18, borderRadius: 15, marginBottom: 12 },
  menuIcon: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 18 },
  menuText: { flex: 1 },
  menuTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '500' },
  menuSubtitle: { color: 'grey', fontSize: 14, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: theme.colors.nearBlack, borderRadius: 20, padding: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  modalLabel: { color: 'grey', fontSize: 12, marginBottom: 8, marginTop: 15 },
  modalInput: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#FFFFFF', borderRadius: 10, padding: 15, fontSize: 16 },
  updateBtn: { backgroundColor: theme.colors.gold, height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  updateBtnText: { color: theme.colors.dark, fontSize: 16, fontWeight: 'bold' },
  editProfileBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.gold, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 12 },
  editProfileBtnText: { color: theme.colors.dark, fontSize: 13, fontWeight: 'bold' }
});
