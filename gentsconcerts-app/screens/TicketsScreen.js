import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { theme } from '../styles/theme';
import { AuthService } from '../AuthService';
import config from '../config';

const API_BASE = config.API_URL;

import { HeaderLogo } from '../components/Logo';

export default function TicketsScreen({ navigation }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retrying, setRetrying] = useState(null);

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
      // Backend endpoint: GET /users/my-tickets (protected route)
      const response = await fetch(`${API_BASE}/users/my-tickets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTickets(data.data);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  };

  const retryPayment = async (ticketId) => {
    setRetrying(ticketId);
    try {
      const token = await AuthService.getToken();
      const response = await fetch(`${API_BASE}/payments/retry/${ticketId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert(
          'Payment Retried',
          'A new payment request has been sent to your MTN Mobile Money. Please complete the payment on your phone.',
          [{ text: 'OK', onPress: () => fetchTickets() }]
        );
      } else {
        Alert.alert('Retry Failed', data.message || 'Could not retry payment');
      }
    } catch (error) {
      console.error('Retry Error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setRetrying(null);
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
      <View style={styles.header}>
        <HeaderLogo navigation={navigation} />
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-circle-outline" size={28} color={theme.colors.gold} />
        </TouchableOpacity>
      </View>
      <Text style={styles.pageTitle}>My Tickets</Text>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.gold} />
        }
      >
        {tickets.map((ticket) => {
          const isPending = ticket.paymentStatus === 'pending';
          const isConfirmed = ticket.paymentStatus === 'confirmed';
          const isUsed = ticket.isUsed;

          return (
            <View key={ticket._id} style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketEvent} numberOfLines={1}>{ticket.eventId?.title || 'Event'}</Text>
                <View style={[styles.typeBadge, isPending && styles.typeBadgePending, isUsed && styles.typeBadgeUsed]}>
                  <Text style={[styles.typeText, isPending && styles.typeTextPending, isUsed && styles.typeTextUsed]}>
                    {isUsed ? 'USED' : isPending ? 'PENDING' : ticket.tierName}
                  </Text>
                </View>
              </View>
              <View style={styles.ticketBody}>
                {isConfirmed && !isUsed ? (
                  <>
                    <View style={styles.qrContainer}>
                      {ticket.qrCode ? (
                        <QRCode
                          value={ticket.qrCode}
                          size={120}
                          color={theme.colors.dark}
                          backgroundColor="#FFFFFF"
                        />
                      ) : (
                        <QRCode
                          value={String(ticket._id)}
                          size={120}
                          color={theme.colors.dark}
                          backgroundColor="#FFFFFF"
                        />
                      )}
                      <Text style={styles.ticketId}>{ticket._id.substring(0, 8)}</Text>
                    </View>
                  </>
                ) : isUsed ? (
                  <View style={styles.usedPlaceholder}>
                    <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
                    <Text style={styles.usedText}>Ticket Used</Text>
                  </View>
                ) : (
                  <View style={styles.pendingPlaceholder}>
                    <Ionicons name="time-outline" size={60} color="#FF9800" />
                    <Text style={styles.pendingText}>Awaiting Payment</Text>
                  </View>
                )}
                <View style={styles.ticketInfo}>
                  <InfoItem label="Date" value={ticket.eventId?.date ? new Date(ticket.eventId.date).toLocaleDateString() : 'TBD'} />
                  <InfoItem label="Venue" value={ticket.eventId?.venue || 'TBD'} />
                  <InfoItem label="Quantity" value={String(ticket.quantity)} />
                  <InfoItem label="Total" value={`$${ticket.totalAmountUSD?.toFixed(2) || '0.00'}`} />
                  <InfoItem 
                    label="Status" 
                    value={isUsed ? 'Used' : isPending ? 'Pending' : 'Confirmed'} 
                  />
                  {ticket.mtnTransactionId && (
                    <InfoItem label="MTN Ref" value={ticket.mtnTransactionId} />
                  )}
                </View>
              </View>

              {/* Payment Retry Button */}
              {isPending && (
                <TouchableOpacity 
                  style={styles.retryBtn} 
                  onPress={() => retryPayment(ticket._id)}
                  disabled={retrying === ticket._id}
                >
                  {retrying === ticket._id ? (
                    <ActivityIndicator color={theme.colors.dark} size="small" />
                  ) : (
                    <>
                      <Ionicons name="refresh-outline" size={18} color={theme.colors.dark} />
                      <Text style={styles.retryText}>Retry Payment</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Download Ticket Button */}
              {isConfirmed && !isUsed && (
                <TouchableOpacity style={styles.downloadBtn} onPress={() => Alert.alert('Download', 'Ticket downloaded to your gallery')}>
                  <Ionicons name="download-outline" size={20} color={theme.colors.dark} />
                  <Text style={styles.downloadText}>Download Ticket</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
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
  container: { flex: 1, backgroundColor: theme.colors.dark, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
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
  typeBadgePending: { backgroundColor: '#FF9800' },
  typeBadgeUsed: { backgroundColor: '#4CAF50' },
  typeText: { color: theme.colors.dark, fontSize: 10, fontWeight: 'bold' },
  typeTextPending: { color: '#FFFFFF' },
  typeTextUsed: { color: '#FFFFFF' },
  ticketBody: { flexDirection: 'row', padding: 20, backgroundColor: '#FFFFFF' },
  qrContainer: { alignItems: 'center', marginRight: 20 },
  ticketId: { marginTop: 10, fontSize: 10, color: theme.colors.dark, fontWeight: 'bold', letterSpacing: 1 },
  ticketInfo: { flex: 1, justifyContent: 'center' },
  infoItem: { marginBottom: 8 },
  infoLabel: { fontSize: 10, color: 'grey', textTransform: 'uppercase' },
  infoValue: { fontSize: 13, color: theme.colors.dark, fontWeight: 'bold' },
  usedPlaceholder: { alignItems: 'center', justifyContent: 'center', marginRight: 20, paddingVertical: 20 },
  usedText: { color: '#4CAF50', fontSize: 14, fontWeight: 'bold', marginTop: 10 },
  pendingPlaceholder: { alignItems: 'center', justifyContent: 'center', marginRight: 20, paddingVertical: 20 },
  pendingText: { color: '#FF9800', fontSize: 14, fontWeight: 'bold', marginTop: 10 },
  retryBtn: { backgroundColor: '#FF9800', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12 },
  retryText: { color: '#FFFFFF', fontWeight: 'bold', marginLeft: 8 },
  downloadBtn: { backgroundColor: theme.colors.gold, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15 },
  downloadText: { color: theme.colors.dark, fontWeight: 'bold', marginLeft: 10 },
});
