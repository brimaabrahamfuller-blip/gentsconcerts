import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Share, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { theme } from '../styles/theme';
import { AuthService } from '../AuthService';
import config from '../config';
import { HeaderLogo } from '../components/Logo';
import Watermark from '../components/Watermark';
import PageAnimation from '../components/PageAnimation';

const API_BASE = config.API_URL;

export default function TicketsScreen({ navigation }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retrying, setRetrying] = useState(null);
  const [downloading, setDownloading] = useState(null);

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
      const response = await fetch(`${API_BASE}/tickets/retry/${ticketId}`, {
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

  const handleDownloadTicket = async (ticket) => {
    setDownloading(ticket._id);
    try {
      const token = await AuthService.getToken();
      const downloadUrl = `${API_BASE}/tickets/${ticket._id}/download`;
      const filename = `ticket-${ticket.qrCode || ticket._id}.pdf`;

      if (Platform.OS === 'web') {
        // expo-file-system / expo-sharing are native-only and don't
        // work in a browser. Use a plain fetch + blob download instead.
        const response = await fetch(downloadUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Download failed');

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
      } else {
        // Native (iOS/Android): download to the device, then hand off
        // to the OS share/save sheet.
        const fileUri = `${FileSystem.documentDirectory}${filename}`;
        const result = await FileSystem.downloadAsync(downloadUrl, fileUri, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (result.status !== 200) {
          throw new Error('Download failed');
        }

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(result.uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Save or share your ticket'
          });
        } else {
          Alert.alert('Ticket Saved', `Your ticket was saved to:\n${result.uri}`);
        }
      }
    } catch (error) {
      console.error('Download Error:', error);
      Alert.alert('Download Failed', 'Could not download your ticket. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const handleShareTicket = async (ticket) => {
    try {
      const message = `GentsConcerts Ticket\n\nEvent: ${ticket.eventId?.title || 'Event'}\nTier: ${ticket.tierName}\nDate: ${ticket.eventId?.date ? new Date(ticket.eventId.date).toLocaleDateString() : 'TBD'}\nVenue: ${ticket.eventId?.venue || 'TBD'}\nReference: ${ticket._id}\n\nPresent this at the venue entrance.`;
      await Share.share({
        message,
        title: 'GentsConcerts Ticket'
      });
    } catch (error) {
      console.error('Share Error:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.gold} size="large" />
        <Text style={styles.loadingText}>Loading your tickets...</Text>
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
      
      <PageAnimation delay={150}>
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
                      <Text style={styles.ticketId}>{String(ticket._id).substring(0, 8).toUpperCase()}</Text>
                    </View>
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

                {/* Download Ticket (PDF) Button */}
                {isConfirmed && !isUsed && (
                  <TouchableOpacity
                    style={styles.downloadBtn}
                    onPress={() => handleDownloadTicket(ticket)}
                    disabled={downloading === ticket._id}
                  >
                    {downloading === ticket._id ? (
                      <ActivityIndicator color={theme.colors.dark} size="small" />
                    ) : (
                      <>
                        <Ionicons name="download-outline" size={20} color={theme.colors.dark} />
                        <Text style={styles.downloadText}>Download Ticket</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {/* Share Ticket (text summary) Button */}
                {isConfirmed && !isUsed && (
                  <TouchableOpacity style={styles.shareBtn} onPress={() => handleShareTicket(ticket)}>
                    <Ionicons name="share-outline" size={18} color={theme.colors.gold} />
                    <Text style={styles.shareText}>Share Details</Text>
                  </TouchableOpacity>
                )}

                {/* View Event Button */}
                {ticket.eventId && (
                  <TouchableOpacity 
                    style={styles.viewEventBtn}
                    onPress={() => navigation.navigate('EventDetail', { event: ticket.eventId })}
                  >
                    <Ionicons name="eye-outline" size={18} color={theme.colors.gold} />
                    <Text style={styles.viewEventText}>View Event Details</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          <Watermark />
        </ScrollView>
      </PageAnimation>
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
  loadingText: { color: theme.colors.gold, marginTop: 15, fontSize: 14 },
  pageTitle: { fontFamily: theme.fonts.heading, fontSize: 24, color: '#FFFFFF', paddingHorizontal: 20, marginBottom: 20 },
  scrollContent: { padding: 20, paddingBottom: 40 },
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
  shareBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 10, borderTopWidth: 1, borderTopColor: '#EEEEEE' },
  shareText: { color: theme.colors.navyBlue, fontWeight: 'bold', marginLeft: 8, fontSize: 12 },
  viewEventBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: '#EEEEEE' },
  viewEventText: { color: theme.colors.gold, fontWeight: 'bold', marginLeft: 8, fontSize: 13 }
});
