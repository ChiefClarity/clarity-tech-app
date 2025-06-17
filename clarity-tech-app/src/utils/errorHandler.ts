/**
 * Standardized error handling utility
 * Provides consistent error processing and user-friendly messages
 */

import { AxiosError } from 'axios';
import { logger } from './logger';
import { 
  ApiErrorResponse, 
  ApiResponse, 
  HTTP_STATUS, 
  API_ERROR_TYPES,
  HttpStatusCode,
  ApiErrorType 
} from '../constants/api';

// Base error interface
export interface AppError {
  type: ApiErrorType;
  message: string;
  details?: Record<string, any>;
  statusCode?: HttpStatusCode;
  timestamp: number;
  requestId?: string;
  stack?: string;
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// User-friendly error messages
const ERROR_MESSAGES: Record<HttpStatusCode, string> = {
  [HTTP_STATUS.BAD_REQUEST]: 'Invalid request. Please check your input and try again.',
  [HTTP_STATUS.UNAUTHORIZED]: 'Your session has expired. Please log in again.',
  [HTTP_STATUS.FORBIDDEN]: 'You do not have permission to perform this action.',
  [HTTP_STATUS.NOT_FOUND]: 'The requested resource was not found.',
  [HTTP_STATUS.CONFLICT]: 'This resource already exists or conflicts with existing data.',
  [HTTP_STATUS.UNPROCESSABLE_ENTITY]: 'The provided data is invalid. Please check and try again.',
  [HTTP_STATUS.TOO_MANY_REQUESTS]: 'Too many requests. Please wait a moment and try again.',
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'Server error. Please try again later.',
  [HTTP_STATUS.BAD_GATEWAY]: 'Service temporarily unavailable. Please try again later.',
  [HTTP_STATUS.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable. Please try again later.',
  [HTTP_STATUS.GATEWAY_TIMEOUT]: 'Request timeout. Please try again.',
  [HTTP_STATUS.OK]: 'Success',
  [HTTP_STATUS.CREATED]: 'Created successfully',
  [HTTP_STATUS.NO_CONTENT]: 'Operation completed successfully',
};

// Error type to severity mapping
const ERROR_SEVERITY_MAP: Record<ApiErrorType, ErrorSeverity> = {
  [API_ERROR_TYPES.NETWORK_ERROR]: ErrorSeverity.MEDIUM,
  [API_ERROR_TYPES.TIMEOUT_ERROR]: ErrorSeverity.MEDIUM,
  [API_ERROR_TYPES.AUTHENTICATION_ERROR]: ErrorSeverity.HIGH,
  [API_ERROR_TYPES.AUTHORIZATION_ERROR]: ErrorSeverity.HIGH,
  [API_ERROR_TYPES.VALIDATION_ERROR]: ErrorSeverity.LOW,
  [API_ERROR_TYPES.SERVER_ERROR]: ErrorSeverity.HIGH,
  [API_ERROR_TYPES.UNKNOWN_ERROR]: ErrorSeverity.MEDIUM,
};

class ErrorHandler {
  private errorListeners: Array<(error: AppError) => void> = [];

  /**
   * Process any error and return standardized format
   */
  handleError(error: unknown, context?: string): AppError {
    const timestamp = Date.now();
    let appError: AppError;

    if (this.isAxiosError(error)) {
      appError = this.handleAxiosError(error, timestamp);
    } else if (this.isAppError(error)) {
      appError = error;
    } else if (error instanceof Error) {
      appError = this.handleGenericError(error, timestamp);
    } else {
      appError = this.handleUnknownError(error, timestamp);
    }

    // Add context if provided
    if (context) {
      appError.details = { ...appError.details, context };
    }

    // Log the error
    this.logError(appError, context);

    // Notify listeners
    this.notifyListeners(appError);

    return appError;
  }

  /**
   * Handle Axios errors (API requests)
   */
  private handleAxiosError(error: AxiosError, timestamp: number): AppError {
    const response = error.response;
    const request = error.request;

    if (response) {
      // Server responded with error status
      const statusCode = response.status as HttpStatusCode;
      const errorType = this.getErrorTypeFromStatus(statusCode);
      const message = this.getUserFriendlyMessage(statusCode, response.data);

      return {
        type: errorType,
        message,
        statusCode,
        details: {
          url: response.config?.url,
          method: response.config?.method?.toUpperCase(),
          responseData: response.data,
        },
        timestamp,
        requestId: response.headers?.['x-request-id'],
      };
    } else if (request) {
      // Network error
      return {
        type: API_ERROR_TYPES.NETWORK_ERROR,
        message: 'No response from server. Please check your internet connection and try again.',
        details: {
          url: error.config?.url,
          method: error.config?.method?.toUpperCase(),
        },
        timestamp,
      };
    } else {
      // Request setup error
      return {
        type: API_ERROR_TYPES.UNKNOWN_ERROR,
        message: 'Request setup error. Please try again.',
        details: {
          originalMessage: error.message,
        },
        timestamp,
      };
    }
  }

  /**
   * Handle generic JavaScript errors
   */
  private handleGenericError(error: Error, timestamp: number): AppError {
    return {
      type: API_ERROR_TYPES.UNKNOWN_ERROR,
      message: error.message || 'An unexpected error occurred.',
      details: {
        name: error.name,
        stack: error.stack,
      },
      timestamp,
      stack: error.stack,
    };
  }

  /**
   * Handle unknown error types
   */
  private handleUnknownError(error: unknown, timestamp: number): AppError {
    return {
      type: API_ERROR_TYPES.UNKNOWN_ERROR,
      message: 'An unexpected error occurred. Please try again.',
      details: {
        originalError: String(error),
      },
      timestamp,
    };
  }

  /**
   * Get error type from HTTP status code
   */
  private getErrorTypeFromStatus(statusCode: HttpStatusCode): ApiErrorType {
    switch (statusCode) {
      case HTTP_STATUS.UNAUTHORIZED:
        return API_ERROR_TYPES.AUTHENTICATION_ERROR;
      case HTTP_STATUS.FORBIDDEN:
        return API_ERROR_TYPES.AUTHORIZATION_ERROR;
      case HTTP_STATUS.BAD_REQUEST:
      case HTTP_STATUS.UNPROCESSABLE_ENTITY:
        return API_ERROR_TYPES.VALIDATION_ERROR;
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      case HTTP_STATUS.BAD_GATEWAY:
      case HTTP_STATUS.SERVICE_UNAVAILABLE:
      case HTTP_STATUS.GATEWAY_TIMEOUT:
        return API_ERROR_TYPES.SERVER_ERROR;
      default:
        return API_ERROR_TYPES.UNKNOWN_ERROR;
    }
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(statusCode: HttpStatusCode, responseData?: any): string {
    // Try to get message from server response
    if (responseData?.message && typeof responseData.message === 'string') {
      return responseData.message;
    }

    if (responseData?.error && typeof responseData.error === 'string') {
      return responseData.error;
    }

    // Fallback to predefined messages
    return ERROR_MESSAGES[statusCode] || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Convert AppError to ApiResponse format
   */
  toApiResponse<T = any>(error: AppError): ApiResponse<T> {
    return {
      success: false,
      error: error.message,
      message: error.details?.context,
    };
  }

  /**
   * Get error severity
   */
  getErrorSeverity(error: AppError): ErrorSeverity {
    return ERROR_SEVERITY_MAP[error.type] || ErrorSeverity.MEDIUM;
  }

  /**
   * Check if error should be retried
   */
  shouldRetry(error: AppError): boolean {
    switch (error.type) {
      case API_ERROR_TYPES.NETWORK_ERROR:
      case API_ERROR_TYPES.TIMEOUT_ERROR:
      case API_ERROR_TYPES.SERVER_ERROR:
        return true;
      case API_ERROR_TYPES.AUTHENTICATION_ERROR:
      case API_ERROR_TYPES.AUTHORIZATION_ERROR:
      case API_ERROR_TYPES.VALIDATION_ERROR:
        return false;
      default:
        return false;
    }
  }

  /**
   * Log error with appropriate level
   */
  private logError(error: AppError, context?: string): void {
    const severity = this.getErrorSeverity(error);
    const logContext = context ? `[${context}]` : '';

    switch (severity) {
      case ErrorSeverity.LOW:
        logger.warn(`${logContext} ${error.message}`, error.details);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn(`${logContext} ${error.message}`, error);
        break;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        logger.error(`${logContext} ${error.message}`, error);
        break;
    }
  }

  /**
   * Add error listener
   */
  addErrorListener(listener: (error: AppError) => void): void {
    this.errorListeners.push(listener);
  }

  /**
   * Remove error listener
   */
  removeErrorListener(listener: (error: AppError) => void): void {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  /**
   * Notify all error listeners
   */
  private notifyListeners(error: AppError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        logger.error('Error in error listener', listenerError);
      }
    });
  }

  // Type guards
  private isAxiosError(error: unknown): error is AxiosError {
    return error != null && typeof error === 'object' && 'isAxiosError' in error;
  }

  private isAppError(error: unknown): error is AppError {
    return (
      error != null &&
      typeof error === 'object' &&
      'type' in error &&
      'message' in error &&
      'timestamp' in error
    );
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Utility functions
export const handleApiError = (error: unknown, context?: string): ApiResponse => {
  const appError = errorHandler.handleError(error, context);
  return errorHandler.toApiResponse(appError);
};

export const shouldRetryError = (error: unknown): boolean => {
  const appError = errorHandler.handleError(error);
  return errorHandler.shouldRetry(appError);
};

export const getErrorSeverity = (error: unknown): ErrorSeverity => {
  const appError = errorHandler.handleError(error);
  return errorHandler.getErrorSeverity(appError);
};

// Export types for use in other modules
export type { AppError };