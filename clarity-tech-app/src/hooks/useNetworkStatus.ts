import { useState, useEffect } from 'react';
import { webNetworkMonitor, NetworkStatus } from '../services/network/webNetworkMonitor';

export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatus>(webNetworkMonitor.getCurrentStatus());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const listener = (newStatus: NetworkStatus) => {
      setStatus(newStatus);
      setIsLoading(false);
    };

    // Add listener
    webNetworkMonitor.addListener(listener);

    // Force initial network check
    webNetworkMonitor.forceNetworkCheck().then(() => {
      setIsLoading(false);
    });

    return () => {
      webNetworkMonitor.removeListener(listener);
    };
  }, []);

  const forceRefresh = async () => {
    setIsLoading(true);
    await webNetworkMonitor.forceNetworkCheck();
    setIsLoading(false);
  };

  const testConnectivity = async () => {
    return await webNetworkMonitor.testConnectivity();
  };

  return {
    ...status,
    isLoading,
    forceRefresh,
    testConnectivity,
    // Convenience getters
    isOnline: status.isConnected,
    isOffline: !status.isConnected,
    hasInternetAccess: status.isInternetReachable === true,
    connectionType: status.type,
    quality: status.connectionQuality,
  };
};