import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { AuthService } from '../AuthService';
import Logo from '../components/Logo';
import PageAnimation from '../components/PageAnimation';

export default function AdminLoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showAlert('Required', 'Enter the creator/admin email and password.');
      return;
    }

    setLoading(true);
    const result = await AuthService.login(email.trim(), password);
    setLoading(false);

    if (!result.success) {
      showAlert('Admin Login Failed', result.message || 'Invalid administrator credentials.');
      return;
    }

    const role = result.user?.role;
    if (role !== 'admin' && role !== 'owner') {
      await AuthService.logout();
      showAlert('Admin Access Only', 'This account is not authorized to enter the creator/admin portal.');
      return;
    }

    navigation.replace('OwnerDashboard');
  };

  return (
    <PageAnimation>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Logo size="large" showTagline={false} />
            <Text style={styles.eyebrow}>GENTSCONCERTS CREATOR CONSOLE</Text>
            <Text style={styles.title}>Administrator Login</Text>
            <Text style={styles.subtitle}>
              Restricted access for GentsConcerts creators and authorized administrators.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Admin Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={theme.colors.gold} />
              <TextInput
                style={styles.input}
                placeholder="gentsconcerts@gmail.com"
                placeholderTextColor="#8c96a8"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={styles.label}>Admin Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.colors.gold} />
              <TextInput
                style={styles.input}
                placeholder="Enter administrator password"
                placeholderTextColor="#8c96a8"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={handleLogin}
                returnKeyType="go"
              />
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={theme.colors.dark} />
              ) : (
                <Text style={styles.loginButtonText}>Enter Admin Portal</Text>
              )}
            </TouchableOpacity>

            <View style={styles.securityNote}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#4CAF50" />
              <Text style={styles.securityText}>
                No attendee or host account can access this console. Password recovery is handled through the protected creator deployment procedure.
              </Text>
            </View>

            <TouchableOpacity style={styles.backButton} onPress={() => navigation.replace('Login')}>
              <Text style={styles.backText}>Return to official GentsConcerts login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </PageAnimation>
  );
}

const showAlert = (title, message) => {
  if (Platform.OS === 'web') alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.dark },
  content: { flex: 1, width: '100%', maxWidth: 620, alignSelf: 'center', padding: 28, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 36 },
  eyebrow: { color: theme.colors.gold, fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginTop: 18, textAlign: 'center' },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '800', marginTop: 12, textAlign: 'center' },
  subtitle: { color: '#b6bfce', fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 10, maxWidth: 460 },
  form: { backgroundColor: theme.colors.nearBlack, borderRadius: 18, padding: 24, borderWidth: 1, borderColor: 'rgba(254,236,205,0.18)' },
  label: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 14 },
  inputWrapper: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(254,236,205,0.24)', borderRadius: 12, backgroundColor: 'rgba(3,24,54,0.72)' },
  input: { flex: 1, color: '#FFFFFF', fontSize: 16, paddingVertical: 14 },
  loginButton: { minHeight: 58, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.gold, borderRadius: 12, marginTop: 26 },
  loginButtonText: { color: theme.colors.dark, fontSize: 16, fontWeight: '800' },
  securityNote: { flexDirection: 'row', gap: 10, marginTop: 22, padding: 14, borderRadius: 10, backgroundColor: 'rgba(76,175,80,0.08)' },
  securityText: { flex: 1, color: '#b6bfce', fontSize: 12, lineHeight: 18 },
  backButton: { alignItems: 'center', marginTop: 24 },
  backText: { color: theme.colors.gold, fontSize: 13, fontWeight: '700' },
});
