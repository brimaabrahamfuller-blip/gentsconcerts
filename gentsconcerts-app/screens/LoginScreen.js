import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { AuthService } from '../AuthService';
import config from '../config';
import Logo from '../components/Logo';
import Watermark from '../components/Watermark';
import PageAnimation from '../components/PageAnimation';

export default function LoginScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  
  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  useEffect(() => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
        const fullUrl = window.location.href || '';
        const searchString = window.location.search || '';
        const hashString = window.location.hash || '';
        
        let refParam = null;
        if (searchString) {
          const params = new URLSearchParams(searchString);
          refParam = params.get('ref') || params.get('referral');
        }
        if (!refParam && hashString && hashString.includes('?')) {
          const queryPart = hashString.substring(hashString.indexOf('?') + 1);
          const params = new URLSearchParams(queryPart);
          refParam = params.get('ref') || params.get('referral');
        }
        if (!refParam && fullUrl.includes('ref=')) {
          const match = fullUrl.match(/[?&](?:ref|referral)=([^&]+)/i);
          if (match && match[1]) {
            refParam = decodeURIComponent(match[1]);
          }
        }

        if (refParam) {
          const cleanRef = refParam.trim().toUpperCase();
          console.log('[LoginScreen] Parsed referral code from URL:', cleanRef);
          setReferralCode(cleanRef);
          setActiveTab('signup');
        }
      }
    } catch (e) {
      console.error('Error parsing referral query params:', e);
    }
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    const result = await AuthService.login(email, password);
    setLoading(false);
    
    if (result.success) {
      // Navigate based on user role
      const userRole = result.user.role || 'attendee';
      if (userRole === 'admin') {
        navigation.replace('Admin');
      } else if (userRole === 'host') {
        navigation.replace('AdminDashboard');
      } else {
        navigation.replace('Main');
      }
    } else if (result.requiresVerification) {
      // User needs to verify email first
      showAlert(
        'Email Verification Required',
        'Please verify your email address before logging in. Check your inbox for the verification link. You can resend the verification email from the login screen.'
      );
    } else {
      showAlert('Login Failed', result.message || 'Invalid credentials');
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !fullName || !phone) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    const result = await AuthService.register(fullName, email, password, phone, null, referralCode);
    setLoading(false);
    if (result.success) {
      showAlert(
        'Account Created!',
        result.message || 'A verification email has been sent to your inbox. Please verify your email before logging in.'
      );
      setActiveTab('login');
      setEmail('');
      setFullName('');
      setPhone('');
      setPassword('');
      setReferralCode('');
    } else {
      showAlert('Signup Failed', result.message || 'Could not create account');
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      showAlert('Error', 'Please enter your email address');
      return;
    }
    setLoading(true);
    const result = await AuthService.forgotPassword(forgotEmail);
    setLoading(false);
    showAlert(
      result.success ? 'Reset Link Sent' : 'Error',
      result.message || 'If an account exists with that email, a password reset link has been sent.'
    );
    if (result.success) {
      setShowForgotPassword(false);
      setForgotEmail('');
    }
  };

  if (showForgotPassword) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backBtn} onPress={() => setShowForgotPassword(false)}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.gold} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Logo size="large" />
            <Text style={styles.tagline}>Reset Your Password</Text>
          </View>

          <View style={styles.form}>
            <AuthInput 
              label="Email Address" 
              placeholder="email@example.com" 
              icon="mail-outline" 
              value={forgotEmail}
              onChangeText={setForgotEmail}
            />
            
            <TouchableOpacity style={styles.mainBtn} onPress={handleForgotPassword} disabled={loading}>
              {loading ? <ActivityIndicator color={theme.colors.dark} /> : <Text style={styles.mainBtnText}>Send Reset Link</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.switchBtn} onPress={() => setShowForgotPassword(false)}>
              <Text style={styles.switchText}>Back to <Text style={styles.goldText}>Login</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <PageAnimation>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.gold} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Logo size="large" showTagline={true} />
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'login' && styles.activeTab]}
              onPress={() => setActiveTab('login')}
            >
              <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'signup' && styles.activeTab]}
              onPress={() => setActiveTab('signup')}
            >
              <Text style={[styles.tabText, activeTab === 'signup' && styles.activeTabText]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'login' ? (
            <View style={styles.form}>
              <AuthInput 
                label="Email Address" 
                placeholder="email@example.com" 
                icon="mail-outline" 
                value={email}
                onChangeText={setEmail}
              />
              <AuthInput 
                label="Password" 
                placeholder="••••••••" 
                icon="lock-closed-outline" 
                secure 
                value={password}
                onChangeText={setPassword}
              />
              
              <TouchableOpacity style={styles.forgotBtn} onPress={() => setShowForgotPassword(true)}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.mainBtn} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color={theme.colors.dark} /> : <Text style={styles.mainBtnText}>Login</Text>}
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.switchBtn} onPress={() => setActiveTab('signup')}>
                <Text style={styles.switchText}>Don't have an account? <Text style={styles.goldText}>Sign Up</Text></Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <AuthInput 
                label="Full Name" 
                placeholder="Brima Abraham" 
                icon="person-outline" 
                value={fullName}
                onChangeText={setFullName}
              />
              <AuthInput 
                label="Email Address" 
                placeholder="email@example.com" 
                icon="mail-outline" 
                value={email}
                onChangeText={setEmail}
              />
              <AuthInput 
                label="Phone Number" 
                placeholder="+231 770 000 000" 
                icon="call-outline" 
                value={phone}
                onChangeText={setPhone}
              />
              <AuthInput 
                label="Password" 
                placeholder="•••••••• (min 6 characters)" 
                icon="lock-closed-outline" 
                secure 
                value={password}
                onChangeText={setPassword}
              />
              <AuthInput
                label="Referral Code (Auto-filled from Invite Link or Optional)"
                placeholder="Enter an invite code"
                icon="people-outline"
                value={referralCode}
                onChangeText={setReferralCode}
              />
              <Text style={styles.registrationNote}>
                Create an attendee account to discover events. You can request host access from your profile; host access is reviewed before events can be published.
              </Text>

              <TouchableOpacity style={styles.mainBtn} onPress={handleSignup} disabled={loading}>
                {loading ? <ActivityIndicator color={theme.colors.dark} /> : <Text style={styles.mainBtnText}>Create Account</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.switchBtn} onPress={() => setActiveTab('login')}>
                <Text style={styles.switchText}>Already have an account? <Text style={styles.goldText}>Login</Text></Text>
              </TouchableOpacity>
            </View>
          )}
          <Watermark />
        </ScrollView>
      </KeyboardAvoidingView>
    </PageAnimation>
  );
}

