import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

export default function LoginScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('login');

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
            <AuthInput label="Email Address" placeholder="email@example.com" icon="mail-outline" />
            <AuthInput label="Password" placeholder="••••••••" icon="lock-closed-outline" secure />
            
            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mainBtn}>
              <Text style={styles.mainBtnText}>Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <AuthInput label="Full Name" placeholder="Brima Abraham" icon="person-outline" />
            <AuthInput label="Email Address" placeholder="email@example.com" icon="mail-outline" />
            <AuthInput label="Phone Number" placeholder="+231..." icon="call-outline" />
            <AuthInput label="Password" placeholder="••••••••" icon="lock-closed-outline" secure />
            
            <TouchableOpacity style={styles.mainBtn}>
              <Text style={styles.mainBtnText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.socialBtn}>
            <Ionicons name="logo-google" size={20} color="#EA4335" />
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn}>
            <Ionicons name="logo-facebook" size={20} color="#1877F2" />
            <Text style={styles.socialText}>Facebook</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const AuthInput = ({ label, placeholder, icon, secure }) => {
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
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  backBtn: {
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontFamily: theme.fonts.heading,
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tagline: {
    color: theme.colors.gold,
    fontSize: 12,
    marginTop: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.nearBlack,
    borderRadius: 12,
    padding: 6,
    marginBottom: 30,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: theme.colors.gold,
  },
  tabText: {
    color: 'grey',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: theme.colors.dark,
  },
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 8,
    opacity: 0.8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.nearBlack,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
  },
  inputFocused: {
    borderColor: theme.colors.gold,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontFamily: theme.fonts.body,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  forgotText: {
    color: theme.colors.gold,
    fontSize: 12,
  },
  mainBtn: {
    backgroundColor: theme.colors.gold,
    height: 55,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainBtnText: {
    color: theme.colors.dark,
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: 'grey',
    fontSize: 10,
    marginHorizontal: 15,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialBtn: {
    flex: 0.48,
    flexDirection: 'row',
    backgroundColor: theme.colors.nearBlack,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontWeight: 'bold',
  },
});
