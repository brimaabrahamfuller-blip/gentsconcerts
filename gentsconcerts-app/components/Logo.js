import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { theme } from '../styles/theme';

const logoSvgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <circle cx="256" cy="230" r="190" fill="#8B0000"/>
  <circle cx="256" cy="230" r="180" fill="#001F5B"/>
  <circle cx="256" cy="230" r="165" fill="none" stroke="#FFFFFF" stroke-width="4"/>
  <circle cx="256" cy="230" r="160" fill="none" stroke="#FFFFFF" stroke-width="2"/>
  <circle cx="256" cy="230" r="155" fill="#001F5B"/>
  <circle cx="256" cy="230" r="145" fill="#BF0A30"/>
  <circle cx="256" cy="230" r="130" fill="#FFFFFF"/>
  <circle cx="256" cy="230" r="120" fill="#001F5B"/>
  <path id="topArc" d="M 100,230 A 156,156 0 0,1 412,230" fill="none"/>
  <text font-family="Impact, Arial Black, sans-serif" font-size="32" font-weight="bold" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">
    <textPath href="#topArc" startOffset="50%">GentsConcerts</textPath>
  </text>
  <polygon points="115,250 118,260 128,260 120,266 123,276 115,270 107,276 110,266 102,260 112,260" fill="#FFFFFF"/>
  <polygon points="397,250 400,260 410,260 402,266 405,276 397,270 389,276 392,266 384,260 394,260" fill="#FFFFFF"/>
  <g transform="translate(256, 240)">
    <rect x="-8" y="10" width="16" height="55" rx="3" fill="#FFFFFF"/>
    <ellipse cx="0" cy="-10" rx="22" ry="28" fill="#FFFFFF"/>
    <ellipse cx="0" cy="-10" rx="18" ry="24" fill="#001F5B"/>
    <circle cx="-8" cy="-18" r="2" fill="#FFFFFF"/>
    <circle cx="-2" cy="-22" r="2" fill="#FFFFFF"/>
    <circle cx="4" cy="-20" r="2" fill="#FFFFFF"/>
    <circle cx="8" cy="-14" r="2" fill="#FFFFFF"/>
    <circle cx="-6" cy="-12" r="2" fill="#FFFFFF"/>
    <circle cx="2" cy="-10" r="2" fill="#FFFFFF"/>
    <circle cx="10" cy="-8" r="2" fill="#FFFFFF"/>
    <circle cx="-4" cy="-6" r="2" fill="#FFFFFF"/>
    <circle cx="6" cy="-4" r="2" fill="#FFFFFF"/>
    <circle cx="0" cy="-2" r="2" fill="#FFFFFF"/>
    <circle cx="-8" cy="-2" r="2" fill="#FFFFFF"/>
    <circle cx="12" cy="-2" r="2" fill="#FFFFFF"/>
    <path d="M -35,30 Q -35,-5 -20,-10 L -20,-25" fill="none" stroke="#FFFFFF" stroke-width="3"/>
    <ellipse cx="-20" cy="-28" rx="8" ry="6" fill="#FFFFFF" transform="rotate(-20, -20, -28)"/>
    <ellipse cx="-35" cy="32" rx="8" ry="6" fill="#FFFFFF"/>
    <path d="M 30,25 Q 30,-5 18,-10 L 18,-30" fill="none" stroke="#FFFFFF" stroke-width="3"/>
    <ellipse cx="18" cy="-33" rx="8" ry="6" fill="#FFFFFF" transform="rotate(15, 18, -33)"/>
    <ellipse cx="30" cy="27" rx="8" ry="6" fill="#FFFFFF"/>
  </g>
  <path d="M 80,370 L 120,370 L 120,355 L 200,355 L 200,370 L 312,370 L 312,355 L 392,355 L 392,370 L 432,370 L 432,395 L 412,395 L 412,420 L 392,420 L 392,400 L 312,400 L 312,420 L 200,420 L 200,400 L 120,400 L 120,420 L 100,420 L 100,395 L 80,395 Z" fill="#001F5B"/>
  <text x="256" y="392" font-family="Impact, Arial Black, sans-serif" font-size="28" font-weight="bold" fill="#FFFFFF" text-anchor="middle">GentsConcerts</text>
  <line x1="200" y1="430" x2="220" y2="430" stroke="#FFFFFF" stroke-width="3"/>
  <line x1="246" y1="430" x2="266" y2="430" stroke="#FFFFFF" stroke-width="3"/>
  <line x1="292" y1="430" x2="312" y2="430" stroke="#FFFFFF" stroke-width="3"/>
  <text x="256" y="450" font-family="Arial, Helvetica, sans-serif" font-size="14" fill="#FFFFFF" text-anchor="middle">Liberia's Premier Event Platform</text>
</svg>
`;

/**
 * GentsConcerts Logo Component
 * Renders the brand logo as an SVG using SvgXml for better cross-platform support.
 */
export default function Logo({ size = 'medium', showTagline = false }) {
  const logoSize = size === 'large' ? 120 : size === 'small' ? 40 : 80;
  const taglineSize = size === 'large' ? 14 : size === 'small' ? 10 : 11;

  return (
    <View style={[styles.container, size === 'large' && styles.containerLarge]}>
      <SvgXml xml={logoSvgContent} width={logoSize} height={logoSize} />
      {showTagline && (
        <Text style={[styles.tagline, { fontSize: taglineSize }]}>
          Liberia's Premier Event Platform
        </Text>
      )}
    </View>
  );
}

/**
 * Header Logo - used in the header bar of screens
 */
export function HeaderLogo({ onPress, navigation }) {
  return (
    <TouchableOpacity 
      style={styles.headerLogoContainer}
      onPress={onPress || (navigation ? () => navigation.navigate('Home') : undefined)}
    >
      <SvgXml xml={logoSvgContent} width={40} height={40} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 4 },
  containerLarge: { paddingVertical: 10 },
  tagline: {
    color: theme.colors.gold,
    marginTop: 2,
    letterSpacing: 0.5,
    fontWeight: 'bold',
  },
  headerLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
