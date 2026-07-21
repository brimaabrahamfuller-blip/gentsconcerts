import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { theme } from '../styles/theme';
import { AuthService } from '../AuthService';
import config from '../config';

const API_BASE = config.API_URL;

export default function TicketsScreen({ navigation }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchTickets();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchTickets = async () => {
    const user = await AuthService.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = await AuthService.getToken();
      const response = await fetch(`${API_BASE}/tickets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTickets(data.data.tickets);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.gold} size="large" />
      </View>
    );
  }

  if (tickets.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="ticket-outline" size={80} color={theme.colors.gold} opacity={0.3} />
        <Text style={styles.emptyText}>No tickets yet. Explore events to get started.</Text>
        <TouchableOpacity 
          style={styles.exploreBtn}
          onPress={() => navigation.navigate('Events')}
        >
          <Text style={styles.exploreBtnText}>Explore Events</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>My Tickets</Text>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {tickets.map((ticket) => (
          <View key={ticket._id} style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketEvent} numberOfLines={1}>{ticket.event?.title || 'Unknown Event'}</Text>
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{ticket.ticketType}</Text>
              </View>
            </View>
            <View style={styles.ticketBody}>
              <View style={styles.qrContainer}>
                <QRCode
                  value={String(ticket._id)}
                  size={120}
                  color={theme.colors.dark}
                  backgroundColor="#FFFFFF"
                />
                <Text style={styles.ticketId}>{ticket._id.substring(0, 8)}</Text>
              </View>
              <View style={styles.ticketInfo}>
                <InfoItem label="Date" value={ticket.event?.date || 'TBD'} />
                <InfoItem label="Venue" value={ticket.event?.venue || 'TBD'} />
                <InfoItem label="Quantity" value={String(ticket.quantity)} />
                <InfoItem label="Total" value={`$${ticket.totalPrice}`} />
              </View>
            </View>
            <TouchableOpacity style={styles.downloadBtn} onPress={() => Alert.alert('Download', 'Ticket downloaded to your gallery')}>
              <Ionicons name="download-outline" size={20} color={theme.colors.dark} />
              <Text style={styles.downloadText}>Download Ticket</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const InfoItem = ({ label, value }) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.dark, paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.dark },
  pageTitle: { fontFamily: theme.fonts.heading, fontSize: 24, color: '#FFFFFF', paddingHorizontal: 20, marginBottom: 20 },
  scrollContent: { padding: 20 },
  emptyContainer: { flex: 1, backgroundColor: theme.colors.dark, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { color: theme.colors.gold, fontSize: 16, textAlign: 'center', marginTop: 20, marginBottom: 30 },
  exploreBtn: { backgroundColor: theme.colors.gold, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  exploreBtnText: { color: theme.colors.dark, fontWeight: 'bold' },
  ticketCard: { backgroundColor: '#FFFFFF', borderRadius: 15, overflow: 'hidden', marginBottom: 20 },
  ticketHeader: { backgroundColor: theme.colors.navyBlue, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketEvent: { fontFamily: theme.fonts.heading, fontSize: 18, color: '#FFFFFF', flex: 1 },
  typeBadge: { backgroundColor: theme.colors.gold, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  typeText: { color: theme.colors.dark, fontSize: 10, fontWeight: 'bold' },
  ticketBody: { flexDirection: 'row', padding: 20, backgroundColor: '#FFFFFF' },
  qrContainer: { alignItems: 'center', marginRight: 20 },
  ticketId: { marginTop: 10, fontSize: 10, color: theme.colors.dark, fontWeight: 'bold', letterSpacing: 1 },
  ticketInfo: { flex: 1, justifyContent: 'center' },
  infoItem: { marginBottom: 8 },
  infoLabel: { fontSize: 10, color: 'grey', textTransform: 'uppercase' },
  infoValue: { fontSize: 13, color: theme.colors.dark, fontWeight: 'bold' },
  downloadBtn: { backgroundColor: theme.colors.gold, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15 },
  downloadText: { color: theme.colors.dark, fontWeight: 'bold', marginLeft: 10 },
});
