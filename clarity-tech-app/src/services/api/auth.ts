import { apiClient } from './client';
import { API_ENDPOINTS, API_CONFIG } from '../../constants/api';
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
    // FORCE REAL API - Remove all mock logic
    console.log('🔐 Attempting login to:', `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`);
    console.log('📧 Email:', credentials.email);
    
    try {
      // First, let's make a direct axios call to see what the API actually returns
      const baseUrl = API_CONFIG.BASE_URL || 'https://clarity-pool-api.onrender.com';
      const directResponse = await fetch(`${baseUrl}${API_ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      const rawData = await directResponse.json();
      console.log('📡 Direct API response:', JSON.stringify(rawData, null, 2));
      console.log('📡 Direct API response type:', typeof rawData);
      console.log('📡 Direct API response keys:', Object.keys(rawData));
      
      // Check if the response is already in ApiResponse format or needs transformation
      let response: ApiResponse<LoginResponse>;
      
      if (rawData.success !== undefined) {
        // Response is already in ApiResponse format
        response = rawData as ApiResponse<LoginResponse>;
      } else if (rawData.user && rawData.token) {
        // Response is direct LoginResponse, wrap it
        response = {
          success: true,
          data: rawData as LoginResponse
        };
      } else if (rawData.error || !directResponse.ok) {
        // Error response
        response = {
          success: false,
          error: rawData.error || rawData.message || 'Login failed'
        };
      } else {
        // Unexpected response format
        console.error('❌ Unexpected response format:', rawData);
        response = {
          success: false,
          error: 'Invalid response format from server'
        };
      }
      
      if (response.success && response.data) {
        console.log('✅ Login successful, processing response...');
        console.log('📡 Response data structure:', {
          hasData: !!response.data,
          dataKeys: Object.keys(response.data),
          hasUser: !!response.data.user,
          userKeys: response.data.user ? Object.keys(response.data.user) : 'no user object',
          hasToken: !!response.data.token,
          hasRefreshToken: !!response.data.refreshToken
        });
        
        if (response.data.user) {
          console.log('👤 Raw user data from API:', JSON.stringify(response.data.user, null, 2));
          console.log('👤 User data type:', typeof response.data.user);
          console.log('👤 User fields check:', {
            id: response.data.user.id,
            email: response.data.user.email,
            firstName: response.data.user.firstName,
            lastName: response.data.user.lastName,
            role: response.data.user.role,
            avatar: response.data.user.avatar,
            displayName: response.data.user.displayName
          });
        }
        
        // Store tokens after successful login
        await authTokenStorage.setToken(response.data.token);
        await authTokenStorage.setRefreshToken(response.data.refreshToken);
        
        // Store technician ID if available
        if (response.data.user?.id) {
          await AsyncStorage.setItem('technicianId', response.data.user.id.toString());
        }
        
        console.log('✅ Login successful, data prepared for return:', {
          success: response.success,
          hasUser: !!response.data.user,
          userId: response.data.user?.id,
          userEmail: response.data.user?.email,
          tokenStored: true
        });
      } else {
        console.error('❌ Login failed:', response.error);
        console.error('❌ Full failed response:', JSON.stringify(response, null, 2));
      }
      
      return response;
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('❌ Error type:', error?.constructor?.name);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  },

  async logout(): Promise<ApiResponse<void>> {
    console.log('🔐 [Auth] Logout initiated');
    try {
      // Always call logout endpoint - no more feature flag checks
      await apiClient.post<void>(API_ENDPOINTS.AUTH.LOGOUT);
      
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

      // Remove mock logic - always use real API

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