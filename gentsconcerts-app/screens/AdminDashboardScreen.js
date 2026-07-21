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
  const [messages, setMessages] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    price: '',
    maxAttendees: ''
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
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch events
      const eventsRes = await fetch(`${API_BASE}/events`);
      const eventsData = await eventsRes.json();
      if (eventsData.success) {
        // If user is host, filter events they created
        if (user.role === 'host') {
          setEvents(eventsData.data.events.filter(e => e.organizer === user._id));
        } else {
          setEvents(eventsData.data.events);
        }
      }

      // Fetch messages (simulated or real endpoint)
      // setMessages([...]);
      
    } catch (error) {
      console.error('Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEvent = async () => {
    if (!formData.title || !formData.date || !formData.venue || !formData.price) {
      Alert.alert('Error', 'Please fill in required fields');
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
          ...formData,
          price: Number(formData.price),
          maxAttendees: Number(formData.maxAttendees) || 100
        })
      });
      
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Event created successfully');
        setModalVisible(false);
        fetchData();
      } else {
        Alert.alert('Error', data.message || 'Failed to create event');
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
        <Text style={styles.cardPrice}>${item.price}</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => Alert.alert('Edit', 'Edit functionality coming soon')}>
          <Text style={styles.editBtn}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Alert.alert('Delete', 'Delete functionality coming soon')}>
          <Text style={styles.deleteBtn}>Delete</Text>
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
          style={[styles.tabItem, activeTab === 'messages' && styles.tabActive]} 
          onPress={() => setActiveTab('messages')}
        >
          <Text style={[styles.tabText, activeTab === 'messages' && styles.tabTextActive]}>MESSAGES</Text>
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
              ListEmptyComponent={<Text style={{color: '#94a3b8', textAlign: 'center', marginTop: 20}}>No events found</Text>}
            />
          </View>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>Messages</Text>
            <Text style={{color: '#94a3b8', textAlign: 'center', marginTop: 20}}>No messages found</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Event</Text>
            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Event Title"
                placeholderTextColor="#94a3b8"
                value={formData.title}
                onChangeText={(text) => setFormData({...formData, title: text})}
              />
              <TextInput
                style={[styles.input, {height: 80}]}
                placeholder="Description"
                placeholderTextColor="#94a3b8"
                multiline
                value={formData.description}
                onChangeText={(text) => setFormData({...formData, description: text})}
              />
              <TextInput
                style={styles.input}
                placeholder="Date (e.g. June 15, 2026)"
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
