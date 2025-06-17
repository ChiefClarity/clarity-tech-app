import React, { lazy, Suspense, useMemo, useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { theme } from '../styles/theme';
import { logger } from '../utils/logger';

// Lazy load screens for better performance
const DashboardScreen = lazy(() => import('../screens/dashboard/EnhancedDashboardScreen').then(m => ({ default: m.EnhancedDashboardScreen })));
const ProfileScreen = lazy(() => import('../screens/profile/ProfileScreen').then(m => ({ default: m.ProfileScreen })));

export type BottomTabParamList = {
  Dashboard: undefined;
  Onboardings: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

// Lazy load onboardings screen when available
const OnboardingsListScreen = lazy(() => 
  Promise.resolve({ default: () => null }) // Placeholder for now
);

// Loading component for suspended screens
const ScreenLoader = () => <LoadingSpinner fullScreen message="Loading..." />;

export const BottomTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  
  logger.navigation.debug('Safe area insets', {
    top: insets.top,
    bottom: insets.bottom,
    left: insets.left,
    right: insets.right
  });

  const getTabIcon = useCallback(({ focused, color, size, route }: {
    focused: boolean;
    color: string;
    size: number;
    route: { name: string };
  }) => {
    let iconName: keyof typeof Ionicons.glyphMap;

    if (route.name === 'Dashboard') {
      iconName = focused ? 'home' : 'home-outline';
    } else if (route.name === 'Onboardings') {
      iconName = focused ? 'list' : 'list-outline';
    } else if (route.name === 'Profile') {
      iconName = focused ? 'person' : 'person-outline';
    } else {
      iconName = 'help-outline';
    }

    return <Ionicons name={iconName} size={size} color={color} />;
  }, []);

  const tabBarStyle = useMemo(() => ({
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingBottom: insets.bottom || 20,
    paddingTop: 10,
    height: 65 + (insets.bottom || 0),
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  }), [insets.bottom]);
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: (props) => getTabIcon({ ...props, route }),
        tabBarActiveTintColor: theme.colors.blueGreen,
        tabBarInactiveTintColor: theme.colors.gray,
        tabBarStyle,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
        title: 'Clarity Pool Tech',
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        options={{
          tabBarLabel: 'Home',
          title: 'Clarity Pool Tech',
        }}
      >
        {() => (
          <Suspense fallback={<ScreenLoader />}>
            <DashboardScreen />
          </Suspense>
        )}
      </Tab.Screen>
      <Tab.Screen 
        name="Onboardings" 
        options={{
          tabBarLabel: 'Onboardings',
          title: 'Clarity Pool Tech',
        }}
      >
        {() => (
          <Suspense fallback={<ScreenLoader />}>
            <OnboardingsListScreen />
          </Suspense>
        )}
      </Tab.Screen>
      <Tab.Screen 
        name="Profile" 
        options={{
          tabBarLabel: 'Profile',
          title: 'Clarity Pool Tech',
        }}
      >
        {() => (
          <Suspense fallback={<ScreenLoader />}>
            <ProfileScreen />
          </Suspense>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
};