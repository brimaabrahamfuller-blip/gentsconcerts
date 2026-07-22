import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';

const API_BASE = config.API_URL;

// Helper to get auth headers
const getAuthHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = AsyncStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const AuthService = {
  /**
   * Login with email and password, optionally sending Expo push token
   */
  async login(email, password, expoPushToken = null) {
    try {
      const body = { email, password };
      if (expoPushToken) {
        body.expoPushToken = expoPushToken;
      }
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const user = data.data.user;
        await AsyncStorage.setItem('user', JSON.stringify(user));
        await AsyncStorage.setItem('token', data.token);
        return { success: true, user };
      }
      return {
        success: false,
        message: data.message || 'Login failed',
        requiresVerification: data.requiresVerification || false
      };
    } catch (error) {
      console.error('Login Error:', error);
      return { success: false, message: 'Network error. Please check your connection.' };
    }
  },

  /**
   * Register a new user account
   */
  async register(fullName, email, password, phone, role = 'attendee', expoPushToken = null) {
    try {
      const body = { fullName, email, phone, password, role };
      if (expoPushToken) {
        body.expoPushToken = expoPushToken;
      }
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return { success: true, message: data.message || 'Account created' };
      }
      return { success: false, message: data.message || 'Could not create account' };
    } catch (error) {
      console.error('Register Error:', error);
      return { success: false, message: 'Network error. Please check your connection.' };
    }
  },

  /**
   * Verify email with the token from the verification email
   */
  async verifyEmail(token) {
    try {
      const response = await fetch(`${API_BASE}/auth/verify/${token}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      return { success: response.ok, message: data.message || (response.ok ? 'Email verified' : 'Verification failed') };
    } catch (error) {
      console.error('Verify Email Error:', error);
      return { success: false, message: 'Network error. Please check your connection.' };
    }
  },

  /**
   * Resend verification email
   */
  async resendVerification(email) {
    try {
      const response = await fetch(`${API_BASE}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      return { success: response.ok, message: data.message || 'Verification email sent' };
    } catch (error) {
      console.error('Resend Verification Error:', error);
      return { success: false, message: 'Network error. Please check your connection.' };
    }
  },

  /**
   * Request password reset
   */
  async forgotPassword(email) {
    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      return { success: response.ok, message: data.message || 'Reset link sent' };
    } catch (error) {
      console.error('Forgot Password Error:', error);
      return { success: false, message: 'Network error. Please check your connection.' };
    }
  },

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword) {
    try {
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: newPassword })
      });
      const data = await response.json();
      return { success: response.ok, message: data.message || 'Password reset' };
    } catch (error) {
      console.error('Reset Password Error:', error);
      return { success: false, message: 'Network error. Please check your connection.' };
    }
  },

  /**
   * Update the stored Expo push token on the server
   */
  async updatePushToken(expoPushToken) {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE}/users/push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ expoPushToken })
      });
      const data = await response.json();
      return { success: response.ok };
    } catch (error) {
      console.error('Update Push Token Error:', error);
      return { success: false };
    }
  },

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(preferences) {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE}/users/notification-preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notificationPreferences: preferences })
      });
      const data = await response.json();
      return { success: response.ok, data: data.data };
    } catch (error) {
      console.error('Update Preferences Error:', error);
      return { success: false };
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
