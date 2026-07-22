import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { AuthService } from '../AuthService';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [notifPrefs, setNotifPrefs] = useState({
    newEvents: true,
    ticketConfirmations: true,
    eventReminders: true,
    promotions: false
  });

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUser();
    });
    return unsubscribe;
  }, [navigation]);

  const loadUser = async () => {
    const userData = await AuthService.getUser();
    setUser(userData);
    if (userData?.notificationPreferences) {
      setNotifPrefs(userData.notificationPreferences);
    }
  };

  const handleToggleNotif = async (key) => {
    const newPrefs = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(newPrefs);
    await AuthService.updateNotificationPreferences(newPrefs);
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

  if (!user) {
    return (
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
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{user.fullName?.charAt(0) || '?'}</Text>
          </View>
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
        <MenuItem icon="person-outline" title="Edit Profile" />
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
          value={notifPrefs.promotions}
          onToggle={() => handleToggleNotif('promotions')}
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
    </ScrollView>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.dark, padding: 40 },
  guestText: { color: 'grey', textAlign: 'center', marginTop: 20, marginBottom: 30 },
  loginBtn: { backgroundColor: theme.colors.gold, paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30 },
  loginBtnText: { color: theme.colors.dark, fontWeight: 'bold' },
  header: { padding: 30, paddingTop: 80, backgroundColor: theme.colors.nearBlack },
  profileInfo: { flexDirection: 'row', alignItems: 'center' },
  profileDetails: { flex: 1 },
  avatarContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: theme.colors.gold, justifyContent: 'center', alignItems: 'center', marginRight: 20 },
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
  logoutText: { color: '#F44336', fontSize: 16, fontWeight: 'bold', marginLeft: 10 }
});
