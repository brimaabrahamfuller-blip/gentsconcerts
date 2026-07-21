import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

export default function HostEventScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="mic" size={60} color={theme.colors.gold} />
          <Text style={styles.title}>Become a Host</Text>
          <Text style={styles.subtitle}>
            Organize events, sell tickets, and manage your concerts all in one place.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Host & Admin Portal</Text>
          <Text style={styles.cardDescription}>
            Access your personalized dashboard to create new events, track ticket sales, and respond to customer inquiries.
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('AdminDashboard')}
          >
            <Text style={styles.buttonText}>Go to Host Portal</Text>
            <Ionicons name="arrow-forward" size={18} color={theme.colors.dark} />
          </TouchableOpacity>
        </View>

        <View style={styles.features}>
          <FeatureItem 
            icon="stats-chart" 
            title="Real-time Analytics" 
            desc="Monitor revenue and ticket sales live." 
          />
          <FeatureItem 
            icon="calendar" 
            title="Event Management" 
            desc="Easily create and update event details." 
          />
          <FeatureItem 
            icon="people" 
            title="Audience Growth" 
            desc="Reach thousands of event-goers in Liberia." 
          />
        </View>
      </ScrollView>
    </View>
  );
}

const FeatureItem = ({ icon, title, desc }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIcon}>
      <Ionicons name={icon} size={24} color={theme.colors.gold} />
    </View>
    <View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDesc}>{desc}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontFamily: theme.fonts.heading,
    fontSize: 28,
    color: '#FFFFFF',
    marginTop: 15,
  },
  subtitle: {
    textAlign: 'center',
    color: theme.colors.lightGrey,
    fontSize: 16,
    marginTop: 10,
    lineHeight: 24,
  },
  card: {
    backgroundColor: theme.colors.navyBlue,
    borderRadius: 15,
    padding: 25,
    borderWidth: 1,
    borderColor: theme.colors.gold,
    marginBottom: 40,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.gold,
    marginBottom: 10,
  },
  cardDescription: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
    opacity: 0.8,
  },
  button: {
    backgroundColor: theme.colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: theme.colors.dark,
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 10,
  },
  features: {
    marginTop: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.midBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  featureDesc: {
    color: theme.colors.lightGrey,
    fontSize: 13,
    marginTop: 2,
  },
});
