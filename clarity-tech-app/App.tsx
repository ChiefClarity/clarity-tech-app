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
        
        setIsAppReady(true);
      } catch (e) {
        console.warn(e);
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
    console.log('App: Showing splash screen', { isAppReady, showSplash });
    return (
      <SplashScreen
        onFinish={() => {
          console.log('App: Splash screen finished');
          setShowSplash(false);
        }}
      />
    );
  }

  console.log('App: Rendering main app');

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
