import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { theme } from '../styles/theme';

// Import the provided logo image
const logoImage = require('../assets/logo.png');

/**
 * GentsConcerts Logo Component
 * Renders the brand logo as a PNG image.
 */
export default function Logo({ size = 'medium', showTagline = false }) {
  const logoSize = size === 'large' ? 120 : size === 'small' ? 40 : 80;

  return (
    <View style={[styles.container, size === 'large' && styles.containerLarge]}>
      <Image 
        source={logoImage}
        style={{ width: logoSize, height: logoSize }}
        resizeMode="contain"
      />
      {showTagline && (
        <Text style={[styles.tagline, { fontSize: size === 'large' ? 14 : size === 'small' ? 10 : 11 }]}>
          Liberia's Premier Event Platform
        </Text>
      )}
    </View>
  );
}

/**
 * Header Logo - used in the header bar of screens
 * Replaced with the provided brand logo PNG image
 */
export function HeaderLogo({ onPress, navigation }) {
  return (
    <TouchableOpacity 
      style={styles.headerLogoContainer}
      onPress={onPress || (navigation ? () => navigation.navigate('Home') : undefined)}
    >
      <Image 
        source={logoImage}
        style={styles.headerLogoImage}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 4 },
  containerLarge: { paddingVertical: 10 },
  tagline: {
    color: theme.colors.gold,
    marginTop: 2,
    letterSpacing: 0.5,
    fontWeight: 'bold',
  },
  headerLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogoImage: {
    width: 140,
    height: 36,
  },
});
