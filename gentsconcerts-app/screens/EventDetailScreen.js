import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Dimensions, Animated, ActivityIndicator, Alert, Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { AuthService } from '../AuthService';
import config from '../config';

const { width } = Dimensions.get('window');
const API_BASE = config.API_URL;
const USD_TO_LRD = 150;

export default function EventDetailScreen({ route, navigation }) {
  const { event } = route.params;
  const [ticketType, setTicketType] = useState('Regular');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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
  const totalLrd = totalUsd * USD_TO_LRD;

  const handleBooking = async () => {
    const user = await AuthService.getUser();
    if (!user) {
      Alert.alert('Login Required', 'Please login to book tickets', [
        { text: 'Cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') }
      ]);
      return;
    }

    if (!user.phone) {
      Alert.alert('Phone Required', 'Please update your profile with a valid phone number for MTN Mobile Money payment.');
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
          purchaserPhone: user.phone
        })
      });
      
      const data = await response.json();
      if (data.success) {
        Alert.alert(
          'Payment Initiated',
          'A payment request has been sent to your MTN Mobile Money. Please complete the payment on your phone. Once confirmed, your digital ticket with QR code will be available in the Tickets tab.',
          [
            { text: 'OK' },
            { 
              text: 'Go to Tickets', 
              onPress: () => navigation.navigate('Tickets') 
            }
          ]
        );
      } else if (data.retryEndpoint) {
        // Payment gateway unavailable but ticket saved
        Alert.alert(
          'Payment Pending',
          'The payment gateway is temporarily unavailable. Your ticket request has been saved. You can retry the payment later.',
          [
            { text: 'OK' },
            { text: 'Retry Later', onPress: () => {} }
          ]
        );
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
        {/* Event Flyer Image */}
        {event.flyerImage ? (
          <Image 
            source={{ uri: `${API_BASE}${event.flyerImage}` }}
            style={styles.banner}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.banner}>
            <View style={styles.bannerOverlay}>
              <Text style={styles.bannerTitle}>{event.title}</Text>
            </View>
          </View>
        )}

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
                      <Text style={styles.availableText}>{tier.quantity - tier.sold} left</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.ticketSectionInfo}>
                <Text style={styles.ticketSectionText}>Ticket pricing: ${tierPrice} USD</Text>
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
                <Text style={styles.totalUsd}>${totalUsd.toFixed(2)} USD</Text>
                <Text style={styles.totalLrd}>{totalLrd.toLocaleString()} LRD</Text>
              </View>
            </View>

            <View style={styles.paymentInfo}>
              <Ionicons name="phone-portrait-outline" size={20} color={theme.colors.gold} />
              <Text style={styles.paymentText}>Pay with MTN Mobile Money</Text>
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
  banner: { height: 250 },
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
  typeSelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 8 },
  typeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.gold, marginHorizontal: 2, borderRadius: 5 },
  typeBtnActive: { backgroundColor: theme.colors.gold },
  typeBtnText: { color: theme.colors.gold, fontWeight: 'bold', fontSize: 12 },
  typeBtnTextActive: { color: theme.colors.dark },
  typePrice: { color: theme.colors.gold, fontSize: 10, marginTop: 4 },
  typePriceActive: { color: theme.colors.dark },
  availableText: { color: 'rgba(212,175,55,0.6)', fontSize: 9, marginTop: 2 },
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
  paymentInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 15, padding: 12, backgroundColor: 'rgba(212,175,55,0.1)', borderRadius: 8 },
  paymentText: { color: theme.colors.gold, fontSize: 14, marginLeft: 10 },
  buyBtn: { backgroundColor: theme.colors.gold, height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  buyBtnText: { color: theme.colors.dark, fontSize: 18, fontWeight: 'bold' }
});
