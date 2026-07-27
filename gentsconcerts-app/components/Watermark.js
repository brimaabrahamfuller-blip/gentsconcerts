import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Image } from 'react-native';
import { theme } from '../styles/theme';

const logoImage = require('../assets/logo.png');

/**
 * Watermark Component
 * A subtle brand logo watermark centered on the page.
 */
export default function Watermark() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
      <Image 
        source={logoImage}
        style={styles.watermarkImage}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  watermarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: -1,
  },
  watermarkImage: {
    width: 280,
    height: 280,
    opacity: 0.05,
  }
});
