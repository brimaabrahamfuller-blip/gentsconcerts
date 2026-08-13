import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { theme } from '../styles/theme';

// Screens
import HomeScreen from '../screens/HomeScreen';
import EventsScreen from '../screens/EventsScreen';
import TicketsScreen from '../screens/TicketsScreen';
import FlyerScreen from '../screens/FlyerScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import LoginScreen from '../screens/LoginScreen';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import OwnerDashboardScreen from '../screens/OwnerDashboardScreen';
import AdminScreen from '../screens/AdminScreen';
import TermsAndConditionsScreen from '../screens/TermsAndConditionsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import SplashScreen from '../screens/SplashScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function FooterIcon({ routeName, focused, color, size }) {
  const strokeWidth = focused ? 2.55 : 2.15;
  const iconSize = Math.max(size || 29, 28);

  if (routeName === 'Home') {
    return (
      <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3 10.8 12 3l9 7.8v9.7H3v-9.7Zm5.5 9.7v-5.7h7v5.7"
          fill={focused ? color : 'none'}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  if (routeName === 'Events') {
    return (
      <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
        <Rect x="3.5" y="5" width="17" height="15.5" rx="2" stroke={color} strokeWidth={strokeWidth} />
        <Line x1="7" y1="3.5" x2="7" y2="7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <Line x1="17" y1="3.5" x2="17" y2="7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <Line x1="3.5" y1="9" x2="20.5" y2="9" stroke={color} strokeWidth={strokeWidth} />
        <Circle cx="8" cy="13" r="1" fill={color} />
        <Circle cx="12" cy="13" r="1" fill={color} />
        <Circle cx="16" cy="13" r="1" fill={color} />
        <Circle cx="8" cy="17" r="1" fill={color} />
        <Circle cx="12" cy="17" r="1" fill={color} />
      </Svg>
    );
  }

  if (routeName === 'Tickets') {
    return (
      <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
        <Path d="M4 7.5A2.5 2.5 0 0 0 6.5 5h11A2.5 2.5 0 0 0 20 7.5v1a2 2 0 0 0 0 4v1a2.5 2.5 0 0 0-2.5 2.5h-11A2.5 2.5 0 0 0 4 13.5v-1a2 2 0 0 0 0-4v-1Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
        <Line x1="12" y1="7.5" x2="12" y2="16.5" stroke={color} strokeWidth={strokeWidth} strokeDasharray="1.5 1.5" strokeLinecap="round" />
      </Svg>
    );
  }

  return (
    <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M4.5 21c.8-4.2 3.5-6.5 7.5-6.5s6.7 2.3 7.5 6.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => (
          <FooterIcon routeName={route.name} focused={focused} color={color} size={size} />
        ),
        tabBarActiveTintColor: theme.colors.gold,
        tabBarInactiveTintColor: theme.colors.warmWhite,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          display: 'flex',
          backgroundColor: theme.colors.navyBlue,
          borderTopColor: 'rgba(191,10,48,0.72)',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 104 : 88,
          paddingTop: 11,
          paddingBottom: Platform.OS === 'ios' ? 25 : 12,
          elevation: 24,
          shadowColor: '#000',
          shadowOpacity: 0.46,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: -5 },
        },
        tabBarItemStyle: {
          paddingTop: 0,
          paddingHorizontal: 3,
          borderRadius: 0,
        },
        tabBarIconStyle: { marginBottom: 2 },
        tabBarLabelStyle: {
          fontSize: 14,
          lineHeight: 18,
          fontWeight: '600',
          marginTop: 3,
        },
        tabBarActiveBackgroundColor: 'rgba(201,168,76,0.08)',
        sceneStyle: { backgroundColor: theme.colors.dark },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Tickets" component={TicketsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Flyer" component={FlyerScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="OwnerDashboard" component={OwnerDashboardScreen} />
      <Stack.Screen name="Admin" component={AdminScreen} />
      <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    </Stack.Navigator>
  );
}
