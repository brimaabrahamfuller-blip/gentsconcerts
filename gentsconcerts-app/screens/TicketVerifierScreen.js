// Festival Operations Room: field-ready navy-and-gold verification control surface.
// Core principle: first admission is unmistakable; repeat scans preserve first-scan evidence.
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '../AuthService';
import { theme } from '../styles/theme';
import WebQrScanner from '../components/WebQrScanner';

const COLORS = {
  navy: '#071426',
  navyRaised: '#0E203A',
  slate: '#182B46',
  gold: '#D8B44B',
  mist: '#DDE5EF',
  muted: '#9AABC0',
  verified: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  dark: '#050A13',
};

const formatDateTime = (value) => {
  if (!value) return 'Not recorded';
  try {
    return new Date(value).toLocaleString(undefined, {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch (_) {
    return value;
  }
};

const statusMeta = (result) => {
  if (result?.status === 'admitted') {
    return { tone: COLORS.verified, icon: 'checkmark-circle', eyebrow: 'ADMISSION CONFIRMED', title: 'Ticket verified', detail: 'This pass is now marked as admitted.' };
  }
  if (result?.status === 'already_scanned') {
    return { tone: COLORS.danger, icon: 'close-circle', eyebrow: 'DO NOT ADMIT', title: 'Already scanned', detail: 'This ticket was admitted earlier and cannot be used again.' };
  }
  if (result?.status === 'not_confirmed') {
    return { tone: COLORS.warning, icon: 'alert-circle', eyebrow: 'PAYMENT NOT CONFIRMED', title: 'Ticket is not active', detail: 'Do not admit this guest. Their ticket is not confirmed.' };
  }
  return { tone: COLORS.danger, icon: 'alert-circle', eyebrow: 'VERIFICATION FAILED', title: 'Ticket not accepted', detail: result?.message || 'Check the code and try again.' };
};

export default function TicketVerifierScreen({ navigation, route }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [staffUser, setStaffUser] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanCount, setScanCount] = useState(0);
  const [cameraMessage, setCameraMessage] = useState('');
  const scanLock = useRef(false);

  useEffect(() => {
    AuthService.getUser().then(setStaffUser);
  }, []);

  // Existing PDF tickets carry a legacy ticket-verify.html?id=… QR link.
  // When authorised gate staff open it, prefill the ID but require an explicit
  // Verify tap so simply opening a QR link can never admit a guest by itself.
  useEffect(() => {
    const ticketCode = route?.params?.ticketCode;
    if (ticketCode) setManualCode(ticketCode);
  }, [route?.params?.ticketCode]);

  const submitScan = useCallback(async (value) => {
    if (scanLock.current || !String(value || '').trim()) return;
    scanLock.current = true;
    setIsSubmitting(true);
    setScannerOpen(false);

    const result = await AuthService.scanTicket(value);

    // A long-lived browser token can outlast the staff account it refers to.
    // Do not let that stale session masquerade as a rejected ticket: clear it
    // and preserve the scanned value through the staff re-authentication flow.
    if (result.status === 'session_expired') {
      await AuthService.logout();
      setStaffUser(null);
      setIsSubmitting(false);
      scanLock.current = false;
      const message = 'Your gate-staff session is no longer active. Please sign in again before verifying this ticket.';
      if (Platform.OS === 'web') alert(`Sign in required\n\n${message}`);
      else Alert.alert('Sign in required', message);
      navigation.replace('Login', { redirectTo: 'TicketVerifier', ticketCode: String(value).trim() });
      return;
    }

    setScanResult(result);
    setScanCount((count) => count + 1);
    setManualCode('');
    setIsSubmitting(false);
    scanLock.current = false;
  }, []);

  const handleBarcodeScanned = useCallback((data) => {
    submitScan(data);
  }, [submitScan]);

  const openCamera = async () => {
    setCameraMessage('');
    setScanResult(null);

    // On the web, html5-qrcode calls getUserMedia from the user gesture and
    // handles device-specific QR decoding. Its error callback below provides
    // actionable recovery guidance when the camera is blocked or unavailable.
    if (Platform.OS === 'web') {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setCameraMessage('This browser does not provide camera access. Enter the ticket ID printed below the QR code instead.');
        return;
      }
    } else if (!permission?.granted) {
      const response = await requestPermission();
      if (!response.granted) {
        const message = 'Camera permission is needed to scan QR tickets. You can still type the ticket ID manually.';
        setCameraMessage(message);
        Alert.alert('Camera permission needed', message);
        return;
      }
    }
    setScannerOpen(true);
  };

  const resultStyle = statusMeta(scanResult);
  const data = scanResult?.data;
  const hasStaffRole = staffUser?.role === 'admin' || staffUser?.role === 'owner' || staffUser?.role === 'host';

  if (staffUser && !hasStaffRole) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.accessDenied}>
          <Ionicons name="lock-closed-outline" size={48} color={COLORS.gold} />
          <Text style={styles.accessTitle}>Verifier access only</Text>
          <Text style={styles.accessText}>This gate-control page is available only to authorised GentsConcerts event staff.</Text>
          <Pressable onPress={() => navigation.replace('Main')} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Return to GentsConcerts</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Return" onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={25} color={COLORS.mist} />
          </Pressable>
          <View style={styles.brandLockup}>
            <Text style={styles.brandGents}>GENTS</Text><Text style={styles.brandConcerts}>CONCERTS</Text>
            <Text style={styles.brandSub}>GATE VERIFIER</Text>
          </View>
          <View style={styles.livePill}>
            <View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        <View style={styles.heroBlock}>
          <View style={styles.goldRail} />
          <Text style={styles.eyebrow}>ALL LIBERIAN FESTIVAL 2026</Text>
          <Text style={styles.heroTitle}>Validate each entry,{`\n`}once.</Text>
          <Text style={styles.heroCopy}>Scan the guest’s QR code. The first successful scan records admission immediately; every later attempt is blocked and shown with its original scan time.</Text>
        </View>

        <View style={styles.scanCard}>
          <View style={styles.scanCardHeader}>
            <View>
              <Text style={styles.cardKicker}>GATE CONTROL</Text>
              <Text style={styles.cardTitle}>Scan ticket QR</Text>
            </View>
            <View style={styles.scanCounter}><Text style={styles.scanCounterValue}>{scanCount}</Text><Text style={styles.scanCounterLabel}>checks</Text></View>
          </View>

          {scannerOpen ? (
            <View style={styles.cameraArea}>
              <WebQrScanner
                style={styles.camera}
                onScan={isSubmitting ? undefined : handleBarcodeScanned}
                onError={(event) => {
                  const errorMessage = event?.nativeEvent?.message || event?.message || String(event || '');
                  console.warn('Ticket verifier camera mount failed:', errorMessage);
                  setScannerOpen(false);
                  const blocked = /notallowed|permission|denied/i.test(errorMessage);
                  setCameraMessage(blocked
                    ? 'Camera permission was blocked. Allow camera access for gentsconcerts.netlify.app in your browser settings, then try again.'
                    : 'The camera could not start on this device. Close other camera apps, then try again, or enter the printed ticket ID manually.');
                }}
              />
              <View pointerEvents="none" style={styles.scanOverlay}>
                <View style={styles.scanFrame} />
                <Text style={styles.scanHint}>Align the ticket QR inside the frame</Text>
              </View>
              <Pressable onPress={() => setScannerOpen(false)} style={styles.closeCamera}>
                <Ionicons name="close" size={22} color="#fff" /><Text style={styles.closeCameraText}>Close camera</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable disabled={isSubmitting} onPress={openCamera} style={({ pressed }) => [styles.scanButton, pressed && styles.pressed, isSubmitting && styles.disabled]}>
              {isSubmitting ? <ActivityIndicator color={COLORS.navy} /> : <Ionicons name="scan-outline" size={28} color={COLORS.navy} />}
              <Text style={styles.scanButtonText}>{isSubmitting ? 'Checking ticket…' : 'Open QR scanner'}</Text>
            </Pressable>
          )}

          <View style={styles.orRow}><View style={styles.orLine} /><Text style={styles.orText}>OR ENTER TICKET ID</Text><View style={styles.orLine} /></View>
          <View style={styles.manualRow}>
            <TextInput
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="GC-2026-XXXXXXXX"
              placeholderTextColor="#708096"
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isSubmitting}
              style={styles.manualInput}
              onSubmitEditing={() => submitScan(manualCode)}
            />
            <Pressable disabled={isSubmitting || !manualCode.trim()} onPress={() => submitScan(manualCode)} style={({ pressed }) => [styles.verifyButton, (!manualCode.trim() || isSubmitting) && styles.disabled, pressed && styles.pressed]}>
              <Text style={styles.verifyButtonText}>Verify</Text>
            </Pressable>
          </View>
          {cameraMessage ? (
            <View style={styles.cameraHelp}>
              <Ionicons name="information-circle-outline" size={18} color={COLORS.gold} />
              <Text style={styles.cameraHelpText}>{cameraMessage}</Text>
            </View>
          ) : null}
        </View>

        {scanResult && (
          <View style={[styles.resultCard, { borderColor: resultStyle.tone }]}>
            <View style={styles.resultTop}>
              <View style={[styles.resultIcon, { backgroundColor: `${resultStyle.tone}22` }]}>
                <Ionicons name={resultStyle.icon} size={30} color={resultStyle.tone} />
              </View>
              <View style={styles.resultHeading}>
                <Text style={[styles.resultEyebrow, { color: resultStyle.tone }]}>{resultStyle.eyebrow}</Text>
                <Text style={styles.resultTitle}>{resultStyle.title}</Text>
              </View>
            </View>
            <Text style={styles.resultDetail}>{resultStyle.detail}</Text>

            {data && (
              <View style={styles.ticketEvidence}>
                <View style={styles.ticketStub}><Text style={styles.ticketStubText}>GC</Text><View style={styles.perforation} /></View>
                <View style={styles.evidenceBody}>
                  <Text style={styles.attendeeName}>{data.purchaserName || 'Ticket holder'}</Text>
                  <Text style={styles.eventName}>{data.event?.title || 'GentsConcerts event'}</Text>
                  <View style={styles.evidenceGrid}>
                    <Evidence label="TICKET ID" value={data.qrCode} />
                    <Evidence label="ACCESS" value={data.tierName || 'Regular Access'} />
                    <Evidence label="QUANTITY" value={String(data.quantity || 1)} />
                    <Evidence label={scanResult.status === 'already_scanned' ? 'FIRST SCANNED' : 'SCAN TIME'} value={formatDateTime(data.usedAt)} />
                  </View>
                  {scanResult.status === 'already_scanned' && data.usedBy ? <Text style={styles.usedBy}>First admission recorded by {data.usedBy}.</Text> : null}
                </View>
              </View>
            )}

            <Pressable onPress={() => { setScanResult(null); setScannerOpen(false); }} style={styles.nextScanButton}>
              <Ionicons name="refresh" size={19} color={COLORS.mist} /><Text style={styles.nextScanText}>Check next ticket</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.auditNote}>
          <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.gold} />
          <Text style={styles.auditText}>Every valid first scan is recorded against the live ticket record. Staff cannot undo, edit, or delete admissions from this page.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Evidence({ label, value }) {
  return <View style={styles.evidenceItem}><Text style={styles.evidenceLabel}>{label}</Text><Text style={styles.evidenceValue}>{value || '—'}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.dark },
  scroll: { paddingBottom: 44, backgroundColor: COLORS.dark },
  topBar: { minHeight: 82, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.navy, borderBottomWidth: 1, borderBottomColor: 'rgba(216,180,75,0.25)' },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)' },
  brandLockup: { alignItems: 'center', flex: 1 },
  brandGents: { color: '#F5F8FC', fontSize: 20, fontWeight: '900', letterSpacing: 0.2 },
  brandConcerts: { color: COLORS.gold, fontSize: 20, fontWeight: '900', marginLeft: 0, marginTop: -23, alignSelf: 'center', transform: [{ translateX: 45 }] },
  brandSub: { color: COLORS.muted, fontSize: 9, letterSpacing: 2.1, fontWeight: '800', marginTop: 5 },
  livePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 99, backgroundColor: 'rgba(34,197,94,0.14)' },
  liveDot: { width: 7, height: 7, borderRadius: 7, backgroundColor: COLORS.verified, marginRight: 6 },
  liveText: { color: '#BFF4CE', fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  heroBlock: { paddingHorizontal: 28, paddingTop: 38, paddingBottom: 32, backgroundColor: COLORS.navy },
  goldRail: { width: 56, height: 4, borderRadius: 4, backgroundColor: COLORS.gold, marginBottom: 19 },
  eyebrow: { color: COLORS.gold, letterSpacing: 1.8, fontWeight: '900', fontSize: 11, marginBottom: 11 },
  heroTitle: { color: '#FFFFFF', fontSize: 36, lineHeight: 40, fontWeight: '900', letterSpacing: -0.7 },
  heroCopy: { color: '#B9C6D5', fontSize: 16, lineHeight: 24, marginTop: 14, maxWidth: 560 },
  scanCard: { margin: 20, marginTop: -8, padding: 20, borderRadius: 22, backgroundColor: COLORS.navyRaised, borderWidth: 1, borderColor: 'rgba(216,180,75,0.25)', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 8 },
  scanCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  cardKicker: { color: COLORS.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.7 },
  cardTitle: { color: '#FFFFFF', fontSize: 25, fontWeight: '800', marginTop: 5 },
  scanCounter: { alignItems: 'flex-end' },
  scanCounterValue: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  scanCounterLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  scanButton: { minHeight: 78, borderRadius: 16, backgroundColor: COLORS.gold, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  scanButtonText: { color: COLORS.navy, fontSize: 19, fontWeight: '900' },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.55 },
  orRow: { marginVertical: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },
  orLine: { height: 1, flex: 1, backgroundColor: 'rgba(221,229,239,0.14)' },
  orText: { color: COLORS.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  manualRow: { flexDirection: 'row', gap: 10 },
  manualInput: { minWidth: 0, flex: 1, color: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(221,229,239,0.22)', borderRadius: 13, paddingHorizontal: 14, height: 54, fontSize: 15, fontWeight: '800', letterSpacing: 0.35, backgroundColor: 'rgba(0,0,0,0.17)' },
  verifyButton: { height: 54, borderRadius: 13, paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  verifyButtonText: { color: COLORS.navy, fontSize: 15, fontWeight: '900' },
  cameraHelp: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 13, padding: 11, borderRadius: 11, backgroundColor: 'rgba(216,180,75,0.11)', borderWidth: 1, borderColor: 'rgba(216,180,75,0.25)' },
  cameraHelpText: { flex: 1, color: '#D8E0E9', fontSize: 12, lineHeight: 18 },
  cameraArea: { height: 340, overflow: 'hidden', borderRadius: 18, backgroundColor: '#000', position: 'relative' },
  camera: { flex: 1 },
  scanOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.18)' },
  scanFrame: { width: 218, height: 218, borderWidth: 3, borderColor: COLORS.gold, borderRadius: 20, shadowColor: COLORS.gold, shadowOpacity: 0.75, shadowRadius: 10 },
  scanHint: { position: 'absolute', bottom: 28, color: '#FFFFFF', backgroundColor: 'rgba(5,10,19,0.78)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 99, fontSize: 12, fontWeight: '800' },
  closeCamera: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(5,10,19,0.78)', paddingHorizontal: 11, paddingVertical: 8, borderRadius: 99 },
  closeCameraText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  resultCard: { marginHorizontal: 20, marginTop: 4, padding: 20, borderWidth: 1.5, borderRadius: 22, backgroundColor: COLORS.navyRaised },
  resultTop: { flexDirection: 'row', alignItems: 'center' },
  resultIcon: { width: 58, height: 58, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  resultHeading: { flex: 1 },
  resultEyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.35 },
  resultTitle: { color: '#FFFFFF', fontSize: 27, fontWeight: '900', marginTop: 4 },
  resultDetail: { color: '#C3CFDB', fontSize: 15, lineHeight: 22, marginTop: 16 },
  ticketEvidence: { marginTop: 18, borderRadius: 16, overflow: 'hidden', flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.24)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  ticketStub: { width: 43, backgroundColor: COLORS.gold, alignItems: 'center', paddingTop: 17, position: 'relative' },
  ticketStubText: { color: COLORS.navy, fontWeight: '900', fontSize: 14, letterSpacing: 0.4 },
  perforation: { position: 'absolute', right: -2, top: 0, bottom: 0, borderRightWidth: 2, borderColor: COLORS.navy, borderStyle: 'dashed' },
  evidenceBody: { flex: 1, padding: 16, minWidth: 0 },
  attendeeName: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  eventName: { color: COLORS.gold, marginTop: 3, fontWeight: '800', fontSize: 12 },
  evidenceGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 15, gap: 13 },
  evidenceItem: { width: '46%' },
  evidenceLabel: { color: '#8494A9', fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  evidenceValue: { color: '#E8EEF5', fontSize: 12, lineHeight: 17, fontWeight: '700', marginTop: 4 },
  usedBy: { marginTop: 14, color: '#C3CFDB', fontSize: 12, fontStyle: 'italic' },
  nextScanButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18, minHeight: 51, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(221,229,239,0.24)' },
  nextScanText: { color: COLORS.mist, fontSize: 15, fontWeight: '900' },
  auditNote: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginHorizontal: 24, marginTop: 26, padding: 15, borderRadius: 14, backgroundColor: 'rgba(216,180,75,0.08)' },
  auditText: { flex: 1, color: '#B8C5D2', fontSize: 12, lineHeight: 18 },
  accessDenied: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, backgroundColor: COLORS.dark },
  accessTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', marginTop: 18 },
  accessText: { color: COLORS.muted, fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: 9, maxWidth: 380 },
  secondaryButton: { marginTop: 24, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.gold },
  secondaryButtonText: { color: COLORS.gold, fontWeight: '900' },
});
