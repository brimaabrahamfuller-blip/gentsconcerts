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
        await AuthService.setUser(data.data);
      }
    } catch (error) {
      console.error('Profile Load Error:', error);
    } finally {
      setLoading(false);
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
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
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
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Actions</Text>
            
            {user?.role === 'attendee' && user?.hostApprovalStatus !== 'approved' && (
              <MenuItem 
                icon="microphone-outline" 
                title={user?.hostApprovalStatus === 'pending' ? "Host Application Pending" : "Become an Event Host"} 
                subtitle={user?.hostApprovalStatus === 'pending' ? "Under review by admins" : "List and sell tickets for your events"}
                onPress={handleBecomeHost}
                color={user?.hostApprovalStatus === 'pending' ? 'grey' : theme.colors.gold}
              />
            )}

            {(user?.role === 'host' || user?.role === 'admin') && (
              <MenuItem 
                icon="apps-outline" 
                title="Host Portal" 
                subtitle="Manage your events and analytics"
                onPress={() => navigation.navigate('AdminDashboard')}
              />
            )}

            {user?.role === 'admin' && (
              <MenuItem 
                icon="shield-half-outline" 
                title="Owner Dashboard" 
                subtitle="Platform management and vetting"
                onPress={() => navigation.navigate('Admin')}
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
            <MenuItem icon="help-circle-outline" title="Help Center" />
            <MenuItem icon="document-text-outline" title="Terms of Service" />
            <MenuItem icon="lock-closed-outline" title="Privacy Policy" />
          </View>

          <Watermark />
        </ScrollView>

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
  userName: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', marginTop: 15 },
  userEmail: { color: 'grey', fontSize: 14, marginTop: 4 },
  roleBadge: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  roleText: { color: theme.colors.dark, fontSize: 10, fontWeight: 'bold' },
  section: { marginBottom: 25 },
  sectionTitle: { color: theme.colors.gold, fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 15, letterSpacing: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.nearBlack, padding: 15, borderRadius: 12, marginBottom: 10 },
  menuIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { flex: 1 },
  menuTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
  menuSubtitle: { color: 'grey', fontSize: 12, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: theme.colors.nearBlack, borderRadius: 20, padding: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  modalLabel: { color: 'grey', fontSize: 12, marginBottom: 8, marginTop: 15 },
  modalInput: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#FFFFFF', borderRadius: 10, padding: 15, fontSize: 16 },
  updateBtn: { backgroundColor: theme.colors.gold, height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  updateBtnText: { color: theme.colors.dark, fontSize: 16, fontWeight: 'bold' }
});
