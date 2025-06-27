import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import { AppNavigator } from './src/navigation/AppNavigator';
import { SplashScreen } from './src/components/common/SplashScreen';
import { syncQueue } from './src/services/storage/queue';
import { AuthProvider } from './src/contexts/AuthContext';
import { OfferProvider } from './src/contexts/OfferContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { webNetworkMonitor } from './src/services/network/webNetworkMonitor';
import { registerServiceWorker, defaultServiceWorkerConfig } from './src/utils/serviceWorker';
import { API_CONFIG } from './src/constants/api';

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        // Set the document title for PWA
        if (typeof document !== 'undefined') {
          document.title = 'Clarity Pool Tech';
        }
        
        // Load fonts
        await Font.loadAsync({
          Poppins_400Regular,
          Poppins_500Medium,
          Poppins_600SemiBold,
          Poppins_700Bold,
        });
        
        // Start the sync queue when app loads
        syncQueue.startSync();
        
        // Initialize web network monitor
        webNetworkMonitor.initialize();
        
        // Register service worker for PWA functionality
        if (typeof window !== 'undefined') {
          registerServiceWorker(defaultServiceWorkerConfig);
        }
        
        // Test API connection
        fetch(`${API_CONFIG.BASE_URL}/health`)
          .then(res => res.json())
          .then(data => console.log('✅ API Connected:', data))
          .catch(err => console.error('❌ API Connection Failed:', err));
          
        // Debug environment variables
        console.log('🔍 Environment Check:', {
          USE_REAL_AUTH: process.env.EXPO_PUBLIC_USE_REAL_AUTH,
          USE_REAL_OFFERS: process.env.EXPO_PUBLIC_USE_REAL_OFFERS,
          USE_REAL_ONBOARDING: process.env.EXPO_PUBLIC_USE_REAL_ONBOARDING,
          API_BASE_URL: API_CONFIG.BASE_URL,
          NODE_ENV: process.env.NODE_ENV,
        });
        
        setIsAppReady(true);
      } catch (e) {
        // Font loading error
        setIsAppReady(true);
      }
    }

    prepare();

    return () => {
      syncQueue.stopSync();
      webNetworkMonitor.destroy();
    };
  }, []);

  if (!isAppReady || showSplash) {
    return (
      <SplashScreen
        onFinish={() => {
          setShowSplash(false);
        }}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <OfferProvider>
              <StatusBar style="auto" />
              <AppNavigator />
            </OfferProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
