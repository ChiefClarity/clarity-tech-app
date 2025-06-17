import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/api';
import { User, ApiResponse } from '../../types';
import { authTokenStorage } from '../storage/secureStorage';
import { FEATURES } from '../../config/featureFlags';

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
    // [API-INTEGRATION: Auth - Priority 1]
    // TODO: POST /api/auth/technician/login
    
    // Test account bypass for development
    if (credentials.email === 'test@claritypool.com' && credentials.password === 'test123') {
      const mockTechUser: User = {
        id: 'test-user-1',
        email: 'test@claritypool.com',
        firstName: 'Test',
        lastName: 'Technician',
        role: 'technician',
        displayName: 'Test Technician'
      };
      
      console.log('[MOCK AUTH] Test user login successful');
      return {
        success: true,
        data: {
          user: mockTechUser,
          token: 'test-token',
          refreshToken: 'test-refresh-token'
        }
      };
    }
    
    if (FEATURES.USE_REAL_AUTH) {
      return apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
    } else {
      // Mock for development - reject non-test accounts
      return {
        success: false,
        error: 'Invalid credentials (use test@claritypool.com / test123 for demo)'
      };
    }
  },

  async logout(): Promise<ApiResponse<void>> {
    // [API-INTEGRATION: Auth - Priority 1]
    // TODO: POST /api/auth/technician/logout
    return apiClient.post<void>(API_ENDPOINTS.AUTH.LOGOUT);
  },

  async refreshToken(): Promise<ApiResponse<RefreshTokenResponse>> {
    // [API-INTEGRATION: Auth - Priority 1]
    // TODO: POST /api/auth/technician/refresh
    try {
      const refreshToken = await authTokenStorage.getRefreshToken();
      
      if (!refreshToken) {
        return {
          success: false,
          error: 'No refresh token available',
        };
      }

      // Make refresh request without going through the regular API client
      // to avoid infinite loops when access token is expired
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL || 'https://clarity-pool-api.onrender.com'}${API_ENDPOINTS.AUTH.REFRESH}`, {
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

      return {
        success: true,
        data: {
          token: data.token,
          refreshToken: data.refreshToken,
        },
      };
    } catch (error) {
      console.error('Error refreshing token:', error);
      return {
        success: false,
        error: 'Network error during token refresh',
      };
    }
  },

  async isTokenValid(): Promise<boolean> {
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
      console.error('Error checking token validity:', error);
      return false;
    }
  },

  async getProfile(): Promise<ApiResponse<User>> {
    return apiClient.get<User>(API_ENDPOINTS.USER.PROFILE);
  },
};