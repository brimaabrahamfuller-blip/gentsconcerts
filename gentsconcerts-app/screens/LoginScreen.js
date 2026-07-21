import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { AuthService } from '../AuthService';

export default function LoginScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('attendee'); // Default role

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    const result = await AuthService.login(email, password);
    setLoading(false);
    if (result.success) {
      // Role-based navigation
      if (result.user.role === 'host' || result.user.role === 'admin') {
        navigation.replace('AdminDashboard');
      } else {
        navigation.replace('Main');
      }
    } else {
      Alert.alert('Login Failed', result.message || 'Invalid credentials');
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !fullName || !phone) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    const result = await AuthService.register(fullName, email, password, phone, role);
    setLoading(false);
    if (result.success) {
      Alert.alert('Success', 'Account created! Please login.', [
        { text: 'OK', onPress: () => setActiveTab('login') }
      ]);
    } else {
      Alert.alert('Signup Failed', result.message || 'Could not create account');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.gold} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.logoText}>GENTS<Text style={{color: theme.colors.gold}}>CONCERTS</Text></Text>
          <Text style={styles.tagline}>Your Gateway to Liberian Entertainment</Text>
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
            <TouchableOpacity style={styles.mainBtn} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color={theme.colors.dark} /> : <Text style={styles.mainBtnText}>Login</Text>}
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
              placeholder="••••••••" 
              icon="lock-closed-outline" 
              secure 
              value={password}
              onChangeText={setPassword}
            />
            
            <Text style={styles.label}>I want to:</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity 
                style={[styles.roleOption, role === 'attendee' && styles.roleActive]} 
                onPress={() => setRole('attendee')}
              >
                <Text style={[styles.roleText, role === 'attendee' && styles.roleTextActive]}>Attend Events</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.roleOption, role === 'host' && styles.roleActive]} 
                onPress={() => setRole('host')}
              >
                <Text style={[styles.roleText, role === 'host' && styles.roleTextActive]}>Host Events</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.mainBtn} onPress={handleSignup} disabled={loading}>
              {loading ? <ActivityIndicator color={theme.colors.dark} /> : <Text style={styles.mainBtnText}>Create Account</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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
  scrollContent: { padding: 24, paddingTop: 60 },
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
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  roleOption: { flex: 0.48, paddingVertical: 12, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  roleActive: { borderColor: theme.colors.gold, backgroundColor: 'rgba(212, 175, 55, 0.1)' },
  roleText: { color: 'grey', fontSize: 14 },
  roleTextActive: { color: theme.colors.gold, fontWeight: 'bold' },
  mainBtn: { backgroundColor: theme.colors.gold, height: 55, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  mainBtnText: { color: theme.colors.dark, fontSize: 16, fontWeight: 'bold' }
});
