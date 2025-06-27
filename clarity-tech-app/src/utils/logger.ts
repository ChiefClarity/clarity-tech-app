/**
 * Logger utility that only logs in development mode
 * In production builds, all logging is stripped out for performance
 */

import { LogData } from '../types/api';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: LogData[];
  timestamp: number;
}

class Logger {
  private isDevelopment = __DEV__;
  private logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR;
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private log(level: LogLevel, message: string, ...data: LogData[]) {
    if (!this.isDevelopment && level < LogLevel.ERROR) {
      return;
    }

    if (level < this.logLevel) {
      return;
    }

    const logEntry: LogEntry = {
      level,
      message,
      data: data.length > 0 ? data : undefined,
      timestamp: Date.now(),
    };

    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (this.isDevelopment) {
      const timestamp = new Date().toISOString().slice(11, 23);
      const levelStr = LogLevel[level];
      
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(`[${timestamp}] 🔍 ${levelStr}:`, message, ...data);
          break;
        case LogLevel.INFO:
          console.info(`[${timestamp}] ℹ️ ${levelStr}:`, message, ...data);
          break;
        case LogLevel.WARN:
          console.warn(`[${timestamp}] ⚠️ ${levelStr}:`, message, ...data);
          break;
        case LogLevel.ERROR:
          console.error(`[${timestamp}] ❌ ${levelStr}:`, message, ...data);
          break;
      }
    }
  }

  debug(message: string, ...data: LogData[]) {
    this.log(LogLevel.DEBUG, message, ...data);
  }

  info(message: string, ...data: LogData[]) {
    this.log(LogLevel.INFO, message, ...data);
  }

  warn(message: string, ...data: LogData[]) {
    this.log(LogLevel.WARN, message, ...data);
  }

  error(message: string, ...data: LogData[]) {
    this.log(LogLevel.ERROR, message, ...data);
  }

  // CRITICAL: Add nested syntax support for backward compatibility
  auth = {
    debug: (message: string, ...data: LogData[]) => this.debug(`[AUTH] ${message}`, ...data),
    info: (message: string, ...data: LogData[]) => this.info(`[AUTH] ${message}`, ...data),
    warn: (message: string, ...data: LogData[]) => this.warn(`[AUTH] ${message}`, ...data),
    error: (message: string, ...data: LogData[]) => this.error(`[AUTH] ${message}`, ...data),
  };

  network = {
    debug: (message: string, ...data: LogData[]) => this.debug(`[NETWORK] ${message}`, ...data),
    info: (message: string, ...data: LogData[]) => this.info(`[NETWORK] ${message}`, ...data),
    warn: (message: string, ...data: LogData[]) => this.warn(`[NETWORK] ${message}`, ...data),
    error: (message: string, ...data: LogData[]) => this.error(`[NETWORK] ${message}`, ...data),
  };

  api = {
    debug: (message: string, ...data: LogData[]) => this.debug(`[API] ${message}`, ...data),
    info: (message: string, ...data: LogData[]) => this.info(`[API] ${message}`, ...data),
    warn: (message: string, ...data: LogData[]) => this.warn(`[API] ${message}`, ...data),
    error: (message: string, ...data: LogData[]) => this.error(`[API] ${message}`, ...data),
  };

  navigation = {
    debug: (message: string, ...data: LogData[]) => this.debug(`[NAV] ${message}`, ...data),
    info: (message: string, ...data: LogData[]) => this.info(`[NAV] ${message}`, ...data),
    warn: (message: string, ...data: LogData[]) => this.warn(`[NAV] ${message}`, ...data),
    error: (message: string, ...data: LogData[]) => this.error(`[NAV] ${message}`, ...data),
  };

  offline = {
    debug: (message: string, ...data: LogData[]) => this.debug(`[OFFLINE] ${message}`, ...data),
    info: (message: string, ...data: LogData[]) => this.info(`[OFFLINE] ${message}`, ...data),
    warn: (message: string, ...data: LogData[]) => this.warn(`[OFFLINE] ${message}`, ...data),
    error: (message: string, ...data: LogData[]) => this.error(`[OFFLINE] ${message}`, ...data),
  };

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  getLogsSince(timestamp: number): LogEntry[] {
    return this.logs.filter(log => log.timestamp >= timestamp);
  }

  exportLogs(): string {
    return this.logs
      .map(log => {
        const timestamp = new Date(log.timestamp).toISOString();
        const level = LogLevel[log.level];
        const data = log.data ? ` | Data: ${JSON.stringify(log.data)}` : '';
        return `[${timestamp}] ${level}: ${log.message}${data}`;
      })
      .join('\n');
  }

  setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }
}

export const logger = new Logger();

export const devLog = {
  log: (message: string, ...data: LogData[]) => logger.debug(message, ...data),
  info: (message: string, ...data: LogData[]) => logger.info(message, ...data),
  warn: (message: string, ...data: LogData[]) => logger.warn(message, ...data),
  error: (message: string, ...data: LogData[]) => logger.error(message, ...data),
};