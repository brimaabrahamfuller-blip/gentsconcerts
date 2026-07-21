import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

/**
 * GentsConcerts Logo Component
 * Renders the brand logo as styled text (SVG-equivalent text logo)
 * Used in headers across all screens.
 */
export default function Logo({ size = 'medium', showTagline = false }) {
  const fontSize = size === 'large' ? 36 : size === 'small' ? 16 : 24;
  const taglineSize = size === 'large' ? 14 : size === 'small' ? 10 : 11;

  return (
    <View style={[styles.container, size === 'large' && styles.containerLarge]}>
      <Text style={[styles.logoText, { fontSize }]} numberOfLines={1}>
        GENTS<Text style={[styles.goldText, { fontSize }]}>CONCERTS</Text>
      </Text>
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
    <View style={styles.headerLogoContainer}>
      <Text 
        style={styles.headerLogoText} 
        onPress={onPress || (navigation ? () => navigation.navigate('Home') : undefined)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="GentsConcerts Home"
      >
        GENTS<Text style={styles.headerGoldText}>CONCERTS</Text>
      </Text>
    </View>
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
  headerGoldText: {
    color: theme.colors.gold,
    fontWeight: 'bold',
  },
});
