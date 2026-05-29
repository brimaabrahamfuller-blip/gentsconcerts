import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TextInput, 
  TouchableOpacity, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

export default function HostEventScreen() {
  const [calcPrice, setCalcPrice] = useState('');
  const [calcQty, setCalcQty] = useState('');
  
  const price = parseFloat(calcPrice) || 0;
  const qty = parseInt(calcQty) || 0;
  const gross = price * qty;
  const commission = gross * 0.15; // 15% commission
  const net = gross - commission;
  const netLrd = net * 150;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.comingSoonBanner}>
          <Ionicons name="megaphone" size={20} color={theme.colors.dark} />
          <Text style={styles.comingSoonText}>HOST PORTAL COMING SOON</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.pageTitle}>Host Your Event</Text>
          <Text style={styles.subtitle}>Fill out the details to list your concert on GentsConcerts.</Text>

          {/* Form Fields */}
          <View style={styles.form}>
            <CustomInput label="Event Name" placeholder="e.g. Hipco Stars Night" />
            <View style={styles.row}>
              <View style={{flex: 1, marginRight: 10}}>
                <CustomInput label="Date" placeholder="YYYY-MM-DD" />
              </View>
              <View style={{flex: 1}}>
                <CustomInput label="Time" placeholder="HH:MM AM/PM" />
              </View>
            </View>
            <CustomInput label="Venue" placeholder="e.g. SKD Stadium" />
            <CustomInput label="City" placeholder="Monrovia" />
            <CustomInput label="Description" placeholder="Tell us about your event..." multiline />
            
            <TouchableOpacity style={styles.uploadBtn}>
              <Ionicons name="cloud-upload-outline" size={24} color={theme.colors.gold} />
              <Text style={styles.uploadText}>Upload Event Flyer</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn}>
              <Text style={styles.submitBtnText}>Submit Event for Review</Text>
            </TouchableOpacity>
          </View>

          {/* Commission Calculator */}
          <View style={styles.calculatorCard}>
            <Text style={styles.calcTitle}>Revenue Calculator</Text>
            <Text style={styles.calcSubtitle}>Estimate your earnings (15% platform fee)</Text>
            
            <View style={styles.calcInputRow}>
              <View style={{flex: 1, marginRight: 10}}>
                <Text style={styles.calcLabel}>Avg. Price ($)</Text>
                <TextInput 
                  style={styles.calcInput}
                  keyboardType="numeric"
                  value={calcPrice}
                  onChangeText={setCalcPrice}
                  placeholder="0"
                  placeholderTextColor="grey"
                />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.calcLabel}>Estimated Qty</Text>
                <TextInput 
                  style={styles.calcInput}
                  keyboardType="numeric"
                  value={calcQty}
                  onChangeText={setCalcQty}
                  placeholder="0"
                  placeholderTextColor="grey"
                />
              </View>
            </View>

            <View style={styles.calcResults}>
              <ResultRow label="Gross Revenue" value={`$${gross.toFixed(2)}`} />
              <ResultRow label="GentsConcerts Fee (15%)" value={`-$${commission.toFixed(2)}`} color={theme.colors.accentRed} />
              <View style={styles.netRow}>
                <Text style={styles.netLabel}>Estimated Net Payout</Text>
                <View style={{alignItems: 'flex-end'}}>
                  <Text style={styles.netValueUsd}>${net.toFixed(2)} USD</Text>
                  <Text style={styles.netValueLrd}>{netLrd.toLocaleString()} LRD</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const CustomInput = ({ label, placeholder, multiline }) => {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input, 
          multiline && { height: 100, textAlignVertical: 'top' },
          isFocused && styles.inputFocused
        ]}
        placeholder={placeholder}
        placeholderTextColor="grey"
        multiline={multiline}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
};

const ResultRow = ({ label, value, color }) => (
  <View style={styles.resultRow}>
    <Text style={styles.resultLabel}>{label}</Text>
    <Text style={[styles.resultValue, color && { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark,
  },
  comingSoonBanner: {
    backgroundColor: theme.colors.gold,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 50,
  },
  comingSoonText: {
    color: theme.colors.dark,
    fontWeight: '900',
    fontSize: 12,
    marginLeft: 10,
    letterSpacing: 1,
  },
  content: {
    padding: theme.spacing.md,
  },
  pageTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 24,
    color: '#FFFFFF',
    marginTop: 10,
  },
  subtitle: {
    color: theme.colors.lightGrey,
    fontSize: 14,
    marginBottom: 20,
  },
  form: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    color: theme.colors.gold,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: theme.colors.nearBlack,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontFamily: theme.fonts.body,
  },
  inputFocused: {
    borderColor: theme.colors.gold,
  },
  row: {
    flexDirection: 'row',
  },
  uploadBtn: {
    borderWidth: 1,
    borderColor: theme.colors.gold,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadText: {
    color: theme.colors.gold,
    marginTop: 5,
    fontSize: 12,
  },
  submitBtn: {
    backgroundColor: theme.colors.gold,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnText: {
    color: theme.colors.dark,
    fontWeight: 'bold',
    fontSize: 16,
  },
  calculatorCard: {
    backgroundColor: theme.colors.midBlue,
    borderRadius: 12,
    padding: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: theme.colors.gold,
  },
  calcTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 18,
    color: theme.colors.gold,
    marginBottom: 5,
  },
  calcSubtitle: {
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 20,
    opacity: 0.8,
  },
  calcInputRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  calcLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    marginBottom: 5,
  },
  calcInput: {
    backgroundColor: theme.colors.dark,
    borderWidth: 1,
    borderColor: theme.colors.gold,
    borderRadius: 5,
    padding: 10,
    color: theme.colors.gold,
    fontWeight: 'bold',
  },
  calcResults: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 15,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    opacity: 0.7,
  },
  resultValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  netRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  netLabel: {
    color: theme.colors.gold,
    fontWeight: 'bold',
    fontSize: 14,
  },
  netValueUsd: {
    color: '#28a745',
    fontSize: 18,
    fontWeight: 'bold',
  },
  netValueLrd: {
    color: theme.colors.lightGrey,
    fontSize: 11,
  },
});
