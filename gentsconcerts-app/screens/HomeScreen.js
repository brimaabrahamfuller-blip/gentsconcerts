import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Animated, Dimensions, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import config from '../config';

const { width } = Dimensions.get('window');
const API_BASE = config.API_URL;

export default function HomeScreen({ navigation }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    fetchFeaturedEvents();
    
    const targetDate = new Date('August 1, 2026 00:00:00').getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      if (distance < 0) { clearInterval(interval); return; }
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchFeaturedEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/events`);
      const data = await response.json();
      // Backend returns: { success: true, count, data: [events] }
      if (data.success) {
        setFeaturedEvents(data.data.slice(0, 3) || []);
      } else {
        setFeaturedEvents([]);
      }
    } catch (error) {
      console.error('Error fetching featured events:', error);
      setFeaturedEvents([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerLogo}>GENTS<Text style={{color: theme.colors.gold}}>CONCERTS</Text></Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-circle-outline" size={28} color={theme.colors.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity style={styles.heroBanner} onPress={() => navigation.navigate('Events')}>
            <View style={styles.heroContent}>
              <Text style={styles.heroHeadline}>Liberia's #1 Concert and Events Platform</Text>
              <Text style={styles.heroSubtext}>Discover. Book. Experience.</Text>
              <View style={styles.heroButton}><Text style={styles.heroButtonText}>Explore Events</Text></View>
            </View>
          </TouchableOpacity>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Official Launch Countdown</Text>
            <View style={styles.countdownCard}>
              <View style={styles.timerGrid}>
                <TimerBox value={timeLeft.days} label="Days" />
                <TimerBox value={timeLeft.hours} label="Hours" />
                <TimerBox value={timeLeft.mins} label="Mins" />
                <TimerBox value={timeLeft.secs} label="Secs" />
              </View>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Events</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Events')}><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
            </View>
            {loading ? (
              <ActivityIndicator color={theme.colors.gold} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {featuredEvents.map(event => (
                  <EventCard 
                    key={event._id}
                    name={event.title} 
                    date={event.date} 
                    venue={event.venue}
                    onPress={() => navigation.navigate('EventDetail', { event })}
                  />
                ))}
              </ScrollView>
            )}
          </View>

          <View style={[styles.sectionContainer, {marginBottom: 40}]}>
            <Text style={styles.sectionTitle}>Why GentsConcerts</Text>
            <View style={styles.featuresGrid}>
              <FeatureCard icon="search" title="Discover Events" desc="Find the best shows in town." />
              <FeatureCard icon="ticket" title="Easy Ticketing" desc="Secure your spot in seconds." />
              <FeatureCard icon="mic" title="Host Your Show" desc="List and sell tickets easily." />
              <FeatureCard icon="notifications" title="Get Notified" desc="Never miss a concert again." />
            </View>
          </View>

          {/* Links Section */}
          <View style={[styles.sectionContainer, {marginBottom: 60}]}>
            <Text style={styles.sectionTitle}>Important Links</Text>
            <View style={styles.linksContainer}>
              <TouchableOpacity 
                style={styles.linkItem}
                onPress={() => navigation.navigate('TermsAndConditions')}
              >
                <Ionicons name="document-text-outline" size={18} color={theme.colors.gold} />
                <Text style={styles.linkText}>Terms & Conditions</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.linkItem}
                onPress={() => navigation.navigate('PrivacyPolicy')}
              >
                <Ionicons name="shield-checkmark-outline" size={18} color={theme.colors.gold} />
                <Text style={styles.linkText}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const TimerBox = ({ value, label }) => (
  <View style={styles.timerBox}>
    <Text style={styles.timerValue}>{value.toString().padStart(2, '0')}</Text>
    <Text style={styles.timerLabel}>{label}</Text>
  </View>
);

const EventCard = ({ name, date, venue, onPress }) => (
  <TouchableOpacity style={styles.eventCard} onPress={onPress}>
    <View style={styles.eventImagePlaceholder}>
      <Ionicons name="musical-notes" size={40} color={theme.colors.gold} opacity={0.3} />
    </View>
    <View style={styles.eventInfo}>
      <Text style={styles.eventName}>{name}</Text>
      <Text style={styles.eventDate}>{date}</Text>
      <Text style={styles.eventVenue}>{venue}</Text>
      <View style={styles.ticketBtnOutline}><Text style={styles.ticketBtnText}>Get Tickets</Text></View>
    </View>
  </TouchableOpacity>
);

const FeatureCard = ({ icon, title, desc }) => (
  <View style={styles.featureCard}>
    <Ionicons name={icon} size={24} color={theme.colors.gold} />
    <Text style={styles.featureTitle}>{title}</Text>
    <Text style={styles.featureDesc}>{desc}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.dark, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  headerLogo: { fontFamily: theme.fonts.heading, fontSize: 20, color: '#FFFFFF', fontWeight: 'bold' },
  heroBanner: { margin: 20, height: 180, borderRadius: 15, backgroundColor: theme.colors.primaryRed, padding: 20, justifyContent: 'center' },
  heroContent: { flex: 1, justifyContent: 'center' },
  heroHeadline: { fontFamily: theme.fonts.heading, fontSize: 24, color: '#FFFFFF', marginBottom: 5 },
  heroSubtext: { fontSize: 14, color: theme.colors.gold, marginBottom: 15 },
  heroButton: { backgroundColor: theme.colors.gold, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, alignSelf: 'flex-start' },
  heroButtonText: { color: theme.colors.dark, fontWeight: 'bold', fontSize: 12 },
  sectionContainer: { paddingHorizontal: 20, marginTop: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontFamily: theme.fonts.heading, fontSize: 18, color: '#FFFFFF' },
  seeAll: { color: theme.colors.gold, fontSize: 12 },
  countdownCard: { backgroundColor: theme.colors.midBlue, borderRadius: 15, padding: 20, borderWidth: 1, borderColor: theme.colors.gold },
  timerGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  timerBox: { alignItems: 'center' },
  timerValue: { fontFamily: theme.fonts.heading, fontSize: 24, color: theme.colors.gold },
  timerLabel: { fontSize: 10, color: '#FFFFFF', textTransform: 'uppercase' },
  horizontalScroll: { marginLeft: -20, paddingLeft: 20 },
  eventCard: { width: 220, backgroundColor: theme.colors.nearBlack, borderRadius: 15, marginRight: 15, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)' },
  eventImagePlaceholder: { height: 120, backgroundColor: theme.colors.midBlue, justifyContent: 'center', alignItems: 'center' },
  eventInfo: { padding: 15 },
  eventName: { fontFamily: theme.fonts.heading, fontSize: 16, color: '#FFFFFF', marginBottom: 5 },
  eventDate: { fontSize: 12, color: theme.colors.gold, marginBottom: 2 },
  eventVenue: { fontSize: 12, color: theme.colors.lightGrey, marginBottom: 10 },
  ticketBtnOutline: { borderWidth: 1, borderColor: theme.colors.gold, borderRadius: 5, paddingVertical: 5, alignItems: 'center' },
  ticketBtnText: { color: theme.colors.gold, fontSize: 12, fontWeight: 'bold' },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  featureCard: { width: '48%', backgroundColor: theme.colors.navyBlue, padding: 15, borderRadius: 15, marginBottom: 15, alignItems: 'center' },
  featureTitle: { fontFamily: theme.fonts.heading, fontSize: 14, color: theme.colors.gold, marginTop: 8, marginBottom: 4 },
  featureDesc: { fontSize: 11, color: '#FFFFFF', textAlign: 'center' },
  linksContainer: { marginTop: 10 },
  linkItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  linkText: { color: '#FFFFFF', fontSize: 14, marginLeft: 10 }
});
