import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, FlatList, RefreshControl, Alert, TextInput, Modal, useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { AuthService } from '../AuthService';
import config from '../config';
import { HeaderLogo } from '../components/Logo';
import Watermark from '../components/Watermark';
import PageAnimation from '../components/PageAnimation';
import UserAvatar from '../components/UserAvatar';

const API_BASE = config.API_URL;

export default function OwnerDashboardScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isCompact = width < 600;
  const [activeTab, setActiveTab] = useState('attention'); // 'attention', 'users', 'hosts', 'tickets', 'health'
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeEvents: 0,
    totalUsers: 0,
    pendingFlags: 0,
    failedPayments: 0,
    pendingReviews: 0,
    pendingHosts: 0,
    platformPulse: {
      totalTickets: 0,
      confirmedTickets: 0,
      totalHosts: 0,
      newUsersToday: 0
    }
  });
  const [systemHealth, setSystemHealth] = useState({
    api: 'ok',
    database: 'ok',
    auth: 'ok',
    payment: 'beta',
    email: 'ok'
  });
  const [activity, setActivity] = useState([]);
  const [flags, setFlags] = useState([]);
  const [hostApplications, setHostApplications] = useState([]);
  const [eventReviews, setEventReviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  
  // Feedback Modal
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [feedbackType, setFeedbackType] = useState('feedback');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await AuthService.getToken();
      const headers = { 'Authorization': `Bearer ${token}` };

      if (activeTab === 'attention' || activeTab === 'health') {
        const [statsRes, activityRes, flagsRes, hostsRes, eventsRes, healthRes] = await Promise.all([
          fetch(`${API_BASE}/admin/stats`, { headers }),
          fetch(`${API_BASE}/admin/activity`, { headers }),
          fetch(`${API_BASE}/admin/flags`, { headers }),
          fetch(`${API_BASE}/admin/host-applications`, { headers }),
          fetch(`${API_BASE}/admin/event-reviews`, { headers }),
          fetch(`${API_BASE}/health`, { headers })
        ]);

        const [statsData, activityData, flagsData, hostsData, eventsData, healthData] = await Promise.all([
          statsRes.json(), activityRes.json(), flagsRes.json(), hostsRes.json(), eventsRes.json(), healthRes.json()
        ]);

        if (statsData.success) setStats(statsData.data);
        if (activityData.success) setActivity(activityData.data);
        if (flagsData.success) setFlags(flagsData.data);
        if (hostsData.success) setHostApplications(hostsData.data);
        if (eventsData.success) setEventReviews(eventsData.data);
        if (healthData) setSystemHealth({
          api: healthData.status || 'ok',
          database: healthData.database || 'ok',
          auth: 'ok',
          payment: 'beta',
          email: 'ok'
        });
      } else if (activeTab === 'users' || activeTab === 'hosts') {
        const role = activeTab === 'hosts' ? 'host' : '';
        const res = await fetch(`${API_BASE}/admin/users?role=${role}&search=${searchQuery}`, { headers });
        const data = await res.json();
        if (data.success) {
          setUsers(data.data);
          setUserGrowth(data.growth || []);
        }
      } else if (activeTab === 'tickets') {
        const res = await fetch(`${API_BASE}/admin/tickets`, { headers });
        const data = await res.json();
        if (data.success) setTickets(data.data);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleReviewDecision = async (path, decision, label) => {
    const isFlag = path.includes('/flags/');
    const payload = isFlag 
      ? { status: decision === 'resolve' ? 'resolved' : 'dismissed' }
      : { decision };

    Alert.alert(
      `${decision === 'approve' || decision === 'publish' || decision === 'resolve' ? 'Confirm' : 'Reject'} ${label}`,
      `Are you sure you want to ${decision} this ${label.toLowerCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: (decision === 'reject' || decision === 'dismissed') ? 'destructive' : 'default',
          onPress: async () => {
            setActionLoading(path);
            try {
              const token = await AuthService.getToken();
              const response = await fetch(`${API_BASE}${path}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
              });
              const data = await response.json();
              if (!data.success) throw new Error(data.message || 'Action failed');
              fetchData();
            } catch (error) {
              Alert.alert('Action failed', error.message || 'Please try again.');
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  const handleDeleteUser = async (userId, name) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(userId);
            try {
              const token = await AuthService.getToken();
              const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const data = await response.json();
              if (data.success) {
                Alert.alert('Success', 'User deleted successfully');
                fetchData();
              } else {
                Alert.alert('Error', data.message || 'Failed to delete user');
              }
            } catch (error) {
              Alert.alert('Error', 'Network error');
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  const handleDeleteTicket = async (ticketId) => {
    Alert.alert(
      'Delete Ticket',
      'Are you sure you want to delete this ticket?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(ticketId);
            try {
              const token = await AuthService.getToken();
              const response = await fetch(`${API_BASE}/admin/tickets/${ticketId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const data = await response.json();
              if (data.success) {
                fetchData();
              } else {
                Alert.alert('Error', data.message || 'Failed to delete ticket');
              }
            } catch (error) {
              Alert.alert('Error', 'Network error');
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  const handleSendFeedback = async () => {
    if (!feedbackMessage) return;
    setActionLoading('feedback');
    try {
      const token = await AuthService.getToken();
      const response = await fetch(`${API_BASE}/admin/feedback`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          userId: selectedUser._id,
          type: feedbackType,
          message: feedbackMessage
        })
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Feedback sent successfully');
        setFeedbackModalVisible(false);
        setFeedbackMessage('');
      } else {
        Alert.alert('Error', data.message || 'Failed to send feedback');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
    } finally {
      setActionLoading(null);
    }
  };

  const renderUserItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <UserAvatar user={item} size={40} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.fullName}</Text>
          <Text style={styles.cardSubtitle}>{item.email}</Text>
          <Text style={styles.cardSubtitle}>{item.phone || 'No phone'}</Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: item.role === 'host' ? theme.colors.gold : '#2196F3' }]}>
          <Text style={styles.roleBadgeText}>{item.role.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => {
            setSelectedUser(item);
            setFeedbackModalVisible(true);
          }}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.colors.gold} />
          <Text style={styles.actionBtnText}>Feedback</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, { borderColor: '#F44336' }]} 
          onPress={() => handleDeleteUser(item._id, item.fullName)}
        >
          <Ionicons name="trash-outline" size={18} color="#F44336" />
          <Text style={[styles.actionBtnText, { color: '#F44336' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTicketItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.eventId?.title || 'Unknown Event'}</Text>
          <Text style={styles.cardSubtitle}>User: {item.userId?.fullName} ({item.userId?.email})</Text>
          <Text style={styles.cardSubtitle}>Tier: {item.tierName} · Price: ${item.totalAmountUSD}</Text>
          <Text style={[styles.cardSubtitle, { color: item.paymentStatus === 'confirmed' ? '#4CAF50' : '#FF9800' }]}>
            Status: {item.paymentStatus.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={[styles.actionBtn, { borderColor: '#F44336' }]} 
          onPress={() => handleDeleteTicket(item._id)}
        >
          <Ionicons name="trash-outline" size={18} color="#F44336" />
          <Text style={[styles.actionBtnText, { color: '#F44336' }]}>Delete Duplicate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <PageAnimation>
      <View style={styles.container}>
        <View style={styles.header}>
          <HeaderLogo navigation={navigation} />
          <Text style={styles.headerTitle}>Owner Portal</Text>
          <TouchableOpacity style={styles.avatarButton} onPress={() => navigation.navigate('Profile')}>
            <UserAvatar size={38} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          <TabItem active={activeTab === 'attention'} label="Attention" icon="alert-circle" onPress={() => setActiveTab('attention')} />
          <TabItem active={activeTab === 'users'} label="Users" icon="people" onPress={() => setActiveTab('users')} />
          <TabItem active={activeTab === 'hosts'} label="Hosts" icon="microphone" onPress={() => setActiveTab('hosts')} />
          <TabItem active={activeTab === 'tickets'} label="Tickets" icon="ticket" onPress={() => setActiveTab('tickets')} />
          <TabItem active={activeTab === 'health'} label="System" icon="pulse" onPress={() => setActiveTab('health')} />
        </View>

        {activeTab === 'attention' ? (
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.gold} />}
          >
            <View style={[styles.statsGrid, isCompact && styles.statsGridCompact]}>
              <StatCard isCompact={isCompact} title="Pending Hosts" value={stats.pendingHosts} icon="microphone" color={theme.colors.gold} />
              <StatCard isCompact={isCompact} title="Event Reviews" value={stats.pendingReviews} icon="calendar" color="#2196F3" />
              <StatCard isCompact={isCompact} title="Incidents" value={stats.pendingFlags} icon="flag" color="#F44336" />
              <StatCard isCompact={isCompact} title="Failed Payments" value={stats.failedPayments} icon="cash-outline" color="#FF9800" />
            </View>

            <SectionTitle title="Approval Queue" count={hostApplications.length + eventReviews.length} />
            
            {hostApplications.map(applicant => (
              <ReviewCard 
                key={applicant._id}
                title={`Host Application: ${applicant.fullName}`}
                subtitle={`${applicant.email}\n${applicant.phone || 'No phone'}`}
                date={`Applied: ${new Date(applicant.hostApplicationSubmittedAt || applicant.createdAt).toLocaleDateString()}`}
                onApprove={() => handleReviewDecision(`/admin/host-applications/${applicant._id}`, 'approve', 'Host Application')}
                onReject={() => handleReviewDecision(`/admin/host-applications/${applicant._id}`, 'reject', 'Host Application')}
                loading={actionLoading === `/admin/host-applications/${applicant._id}`}
              />
            ))}

            {eventReviews.map(event => (
              <ReviewCard 
                key={event._id}
                title={`Event Publication: ${event.title}`}
                subtitle={`Organizer: ${event.organizerId?.fullName || 'Unknown'}\nVenue: ${event.venue}`}
                date={`Event Date: ${new Date(event.eventDate || event.date).toLocaleDateString()}`}
                onApprove={() => handleReviewDecision(`/admin/event-reviews/${event._id}`, 'publish', 'Event')}
                onReject={() => handleReviewDecision(`/admin/event-reviews/${event._id}`, 'reject', 'Event')}
                loading={actionLoading === `/admin/event-reviews/${event._id}`}
              />
            ))}

            {hostApplications.length === 0 && eventReviews.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-done-circle-outline" size={48} color="grey" opacity={0.5} />
                <Text style={styles.emptyText}>Approval queue is clear</Text>
              </View>
            )}

            <SectionTitle title="Platform Pulse" />
            <View style={styles.pulseGrid}>
              <PulseItem label="Total Tickets" value={stats.platformPulse.totalTickets} />
              <PulseItem label="Confirmed" value={stats.platformPulse.confirmedTickets} />
              <PulseItem label="Total Hosts" value={stats.platformPulse.totalHosts} />
              <PulseItem label="New Users (24h)" value={stats.platformPulse.newUsersToday} />
            </View>
            
            <SectionTitle title="Critical Attention" count={flags.length} />
            {flags.length === 0 ? (
              <Text style={styles.emptyText}>No critical incidents detected</Text>
            ) : flags.map(flag => (
              <View key={flag._id} style={styles.card}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                  <Text style={[styles.cardTitle, {color: '#F44336'}]}>{flag.reason}</Text>
                  <TouchableOpacity onPress={() => handleReviewDecision(`/admin/flags/${flag._id}`, 'resolve', 'Flag')}>
                    <Ionicons name="checkmark-circle-outline" size={24} color="#4CAF50" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.cardSubtitle}>{flag.details}</Text>
                <Text style={styles.cardDate}>{new Date(flag.timestamp).toLocaleString()}</Text>
              </View>
            ))}

            <SectionTitle title="Recent Activity" />
            {activity.slice(0, 15).map(log => (
              <View key={log._id} style={styles.activityItem}>
                <View style={[styles.activityDot, {backgroundColor: log.severity === 'critical' ? '#F44336' : (log.severity === 'warning' ? '#FF9800' : theme.colors.gold)}]} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityAction}>{log.action}</Text>
                  <Text style={styles.activityDetails}>{log.details}</Text>
                  <Text style={styles.activityTime}>{new Date(log.timestamp).toLocaleString()}</Text>
                </View>
              </View>
            ))}
            <Watermark />
          </ScrollView>
        ) : activeTab === 'health' ? (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <SectionTitle title="System Health & Infrastructure" />
            <HealthItem label="API Gateway" status={systemHealth.api} />
            <HealthItem label="Primary Database" status={systemHealth.database} />
            <HealthItem label="Authentication Service" status={systemHealth.auth} />
            <HealthItem label="Payment Gateway (Beta)" status={systemHealth.payment} />
            <HealthItem label="Email Delivery" status={systemHealth.email} />
            
            <SectionTitle title="Recovery Posture" />
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Infrastructure Backup</Text>
              <Text style={styles.cardSubtitle}>Last backup: Today, 03:00 AM</Text>
              <Text style={styles.cardSubtitle}>Status: Healthy</Text>
            </View>
            <Watermark />
          </ScrollView>
        ) : (
          <View style={{flex: 1}}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="grey" />
              <TextInput 
                style={styles.searchInput}
                placeholder={`Search ${activeTab}...`}
                placeholderTextColor="grey"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={fetchData}
              />
            </View>
            
            {activeTab === 'users' || activeTab === 'hosts' ? (
              <View style={styles.chartPlaceholder}>
                <Text style={styles.chartTitle}>{activeTab === 'hosts' ? 'Host' : 'User'} Growth (Last 30 Days)</Text>
                <View style={styles.barChart}>
                  {userGrowth.map((day, idx) => (
                    <View key={idx} style={[styles.chartBar, { height: Math.min(day.count * 10, 60), backgroundColor: theme.colors.gold }]} />
                  ))}
                </View>
              </View>
            ) : null}

            {loading ? (
              <ActivityIndicator color={theme.colors.gold} style={{marginTop: 50}} />
            ) : (
              <FlatList
                data={activeTab === 'tickets' ? tickets : users}
                renderItem={activeTab === 'tickets' ? renderTicketItem : renderUserItem}
                keyExtractor={item => item._id}
                contentContainerStyle={{padding: 15, paddingBottom: 100}}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.gold} />}
                ListEmptyComponent={<Text style={styles.emptyText}>No results found</Text>}
              />
            )}
          </View>
        )}

        {/* Feedback Modal */}
        <Modal visible={feedbackModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Send Feedback to {selectedUser?.fullName}</Text>
              
              <View style={styles.feedbackTypes}>
                {['feedback', 'warning', 'notice'].map(type => (
                  <TouchableOpacity 
                    key={type}
                    style={[styles.typeBtn, feedbackType === type && styles.activeTypeBtn]}
                    onPress={() => setFeedbackType(type)}
                  >
                    <Text style={[styles.typeBtnText, feedbackType === type && styles.activeTypeBtnText]}>{type.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput 
                style={styles.feedbackInput}
                placeholder="Enter your message here..."
                placeholderTextColor="grey"
                multiline
                numberOfLines={4}
                value={feedbackMessage}
                onChangeText={setFeedbackMessage}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setFeedbackModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sendBtn} onPress={handleSendFeedback} disabled={actionLoading === 'feedback'}>
                  {actionLoading === 'feedback' ? <ActivityIndicator color={theme.colors.dark} /> : <Text style={styles.sendBtnText}>Send</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </PageAnimation>
  );
}

const TabItem = ({ active, label, icon, onPress }) => (
  <TouchableOpacity style={[styles.tabItem, active && styles.activeTabItem]} onPress={onPress}>
    <Ionicons name={icon} size={20} color={active ? theme.colors.gold : 'grey'} />
    <Text style={[styles.tabLabel, active && styles.activeTabLabel]}>{label}</Text>
  </TouchableOpacity>
);

const StatCard = ({ title, value, icon, color, isCompact }) => (
  <View style={[styles.statCard, isCompact && styles.statCardCompact]}>
    <Ionicons name={icon} size={24} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

const SectionTitle = ({ title, count }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {count > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{count}</Text></View>}
  </View>
);

const HealthItem = ({ label, status }) => {
  const isOk = status === 'ok' || status === 'connected';
  const isBeta = status === 'beta';
  return (
    <View style={styles.card}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
        <Text style={styles.cardTitle}>{label}</Text>
        <View style={[styles.roleBadge, {backgroundColor: isOk ? '#4CAF50' : (isBeta ? theme.colors.gold : '#F44336')}]}>
          <Text style={styles.roleBadgeText}>{status.toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );
};

const PulseItem = ({ label, value }) => (
  <View style={styles.pulseItem}>
    <Text style={styles.pulseValue}>{value}</Text>
    <Text style={styles.pulseLabel}>{label}</Text>
  </View>
);

const ReviewCard = ({ title, subtitle, date, onApprove, onReject, loading }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardSubtitle}>{subtitle}</Text>
    <Text style={styles.cardDate}>{date}</Text>
    <View style={styles.cardActions}>
      <TouchableOpacity 
        style={[styles.actionBtn, { backgroundColor: '#4CAF50', borderColor: '#4CAF50', marginLeft: 0 }]} 
        onPress={onApprove} 
        disabled={loading}
        activeOpacity={0.7}
      >
        {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[styles.actionBtnText, {color: '#fff'}]}>Approve</Text>}
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.actionBtn, { backgroundColor: '#F44336', borderColor: '#F44336', marginRight: 0 }]} 
        onPress={onReject} 
        disabled={loading}
        activeOpacity={0.7}
      >
        {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[styles.actionBtnText, {color: '#fff'}]}>Reject</Text>}
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.dark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, backgroundColor: theme.colors.nearBlack },
  headerTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', fontFamily: theme.fonts.heading },
  avatarButton: { padding: 2, borderRadius: 22, backgroundColor: 'rgba(201,168,76,0.12)' },
  tabBar: { flexDirection: 'row', backgroundColor: theme.colors.nearBlack, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 15, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTabItem: { borderBottomColor: theme.colors.gold },
  tabLabel: { color: 'grey', fontSize: 14, marginTop: 5, fontWeight: 'bold' },
  activeTabLabel: { color: theme.colors.gold },
  scrollContent: { padding: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 },
  statsGridCompact: { justifyContent: 'center' },
  statCard: { width: '48%', backgroundColor: theme.colors.nearBlack, padding: 20, borderRadius: 15, marginBottom: 18, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statCardCompact: { width: '100%' },
  statValue: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', marginTop: 6 },
  statTitle: { color: 'grey', fontSize: 12, textTransform: 'uppercase', marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 15 },
  sectionTitle: { color: theme.colors.gold, fontSize: 20, fontWeight: 'bold' },
  badge: { backgroundColor: '#F44336', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 10 },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  pulseGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  pulseItem: { width: '48%', backgroundColor: 'rgba(201,168,76,0.05)', padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)' },
  pulseValue: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  pulseLabel: { color: 'grey', fontSize: 12, marginTop: 4 },
  emptyContainer: { alignItems: 'center', paddingVertical: 30 },
  card: { backgroundColor: theme.colors.nearBlack, padding: 20, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: 15 },
  cardTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  cardSubtitle: { color: 'grey', fontSize: 14, marginTop: 4 },
  cardDate: { color: theme.colors.gold, fontSize: 13, marginTop: 8, opacity: 0.8 },
  cardActions: { flexDirection: 'row', marginTop: 20 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.gold, borderRadius: 10, paddingVertical: 12, marginHorizontal: 6 },
  actionBtnText: { color: theme.colors.gold, fontSize: 14, fontWeight: 'bold' },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  roleBadgeText: { color: theme.colors.dark, fontSize: 12, fontWeight: 'bold' },
  emptyText: { color: 'grey', textAlign: 'center', marginTop: 25, fontStyle: 'italic', fontSize: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.nearBlack, margin: 20, paddingHorizontal: 18, borderRadius: 12, height: 55 },
  searchInput: { flex: 1, color: '#FFFFFF', marginLeft: 12, fontSize: 16 },
  chartPlaceholder: { margin: 20, backgroundColor: theme.colors.nearBlack, padding: 20, borderRadius: 15 },
  chartTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginBottom: 20 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 6 },
  chartBar: { flex: 1, borderRadius: 3 },
  activityItem: { flexDirection: 'row', marginBottom: 20 },
  activityDot: { width: 10, height: 10, borderRadius: 5, marginTop: 8, marginRight: 15 },
  activityContent: { flex: 1 },
  activityAction: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  activityDetails: { color: 'grey', fontSize: 14, marginTop: 4 },
  activityTime: { color: 'grey', fontSize: 12, marginTop: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 25 },
  modalContent: { backgroundColor: theme.colors.nearBlack, borderRadius: 20, padding: 25, borderWidth: 1, borderColor: theme.colors.gold },
  modalTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', marginBottom: 25 },
  feedbackTypes: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  typeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: theme.colors.gold },
  activeTypeBtn: { backgroundColor: theme.colors.gold },
  typeBtnText: { color: theme.colors.gold, fontSize: 12, fontWeight: 'bold' },
  activeTypeBtnText: { color: theme.colors.dark },
  feedbackInput: { backgroundColor: theme.colors.dark, color: '#FFFFFF', borderRadius: 10, padding: 15, height: 120, textAlignVertical: 'top', marginBottom: 25, fontSize: 16 },
  modalActions: { flexDirection: 'row', gap: 20 },
  cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 15 },
  cancelBtnText: { color: 'grey', fontWeight: 'bold', fontSize: 16 },
  sendBtn: { flex: 1, backgroundColor: theme.colors.gold, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingVertical: 15 },
  sendBtnText: { color: theme.colors.dark, fontWeight: 'bold', fontSize: 16 }
});
