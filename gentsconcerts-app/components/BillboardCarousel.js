import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { getMediaUrl } from '../utils/media';

const SIDE_MARGIN = 20;
const GAP = 12;
const MAX_CONTENT_WIDTH = 1120;
const AUTO_ROTATE_MS = 4500;

export default function BillboardCarousel({ items, onItemPress }) {
  const { width: windowWidth } = useWindowDimensions();
  const contentWidth = Math.min(windowWidth, MAX_CONTENT_WIDTH);
  const cardWidth = Math.max(contentWidth - SIDE_MARGIN * 2, 0);
  const snapInterval = cardWidth + GAP;
  const scrollRef = useRef(null);
  const indexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!items || items.length <= 1) return undefined;
    const interval = setInterval(() => {
      const nextIndex = (indexRef.current + 1) % items.length;
      scrollRef.current?.scrollTo({ x: nextIndex * snapInterval, animated: true });
      indexRef.current = nextIndex;
      setActiveIndex(nextIndex);
    }, AUTO_ROTATE_MS);
    return () => clearInterval(interval);
  }, [items, snapInterval]);

  if (!items || items.length === 0) return null;

  const moveTo = (nextIndex) => {
    const normalizedIndex = (nextIndex + items.length) % items.length;
    indexRef.current = normalizedIndex;
    setActiveIndex(normalizedIndex);
    scrollRef.current?.scrollTo({
      x: normalizedIndex * (CARD_WIDTH + GAP),
      animated: true,
    });
  };

  const handleMomentumEnd = (event) => {
    const nextIndex = snapInterval ? Math.round(event.nativeEvent.contentOffset.x / snapInterval) : 0;
    indexRef.current = nextIndex;
    setActiveIndex(nextIndex);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.billboardHeader}>
        <View>
          <Text style={styles.eyebrow}>ON THE BILLBOARD</Text>
          <Text style={styles.title}>Featured & Sponsored</Text>
        </View>
        {items.length > 1 && (
          <View style={styles.arrowGroup}>
            <TouchableOpacity style={styles.arrowButton} onPress={() => moveTo(activeIndex - 1)} accessibilityLabel="Previous billboard">
              <Ionicons name="chevron-back" size={18} color={theme.colors.gold} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.arrowButton} onPress={() => moveTo(activeIndex + 1)} accessibilityLabel="Next billboard">
              <Ionicons name="chevron-forward" size={18} color={theme.colors.gold} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        snapToInterval={snapInterval}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => {
          const imageUri = getMediaUrl(item.flyerImage);
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.9}
              style={[styles.card, { width: cardWidth }]}
              onPress={() => onItemPress && onItemPress(item)}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.cardImage} resizeMode="cover" />
              ) : (
                <View style={[styles.cardImage, styles.fallbackImage]}>
                  <Ionicons name="sparkles-outline" size={46} color={theme.colors.gold} />
                </View>
              )}
              <View style={styles.cardOverlay} />
              <View style={styles.cardContent}>
                {item.sponsored && <Text style={styles.sponsored}>SPONSORED</Text>}
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                {!!item.date && <Text style={styles.cardMeta}>{item.date}</Text>}
                {!!item.venue && <Text style={styles.cardVenue} numberOfLines={1}>{item.venue}</Text>}
                <View style={styles.cta}><Text style={styles.ctaText}>{item.buttonText || 'Explore Event'}</Text></View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {items.length > 1 && (
        <View style={styles.dotsRow}>
          {items.map((item, index) => (
            <TouchableOpacity key={item.id} onPress={() => moveTo(index)} accessibilityLabel={`Show billboard ${index + 1}`}>
              <View style={[styles.dot, activeIndex === index && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', marginTop: 30 },
  billboardHeader: { paddingHorizontal: 20, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  eyebrow: { color: theme.colors.gold, fontSize: 10, fontWeight: 'bold', letterSpacing: 1.2 },
  title: { color: '#FFFFFF', fontFamily: theme.fonts.heading, fontSize: 18, marginTop: 3 },
  arrowGroup: { flexDirection: 'row', gap: 8 },
  arrowButton: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.gold, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: SIDE_MARGIN },
  card: { height: 220, marginRight: GAP, borderRadius: 16, overflow: 'hidden', backgroundColor: theme.colors.midBlue, position: 'relative' },
  cardImage: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
  fallbackImage: { backgroundColor: theme.colors.midBlue, alignItems: 'center', justifyContent: 'center' },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5, 10, 22, 0.52)' },
  cardContent: { flex: 1, justifyContent: 'flex-end', padding: 20 },
  sponsored: { color: theme.colors.gold, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 7 },
  cardTitle: { color: '#FFFFFF', fontFamily: theme.fonts.heading, fontSize: 23, marginBottom: 5 },
  cardMeta: { color: theme.colors.gold, fontSize: 12, marginBottom: 2 },
  cardVenue: { color: '#FFFFFF', opacity: 0.8, fontSize: 12, marginBottom: 12 },
  cta: { alignSelf: 'flex-start', backgroundColor: theme.colors.gold, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 7 },
  ctaText: { color: theme.colors.dark, fontSize: 11, fontWeight: 'bold' },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 3 },
  dotActive: { width: 16, backgroundColor: theme.colors.gold },
});
