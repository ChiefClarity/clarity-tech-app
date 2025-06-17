import React, { lazy, Suspense, useMemo } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

// Lazy load auth screens
const LoginScreen = lazy(() => import('../screens/auth/LoginScreen').then(m => ({ default: m.LoginScreen })));

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  const screenOptions = useMemo(() => ({
    headerShown: false,
    title: 'Clarity Pool Tech'
  }), []);

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen 
        name="Login" 
        options={{ title: 'Clarity Pool Tech' }}
      >
        {() => (
          <Suspense fallback={<LoadingSpinner fullScreen message="Loading..." />}>
            <LoginScreen />
          </Suspense>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};