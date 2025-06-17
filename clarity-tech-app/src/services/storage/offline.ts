import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../constants/storage';
import { OnboardingData } from '../../types';

export interface OfflineQueueItem {
  id: string;
  type: 'create' | 'update' | 'upload' | 'delete';
  endpoint: string;
  data: any;
  timestamp: number;
  retries: number;
  lastRetryAt?: number;
  failedAt?: number;
  errorMessage?: string;
}

export interface FailedQueueItem extends OfflineQueueItem {
  failedAt: number;
  errorMessage: string;
}

class OfflineStorage {
  async saveToQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    try {
      const queue = await this.getQueue();
      const newItem: OfflineQueueItem = {
        ...item,
        id: `${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
        retries: 0,
      };
      queue.push(newItem);
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving to offline queue:', error);
    }
  }

  async getQueue(): Promise<OfflineQueueItem[]> {
    try {
      const queueStr = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      return queueStr ? JSON.parse(queueStr) : [];
    } catch (error) {
      console.error('Error getting offline queue:', error);
      return [];
    }
  }

  async removeFromQueue(id: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const filtered = queue.filter(item => item.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing from offline queue:', error);
    }
  }

  async updateQueueItem(id: string, updates: Partial<OfflineQueueItem>): Promise<void> {
    try {
      const queue = await this.getQueue();
      const index = queue.findIndex(item => item.id === id);
      if (index !== -1) {
        queue[index] = { ...queue[index], ...updates };
        await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
      }
    } catch (error) {
      console.error('Error updating queue item:', error);
    }
  }

  async saveDraft(draft: Partial<OnboardingData>): Promise<void> {
    try {
      const drafts = await this.getDrafts();
      const id = draft.customerId || `draft_${Date.now()}`;
      drafts[id] = { ...draft, createdAt: new Date().toISOString() };
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_DRAFTS, JSON.stringify(drafts));
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }

  async getDrafts(): Promise<Record<string, Partial<OnboardingData>>> {
    try {
      const draftsStr = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_DRAFTS);
      return draftsStr ? JSON.parse(draftsStr) : {};
    } catch (error) {
      console.error('Error getting drafts:', error);
      return {};
    }
  }

  async removeDraft(id: string): Promise<void> {
    try {
      const drafts = await this.getDrafts();
      delete drafts[id];
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_DRAFTS, JSON.stringify(drafts));
    } catch (error) {
      console.error('Error removing draft:', error);
    }
  }

  async moveToFailed(item: OfflineQueueItem, errorMessage: string): Promise<void> {
    try {
      const failedItems = await this.getFailedItems();
      const failedItem: FailedQueueItem = {
        ...item,
        failedAt: Date.now(),
        errorMessage,
      };
      failedItems.push(failedItem);
      await AsyncStorage.setItem(STORAGE_KEYS.FAILED_QUEUE, JSON.stringify(failedItems));
      
      // Remove from regular queue
      await this.removeFromQueue(item.id);
    } catch (error) {
      console.error('Error moving item to failed queue:', error);
    }
  }

  async getFailedItems(): Promise<FailedQueueItem[]> {
    try {
      const failedStr = await AsyncStorage.getItem(STORAGE_KEYS.FAILED_QUEUE);
      return failedStr ? JSON.parse(failedStr) : [];
    } catch (error) {
      console.error('Error getting failed items:', error);
      return [];
    }
  }

  async retryFailedItem(id: string): Promise<boolean> {
    try {
      const failedItems = await this.getFailedItems();
      const itemIndex = failedItems.findIndex(item => item.id === id);
      
      if (itemIndex === -1) {
        return false;
      }
      
      const item = failedItems[itemIndex];
      
      // Move back to regular queue with reset retries
      const retryItem: OfflineQueueItem = {
        ...item,
        retries: 0,
        lastRetryAt: Date.now(),
        failedAt: undefined,
        errorMessage: undefined,
      };
      
      await this.saveToQueue(retryItem);
      
      // Remove from failed queue
      failedItems.splice(itemIndex, 1);
      await AsyncStorage.setItem(STORAGE_KEYS.FAILED_QUEUE, JSON.stringify(failedItems));
      
      return true;
    } catch (error) {
      console.error('Error retrying failed item:', error);
      return false;
    }
  }

  async retryAllFailedItems(): Promise<number> {
    try {
      const failedItems = await this.getFailedItems();
      let retriedCount = 0;
      
      for (const item of failedItems) {
        const success = await this.retryFailedItem(item.id);
        if (success) {
          retriedCount++;
        }
      }
      
      return retriedCount;
    } catch (error) {
      console.error('Error retrying all failed items:', error);
      return 0;
    }
  }

  async clearFailedItems(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.FAILED_QUEUE);
    } catch (error) {
      console.error('Error clearing failed items:', error);
    }
  }

  async getQueueStats(): Promise<{
    pending: number;
    failed: number;
    oldestPending?: number;
    oldestFailed?: number;
  }> {
    try {
      const [queue, failedItems] = await Promise.all([
        this.getQueue(),
        this.getFailedItems(),
      ]);
      
      const oldestPending = queue.length > 0 
        ? Math.min(...queue.map(item => item.timestamp))
        : undefined;
        
      const oldestFailed = failedItems.length > 0
        ? Math.min(...failedItems.map(item => item.failedAt))
        : undefined;
      
      return {
        pending: queue.length,
        failed: failedItems.length,
        oldestPending,
        oldestFailed,
      };
    } catch (error) {
      console.error('Error getting queue stats:', error);
      return { pending: 0, failed: 0 };
    }
  }

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.OFFLINE_QUEUE,
        STORAGE_KEYS.FAILED_QUEUE,
        STORAGE_KEYS.ONBOARDING_DRAFTS,
      ]);
    } catch (error) {
      console.error('Error clearing offline storage:', error);
    }
  }
}

export const offlineStorage = new OfflineStorage();