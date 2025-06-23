import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Web-compatible storage service using AsyncStorage
 * For development purposes - in production, consider encryption
 */
class SecureStorageService {
  /**
   * Stores a value
   * @param key - The storage key
   * @param value - The value to store
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      // Error storing item
      throw error;
    }
  }

  /**
   * Retrieves a value from storage
   * @param key - The storage key
   * @returns The stored value or null if not found
   */
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      // Error retrieving item
      return null;
    }
  }

  /**
   * Removes a value from storage
   * @param key - The storage key
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      // Error removing item
      throw error;
    }
  }

  /**
   * Removes multiple items from storage
   * @param keys - Array of storage keys to remove
   */
  async multiRemove(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      // Error removing multiple items
      throw error;
    }
  }

  /**
   * Always returns false for web
   */
  isSecure(): boolean {
    return false;
  }
}

export const secureStorage = new SecureStorageService();

// Export specific methods for auth token management
export const authTokenStorage = {
  async setToken(token: string): Promise<void> {
    return secureStorage.setItem('auth_token_secure', token);
  },

  async getToken(): Promise<string | null> {
    return secureStorage.getItem('auth_token_secure');
  },

  async removeToken(): Promise<void> {
    return secureStorage.removeItem('auth_token_secure');
  },

  async setRefreshToken(token: string): Promise<void> {
    return secureStorage.setItem('refresh_token_secure', token);
  },

  async getRefreshToken(): Promise<string | null> {
    return secureStorage.getItem('refresh_token_secure');
  },

  async removeRefreshToken(): Promise<void> {
    return secureStorage.removeItem('refresh_token_secure');
  },

  async clearAllTokens(): Promise<void> {
    return secureStorage.multiRemove([
      'auth_token_secure',
      'refresh_token_secure'
    ]);
  }
};