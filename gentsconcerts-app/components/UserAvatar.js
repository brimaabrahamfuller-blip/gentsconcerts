import React, { useCallback, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthService } from '../AuthService';
import { getMediaUrl } from '../utils/media';
import { theme } from '../styles/theme';

export default function UserAvatar({ size = 30 }) {
  const [user, setUser] = useState(null);

  useFocusEffect(useCallback(() => {
    let mounted = true;
    AuthService.getUser().then((cachedUser) => {
      if (mounted) setUser(cachedUser);
    });
    return () => { mounted = false; };
  }, []));

  const imageUrl = getMediaUrl(user?.profilePhoto || user?.profileImage);
  const initials = (user?.fullName || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?';

  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize: Math.max(12, size * 0.4) }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.gold,
  },
  initials: {
    color: theme.colors.dark,
    fontWeight: '700',
  },
});

export { UserAvatar };
