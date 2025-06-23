import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/api';
import { User, ApiResponse } from '../../types';
import { authTokenStorage } from '../storage/secureStorage';
import { FEATURES } from '../../config/featureFlags';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../constants/storage';
import { offlineQueue } from '../storage/queue';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken?: string; // Optional: some APIs return new refresh token too
}

export const authService = {
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    console.log('🔐 [Auth] Login attempt', { email: credentials.email, useRealAuth: FEATURES.USE_REAL_AUTH });
    
    // Test account bypass for development
    if (!FEATURES.USE_REAL_AUTH && credentials.email === 'test@claritypool.com' && credentials.password === 'test123') {
      const mockTechUser: User = {
        id: 'test-user-1',
        email: 'test@claritypool.com',
        firstName: 'Test',
        lastName: 'Technician',
        role: 'technician',
        displayName: 'Test Technician'
      };
      
      const mockResponse = {
        success: true as const,
        data: {
          user: mockTechUser,
          token: 'test-token',
          refreshToken: 'test-refresh-token'
        }
      };
      
      // Store tokens even for test account
      await authTokenStorage.setToken(mockResponse.data.token);
      await authTokenStorage.setRefreshToken(mockResponse.data.refreshToken);
      
      console.log('✅ [Auth] Test account login successful');
      return mockResponse;
    }
    
    if (FEATURES.USE_REAL_AUTH) {
      const response = await apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
      
      // Store tokens after successful login
      if (response.success && response.data) {
        await authTokenStorage.setToken(response.data.token);
        await authTokenStorage.setRefreshToken(response.data.refreshToken);
        console.log('✅ [Auth] Real API login successful', { userId: response.data.user.id });
      } else {
        console.error('❌ [Auth] Login failed', response.error);
      }
      
      return response;
    } else {
      // Mock for development - reject non-test accounts
      return {
        success: false,
        error: 'Invalid credentials (use test@claritypool.com / test123 for demo)'
      };
    }
  },

  async logout(): Promise<ApiResponse<void>> {
    console.log('🔐 [Auth] Logout initiated');
    try {
      // Call logout endpoint if using real auth
      if (FEATURES.USE_REAL_AUTH) {
        await apiClient.post<void>(API_ENDPOINTS.AUTH.LOGOUT);
      }
      
      // Clear all stored data
      await authTokenStorage.clearAllTokens();
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.OFFERS,
        STORAGE_KEYS.ACCEPTED_OFFERS,
        STORAGE_KEYS.DECLINED_OFFERS,
        STORAGE_KEYS.OFFER_EXPIRY_MAP,
        STORAGE_KEYS.ONBOARDING_SESSIONS,
      ]);
      
      // Clear offline queue
      await offlineQueue.clear();
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local data even if API call fails
      await authTokenStorage.clearAllTokens();
      await AsyncStorage.clear();
      await offlineQueue.clear();
      
      return { success: true };
    }
  },

  async refreshToken(): Promise<ApiResponse<RefreshTokenResponse>> {
    console.log('🔄 [Auth] Refreshing token...');
    try {
      const refreshToken = await authTokenStorage.getRefreshToken();
      
      if (!refreshToken) {
        console.error('❌ [Auth] No refresh token available');
        return {
          success: false,
          error: 'No refresh token available',
        };
      }

      // For test account, always return success
      if (!FEATURES.USE_REAL_AUTH && refreshToken === 'test-refresh-token') {
        return {
          success: true,
          data: {
            token: 'test-token-refreshed',
            refreshToken: 'test-refresh-token'
          }
        };
      }

      // Make refresh request without going through the regular API client
      // to avoid infinite loops when access token is expired
      const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://clarity-pool-api.onrender.com';
      const response = await fetch(`${baseUrl}${API_ENDPOINTS.AUTH.REFRESH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`,
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: response.status === 401 ? 'Refresh token expired' : 'Failed to refresh token',
        };
      }

      const data = await response.json();
      
      // Store new tokens
      await authTokenStorage.setToken(data.token);
      if (data.refreshToken) {
        await authTokenStorage.setRefreshToken(data.refreshToken);
      }

      console.log('✅ [Auth] Token refresh successful');
      return {
        success: true,
        data: {
          token: data.token,
          refreshToken: data.refreshToken,
        },
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: 'Network error during token refresh',
      };
    }
  },

  async isTokenValid(): Promise<boolean> {
    console.log('🔍 [Auth] Checking token validity');
    try {
      const token = await authTokenStorage.getToken();
      if (!token) return false;

      // Try to decode JWT and check expiry (basic check)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        return payload.exp > now;
      } catch {
        // If we can't decode, assume it's valid and let the server decide
        return true;
      }
    } catch (error) {
      // Error checking token validity
      return false;
    }
  },

  async getProfile(): Promise<ApiResponse<User>> {
    return apiClient.get<User>(API_ENDPOINTS.USER.PROFILE);
  },
};