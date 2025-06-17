import DOMPurify from 'dompurify';
import { SanitizeOptions } from '../types/api';

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input - The raw user input
 * @param options - Optional configuration for sanitization
 * @returns Sanitized string safe for use
 */
export const sanitizeInput = (input: string, options?: SanitizeOptions): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // For React Native, we need to use a different approach since DOMPurify requires DOM
  // This is a basic sanitization for React Native environment
  if (typeof window === 'undefined' || !window.document) {
    // Basic sanitization for React Native
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  // For web environment, use DOMPurify
  const config: DOMPurify.Config = {
    ALLOWED_TAGS: options?.allowedTags || [],
    ALLOWED_ATTR: options?.allowedAttributes || [],
    KEEP_CONTENT: !options?.stripTags,
  };

  return DOMPurify.sanitize(input, config);
};

/**
 * Sanitizes form data object
 * @param data - Form data object
 * @returns Sanitized form data
 */
export const sanitizeFormData = <T extends Record<string, unknown>>(data: T): T => {
  const sanitized = {} as T;
  
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const value = data[key];
      
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value) as T[Extract<keyof T, string>];
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = sanitizeFormData(value) as T[Extract<keyof T, string>];
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
};

/**
 * Validates and sanitizes email input
 * @param email - Raw email input
 * @returns Sanitized email or empty string if invalid
 */
export const sanitizeEmail = (email: string): string => {
  const sanitized = sanitizeInput(email);
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitized) ? sanitized : '';
};

/**
 * Sanitizes numeric input
 * @param input - Raw numeric input
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Sanitized number or null if invalid
 */
export const sanitizeNumber = (input: string | number, min?: number, max?: number): number | null => {
  const num = typeof input === 'string' ? parseFloat(input) : input;
  
  if (isNaN(num)) {
    return null;
  }
  
  if (min !== undefined && num < min) {
    return min;
  }
  
  if (max !== undefined && num > max) {
    return max;
  }
  
  return num;
};