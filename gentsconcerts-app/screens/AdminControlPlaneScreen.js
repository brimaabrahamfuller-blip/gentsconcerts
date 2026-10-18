import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { AuthService } from '../AuthService';
import config from '../config';
import PageAnimation from '../components/PageAnimation';

const API_BASE = config.API_URL;

const DEPARTMENTS = [
  { value: 'governance_risk_compliance', label: 'Governance, Risk & Compliance', short: 'GRC' },
  { value: 'finance_payments_settlement', label: 'Finance, Payments & Settlement', short: 'Finance' },
  { value: 'platform_operations_trust', label: 'Platform Operations & Trust', short: 'Operations' },
  { value: 'technology_security_data', label: 'Technology, Security & Data', short: 'Technology' },
];

const PERMISSIONS = [
  { value: 'admin.portal.access', label: 'Portal access', group: 'Core' },
  { value: 'grc.case.read', label: 'Read compliance cases', group: 'GRC' },
  { value: 'grc.case.manage', label: 'Manage compliance cases', group: 'GRC' },
  { value: 'grc.user-risk.review', label: 'Review user risk', group: 'GRC' },
  { value: 'grc.complaint.manage', label: 'Manage complaints', group: 'GRC' },
  { value: 'finance.collection.read', label: 'Read collections', group: 'Finance' },
  { value: 'finance.reconciliation.manage', label: 'Manage reconciliation', group: 'Finance' },
  { value: 'finance.refund.manage', label: 'Manage refunds', group: 'Finance' },
  { value: 'finance.payout.create', label: 'Create payout requests', group: 'Finance' },
  { value: 'finance.payout.approve', label: 'Approve payout requests', group: 'Finance' },
  { value: 'ops.host.review', label: 'Review host applications', group: 'Operations' },
  { value: 'ops.event.review', label: 'Review event publications', group: 'Operations' },
  { value: 'ops.ticket.manage', label: 'Manage tickets', group: 'Operations' },
  { value: 'ops.incident.manage', label: 'Manage incidents', group: 'Operations' },
  { value: 'tech.audit.read', label: 'Read audit events', group: 'Technology' },
  { value: 'tech.access.manage', label: 'Manage administrator access', group: 'Technology' },
  { value: 'tech.incident.manage', label: 'Manage security incidents', group: 'Technology' },
];

