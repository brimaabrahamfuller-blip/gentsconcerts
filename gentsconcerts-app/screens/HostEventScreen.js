import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { AuthService } from '../AuthService';
import Watermark from '../components/Watermark';
import PageAnimation from '../components/PageAnimation';

export default function HostEventScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await AuthService.getUser();
    setUser(userData);
    setLoading(false);
  };

  const handleBecomeHost = async () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }

    setUpgrading(true);
    const result = await AuthService.becomeHost();
    setUpgrading(false);

    if (result.success) {
      Alert.alert('Success', result.message);
      loadUser();
    } else {
      Alert.alert('Error', result.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.gold} size="large" />
      </View>
    );
  }

  const isHost = user && (user.role === 'admin' || (user.role === 'host' && user.hostApprovalStatus === 'approved'));
  const applicationStatus = user?.hostApprovalStatus || 'not_requested';
  const isPending = applicationStatus === 'pending';
  const isRejected = applicationStatus === 'rejected';

  return (
    <PageAnimation>
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="mic" size={60} color={theme.colors.gold} />
          <Text style={styles.title}>{isHost ? 'Host Portal' : isPending ? 'Host Application Received' : 'Become a Host'}</Text>
          <Text style={styles.subtitle}>
            Organize events, sell tickets, and manage your concerts all in one place.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{isHost ? 'Manage Your Events' : 'Join as a Host'}</Text>
          <Text style={styles.cardDescription}>
            {isHost
              ? 'Access your personalized dashboard to create new events, track ticket sales, and manage your concerts.'
              : isPending
                ? 'Your host application is awaiting administrator review. We will unlock event-management access after approval.'
                : isRejected
                  ? 'Your previous host application was not approved. You may submit a new request after addressing the review feedback in your profile.'
                  : 'Ready to host your first concert? Submit a host application for review. Approved hosts can create events and submit them for publication.'}
          </Text>
          
          {isHost ? (
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('AdminDashboard')}
            >
              <Text style={styles.buttonText}>Go to Host Dashboard</Text>
              <Ionicons name="arrow-forward" size={18} color={theme.colors.dark} />
            </TouchableOpacity>
          ) : isPending ? (
            <View style={[styles.button, styles.disabledButton]}>
              <Text style={styles.buttonText}>Application Pending Review</Text>
              <Ionicons name="time-outline" size={18} color={theme.colors.dark} />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.button}
              onPress={handleBecomeHost}
              disabled={upgrading}
            >
              {upgrading ? (
                <ActivityIndicator color={theme.colors.dark} />
              ) : (
                <>
                  <Text style={styles.buttonText}>{user ? 'Submit Host Application' : 'Log In to Apply'}</Text>
                  <Ionicons name={user ? 'document-text-outline' : 'log-in-outline'} size={18} color={theme.colors.dark} />
                </>
              )}
            </TouchableOpacity>
          )}
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

        <Watermark />
      </ScrollView>
    </View>
    </PageAnimation>
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
  center: {
    flex: 1,
    backgroundColor: theme.colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
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
  disabledButton: { opacity: 0.58 },
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
