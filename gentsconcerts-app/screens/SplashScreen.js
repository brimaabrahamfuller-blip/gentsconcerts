import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image, Platform } from 'react-native';
import { theme } from '../styles/theme';
import { AuthService } from '../AuthService';

const logoImage = require('../assets/logo.png');

export default function SplashScreen({ navigation }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Fade in + slide up animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]).start(() => {
      // Start pulsing after fade in
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    });

    const checkAuth = async () => {
      const user = await AuthService.getUser();
      
      let targetRoute = 'Login';
      let targetParams;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const path = window.location.pathname || '';
        const search = window.location.search || window.location.hash || '';
        if (path.includes('login') || search.includes('ref=') || search.includes('referral=')) {
          targetRoute = 'Login';
        } else if (path.includes('verify-email')) {
          targetRoute = 'EmailVerification';
        } else if (path.includes('event/')) {
          targetRoute = 'EventDetail';
        } else if (path.includes('profile')) {
          if (user) {
            targetRoute = 'Main';
            targetParams = { screen: 'Profile' };
          } else {
            targetRoute = 'Login';
          }
        } else if (path.includes('flyer')) {
          targetRoute = 'Flyer';
        } else if (path.includes('admin-portal-2026')) {
          if (user && (user.role === 'admin' || user.role === 'owner')) {
            targetRoute = 'OwnerDashboard';
          } else {
            targetRoute = 'Login';
          }
        } else if (user) {
          const userRole = user.role || 'attendee';
          if (userRole === 'host') targetRoute = 'AdminDashboard';
          else targetRoute = 'Main';
        }
      } else {
        if (user) {
          const userRole = user.role || 'attendee';
          if (userRole === 'host') targetRoute = 'AdminDashboard';
          else targetRoute = 'Main';
        }
      }

      const delay = (Platform.OS === 'web' && (window.location.search || window.location.hash || window.location.pathname !== '/')) ? 200 : 2800;

      setTimeout(() => {
        navigation.replace(targetRoute, targetParams);
      }, delay);
    };

    checkAuth();
  }, [navigation, pulseAnim, fadeAnim, slideAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: pulseAnim }], alignItems: 'center' }}>
        <Image 
          source={logoImage}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>Liberia's Premier Event Platform</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.dark, justifyContent: 'center', alignItems: 'center' },
  logoImage: { width: 200, height: 200 },
  tagline: { fontFamily: theme.fonts.body, fontSize: 16, color: theme.colors.gold, marginTop: 15, letterSpacing: 1 },
});
