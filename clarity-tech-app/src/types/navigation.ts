/**
 * Navigation-specific types
 * Provides type safety for React Navigation
 */

import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import { 
  RootStackParamList, 
  AuthStackParamList, 
  BottomTabParamList, 
  OnboardingStackParamList 
} from '../constants/routes';

// Root Stack Navigation
export type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;

// Auth Stack Navigation
export type AuthStackNavigationProp = StackNavigationProp<AuthStackParamList>;
export type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;
export type LoginScreenRouteProp = RouteProp<AuthStackParamList, 'Login'>;

// Bottom Tab Navigation
export type BottomTabNavigationProp = BottomTabNavigationProp<BottomTabParamList>;
export type DashboardNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'Dashboard'>,
  RootStackNavigationProp
>;

// Onboarding Navigation
export type OnboardingStackNavigationProp = StackNavigationProp<OnboardingStackParamList>;
export type OnboardingFlowNavigationProp = CompositeNavigationProp<
  StackNavigationProp<RootStackParamList, 'OnboardingFlow'>,
  RootStackNavigationProp
>;

// Screen props interfaces
export interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
  route: LoginScreenRouteProp;
}

export interface DashboardScreenProps {
  navigation: DashboardNavigationProp;
}

export interface OnboardingFlowScreenProps {
  navigation: OnboardingFlowNavigationProp;
  route: RouteProp<RootStackParamList, 'OnboardingFlow'>;
}

// Navigation state types
export interface NavigationState {
  key: string;
  index: number;
  routeNames: string[];
  history?: Array<{ type: string; key?: string }>;
  routes: Array<{
    key: string;
    name: string;
    params?: Record<string, unknown>;
  }>;
  type: string;
  stale: boolean;
}

// Deep linking types
export interface DeepLinkConfig {
  screens: Record<string, string | DeepLinkConfig>;
}

// Navigation options
export interface ScreenOptions {
  title?: string;
  headerShown?: boolean;
  presentation?: 'modal' | 'card' | 'transparentModal';
  gestureEnabled?: boolean;
  animationEnabled?: boolean;
}

// Tab bar options
export interface TabBarOptions {
  tabBarLabel?: string;
  tabBarIcon?: (props: {
    focused: boolean;
    color: string;
    size: number;
  }) => React.ReactNode;
  tabBarBadge?: string | number;
  tabBarAccessibilityLabel?: string;
}

// Navigation events
export type NavigationEventMap = {
  focus: { data: undefined };
  blur: { data: undefined };
  state: { data: { state: NavigationState } };
  beforeRemove: { data: { action: { type: string; payload?: unknown } } };
};