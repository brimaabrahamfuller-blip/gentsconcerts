import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { AuthService } from '../AuthService';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await AuthService.getUser();
    setUser(userData);
    setLoading(false);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Logout', 
        style: 'destructive',
        onPress: async () => {
          await AuthService.logout();
          navigation.replace('Login');
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.gold} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={50} color={theme.colors.gold} />
            </View>
          </View>
          <Text style={styles.username}>{user?.fullName || 'Guest User'}</Text>
          <Text style={styles.email}>{user?.email || 'Not logged in'}</Text>
        </View>

        <View style={styles.statsRow}>
          <StatItem label="Attended" value="0" />
          <StatItem label="Tickets" value="0" />
          <StatItem label="Hosted" value="0" />
        </View>

        <View style={styles.menuContainer}>
          <MenuItem icon="ticket-outline" label="My Tickets" onPress={() => navigation.navigate('Tickets')} />
          <MenuItem icon="mic-outline" label="Host an Event" onPress={() => navigation.navigate('Host')} />
          <MenuItem icon="shield-checkmark-outline" label="Host Portal" onPress={() => navigation.navigate('AdminDashboard')} />
          <View style={styles.divider} />
          <MenuItem icon="mail-outline" label="Contact Us" onPress={() => navigation.navigate('Contact')} />
          <View style={styles.divider} />
          <MenuItem icon="log-out-outline" label="Logout" color={theme.colors.accentRed} onPress={handleLogout} />
        </View>

        <Text style={styles.version}>GentsConcerts v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const StatItem = ({ label, value }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const MenuItem = ({ icon, label, onPress, color = theme.colors.gold }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuLeft}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.menuLabel, { color: color === theme.colors.gold ? '#FFFFFF' : color }]}>{label}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color="grey" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.dark },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.dark },
  header: { alignItems: 'center', paddingTop: 80, paddingBottom: 30, backgroundColor: theme.colors.navyBlue },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.colors.nearBlack, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.colors.gold },
  username: { fontFamily: theme.fonts.heading, fontSize: 22, color: '#FFFFFF', fontWeight: 'bold' },
  email: { color: theme.colors.gold, fontSize: 14, marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: theme.colors.midBlue, paddingVertical: 20, marginHorizontal: 20, borderRadius: 15, marginTop: -25, elevation: 5 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: theme.colors.gold },
  statLabel: { fontSize: 10, color: '#FFFFFF', textTransform: 'uppercase', marginTop: 4, opacity: 0.7 },
  menuContainer: { padding: 20, marginTop: 10 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15 },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuLabel: { marginLeft: 15, fontSize: 16, color: '#FFFFFF' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 10 },
  version: { textAlign: 'center', color: 'grey', fontSize: 10, marginBottom: 40 }
});
