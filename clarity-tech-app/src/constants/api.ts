/**
 * API constants
 * Centralized API configuration to eliminate magic strings
 */

// Base URLs
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://clarity-pool-api.onrender.com',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  UPLOAD_TIMEOUT: 60000,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/technician/login',
    LOGOUT: '/api/auth/technician/logout',
    REFRESH: '/api/auth/technician/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  OFFERS: {
    GET_TECHNICIAN_OFFERS: '/api/offers/technician',
    ACCEPT: '/api/offers/:id/accept',
    DECLINE: '/api/offers/:id/decline',
    UNDO: '/api/offers/:id/undo',
  },
  USER: {
    PROFILE: '/user/profile',
    UPDATE: '/user/update',
    CHANGE_PASSWORD: '/user/change-password',
    UPLOAD_AVATAR: '/user/upload-avatar',
  },
  ONBOARDING: {
    GET_SESSIONS: '/api/onboarding/sessions/technician',
    GET_SESSION: '/api/onboarding/sessions',
    START_SESSION: '/api/onboarding/sessions/:id/start',
    WATER_CHEMISTRY: '/api/onboarding/sessions/:id/water-chemistry',
    EQUIPMENT: '/api/onboarding/sessions/:id/equipment',
    POOL_DETAILS: '/api/onboarding/sessions/:id/pool-details',
    UPLOAD_PHOTO: '/api/onboarding/sessions/:id/photos',
    UPLOAD_VOICE: '/api/onboarding/sessions/:id/voice-note',
    COMPLETE: '/api/onboarding/sessions/:id/complete',
  },
  CUSTOMERS: {
    LIST: '/customers/list',
    CREATE: '/customers/create',
    UPDATE: '/customers/update',
    GET: '/customers/get',
    DELETE: '/customers/delete',
    SEARCH: '/customers/search',
  },
  POOL_DATA: {
    WATER_CHEMISTRY: '/pool-data/water-chemistry',
    EQUIPMENT: '/pool-data/equipment',
    MAINTENANCE_LOG: '/pool-data/maintenance-log',
  },
  REPORTS: {
    GENERATE: '/reports/generate',
    LIST: '/reports/list',
    DOWNLOAD: '/reports/download',
  },
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

// Content Types
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded',
  TEXT: 'text/plain',
  XML: 'application/xml',
} as const;

// Error Types
export const API_ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// Request Priority Levels
export const REQUEST_PRIORITY = {
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low',
} as const;

// Cache Control
export const CACHE_CONTROL = {
  NO_CACHE: 'no-cache',
  NO_STORE: 'no-store',
  MUST_REVALIDATE: 'must-revalidate',
  PUBLIC: 'public',
  PRIVATE: 'private',
  MAX_AGE_1_HOUR: 'max-age=3600',
  MAX_AGE_1_DAY: 'max-age=86400',
  MAX_AGE_1_WEEK: 'max-age=604800',
} as const;

// API Response Format
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: number;
  requestId?: string;
}

// Error Response Format
export interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;
  details?: Record<string, any>;
  timestamp: number;
  requestId?: string;
  statusCode?: number;
}

// Success Response Format
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: number;
  requestId?: string;
  statusCode?: number;
}

// Pool-specific constants
export const POOL_FEATURES = [
  'lighting',
  'waterfall',
  'spa',
  'slide',
  'diving_board',
  'automatic_cleaner',
  'solar_heating',
  'gas_heating',
  'salt_system',
  'automation',
  'cover',
] as const;

export const EQUIPMENT_TYPES = [
  { value: 'pump', label: 'Pump' },
  { value: 'filter', label: 'Filter' },
  { value: 'sanitizer', label: 'Sanitizer' },
  { value: 'heater', label: 'Heater' },
  { value: 'cleaner', label: 'Automatic Cleaner' },
  { value: 'other', label: 'Other' },
] as const;

export const CONDITION_OPTIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
] as const;

// Type guards
export const isApiErrorResponse = (response: any): response is ApiErrorResponse => {
  return response && typeof response === 'object' && response.success === false;
};

export const isApiSuccessResponse = <T = any>(response: any): response is ApiSuccessResponse<T> => {
  return response && typeof response === 'object' && response.success === true;
};

// Endpoint type definitions
export type ApiEndpoint = string;
export type HttpMethod = typeof HTTP_METHODS[keyof typeof HTTP_METHODS];
export type HttpStatusCode = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];
export type ContentType = typeof CONTENT_TYPES[keyof typeof CONTENT_TYPES];
export type ApiErrorType = typeof API_ERROR_TYPES[keyof typeof API_ERROR_TYPES];
export type RequestPriority = typeof REQUEST_PRIORITY[keyof typeof REQUEST_PRIORITY];
export type PoolFeature = typeof POOL_FEATURES[number];
export type EquipmentType = typeof EQUIPMENT_TYPES[number]['value'];
export type ConditionOption = typeof CONDITION_OPTIONS[number]['value'];