import React, { lazy, Suspense, useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { logger } from '../utils/logger';
import { MOCK_CUSTOMER, MOCK_ONBOARDING_SESSION } from '../mocks/testData';

// Lazy load navigators for better performance
const AuthNavigator = lazy(() => import('./AuthNavigator').then(m => ({ default: m.AuthNavigator })));
const BottomTabNavigator = lazy(() => import('./BottomTabNavigator').then(m => ({ default: m.BottomTabNavigator })));
const NewOnboardingFlow = lazy(() => import('../screens/onboarding/NewOnboardingFlow').then(m => ({ default: m.NewOnboardingFlow })));
const AcceptedOnboardingsScreen = lazy(() => import('../screens/onboarding/AcceptedOnboardingsScreen').then(m => ({ default: m.AcceptedOnboardingsScreen })));
const OnboardingComplete = lazy(() => 
  import('../screens/onboarding/OnboardingComplete').then(m => ({ 
    default: m.OnboardingComplete 
  }))
);

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  NewOnboardingFlow: { 
    customerId?: string;
    offerId?: string;
    customerName?: string;
    customerAddress?: string;
    customer?: any;
    session?: any;
    testMode?: boolean;
  };
  AcceptedOnboardings: undefined;
  OnboardingComplete: {
    sessionId: string;
    message: string;
  };
};

const Stack = createStackNavigator<RootStackParamList>();


export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  logger.navigation.debug('AppNavigator render', { 
    isAuthenticated, 
    isLoading,
    hasUser: !!user,
    userEmail: user?.email || 'none'
  });

  const screenOptions = useMemo(() => ({
    headerShown: false,
    title: 'Clarity Pool Tech'
  }), []);

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={screenOptions}
        initialRouteName={!isAuthenticated ? 'Auth' : 'Main'}
      >
        {/* Show Auth screen only if not authenticated */}
        {!isAuthenticated ? (
          <Stack.Screen 
            name="Auth" 
            options={{ title: 'Clarity Pool Tech' }}
          >
            {() => (
              <Suspense fallback={<LoadingSpinner fullScreen message="Loading..." />}>
                <AuthNavigator />
              </Suspense>
            )}
          </Stack.Screen>
        ) : null}
        
        {/* Show main screens if authenticated */}
        {isAuthenticated && (
          <>
            <Stack.Screen 
              name="Main" 
              options={{ title: 'Clarity Pool Tech' }}
            >
              {() => (
                <Suspense fallback={<LoadingSpinner fullScreen message="Loading..." />}>
                  <BottomTabNavigator />
                </Suspense>
              )}
            </Stack.Screen>
            <Stack.Screen 
              name="NewOnboardingFlow" 
              options={{
                presentation: 'modal',
                gestureEnabled: false,
                title: 'Clarity Pool Tech'
              }}
            >
              {() => (
                <Suspense fallback={<LoadingSpinner fullScreen message="Loading..." />}>
                  <NewOnboardingFlow />
                </Suspense>
              )}
            </Stack.Screen>
            <Stack.Screen 
              name="AcceptedOnboardings" 
              options={{
                title: 'Accepted Onboardings'
              }}
            >
              {() => (
                <Suspense fallback={<LoadingSpinner fullScreen message="Loading..." />}>
                  <AcceptedOnboardingsScreen />
                </Suspense>
              )}
            </Stack.Screen>
            <Stack.Screen 
              name="OnboardingComplete" 
              options={{
                title: 'Onboarding Complete',
                headerShown: true,
                gestureEnabled: false,
              }}
            >
              {() => (
                <Suspense fallback={<LoadingSpinner fullScreen message="Loading..." />}>
                  <OnboardingComplete />
                </Suspense>
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
