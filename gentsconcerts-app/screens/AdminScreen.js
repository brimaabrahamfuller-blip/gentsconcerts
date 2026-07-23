import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { AuthService } from '../AuthService';

export default function AdminScreen({ navigation }) {
  const handleLogout = async () => {
    await AuthService.logout();
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Portal</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={theme.colors.gold} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>Welcome, Administrator</Text>
          <Text style={styles.subText}>System-wide management and oversight.</Text>
        </View>

        <View style={styles.menuGrid}>
          <MenuButton 
            icon="people-outline" 
            title="Manage Users" 
            onPress={() => {}} 
          />
          <MenuButton 
            icon="calendar-outline" 
            title="All Events" 
            onPress={() => {}} 
          />
          <MenuButton 
            icon="stats-chart-outline" 
            title="Platform Stats" 
            onPress={() => navigation.navigate('OwnerDashboard')} 
          />
          <MenuButton 
            icon="settings-outline" 
            title="Settings" 
            onPress={() => {}} 
          />
        </View>
        
        <TouchableOpacity 
          style={styles.exitBtn} 
          onPress={() => navigation.replace('Main')}
        >
          <Text style={styles.exitBtnText}>Go to Main App</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const MenuButton = ({ icon, title, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Ionicons name={icon} size={32} color={theme.colors.gold} />
    <Text style={styles.menuTitle}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: theme.fonts.heading,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeCard: {
    backgroundColor: theme.colors.nearBlack,
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.gold,
    marginBottom: 5,
  },
  subText: {
    color: 'grey',
    fontSize: 14,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    backgroundColor: theme.colors.nearBlack,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  menuTitle: {
    color: '#FFFFFF',
    marginTop: 10,
    fontWeight: '600',
  },
  exitBtn: {
    marginTop: 'auto',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.gold,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  exitBtnText: {
    color: theme.colors.gold,
    fontWeight: 'bold',
  }
});
