import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');

export default function TicketsScreen({ navigation }) {
  // Sample ticket data
  const tickets = [
    {
      id: 'GC-102938',
      event: 'Afrobeats Night Live',
      date: 'June 15, 2026',
      venue: 'National Cultural Center',
      type: 'VIP',
      price: '$30',
      holder: 'Brima Abraham'
    }
  ];

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
          <View key={ticket.id} style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketEvent}>{ticket.event}</Text>
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{ticket.type}</Text>
              </View>
            </View>
            
            <View style={styles.ticketBody}>
              <View style={styles.qrContainer}>
                <QRCode
                  value={ticket.id}
                  size={120}
                  color={theme.colors.dark}
                  backgroundColor="#FFFFFF"
                />
                <Text style={styles.ticketId}>{ticket.id}</Text>
              </View>
              
              <View style={styles.ticketInfo}>
                <InfoItem label="Date" value={ticket.date} />
                <InfoItem label="Venue" value={ticket.venue} />
                <InfoItem label="Holder" value={ticket.holder} />
                <InfoItem label="Price" value={`${ticket.price} (${parseInt(ticket.price.substring(1)) * 150} LRD)`} />
              </View>
            </View>

            <TouchableOpacity style={styles.downloadBtn}>
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark,
    paddingTop: 60,
  },
  pageTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 24,
    color: '#FFFFFF',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: theme.colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    color: theme.colors.gold,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
    fontFamily: theme.fonts.body,
  },
  exploreBtn: {
    backgroundColor: theme.colors.gold,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  exploreBtnText: {
    color: theme.colors.dark,
    fontWeight: 'bold',
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    marginBottom: 20,
  },
  ticketHeader: {
    backgroundColor: theme.colors.navyBlue,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketEvent: {
    fontFamily: theme.fonts.heading,
    fontSize: 18,
    color: '#FFFFFF',
    flex: 1,
  },
  typeBadge: {
    backgroundColor: theme.colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeText: {
    color: theme.colors.dark,
    fontSize: 10,
    fontWeight: 'bold',
  },
  ticketBody: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  qrContainer: {
    alignItems: 'center',
    marginRight: 20,
  },
  ticketId: {
    marginTop: 10,
    fontSize: 10,
    color: theme.colors.dark,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  ticketInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  infoItem: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 10,
    color: 'grey',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 13,
    color: theme.colors.dark,
    fontWeight: 'bold',
  },
  downloadBtn: {
    backgroundColor: theme.colors.gold,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  downloadText: {
    color: theme.colors.dark,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
