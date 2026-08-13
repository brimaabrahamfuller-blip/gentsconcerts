import React from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { HeaderLogo } from '../components/Logo';
import Watermark from '../components/Watermark';
import PageAnimation from '../components/PageAnimation';

const { width } = Dimensions.get('window');

export default function PrivacyPolicyScreen({ navigation }) {
  return (
    <PageAnimation>
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
            Last Updated: 13 August 2026
          </Text>
          <Text style={styles.introText}>
            At GentsConcerts, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our platform (website and mobile application).
          </Text>
          <Text style={styles.introText}>
            GentsConcerts is a Liberia-focused concert and events platform currently operating in a controlled beta. We aim to explain our current data practices plainly and will update this notice before introducing paid checkout.
          </Text>
        </View>

        <Section title="1. Information We Collect" content={[
          "We collect information that you provide directly to us when you register for an account or use our services.",
          "Account Information: full name, email address, phone number, password hash, account role, profile photo when you choose to upload one, and account settings.",
          "Referral and Ticket Information: your referral code, referral relationship, ticket claim details, purchaser name and phone number, QR-code status, and event attendance/check-in status.",
          "Event and Host Information: if you apply to host or manage an event, we collect your host application status, event details, ticket tiers, promotional flyer or video, and review history.",
          "Notification and Technical Information: an Expo push-notification token if you permit notifications, device/app information supplied by the platform, security logs, and limited request metadata required to operate and protect the service.",
          "Paid checkout is not currently enabled. We do not collect an MTN MoMo PIN or account balance through the beta platform."
        ]} />

        <Section title="2. How We Use Your Information" content={[
          "To create and manage your account.",
          "To operate free and referral-based ticket claims, issue QR tickets, and verify entry at venues.",
          "To review host applications and event publication submissions, enable approved organizers to manage their events, and protect attendees from fraudulent or incomplete listings.",
          "To send you notifications about upcoming events, ticket confirmations, and platform updates.",
          "To provide customer support and respond to your inquiries.",
          "To improve our platform, features, and user experience.",
          "To comply with applicable laws and regulations."
        ]} />

        <Section title="3. Information We Share" content={[
          "We do not sell, rent, or trade your personal information to third parties.",
          "Approved Event Organizers and Venue Staff: for their own event, they may receive the minimum ticket-holder and ticket-verification information required to verify entry, investigate a ticket issue, and run the event.",
          "Service Providers: we use service providers that support hosting, database storage, email, push notifications, and media delivery. If paid checkout is later activated, an approved payment provider will receive the information needed to process that payment; the updated checkout notice will identify the payment flow.",
          "Legal Requirements: We may disclose your information if required by law, regulation, or legal process.",
          "Business Transfers: In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction."
        ]} />

        <Section title="4. Data Security" content={[
          "We implement appropriate technical and organizational measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.",
          "Passwords are stored as one-way hashes using bcrypt; GentsConcerts does not store your original password in readable form.",
          "Paid checkout is disabled during the beta. Before it is enabled, GentsConcerts will implement and document the applicable payment-security and data-handling controls.",
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
          "Ticket claims, check-in records, host-review decisions, and security logs may be retained for fraud prevention, support, audit, and compliance purposes.",
          "You may request account deletion or a copy/correction of your account information by contacting us. We will assess each request and may retain limited records where needed for security, dispute resolution, legal compliance, or legitimate operational records.",
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

        <Watermark />
      </ScrollView>
    </View>
    </PageAnimation>
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
