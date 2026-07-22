import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { theme } from '../styles/theme';

// Use the SVG logo from assets
const LOGO_SVG = require('../assets/images/logo.svg');

/**
 * GentsConcerts Logo Component
 * Renders the brand logo as an SVG image
 * Used in headers across all screens.
 */
export default function Logo({ size = 'medium', showTagline = false }) {
  const logoSize = size === 'large' ? 120 : size === 'small' ? 40 : 80;
  const taglineSize = size === 'large' ? 14 : size === 'small' ? 10 : 11;

  return (
    <View style={[styles.container, size === 'large' && styles.containerLarge]}>
      <Image 
        source={LOGO_SVG} 
        style={{ width: logoSize, height: logoSize }} 
        resizeMode="contain"
      />
      {showTagline && (
        <Text style={[styles.tagline, { fontSize: taglineSize }]}>
          Liberia's Premier Event Platform
        </Text>
      )}
    </View>
  );
}

/**
 * Header Logo - used in the header bar of screens
 */
export function HeaderLogo({ onPress, navigation }) {
  return (
    <TouchableOpacity 
      style={styles.headerLogoContainer}
      onPress={onPress || (navigation ? () => navigation.navigate('Home') : undefined)}
    >
      <Image 
        source={LOGO_SVG} 
        style={{ width: 40, height: 40 }} 
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 4 },
  containerLarge: { paddingVertical: 10 },
  logoText: {
    fontFamily: theme.fonts.heading,
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  goldText: {
    color: theme.colors.gold,
    fontWeight: 'bold',
  },
  tagline: {
    color: theme.colors.gold,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  headerLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogoText: {
    fontFamily: theme.fonts.heading,
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
