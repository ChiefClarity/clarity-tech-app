import { useState, useEffect } from 'react';
import { webNetworkMonitor } from '../services/network/webNetworkMonitor';

export const useOffline = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    const handleNetworkChange = (status: any) => {
      setIsOffline(!status.isConnected);
      setIsInternetReachable(status.isInternetReachable ?? true);
    };

    // Add listener
    webNetworkMonitor.addListener(handleNetworkChange);

    // Check initial state
    const currentStatus = webNetworkMonitor.getCurrentStatus();
    setIsOffline(!currentStatus.isConnected);
    setIsInternetReachable(currentStatus.isInternetReachable ?? true);

    return () => {
      webNetworkMonitor.removeListener(handleNetworkChange);
    };
  }, []);

  return {
    isOffline,
    isOnline: !isOffline,
    isInternetReachable,
  };
};