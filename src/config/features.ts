export const FEATURES = {
  USE_REAL_AI: process.env.USE_REAL_AI === 'true',
  AI_ENVIRONMENT_ANALYSIS: true,
  AI_SURFACE_ANALYSIS: true,
  AI_SATELLITE_ANALYSIS: true,
  AI_VOICE_ANALYSIS: true,
};

export const AI_ENDPOINTS = {
  ANALYZE_ENVIRONMENT: '/ai/analyze-environment',
  ANALYZE_SURFACE: '/ai/analyze-surface', 
  ANALYZE_SATELLITE: '/ai/analyze-satellite',
  ANALYZE_WEATHER_POLLEN: '/ai/analyze-weather-pollen',
  ANALYZE_VOICE: '/ai/analyze-voice',
};