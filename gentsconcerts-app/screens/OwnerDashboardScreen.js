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
    lastSynced: null,
    reconciled: true,
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
    status: 'ok',
    timestamp: null,
    services: { api: 'ok', database: 'ok', auth: 'ok', payment: 'beta', email: 'ok', storage: 'ok' },
    infrastructure: { backupStatus: 'active', lastBackup: null, recoveryHealth: '100%' }
  });
  const [activity, setActivity] = useState([]);
  const [flags, setFlags] = useState([]);
  const [hostApplications, setHostApplications] = useState([]);
  const [eventReviews, setEventReviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
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
          fetch(`${API_BASE.replace('/api', '')}/health`, { headers })
        ]);

        const [statsData, activityData, flagsData, hostsData, eventsData, healthData] = await Promise.all([
          statsRes.json(), activityRes.json(), flagsRes.json(), hostsRes.json(), eventsRes.json(), healthRes.json()
        ]);

        if (statsData.success) setStats(statsData.data);
        if (activityData.success) setActivity(activityData.data);
        if (flagsData.success) setFlags(flagsData.data);
        if (hostsData.success) setHostApplications(hostsData.data);
        if (eventsData.success) setEventReviews(eventsData.data);
        if (healthData) setSystemHealth(healthData);
      } else if (activeTab === 'users' || activeTab === 'hosts') {
        const role = activeTab === 'hosts' ? 'host' : '';
        const res = await fetch(`${API_BASE}/admin/users?role=${role}&search=${searchQuery}`, { headers });
        const data = await res.json();
        if (data.success) setUsers(data.data);
      } else if (activeTab === 'tickets') {
        const res = await fetch(`${API_BASE}/admin/tickets?search=${searchQuery}`, { headers });
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

  const handleDeleteItem = async (type, id, name) => {
    Alert.alert(
      `Delete ${type}`,
      `Are you sure you want to delete ${name || 'this item'}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(id);
            try {
              const token = await AuthService.getToken();
              const path = type === 'User' ? `/admin/users/${id}` : `/admin/tickets/${id}`;
              const response = await fetch(`${API_BASE}${path}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const data = await response.json();
              if (data.success) {
                Alert.alert('Success', `${type} deleted successfully`);
                fetchData();
              } else {
                Alert.alert('Error', data.message || `Failed to delete ${type.toLowerCase()}`);
              }
            } catch (error) {
              Alert.alert('Error', 'Network error');
            } finally {
              setActionLoading(id);
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: selectedUser._id, type: feedbackType, message: feedbackMessage })
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

  const renderAttentionView = () => (
    <ScrollView 
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.gold} />}
    >
      <View style={styles.reconciliationBar}>
        <Ionicons name={stats.reconciled ? "checkmark-circle" : "warning"} size={16} color={stats.reconciled ? "#4CAF50" : "#FF9800"} />
        <Text style={[styles.reconciliationText, { color: stats.reconciled ? "#4CAF50" : "#FF9800" }]}>
          {stats.reconciled ? "Database Reconciled" : "Reconciliation Warning: Revenue Mismatch"}
        </Text>
        <Text style={styles.syncText}>Synced: {stats.lastSynced ? new Date(stats.lastSynced).toLocaleTimeString() : 'Never'}</Text>
      </View>

      <View style={[styles.statsGrid, isCompact && styles.statsGridCompact]}>
        <StatCard isCompact={isCompact} title="Critical Attention" value={stats.pendingFlags + stats.failedPayments} icon="alert-circle" color="#F44336" />
        <StatCard isCompact={isCompact} title="Approval Queue" value={stats.pendingHosts + stats.pendingReviews} icon="checkbox-outline" color={theme.colors.gold} />
      </View>

      <SectionTitle title="Critical Attention" count={flags.length + stats.failedPayments} />
      {flags.map(flag => (
        <IncidentCard 
          key={flag._id}
          title={`${flag.targetType} Incident: ${flag.reason}`}
          severity={flag.severity || 'high'}
          source={flag.source || 'user_report'}
          details={flag.details || 'No additional details provided.'}
          onResolve={() => handleReviewDecision(`/admin/flags/${flag._id}`, 'resolve', 'Incident')}
          loading={actionLoading === `/admin/flags/${flag._id}`}
        />
      ))}
      {stats.failedPayments > 0 && (
        <IncidentCard 
          title="Payment Gateway Failure"
          severity="critical"
          source="system_monitor"
          details={`${stats.failedPayments} payments failed in the last 24 hours. Check payment logs for correlation.`}
          onResolve={() => Alert.alert('Payment Logs', 'Redirecting to payment audit trail...')}
        />
      )}

      <SectionTitle title="Approval Queue" count={hostApplications.length + eventReviews.length} />
      {hostApplications.map(applicant => (
        <ReviewCard 
          key={applicant._id}
          title={`Host: ${applicant.fullName}`}
          subtitle={`${applicant.email}\n${applicant.phone || 'No phone'}`}
          date={`Applied: ${new Date(applicant.hostApplicationSubmittedAt || applicant.createdAt).toLocaleDateString()}`}
          onApprove={() => handleReviewDecision(`/admin/host-applications/${applicant._id}`, 'approve', 'Host')}
          onReject={() => handleReviewDecision(`/admin/host-applications/${applicant._id}`, 'reject', 'Host')}
          loading={actionLoading === `/admin/host-applications/${applicant._id}`}
        />
      ))}
      {eventReviews.map(event => (
        <ReviewCard 
          key={event._id}
          title={`Event: ${event.title}`}
          subtitle={`Organizer: ${event.organizerId?.fullName || 'Unknown'}\nVenue: ${event.venue}`}
          date={`Event Date: ${new Date(event.date).toLocaleDateString()}`}
          onApprove={() => handleReviewDecision(`/admin/event-reviews/${event._id}`, 'publish', 'Event')}
          onReject={() => handleReviewDecision(`/admin/event-reviews/${event._id}`, 'reject', 'Event')}
          loading={actionLoading === `/admin/event-reviews/${event._id}`}
        />
      ))}

      <SectionTitle title="Platform Pulse" />
      <View style={styles.pulseGrid}>
        <PulseItem label="Total Tickets" value={stats.platformPulse.totalTickets} />
        <PulseItem label="Confirmed" value={stats.platformPulse.confirmedTickets} />
        <PulseItem label="Total Hosts" value={stats.platformPulse.totalHosts} />
        <PulseItem label="New Users Today" value={stats.platformPulse.newUsersToday} />
      </View>

      <SectionTitle title="Recent Activity" />
      {activity.map(log => (
        <ActivityItem key={log._id} log={log} />
      ))}
      <Watermark />
    </ScrollView>
  );

  const renderListView = () => (
    <View style={{ flex: 1 }}>
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
      <FlatList
        data={activeTab === 'tickets' ? tickets : users}
        keyExtractor={item => item._id}
        renderItem={activeTab === 'tickets' ? renderTicketItem : renderUserItem}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.gold} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No {activeTab} found.</Text>}
      />
    </View>
  );

  const renderHealthView = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <SectionTitle title="Service Health" />
      <HealthItem label="API Gateway" status={systemHealth.services?.api || 'unknown'} />
      <HealthItem label="Primary Database" status={systemHealth.services?.database || 'unknown'} />
      <HealthItem label="Auth Service" status={systemHealth.services?.auth || 'unknown'} />
      <HealthItem label="Payment Gateway (BETA)" status={systemHealth.services?.payment || 'beta'} />
      <HealthItem label="Email Delivery" status={systemHealth.services?.email || 'unknown'} />

      <SectionTitle title="Recovery Posture" />
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Backup Integrity</Text>
        <Text style={styles.cardSubtitle}>Status: {systemHealth.infrastructure?.backupStatus || 'Active'}</Text>
        <Text style={styles.cardSubtitle}>Last Backup: {systemHealth.infrastructure?.lastBackup ? new Date(systemHealth.infrastructure.lastBackup).toLocaleString() : 'N/A'}</Text>
        <Text style={styles.cardSubtitle}>Recovery Health: {systemHealth.infrastructure?.recoveryHealth || '100%'}</Text>
      </View>
      <Watermark />
    </ScrollView>
  );

  const renderUserItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <UserAvatar user={item} size={40} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.fullName}</Text>
          <Text style={styles.cardSubtitle}>{item.email}</Text>
          <Text style={styles.cardSubtitle}>Role: {item.role.toUpperCase()} · Status: {item.status || 'Active'}</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => { setSelectedUser(item); setFeedbackModalVisible(true); }}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.colors.gold} />
          <Text style={styles.actionBtnText}>Feedback</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { borderColor: '#F44336' }]} onPress={() => handleDeleteItem('User', item._id, item.fullName)}>
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
          <Text style={styles.cardSubtitle}>User: {item.userId?.fullName || 'N/A'}</Text>
          <Text style={styles.cardSubtitle}>Tier: {item.tierName} · ${item.totalAmountUSD}</Text>
          <Text style={[styles.cardSubtitle, { color: item.paymentStatus === 'confirmed' ? '#4CAF50' : '#FF9800' }]}>
            Status: {item.paymentStatus?.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={[styles.actionBtn, { borderColor: '#F44336' }]} onPress={() => handleDeleteItem('Ticket', item._id, `Ticket ${item._id}`)}>
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
          <Text style={styles.headerTitle}>Command Center</Text>
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

        {loading && !refreshing ? (
          <View style={styles.center}><ActivityIndicator color={theme.colors.gold} size="large" /></View>
        ) : (
          activeTab === 'attention' ? renderAttentionView() : 
          activeTab === 'health' ? renderHealthView() : renderListView()
        )}

        <Modal visible={feedbackModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Send System Notice</Text>
              <View style={styles.feedbackTypes}>
                {['feedback', 'warning', 'notice'].map(type => (
                  <TouchableOpacity key={type} style={[styles.typeBtn, feedbackType === type && styles.activeTypeBtn]} onPress={() => setFeedbackType(type)}>
                    <Text style={[styles.typeBtnText, feedbackType === type && styles.activeTypeBtnText]}>{type.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput 
                style={styles.feedbackInput} multiline placeholder="Type your message here..." placeholderTextColor="grey"
                value={feedbackMessage} onChangeText={setFeedbackMessage}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setFeedbackModalVisible(false)}><Text style={{color: 'grey'}}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={handleSendFeedback} disabled={actionLoading === 'feedback'}>
                  {actionLoading === 'feedback' ? <ActivityIndicator size="small" color={theme.colors.dark} /> : <Text style={styles.actionBtnText}>Send Notice</Text>}
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
    <Ionicons name={active ? icon : `${icon}-outline`} size={22} color={active ? theme.colors.gold : 'grey'} />
    <Text style={[styles.tabLabel, active && styles.activeTabLabel]}>{label}</Text>
  </TouchableOpacity>
);

const StatCard = ({ title, value, icon, color, isCompact }) => (
  <View style={[styles.statCard, isCompact && styles.statCardCompact]}>
    <Ionicons name={icon} size={28} color={color} />
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
  const isOk = status === 'ok' || status === 'healthy' || status === 'connected' || status === 'operational';
  const isBeta = status === 'beta' || status === 'beta_mode';
  return (
    <View style={styles.card}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
        <Text style={styles.cardTitle}>{label}</Text>
        <View style={[styles.roleBadge, {backgroundColor: isOk ? '#4CAF50' : (isBeta ? theme.colors.gold : '#F44336')}]}>
          <Text style={styles.roleBadgeText}>{status.replace('_', ' ').toUpperCase()}</Text>
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
      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4CAF50', borderColor: '#4CAF50', marginLeft: 0 }]} onPress={onApprove} disabled={loading}>
        {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[styles.actionBtnText, {color: '#fff'}]}>Approve</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F44336', borderColor: '#F44336', marginRight: 0 }]} onPress={onReject} disabled={loading}>
        {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[styles.actionBtnText, {color: '#fff'}]}>Reject</Text>}
      </TouchableOpacity>
    </View>
  </View>
);

const IncidentCard = ({ title, severity, source, details, onResolve, loading }) => (
  <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: severity === 'critical' ? '#F44336' : theme.colors.gold }]}>
    <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={[styles.roleBadge, {backgroundColor: severity === 'critical' ? '#F44336' : theme.colors.gold}]}>
        <Text style={styles.roleBadgeText}>{severity.toUpperCase()}</Text>
      </View>
    </View>
    <Text style={styles.cardSubtitle}>Source: {source.replace('_', ' ')}</Text>
    <Text style={[styles.cardSubtitle, {marginTop: 8}]}>{details}</Text>
    {onResolve && (
      <TouchableOpacity style={[styles.actionBtn, {marginTop: 15}]} onPress={onResolve} disabled={loading}>
        {loading ? <ActivityIndicator size="small" color={theme.colors.gold} /> : <Text style={styles.actionBtnText}>Resolve</Text>}
      </TouchableOpacity>
    )}
  </View>
);

const ActivityItem = ({ log }) => (
  <View style={styles.activityItem}>
    <View style={[styles.activityDot, { backgroundColor: log.severity === 'critical' ? '#F44336' : (log.severity === 'warning' ? '#FF9800' : theme.colors.gold) }]} />
    <View style={styles.activityContent}>
      <Text style={styles.activityAction}>{log.action}</Text>
      <Text style={styles.activityDetails}>{log.details}</Text>
      <Text style={styles.activityTime}>{new Date(log.timestamp).toLocaleString()}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.dark },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.dark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, backgroundColor: theme.colors.nearBlack },
  headerTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', fontFamily: theme.fonts.heading },
  avatarButton: { padding: 2, borderRadius: 22, backgroundColor: 'rgba(201,168,76,0.12)' },
  tabBar: { flexDirection: 'row', backgroundColor: theme.colors.nearBlack, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 15, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTabItem: { borderBottomColor: theme.colors.gold },
  tabLabel: { color: 'grey', fontSize: 14, marginTop: 5, fontWeight: 'bold' },
  activeTabLabel: { color: theme.colors.gold },
  scrollContent: { padding: 20 },
  reconciliationBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8, marginBottom: 20 },
  reconciliationText: { fontSize: 12, fontWeight: 'bold', marginLeft: 8, flex: 1 },
  syncText: { fontSize: 10, color: 'grey' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 },
  statsGridCompact: { justifyContent: 'center' },
  statCard: { width: '48%', backgroundColor: theme.colors.nearBlack, padding: 20, borderRadius: 15, marginBottom: 18, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statCardCompact: { width: '100%' },
  statValue: { color: '#FFFFFF', fontSize: 26, fontWeight: 'bold', marginTop: 6 },
  statTitle: { color: 'grey', fontSize: 12, textTransform: 'uppercase', marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 15 },
  sectionTitle: { color: theme.colors.gold, fontSize: 20, fontWeight: 'bold' },
  badge: { backgroundColor: '#F44336', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 10 },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  pulseGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  pulseItem: { width: '48%', backgroundColor: 'rgba(201,168,76,0.05)', padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)' },
  pulseValue: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold' },
  pulseLabel: { color: 'grey', fontSize: 12, marginTop: 4 },
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
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.nearBlack, margin: 20, paddingHorizontal: 18, borderRadius: 12, height: 60 },
  searchInput: { flex: 1, color: '#FFFFFF', marginLeft: 12, fontSize: 18 },
  activityItem: { flexDirection: 'row', marginBottom: 20 },
  activityDot: { width: 10, height: 10, borderRadius: 5, marginTop: 8, marginRight: 15 },
  activityContent: { flex: 1 },
  activityAction: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  activityDetails: { color: 'grey', fontSize: 14, marginTop: 4 },
  activityTime: { color: 'grey', fontSize: 12, marginTop: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 25 },
  modalContent: { backgroundColor: theme.colors.nearBlack, borderRadius: 20, padding: 25, borderWidth: 1, borderColor: theme.colors.gold },
  modalTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', marginBottom: 25 },
  feedbackTypes: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  typeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: theme.colors.gold },
  activeTypeBtn: { backgroundColor: theme.colors.gold },
  typeBtnText: { color: theme.colors.gold, fontSize: 12, fontWeight: 'bold' },
  activeTypeBtnText: { color: theme.colors.dark },
  feedbackInput: { backgroundColor: theme.colors.dark, color: '#FFFFFF', borderRadius: 10, padding: 15, height: 120, textAlignVertical: 'top', marginBottom: 25, fontSize: 18 },
  modalActions: { flexDirection: 'row', gap: 20 },
  cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 15 }
});
