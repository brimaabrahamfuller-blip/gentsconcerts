import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Dimensions, Animated, ActivityIndicator, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { AuthService } from '../AuthService';
import config from '../config';

const { width } = Dimensions.get('window');
const API_BASE = config.API_URL;

export default function EventDetailScreen({ route, navigation }) {
  const { event } = route.params;
  const [ticketType, setTicketType] = useState('Regular');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true })
    ]).start();

    // Set default ticket type from available tiers
    if (event.ticketTiers && event.ticketTiers.length > 0) {
      setTicketType(event.ticketTiers[0].name);
    }
  }, []);

  // Calculate price based on ticket tier
  const getTierPrice = (typeName) => {
    if (event.ticketTiers && event.ticketTiers.length > 0) {
      const tier = event.ticketTiers.find(t => t.name === typeName);
      return tier ? tier.price : 0;
    }
    return event.price || 0;
  };

  const tierPrice = getTierPrice(ticketType);
  const totalUsd = tierPrice * quantity;
  const totalLrd = totalUsd * 190; // Approx rate

  const handleBooking = async () => {
    const user = await AuthService.getUser();
    if (!user) {
      Alert.alert('Login Required', 'Please login to book tickets', [
        { text: 'Cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') }
      ]);
      return;
    }

    setLoading(true);
    try {
      const token = await AuthService.getToken();
      // Backend endpoint is POST /tickets/purchase
      const response = await fetch(`${API_BASE}/tickets/purchase`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: event._id,
          tierName: ticketType,
          quantity,
          purchaserName: user.fullName,
          purchaserPhone: user.phone || ''
        })
      });
      
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Ticket purchased successfully! Check your Tickets tab.', [
          { text: 'Go to Tickets', onPress: () => navigation.navigate('Tickets') }
        ]);
      } else {
        Alert.alert('Booking Failed', data.message || 'Could not process booking');
      }
    } catch (error) {
      console.error('Booking Error:', error);
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.gold} />
      </TouchableOpacity>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTitle}>{event.title}</Text>
          </View>
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.infoGrid}>
            <InfoRow icon="calendar" text={formatDate(event.date)} />
            <InfoRow icon="time" text={event.time || '8:00 PM'} />
            <InfoRow icon="location" text={event.venue} />
            <InfoRow icon="location-outline" text={`${event.city || 'Monrovia'}, ${event.country || 'Liberia'}`} />
          </View>

          <Text style={styles.sectionTitle}>About this Event</Text>
          <Text style={styles.description}>
            {event.description || 'Join us for an unforgettable night of music and entertainment. Experience the best of Liberian culture and talent in a vibrant atmosphere.'}
          </Text>

          <View style={styles.ticketSection}>
            <Text style={styles.sectionTitle}>Select Tickets</Text>
            
            {/* Show available ticket tiers */}
            {event.ticketTiers && event.ticketTiers.length > 0 ? (
              <>
                <Text style={styles.label}>Ticket Type</Text>
                <View style={styles.typeSelector}>
                  {event.ticketTiers.map(tier => (
                    <TouchableOpacity 
                      key={tier.name}
                      style={[styles.typeBtn, ticketType === tier.name && styles.typeBtnActive]}
                      onPress={() => setTicketType(tier.name)}
                    >
                      <Text style={[styles.typeBtnText, ticketType === tier.name && styles.typeBtnTextActive]}>{tier.name}</Text>
                      <Text style={[styles.typePrice, ticketType === tier.name && styles.typePriceActive]}>${tier.price}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.ticketSectionInfo}>
                <Text style={styles.ticketSectionText}>Ticket pricing: ${tierPrice} USD</Text>
                <Text style={styles.ticketSectionSubtext}>Available types: Regular, VIP, VVIP</Text>
              </View>
            )}

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

          <TouchableOpacity style={styles.buyBtn} onPress={handleBooking} disabled={loading}>
            {loading ? <ActivityIndicator color={theme.colors.dark} /> : <Text style={styles.buyBtnText}>Get Tickets Now</Text>}
          </TouchableOpacity>
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
  banner: { height: 250, backgroundColor: theme.colors.midBlue },
  bannerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', padding: 20 },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20 },
  bannerTitle: { fontFamily: theme.fonts.heading, fontSize: 28, color: '#FFFFFF', fontWeight: 'bold' },
  content: { padding: 20 },
  infoGrid: { marginBottom: 10 },
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
  typePrice: { color: theme.colors.gold, fontSize: 10, marginTop: 4 },
  typePriceActive: { color: theme.colors.dark },
  ticketSectionInfo: { marginBottom: 20 },
  ticketSectionText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  ticketSectionSubtext: { color: theme.colors.lightGrey, fontSize: 12 },
  qtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  qtySelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.dark, borderRadius: 5, padding: 5 },
  qtyText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginHorizontal: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 15 },
  totalLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  totalUsd: { color: theme.colors.gold, fontSize: 20, fontWeight: 'bold' },
  totalLrd: { color: theme.colors.lightGrey, fontSize: 12 },
  buyBtn: { backgroundColor: theme.colors.gold, height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  buyBtnText: { color: theme.colors.dark, fontSize: 18, fontWeight: 'bold' }
});
