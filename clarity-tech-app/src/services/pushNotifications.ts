import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PUSH_TOKEN_KEY = '@clarity_push_token';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationService {
  requestPermissions: () => Promise<boolean>;
  getPushToken: () => Promise<string | null>;
  registerForPushNotifications: () => Promise<string | null>;
  scheduleLocalNotification: (title: string, body: string, data?: any) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
}

class PushNotificationServiceImpl implements PushNotificationService {
  private pushToken: string | null = null;

  async requestPermissions(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permission not granted');
        return false;
      }

      // Additional Android configuration
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('offers', {
          name: 'Offer Notifications',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
        });

        await Notifications.setNotificationChannelAsync('sync', {
          name: 'Sync Notifications',
          importance: Notifications.AndroidImportance.LOW,
          sound: 'default',
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting push notification permissions:', error);
      return false;
    }
  }

  async getPushToken(): Promise<string | null> {
    try {
      if (this.pushToken) {
        return this.pushToken;
      }

      // Try to load from storage first
      const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      if (storedToken) {
        this.pushToken = storedToken;
        return storedToken;
      }

      // Generate new token
      if (!Device.isDevice) {
        console.warn('Push tokens only work on physical devices');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'your-project-id',
      });

      this.pushToken = tokenData.data;

      // Store token
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, this.pushToken);

      return this.pushToken;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  async registerForPushNotifications(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const token = await this.getPushToken();
      if (!token) {
        return null;
      }

      // [API-INTEGRATION: Push - Priority 3]
      // TODO: POST /api/notifications/register-token
      // await apiClient.post('/notifications/register-token', { 
      //   token, 
      //   platform: Platform.OS,
      //   preferences: defaultNotificationPrefs 
      // });

      console.log('Push notification token registered:', token);
      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  async scheduleLocalNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: 'default',
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error scheduling local notification:', error);
    }
  }

  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }
}

// Singleton instance
export const pushNotificationService = new PushNotificationServiceImpl();

// Notification types for different scenarios
export const NotificationTemplates = {
  NEW_OFFER: (customerName: string, routeProximity: number) => ({
    title: 'New Onboarding Offer',
    body: `${customerName} is ${routeProximity} miles from your route`,
    data: { type: 'new_offer', customerName, routeProximity },
  }),

  OFFER_EXPIRING: (customerName: string, minutesLeft: number) => ({
    title: 'Offer Expiring Soon',
    body: `Offer for ${customerName} expires in ${minutesLeft} minutes`,
    data: { type: 'offer_expiring', customerName, minutesLeft },
  }),

  OFFER_EXPIRED: (customerName: string) => ({
    title: 'Offer Expired',
    body: `The offer for ${customerName} has expired`,
    data: { type: 'offer_expired', customerName },
  }),

  SYNC_COMPLETED: (successCount: number, failCount: number) => ({
    title: 'Sync Complete',
    body: `${successCount} actions synced${failCount > 0 ? `, ${failCount} failed` : ''}`,
    data: { type: 'sync_completed', successCount, failCount },
  }),

  UNDO_REMINDER: (customerName: string, timeLeft: string) => ({
    title: 'Undo Available',
    body: `You can still undo accepting ${customerName} for ${timeLeft}`,
    data: { type: 'undo_reminder', customerName, timeLeft },
  }),
};

// Hook for handling notification responses
export const useNotificationHandler = () => {
  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    
    switch (data.type) {
      case 'new_offer':
        // Navigate to offers screen
        // navigation.navigate('Offers');
        break;
      case 'offer_expiring':
      case 'offer_expired':
        // Show offer details
        break;
      case 'sync_completed':
        // Show sync status
        break;
      case 'undo_reminder':
        // Show undo option
        break;
      default:
        console.log('Unknown notification type:', data.type);
    }
  };

  return { handleNotificationResponse };
};

// Example usage in OfferContext:
/*
// When a new offer arrives:
if (shouldNotify) {
  const template = NotificationTemplates.NEW_OFFER(offer.customerName, offer.routeProximity);
  await pushNotificationService.scheduleLocalNotification(
    template.title, 
    template.body, 
    template.data
  );
}

// When offer is about to expire (schedule this when offer is created):
const expirationWarning = new Date(offer.expiresAt.getTime() - 5 * 60 * 1000); // 5 minutes before
await Notifications.scheduleNotificationAsync({
  content: {
    ...NotificationTemplates.OFFER_EXPIRING(offer.customerName, 5),
  },
  trigger: { date: expirationWarning },
});
*/