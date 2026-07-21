import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';

const API_BASE = 'http://localhost:3000/api'; // Replace with your live API URL when deployed

export default function AdminDashboardScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [eventsRes, ticketsRes, contactsRes] = await Promise.all([
        fetch(`${API_BASE}/events`),
        fetch(`${API_BASE}/tickets`),
        fetch(`${API_BASE}/contact`),
      ]);

      const eventsData = await eventsRes.json();
      const ticketsData = await ticketsRes.json();
      const contactsData = await contactsRes.json();

      setEvents(eventsData || []);
      setTickets(ticketsData || []);
      setMessages(contactsData || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      Alert.alert('Error', 'Unable to load host metrics.');
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const totalRevenue = tickets.reduce((sum, t) => sum + Number(t.total || 0), 0);
  const totalTickets = tickets.reduce((sum, t) => sum + Number(t.quantity || 1), 0);

  if (loading) {
    return (
      <View class={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Host Portal</Text>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabBar}>
        {['dashboard', 'events', 'tickets', 'messages'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Body Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'dashboard' && (
          <View>
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Revenue</Text>
                <Text style={styles.kpiValue}>${totalRevenue.toFixed(2)}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Tickets Sold</Text>
                <Text style={styles.kpiValue}>{totalTickets}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Active Events</Text>
                <Text style={styles.kpiValue}>{events.length}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Inquiries</Text>
                <Text style={styles.kpiValue}>{messages.length}</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'events' && (
          <View>
            <Text style={styles.sectionTitle}>Manage Concerts</Text>
            {events.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSub}>
                  {item.date} • {item.venue}
                </Text>
                <Text style={styles.cardPrice}>${Number(item.price).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'tickets' && (
          <View>
            <Text style={styles.sectionTitle}>Ticket Sales</Text>
            {tickets.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.cardTitle}>{item.event}</Text>
                <Text style={styles.cardSub}>
                  Qty: {item.quantity || 1} • Date: {item.date}
                </Text>
                <Text style={styles.cardPrice}>${Number(item.total || 0).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'messages' && (
          <View>
            <Text style={styles.sectionTitle}>Customer Inquiries</Text>
            {messages.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.cardTitle}>{item.subject}</Text>
                <Text style={styles.cardSub}>From: {item.name} ({item.email})</Text>
                <Text style={styles.messageBody}>{item.message}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15 },
  backBtn: { color: '#f59e0b', fontSize: 16, marginRight: 20 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', fontFamily: 'PlayfairDisplay_700Bold' },
  tabBar: { flexDirection: 'row', backgroundColor: '#1e293b', paddingVertical: 10 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#f59e0b' },
  tabText: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
  tabTextActive: { color: '#f59e0b' },
  content: { padding: 20 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  kpiCard: { backgroundColor: '#1e293b', width: '48%', padding: 15, borderRadius: 10, marginBottom: 15 },
  kpiLabel: { color: '#94a3b8', fontSize: 12 },
  kpiValue: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 5 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  card: { backgroundColor: '#1e293b', padding: 15, borderRadius: 10, marginBottom: 12 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cardSub: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  cardPrice: { color: '#10b981', fontSize: 16, fontWeight: 'bold', marginTop: 8 },
  messageBody: { color: '#f8fafc', fontSize: 14, marginTop: 8 },
});
