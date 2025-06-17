/**
 * Feature Flags Configuration
 * 
 * Controls which features are enabled in different environments.
 * Use these flags to gradually roll out API integrations and new features.
 * 
 * Integration Priority Legend:
 * - Priority 1: Critical for MVP launch
 * - Priority 2: Enhanced data collection and AI
 * - Priority 3: Platform features and engagement
 * - Priority 4: Third-party integrations
 * - Priority 5: Future customer features
 */

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isStaging = process.env.EXPO_PUBLIC_ENVIRONMENT === 'staging';

export const FEATURES = {
  // 🔴 PRIORITY 1: Core Functionality
  USE_REAL_AUTH: process.env.EXPO_PUBLIC_USE_REAL_AUTH === 'true' || false,
  USE_REAL_OFFERS: process.env.EXPO_PUBLIC_USE_REAL_OFFERS === 'true' || false,
  USE_REAL_ONBOARDING: process.env.EXPO_PUBLIC_USE_REAL_ONBOARDING === 'true' || false,
  
  // 🟡 PRIORITY 2: Data Collection & AI
  ENABLE_PHOTO_UPLOAD: process.env.EXPO_PUBLIC_ENABLE_PHOTO_UPLOAD === 'true' || isDevelopment,
  ENABLE_VOICE_NOTES: process.env.EXPO_PUBLIC_ENABLE_VOICE_NOTES === 'true' || isDevelopment,
  GEMINI_VISION_ENABLED: process.env.EXPO_PUBLIC_GEMINI_VISION_ENABLED === 'true' || false,
  CLAUDE_AI_ENABLED: process.env.EXPO_PUBLIC_CLAUDE_AI_ENABLED === 'true' || false,
  ENABLE_AI_REPORTS: process.env.EXPO_PUBLIC_ENABLE_AI_REPORTS === 'true' || false,
  
  // 🟢 PRIORITY 3: Platform Features
  PUSH_NOTIFICATIONS: process.env.EXPO_PUBLIC_PUSH_NOTIFICATIONS === 'true' || false,
  ENABLE_TECHNICIAN_RATINGS: process.env.EXPO_PUBLIC_ENABLE_RATINGS === 'true' || isDevelopment,
  ENABLE_EARNINGS_TRACKING: process.env.EXPO_PUBLIC_ENABLE_EARNINGS === 'true' || isDevelopment,
  ENABLE_PERFORMANCE_METRICS: process.env.EXPO_PUBLIC_ENABLE_PERFORMANCE === 'true' || isDevelopment,
  
  // 🔵 PRIORITY 4: Third-party Integrations
  POOLBRAIN_INTEGRATION: process.env.EXPO_PUBLIC_POOLBRAIN_INTEGRATION === 'true' || false,
  ENABLE_ROUTE_OPTIMIZATION: process.env.EXPO_PUBLIC_ENABLE_ROUTES === 'true' || false,
  ENABLE_CUSTOMER_SYNC: process.env.EXPO_PUBLIC_ENABLE_CUSTOMER_SYNC === 'true' || false,
  
  // ⚪ PRIORITY 5: Future Features
  CUSTOMER_APP_ENABLED: process.env.EXPO_PUBLIC_CUSTOMER_APP === 'true' || false,
  ENABLE_PAYMENTS: process.env.EXPO_PUBLIC_ENABLE_PAYMENTS === 'true' || false,
  ENABLE_SUBSCRIPTIONS: process.env.EXPO_PUBLIC_ENABLE_SUBSCRIPTIONS === 'true' || false,
  
  // 🧪 Development & Testing
  ENABLE_MOCK_DATA: isDevelopment || isStaging,
  ENABLE_DEBUG_LOGS: isDevelopment,
  ENABLE_FEATURE_TOGGLES: isDevelopment || isStaging,
  SKIP_ONBOARDING: process.env.EXPO_PUBLIC_SKIP_ONBOARDING === 'true' || false,
  ENABLE_DEV_TOOLS: isDevelopment,
} as const;

export const API_KEYS = {
  // AI Services
  GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
  CLAUDE_API_KEY: process.env.EXPO_PUBLIC_CLAUDE_API_KEY || '',
  OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
  
  // Push Notifications
  VAPID_PUBLIC_KEY: process.env.EXPO_PUBLIC_VAPID_KEY || '',
  FCM_SENDER_ID: process.env.EXPO_PUBLIC_FCM_SENDER_ID || '',
  
  // Third-party Services
  POOLBRAIN_API_KEY: process.env.EXPO_PUBLIC_POOLBRAIN_API_KEY || '',
  POOLBRAIN_WEBHOOK_SECRET: process.env.EXPO_PUBLIC_POOLBRAIN_WEBHOOK_SECRET || '',
  
  // Cloud Services
  AWS_ACCESS_KEY: process.env.EXPO_PUBLIC_AWS_ACCESS_KEY || '',
  AWS_SECRET_KEY: process.env.EXPO_PUBLIC_AWS_SECRET_KEY || '',
  AWS_BUCKET: process.env.EXPO_PUBLIC_AWS_BUCKET || 'clarity-pool-uploads',
  
  // Analytics & Monitoring
  SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
  MIXPANEL_TOKEN: process.env.EXPO_PUBLIC_MIXPANEL_TOKEN || '',
} as const;

