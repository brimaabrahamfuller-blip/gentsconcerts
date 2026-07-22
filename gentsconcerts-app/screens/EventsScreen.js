import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  TextInput, Dimensions, ScrollView, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import config from '../config';
import { HeaderLogo } from '../components/Logo';

const { width } = Dimensions.get('window');
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

export default function EventsScreen({ navigation }) {
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
      // Backend returns: { success: true, count, data: [events] }
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
    // Map frontend filter to backend category
    const backendCategory = CATEGORY_MAP[activeFilter];
    const matchesFilter = activeFilter === 'All' || 
      (event.category && event.category.toUpperCase().includes(backendCategory ? backendCategory.toUpperCase() : ''));
    const matchesSearch = (event.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (event.venue || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const renderEventItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.eventCard}
      onPress={() => navigation.navigate('EventDetail', { event: item })}
    >
      <View style={styles.imagePlaceholder}>
        <Ionicons name="musical-notes" size={40} color="rgba(212, 175, 55, 0.3)" />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.eventName} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.eventDate}>{item.date}</Text>
        <Text style={styles.eventVenue} numberOfLines={1}>{item.venue}</Text>
        <View style={styles.priceRow}>
          <View>
            {item.ticketTiers && item.ticketTiers.length > 0 ? (
              <>
                <Text style={styles.priceUsd}>From ${Math.min(...item.ticketTiers.map(t => t.price))}</Text>
                <Text style={styles.priceLrd}>~LRD {(Math.min(...item.ticketTiers.map(t => t.price)) * 190).toLocaleString()}</Text>
              </>
            ) : (
              <>
                <Text style={styles.priceUsd}>${item.price || 0}</Text>
                <Text style={styles.priceLrd}>~LRD {((item.price || 0) * 190).toLocaleString()}</Text>
              </>
            )}
          </View>
          <View style={styles.getTicketsBtn}>
            <Text style={styles.getTicketsText}>VIEW</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <HeaderLogo navigation={navigation} />
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-circle-outline" size={28} color={theme.colors.gold} />
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

      {/* Events Grid */}
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.gold} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredEvents}
          renderItem={renderEventItem}
          keyExtractor={item => item._id}
          numColumns={2}
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
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.dark, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  pageTitle: { fontFamily: theme.fonts.heading, fontSize: 24, color: '#FFFFFF', paddingHorizontal: theme.spacing.md, marginBottom: theme.spacing.md },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.nearBlack, marginHorizontal: theme.spacing.md, paddingHorizontal: theme.spacing.md, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: 'transparent', height: 50 },
  searchFocused: { borderColor: theme.colors.gold },
  searchInput: { flex: 1, color: '#FFFFFF', marginLeft: 10, fontFamily: theme.fonts.body },
  filterContainer: { marginTop: theme.spacing.md, paddingLeft: theme.spacing.md, marginBottom: theme.spacing.sm },
  filterPill: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1 },
  filterActive: { backgroundColor: theme.colors.gold, borderColor: theme.colors.gold },
  filterInactive: { backgroundColor: 'transparent', borderColor: theme.colors.gold },
  filterText: { fontSize: 12, fontWeight: 'bold' },
  filterTextActive: { color: theme.colors.dark },
  filterTextInactive: { color: theme.colors.gold },
  listContent: { padding: theme.spacing.md, paddingBottom: 20 },
  columnWrapper: { justifyContent: 'space-between' },
  eventCard: { width: (width - 48) / 2, backgroundColor: theme.colors.nearBlack, borderRadius: theme.borderRadius.md, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(201, 168, 76, 0.1)' },
  imagePlaceholder: { height: 100, backgroundColor: theme.colors.midBlue, justifyContent: 'center', alignItems: 'center' },
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