const showMessage = (title, message) => {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const formatDate = (value) => {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString();
};

export default function AdminControlPlaneScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isCompact = width < 760;
  const [activeView, setActiveView] = useState('access');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [draft, setDraft] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [auditFilter, setAuditFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const request = useCallback(async (path, options = {}) => {
    const token = await AuthService.getToken();
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    const data = await response.json();
    if (!response.ok || data.success === false) {
      throw new Error(data.message || 'The control-plane request failed.');
    }
    return data;
  }, []);

  const loadUsers = useCallback(async () => {
    const data = await request('/admin/users?role=admin&limit=100');
    const adminUsers = (data.data || []).filter((user) => ['admin', 'owner'].includes(user.role));
    setUsers(adminUsers);
    if (selectedUser?._id) {
      const refreshed = adminUsers.find((user) => user._id === selectedUser._id);
      if (refreshed) {
        setSelectedUser(refreshed);
        setDraft({
          departments: refreshed.departments || [],
          permissions: refreshed.permissions || [],
          approvalLimits: refreshed.approvalLimits || { payoutLRD: 0, refundLRD: 0 },
        });
      }
    }
  }, [request, selectedUser?._id]);

  const loadAudit = useCallback(async () => {
    const suffix = auditFilter.trim() ? `&action=${encodeURIComponent(auditFilter.trim())}` : '';
    const data = await request(`/admin/audit-events?page=1&limit=80${suffix}`);
    setAuditEvents(data.data || []);
  }, [auditFilter, request]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadUsers(), loadAudit()]);
    } catch (error) {
      showMessage('Control plane unavailable', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadAudit, loadUsers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) => `${user.fullName} ${user.email} ${user.role}`.toLowerCase().includes(term));
  }, [search, users]);

  const selectUser = (user) => {
    setSelectedUser(user);
    setDraft({
      departments: user.departments || [],
      permissions: user.permissions || [],
      approvalLimits: user.approvalLimits || { payoutLRD: 0, refundLRD: 0 },
    });
  };

  const toggleValue = (field, value) => {
    if (!draft) return;
    const current = draft[field] || [];
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    setDraft({ ...draft, [field]: next });
  };

  const updateLimit = (field, value) => {
    if (!draft) return;
    setDraft({
      ...draft,
      approvalLimits: { ...draft.approvalLimits, [field]: value.replace(/[^0-9.]/g, '') },
    });
  };

  const saveAccess = async () => {
    if (!selectedUser || !draft) return;
    if (!draft.departments.length || !draft.permissions.includes('admin.portal.access')) {
      showMessage('Access assignment incomplete', 'Select at least one department and keep Portal access enabled.');
      return;
    }
    setSaving(true);
    try {
      const data = await request(`/admin/access/users/${selectedUser._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          departments: draft.departments,
          permissions: draft.permissions,
          approvalLimits: {
            payoutLRD: Number(draft.approvalLimits?.payoutLRD || 0),
            refundLRD: Number(draft.approvalLimits?.refundLRD || 0),
          },
        }),
      });
      setSelectedUser(data.data);
      setDraft({
        departments: data.data.departments || [],
        permissions: data.data.permissions || [],
        approvalLimits: data.data.approvalLimits || { payoutLRD: 0, refundLRD: 0 },
      });
      await loadAudit();
      showMessage('Access updated', 'The assignment was saved and added to the audit trail.');
    } catch (error) {
      showMessage('Could not update access', error.message);
    } finally {
      setSaving(false);
    }
  };

  const renderAccessView = () => (
    <View style={[styles.splitLayout, isCompact && styles.splitLayoutCompact]}>
      <View style={[styles.userRail, isCompact && styles.userRailCompact]}>
        <Text style={styles.sectionEyebrow}>ADMINISTRATORS</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search staff accounts"
          placeholderTextColor={theme.colors.lightGrey}
          style={styles.searchInput}
        />
        {filteredUsers.map((user) => (
          <Pressable
            key={user._id}
            onPress={() => selectUser(user)}
            style={[styles.userRow, selectedUser?._id === user._id && styles.userRowActive]}
          >
            <View style={styles.avatar}><Text style={styles.avatarText}>{(user.fullName || 'A').slice(0, 1).toUpperCase()}</Text></View>
            <View style={styles.userRowCopy}>
              <Text style={styles.userName} numberOfLines={1}>{user.fullName}</Text>
              <Text style={styles.userMeta} numberOfLines={1}>{user.role} · {user.status}</Text>
            </View>
            <Ionicons name="chevron-forward" color={theme.colors.lightGrey} size={16} />
          </Pressable>
        ))}
        {!filteredUsers.length && <Text style={styles.emptyText}>No administrator accounts found.</Text>}
      </View>

      <View style={[styles.editorPane, isCompact && styles.editorPaneCompact]}>
        {!selectedUser || !draft ? (
          <View style={styles.emptyState}>
            <Ionicons name="shield-checkmark-outline" size={42} color={theme.colors.gold} />
            <Text style={styles.emptyTitle}>Select an administrator</Text>
            <Text style={styles.emptyText}>Review department access, approval limits, and permissions without changing payment credentials.</Text>
          </View>
        ) : (
          <>
            <View style={styles.editorHeader}>
              <View>
                <Text style={styles.editorTitle}>{selectedUser.fullName}</Text>
                <Text style={styles.userMeta}>{selectedUser.email} · {selectedUser.role}</Text>
              </View>
              <View style={styles.statusPill}><Text style={styles.statusPillText}>{selectedUser.status}</Text></View>
            </View>

            <Text style={styles.sectionEyebrow}>DEPARTMENT MEMBERSHIP</Text>
            <Text style={styles.helperText}>Departments describe operational ownership. Permissions below determine the actions this account can perform.</Text>
            <View style={styles.chipWrap}>
              {DEPARTMENTS.map((department) => {
                const active = draft.departments.includes(department.value);
                return (
                  <Pressable key={department.value} onPress={() => toggleValue('departments', department.value)} style={[styles.chip, active && styles.chipActive]}>
                    <Ionicons name={active ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={active ? theme.colors.dark : theme.colors.lightGrey} />
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{department.short}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.sectionEyebrow, styles.sectionGap]}>PERMISSIONS</Text>
            <View style={styles.permissionList}>
              {PERMISSIONS.map((permission) => {
                const active = draft.permissions.includes(permission.value);
                return (
                  <Pressable key={permission.value} onPress={() => toggleValue('permissions', permission.value)} style={styles.permissionRow}>
                    <Ionicons name={active ? 'checkbox' : 'square-outline'} size={22} color={active ? theme.colors.gold : theme.colors.lightGrey} />
                    <View style={styles.permissionCopy}>
                      <Text style={styles.permissionLabel}>{permission.label}</Text>
                      <Text style={styles.permissionCode}>{permission.group} · {permission.value}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.sectionEyebrow, styles.sectionGap]}>APPROVAL LIMITS · LRD</Text>
            <View style={styles.limitsRow}>
              <View style={styles.limitField}><Text style={styles.limitLabel}>Payout approval</Text><TextInput keyboardType="decimal-pad" value={String(draft.approvalLimits?.payoutLRD ?? 0)} onChangeText={(value) => updateLimit('payoutLRD', value)} style={styles.limitInput} /></View>
              <View style={styles.limitField}><Text style={styles.limitLabel}>Refund approval</Text><TextInput keyboardType="decimal-pad" value={String(draft.approvalLimits?.refundLRD ?? 0)} onChangeText={(value) => updateLimit('refundLRD', value)} style={styles.limitInput} /></View>
            </View>

            <Pressable onPress={saveAccess} disabled={saving} style={[styles.primaryButton, saving && styles.buttonDisabled]}>
              {saving ? <ActivityIndicator color={theme.colors.dark} /> : <Ionicons name="save-outline" size={18} color={theme.colors.dark} />}
              <Text style={styles.primaryButtonText}>{saving ? 'Saving assignment…' : 'Save access assignment'}</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );

  const renderAuditView = () => (
    <View>
      <View style={[styles.auditToolbar, isCompact && styles.auditToolbarCompact]}>
        <View style={styles.auditTitleWrap}><Text style={styles.sectionEyebrow}>AUDIT TRAIL</Text><Text style={styles.helperText}>Privileged actions are retained with actor, target, request ID, and before/after state.</Text></View>
        <TextInput value={auditFilter} onChangeText={setAuditFilter} onSubmitEditing={loadAudit} placeholder="Filter actions" placeholderTextColor={theme.colors.lightGrey} style={[styles.auditFilter, isCompact && styles.auditFilterCompact]} />
      </View>
      {auditEvents.map((event) => (
        <View key={event._id} style={styles.auditCard}>
          <View style={styles.auditIcon}><Ionicons name={event.severity === 'critical' ? 'warning-outline' : 'time-outline'} size={19} color={event.severity === 'critical' ? theme.colors.red : theme.colors.gold} /></View>
          <View style={styles.auditCopy}>
            <Text style={styles.auditAction}>{event.action}</Text>
            <Text style={styles.auditMeta}>{event.actor?.fullName || 'System actor'} · {formatDate(event.createdAt)}</Text>
            <Text style={styles.auditDetail}>{event.targetType || 'System'} {event.targetId ? `· ${event.targetId}` : ''}</Text>
            <Text style={styles.auditRequest}>Request {event.requestId || 'not recorded'} · {event.permission || 'owner role'}</Text>
          </View>
          <View style={styles.outcomePill}><Text style={styles.outcomeText}>{event.outcome}</Text></View>
        </View>
      ))}
      {!auditEvents.length && <Text style={styles.emptyText}>No audit events match this filter.</Text>}
    </View>
  );

  return (
    <PageAnimation>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}><Ionicons name="arrow-back" size={22} color={theme.colors.gold} /></Pressable>
          <View style={styles.headerCopy}><Text style={styles.headerEyebrow}>GENTSCONCERTS CONTROL PLANE</Text><Text style={styles.headerTitle}>Access & Audit</Text></View>
          <Pressable onPress={loadData} style={styles.refreshButton}><Ionicons name="refresh-outline" size={21} color={theme.colors.gold} /></Pressable>
        </View>
        <View style={styles.tabs}>
          <Pressable onPress={() => setActiveView('access')} style={[styles.tab, activeView === 'access' && styles.tabActive]}><Ionicons name="key-outline" size={17} color={activeView === 'access' ? theme.colors.dark : theme.colors.lightGrey} /><Text style={[styles.tabText, activeView === 'access' && styles.tabTextActive]}>Department access</Text></Pressable>
          <Pressable onPress={() => setActiveView('audit')} style={[styles.tab, activeView === 'audit' && styles.tabActive]}><Ionicons name="document-text-outline" size={17} color={activeView === 'audit' ? theme.colors.dark : theme.colors.lightGrey} /><Text style={[styles.tabText, activeView === 'audit' && styles.tabTextActive]}>Audit review</Text></Pressable>
        </View>
        {loading ? <View style={styles.loading}><ActivityIndicator color={theme.colors.gold} size="large" /><Text style={styles.helperText}>Loading control-plane data…</Text></View> : (
          <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={theme.colors.gold} />}>
            {activeView === 'access' ? renderAccessView() : renderAuditView()}
          </ScrollView>
        )}
      </SafeAreaView>
    </PageAnimation>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.dark },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingTop: 18, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(254,236,205,0.12)' },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.navyBlue },
  refreshButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.navyBlue },
  headerCopy: { flex: 1, paddingHorizontal: 14 },
  headerEyebrow: { color: theme.colors.gold, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  headerTitle: { color: '#FFFFFF', fontSize: 25, fontWeight: '800', marginTop: 3 },
  tabs: { flexDirection: 'row', paddingHorizontal: 22, paddingTop: 14, gap: 10 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 20, backgroundColor: theme.colors.navyBlue },
  tabActive: { backgroundColor: theme.colors.gold },
  tabText: { color: theme.colors.lightGrey, fontSize: 13, fontWeight: '800' },
  tabTextActive: { color: theme.colors.dark },
  scrollContent: { padding: 22, paddingBottom: 80 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  splitLayout: { flexDirection: 'row', alignItems: 'flex-start', gap: 18 },
  splitLayoutCompact: { flexDirection: 'column' },
  userRail: { width: 290, backgroundColor: theme.colors.navyBlue, borderRadius: 18, padding: 16 },
  userRailCompact: { width: '100%' },
  editorPane: { flex: 1, minWidth: 0, backgroundColor: theme.colors.navyBlue, borderRadius: 18, padding: 22 },
  editorPaneCompact: { width: '100%' },
  sectionEyebrow: { color: theme.colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10 },
  searchInput: { backgroundColor: theme.colors.dark, borderWidth: 1, borderColor: 'rgba(254,236,205,0.18)', color: '#FFFFFF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, marginBottom: 12 },
  userRow: { flexDirection: 'row', alignItems: 'center', padding: 11, borderRadius: 12, marginBottom: 5 },
  userRowActive: { backgroundColor: 'rgba(254,236,205,0.12)' },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.colors.red, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarText: { color: '#FFFFFF', fontWeight: '900' },
  userRowCopy: { flex: 1 },
  userName: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  userMeta: { color: theme.colors.lightGrey, fontSize: 11, marginTop: 3 },
  editorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 26 },
  editorTitle: { color: '#FFFFFF', fontSize: 23, fontWeight: '900' },
  statusPill: { backgroundColor: 'rgba(74,222,128,0.16)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  statusPillText: { color: '#86efac', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  helperText: { color: theme.colors.lightGrey, fontSize: 12, lineHeight: 18 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(254,236,205,0.18)' },
  chipActive: { backgroundColor: theme.colors.gold, borderColor: theme.colors.gold },
  chipText: { color: theme.colors.lightGrey, fontSize: 12, fontWeight: '800' },
  chipTextActive: { color: theme.colors.dark },
  sectionGap: { marginTop: 26 },
  permissionList: { gap: 3 },
  permissionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: 'rgba(254,236,205,0.08)' },
  permissionCopy: { marginLeft: 10, flex: 1 },
  permissionLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  permissionCode: { color: theme.colors.lightGrey, fontSize: 10, marginTop: 2 },
  limitsRow: { flexDirection: 'row', gap: 12 },
  limitField: { flex: 1 },
  limitLabel: { color: theme.colors.lightGrey, fontSize: 11, marginBottom: 6 },
  limitInput: { color: '#FFFFFF', backgroundColor: theme.colors.dark, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(254,236,205,0.18)', paddingHorizontal: 12, paddingVertical: 10 },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: theme.colors.gold, borderRadius: 11, paddingVertical: 13, marginTop: 26 },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: theme.colors.dark, fontSize: 13, fontWeight: '900' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 90, paddingHorizontal: 30 },
  emptyTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginTop: 13, marginBottom: 7 },
  emptyText: { color: theme.colors.lightGrey, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 10 },
  auditToolbar: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 14 },
  auditToolbarCompact: { flexDirection: 'column', alignItems: 'stretch' },
  auditTitleWrap: { flex: 1 },
  auditFilter: { width: 230, backgroundColor: theme.colors.navyBlue, borderWidth: 1, borderColor: 'rgba(254,236,205,0.18)', color: '#FFFFFF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11 },
  auditFilterCompact: { width: '100%' },
  auditCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: theme.colors.navyBlue, borderRadius: 14, padding: 15, marginBottom: 9 },
  auditIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.colors.dark, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  auditCopy: { flex: 1 },
  auditAction: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  auditMeta: { color: theme.colors.gold, fontSize: 11, marginTop: 5 },
  auditDetail: { color: theme.colors.lightGrey, fontSize: 11, marginTop: 5 },
  auditRequest: { color: 'rgba(254,236,205,0.55)', fontSize: 10, marginTop: 5 },
  outcomePill: { backgroundColor: 'rgba(74,222,128,0.14)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  outcomeText: { color: '#86efac', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
});
