import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Animated, Dimensions, Alert, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import config from '../config';

const { width } = Dimensions.get('window');
const API_BASE = config.API_URL;

export default function EventDetailScreen({ route, navigation }) {
  const { event } = route.params || {};
  
  const [ticketType, setTicketType] = useState('Regular');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={{color: '#fff'}}>Event not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{color: theme.colors.gold}}>Go Back</Text></TouchableOpacity>
      </View>
    );
  }

  const ticketPrices = {
    'Regular': event.price || 10,
    'VIP': (event.price || 10) * 3,
    'VVIP': (event.price || 10) * 10
  };

  const currentPrice = ticketPrices[ticketType];
  const totalUsd = currentPrice * quantity;
  const totalLrd = totalUsd * 150;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleBooking = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: event.name,
          date: event.date,
          venue: event.venue,
          type: ticketType,
          quantity: quantity,
          total: totalUsd,
          image: event.image
        })
      });
      
      if (response.ok) {
        Alert.alert('Success', 'Tickets booked successfully!', [
          { text: 'View Tickets', onPress: () => navigation.navigate('Tickets') },
          { text: 'OK' }
        ]);
      } else {
        Alert.alert('Error', 'Failed to book tickets.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <View style={styles.bannerOverlay}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.bannerTitle}>{event.name}</Text>
          </View>
        </View>

        <Animated.View style={{ opacity: fadeAnim, padding: 20 }}>
          <InfoRow icon="calendar" text={event.date} />
          <InfoRow icon="location" text={event.venue} />
          <InfoRow icon="pricetag" text={event.category || 'General'} />

          <Text style={styles.sectionTitle}>About This Event</Text>
          <Text style={styles.description}>{event.description || 'No description available for this event.'}</Text>

          <View style={styles.ticketSection}>
            <Text style={styles.sectionTitle}>Select Tickets</Text>
            <Text style={styles.label}>Ticket Type</Text>
            <View style={styles.typeSelector}>
              {['Regular', 'VIP', 'VVIP'].map(type => (
                <TouchableOpacity 
                  key={type}
                  style={[styles.typeBtn, ticketType === type && styles.typeBtnActive]}
                  onPress={() => setTicketType(type)}
                >
                  <Text style={[styles.typeBtnText, ticketType === type && styles.typeBtnTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.qtyRow}>
              <Text style={styles.label}>Quantity</Text>
              <View style={styles.qtySelector}>
                <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Ionicons name="remove" size={20} color={theme.colors.gold} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{quantity}</Text>
                <TouchableOpacity onPress={() => setQuantity(quantity + 1)}>
                  <Ionicons name="add" size={20} color={theme.colors.gold} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <View style={{alignItems: 'flex-end'}}>
                <Text style={styles.totalUsd}>${totalUsd}.00 USD</Text>
                <Text style={styles.totalLrd}>{totalLrd.toLocaleString()} LRD</Text>
              </View>
            </View>
          </View>

          <Animated.View style={{ transform: [{ scale: pulseAnim }], marginTop: 20 }}>
            <TouchableOpacity style={styles.buyBtn} onPress={handleBooking} disabled={loading}>
              {loading ? <ActivityIndicator color={theme.colors.dark} /> : <Text style={styles.buyBtnText}>Get Tickets Now</Text>}
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const InfoRow = ({ icon, text }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={18} color={theme.colors.gold} />
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.dark },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.dark },
  banner: { height: 250, backgroundColor: theme.colors.midBlue },
  bannerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', padding: 20 },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20 },
  bannerTitle: { fontFamily: theme.fonts.heading, fontSize: 28, color: '#FFFFFF', fontWeight: 'bold' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoText: { color: theme.colors.warmWhite, marginLeft: 10, fontSize: 14 },
  sectionTitle: { fontFamily: theme.fonts.heading, fontSize: 18, color: theme.colors.gold, marginTop: 20, marginBottom: 10 },
  description: { color: theme.colors.warmWhite, lineHeight: 22, fontSize: 14 },
  ticketSection: { backgroundColor: theme.colors.nearBlack, padding: 20, borderRadius: 15, marginTop: 20, borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  label: { color: theme.colors.lightGrey, fontSize: 12, marginBottom: 8, textTransform: 'uppercase' },
  typeSelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  typeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.gold, marginHorizontal: 4, borderRadius: 5 },
  typeBtnActive: { backgroundColor: theme.colors.gold },
  typeBtnText: { color: theme.colors.gold, fontWeight: 'bold', fontSize: 12 },
  typeBtnTextActive: { color: theme.colors.dark },
  qtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  qtySelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.dark, borderRadius: 5, padding: 5 },
  qtyText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginHorizontal: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 15 },
  totalLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  totalUsd: { color: theme.colors.gold, fontSize: 20, fontWeight: 'bold' },
  totalLrd: { color: theme.colors.lightGrey, fontSize: 12 },
  buyBtn: { backgroundColor: theme.colors.gold, height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  buyBtnText: { color: theme.colors.dark, fontSize: 18, fontWeight: 'bold' }
});
