import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import config from '../config';
import { HeaderLogo } from '../components/Logo';
import UserAvatar from '../components/UserAvatar';
import Watermark from '../components/Watermark';
import PageAnimation from '../components/PageAnimation';
import { getMediaUrl } from '../utils/media';

const API_BASE = config.API_URL;
const MAX_CONTENT_WIDTH = 1120;

export default function FlyerScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFlyers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/events`);
      const payload = await response.json();
      setEvents(payload.success ? (payload.data || []).filter((event) => event.flyerImage) : []);
    } catch (error) {
      console.error('Fetch Flyers Error:', error);
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFlyers();
  }, [fetchFlyers]);

  const contentWidth = Math.min(Math.max(width, 320), MAX_CONTENT_WIDTH);
  const cardWidth = width >= 760 ? (contentWidth - 56) / 3 : width >= 520 ? (contentWidth - 48) / 2 : contentWidth - 32;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <HeaderLogo navigation={navigation} />
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} accessibilityLabel="Open profile">
          <UserAvatar size={34} />
        </TouchableOpacity>
      </View>

      <PageAnimation>
        <FlatList
          data={events}
          keyExtractor={(item) => item._id}
          numColumns={width >= 520 ? (width >= 760 ? 3 : 2) : 1}
          key={`flyer-grid-${width >= 760 ? 3 : width >= 520 ? 2 : 1}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { width: cardWidth }]}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('EventDetail', { event: item })}
            >
              <Image source={{ uri: getMediaUrl(item.flyerImage) }} style={styles.flyer} resizeMode="cover" />
              <View style={styles.cardDetails}>
                <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.eventMeta} numberOfLines={1}>{item.date} · {item.venue}</Text>
                <View style={styles.viewRow}>
                  <Text style={styles.viewText}>View event</Text>
                  <Ionicons name="arrow-forward" size={15} color={theme.colors.gold} />
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={width >= 520 ? styles.columnWrapper : undefined}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFlyers(); }} tintColor={theme.colors.gold} />}
          ListHeaderComponent={(
            <View style={styles.intro}>
              <Text style={styles.eyebrow}>EVENT FLYERS</Text>
              <Text style={styles.pageTitle}>Find your next big night.</Text>
              <Text style={styles.pageSubtitle}>Browse the latest concert, festival, and nightlife flyers from Liberia.</Text>
            </View>
          )}
          ListEmptyComponent={loading ? (
            <ActivityIndicator size="large" color={theme.colors.gold} style={styles.loader} />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="images-outline" size={54} color={theme.colors.gold} />
              <Text style={styles.emptyTitle}>No flyers yet</Text>
              <Text style={styles.emptyText}>New event flyers will appear here as hosts publish them.</Text>
              <TouchableOpacity style={styles.exploreButton} onPress={() => navigation.navigate('Events')}>
                <Text style={styles.exploreButtonText}>Explore Events</Text>
              </TouchableOpacity>
            </View>
          )}
          ListFooterComponent={<Watermark />}
        />
      </PageAnimation>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.dark, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 },
  listContent: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', padding: 16, paddingBottom: 34 },
  columnWrapper: { justifyContent: 'space-between' },
  intro: { paddingHorizontal: 4, paddingTop: 10, paddingBottom: 18 },
  eyebrow: { color: theme.colors.gold, fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 6 },
  pageTitle: { color: '#FFFFFF', fontFamily: theme.fonts.heading, fontSize: 27, lineHeight: 34 },
  pageSubtitle: { color: theme.colors.lightGrey, fontSize: 13, lineHeight: 19, marginTop: 6, maxWidth: 560 },
  card: { backgroundColor: theme.colors.nearBlack, borderRadius: 14, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(201,168,76,0.14)' },
  flyer: { width: '100%', height: 210, backgroundColor: theme.colors.midBlue },
  cardDetails: { padding: 12 },
  eventTitle: { color: '#FFFFFF', fontFamily: theme.fonts.heading, fontSize: 16, lineHeight: 21 },
  eventMeta: { color: theme.colors.lightGrey, fontSize: 11, marginTop: 6 },
  viewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 11 },
  viewText: { color: theme.colors.gold, fontSize: 12, fontWeight: '800' },
  loader: { marginTop: 50 },
  emptyState: { alignItems: 'center', paddingHorizontal: 28, paddingTop: 70 },
  emptyTitle: { color: '#FFFFFF', fontFamily: theme.fonts.heading, fontSize: 20, marginTop: 16 },
  emptyText: { color: theme.colors.lightGrey, textAlign: 'center', fontSize: 13, lineHeight: 19, marginTop: 7 },
  exploreButton: { backgroundColor: theme.colors.gold, borderRadius: 22, paddingHorizontal: 22, paddingVertical: 11, marginTop: 20 },
  exploreButtonText: { color: theme.colors.dark, fontWeight: '800' },
});
