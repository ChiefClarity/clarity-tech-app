import { useState, useCallback } from 'react';
import { useOffline } from './useOffline';
import { syncQueue } from '../services/storage/queue';
import { ApiResponse } from '../types';
import { UseApiOptions, UseApiReturn, OfflineSyncConfig } from '../types/api';


export const useApi = <T = unknown>(options: UseApiOptions<T> = {}): UseApiReturn<T> => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);
  const { isOffline } = useOffline();

  const execute = useCallback(async (
    apiCall: () => Promise<ApiResponse<T>>,
    offlineConfig?: OfflineSyncConfig
  ) => {
    setLoading(true);
    setError(null);

    try {
      if (isOffline && options.offlineMode && offlineConfig) {
        // Queue for later sync
        await syncQueue.addToQueue(offlineConfig);
        setData(offlineConfig.data as T);
        options.onSuccess?.(offlineConfig.data);
        return { success: true, data: offlineConfig.data };
      }

      const response = await apiCall();

      if (response.success) {
        setData(response.data || null);
        options.onSuccess?.(response.data);
      } else {
        setError(response.error || 'An error occurred');
        options.onError?.(response.error || 'An error occurred');
      }

      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMsg);
      options.onError?.(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [isOffline, options]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset,
    isOffline,
  };
};