// Dynamic API Configuration
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
console.log('API_URL initialized:', API_URL);

export default {
  API_URL,
};
