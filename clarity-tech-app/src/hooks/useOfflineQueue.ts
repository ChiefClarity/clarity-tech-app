import { useState, useEffect, useCallback } from 'react';
import { syncQueue } from '../services/storage/queue';
import { FailedQueueItem } from '../services/storage/offline';

interface QueueStats {
  pending: number;
  failed: number;
  oldestPending?: number;
  oldestFailed?: number;
}

export const useOfflineQueue = () => {
  const [stats, setStats] = useState<QueueStats>({ pending: 0, failed: 0 });
  const [failedItems, setFailedItems] = useState<FailedQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const listener = (newStats: QueueStats) => {
      setStats(newStats);
      setIsLoading(false);
    };

    // Add listener for queue changes
    syncQueue.addListener(listener);

    // Load initial failed items
    loadFailedItems();

    return () => {
      syncQueue.removeListener(listener);
    };
  }, []);

  const loadFailedItems = useCallback(async () => {
    try {
      const items = await syncQueue.getFailedItems();
      setFailedItems(items);
    } catch (error) {
      console.error('Error loading failed items:', error);
    }
  }, []);

  const retryFailedItem = useCallback(async (itemId: string): Promise<boolean> => {
    try {
      const success = await syncQueue.retryFailedItem(itemId);
      if (success) {
        await loadFailedItems(); // Refresh failed items list
      }
      return success;
    } catch (error) {
      console.error('Error retrying failed item:', error);
      return false;
    }
  }, [loadFailedItems]);

  const retryAllFailedItems = useCallback(async (): Promise<number> => {
    try {
      const retriedCount = await syncQueue.retryAllFailedItems();
      if (retriedCount > 0) {
        await loadFailedItems(); // Refresh failed items list
      }
      return retriedCount;
    } catch (error) {
      console.error('Error retrying all failed items:', error);
      return 0;
    }
  }, [loadFailedItems]);

  const clearFailedItems = useCallback(async (): Promise<void> => {
    try {
      await syncQueue.clearFailedItems();
      await loadFailedItems(); // Refresh failed items list
    } catch (error) {
      console.error('Error clearing failed items:', error);
    }
  }, [loadFailedItems]);

  const hasFailedItems = stats.failed > 0;
  const hasPendingItems = stats.pending > 0;
  const totalItems = stats.pending + stats.failed;

  return {
    stats,
    failedItems,
    isLoading,
    hasFailedItems,
    hasPendingItems,
    totalItems,
    retryFailedItem,
    retryAllFailedItems,
    clearFailedItems,
    refreshFailedItems: loadFailedItems,
  };
};