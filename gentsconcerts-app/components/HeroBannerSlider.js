import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, useWindowDimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { theme } from '../styles/theme';

const SIDE_MARGIN = 20;
const GAP = 12;
const MAX_CONTENT_WIDTH = 1120;
const AUTO_SLIDE_MS = 5000;

/**
 * banners: [{
 *   id: string,
 *   headline: string,
 *   subtext: string,
 *   buttonText?: string,
 *   backgroundColor?: string,
 *   videoSource?: require(...),
 *   imageSource?: string | number,
 *   sponsored?: boolean,
 *   sponsorName?: string,
 * }]
 */
export default function HeroBannerSlider({ banners, onBannerPress }) {
  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(0);
  const contentWidth = Math.min(containerWidth || windowWidth, MAX_CONTENT_WIDTH);
  const bannerWidth = Math.max(contentWidth - SIDE_MARGIN * 2, 0);
  const snapInterval = bannerWidth + GAP;
  const scrollRef = useRef(null);
  const indexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!banners || banners.length <= 1) return undefined;
    const interval = setInterval(() => {
      const nextIndex = (indexRef.current + 1) % banners.length;
      scrollRef.current?.scrollTo({ x: nextIndex * snapInterval, animated: true });
      indexRef.current = nextIndex;
      setActiveIndex(nextIndex);
    }, AUTO_SLIDE_MS);
    return () => clearInterval(interval);
  }, [banners, snapInterval]);

  const handleMomentumEnd = (event) => {
    const newIndex = snapInterval ? Math.round(event.nativeEvent.contentOffset.x / snapInterval) : 0;
    indexRef.current = newIndex;
    setActiveIndex(newIndex);
  };

  if (!banners || banners.length === 0) return null;

  return (
    <View
      style={styles.slider}
      onLayout={(event) => {
        const nextWidth = Math.round(event.nativeEvent.layout.width);
        if (nextWidth > 0 && nextWidth !== containerWidth) setContainerWidth(nextWidth);
      }}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        snapToInterval={snapInterval}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        contentContainerStyle={{ paddingHorizontal: SIDE_MARGIN }}
      >
        {banners.map((banner) => (
          <TouchableOpacity
            key={banner.id}
            activeOpacity={0.9}
            style={[styles.banner, { width: bannerWidth, backgroundColor: banner.backgroundColor || theme.colors.primaryRed }]}
            onPress={() => onBannerPress && onBannerPress(banner)}
          >
            {banner.videoSource && (
              <Video
                source={banner.videoSource}
                style={styles.media}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted
                useNativeControls={false}
              />
            )}
            {!banner.videoSource && banner.imageSource && (
              <Image source={typeof banner.imageSource === 'string' ? { uri: banner.imageSource } : banner.imageSource} style={styles.media} resizeMode="cover" />
            )}
            {(banner.videoSource || banner.imageSource) && <View style={styles.mediaOverlay} />}
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
          {banners.map((banner, index) => (
            <View key={banner.id} style={[styles.dot, activeIndex === index && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  slider: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  banner: { height: 210, borderRadius: 15, padding: 20, justifyContent: 'center', marginRight: GAP, overflow: 'hidden', position: 'relative' },
  media: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
  mediaOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8, 9, 18, 0.52)' },
  content: { flex: 1, justifyContent: 'center', zIndex: 1 },
  headline: { fontFamily: theme.fonts.heading, fontSize: 24, color: '#FFFFFF', marginBottom: 5 },
  subtext: { fontSize: 14, color: theme.colors.gold, marginBottom: 15 },
  button: { backgroundColor: theme.colors.gold, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, alignSelf: 'flex-start' },
  buttonText: { color: theme.colors.dark, fontWeight: 'bold', fontSize: 12 },
  sponsoredTag: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, zIndex: 2 },
  sponsoredTagText: { color: theme.colors.gold, fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 3 },
  dotActive: { backgroundColor: theme.colors.gold, width: 16 },
});
