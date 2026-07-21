import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, FlatList, RefreshControl, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { AuthService } from '../AuthService';
import config from '../config';

const API_BASE = config.API_URL;

export default function OwnerDashboardScreen({ navigation }) {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeEvents: 0,
    totalUsers: 0,
    pendingFlags: 0
  });
  const [activity, setActivity] = useState([]);
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await AuthService.getToken();
      const headers = { 'Authorization': `Bearer ${token}` };

      const [statsRes, activityRes, flagsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/stats`, { headers }),
        fetch(`${API_BASE}/admin/activity`, { headers }),
        fetch(`${API_BASE}/admin/flags`, { headers })
      ]);

      const statsData = await statsRes.json();
      const activityData = await activityRes.json();
      const flagsData = await flagsRes.json();

      if (statsData.success) setStats(statsData.data);
      if (activityData.success) setActivity(activityData.data);
      if (flagsData.success) setFlags(flagsData.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleFlagAction = async (flagId, status, action) => {
    try {
      const token = await AuthService.getToken();
      const response = await fetch(`${API_BASE}/admin/flags/${flagId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status, actionTaken: action })
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Flag updated');
        fetchData();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update flag');
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.gold} size="large" />
        <Text style={{color: '#FFFFFF', marginTop: 10}}>Loading Owner Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.gold} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Owner Dashboard</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color={theme.colors.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.gold} />}
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard title="Revenue" value={`$${stats.totalRevenue}`} icon="cash" color="#4CAF50" />
          <StatCard title="Events" value={stats.activeEvents} icon="calendar" color={theme.colors.gold} />
          <StatCard title="Users" value={stats.totalUsers} icon="people" color="#2196F3" />
          <StatCard title="Flags" value={stats.pendingFlags} icon="flag" color="#F44336" />
        </View>

        {/* Pending Flags Section */}
        <SectionTitle title="Pending Flags" count={flags.filter(f => f.status === 'pending').length} />
        {flags.filter(f => f.status === 'pending').map(flag => (
          <View key={flag._id} style={styles.flagCard}>
            <View style={styles.flagHeader}>
              <Text style={styles.flagType}>{flag.targetType} Flag</Text>
              <Text style={styles.flagDate}>{new Date(flag.timestamp).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.flagReason}>{flag.reason}</Text>
            <Text style={styles.flagReporter}>Reported by: {flag.reporter?.fullName}</Text>
            <View style={styles.flagActions}>
              <TouchableOpacity 
                style={[styles.flagBtn, {backgroundColor: '#4CAF50'}]}
                onPress={() => handleFlagAction(flag._id, 'resolved', 'Dismissed after review')}
              >
                <Text style={styles.flagBtnText}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.flagBtn, {backgroundColor: '#F44336'}]}
                onPress={() => handleFlagAction(flag._id, 'resolved', 'Content Removed')}
              >
                <Text style={styles.flagBtnText}>Take Action</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Activity Feed */}
        <SectionTitle title="Real-Time Activity" />
        {activity.map(log => (
          <View key={log._id} style={styles.activityItem}>
            <View style={[styles.activityDot, {backgroundColor: getSeverityColor(log.severity)}]} />
            <View style={styles.activityContent}>
              <Text style={styles.activityAction}>{log.action}</Text>
              <Text style={styles.activityDetails}>{log.details}</Text>
              <Text style={styles.activityTime}>{new Date(log.timestamp).toLocaleTimeString()}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const StatCard = ({ title, value, icon, color }) => (
  <View style={styles.statCard}>
    <Ionicons name={icon} size={24} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

const SectionTitle = ({ title, count }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {count > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{count}</Text></View>}
  </View>
);

const getSeverityColor = (severity) => {
  switch (severity) {
    case 'critical': return '#F44336';
    case 'warning': return '#FF9800';
    default: return '#4CAF50';
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.dark },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.dark },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20,
    backgroundColor: theme.colors.nearBlack 
  },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', fontFamily: theme.fonts.heading },
  scrollContent: { padding: 15 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { 
    width: '48%', backgroundColor: theme.colors.nearBlack, padding: 15, 
    borderRadius: 12, marginBottom: 15, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  statValue: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginTop: 5 },
  statTitle: { color: 'grey', fontSize: 12, textTransform: 'uppercase' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 15 },
  sectionTitle: { color: theme.colors.gold, fontSize: 18, fontWeight: 'bold', fontFamily: theme.fonts.heading },
  badge: { backgroundColor: '#F44336', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  flagCard: { backgroundColor: theme.colors.nearBlack, padding: 15, borderRadius: 12, marginBottom: 15 },
  flagHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  flagType: { color: '#F44336', fontWeight: 'bold', fontSize: 12 },
  flagDate: { color: 'grey', fontSize: 12 },
  flagReason: { color: '#FFFFFF', fontSize: 14, marginBottom: 5 },
  flagReporter: { color: 'grey', fontSize: 12, marginBottom: 15 },
  flagActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  flagBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6, marginLeft: 10 },
  flagBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
  activityItem: { flexDirection: 'row', marginBottom: 20, paddingLeft: 10 },
  activityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, marginRight: 15 },
  activityContent: { flex: 1, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingBottom: 10 },
  activityAction: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  activityDetails: { color: 'grey', fontSize: 12, marginTop: 2 },
  activityTime: { color: theme.colors.gold, fontSize: 10, marginTop: 5 }
});
