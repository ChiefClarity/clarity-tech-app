import { syncQueue } from '../storage/queue';
import { authService } from '../api/auth';

export interface NetworkStatus {
  isConnected: boolean;
  type: string | null;
  isInternetReachable: boolean | null;
  connectionQuality: 'unknown' | 'poor' | 'moderate' | 'good' | 'excellent';
}

class WebNetworkMonitor {
  private listeners: Array<(status: NetworkStatus) => void> = [];
  private currentStatus: NetworkStatus = {
    isConnected: navigator.onLine,
    type: 'unknown',
    isInternetReachable: navigator.onLine,
    connectionQuality: 'good',
  };
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeouts: NodeJS.Timeout[] = [];

  initialize() {
    // Set initial status
    this.updateNetworkStatus(navigator.onLine);
    
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Determine connection type if available
    this.detectConnectionType();
  }

  destroy() {
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    
    // Clear any pending reconnect timeouts
    this.reconnectTimeouts.forEach(timeout => clearTimeout(timeout));
    this.reconnectTimeouts = [];
    
    this.listeners = [];
  }

  private updateNetworkStatus(isConnected: boolean) {
    const wasConnected = this.currentStatus.isConnected;
    
    this.currentStatus = {
      ...this.currentStatus,
      isConnected,
      isInternetReachable: isConnected,
    };

    // Notify listeners
    this.listeners.forEach(listener => listener(this.currentStatus));

    // Handle connection recovery
    if (!wasConnected && isConnected) {
      this.handleConnectionRecovered();
    } else if (wasConnected && !isConnected) {
      this.handleConnectionLost();
    }
  }

  private handleOnline() {
    this.updateNetworkStatus(true);
  }

  private handleOffline() {
    this.updateNetworkStatus(false);
  }

  private detectConnectionType() {
    // Use Network Information API if available
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      this.currentStatus.type = connection.effectiveType || connection.type || 'unknown';
      this.currentStatus.connectionQuality = this.determineConnectionQuality(connection);
      
      // Listen for connection changes
      connection.addEventListener('change', () => {
        this.currentStatus.type = connection.effectiveType || connection.type || 'unknown';
        this.currentStatus.connectionQuality = this.determineConnectionQuality(connection);
        this.listeners.forEach(listener => listener(this.currentStatus));
      });
    } else {
      // Fallback for browsers without Network Information API
      this.currentStatus.type = 'unknown';
      this.currentStatus.connectionQuality = 'good';
    }
  }

  private determineConnectionQuality(connection: any): NetworkStatus['connectionQuality'] {
    if (!navigator.onLine) {
      return 'unknown';
    }

    if (connection.effectiveType) {
      switch (connection.effectiveType) {
        case 'slow-2g':
          return 'poor';
        case '2g':
          return 'poor';
        case '3g':
          return 'moderate';
        case '4g':
          return 'good';
        case '5g':
          return 'excellent';
        default:
          return 'good';
      }
    }

    // Fallback based on connection type
    if (connection.type) {
      switch (connection.type) {
        case 'cellular':
          return 'moderate';
        case 'wifi':
          return 'good';
        case 'ethernet':
          return 'excellent';
        default:
          return 'good';
      }
    }

    return 'good';
  }

  private async handleConnectionRecovered() {
    this.reconnectAttempts = 0;
    
    try {
      // 1. Test actual connectivity
      const hasConnectivity = await this.testConnectivity();
      if (!hasConnectivity) {
        this.scheduleReconnectAttempt();
        return;
      }

      // 2. Validate auth token
      const isTokenValid = await authService.isTokenValid();
      if (!isTokenValid) {
        const refreshResult = await authService.refreshToken();
        if (!refreshResult.success) {
          return;
        }
      }

      // 3. Process offline queue
      const stats = await syncQueue.getQueueStats();
      if (stats.pending > 0 || stats.failed > 0) {
        // Retry all failed items first
        if (stats.failed > 0) {
          const retriedCount = await syncQueue.retryAllFailedItems();
        }
      }
    } catch (error) {
      this.scheduleReconnectAttempt();
    }
  }

  private handleConnectionLost() {
    // Clear any pending reconnect attempts
    this.reconnectTimeouts.forEach(timeout => clearTimeout(timeout));
    this.reconnectTimeouts = [];
    this.reconnectAttempts = 0;
  }

  private scheduleReconnectAttempt() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s
    
    const timeout = setTimeout(async () => {
      if (navigator.onLine) {
        await this.handleConnectionRecovered();
      } else {
        this.scheduleReconnectAttempt();
      }
    }, delay);
    
    this.reconnectTimeouts.push(timeout);
  }

  // Public API methods
  getCurrentStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  isConnected(): boolean {
    return this.currentStatus.isConnected;
  }

  addListener(listener: (status: NetworkStatus) => void) {
    this.listeners.push(listener);
    // Immediately call with current status
    listener(this.currentStatus);
  }

  removeListener(listener: (status: NetworkStatus) => void) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  async forceNetworkCheck(): Promise<NetworkStatus> {
    // Update with current browser status
    this.updateNetworkStatus(navigator.onLine);
    
    // Test actual connectivity
    if (navigator.onLine) {
      const hasConnectivity = await this.testConnectivity();
      if (!hasConnectivity) {
        // Browser thinks we're online but we're not
        this.currentStatus.isInternetReachable = false;
        this.listeners.forEach(listener => listener(this.currentStatus));
      }
    }
    
    return this.currentStatus;
  }

  async testConnectivity(): Promise<boolean> {
    try {
      // Try to make a simple request to test connectivity
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors', // Avoid CORS issues
      });
      return true; // If no error thrown, we have connectivity
    } catch {
      return false;
    }
  }
}

export const webNetworkMonitor = new WebNetworkMonitor();