import React from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { HeaderLogo } from '../components/Logo';

const { width } = Dimensions.get('window');

export default function PrivacyPolicyScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <HeaderLogo navigation={navigation} />
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={theme.colors.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.introBox}>
          <Text style={styles.introText}>
            Last Updated: 2026
          </Text>
          <Text style={styles.introText}>
            At GentsConcerts, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our platform (website and mobile application).
          </Text>
          <Text style={styles.introText}>
            GentsConcerts is Liberia's first online concert and events platform. We believe in transparency and building trust with our community.
          </Text>
        </View>

        <Section title="1. Information We Collect" content={[
          "We collect information that you provide directly to us when you register for an account or use our services.",
          "Account Information: Full name, email address, phone number, and password (encrypted).",
          "Payment Information: MTN Mobile Money phone number used for transactions. We do not store your mobile money PIN or account balance information.",
          "Event Information: If you are an event organizer, we collect event details including title, description, date, time, venue, ticket pricing, and promotional images.",
          "Usage Data: We may collect information about how you interact with the platform, including pages visited, events viewed, and features used.",
          "Device Information: We may collect device type, operating system, and IP address for security and analytics purposes."
        ]} />

        <Section title="2. How We Use Your Information" content={[
          "To create and manage your account.",
          "To process ticket purchases and payments via MTN Mobile Money.",
          "To issue digital tickets with QR codes for event verification at venue doors.",
          "To enable event organizers to list, manage, and track their events.",
          "To send you notifications about upcoming events, ticket confirmations, and platform updates.",
          "To provide customer support and respond to your inquiries.",
          "To improve our platform, features, and user experience.",
          "To comply with applicable laws and regulations."
        ]} />

        <Section title="3. Information We Share" content={[
          "We do not sell, rent, or trade your personal information to third parties.",
          "Event Organizers: When you purchase a ticket, the event organizer may receive your name and ticket details for verification purposes at the venue.",
          "Service Providers: We may share information with trusted third-party service providers (such as MTN Mobile Money for payment processing) who assist us in operating the platform.",
          "Legal Requirements: We may disclose your information if required by law, regulation, or legal process.",
          "Business Transfers: In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction."
        ]} />

        <Section title="4. Data Security" content={[
          "We implement appropriate technical and organizational measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.",
          "Passwords are encrypted using industry-standard hashing algorithms (bcrypt).",
          "All payment transactions are processed through secure MTN Mobile Money channels.",
          "We regularly review and update our security practices to protect your data.",
          "However, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security."
        ]} />

        <Section title="5. Cookies and Tracking" content={[
          "We may use cookies, local storage, and similar technologies to remember your preferences and improve your experience on the platform.",
          "You can control cookie settings through your browser or device settings.",
          "We do not use cookies for advertising or tracking purposes without your consent."
        ]} />

        <Section title="6. Data Retention" content={[
          "We retain your personal information for as long as your account is active or as needed to provide you services.",
          "Transaction records (ticket purchases, payments) are retained for audit and compliance purposes.",
          "You may request deletion of your account and associated data at any time by contacting us.",
          "Some information may be retained in anonymized form for analytics and platform improvement."
        ]} />

        <Section title="7. Your Rights" content={[
          "Access: You have the right to access the personal information we hold about you.",
          "Correction: You can update or correct your information through your account settings.",
          "Deletion: You may request deletion of your account and personal data.",
          "Opt-Out: You can opt out of marketing communications at any time.",
          "Portability: You may request a copy of your data in a portable format."
        ]} />

        <Section title="8. Children's Privacy" content={[
          "GentsConcerts is not intended for children under the age of 18.",
          "We do not knowingly collect personal information from children.",
          "If we become aware that we have collected information from a child under 18, we will take steps to delete that information."
        ]} />

        <Section title="9. Third-Party Links" content={[
          "Our platform may contain links to third-party websites or services (such as social media pages).",
          "We are not responsible for the privacy practices of third-party sites.",
          "We encourage you to review the privacy policies of any third-party sites before providing personal information."
        ]} />

        <Section title="10. Changes to This Policy" content={[
          "We may update this Privacy Policy from time to time to reflect changes in our practices or for legal reasons.",
          "We will notify you of significant changes through the platform or via email.",
          "Your continued use of the platform after changes constitutes acceptance of the updated policy."
        ]} />

        <Section title="11. Contact Us" content={[
          "If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:",
          "Email: gentsconcerts@gmail.com",
          "WhatsApp: 0791 389 824",
          "Facebook: GentsConcerts",
          "Website: gentsconcerts.netlify.app"
        ]} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            #GentsConcerts #Liberia #Monrovia
          </Text>
          <Text style={styles.footerSubtext}>
            Your privacy matters. We are building a platform you can trust.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const Section = ({ title, content }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {content.map((paragraph, index) => (
      <Text key={index} style={styles.sectionContent}>{paragraph}</Text>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.dark },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 15,
    backgroundColor: theme.colors.nearBlack,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,168,76,0.2)',
  },
  backBtn: { padding: 5 },
  headerTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  scrollContent: { padding: 20, paddingBottom: 60 },
  introBox: {
    backgroundColor: theme.colors.nearBlack,
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
  },
  introText: {
    color: theme.colors.warmWhite,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 10,
  },
  section: { marginBottom: 25 },
  sectionTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 16,
    color: theme.colors.gold,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionContent: {
    color: theme.colors.warmWhite,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 30,
    borderTopWidth: 1,
    borderTopColor: 'rgba(201,168,76,0.1)',
    marginTop: 10,
  },
  footerText: {
    color: theme.colors.gold,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  footerSubtext: {
    color: 'grey',
    fontSize: 11,
    textAlign: 'center',
  },
});
