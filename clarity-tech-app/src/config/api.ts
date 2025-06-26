import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'https://clarity-pool-api.onrender.com'  // Use production API even in dev
    : 'https://clarity-pool-api.onrender.com',
  TIMEOUT: 30000,
  UPLOAD_TIMEOUT: 60000, // Longer timeout for photo/audio uploads
};

// Helper to get auth token
export const getAuthToken = async () => {
  // Get from AsyncStorage or context
  const token = await AsyncStorage.getItem('authToken');
  return token;
};