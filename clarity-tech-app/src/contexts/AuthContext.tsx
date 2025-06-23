import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authTokenStorage } from '../services/storage/secureStorage';
import { authService } from '../services/api/auth';
import { STORAGE_KEYS } from '../constants/storage';
import { User, AuthState } from '../types';
import { logger } from '../utils/logger';
import { FEATURES } from '../config/featureFlags';
import { offlineQueue } from '../services/storage/queue';

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
  const authFailedListenerRef = useRef<((event: Event) => void) | null>(null);

  useEffect(() => {
    checkAuthStatus();
    
    // Listen for auth failure events from API client
    const handleAuthFailed = () => {
      logger.auth.info('Auth failure event received, logging out');
      logout();
    };
    
    authFailedListenerRef.current = handleAuthFailed;
    window.addEventListener('auth:failed', handleAuthFailed);
    
    return () => {
      if (authFailedListenerRef.current) {
        window.removeEventListener('auth:failed', authFailedListenerRef.current);
      }
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const token = await authTokenStorage.getToken();
      const userStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);

      logger.auth.debug('checkAuthStatus', {
        token: token ? 'EXISTS' : 'NULL',
        user: userStr ? 'EXISTS' : 'NULL',
        useRealAuth: FEATURES.USE_REAL_AUTH
      });

      if (token && userStr) {
        const user = JSON.parse(userStr) as User;
        
        // If using real auth, check if token is still valid
        if (FEATURES.USE_REAL_AUTH) {
          const isValid = await authService.isTokenValid();
          
          if (!isValid) {
            logger.auth.info('Token expired, attempting refresh');
            const refreshResult = await authService.refreshToken();
            
            if (!refreshResult.success) {
              logger.auth.warn('Token refresh failed, clearing auth');
              await authTokenStorage.clearAllTokens();
              await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
              setAuthState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
              });
              return;
            }
          }
        }
        
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
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const response = await authService.login({ email, password });

      if (response.success && response.data) {
        const { user, token } = response.data;

        // Save auth data (handled by authService for tokens)
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
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      logger.auth.error('Login error', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, []);

  const logout = useCallback(async () => {
    logger.auth.info('Logout initiated');
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // authService.logout() handles clearing all storage including offline queue
      await authService.logout();
      logger.auth.debug('Logout complete');
    } catch (error) {
      logger.auth.error('Logout error', error);
    }

    logger.auth.info('Logout complete - setting authenticated = false');
    
    // Update auth state immediately
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
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