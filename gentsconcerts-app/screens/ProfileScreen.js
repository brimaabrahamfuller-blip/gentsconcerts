import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { AuthService } from '../AuthService';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUser();
    });
    return unsubscribe;
  }, [navigation]);

  const loadUser = async () => {
    const userData = await AuthService.getUser();
    setUser(userData);
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
          <View>
            <Text style={styles.name}>{user.fullName}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{(user.role || 'attendee').toUpperCase()}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <MenuItem icon="person-outline" title="Edit Profile" />
        <MenuItem icon="notifications-outline" title="Notifications" />
        <MenuItem icon="shield-checkmark-outline" title="Security" />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.dark },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.dark, padding: 40 },
  guestText: { color: 'grey', textAlign: 'center', marginTop: 20, marginBottom: 30 },
  loginBtn: { backgroundColor: theme.colors.gold, paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30 },
  loginBtnText: { color: theme.colors.dark, fontWeight: 'bold' },
  header: { padding: 30, paddingTop: 80, backgroundColor: theme.colors.nearBlack },
  profileInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: theme.colors.gold, justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  avatarText: { fontSize: 30, fontWeight: 'bold', color: theme.colors.dark },
  name: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  email: { color: 'grey', marginBottom: 5 },
  roleBadge: { backgroundColor: 'rgba(212, 175, 55, 0.1)', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  roleText: { color: theme.colors.gold, fontSize: 10, fontWeight: 'bold' },
  section: { padding: 20 },
  sectionTitle: { color: 'grey', fontSize: 12, textTransform: 'uppercase', marginBottom: 15, letterSpacing: 1 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuTitle: { marginLeft: 15, fontSize: 16 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40, marginBottom: 60 },
  logoutText: { color: '#F44336', fontSize: 16, fontWeight: 'bold', marginLeft: 10 }
});
