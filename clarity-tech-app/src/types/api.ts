/**
 * API-specific types
 * Provides type safety for API client and hooks
 */

// Request configuration
export interface RequestConfig {
  maxRetries?: number;
  startingDelay?: number;
}

// Failed queue item for token refresh
export interface FailedQueueItem {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}

// Upload configuration
export interface UploadConfig {
  timeout?: number;
  onProgress?: (progress: number) => void;
}

// Offline sync configuration
export interface OfflineSyncConfig {
  type: 'create' | 'update' | 'upload' | 'delete';
  endpoint: string;
  data: Record<string, unknown>;
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  priority?: 'high' | 'medium' | 'low';
}

// API client method parameters
export type RequestParams = Record<string, string | number | boolean | undefined>;
export type RequestData = Record<string, unknown> | FormData | string | null;

// Error handling types
export interface ApiErrorDetails {
  url?: string;
  method?: string;
  status?: number;
  responseData?: unknown;
  requestId?: string;
}

// Hook options interface
export interface UseApiOptions<T = unknown> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  offlineMode?: boolean;
  autoExecute?: boolean;
  retryConfig?: RequestConfig;
}

// Hook return type
export interface UseApiReturn<T = unknown> {
  loading: boolean;
  error: string | null;
  data: T | null;
  execute: (
    apiCall: () => Promise<import('./index').ApiResponse<T>>,
    offlineConfig?: OfflineSyncConfig
  ) => Promise<import('./index').ApiResponse<T>>;
  reset: () => void;
  isOffline: boolean;
}

// Logger data types
export type LogData = 
  | string 
  | number 
  | boolean 
  | null 
  | undefined 
  | Record<string, unknown> 
  | unknown[];

// Storage data types
export interface StorageItem {
  key: string;
  value: unknown;
  timestamp: number;
  expiry?: number;
}

export interface QueueItem extends OfflineSyncConfig {
  id: string;
  timestamp: number;
  retryCount?: number;
  lastError?: string;
}

// Form data types
export type FormFieldValue = string | number | boolean | null | undefined;
export type FormData = Record<string, FormFieldValue | FormFieldValue[]>;

// Sanitization options
export interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  stripTags?: boolean;
  maxLength?: number;
}

// Queue statistics
export interface QueueStats {
  pending: number;
  failed: number;
  processing: boolean;
  lastSync?: number;
}