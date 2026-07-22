import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { AuthService } from '../AuthService';

export default function EmailVerificationScreen({ route, navigation }) {
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = route?.params?.token;
    if (token) {
      handleVerify(token);
    }
  }, [route?.params?.token]);

  const handleVerify = async (token) => {
    setLoading(true);
    const result = await AuthService.verifyEmail(token);
    setLoading(false);
    setVerified(result.success);
    setMessage(result.message);
    if (!result.success) {
      Alert.alert('Verification Failed', result.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.gold} />
        <Text style={styles.loadingText}>Verifying your email...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Login')}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.gold} />
      </TouchableOpacity>

      <View style={styles.content}>
        {verified ? (
          <>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            <Text style={styles.title}>Email Verified!</Text>
            <Text style={styles.message}>
              Your email has been successfully verified. You can now log in to GentsConcerts and enjoy Liberia's premier event platform.
            </Text>
            <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.btnText}>Go to Login</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Ionicons name="close-circle" size={80} color="#F44336" />
            <Text style={styles.title}>Verification Failed</Text>
            <Text style={styles.message}>{message || 'The verification link is invalid or has expired.'}</Text>
            <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.btnText}>Go to Login</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.dark, padding: 24, paddingTop: 60 },
  backBtn: { marginBottom: 40 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: theme.colors.gold, marginTop: 20, fontSize: 16 },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  message: { color: '#CCCCCC', fontSize: 16, textAlign: 'center', marginBottom: 30, lineHeight: 24 },
  btn: { backgroundColor: theme.colors.gold, height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  btnText: { color: theme.colors.dark, fontSize: 16, fontWeight: 'bold' }
});
