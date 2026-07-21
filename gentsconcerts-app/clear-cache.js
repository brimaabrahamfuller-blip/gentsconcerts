import AsyncStorage from '@react-native-async-storage/async-storage';

export const clearAllData = async () => {
  try {
    await AsyncStorage.clear();
    console.log('Storage successfully cleared!');
  } catch (e) {
    console.error('Failed to clear storage.');
  }
};
