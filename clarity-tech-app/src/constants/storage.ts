/**
 * Storage key constants
 * Centralized storage keys to eliminate magic strings and prevent conflicts
 */

// Secure storage keys (stored in expo-secure-store)
export const SECURE_STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token_secure',
  REFRESH_TOKEN: 'refresh_token_secure',
} as const;

// Regular storage keys (stored in AsyncStorage)
export const STORAGE_KEYS = {
  // Auth related
  USER_DATA: '@clarity_user_data',
  REMEMBER_ME: '@clarity_remember_me',
  
  // Offline functionality
  OFFLINE_QUEUE: '@clarity_offline_queue',
  FAILED_QUEUE: '@clarity_failed_queue',
  
  // App data
  ONBOARDING_DRAFTS: '@clarity_onboarding_drafts',
  USER_PREFERENCES: '@clarity_user_preferences',
  APP_SETTINGS: '@clarity_app_settings',
  
  // Cache
  API_CACHE: '@clarity_api_cache',
  IMAGE_CACHE: '@clarity_image_cache',
  
  // Legacy keys (for migration)
  LEGACY_AUTH_TOKEN: '@clarity_auth_token',
  LEGACY_TECHNICIAN_ID: 'technicianId',
  LEGACY_TECHNICIAN_NAME: 'technicianName',
} as const;

// Storage key groups for bulk operations
export const STORAGE_KEY_GROUPS = {
  AUTH: [
    STORAGE_KEYS.USER_DATA,
    STORAGE_KEYS.REMEMBER_ME,
    STORAGE_KEYS.LEGACY_AUTH_TOKEN,
    STORAGE_KEYS.LEGACY_TECHNICIAN_ID,
    STORAGE_KEYS.LEGACY_TECHNICIAN_NAME,
  ],
  OFFLINE: [
    STORAGE_KEYS.OFFLINE_QUEUE,
    STORAGE_KEYS.FAILED_QUEUE,
  ],
  CACHE: [
    STORAGE_KEYS.API_CACHE,
    STORAGE_KEYS.IMAGE_CACHE,
  ],
  USER_DATA: [
    STORAGE_KEYS.ONBOARDING_DRAFTS,
    STORAGE_KEYS.USER_PREFERENCES,
    STORAGE_KEYS.APP_SETTINGS,
  ],
} as const;

// Storage key validation
export const isValidStorageKey = (key: string): key is keyof typeof STORAGE_KEYS => {
  return Object.values(STORAGE_KEYS).includes(key as any);
};

export const isValidSecureStorageKey = (key: string): key is keyof typeof SECURE_STORAGE_KEYS => {
  return Object.values(SECURE_STORAGE_KEYS).includes(key as any);
};

// Storage key types
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
export type SecureStorageKey = typeof SECURE_STORAGE_KEYS[keyof typeof SECURE_STORAGE_KEYS];
export type StorageKeyGroup = keyof typeof STORAGE_KEY_GROUPS;