export const FEATURES = {
  // AI Features - Set to true when API keys are configured
  USE_REAL_AI: true, // Set to true when ready for production
  
  // Individual AI feature flags
  AI_WATER_CHEMISTRY: true,
  AI_POOL_ANALYSIS: true,
  AI_EQUIPMENT_DETECTION: true,
  AI_ENVIRONMENT_ANALYSIS: true,
  AI_VOICE_TRANSCRIPTION: true,
  AI_REPORT_GENERATION: true,
  AI_SATELLITE_ANALYSIS: true, // NEW - Google Maps
  
  // Photo capture settings
  PHOTO_QUALITY: 0.8,
  MAX_PHOTO_SIZE: 1920,
  
  // Voice recording settings - MANDATORY
  VOICE_MIN_DURATION: 30, // 30 seconds MANDATORY
  VOICE_MAX_DURATION: 180, // 3 minutes maximum
  VOICE_REQUIRED: true, // Cannot complete without voice note
  
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