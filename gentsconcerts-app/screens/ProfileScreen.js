import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Switch, TextInput, Modal, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../styles/theme';
import { AuthService } from '../AuthService';
import { HeaderLogo } from '../components/Logo';
import Watermark from '../components/Watermark';
import PageAnimation from '../components/PageAnimation';
import config from '../config';

const API_BASE = config.API_URL;

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifPrefs, setNotifPrefs] = useState({
    newEvents: true,
    ticketConfirmations: true,
    eventReminders: true,
    promotionalEmails: false
  });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '', profileImage: null });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUser();
    });
    return unsubscribe;
  }, [navigation]);

  const loadUser = async () => {
    try {
      const token = await AuthService.getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch fresh user data from server
      const response = await fetch(`${API_BASE}/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data) {
        const freshUser = data.data;
        setUser(freshUser);
        // Sync AsyncStorage
        await fetchAndCacheProfile();
        if (freshUser.notificationPreferences) {
          setNotifPrefs({
            newEvents: freshUser.notificationPreferences.newEvents !== false,
            ticketConfirmations: freshUser.notificationPreferences.ticketConfirmations !== false,
            eventReminders: freshUser.notificationPreferences.eventReminders !== false,
            promotionalEmails: freshUser.notificationPreferences.promotionalEmails === true
          });
        }
      } else {
        // Fallback to cached user
        const cachedUser = await AuthService.getUser();
        setUser(cachedUser);
      }
    } catch (error) {
      console.error('Profile load error:', error);
      const cachedUser = await AuthService.getUser();
      setUser(cachedUser);
    } finally {
      setLoading(false);
    }
  };

  const fetchAndCacheProfile = async () => {
    try {
      const token = await AuthService.getToken();
      const response = await fetch(`${API_BASE}/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data) {
        await AsyncStorage.setItem('user', JSON.stringify(data.data));
      }
    } catch (e) {
      // Silently fail
    }
  };

  const handleToggleNotif = async (key) => {
    const newPrefs = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(newPrefs);
    try {
      // Send the full preferences object with correct key names matching User model
      const result = await AuthService.updateNotificationPreferences({
        newEvents: newPrefs.newEvents,
        ticketConfirmations: newPrefs.ticketConfirmations,
        eventReminders: newPrefs.eventReminders,
        promotionalEmails: newPrefs.promotionalEmails
      });
      if (!result.success) {
        // Revert on failure
        setNotifPrefs(notifPrefs);
        Alert.alert('Error', 'Failed to update preferences');
      }
    } catch (e) {
      setNotifPrefs(notifPrefs);
      Alert.alert('Error', 'Network error updating preferences');
    }
  };

  const openEditProfile = () => {
    if (user) {
      setEditForm({
        fullName: user.fullName || '',
        phone: user.phone || '',
        profileImage: user.profileImage || null
      });
    }
    setEditModalVisible(true);
  };

  const pickProfileImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your photos to upload a profile image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setEditForm({ ...editForm, profileImage: result.assets[0].uri });
    }
  };

  const saveProfile = async () => {
    if (!editForm.fullName || !editForm.phone) {
      Alert.alert('Error', 'Full name and phone number are required');
      return;
    }

    setSavingProfile(true);
    try {
      const token = await AuthService.getToken();
      const headers = { 'Authorization': `Bearer ${token}` };

      // Check if we have a new local image to upload
      const isLocalImage = editForm.profileImage && 
                          !editForm.profileImage.startsWith('http') && 
                          (editForm.profileImage.startsWith('file') || editForm.profileImage.startsWith('/') || editForm.profileImage.startsWith('content'));

      if (isLocalImage) {
        // Local image - use FormData
        const formBody = new FormData();
        formBody.append('fullName', editForm.fullName);
        formBody.append('phone', editForm.phone);

        const filename = editForm.profileImage.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        if (Platform.OS === 'web') {
          // For Web, we need to fetch the blob from the URI
          try {
            const response = await fetch(editForm.profileImage);
            const blob = await response.blob();
            formBody.append('profileImage', blob, filename || 'profile.jpg');
          } catch (e) {
            console.error('Web blob conversion error:', e);
            // Fallback to native style just in case
            formBody.append('profileImage', {
              uri: editForm.profileImage,
              name: filename || 'profile.jpg',
              type: type
            });
          }
        } else {
          // Native style
          formBody.append('profileImage', {
            uri: editForm.profileImage,
            name: filename || 'profile.jpg',
            type: type
          });
        }

        const response = await fetch(`${API_BASE}/users/profile`, {
          method: 'PUT',
          headers,
          body: formBody
        });

        const data = await response.json();
        if (data.success) {
          setUser(data.data);
          await fetchAndCacheProfile();
          setEditModalVisible(false);
          Alert.alert('Success', 'Profile updated!');
        } else {
          Alert.alert('Error', data.message || 'Failed to update profile');
        }
      } else {
        // No image change, just text fields
        const response = await fetch(`${API_BASE}/users/profile`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: editForm.fullName,
            phone: editForm.phone
          })
        });

        const data = await response.json();
        if (data.success) {
          setUser(data.data);
          await fetchAndCacheProfile();
          setEditModalVisible(false);
          Alert.alert('Success', 'Profile updated!');
        } else {
          Alert.alert('Error', data.message || 'Failed to update profile');
        }
      }
    } catch (error) {
      console.error('Save Profile Error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: async () => {
            await AuthService.logout();
            setUser(null);
            navigation.navigate('Home');
          } 
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.gold} size="large" />
        <Text style={{ color: theme.colors.gold, marginTop: 10 }}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.screenHeader}>
          <HeaderLogo navigation={navigation} />
        </View>
        <View style={styles.center}>
          <Ionicons name="person-circle-outline" size={100} color={theme.colors.gold} opacity={0.3} />
          <Text style={styles.guestText}>Join the GentsConcerts community to manage your tickets and events.</Text>
          <TouchableOpacity 
            style={styles.loginBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginBtnText}>Login / Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <PageAnimation>
    <ScrollView style={styles.container}>
      <View style={styles.screenHeader}>
        <HeaderLogo navigation={navigation} />
      </View>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          {user.profileImage ? (
            <Image 
              source={{ uri: `${API_BASE}${user.profileImage}` }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{user.fullName?.charAt(0) || '?'}</Text>
            </View>
          )}
          <View style={styles.profileDetails}>
            <Text style={styles.name}>{user.fullName}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{(user.role || 'attendee').toUpperCase()}</Text>
              </View>
              <View style={[styles.verifiedBadge, user.isVerified ? styles.verifiedActive : styles.verifiedInactive]}>
                <Ionicons 
                  name={user.isVerified ? 'checkmark-circle' : 'alert-circle-outline'} 
                  size={14} 
                  color={user.isVerified ? '#4CAF50' : '#FF9800'} 
                />
                <Text style={[styles.verifiedText, user.isVerified ? styles.verifiedTextActive : styles.verifiedTextInactive]}>
                  {user.isVerified ? 'Verified' : 'Unverified'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Verification prompt */}
        {!user.isVerified && (
          <TouchableOpacity 
            style={styles.verifyBanner}
            onPress={() => {
              Alert.alert(
                'Verify Email',
                'Would you like us to resend the verification email?',
                [
                  { text: 'Cancel' },
                  {
                    text: 'Resend',
                    onPress: async () => {
                      const result = await AuthService.resendVerification(user.email);
                      Alert.alert('Sent', result.message || 'Verification email sent!');
                    }
                  }
                ]
              );
            }}
          >
            <Ionicons name="mail-open-outline" size={18} color="#FF9800" />
            <Text style={styles.verifyText}>Tap to verify your email</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <MenuItem 
          icon="person-outline" 
          title="Edit Profile" 
          onPress={openEditProfile}
        />
        <MenuItem 
          icon="shield-checkmark-outline" 
          title="Security" 
          onPress={() => Alert.alert('Security', 'Password and security settings coming soon.')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <ToggleItem 
          icon="calendar-outline" 
          title="New Events" 
          subtitle="Get notified about upcoming events"
          value={notifPrefs.newEvents}
          onToggle={() => handleToggleNotif('newEvents')}
        />
        <ToggleItem 
          icon="ticket-outline" 
          title="Ticket Confirmations" 
          subtitle="Receive updates on your ticket purchases"
          value={notifPrefs.ticketConfirmations}
          onToggle={() => handleToggleNotif('ticketConfirmations')}
        />
        <ToggleItem 
          icon="notifications-outline" 
          title="Event Reminders" 
          subtitle="Reminders before events start"
          value={notifPrefs.eventReminders}
          onToggle={() => handleToggleNotif('eventReminders')}
        />
        <ToggleItem 
          icon="megaphone-outline" 
          title="Promotions" 
          subtitle="Special offers and deals"
          value={notifPrefs.promotionalEmails}
          onToggle={() => handleToggleNotif('promotionalEmails')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Management</Text>
        {(user.role === 'host' || user.role === 'admin') && (
          <MenuItem 
            icon="business-outline" 
            title="Host Portal" 
            onPress={() => navigation.navigate('AdminDashboard')}
          />
        )}
        {user.role === 'admin' && (
          <MenuItem 
            icon="speedometer-outline" 
            title="Owner Dashboard" 
            color={theme.colors.gold}
            onPress={() => navigation.navigate('OwnerDashboard')}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        <MenuItem 
          icon="document-text-outline" 
          title="Terms & Conditions" 
          onPress={() => navigation.navigate('TermsAndConditions')}
        />
        <MenuItem 
          icon="shield-checkmark-outline" 
          title="Privacy Policy" 
          onPress={() => navigation.navigate('PrivacyPolicy')}
        />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#F44336" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#94a3b8"
              value={editForm.fullName}
              onChangeText={(text) => setEditForm({ ...editForm, fullName: text })}
            />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              value={editForm.phone}
              onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
            />

            <Text style={styles.inputLabel}>Profile Image</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickProfileImage}>
              {editForm.profileImage && editForm.profileImage.startsWith('file') || (editForm.profileImage && editForm.profileImage.startsWith('/')) ? (
                <Image source={{ uri: editForm.profileImage }} style={styles.imagePreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera-outline" size={30} color="#94a3b8" />
                  <Text style={styles.imagePlaceholderText}>Tap to upload photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]} 
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.saveBtn]} 
                onPress={saveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Watermark />
    </ScrollView>
    </PageAnimation>
  );
}

const MenuItem = ({ icon, title, onPress, color = '#FFFFFF' }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuLeft}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.menuTitle, {color}]}>{title}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="grey" />
  </TouchableOpacity>
);

const ToggleItem = ({ icon, title, subtitle, value, onToggle }) => (
  <View style={styles.toggleItem}>
    <View style={styles.menuLeft}>
      <Ionicons name={icon} size={22} color="#FFFFFF" />
      <View style={styles.toggleTextContainer}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.toggleSubtitle}>{subtitle}</Text>
      </View>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: '#475569', true: theme.colors.gold }}
      thumbColor={value ? theme.colors.dark : '#f4f3f4'}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.dark },
  screenHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.dark, padding: 40, minHeight: 400 },
  guestText: { color: 'grey', textAlign: 'center', marginTop: 20, marginBottom: 30 },
  loginBtn: { backgroundColor: theme.colors.gold, paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30 },
  loginBtnText: { color: theme.colors.dark, fontWeight: 'bold' },
  header: { padding: 30, paddingTop: 20, backgroundColor: theme.colors.nearBlack },
  profileInfo: { flexDirection: 'row', alignItems: 'center' },
  profileDetails: { flex: 1 },
  avatarContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: theme.colors.gold, justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  avatarImage: { width: 70, height: 70, borderRadius: 35, marginRight: 20 },
  avatarText: { fontSize: 30, fontWeight: 'bold', color: theme.colors.dark },
  name: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  email: { color: 'grey', marginBottom: 5 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleBadge: { backgroundColor: 'rgba(212, 175, 55, 0.1)', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 4 },
  roleText: { color: theme.colors.gold, fontSize: 10, fontWeight: 'bold' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  verifiedActive: { backgroundColor: 'rgba(76, 175, 80, 0.1)' },
  verifiedInactive: { backgroundColor: 'rgba(255, 152, 0, 0.1)' },
  verifiedText: { fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  verifiedTextActive: { color: '#4CAF50' },
  verifiedTextInactive: { color: '#FF9800' },
  verifyBanner: { flexDirection: 'row', alignItems: 'center', marginTop: 15, padding: 10, backgroundColor: 'rgba(255,152,0,0.1)', borderRadius: 8 },
  verifyText: { color: '#FF9800', fontSize: 13, marginLeft: 8 },
  section: { padding: 20 },
  sectionTitle: { color: 'grey', fontSize: 12, textTransform: 'uppercase', marginBottom: 15, letterSpacing: 1 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuTitle: { marginLeft: 15, fontSize: 16, color: '#FFFFFF' },
  toggleItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  toggleTextContainer: { flex: 1 },
  toggleSubtitle: { color: 'grey', fontSize: 12, marginLeft: 0, marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40, marginBottom: 60 },
  logoutText: { color: '#F44336', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  // Edit Profile Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1e293b', borderRadius: 15, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  inputLabel: { color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', marginBottom: 6, marginTop: 10, letterSpacing: 0.5 },
  input: { backgroundColor: '#0f172a', color: '#fff', padding: 12, borderRadius: 8, fontSize: 14 },
  imagePicker: { marginBottom: 10, borderRadius: 8, overflow: 'hidden' },
  imagePreview: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: theme.colors.gold },
  imagePlaceholder: { backgroundColor: '#0f172a', height: 100, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: '#475569' },
  imagePlaceholderText: { color: '#94a3b8', fontSize: 12, marginTop: 8 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  modalBtn: { flex: 0.48, padding: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#475569' },
  saveBtn: { backgroundColor: '#f59e0b' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});
