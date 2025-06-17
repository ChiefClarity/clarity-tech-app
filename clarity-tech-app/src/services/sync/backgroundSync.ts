/**
 * Background Sync Service
 * Handles offline queue synchronization with background sync API
 */

import { offlineStorage, OfflineQueueItem } from '../storage/offline';
import { apiClient } from '../api/client';
import { triggerBackgroundSync } from '../../utils/serviceWorker';
import { errorHandler } from '../../utils/errorHandler';

export interface SyncResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
}

export interface SyncProgress {
  total: number;
  processed: number;
  current?: OfflineQueueItem;
}

/**
 * Background sync service for handling offline queue
 */
class BackgroundSyncService {
  private isProcessing = false;
  private syncListeners: Array<(progress: SyncProgress) => void> = [];
  private completionListeners: Array<(result: SyncResult) => void> = [];

  constructor() {
    this.setupServiceWorkerListener();
    this.setupNetworkListener();
  }

  /**
   * Setup service worker message listener
   */
  private setupServiceWorkerListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('sw-sync-offline-queue', () => {
        this.processOfflineQueue();
      });
    }
  }

  /**
   * Setup network status listener
   */
  private setupNetworkListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        // Delay sync to allow network to stabilize
        setTimeout(() => {
          this.processOfflineQueue();
        }, 1000);
      });
    }
  }

  /**
   * Process offline queue items
   */
  async processOfflineQueue(): Promise<SyncResult> {
    if (this.isProcessing) {
      console.log('Sync already in progress, skipping...');
      return { success: false, processed: 0, failed: 0, errors: [] };
    }

    this.isProcessing = true;
    console.log('Background Sync: Starting offline queue processing');

    const result: SyncResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
    };

    try {
      const queue = await offlineStorage.getQueue();
      
      if (queue.length === 0) {
        console.log('Background Sync: No items in queue');
        return result;
      }

      console.log(`Background Sync: Processing ${queue.length} items`);

      // Sort by timestamp (oldest first)
      const sortedQueue = queue.sort((a, b) => a.timestamp - b.timestamp);

      for (let i = 0; i < sortedQueue.length; i++) {
        const item = sortedQueue[i];
        
        // Notify listeners of progress
        this.notifyProgressListeners({
          total: sortedQueue.length,
          processed: i,
          current: item,
        });

        try {
          const success = await this.processQueueItem(item);
          
          if (success) {
            await offlineStorage.removeFromQueue(item.id);
            result.processed++;
            console.log(`Background Sync: Item ${item.id} processed successfully`);
          } else {
            result.failed++;
            result.errors.push({
              id: item.id,
              error: 'Processing failed',
            });
          }
        } catch (error: any) {
          console.error(`Background Sync: Failed to process item ${item.id}`, error);
          
          const appError = errorHandler.handleError(error, 'background-sync');
          
          // Move to failed queue after max retries
          if (item.retries >= 3) {
            await offlineStorage.moveToFailed(item, appError.message);
            console.log(`Background Sync: Item ${item.id} moved to failed queue`);
          } else {
            // Increment retry count
            await offlineStorage.updateQueueItem(item.id, {
              retries: item.retries + 1,
              lastRetryAt: Date.now(),
              errorMessage: appError.message,
            });
          }
          
          result.failed++;
          result.errors.push({
            id: item.id,
            error: appError.message,
          });
        }
      }

      // Final progress notification
      this.notifyProgressListeners({
        total: sortedQueue.length,
        processed: sortedQueue.length,
      });

      console.log(`Background Sync: Completed. Processed: ${result.processed}, Failed: ${result.failed}`);
      
    } catch (error: any) {
      console.error('Background Sync: Queue processing failed', error);
      result.success = false;
      const appError = errorHandler.handleError(error, 'background-sync');
      result.errors.push({
        id: 'queue-processing',
        error: appError.message,
      });
    } finally {
      this.isProcessing = false;
      this.notifyCompletionListeners(result);
    }

    return result;
  }

  /**
   * Process individual queue item
   */
  private async processQueueItem(item: OfflineQueueItem): Promise<boolean> {
    try {
      console.log(`Processing queue item: ${item.type} ${item.endpoint}`);

      const response = await this.makeApiRequest(item);
      
      if (response && response.success) {
        console.log(`Queue item ${item.id} processed successfully`);
        return true;
      } else {
        console.error(`Queue item ${item.id} failed`, response);
        return false;
      }
    } catch (error) {
      console.error(`Queue item ${item.id} processing error`, error);
      throw error;
    }
  }

  /**
   * Make API request for queue item
   */
  private async makeApiRequest(item: OfflineQueueItem): Promise<any> {
    const { type, endpoint, data } = item;

    switch (type) {
      case 'create':
        return await apiClient.post(endpoint, data);
        
      case 'update':
        return await apiClient.put(endpoint, data);
        
      case 'upload':
        return await this.handleFileUpload(endpoint, data);
        
      case 'delete':
        return await apiClient.delete(endpoint);
        
      default:
        throw new Error(`Unsupported queue item type: ${type}`);
    }
  }

  /**
   * Handle file upload queue items
   */
  private async handleFileUpload(endpoint: string, data: any): Promise<any> {
    const formData = new FormData();
    
    // Add file data
    if (data.file) {
      if (data.file.uri) {
        // Handle React Native file structure
        formData.append('file', {
          uri: data.file.uri,
          type: data.file.type || 'image/jpeg',
          name: data.file.name || 'upload.jpg',
        } as any);
      } else {
        // Handle web file structure
        formData.append('file', data.file);
      }
    }
    
    // Add other data fields
    Object.keys(data).forEach(key => {
      if (key !== 'file') {
        formData.append(key, data[key]);
      }
    });

    return await apiClient.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Manually trigger background sync
   */
  async triggerSync(): Promise<SyncResult> {
    if (!navigator.onLine) {
      console.log('Background Sync: Device is offline, queueing for later');
      await triggerBackgroundSync();
      return { success: false, processed: 0, failed: 0, errors: [] };
    }

    return await this.processOfflineQueue();
  }

  /**
   * Add sync progress listener
   */
  addProgressListener(listener: (progress: SyncProgress) => void): void {
    this.syncListeners.push(listener);
  }

  /**
   * Remove sync progress listener
   */
  removeProgressListener(listener: (progress: SyncProgress) => void): void {
    const index = this.syncListeners.indexOf(listener);
    if (index > -1) {
      this.syncListeners.splice(index, 1);
    }
  }

  /**
   * Add sync completion listener
   */
  addCompletionListener(listener: (result: SyncResult) => void): void {
    this.completionListeners.push(listener);
  }

  /**
   * Remove sync completion listener
   */
  removeCompletionListener(listener: (result: SyncResult) => void): void {
    const index = this.completionListeners.indexOf(listener);
    if (index > -1) {
      this.completionListeners.splice(index, 1);
    }
  }

  /**
   * Notify progress listeners
   */
  private notifyProgressListeners(progress: SyncProgress): void {
    this.syncListeners.forEach(listener => {
      try {
        listener(progress);
      } catch (error) {
        console.error('Error in sync progress listener', error);
      }
    });
  }

  /**
   * Notify completion listeners
   */
  private notifyCompletionListeners(result: SyncResult): void {
    this.completionListeners.forEach(listener => {
      try {
        listener(result);
      } catch (error) {
        console.error('Error in sync completion listener', error);
      }
    });
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): {
    isProcessing: boolean;
    queueSize: Promise<number>;
    failedSize: Promise<number>;
  } {
    return {
      isProcessing: this.isProcessing,
      queueSize: offlineStorage.getQueue().then(queue => queue.length),
      failedSize: offlineStorage.getFailedItems().then(failed => failed.length),
    };
  }

  /**
   * Retry all failed items
   */
  async retryFailedItems(): Promise<number> {
    const retriedCount = await offlineStorage.retryAllFailedItems();
    
    if (retriedCount > 0) {
      console.log(`Background Sync: Retrying ${retriedCount} failed items`);
      // Trigger sync after moving items back to queue
      setTimeout(() => {
        this.processOfflineQueue();
      }, 500);
    }
    
    return retriedCount;
  }

  /**
   * Clear all failed items
   */
  async clearFailedItems(): Promise<void> {
    await offlineStorage.clearFailedItems();
    console.log('Background Sync: Failed items cleared');
  }
}

// Export singleton instance
export const backgroundSyncService = new BackgroundSyncService();