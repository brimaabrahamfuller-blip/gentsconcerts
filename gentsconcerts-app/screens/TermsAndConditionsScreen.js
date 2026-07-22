import React from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { HeaderLogo } from '../components/Logo';

const { width } = Dimensions.get('window');

export default function TermsAndConditionsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <HeaderLogo navigation={navigation} />
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
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
            Welcome to GentsConcerts — Liberia's first online concert and events platform. By using our website and mobile application, you agree to be bound by these Terms and Conditions. Please read them carefully before using our services.
          </Text>
        </View>

        <Section title="1. About GentsConcerts" content={[
          "GentsConcerts is Liberia's first online concert and events platform, built right here in Monrovia. We are not just a page — we are building real technology that will change the way Liberia experiences live entertainment forever.",
          "Our platform enables users to discover every upcoming concert, show, festival, and cultural event happening across Liberia. We provide a secure, transparent, and convenient way to purchase digital tickets online using MTN Mobile Money."
        ]} />

        <Section title="2. Definitions" content={[
          "\"Platform\" refers to the GentsConcerts website (gentsconcerts.netlify.app) and mobile application.",
          "\"User\" refers to any individual who registers for or uses the GentsConcerts platform, including attendees and event hosts.",
          "\"Event Host\" or \"Organizer\" refers to any individual or entity that lists and manages events on the GentsConcerts platform.",
          "\"Attendee\" refers to any user who purchases tickets to attend events listed on the platform.",
          "\"Digital Ticket\" refers to the electronic ticket with QR code issued upon successful payment.",
          "\"MTN Mobile Money\" refers to the payment service used for ticket purchases and payouts on the platform."
        ]} />

        <Section title="3. Account Registration" content={[
          "To use GentsConcerts, you must create an account by providing accurate and complete information, including your full name, email address, and phone number.",
          "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.",
          "You must be at least 18 years old to create an account and use our services.",
          "GentsConcerts reserves the right to suspend or terminate accounts that violate these Terms."
        ]} />

        <Section title="4. For Attendees (Ticket Buyers)" content={[
          "If you love events, you can come to GentsConcerts to discover every upcoming concert, show, festival, and cultural event happening across Liberia.",
          "You can buy your ticket online using MTN Mobile Money and receive a digital ticket with a QR code straight to your phone. No more running around. No more sending money to unknown numbers on WhatsApp and hoping for the best.",
          "All ticket sales are final. Refunds are at the sole discretion of the event organizer and GentsConcerts.",
          "Tickets are non-transferable unless otherwise stated by the event organizer.",
          "You are responsible for presenting your digital ticket (QR code) at the venue door for verification."
        ]} />

        <Section title="5. For Event Organizers and Artists" content={[
          "If you are an event organizer or an artist, you can list your event on our platform in minutes, upload your flyer, set your ticket prices including Regular, VIP, and VVIP tiers, and start selling to thousands of people immediately.",
          "You can track your sales in real time through your host dashboard.",
          "You will receive your money via MTN Mobile Money after your event concludes.",
          "Event hosts must provide accurate event information including date, time, venue, capacity, and ticket pricing.",
          "GentsConcerts reserves the right to remove or cancel events that violate these Terms or applicable laws."
        ]} />

        <Section title="6. Commission-Free Period" content={[
          "For the first two months after our launch, every event host can list and sell tickets completely free. Zero commission. Zero fees.",
          "After the commission-free period, a standard service fee may apply. Users will be notified of any changes in advance.",
          "Liberia deserves a real platform. We are building it."
        ]} />

        <Section title="7. Payments and Refunds" content={[
          "All payments are processed securely through MTN Mobile Money.",
          "Ticket prices are displayed in USD with approximate LRD conversion.",
          "GentsConcerts does not guarantee the success, cancellation, or rescheduling of any event listed on the platform.",
          "Refund requests must be directed to the event organizer. GentsConcerts acts as a facilitator and is not liable for event cancellations by organizers."
        ]} />

        <Section title="8. User Conduct" content={[
          "Users must not use the platform for any unlawful or fraudulent purpose.",
          "Users must not attempt to manipulate ticket prices, sales data, or platform functionality.",
          "Users must not harass, defame, or threaten other users or event organizers.",
          "GentsConcerts reserves the right to remove content or accounts that violate these Terms."
        ]} />

        <Section title="9. Intellectual Property" content={[
          "All content, branding, logos, and design elements on GentsConcerts are the intellectual property of GentsConcerts and its owners.",
          "Event hosts retain ownership of their event content (flyers, descriptions, images) but grant GentsConcerts a license to display such content on the platform.",
          "Unauthorized use of GentsConcerts branding or content is prohibited."
        ]} />

        <Section title="10. Limitation of Liability" content={[
          "GentsConcerts provides the platform as a facilitator for event discovery and ticketing. We are not responsible for the quality, safety, or conduct of events listed on the platform.",
          "To the maximum extent permitted by law, GentsConcerts shall not be liable for any indirect, incidental, or consequential damages arising from the use of the platform.",
          "Our total liability shall not exceed the amount paid by the user for tickets purchased through the platform."
        ]} />

        <Section title="11. Privacy" content={[
          "Your privacy is important to us. Please refer to our Privacy Policy for detailed information about how we collect, use, and protect your personal data."
        ]} />

        <Section title="12. Modifications" content={[
          "GentsConcerts reserves the right to modify these Terms and Conditions at any time.",
          "Continued use of the platform after modifications constitutes acceptance of the updated Terms.",
          "Users will be notified of significant changes through the platform or via email."
        ]} />

        <Section title="13. Governing Law" content={[
          "These Terms and Conditions are governed by the laws of the Republic of Liberia.",
          "Any disputes arising from these Terms shall be resolved through the courts of Liberia."
        ]} />

        <Section title="14. Contact Us" content={[
          "Website: gentsconcerts.netlify.app",
          "Facebook: GentsConcerts",
          "WhatsApp: 0791 389 824",
          "Email: gentsconcerts@gmail.com"
        ]} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            #GentsConcerts #Liberia #Monrovia
          </Text>
          <Text style={styles.footerSubtext}>
            Building real technology for Liberia's entertainment industry.
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
