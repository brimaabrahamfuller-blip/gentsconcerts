import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import config from '../config';
import { HeaderLogo } from '../components/Logo';
import UserAvatar from '../components/UserAvatar';
import Watermark from '../components/Watermark';
import PageAnimation from '../components/PageAnimation';
import HeroBannerSlider from '../components/HeroBannerSlider';
import BillboardCarousel from '../components/BillboardCarousel';
import { getMediaUrl } from '../utils/media';

const HERO_VIDEO = require('../assets/liberia-concert-hero.mp4');

const API_BASE = config.API_URL;

// Always shown as the first slide.
const MAIN_BANNER = {

  id: 'main',
  headline: "Liberia's #1 Concert and Events Platform",
  subtext: 'Discover. Book. Experience.',
  buttonText: 'Explore Events',
  backgroundColor: theme.colors.primaryRed,
  videoSource: HERO_VIDEO,
  sponsored: false,
  screen: 'Events',
};

export default function HomeScreen({ navigation }) {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [banners, setBanners] = useState([MAIN_BANNER]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedEvents();
  }, []);

  const fetchFeaturedEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/events`);
      const data = await response.json();
      if (data.success) {
        const events = data.data || [];
        setFeaturedEvents(events);

        // Highlight the All Liberian Festival 2026
        const libcorFestival = events.find(e => e.title.toLowerCase().includes('liberian festival'));
        
        const sponsoredSlides = events
          .filter(event => event.sponsored || event._id === libcorFestival?._id)
          .map(event => ({
            id: `sponsor-${event._id}`,
            headline: event.title,
            subtext: event.venue ? `${new Date(event.date).toLocaleDateString()} · ${event.venue}` : event.date,
            buttonText: 'Get Tickets',
            backgroundColor: event._id === libcorFestival?._id ? theme.colors.primaryRed : theme.colors.navyBlue,
            imageSource: getMediaUrl(event.flyerImage),
            sponsored: true,
            sponsorName: event._id === libcorFestival?._id ? 'LIBCOR Partnership' : event.sponsorName,
            event,
          }));
        setBanners([MAIN_BANNER, ...sponsoredSlides]);
      } else {
        setFeaturedEvents([]);
        setBanners([MAIN_BANNER]);
      }
    } catch (error) {
      console.error('Error fetching featured events:', error);
      setFeaturedEvents([]);
      setBanners([MAIN_BANNER]);
    } finally {
      setLoading(false);
    }
  };

  const handleBannerPress = (banner) => {
    if (banner.event) {
      navigation.navigate('EventDetail', { event: banner.event });
    } else {
      navigation.navigate(banner.screen || 'Events');
    }
  };

  const billboardItems = featuredEvents.length > 0
    ? featuredEvents.slice(0, 5).map(event => ({
        id: `billboard-${event._id}`,
        title: event.title,
        date: event.date,
        venue: event.venue,
        flyerImage: event.flyerImage,
        buttonText: 'View Event',
        event,
      }))
    : [{
        id: 'billboard-discover',
        title: 'Discover Liberia\'s best events',
        subtext: 'Live music, culture, and unforgettable nights.',
        buttonText: 'Explore Events',
      }];

  const handleBillboardPress = (item) => {
    if (item.event) {
      navigation.navigate('EventDetail', { event: item.event });
    } else {
      navigation.navigate('Events');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <HeaderLogo navigation={navigation} />
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <UserAvatar size={30} />
        </TouchableOpacity>
      </View>

      <PageAnimation>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <HeroBannerSlider banners={banners} onBannerPress={handleBannerPress} />

          <BillboardCarousel items={billboardItems} onItemPress={handleBillboardPress} />

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
                    flyerImage={event.flyerImage}
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
          <View style={[styles.sectionContainer, {marginBottom: 20}]}>
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

          <Watermark />
        </ScrollView>
      </PageAnimation>
    </View>
  );
}

const EventCard = ({ name, date, venue, flyerImage, onPress }) => {
  const imageUri = getMediaUrl(flyerImage);
  return (
    <TouchableOpacity style={styles.eventCard} onPress={onPress}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.eventImage} resizeMode="cover" />
      ) : (
        <View style={styles.eventImagePlaceholder}>
          <Ionicons name="musical-notes" size={40} color={theme.colors.gold} opacity={0.3} />
        </View>
      )}
      <View style={styles.eventInfo}>
        <Text style={styles.eventName}>{name}</Text>
        <Text style={styles.eventDate}>{date}</Text>
        <Text style={styles.eventVenue}>{venue}</Text>
        <View style={styles.ticketBtnOutline}><Text style={styles.ticketBtnText}>Get Tickets</Text></View>
      </View>
    </TouchableOpacity>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <View style={styles.featureCard}>
    <Ionicons name={icon} size={24} color={theme.colors.gold} />
    <Text style={styles.featureTitle}>{title}</Text>
    <Text style={styles.featureDesc}>{desc}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.dark, paddingTop: 50 },
  scrollContent: { width: '100%', maxWidth: 1120, alignSelf: 'center', paddingBottom: 76 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  sectionContainer: { paddingHorizontal: 20, marginTop: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontFamily: theme.fonts.heading, fontSize: 22, color: '#FFFFFF' },
  seeAll: { color: theme.colors.gold, fontSize: 14 },
  horizontalScroll: { marginLeft: -20, paddingLeft: 20 },
  eventCard: { width: 260, backgroundColor: theme.colors.nearBlack, borderRadius: 18, marginRight: 15, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)' },
  eventImagePlaceholder: { height: 150, width: '100%', backgroundColor: theme.colors.midBlue, justifyContent: 'center', alignItems: 'center' },
  eventImage: { height: 150, width: '100%' },
  eventInfo: { padding: 20 },
  eventName: { fontFamily: theme.fonts.heading, fontSize: 18, color: '#FFFFFF', marginBottom: 6 },
  eventDate: { fontSize: 14, color: theme.colors.gold, marginBottom: 3 },
  eventVenue: { fontSize: 14, color: theme.colors.lightGrey, marginBottom: 12 },
  ticketBtnOutline: { borderWidth: 1, borderColor: theme.colors.gold, borderRadius: 6, paddingVertical: 8, alignItems: 'center' },
  ticketBtnText: { color: theme.colors.gold, fontSize: 14, fontWeight: 'bold' },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  featureCard: { width: '48%', backgroundColor: theme.colors.navyBlue, padding: 20, borderRadius: 18, marginBottom: 15, alignItems: 'center' },
  featureTitle: { fontFamily: theme.fonts.heading, fontSize: 16, color: theme.colors.gold, marginTop: 10, marginBottom: 6 },
  featureDesc: { fontSize: 13, color: '#FFFFFF', textAlign: 'center' },
  linksContainer: { marginTop: 10 },
  linkItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  linkText: { color: '#FFFFFF', fontSize: 14, marginLeft: 10 }
});
