import { webNetworkMonitor } from '../network/webNetworkMonitor';
import { offlineStorage, OfflineQueueItem } from './offline';
import { apiClient } from '../api/client';
import { QueueStats } from '../../types/api';

class SyncQueue {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Array<(stats: QueueStats) => void> = [];

  async startSync() {
    // Listen for connectivity changes
    try {
      webNetworkMonitor.addListener(state => {
        if (state.isConnected && !this.isSyncing) {
          this.processQueue();
        }
      });
    } catch (error) {
      console.warn('Network monitoring not available in queue service, using fallback', error);
    }

    // Process queue every 30 seconds if online
    this.syncInterval = setInterval(() => {
      this.processQueue();
    }, 30000);

    // Initial sync
    this.processQueue();
  }

  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private async processQueue() {
    if (this.isSyncing) return;

    try {
      const netInfo = webNetworkMonitor.getCurrentStatus();
      if (!netInfo.isConnected) return;
    } catch (error) {
      // Assume connected on web if NetInfo fails
      console.warn('Network status check failed, assuming connected');
    }

    this.isSyncing = true;

    try {
      const queue = await offlineStorage.getQueue();
      
      for (const item of queue) {
        if (item.retries >= 3) {
          // Move to failed items for manual retry
          const errorMessage = 'Maximum retries exceeded';
          await offlineStorage.moveToFailed(item, errorMessage);
          console.log(`Item ${item.id} moved to failed queue after 3 retries`);
          continue;
        }

        try {
          await this.processQueueItem(item);
          await offlineStorage.removeFromQueue(item.id);
          console.log(`Successfully synced item ${item.id}`);
        } catch (error) {
          console.error('Error processing queue item:', error);
          
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          // Update retry count and last retry timestamp
          await offlineStorage.updateQueueItem(item.id, {
            retries: item.retries + 1,
            lastRetryAt: Date.now(),
            errorMessage,
          });
        }
      }
      
      // Notify listeners about queue changes
      this.notifyListeners();
    } catch (error) {
      console.error('Error in processQueue:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async processQueueItem(item: OfflineQueueItem) {
    switch (item.type) {
      case 'create':
        return apiClient.post(item.endpoint, item.data);
      case 'update':
        return apiClient.put(item.endpoint, item.data);
      case 'upload':
        return apiClient.upload(item.endpoint, item.data);
      default:
        throw new Error(`Unknown queue item type: ${item.type}`);
    }
  }

  async addToQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retries'>) {
    await offlineStorage.saveToQueue(item);
    
    // Notify listeners
    this.notifyListeners();
    
    // Try to process immediately if online
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      this.processQueue();
    }
  }

  async retryFailedItem(id: string): Promise<boolean> {
    const success = await offlineStorage.retryFailedItem(id);
    if (success) {
      this.notifyListeners();
      // Try to process immediately if online
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        this.processQueue();
      }
    }
    return success;
  }

  async retryAllFailedItems(): Promise<number> {
    const retriedCount = await offlineStorage.retryAllFailedItems();
    if (retriedCount > 0) {
      this.notifyListeners();
      // Try to process immediately if online
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        this.processQueue();
      }
    }
    return retriedCount;
  }

  async getQueueStats() {
    return await offlineStorage.getQueueStats();
  }

  async getFailedItems() {
    return await offlineStorage.getFailedItems();
  }

  async clearFailedItems() {
    await offlineStorage.clearFailedItems();
    this.notifyListeners();
  }

  // Listener management for UI components to react to queue changes
  addListener(listener: (stats: QueueStats) => void) {
    this.listeners.push(listener);
    // Immediately provide current stats
    this.getQueueStats().then(listener);
  }

  removeListener(listener: (stats: QueueStats) => void) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private async notifyListeners() {
    const stats = await this.getQueueStats();
    this.listeners.forEach(listener => listener(stats));
  }
}

export const syncQueue = new SyncQueue();