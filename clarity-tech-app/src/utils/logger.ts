type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enableDebug: boolean;
  enableInfo: boolean;
  enableWarn: boolean;
  enableError: boolean;
  enableApiLogs: boolean;
  enableAuthLogs: boolean;
  enableNavigationLogs: boolean;
  enableFormLogs: boolean;
}

// Control logging based on environment
const config: LoggerConfig = {
  enableDebug: __DEV__ && false, // Set to true when debugging specific issues
  enableInfo: __DEV__,
  enableWarn: true,
  enableError: true,
  enableApiLogs: __DEV__ && true, // Keep API logs for now
  enableAuthLogs: __DEV__ && false, // Disable auth logs - they're working fine
  enableNavigationLogs: __DEV__ && false, // Disable navigation logs
  enableFormLogs: __DEV__ && false, // Disable form logs
};

class Logger {
  private shouldLog(level: LogLevel, category?: string): boolean {
    if (!__DEV__ && level !== 'error') return false;
    
    switch (level) {
      case 'debug':
        if (!config.enableDebug) return false;
        break;
      case 'info':
        if (!config.enableInfo) return false;
        break;
      case 'warn':
        if (!config.enableWarn) return false;
        break;
      case 'error':
        if (!config.enableError) return false;
        break;
    }
    
    // Category-specific filtering
    if (category) {
      switch (category) {
        case 'api':
          return config.enableApiLogs;
        case 'auth':
          return config.enableAuthLogs;
        case 'navigation':
          return config.enableNavigationLogs;
        case 'form':
          return config.enableFormLogs;
      }
    }
    
    return true;
  }
  
  debug(message: string, data?: any, category?: string) {
    if (this.shouldLog('debug', category)) {
      console.log(`🔍 DEBUG: ${message}`, data || '');
    }
  }
  
  info(message: string, data?: any, category?: string) {
    if (this.shouldLog('info', category)) {
      console.log(`ℹ️ INFO: ${message}`, data || '');
    }
  }
  
  warn(message: string, data?: any, category?: string) {
    if (this.shouldLog('warn', category)) {
      console.warn(`⚠️ WARN: ${message}`, data || '');
    }
  }
  
  error(message: string, error?: any, category?: string) {
    if (this.shouldLog('error', category)) {
      console.error(`❌ ERROR: ${message}`, error || '');
    }
  }
  
  api(method: string, endpoint: string, data?: any) {
    if (config.enableApiLogs) {
      console.log(`🔵 [API ${method}] ${endpoint}`, data || '');
    }
  }
  
  apiError(method: string, endpoint: string, error: any) {
    if (config.enableApiLogs || config.enableError) {
      console.error(`🔴 [API ${method} Error] ${endpoint}`, error);
    }
  }
}

export const logger = new Logger();