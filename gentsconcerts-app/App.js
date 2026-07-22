import React, { useCallback, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { AuthService } from './AuthService';
import RootNavigator from './navigation/RootNavigator';

const Stack = createNativeStackNavigator();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts
        await Font.loadAsync({
          PlayfairDisplay_700Bold,
          Inter_400Regular,
          Inter_700Bold,
        });

        // Register for push notifications
        if (Device.isDevice && Platform.OS !== 'web') {
          await registerForPushNotificationsAsync();
        } else {
          console.log('Push notifications skipped: Not a physical device or running on Web');
        }
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      try {
        // Hide native splash screen once assets are ready
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn('Error hiding splash screen:', e);
      }
    }
  }, [appIsReady]);

  const linking = {
    prefixes: ['gentsconcerts://', 'https://gentsconcerts.netlify.app'],
    config: {
      screens: {
        Root: {
          screens: {
            EmailVerification: 'verify-email/:token',
            Login: 'login',
            EventDetail: 'event/:id',
            Main: {
              screens: {
                Home: 'home',
                Events: 'events',
                Tickets: 'tickets',
                Profile: 'profile',
              },
            },
            AdminDashboard: 'admin',
            TermsAndConditions: 'terms',
            PrivacyPolicy: 'privacy',
          },
        },
      },
    },
  };

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <NavigationContainer linking={linking}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* All navigation handled by RootNavigator */}
          <Stack.Screen name="Root" component={RootNavigator} />
        </Stack.Navigator>
        <StatusBar style="light" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

/**
 * Register for push notifications and send token to backend
 */
async function registerForPushNotificationsAsync() {
  try {
    let token;

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get push notification permissions');
        return;
      }
      token = await Notifications.getExpoPushTokenAsync();
      console.log('Expo Push Token:', token.data);
    } else {
      console.log('Push notifications require a physical device');
      return;
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D4AF37',
      });
    }

    // If user is logged in, send token to backend
    const isAuthenticated = await AuthService.isAuthenticated();
    if (isAuthenticated) {
      await AuthService.updatePushToken(token.data);
    }

    return token.data;
  } catch (error) {
    console.error('Push notification registration error:', error);
  }
}
