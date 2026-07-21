import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  FlatList, ActivityIndicator, Modal, TextInput, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { AuthService } from '../AuthService';
import config from '../config';

const API_BASE = config.API_URL;

export default function AdminDashboardScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('events');
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Music',
    date: '',
    time: '',
    venue: '',
    city: 'Monrovia',
    country: 'Liberia',
    tierName: 'Regular',
    tierPrice: '',
    tierQuantity: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const user = await AuthService.getUser();
    setCurrentUser(user);
    
    try {
      const token = await AuthService.getToken();
      
      // Fetch host's events: GET /events/host/my-events
      const eventsRes = await fetch(`${API_BASE}/events/host/my-events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const eventsData = await eventsRes.json();
      if (eventsData.success) {
        setEvents(eventsData.data);
      } else {
        setEvents([]);
      }

    } catch (error) {
      console.error('Fetch Error:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEvent = async () => {
    if (!formData.title || !formData.date || !formData.venue || !formData.tierPrice) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const token = await AuthService.getToken();
      const response = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || 'Join us for an amazing event!',
          category: formData.category || 'Music',
          date: formData.date,
          time: formData.time || '8:00 PM',
          venue: formData.venue,
          city: formData.city || 'Monrovia',
          country: formData.country || 'Liberia',
          ticketTiers: [{
            name: formData.tierName || 'Regular',
            price: Number(formData.tierPrice),
            quantity: Number(formData.tierQuantity) || 100,
            sold: 0
          }]
        })
      });
      
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Event created successfully');
        setModalVisible(false);
        // Reset form
        setFormData({
          title: '',
          description: '',
          category: 'Music',
          date: '',
          time: '',
          venue: '',
          city: 'Monrovia',
          country: 'Liberia',
          tierName: 'Regular',
          tierPrice: '',
          tierQuantity: ''
        });
        fetchData();
      } else {
        Alert.alert('Error', data.message || 'Failed to create event');
      }
    } catch (error) {
      console.error('Event Creation Error:', error);
      Alert.alert('Error', 'Network error');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const token = await AuthService.getToken();
      const response = await fetch(`${API_BASE}/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Event cancelled successfully');
        fetchData();
      } else {
        Alert.alert('Error', data.message || 'Failed to cancel event');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
    }
  };

  const renderEventItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardMain}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardSub}>{item.date} • {item.venue}</Text>
        <Text style={styles.cardCategory}>{item.category}</Text>
        {item.ticketTiers && item.ticketTiers.length > 0 && (
          <Text style={styles.cardPrice}>
            From ${Math.min(...item.ticketTiers.map(t => t.price))}
          </Text>
        )}
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => Alert.alert('Edit', 'Edit functionality coming soon')}
        >
          <Ionicons name="create-outline" size={18} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => {
            Alert.alert(
              'Cancel Event',
              `Are you sure you want to cancel "${item.title}"?`,
              [
                { text: 'No', style: 'cancel' },
                { text: 'Yes', onPress: () => handleDeleteEvent(item._id) }
              ]
            );
          }}
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.gold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.replace('Main')}>
          <Text style={styles.backBtn}>Exit Portal</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{currentUser?.role === 'admin' ? 'Admin Panel' : 'Host Dashboard'}</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'events' && styles.tabActive]} 
          onPress={() => setActiveTab('events')}
        >
          <Text style={[styles.tabText, activeTab === 'events' && styles.tabTextActive]}>EVENTS</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'stats' && styles.tabActive]} 
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>STATS</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'events' ? (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Events</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                <Text style={styles.addButtonText}>+ NEW EVENT</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={events}
              renderItem={renderEventItem}
              keyExtractor={item => item._id}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={48} color={theme.colors.gold} opacity={0.3} />
                  <Text style={styles.emptyText}>No events yet</Text>
                  <Text style={styles.emptySubtext}>Create your first event to get started</Text>
                </View>
              }
            />
          </View>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>Dashboard Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{events.length}</Text>
                <Text style={styles.statLabel}>Total Events</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {events.reduce((acc, e) => acc + (e.ticketTiers || []).reduce((sum, t) => sum + (t.sold || 0), 0), 0)}
                </Text>
                <Text style={styles.statLabel}>Tickets Sold</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Event</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.inputLabel}>Event Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="My Amazing Concert"
                placeholderTextColor="#94a3b8"
                value={formData.title}
                onChangeText={(text) => setFormData({...formData, title: text})}
              />
              
              <Text style={styles.inputLabel}>Category *</Text>
              <View style={styles.categoryRow}>
                {['Music', 'Comedy', 'Cultural', 'Sports', 'Food'].map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryBtn, formData.category === cat && styles.categoryBtnActive]}
                    onPress={() => setFormData({...formData, category: cat})}
                  >
                    <Text style={[styles.categoryBtnText, formData.category === cat && styles.categoryBtnTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, {height: 80}]}
                placeholder="Describe your event..."
                placeholderTextColor="#94a3b8"
                multiline
                value={formData.description}
                onChangeText={(text) => setFormData({...formData, description: text})}
              />

              <View style={styles.row}>
                <View style={{flex: 1, marginRight: 8}}>
                  <Text style={styles.inputLabel}>Date *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Aug 15, 2026"
                    placeholderTextColor="#94a3b8"
                    value={formData.date}
                    onChangeText={(text) => setFormData({...formData, date: text})}
                  />
                </View>
                <View style={{flex: 1, marginLeft: 8}}>
                  <Text style={styles.inputLabel}>Time *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="8:00 PM"
                    placeholderTextColor="#94a3b8"
                    value={formData.time}
                    onChangeText={(text) => setFormData({...formData, time: text})}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Venue *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. SKD Stadium"
                placeholderTextColor="#94a3b8"
                value={formData.venue}
                onChangeText={(text) => setFormData({...formData, venue: text})}
              />

              <View style={styles.row}>
                <View style={{flex: 1, marginRight: 8}}>
                  <Text style={styles.inputLabel}>City</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Monrovia"
                    placeholderTextColor="#94a3b8"
                    value={formData.city}
                    onChangeText={(text) => setFormData({...formData, city: text})}
                  />
                </View>
                <View style={{flex: 1, marginLeft: 8}}>
                  <Text style={styles.inputLabel}>Country</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Liberia"
                    placeholderTextColor="#94a3b8"
                    value={formData.country}
                    onChangeText={(text) => setFormData({...formData, country: text})}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Ticket Tier Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Regular, VIP, VVIP"
                placeholderTextColor="#94a3b8"
                value={formData.tierName}
                onChangeText={(text) => setFormData({...formData, tierName: text})}
              />

              <View style={styles.row}>
                <View style={{flex: 1, marginRight: 8}}>
                  <Text style={styles.inputLabel}>Price (USD) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="15"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={formData.tierPrice}
                    onChangeText={(text) => setFormData({...formData, tierPrice: text})}
                  />
                </View>
                <View style={{flex: 1, marginLeft: 8}}>
                  <Text style={styles.inputLabel}>Quantity</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="100"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={formData.tierQuantity}
                    onChangeText={(text) => setFormData({...formData, tierQuantity: text})}
                  />
                </View>
              </View>

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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  addButton: { backgroundColor: '#f59e0b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  addButtonText: { color: '#0f172a', fontWeight: 'bold', fontSize: 12 },
  card: { backgroundColor: '#1e293b', padding: 15, borderRadius: 10, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardMain: { flex: 1 },
  cardActions: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cardSub: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  cardCategory: { color: '#f59e0b', fontSize: 11, marginTop: 4, textTransform: 'uppercase' },
  cardPrice: { color: '#10b981', fontSize: 16, fontWeight: 'bold', marginTop: 8 },
  actionBtn: { padding: 8, marginLeft: 5 },
  emptyState: { alignItems: 'center', marginTop: 40, padding: 30 },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 10 },
  emptySubtext: { color: '#94a3b8', fontSize: 12, marginTop: 5 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 15 },
  statCard: { width: '48%', backgroundColor: '#1e293b', padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  statValue: { color: '#f59e0b', fontSize: 28, fontWeight: 'bold' },
  statLabel: { color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', marginTop: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1e293b', borderRadius: 15, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  inputLabel: { color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', marginBottom: 6, marginTop: 10, letterSpacing: 0.5 },
  input: { backgroundColor: '#0f172a', color: '#fff', padding: 12, borderRadius: 8, fontSize: 14 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  categoryBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#94a3b8' },
  categoryBtnActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  categoryBtnText: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
  categoryBtnTextActive: { color: '#0f172a' },
  row: { flexDirection: 'row', marginTop: 5 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 20 },
  modalBtn: { flex: 0.48, padding: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#475569' },
  saveBtn: { backgroundColor: '#f59e0b' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});
