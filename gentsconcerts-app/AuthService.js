import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';

const API_BASE = config.API_URL;

export const AuthService = {
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        // Backend returns: { success: true, token, data: { user: { _id, fullName, email, role, ... } } }
        const user = data.data.user;
        await AsyncStorage.setItem('user', JSON.stringify(user));
        await AsyncStorage.setItem('token', data.token);
        return { success: true, user };
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch (error) {
      console.error('Login Error:', error);
      return { success: false, message: 'Network error. Please check your connection.' };
    }
  },

  async register(fullName, email, password, phone, role = 'attendee') {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone, password, role })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return { success: true };
      }
      return { success: false, message: data.message || 'Could not create account' };
    } catch (error) {
      console.error('Register Error:', error);
      return { success: false, message: 'Network error. Please check your connection.' };
    }
  },

  async logout() {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
  },

  async getUser() {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  async getToken() {
    return await AsyncStorage.getItem('token');
  },

  async isAuthenticated() {
    const token = await AsyncStorage.getItem('token');
    const user = await AsyncStorage.getItem('user');
    return !!(token && user);
  }
};
