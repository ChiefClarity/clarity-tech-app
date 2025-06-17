import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authTokenStorage } from '../services/storage/secureStorage';
import { authService } from '../services/api/auth';
import { STORAGE_KEYS } from '../constants/storage';
import { User, AuthState } from '../types';
import { logger } from '../utils/logger';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  checkAuthStatus: () => Promise<void>;
  setAuthenticated: (user: User, token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await authTokenStorage.getToken();
      const userStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);

      logger.auth.debug('checkAuthStatus', {
        token: token ? 'EXISTS' : 'NULL',
        user: userStr ? 'EXISTS' : 'NULL'
      });

      if (token && userStr) {
        const user = JSON.parse(userStr) as User;
        logger.auth.info('Setting authenticated = true', {
          user: user.displayName || `${user.firstName} ${user.lastName}`,
          email: user.email
        });
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        logger.auth.info('Setting authenticated = false');
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      logger.auth.error('Error checking auth status', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const login = useCallback(async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const response = await authService.login({ email, password });

      if (response.success && response.data) {
        const { user, token } = response.data;

        // Save auth data (tokens in secure storage, user data in regular storage)
        await authTokenStorage.setToken(token);
        if (response.data.refreshToken) {
          await authTokenStorage.setRefreshToken(response.data.refreshToken);
        }
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

        if (rememberMe) {
          await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
        }

        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });

        return { success: true };
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      logger.auth.error('Login error', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, []);

  const logout = useCallback(async () => {
    logger.auth.info('Logout initiated');
    
    try {
      await authService.logout();
      logger.auth.debug('Logout API call successful');
    } catch (error) {
      logger.auth.error('Logout API error', error);
    }

    // Clear auth token from secure storage
    await authTokenStorage.clearAllTokens();
    
    // Clear other auth related data from regular storage
    const keysToRemove = [
      STORAGE_KEYS.USER_DATA, 
      STORAGE_KEYS.REMEMBER_ME,
      // Legacy keys that might exist
      'authToken',
      'technicianId',
      'technicianName',
      '@clarity_auth_token',
      '@clarity_user_data',
      '@clarity_remember_me'
    ];
    
    logger.auth.debug('Clearing storage keys', { keys: keysToRemove });
    await AsyncStorage.multiRemove(keysToRemove);

    logger.auth.info('Logout complete - setting authenticated = false');
    
    // Small delay to ensure storage operations complete, then update auth state
    setTimeout(() => {
      setAuthState(prevState => {
        logger.auth.debug('Logout state update', {
          from: { isAuthenticated: prevState.isAuthenticated, user: prevState.user?.email },
          to: { isAuthenticated: false, user: null }
        });
        return {
          user: null,
          isAuthenticated: false,
          isLoading: false,
        };
      });
      
    }, 50);
  }, []);

  const updateUser = useCallback((user: User) => {
    setAuthState(prev => ({ ...prev, user }));
    AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  }, []);

  const setAuthenticated = useCallback((user: User, token: string) => {
    logger.auth.info('Setting authenticated state', {
      user: user.email,
      token: token ? 'EXISTS' : 'NULL'
    });
    
    // Force a state update by using functional setState
    setAuthState(prevState => {
      logger.auth.debug('Auth state update', {
        from: { isAuthenticated: prevState.isAuthenticated, user: prevState.user?.email },
        to: { isAuthenticated: true, user: user.email }
      });
      return {
        user,
        isAuthenticated: true,
        isLoading: false,
      };
    });
  }, []);

  const value = {
    ...authState,
    login,
    logout,
    updateUser,
    checkAuthStatus,
    setAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};