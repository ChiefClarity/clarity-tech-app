// HARDCODE these values - Expo web doesn't read .env properly
export const FEATURES = {
  // FORCE ALL TO TRUE - NO MORE MOCKS
  USE_REAL_AUTH: true,
  USE_REAL_OFFERS: true, 
  USE_REAL_ONBOARDING: true,
  USE_REAL_AI: true,
  
  // Individual AI feature flags - ALL TRUE
  AI_WATER_CHEMISTRY: true,
  AI_POOL_ANALYSIS: true,
  AI_EQUIPMENT_DETECTION: true,
  AI_ENVIRONMENT_ANALYSIS: true,
  AI_VOICE_TRANSCRIPTION: true,
  AI_REPORT_GENERATION: true,
  AI_SATELLITE_ANALYSIS: true,
  
  // Production settings
  PHOTO_QUALITY: 0.8,
  MAX_PHOTO_SIZE: 1920,
  VOICE_MIN_DURATION: 30,
  VOICE_MAX_DURATION: 180,
  VOICE_REQUIRED: true,
  
  // Proper timeouts for AI
  AI_ANALYSIS_TIMEOUT: 30000, // 30 seconds
  PHOTO_UPLOAD_TIMEOUT: 10000, // 10 seconds
};

// Export individual flags for backwards compatibility
export const USE_REAL_AUTH = true;
export const USE_REAL_OFFERS = true;
export const USE_REAL_ONBOARDING = true;
export const USE_REAL_AI = true;

export const AI_ENDPOINTS = {
  ANALYZE_TEST_STRIP: '/ai/analyze-test-strip',
  ANALYZE_EQUIPMENT: '/ai/analyze-equipment',
  ANALYZE_POOL_SATELLITE: '/ai/analyze-pool-satellite',
  ANALYZE_ENVIRONMENT: '/ai/analyze-environment',
  ANALYZE_DECK_MATERIAL: '/ai/analyze-deck-material',
  TRANSCRIBE_VOICE: '/ai/transcribe-voice',
};