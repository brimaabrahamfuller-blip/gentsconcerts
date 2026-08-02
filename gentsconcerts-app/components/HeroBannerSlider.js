import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');
const SIDE_MARGIN = 20;
const GAP = 12;
const BANNER_WIDTH = width - SIDE_MARGIN * 2;
const SNAP_INTERVAL = BANNER_WIDTH + GAP;
const AUTO_SLIDE_MS = 5000;

/**
 * banners: [{
 *   id: string,
 *   headline: string,
 *   subtext: string,
 *   buttonText?: string,
 *   backgroundColor?: string,   // defaults to theme.colors.primaryRed
 *   sponsored?: boolean,        // shows a "SPONSORED" tag
 *   sponsorName?: string,       // optional, shown under the tag
 * }]
 * onBannerPress(banner) - called when a slide is tapped
 */
export default function HeroBannerSlider({ banners, onBannerPress }) {
  const scrollRef = useRef(null);
  const indexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(() => {
      const nextIndex = (indexRef.current + 1) % banners.length;
      scrollRef.current?.scrollTo({ x: nextIndex * SNAP_INTERVAL, animated: true });
      indexRef.current = nextIndex;
      setActiveIndex(nextIndex);
    }, AUTO_SLIDE_MS);
    return () => clearInterval(interval);
  }, [banners]);

  const handleMomentumEnd = (e) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SNAP_INTERVAL);
    indexRef.current = newIndex;
    setActiveIndex(newIndex);
  };

  if (!banners || banners.length === 0) return null;

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        contentContainerStyle={{ paddingHorizontal: SIDE_MARGIN }}
      >
        {banners.map((banner) => (
          <TouchableOpacity
            key={banner.id}
            activeOpacity={0.9}
            style={[
              styles.banner,
              { backgroundColor: banner.backgroundColor || theme.colors.primaryRed },
            ]}
            onPress={() => onBannerPress && onBannerPress(banner)}
          >
            {banner.sponsored && (
              <View style={styles.sponsoredTag}>
                <Text style={styles.sponsoredTagText}>
                  {banner.sponsorName ? `SPONSORED · ${banner.sponsorName}` : 'SPONSORED'}
                </Text>
              </View>
            )}
            <View style={styles.content}>
              <Text style={styles.headline}>{banner.headline}</Text>
              {!!banner.subtext && <Text style={styles.subtext}>{banner.subtext}</Text>}
              {!!banner.buttonText && (
                <View style={styles.button}>
                  <Text style={styles.buttonText}>{banner.buttonText}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {banners.length > 1 && (
        <View style={styles.dotsRow}>
          {banners.map((banner, i) => (
            <View key={banner.id} style={[styles.dot, activeIndex === i && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: BANNER_WIDTH,
    height: 180,
    borderRadius: 15,
    padding: 20,
    justifyContent: 'center',
    marginRight: GAP,
  },
  content: { flex: 1, justifyContent: 'center' },
  headline: { fontFamily: theme.fonts.heading, fontSize: 24, color: '#FFFFFF', marginBottom: 5 },
  subtext: { fontSize: 14, color: theme.colors.gold, marginBottom: 15 },
  button: {
    backgroundColor: theme.colors.gold,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  buttonText: { color: theme.colors.dark, fontWeight: 'bold', fontSize: 12 },
  sponsoredTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  sponsoredTagText: { color: theme.colors.gold, fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: 3,
  },
  dotActive: { backgroundColor: theme.colors.gold, width: 16 },
});
