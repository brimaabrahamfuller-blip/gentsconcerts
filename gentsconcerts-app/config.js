// Dynamic API Configuration
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://gentsconcerts-backend.onrender.com/api';
// Base URL for static files (uploads) - same host as API but without the /api suffix
const IMAGE_BASE_URL = API_URL.replace(/\/api\/?$/, '');
const PAYMENT_ENABLED = String(process.env.EXPO_PUBLIC_PAYMENT_ENABLED || 'false').toLowerCase() === 'true';
console.log('API_URL initialized:', API_URL);

export default {
  API_URL,
  IMAGE_BASE_URL,
  PAYMENT_ENABLED,
};
