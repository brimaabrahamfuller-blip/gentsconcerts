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
  Modal,
  TextInput,
  Button
} from 'react-native';

import config from '../config';
const API_BASE = config.API_URL;

export default function AdminDashboardScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [messages, setMessages] = useState([]);
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    date: '',
    time: '',
    venue: '',
    price: '',
    maxAttendees: ''
  });

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

  const handleSaveEvent = async () => {
    try {
      const url = editingEvent 
        ? `${API_BASE}/events/${editingEvent.id}` 
        : `${API_BASE}/events`;
      const method = editingEvent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        Alert.alert('Success', `Event ${editingEvent ? 'updated' : 'created'} successfully`);
        setModalVisible(false);
        setEditingEvent(null);
        setFormData({ name: '', category: '', date: '', time: '', venue: '', price: '', maxAttendees: '' });
        fetchDashboardData();
      } else {
        Alert.alert('Error', 'Failed to save event');
      }
    } catch (err) {
      Alert.alert('Error', 'An error occurred while saving');
    }
  };

  const handleDeleteEvent = (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' });
              if (response.ok) {
                fetchDashboardData();
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to delete event');
            }
          }
        }
      ]
    );
  };

  const openEditModal = (event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      category: event.category,
      date: event.date,
      time: event.time,
      venue: event.venue,
      price: String(event.price),
      maxAttendees: String(event.maxAttendees || '')
    });
    setModalVisible(true);
  };

  // Calculations
  const totalRevenue = tickets.reduce((sum, t) => sum + Number(t.total || 0), 0);
  const totalTickets = tickets.reduce((sum, t) => sum + Number(t.quantity || 1), 0);

  if (loading) {
    return (
      <View style={styles.center}>
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
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Manage Concerts</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => {
                  setEditingEvent(null);
                  setFormData({ name: '', category: '', date: '', time: '', venue: '', price: '', maxAttendees: '' });
                  setModalVisible(true);
                }}
              >
                <Text style={styles.addButtonText}>+ New Event</Text>
              </TouchableOpacity>
            </View>
            {events.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardMain}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardSub}>
                    {item.date} • {item.venue}
                  </Text>
                  <Text style={styles.cardPrice}>${Number(item.price).toFixed(2)}</Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => openEditModal(item)}>
                    <Text style={styles.editBtn}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteEvent(item.id)}>
                    <Text style={styles.deleteBtn}>Delete</Text>
                  </TouchableOpacity>
                </View>
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

      {/* Event Form Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingEvent ? 'Edit Event' : 'Create New Event'}</Text>
            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Event Name"
                placeholderTextColor="#94a3b8"
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
              />
              <TextInput
                style={styles.input}
                placeholder="Category (e.g. music, comedy)"
                placeholderTextColor="#94a3b8"
                value={formData.category}
                onChangeText={(text) => setFormData({...formData, category: text})}
              />
              <TextInput
                style={styles.input}
                placeholder="Date (e.g. July 25, 2026)"
                placeholderTextColor="#94a3b8"
                value={formData.date}
                onChangeText={(text) => setFormData({...formData, date: text})}
              />
              <TextInput
                style={styles.input}
                placeholder="Time (e.g. 8:00 PM)"
                placeholderTextColor="#94a3b8"
                value={formData.time}
                onChangeText={(text) => setFormData({...formData, time: text})}
              />
              <TextInput
                style={styles.input}
                placeholder="Venue"
                placeholderTextColor="#94a3b8"
                value={formData.venue}
                onChangeText={(text) => setFormData({...formData, venue: text})}
              />
              <TextInput
                style={styles.input}
                placeholder="Price"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={formData.price}
                onChangeText={(text) => setFormData({...formData, price: text})}
              />
              <TextInput
                style={styles.input}
                placeholder="Capacity"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={formData.maxAttendees}
                onChangeText={(text) => setFormData({...formData, maxAttendees: text})}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.cancelBtn]} 
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.btnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.saveBtn]} 
                  onPress={handleSaveEvent}
                >
                  <Text style={styles.btnText}>Save Event</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15 },
  backBtn: { color: '#f59e0b', fontSize: 16, marginRight: 20 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  addButton: { backgroundColor: '#f59e0b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  addButtonText: { color: '#0f172a', fontWeight: 'bold', fontSize: 12 },
  card: { backgroundColor: '#1e293b', padding: 15, borderRadius: 10, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between' },
  cardMain: { flex: 1 },
  cardActions: { justifyContent: 'space-around', alignItems: 'flex-end', marginLeft: 10 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cardSub: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  cardPrice: { color: '#10b981', fontSize: 16, fontWeight: 'bold', marginTop: 8 },
  editBtn: { color: '#3b82f6', fontWeight: 'bold' },
  deleteBtn: { color: '#ef4444', fontWeight: 'bold', marginTop: 10 },
  messageBody: { color: '#f8fafc', fontSize: 14, marginTop: 8 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1e293b', borderRadius: 15, padding: 20, maxHeight: '80%' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#0f172a', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 12 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  modalBtn: { flex: 0.48, padding: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#475569' },
  saveBtn: { backgroundColor: '#f59e0b' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});
