import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

export default function ProfileScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={50} color={theme.colors.gold} />
            </View>
            <TouchableOpacity style={styles.editBtn}>
              <Ionicons name="camera" size={16} color={theme.colors.dark} />
            </TouchableOpacity>
          </View>
          <Text style={styles.username}>Brima Abraham</Text>
          <Text style={styles.email}>brima.a@example.com</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatItem label="Attended" value="12" />
          <StatItem label="Tickets" value="24" />
          <StatItem label="Hosted" value="2" />
        </View>

        {/* Menu List */}
        <View style={styles.menuContainer}>
          <MenuItem icon="ticket-outline" label="My Tickets" onPress={() => navigation.navigate('Tickets')} />
          <MenuItem icon="mic-outline" label="Host an Event" onPress={() => navigation.navigate('Host')} />
          <MenuItem icon="shield-checkmark-outline" label="Host Portal" onPress={() => navigation.navigate('AdminDashboard')} />
          <MenuItem icon="card-outline" label="Payment Methods" />
          <MenuItem icon="notifications-outline" label="Notifications" />
          <View style={styles.divider} />
          <MenuItem icon="document-text-outline" label="Terms and Conditions" />
          <MenuItem icon="shield-checkmark-outline" label="Privacy Policy" />
          <MenuItem icon="help-circle-outline" label="FAQ" />
          <MenuItem icon="mail-outline" label="Contact Us" onPress={() => navigation.navigate('Contact')} />
          <View style={styles.divider} />
          <MenuItem icon="log-out-outline" label="Logout" color={theme.colors.accentRed} />
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark,
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 30,
    backgroundColor: theme.colors.navyBlue,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.nearBlack,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.gold,
  },
  editBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.gold,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.navyBlue,
  },
  username: {
    fontFamily: theme.fonts.heading,
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  email: {
    color: theme.colors.gold,
    fontSize: 14,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.midBlue,
    paddingVertical: 20,
    marginHorizontal: 20,
    borderRadius: 15,
    marginTop: -25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.gold,
  },
  statLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    marginTop: 4,
    opacity: 0.7,
  },
  menuContainer: {
    padding: 20,
    marginTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuLabel: {
    marginLeft: 15,
    fontSize: 16,
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 10,
  },
  version: {
    textAlign: 'center',
    color: 'grey',
    fontSize: 10,
    marginBottom: 40,
  },
});
