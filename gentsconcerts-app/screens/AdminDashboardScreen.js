import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  FlatList, ActivityIndicator, Modal, TextInput, Alert, Image, Platform, RefreshControl, useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../styles/theme';
import { AuthService } from '../AuthService';
import config from '../config';
import { HeaderLogo } from '../components/Logo';
import Watermark from '../components/Watermark';
import UserAvatar from '../components/UserAvatar';
import { getMediaUrl } from '../utils/media';
import PageAnimation from '../components/PageAnimation';

const API_BASE = config.API_URL;

export default function AdminDashboardScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isCompact = width < 600;
  const [activeTab, setActiveTab] = useState('events'); // 'events', 'analytics', 'security'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Music',
    date: '',
    time: '',
    venue: '',
    city: 'Monrovia',
    country: 'Liberia',
    tiers: [{ name: 'Regular', price: '', quantity: '' }]
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [existingFlyer, setExistingFlyer] = useState(null);
  const [selectedPromoVideo, setSelectedPromoVideo] = useState(null);
  const [existingPromoVideo, setExistingPromoVideo] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const user = await AuthService.getUser();
    setCurrentUser(user);
    
    try {
      const token = await AuthService.getToken();
      const eventsRes = await fetch(`${API_BASE}/events/host/my-events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const eventsData = await eventsRes.json();
      if (eventsData.success) {
        setEvents(eventsData.data);
      }
    } catch (error) {
      console.error('Fetch Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your photos to upload a flyer.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: false
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const pickPromoVideo = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your videos to upload an event preview.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      videoMaxDuration: 120
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 45 * 1024 * 1024) {
        Alert.alert('Video Too Large', 'Please choose an MP4, MOV, or WebM video smaller than 45MB.');
        return;
      }
      setSelectedPromoVideo(asset);
    }
  };

  const addTier = () => {
    if (formData.tiers.length >= 5) {
      Alert.alert('Limit', 'Maximum 5 ticket tiers allowed');
      return;
    }
    setFormData({ ...formData, tiers: [...formData.tiers, { name: '', price: '', quantity: '' }] });
  };

  const removeTier = (index) => {
    if (formData.tiers.length <= 1) return;
    const newTiers = formData.tiers.filter((_, i) => i !== index);
    setFormData({ ...formData, tiers: newTiers });
  };

  const updateTier = (index, field, value) => {
    const newTiers = [...formData.tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setFormData({ ...formData, tiers: newTiers });
  };

  const handleSaveEvent = async (submitForReview = false) => {
    if (!formData.title || !formData.date || !formData.venue) {
      Alert.alert('Error', 'Please fill in all required fields (title, date, venue)');
      return;
    }

    setSaving(true);
    try {
      const token = await AuthService.getToken();
      const formBody = new FormData();
      formBody.append('title', formData.title);
      formBody.append('description', formData.description || '');
      formBody.append('category', formData.category);
      formBody.append('date', formData.date);
      formBody.append('time', formData.time);
      formBody.append('venue', formData.venue);
      formBody.append('city', formData.city);
      formBody.append('country', formData.country);
      formBody.append('ticketTiers', JSON.stringify(formData.tiers.map(t => ({
        name: t.name, price: Number(t.price), quantity: Number(t.quantity)
      }))));
      
      if (submitForReview) formBody.append('status', 'pending_review');

      if (selectedImage) {
        const filename = selectedImage.split('/').pop();
        const match = /\.([a-zA-Z0-9]+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        formBody.append('flyerImage', { uri: selectedImage, name: filename, type });
      }

      const response = await fetch(
        editMode ? `${API_BASE}/events/${editingEventId}` : `${API_BASE}/events`,
        {
          method: editMode ? 'PUT' : 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formBody
        }
      );
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', submitForReview ? 'Event submitted for review!' : 'Event saved as draft.');
        setModalVisible(false);
        fetchData();
      } else {
        Alert.alert('Error', data.message || 'Failed to save event');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const renderPendingView = () => (
    <View style={styles.pendingContainer}>
      <Ionicons name="time-outline" size={80} color={theme.colors.gold} />
      <Text style={styles.pendingTitle}>Application Pending</Text>
      <Text style={styles.pendingText}>
        Your host application is currently under review by our team. You will gain access to the full operator console once approved.
      </Text>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEventItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{flex: 1}}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSubtitle}>{item.date} • {item.venue}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'published' ? '#4CAF50' : theme.colors.gold }]}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.cardMetrics}>
        <MetricItem label="Sold" value={item.ticketTiers?.reduce((acc, t) => acc + (t.sold || 0), 0)} />
        <MetricItem label="Capacity" value={item.ticketTiers?.reduce((acc, t) => acc + (t.quantity || 0), 0)} />
        <MetricItem label="Revenue" value={`$${item.ticketTiers?.reduce((acc, t) => acc + (t.sold || 0) * t.price, 0).toFixed(0)}`} />
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => { setEditMode(true); setEditingEventId(item._id); setFormData({ ...item, tiers: item.ticketTiers.map(t => ({...t, price: String(t.price), quantity: String(t.quantity)})) }); setModalVisible(true); }}>
          <Ionicons name="create-outline" size={18} color={theme.colors.gold} />
          <Text style={styles.actionBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, {borderColor: '#F44336'}]} onPress={() => Alert.alert('Cancel Event', 'Are you sure?', [{text: 'No'}, {text: 'Yes', onPress: () => {}}])}>
          <Ionicons name="trash-outline" size={18} color="#F44336" />
          <Text style={[styles.actionBtnText, {color: '#F44336'}]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator color={theme.colors.gold} size="large" /></View>;

  if (currentUser?.hostApprovalStatus !== 'approved') return renderPendingView();

  return (
    <PageAnimation>
      <View style={styles.container}>
        <View style={styles.header}>
          <HeaderLogo navigation={navigation} />
          <Text style={styles.headerTitle}>Host Portal</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}><UserAvatar size={38} /></TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity style={[styles.tabItem, activeTab === 'events' && styles.tabActive]} onPress={() => setActiveTab('events')}>
            <Text style={[styles.tabText, activeTab === 'events' && styles.tabTextActive]}>EVENTS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabItem, activeTab === 'analytics' && styles.tabActive]} onPress={() => setActiveTab('analytics')}>
            <Text style={[styles.tabText, activeTab === 'analytics' && styles.tabTextActive]}>ANALYTICS</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.gold} />}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{activeTab === 'events' ? 'Your Events' : 'Performance'}</Text>
            {activeTab === 'events' && (
              <TouchableOpacity style={styles.addButton} onPress={() => { setEditMode(false); resetForm(); setModalVisible(true); }}>
                <Text style={styles.addButtonText}>+ Create Event</Text>
              </TouchableOpacity>
            )}
          </View>

          {activeTab === 'events' ? (
            <FlatList data={events} renderItem={renderEventItem} keyExtractor={item => item._id} scrollEnabled={false} ListEmptyComponent={<Text style={styles.emptyText}>No events yet. Create one to get started!</Text>} />
          ) : (
            <View style={styles.analyticsGrid}>
              <StatCard title="Total Tickets" value={events.reduce((acc, e) => acc + e.ticketTiers.reduce((s, t) => s + t.sold, 0), 0)} icon="ticket" color={theme.colors.gold} />
              <StatCard title="Total Revenue" value={`$${events.reduce((acc, e) => acc + e.ticketTiers.reduce((s, t) => s + t.sold * t.price, 0), 0)}`} icon="cash" color="#4CAF50" />
              <StatCard title="Active Events" value={events.filter(e => e.status === 'published').length} icon="calendar" color="#2196F3" />
              <StatCard title="Avg Attendance" value="85%" icon="people" color="#9C27B0" />
            </View>
          )}
          <Watermark />
        </ScrollView>

        <Modal visible={modalVisible} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editMode ? 'Edit Event' : 'New Event'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={28} color="#fff" /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.inputLabel}>Flyer Image</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {selectedImage ? <Image source={{uri: selectedImage}} style={styles.imagePreview} /> : <View style={styles.imagePlaceholder}><Ionicons name="image-outline" size={40} color="grey" /><Text style={{color: 'grey'}}>Upload Flyer</Text></View>}
              </TouchableOpacity>

              <TextInput style={styles.input} placeholder="Event Title" placeholderTextColor="grey" value={formData.title} onChangeText={t => setFormData({...formData, title: t})} />
              <TextInput style={[styles.input, {height: 100}]} placeholder="Description" placeholderTextColor="grey" multiline value={formData.description} onChangeText={t => setFormData({...formData, description: t})} />
              
              <View style={styles.row}>
                <TextInput style={[styles.input, {flex: 1, marginRight: 10}]} placeholder="Date (e.g. Aug 23, 2026)" placeholderTextColor="grey" value={formData.date} onChangeText={t => setFormData({...formData, date: t})} />
                <TextInput style={[styles.input, {flex: 1}]} placeholder="Time" placeholderTextColor="grey" value={formData.time} onChangeText={t => setFormData({...formData, time: t})} />
              </View>

              <TextInput style={styles.input} placeholder="Venue" placeholderTextColor="grey" value={formData.venue} onChangeText={t => setFormData({...formData, venue: t})} />

              <Text style={styles.sectionTitle}>Ticket Tiers</Text>
              {formData.tiers.map((tier, i) => (
                <View key={i} style={styles.tierRow}>
                  <TextInput style={[styles.input, {flex: 2, marginRight: 10}]} placeholder="Name" placeholderTextColor="grey" value={tier.name} onChangeText={v => updateTier(i, 'name', v)} />
                  <TextInput style={[styles.input, {flex: 1, marginRight: 10}]} placeholder="Price" placeholderTextColor="grey" keyboardType="numeric" value={tier.price} onChangeText={v => updateTier(i, 'price', v)} />
                  <TextInput style={[styles.input, {flex: 1}]} placeholder="Qty" placeholderTextColor="grey" keyboardType="numeric" value={tier.quantity} onChangeText={v => updateTier(i, 'quantity', v)} />
                </View>
              ))}
              <TouchableOpacity style={styles.addTierBtn} onPress={addTier}><Text style={{color: theme.colors.gold}}>+ Add Tier</Text></TouchableOpacity>

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.saveBtn, {backgroundColor: 'grey'}]} onPress={() => handleSaveEvent(false)} disabled={saving}><Text style={styles.btnText}>Save Draft</Text></TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={() => handleSaveEvent(true)} disabled={saving}><Text style={styles.btnText}>Submit for Review</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </PageAnimation>
  );
}

const MetricItem = ({ label, value }) => (
  <View style={styles.metricItem}>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const StatCard = ({ title, value, icon, color }) => (
  <View style={styles.statCard}>
    <Ionicons name={icon} size={28} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 15, backgroundColor: '#1e293b' },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  tabBar: { flexDirection: 'row', backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 18 },
  tabActive: { borderBottomWidth: 3, borderBottomColor: theme.colors.gold },
  tabText: { color: 'grey', fontSize: 16, fontWeight: 'bold' },
  tabTextActive: { color: theme.colors.gold },
  content: { padding: 22 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  sectionTitle: { color: theme.colors.gold, fontSize: 24, fontWeight: 'bold' },
  addButton: { backgroundColor: theme.colors.gold, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: '#0f172a', fontWeight: 'bold' },
  card: { backgroundColor: '#1e293b', padding: 20, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  cardTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  cardSubtitle: { color: 'grey', fontSize: 16, marginTop: 4 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  cardMetrics: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', padding: 18, borderRadius: 12, marginBottom: 18 },
  metricItem: { alignItems: 'center' },
  metricValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  metricLabel: { color: 'grey', fontSize: 12, marginTop: 6, textTransform: 'uppercase' },
  cardActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.gold, borderRadius: 8, paddingVertical: 10, gap: 8 },
  actionBtnText: { color: theme.colors.gold, fontSize: 14, fontWeight: 'bold' },
  pendingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#0f172a' },
  pendingTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  pendingText: { color: 'grey', fontSize: 16, textAlign: 'center', marginTop: 15, lineHeight: 24 },
  logoutBtn: { marginTop: 30, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25, backgroundColor: 'rgba(244,67,54,0.1)', borderWidth: 1, borderColor: '#F44336' },
  logoutBtnText: { color: '#F44336', fontWeight: 'bold' },
  analyticsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '48%', backgroundColor: '#1e293b', padding: 20, borderRadius: 15, marginBottom: 15, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 10 },
  statLabel: { color: 'grey', fontSize: 12, marginTop: 4 },
  modalContainer: { flex: 1, backgroundColor: '#0f172a' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#1e293b' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  modalContent: { padding: 20 },
  inputLabel: { color: 'grey', fontSize: 12, marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: '#1e293b', color: '#fff', borderRadius: 10, padding: 15, marginBottom: 15, fontSize: 16 },
  imagePicker: { height: 200, backgroundColor: '#1e293b', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  imagePreview: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center' },
  row: { flexDirection: 'row' },
  tierRow: { flexDirection: 'row', marginBottom: 10 },
  addTierBtn: { padding: 10, marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 15, marginTop: 20 },
  saveBtn: { flex: 1, backgroundColor: theme.colors.gold, padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#0f172a', fontWeight: 'bold', fontSize: 16 },
  emptyText: { color: 'grey', textAlign: 'center', marginTop: 40, fontSize: 16 }
});
