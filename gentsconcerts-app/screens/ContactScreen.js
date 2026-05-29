import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  TextInput, Linking, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

export default function ContactScreen({ navigation }) {
  const [isFocused, setIsFocused] = useState({});

  const handleFocus = (field) => setIsFocused({...isFocused, [field]: true});
  const handleBlur = (field) => setIsFocused({...isFocused, [field]: false});

  const contactItems = [
    { icon: 'mail', label: 'Email', value: 'gentsconcerts@gmail.com', link: 'mailto:gentsconcerts@gmail.com' },
    { icon: 'logo-whatsapp', label: 'WhatsApp', value: 'Chat with us', link: 'https://wa.me/qr/EBDDVRZRJVWNK1' },
    { icon: 'logo-facebook', label: 'Facebook', value: '/gentsconcerts', link: 'https://www.facebook.com/gentsconcerts' },
    { icon: 'location', label: 'Location', value: 'Monrovia, Liberia', link: null },
  ];

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.gold} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Contact Us</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>We're here to help. Reach out to us through any of these channels.</Text>

          {/* Contact Items */}
          <View style={styles.contactGrid}>
            {contactItems.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.contactCard}
                onPress={() => item.link && Linking.openURL(item.link)}
                disabled={!item.link}
              >
                <Ionicons name={item.icon} size={24} color={theme.colors.gold} />
                <Text style={styles.contactLabel}>{item.label}</Text>
                <Text style={styles.contactValue} numberOfLines={1}>{item.value}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Contact Form */}
          <View style={styles.formSection}>
            <Text style={styles.formTitle}>Send us a Message</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[styles.input, isFocused.name && styles.inputFocused]}
                placeholder="Your Name"
                placeholderTextColor="grey"
                onFocus={() => handleFocus('name')}
                onBlur={() => handleBlur('name')}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, isFocused.email && styles.inputFocused]}
                placeholder="email@example.com"
                placeholderTextColor="grey"
                keyboardType="email-address"
                onFocus={() => handleFocus('email')}
                onBlur={() => handleBlur('email')}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Subject</Text>
              <TextInput
                style={[styles.input, isFocused.subject && styles.inputFocused]}
                placeholder="What is this about?"
                placeholderTextColor="grey"
                onFocus={() => handleFocus('subject')}
                onBlur={() => handleBlur('subject')}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea, isFocused.message && styles.inputFocused]}
                placeholder="Your message here..."
                placeholderTextColor="grey"
                multiline
                numberOfLines={5}
                onFocus={() => handleFocus('message')}
                onBlur={() => handleBlur('message')}
              />
            </View>

            <TouchableOpacity style={styles.sendBtn}>
              <Text style={styles.sendBtnText}>Send Message</Text>
              <Ionicons name="send" size={18} color={theme.colors.dark} style={{marginLeft: 10}} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtn: {
    marginRight: 15,
  },
  pageTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  subtitle: {
    color: theme.colors.lightGrey,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 30,
  },
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  contactCard: {
    width: '48%',
    backgroundColor: theme.colors.nearBlack,
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.1)',
  },
  contactLabel: {
    color: theme.colors.gold,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 10,
    textTransform: 'uppercase',
  },
  contactValue: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 5,
  },
  formSection: {
    marginBottom: 40,
  },
  formTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: theme.colors.gold,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
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
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  sendBtn: {
    backgroundColor: theme.colors.gold,
    height: 55,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  sendBtnText: {
    color: theme.colors.dark,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
