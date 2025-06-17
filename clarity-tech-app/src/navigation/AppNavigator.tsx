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
const OnboardingFlowScreen = lazy(() => import('../screens/onboarding/OnboardingFlowScreen').then(m => ({ default: m.OnboardingFlowScreen })));
const ModernOnboardingFlowScreen = lazy(() => import('../screens/onboarding/ModernOnboardingFlowScreen').then(m => ({ default: m.ModernOnboardingFlowScreen })));
const NewOnboardingFlow = lazy(() => import('../screens/onboarding/NewOnboardingFlow').then(m => ({ default: m.NewOnboardingFlow })));
const AcceptedOnboardingsScreen = lazy(() => import('../screens/onboarding/AcceptedOnboardingsScreen').then(m => ({ default: m.AcceptedOnboardingsScreen })));

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  OnboardingFlow: { 
    customerId?: string;
    offerId?: string;
    customerName?: string;
    customerAddress?: string;
    customer?: any;
    session?: any;
    testMode?: boolean;
  };
  ModernOnboardingFlow: { 
    customerId?: string;
    offerId?: string;
    customerName?: string;
    customerAddress?: string;
    customer?: any;
    session?: any;
    testMode?: boolean;
  };
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
};

const Stack = createStackNavigator<RootStackParamList>();

// Test mode flag - only enabled in development
const TEST_MODE = __DEV__;

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
        initialRouteName={TEST_MODE ? 'NewOnboardingFlow' : (!isAuthenticated ? 'Auth' : 'Main')}
      >
        {/* Show Auth screen only if not authenticated AND not in test mode */}
        {!isAuthenticated && !TEST_MODE ? (
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
        
        {/* Show main screens if authenticated OR in test mode */}
        {(isAuthenticated || TEST_MODE) && (
          <>
            {!TEST_MODE && (
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
            )}
            <Stack.Screen 
              name="OnboardingFlow" 
              options={{
                presentation: 'modal',
                gestureEnabled: false,
                title: 'Clarity Pool Tech'
              }}
            >
              {() => (
                <Suspense fallback={<LoadingSpinner fullScreen message="Loading..." />}>
                  <OnboardingFlowScreen />
                </Suspense>
              )}
            </Stack.Screen>
            <Stack.Screen 
              name="ModernOnboardingFlow" 
              options={{
                presentation: 'modal',
                gestureEnabled: false,
                title: 'Clarity Pool Tech'
              }}
              initialParams={TEST_MODE ? {
                customer: MOCK_CUSTOMER,
                session: MOCK_ONBOARDING_SESSION,
                testMode: true,
                customerName: MOCK_CUSTOMER.firstName + ' ' + MOCK_CUSTOMER.lastName,
                customerAddress: MOCK_CUSTOMER.address + ', ' + MOCK_CUSTOMER.city + ', ' + MOCK_CUSTOMER.state + ' ' + MOCK_CUSTOMER.zipCode,
              } : undefined}
            >
              {() => (
                <Suspense fallback={<LoadingSpinner fullScreen message="Loading..." />}>
                  <ModernOnboardingFlowScreen />
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
              initialParams={TEST_MODE ? {
                customer: MOCK_CUSTOMER,
                session: MOCK_ONBOARDING_SESSION,
                testMode: true,
                customerName: MOCK_CUSTOMER.firstName + ' ' + MOCK_CUSTOMER.lastName,
                customerAddress: MOCK_CUSTOMER.address + ', ' + MOCK_CUSTOMER.city + ', ' + MOCK_CUSTOMER.state + ' ' + MOCK_CUSTOMER.zipCode,
              } : undefined}
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
