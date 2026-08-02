import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Alert, FlatList, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { AuthService } from '../AuthService';
import config from '../config';
import { HeaderLogo } from '../components/Logo';
import Watermark from '../components/Watermark';
import PageAnimation from '../components/PageAnimation';

const API_BASE = config.API_URL;

// Web-compatible alert function
const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function AdminScreen({ navigation }) {
  const [activeView, setActiveView] = useState('menu');
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const token = await AuthService.getToken();
      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      } else {
        showAlert('Error', data.message || 'Failed to fetch admin data');
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      showAlert('Network Error', 'Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/events`);
      const data = await response.json();
      if (data.success) {
        setEvents(data.data);
      }
      setActiveView('events');
    } catch (error) {
      console.error('Error fetching events:', error);
      showAlert('Error', 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const shouldLogout = Platform.OS === 'web' 
      ? confirm('Are you sure you want to logout?')
      : await new Promise(resolve => {
          Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', onPress: () => resolve(false) },
            { text: 'Logout', onPress: () => resolve(true) }
          ]);
        });
    
    if (shouldLogout) {
      await AuthService.logout();
      navigation.replace('Login');
    }
  };

  const openSettings = () => {
    navigation.navigate('OwnerDashboard');
  };

  return (
    <PageAnimation>
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <HeaderLogo navigation={navigation} />
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={theme.colors.gold} />
        </TouchableOpacity>
      </View>

      {activeView === 'menu' ? (
        <View style={styles.content}>
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeText}>Welcome, Administrator</Text>
            <Text style={styles.subText}>System-wide management and oversight.</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={theme.colors.gold} size="large" />
            </View>
          ) : (
            <View style={styles.menuGrid}>
              <MenuButton
                icon="people-outline"
                title="Manage Users"
                onPress={() => navigation.navigate('OwnerDashboard')}
              />
              <MenuButton
                icon="calendar-outline"
                title="All Events"
                onPress={fetchAllEvents}
              />
              <MenuButton
                icon="stats-chart-outline"
                title="Platform Stats"
                onPress={() => navigation.navigate('OwnerDashboard')}
              />
              <MenuButton
                icon="settings-outline"
                title="Settings"
                onPress={openSettings}
              />
            </View>
          )}

          <TouchableOpacity
            style={styles.exitBtn}
            onPress={() => navigation.replace('Main')}
          >
            <Text style={styles.exitBtnText}>Go to Main App</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#F44336" />
            <Text style={styles.logoutBtnText}>Logout from Admin Portal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Events</Text>
            <TouchableOpacity onPress={() => setActiveView('menu')}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.gold} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={events}
            keyExtractor={(item) => item._id || String(item.id)}
            renderItem={({ item }) => (
              <View style={styles.eventCard}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventMeta}>{item.date} • {item.venue}</Text>
                <Text style={styles.eventCategory}>{item.category}</Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No events found.</Text>
            }
          />
        </View>
      )}

      <Watermark />
    </SafeAreaView>
    </PageAnimation>
  );
}

const MenuButton = ({ icon, title, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Ionicons name={icon} size={32} color={theme.colors.gold} />
    <Text style={styles.menuTitle}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.dark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  title: { fontFamily: theme.fonts.heading, fontSize: 24, color: '#FFFFFF', fontWeight: 'bold' },
  content: { flex: 1, padding: 20 },
  welcomeCard: { backgroundColor: theme.colors.navyBlue, padding: 20, borderRadius: 12, marginBottom: 30, borderWidth: 1, borderColor: theme.colors.gold },
  welcomeText: { fontFamily: theme.fonts.heading, fontSize: 22, color: theme.colors.gold, marginBottom: 5 },
  subText: { color: '#FFFFFF', fontSize: 14, opacity: 0.8 },
  loadingContainer: { paddingVertical: 50, alignItems: 'center' },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuItem: { width: '48%', backgroundColor: theme.colors.nearBlack, padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)' },
  menuTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  exitBtn: { backgroundColor: 'rgba(244,67,54,0.1)', padding: 15, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#F44336', marginBottom: 15 },
  exitBtnText: { color: '#F44336', fontSize: 16, fontWeight: 'bold' },
  logoutBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 15,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.2)'
  },
  logoutBtnText: { color: '#F44336', fontWeight: 'bold', marginLeft: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontFamily: theme.fonts.heading, fontSize: 18, color: '#FFFFFF' },
  eventCard: { backgroundColor: theme.colors.nearBlack, padding: 15, borderRadius: 8, marginBottom: 10 },
  eventTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  eventMeta: { color: theme.colors.gold, fontSize: 12, marginBottom: 3 },
  eventCategory: { color: theme.colors.lightGrey, fontSize: 12, textTransform: 'capitalize' },
  emptyText: { color: theme.colors.lightGrey, textAlign: 'center', marginTop: 40, fontSize: 16 }
});
