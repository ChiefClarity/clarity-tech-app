export const FEATURES = {
  // AI Features - Set to false for mock mode, true for real API integration
  USE_REAL_AI: false,
  
  // Individual AI feature flags
  AI_WATER_CHEMISTRY: true,
  AI_POOL_ANALYSIS: true,
  AI_EQUIPMENT_DETECTION: true,
  AI_ENVIRONMENT_ANALYSIS: true,
  AI_VOICE_TRANSCRIPTION: true,
  
  // Photo capture settings
  PHOTO_QUALITY: 0.8,
  MAX_PHOTO_SIZE: 1920,
  
  // Voice recording settings
  VOICE_MIN_DURATION: 30, // seconds
  VOICE_MAX_DURATION: 180, // 3 minutes
  
  // API timeouts
  AI_ANALYSIS_TIMEOUT: 5000, // 5 seconds
  PHOTO_UPLOAD_TIMEOUT: 10000, // 10 seconds
};

export const AI_ENDPOINTS = {
  ANALYZE_TEST_STRIP: '/ai/analyze-test-strip',
  ANALYZE_EQUIPMENT: '/ai/analyze-equipment',
  ANALYZE_POOL_SATELLITE: '/ai/analyze-pool-satellite',
  ANALYZE_ENVIRONMENT: '/ai/analyze-environment',
  ANALYZE_DECK_MATERIAL: '/ai/analyze-deck-material',
  TRANSCRIBE_VOICE: '/ai/transcribe-voice',
};