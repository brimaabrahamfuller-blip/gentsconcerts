import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  TextInput, ScrollView, ActivityIndicator, Image, useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import config from '../config';
import { HeaderLogo } from '../components/Logo';
import UserAvatar from '../components/UserAvatar';
import Watermark from '../components/Watermark';
import PageAnimation from '../components/PageAnimation';
import { getMediaUrl } from '../utils/media';

const MAX_CONTENT_WIDTH = 1120;
const API_BASE = config.API_URL;

const FILTERS = ['All', 'Concerts', 'Nightlife', 'Festivals', 'Cultural', 'Other'];

// Map frontend filters to backend categories
const CATEGORY_MAP = {
  'All': null,
  'Concerts': 'Music',
  'Nightlife': 'Music',
  'Festivals': 'Cultural',
  'Cultural': 'Cultural',
  'Other': 'Comedy'
};

const formatEventDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date to be confirmed';
  return new Intl.DateTimeFormat('en-LR', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  }).format(date);
};

function EventCard({ item, cardWidth, navigation }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUri = imageFailed ? null : getMediaUrl(item.flyerImage);
  const lowestPrice = item.ticketTiers?.length
    ? Math.min(...item.ticketTiers.map((tier) => Number(tier.price) || 0))
    : Number(item.price) || 0;
  const isFree = lowestPrice === 0;

  return (
    <TouchableOpacity
      style={[styles.eventCard, { width: cardWidth }]}
      onPress={() => navigation.navigate('EventDetail', { event: item })}
      accessibilityRole="button"
      accessibilityLabel={`View ${item.title}`}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.imagePlaceholder}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="musical-notes" size={40} color="rgba(212, 175, 55, 0.45)" />
          <Text style={styles.imageFallbackText}>Event flyer unavailable</Text>
        </View>
      )}
      <View style={styles.cardInfo}>
        <Text style={styles.eventName} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.eventDate}>{formatEventDate(item.date)}</Text>
        <Text style={styles.eventVenue} numberOfLines={1}>{item.venue || 'Venue to be confirmed'}</Text>
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceUsd}>{isFree ? 'FREE' : `From $${lowestPrice.toFixed(2)}`}</Text>
            {!isFree && <Text style={styles.priceLrd}>~LRD {(lowestPrice * 190).toLocaleString()}</Text>}
            {isFree && <Text style={styles.priceLrd}>Regular ticket terms apply</Text>}
          </View>
          <View style={styles.getTicketsBtn}>
            <Text style={styles.getTicketsText}>VIEW</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function EventsScreen({ navigation }) {
  const { width: windowWidth } = useWindowDimensions();
  const contentWidth = Math.min(Math.max(windowWidth, 320), MAX_CONTENT_WIDTH);
  const columnCount = windowWidth >= 900 ? 3 : 2;
  const cardWidth = Math.max((contentWidth - (columnCount === 3 ? 64 : 48)) / columnCount, 140);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/events`);
      const data = await response.json();
      if (data.success) {
        setEvents(data.data);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Fetch Events Error:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const backendCategory = CATEGORY_MAP[activeFilter];
    const matchesFilter = activeFilter === 'All' || 
      (event.category && event.category.toUpperCase().includes(backendCategory ? backendCategory.toUpperCase() : ''));
    const matchesSearch = (event.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (event.venue || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const renderEventItem = ({ item }) => (
    <EventCard item={item} cardWidth={cardWidth} navigation={navigation} />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <HeaderLogo navigation={navigation} />
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <UserAvatar size={30} />
        </TouchableOpacity>
      </View>
      <Text style={styles.pageTitle}>Explore Events</Text>
      
      {/* Search Bar */}
      <View style={[styles.searchContainer, isFocused && styles.searchFocused]}>
        <Ionicons name="search" size={20} color={theme.colors.gold} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events in Monrovia..."
          placeholderTextColor={theme.colors.lightGrey}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FILTERS.map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterPill,
                activeFilter === filter ? styles.filterActive : styles.filterInactive
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[
                styles.filterText,
                activeFilter === filter ? styles.filterTextActive : styles.filterTextInactive
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <PageAnimation delay={200}>
        {/* Events Grid */}
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.gold} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={filteredEvents}
            renderItem={renderEventItem}
            keyExtractor={item => item._id}
            numColumns={columnCount}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No events found matching your search.</Text>
              </View>
            }
            onRefresh={fetchEvents}
            refreshing={loading}
            ListFooterComponent={<Watermark />}
          />
        )}
      </PageAnimation>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.dark, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  pageTitle: { fontFamily: theme.fonts.heading, fontSize: 24, color: '#FFFFFF', paddingHorizontal: 20, marginBottom: 10 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.nearBlack, marginHorizontal: 20, paddingHorizontal: 15, borderRadius: 8, borderWidth: 1, borderColor: 'transparent', height: 50 },
  searchFocused: { borderColor: theme.colors.gold },
  searchInput: { flex: 1, color: '#FFFFFF', marginLeft: 10, fontFamily: theme.fonts.body },
  filterContainer: { marginTop: 10, paddingLeft: 20, marginBottom: 10 },
  filterPill: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1 },
  filterActive: { backgroundColor: theme.colors.gold, borderColor: theme.colors.gold },
  filterInactive: { backgroundColor: 'transparent', borderColor: theme.colors.gold },
  filterText: { fontSize: 12, fontWeight: 'bold' },
  filterTextActive: { color: theme.colors.dark },
  filterTextInactive: { color: theme.colors.gold },
  listContent: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', padding: 20, paddingBottom: 92 },
  columnWrapper: { justifyContent: 'space-between' },
  eventCard: { backgroundColor: theme.colors.nearBlack, borderRadius: 8, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(201, 168, 76, 0.1)' },
  imagePlaceholder: { height: 100, backgroundColor: theme.colors.midBlue, justifyContent: 'center', alignItems: 'center' },
  imageFallbackText: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 6 },
  cardInfo: { padding: 10 },
  eventName: { fontFamily: theme.fonts.heading, fontSize: 14, color: '#FFFFFF', marginBottom: 4 },
  eventDate: { fontSize: 11, color: theme.colors.gold, marginBottom: 2 },
  eventVenue: { fontSize: 11, color: theme.colors.lightGrey, marginBottom: 8 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  priceUsd: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' },
  priceLrd: { fontSize: 9, color: theme.colors.lightGrey },
  getTicketsBtn: { backgroundColor: theme.colors.gold, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  getTicketsText: { fontSize: 10, color: theme.colors.dark, fontWeight: 'bold' },
  emptyContainer: { marginTop: 100, alignItems: 'center' },
  emptyText: { color: theme.colors.lightGrey, fontSize: 14 },
});
