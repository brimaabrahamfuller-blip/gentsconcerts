import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { AuthService } from '../AuthService';
import config from '../config';
import PageAnimation from '../components/PageAnimation';

const API_BASE = config.API_URL;
const showMessage = (title, message) => Platform.OS === 'web' ? alert(`${title}\n\n${message}`) : Alert.alert(title, message);

export default function AdminMfaScreen({ navigation, route }) {
  const mode = route?.params?.mode || 'login';
  const [code, setCode] = useState('');
  const [setup, setSetup] = useState(null);
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const request = async (path, options = {}) => {
    const token = await AuthService.getToken();
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) } });
    const data = await response.json();
    if (!response.ok || data.success === false) throw new Error(data.message || 'MFA request failed.');
    return data;
  };

  useEffect(() => {
    if (mode !== 'setup') return;
    request('/auth/admin/mfa/status').then((data) => setStatus(data.data)).catch((error) => showMessage('MFA status unavailable', error.message));
  }, [mode]);

  const startEnrollment = async () => {
    setLoading(true);
    try {
      const data = await request('/auth/admin/mfa/enrollment/start', { method: 'POST', body: JSON.stringify({}) });
      setSetup(data.data);
    } catch (error) { showMessage('Could not start MFA enrollment', error.message); }
    finally { setLoading(false); }
  };

  const confirmEnrollment = async () => {
    if (!/^\d{6}$/.test(code)) { showMessage('Code required', 'Enter the six-digit code from your authenticator app.'); return; }
    setLoading(true);
    try {
      const data = await request('/auth/admin/mfa/enrollment/confirm', { method: 'POST', body: JSON.stringify({ code }) });
      setRecoveryCodes(data.data?.recoveryCodes || []); setStatus(data.data?.status || null); setCode('');
    } catch (error) { showMessage('MFA enrollment failed', error.message); }
    finally { setLoading(false); }
  };

  const verifyLogin = async () => {
    if (!/^\d{6}$/.test(code) && !code.trim()) { showMessage('Code required', 'Enter your six-digit authenticator code or a recovery code.'); return; }
    setLoading(true);
    try {
      const data = await fetch(`${API_BASE}/auth/admin/mfa/login/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ challengeId: route.params.challengeId, code: code.trim() }) });
      const payload = await data.json();
      if (!data.ok || payload.success === false) throw new Error(payload.message || 'MFA verification failed.');
      await AuthService.completeAdminMfaLogin(payload.token, payload.data?.user);
      navigation.replace('OwnerDashboard');
    } catch (error) { showMessage('MFA verification failed', error.message); }
    finally { setLoading(false); }
  };

  if (mode === 'login') return (
    <PageAnimation><SafeAreaView style={styles.container}><View style={styles.card}>
      <Ionicons name="shield-checkmark-outline" size={48} color={theme.colors.gold} />
      <Text style={styles.title}>Administrator verification</Text>
      <Text style={styles.subtitle}>Enter the six-digit code from your authenticator app. You may use a one-time recovery code if your authenticator is unavailable.</Text>
      <TextInput autoFocus value={code} onChangeText={setCode} keyboardType="default" autoCapitalize="characters" maxLength={32} placeholder="Authenticator or recovery code" placeholderTextColor={theme.colors.lightGrey} style={styles.input} />
      <Pressable onPress={verifyLogin} disabled={loading} style={[styles.primaryButton, loading && styles.disabled]}>{loading ? <ActivityIndicator color={theme.colors.dark} /> : <Text style={styles.primaryText}>Verify and enter portal</Text>}</Pressable>
      <Pressable onPress={() => navigation.replace('AdminLogin')}><Text style={styles.link}>Return to administrator login</Text></Pressable>
    </View></SafeAreaView></PageAnimation>
  );

  return <PageAnimation><SafeAreaView style={styles.container}><ScrollView contentContainerStyle={styles.scroll}>
    <View style={styles.card}>
      <Ionicons name="shield-checkmark-outline" size={48} color={theme.colors.gold} />
      <Text style={styles.title}>Secure administrator account</Text>
      <Text style={styles.subtitle}>Set up an authenticator app before entering the administrator portal. Recovery codes are shown once and must be stored securely.</Text>
      {recoveryCodes.length ? <View style={styles.recoveryBox}><Text style={styles.sectionTitle}>Save your recovery codes now</Text><Text style={styles.subtitle}>Each code works once. They are not stored on this device and cannot be displayed again.</Text><Text selectable style={styles.recoveryCodes}>{recoveryCodes.join('\n')}</Text><Pressable onPress={async () => { await AuthService.logout(); navigation.replace('AdminLogin'); }} style={styles.primaryButton}><Text style={styles.primaryText}>I stored the codes — sign in again</Text></Pressable></View> : null}
      {!recoveryCodes.length && !setup && !status?.enabled ? <Pressable onPress={startEnrollment} disabled={loading} style={[styles.primaryButton, loading && styles.disabled]}>{loading ? <ActivityIndicator color={theme.colors.dark} /> : <Text style={styles.primaryText}>Start authenticator setup</Text>}</Pressable> : null}
      {setup ? <><Text style={styles.sectionTitle}>Scan this QR code</Text><Image source={{ uri: setup.qrCodeDataUrl }} style={styles.qr} /><Text style={styles.subtitle}>Then enter the current six-digit code from your authenticator app.</Text><TextInput value={code} onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} placeholder="Six-digit authenticator code" placeholderTextColor={theme.colors.lightGrey} style={styles.input} /><Pressable onPress={confirmEnrollment} disabled={loading} style={[styles.primaryButton, loading && styles.disabled]}>{loading ? <ActivityIndicator color={theme.colors.dark} /> : <Text style={styles.primaryText}>Confirm MFA enrollment</Text>}</Pressable></> : null}
      {status?.enabled && !recoveryCodes.length ? <><Text style={styles.sectionTitle}>MFA is already enabled</Text><Text style={styles.subtitle}>Recovery codes remaining: {status.recoveryCodesAvailable}. Strong MFA is required for financial approvals.</Text><Pressable onPress={() => navigation.replace('OwnerDashboard')} style={styles.primaryButton}><Text style={styles.primaryText}>Continue to portal</Text></Pressable></> : null}
    </View>
  </ScrollView></SafeAreaView></PageAnimation>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.dark },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 560, alignSelf: 'center', alignItems: 'center', backgroundColor: theme.colors.nearBlack, borderRadius: 18, padding: 28, borderWidth: 1, borderColor: 'rgba(254,236,205,0.18)' },
  title: { color: '#FFFFFF', fontSize: 25, fontWeight: '900', textAlign: 'center', marginTop: 14 },
  subtitle: { color: theme.colors.lightGrey, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 10 },
  sectionTitle: { color: theme.colors.gold, fontSize: 14, fontWeight: '900', marginTop: 22, textAlign: 'center' },
  input: { width: '100%', color: '#FFFFFF', backgroundColor: theme.colors.dark, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(254,236,205,0.2)', paddingHorizontal: 14, paddingVertical: 13, marginTop: 22, textAlign: 'center', letterSpacing: 1 },
  primaryButton: { width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.gold, borderRadius: 11, paddingVertical: 14, marginTop: 18 },
  primaryText: { color: theme.colors.dark, fontWeight: '900', fontSize: 13 },
  disabled: { opacity: 0.6 },
  link: { color: theme.colors.gold, fontWeight: '800', fontSize: 12, marginTop: 20 },
  qr: { width: 220, height: 220, marginTop: 18, backgroundColor: '#FFFFFF' },
  recoveryBox: { width: '100%', backgroundColor: 'rgba(254,236,205,0.08)', borderRadius: 12, padding: 16, marginTop: 18 },
  recoveryCodes: { color: '#FFFFFF', fontSize: 15, lineHeight: 25, letterSpacing: 1.5, textAlign: 'center', marginTop: 16 },
});
