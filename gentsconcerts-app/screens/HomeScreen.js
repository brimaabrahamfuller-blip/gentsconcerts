import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ImageBackground, Animated, Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Countdown logic
    const targetDate = new Date('August 1, 2026 00:00:00').getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLogo}>
          GENTS<Text style={{color: theme.colors.gold}}>CONCERTS</Text>
        </Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color={theme.colors.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0]
        }) }] }}>
          
          {/* Hero Banner */}
          <TouchableOpacity 
            style={styles.heroBanner}
            onPress={() => navigation.navigate('Events')}
          >
            <View style={styles.heroContent}>
              <Text style={styles.heroHeadline}>Liberia's #1 Concert and Events Platform</Text>
              <Text style={styles.heroSubtext}>Discover. Book. Experience.</Text>
              <View style={styles.heroButton}>
                <Text style={styles.heroButtonText}>Explore Events</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Countdown Section */}
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

          {/* Featured Events */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Events</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Events')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              <EventCard 
                name="Afrobeats Night Live" 
                date="June 15, 2026" 
                venue="National Cultural Center"
                onPress={() => navigation.navigate('EventDetail')}
              />
              <EventCard 
                name="Jazz Fusion Festival" 
                date="July 4, 2026" 
                venue="Royal Grand Hotel"
                onPress={() => navigation.navigate('EventDetail')}
              />
              <EventCard 
                name="Monrovia Beach Bash" 
                date="July 26, 2026" 
                venue="Miami Beach"
                onPress={() => navigation.navigate('EventDetail')}
              />
            </ScrollView>
          </View>

          {/* Why GentsConcerts */}
          <View style={[styles.sectionContainer, {marginBottom: 40}]}>
            <Text style={styles.sectionTitle}>Why GentsConcerts</Text>
            <View style={styles.featuresGrid}>
              <FeatureCard icon="search" title="Discover Events" desc="Find the best shows in town." />
              <FeatureCard icon="ticket" title="Easy Ticketing" desc="Secure your spot in seconds." />
              <FeatureCard icon="mic" title="Host Your Show" desc="List and sell tickets easily." />
              <FeatureCard icon="notifications" title="Get Notified" desc="Never miss a concert again." />
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
      <TouchableOpacity style={styles.ticketBtnOutline}>
        <Text style={styles.ticketBtnText}>Get Tickets</Text>
      </TouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  headerLogo: {
    fontFamily: theme.fonts.heading,
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  heroBanner: {
    margin: theme.spacing.md,
    height: 180,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primaryRed,
    overflow: 'hidden',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
  },
  heroHeadline: {
    fontFamily: theme.fonts.heading,
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 5,
  },
  heroSubtext: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.gold,
    marginBottom: 15,
  },
  heroButton: {
    backgroundColor: theme.colors.gold,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  heroButtonText: {
    color: theme.colors.dark,
    fontWeight: 'bold',
    fontSize: 12,
  },
  sectionContainer: {
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: theme.spacing.sm,
  },
  seeAll: {
    color: theme.colors.gold,
    fontSize: 12,
  },
  countdownCard: {
    backgroundColor: theme.colors.midBlue,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.gold,
  },
  timerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timerBox: {
    alignItems: 'center',
  },
  timerValue: {
    fontFamily: theme.fonts.heading,
    fontSize: 24,
    color: theme.colors.gold,
  },
  timerLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  horizontalScroll: {
    marginLeft: -theme.spacing.md,
    paddingLeft: theme.spacing.md,
  },
  eventCard: {
    width: 220,
    backgroundColor: theme.colors.nearBlack,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.1)',
  },
  eventImagePlaceholder: {
    height: 120,
    backgroundColor: theme.colors.midBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventInfo: {
    padding: theme.spacing.md,
  },
  eventName: {
    fontFamily: theme.fonts.heading,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 5,
  },
  eventDate: {
    fontSize: 12,
    color: theme.colors.gold,
    marginBottom: 2,
  },
  eventVenue: {
    fontSize: 12,
    color: theme.colors.lightGrey,
    marginBottom: 10,
  },
  ticketBtnOutline: {
    borderWidth: 1,
    borderColor: theme.colors.gold,
    borderRadius: 5,
    paddingVertical: 5,
    alignItems: 'center',
  },
  ticketBtnText: {
    color: theme.colors.gold,
    fontSize: 12,
    fontWeight: 'bold',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: theme.colors.navyBlue,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    textAlign: 'center',
  },
  featureTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 14,
    color: theme.colors.gold,
    marginTop: 8,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 11,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