export const API_ENDPOINTS = {
  // Base URLs
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://clarity-pool-api.onrender.com',
  AI_SERVICE_URL: process.env.EXPO_PUBLIC_AI_SERVICE_URL || 'https://ai.claritypool.com',
  POOLBRAIN_URL: process.env.EXPO_PUBLIC_POOLBRAIN_URL || 'https://api.poolbrain.com',
  
  // WebSocket URLs
  WEBSOCKET_URL: process.env.EXPO_PUBLIC_WEBSOCKET_URL || 'wss://ws.claritypool.com',
  
  // CDN URLs
  ASSETS_CDN: process.env.EXPO_PUBLIC_ASSETS_CDN || 'https://cdn.claritypool.com',
  UPLOADS_CDN: process.env.EXPO_PUBLIC_UPLOADS_CDN || 'https://uploads.claritypool.com',
} as const;

export const TIMEOUTS = {
  // API Request Timeouts (milliseconds)
  DEFAULT_TIMEOUT: 10000, // 10 seconds
  UPLOAD_TIMEOUT: 60000, // 60 seconds for file uploads
  AI_PROCESSING_TIMEOUT: 120000, // 2 minutes for AI processing
  
  // Cache Timeouts
  OFFERS_CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  PROFILE_CACHE_TTL: 30 * 60 * 1000, // 30 minutes
  
  // Business Logic Timeouts
  OFFER_EXPIRATION_TIME: 30 * 60 * 1000, // 30 minutes
  UNDO_TIME_LIMIT: 2 * 60 * 1000, // 2 minutes
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
} as const;

export const LIMITS = {
  // File Upload Limits
  MAX_PHOTO_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VOICE_NOTE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_PHOTOS_PER_SESSION: 20,
  
  // Data Limits
  MAX_EQUIPMENT_ITEMS: 50,
  MAX_VOICE_NOTE_DURATION: 10 * 60, // 10 minutes
  
  // Rate Limits
  MAX_OFFERS_PER_DAY: 50,
  MAX_API_REQUESTS_PER_MINUTE: 100,
} as const;

// Environment-specific configurations
export const ENVIRONMENT_CONFIG = {
  development: {
    LOG_LEVEL: 'debug',
    ENABLE_REDUX_DEVTOOLS: true,
    MOCK_SLOW_NETWORK: false,
    BYPASS_AUTH: false,
  },
  staging: {
    LOG_LEVEL: 'info',
    ENABLE_REDUX_DEVTOOLS: true,
    MOCK_SLOW_NETWORK: false,
    BYPASS_AUTH: false,
  },
  production: {
    LOG_LEVEL: 'error',
    ENABLE_REDUX_DEVTOOLS: false,
    MOCK_SLOW_NETWORK: false,
    BYPASS_AUTH: false,
  },
} as const;

// Get current environment config
export const getCurrentEnvironmentConfig = () => {
  if (isProduction) return ENVIRONMENT_CONFIG.production;
  if (isStaging) return ENVIRONMENT_CONFIG.staging;
  return ENVIRONMENT_CONFIG.development;
};

// Feature flag utilities
export const isFeatureEnabled = (feature: keyof typeof FEATURES): boolean => {
  return FEATURES[feature] as boolean;
};

export const getApiKey = (key: keyof typeof API_KEYS): string => {
  const value = API_KEYS[key];
  if (!value && isProduction) {
    console.warn(`Missing API key: ${key}`);
  }
  return value;
};

export const getTimeout = (operation: keyof typeof TIMEOUTS): number => {
  return TIMEOUTS[operation];
};

export const getLimit = (limit: keyof typeof LIMITS): number => {
  return LIMITS[limit];
};

// Integration status helpers
export const getIntegrationStatus = () => {
  return {
    priority1: {
      auth: FEATURES.USE_REAL_AUTH,
      offers: FEATURES.USE_REAL_OFFERS,
      onboarding: FEATURES.USE_REAL_ONBOARDING,
    },
    priority2: {
      ai: FEATURES.CLAUDE_AI_ENABLED || FEATURES.GEMINI_VISION_ENABLED,
      photoUpload: FEATURES.ENABLE_PHOTO_UPLOAD,
      voiceNotes: FEATURES.ENABLE_VOICE_NOTES,
    },
    priority3: {
      pushNotifications: FEATURES.PUSH_NOTIFICATIONS,
      ratings: FEATURES.ENABLE_TECHNICIAN_RATINGS,
      earnings: FEATURES.ENABLE_EARNINGS_TRACKING,
    },
    priority4: {
      poolbrain: FEATURES.POOLBRAIN_INTEGRATION,
      routes: FEATURES.ENABLE_ROUTE_OPTIMIZATION,
      customerSync: FEATURES.ENABLE_CUSTOMER_SYNC,
    },
    priority5: {
      customerApp: FEATURES.CUSTOMER_APP_ENABLED,
      payments: FEATURES.ENABLE_PAYMENTS,
      subscriptions: FEATURES.ENABLE_SUBSCRIPTIONS,
    },
  };
};

// Debug helper for development
if (isDevelopment) {
  console.log('🏗️ Feature Flags Loaded:', {
    environment: process.env.NODE_ENV,
    enabledFeatures: Object.entries(FEATURES)
      .filter(([_, enabled]) => enabled)
      .map(([feature]) => feature),
    integrationStatus: getIntegrationStatus(),
  });
}

export default FEATURES;