// Web-compatible alert function
const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const AuthInput = ({ label, placeholder, icon, secure, value, onChangeText }) => {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, isFocused && styles.inputFocused]}>
        <Ionicons name={icon} size={18} color={theme.colors.gold} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="grey"
          secureTextEntry={secure}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.dark },
  scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 100 },
  backBtn: { marginBottom: 20 },
  header: { alignItems: 'center', marginBottom: 40 },
  logoText: { fontFamily: theme.fonts.heading, fontSize: 32, color: '#FFFFFF', fontWeight: 'bold' },
  tagline: { color: theme.colors.gold, fontSize: 12, marginTop: 5 },
  tabContainer: { flexDirection: 'row', backgroundColor: theme.colors.nearBlack, borderRadius: 12, padding: 6, marginBottom: 30 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: theme.colors.gold },
  tabText: { color: 'grey', fontWeight: 'bold' },
  activeTabText: { color: theme.colors.dark },
  form: { marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  label: { color: '#FFFFFF', fontSize: 12, marginBottom: 8, opacity: 0.8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.nearBlack, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, paddingHorizontal: 12, height: 50 },
  inputFocused: { borderColor: theme.colors.gold },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#FFFFFF' },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 15 },
  forgotText: { color: theme.colors.gold, fontSize: 13 },
  registrationNote: { color: theme.colors.lightGrey, fontSize: 12, lineHeight: 18, marginTop: -4, marginBottom: 16 },
  mainBtn: { backgroundColor: theme.colors.gold, height: 55, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  mainBtnText: { color: theme.colors.dark, fontSize: 16, fontWeight: 'bold' },
  switchBtn: { marginTop: 20, alignItems: 'center' },
  switchText: { color: 'grey', fontSize: 14 },
  goldText: { color: theme.colors.gold, fontWeight: 'bold' }
});
