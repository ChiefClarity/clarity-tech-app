/**
 * Service Worker Registration and Management
 * Handles PWA functionality, offline support, and push notifications
 */

/**
 * Configuration for service worker
 */
export interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

/**
 * Register service worker for PWA functionality
 */
export const registerServiceWorker = async (config: ServiceWorkerConfig = {}): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported in this browser');
    return;
  }

  try {
    console.log('Service Worker: Registering...');
    
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service Worker: Registered successfully', registration);

    // Handle service worker updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New content available
            console.log('Service Worker: New content available');
            config.onUpdate?.(registration);
          } else {
            // Content cached for first time
            console.log('Service Worker: Content cached for offline use');
            config.onSuccess?.(registration);
          }
        }
      });
    });

    // Listen for service worker messages
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    // Setup network status listeners
    setupNetworkListeners(config);

    // Register for background sync if supported
    if ('sync' in window.ServiceWorkerRegistration.prototype) {
      const syncRegistration = registration as any;
      await syncRegistration.sync.register('offline-sync');
      console.log('Service Worker: Background sync registered');
    }

  } catch (error) {
    console.error('Service Worker: Registration failed', error);
  }
};

/**
 * Unregister service worker
 */
export const unregisterServiceWorker = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    await Promise.all(
      registrations.map(registration => registration.unregister())
    );
    
    console.log('Service Worker: Unregistered successfully');
  } catch (error) {
    console.error('Service Worker: Unregistration failed', error);
  }
};

/**
 * Update service worker to latest version
 */
export const updateServiceWorker = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      console.log('Service Worker: Update check completed');
    }
  } catch (error) {
    console.error('Service Worker: Update failed', error);
  }
};

/**
 * Skip waiting and activate new service worker
 */
export const skipWaitingAndActivate = (): void => {
  if (!navigator.serviceWorker.controller) return;

  navigator.serviceWorker.controller.postMessage({
    type: 'SKIP_WAITING',
  });
};

/**
 * Handle messages from service worker
 */
const handleServiceWorkerMessage = (event: MessageEvent): void => {
  const { type, data } = event.data;

  switch (type) {
    case 'SYNC_OFFLINE_QUEUE':
      console.log('Service Worker: Offline sync requested');
      // Trigger offline queue sync in main thread
      window.dispatchEvent(new CustomEvent('sw-sync-offline-queue', { detail: data }));
      break;

    default:
      console.log('Service Worker: Unknown message type', type);
  }
};

/**
 * Setup network status listeners
 */
const setupNetworkListeners = (config: ServiceWorkerConfig): void => {
  const handleOnline = (): void => {
    console.log('Network: Connection restored');
    config.onOnline?.();
    
    // Trigger background sync when coming back online
    triggerBackgroundSync();
  };

  const handleOffline = (): void => {
    console.log('Network: Connection lost');
    config.onOffline?.();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Initial status check
  if (!navigator.onLine) {
    handleOffline();
  }
};

/**
 * Trigger background sync manually
 */
export const triggerBackgroundSync = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    
    if ('sync' in registration) {
      const syncRegistration = registration as any;
      await syncRegistration.sync.register('offline-sync');
      console.log('Service Worker: Background sync triggered');
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
};

/**
 * Request push notification permission
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('Push notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  console.log('Notification permission:', permission);
  
  return permission;
};

/**
 * Subscribe to push notifications
 */
export const subscribeToPushNotifications = async (): Promise<PushSubscription | null> => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const permission = await requestNotificationPermission();

    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    // Get existing subscription or create new one
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription with VAPID key
      const vapidPublicKey = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY || '';
      
      if (!vapidPublicKey) {
        console.warn('VAPID public key not configured');
        return null;
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      console.log('Push notification: New subscription created');
    } else {
      console.log('Push notification: Using existing subscription');
    }

    return subscription;
  } catch (error) {
    console.error('Push notification subscription failed', error);
    return null;
  }
};

/**
 * Unsubscribe from push notifications
 */
export const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log('Push notification: Unsubscribed successfully');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Push notification unsubscription failed', error);
    return false;
  }
};

/**
 * Send message to service worker
 */
export const sendMessageToServiceWorker = (message: any): void => {
  if (!navigator.serviceWorker.controller) return;

  navigator.serviceWorker.controller.postMessage(message);
};

/**
 * Clear all caches
 */
export const clearServiceWorkerCache = (): void => {
  sendMessageToServiceWorker({
    type: 'CLEAR_CACHE',
  });
};

/**
 * Update cache with new data
 */
export const updateServiceWorkerCache = (url: string, response: any): void => {
  sendMessageToServiceWorker({
    type: 'CACHE_UPDATE',
    data: { url, response },
  });
};

/**
 * Check if app is running as PWA
 */
export const isPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true ||
         document.referrer.includes('android-app://');
};

/**
 * Check if device supports PWA installation
 */
export const canInstallPWA = (): boolean => {
  return 'beforeinstallprompt' in window;
};

/**
 * Helper function to convert VAPID key
 */
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

/**
 * Get network status information
 */
export const getNetworkStatus = (): {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
} => {
  const connection = (navigator as any).connection ||
                    (navigator as any).mozConnection ||
                    (navigator as any).webkitConnection;

  return {
    online: navigator.onLine,
    effectiveType: connection?.effectiveType,
    downlink: connection?.downlink,
    rtt: connection?.rtt,
  };
};

/**
 * Default configuration for common use cases
 */
export const defaultServiceWorkerConfig: ServiceWorkerConfig = {
  onUpdate: (registration) => {
    // Show update notification to user
    console.log('App update available. Please refresh to get the latest version.');
  },
  onSuccess: (registration) => {
    console.log('App is ready for offline use.');
  },
  onOffline: () => {
    console.log('App is running in offline mode.');
  },
  onOnline: () => {
    console.log('App is back online.');
  },
};