import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { theme } from '../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

/**
 * Watermark Component
 * A subtle brand watermark that appears at the bottom of every screen.
 * Includes a fade-in animation.
 */
export default function Watermark() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in after a short delay
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.watermarkContainer, { opacity: fadeAnim }]}>
      <View style={styles.watermarkLine} />
      <View style={styles.watermarkContent}>
        <Text style={styles.watermarkText}>GentsConcerts</Text>
        <View style={styles.dotSeparator}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <Text style={styles.watermarkTagline}>Liberia's Premier Event Platform</Text>
      </View>
      <View style={styles.watermarkLine} />
    </Animated.View>
  );
}

import { Text } from 'react-native';

const styles = StyleSheet.create({
  watermarkContainer: {
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  watermarkLine: {
    width: '60%',
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
  },
  watermarkContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  watermarkText: {
    fontFamily: theme.fonts.heading,
    fontSize: 13,
    color: 'rgba(212, 175, 55, 0.4)',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  dotSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    marginHorizontal: 4,
  },
  watermarkTagline: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.25)',
    letterSpacing: 0.5,
  },
});
