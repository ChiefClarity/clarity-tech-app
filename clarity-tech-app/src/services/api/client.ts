import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { webNetworkMonitor } from '../network/webNetworkMonitor';
import { backOff } from 'exponential-backoff';
import { authTokenStorage } from '../storage/secureStorage';
import { API_CONFIG } from '../../constants/api';
import { STORAGE_KEYS } from '../../constants/storage';
import { ApiResponse } from '../../types';
import { sanitizeFormData } from '../../utils/sanitize';
import { FailedQueueItem, RequestConfig, RequestParams, RequestData } from '../../types/api';

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: FailedQueueItem[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await authTokenStorage.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue this request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return this.client(originalRequest);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // Try to refresh token
            const { authService } = await import('./auth');
            const refreshResult = await authService.refreshToken();
            
            if (refreshResult.success && refreshResult.data) {
              const newToken = refreshResult.data.token;
              
              // Process failed queue
              this.failedQueue.forEach(({ resolve }) => resolve(newToken));
              this.failedQueue = [];
              
              // Retry original request with new token
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
              
              return this.client(originalRequest);
            } else {
              // Refresh failed - clear auth data and redirect to login
              await authTokenStorage.clearAllTokens();
              await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
              
              // Reject all queued requests
              this.failedQueue.forEach(({ reject }) => reject(error));
              this.failedQueue = [];
              
              return Promise.reject(error);
            }
          } catch (refreshError) {
            // Refresh failed - clear auth data
            await authTokenStorage.clearAllTokens();
            await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
            
            this.failedQueue.forEach(({ reject }) => reject(refreshError));
            this.failedQueue = [];
            
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  private async makeRequestWithRetry<T>(
    requestFn: () => Promise<{ data: ApiResponse<T> }>,
    retryConfig?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const { maxRetries = 3, startingDelay = 1000 } = retryConfig || {};
    
    try {
      // Check network connectivity before making request
      const netInfo = webNetworkMonitor.getCurrentStatus();
      if (!netInfo.isConnected) {
        return {
          success: false,
          error: 'No internet connection. Please check your network and try again.',
        };
      }

      const response = await backOff(requestFn, {
        numOfAttempts: maxRetries,
        startingDelay,
        timeMultiple: 2,
        maxDelay: 10000,
        retry: (error: unknown) => {
          // Retry on network errors, 5xx errors, but not on 4xx errors (except 401 which is handled by interceptor)
          if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            return !status || status >= 500 || status === 408 || status === 429;
          }
          return true; // Retry on non-axios errors (network issues)
        },
      });
      
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async get<T>(url: string, params?: RequestParams): Promise<ApiResponse<T>> {
    return this.makeRequestWithRetry<T>(() => 
      this.client.get<ApiResponse<T>>(url, { params })
    );
  }

  async post<T>(url: string, data?: RequestData): Promise<ApiResponse<T>> {
    // Sanitize form data before sending
    const sanitizedData = data && typeof data === 'object' ? sanitizeFormData(data) : data;
    return this.makeRequestWithRetry<T>(() => 
      this.client.post<ApiResponse<T>>(url, sanitizedData)
    );
  }

  async put<T>(url: string, data?: RequestData): Promise<ApiResponse<T>> {
    // Sanitize form data before sending
    const sanitizedData = data && typeof data === 'object' ? sanitizeFormData(data) : data;
    return this.makeRequestWithRetry<T>(() => 
      this.client.put<ApiResponse<T>>(url, sanitizedData)
    );
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.makeRequestWithRetry<T>(() => 
      this.client.delete<ApiResponse<T>>(url)
    );
  }

  async upload<T>(url: string, formData: FormData): Promise<ApiResponse<T>> {
    return this.makeRequestWithRetry<T>(() => 
      this.client.post<ApiResponse<T>>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // Longer timeout for uploads
      })
    );
  }

  private handleError(error: unknown): ApiResponse<never> {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const status = error.response.status;
        let errorMessage = error.response.data?.error || 'Server error occurred';
        
        // Provide user-friendly error messages
        switch (status) {
          case 400:
            errorMessage = 'Invalid request. Please check your input and try again.';
            break;
          case 401:
            errorMessage = 'Authentication failed. Please log in again.';
            break;
          case 403:
            errorMessage = 'You do not have permission to perform this action.';
            break;
          case 404:
            errorMessage = 'The requested resource was not found.';
            break;
          case 408:
            errorMessage = 'Request timeout. Please try again.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please wait a moment and try again.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          case 502:
          case 503:
            errorMessage = 'Service temporarily unavailable. Please try again later.';
            break;
        }
        
        return {
          success: false,
          error: errorMessage,
          message: error.response.data?.message,
        };
      } else if (error.request) {
        return {
          success: false,
          error: 'No response from server. Please check your internet connection and try again.',
        };
      } else if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'Request timeout. Please try again.',
        };
      }
    }
    
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

export const apiClient = new ApiClient();