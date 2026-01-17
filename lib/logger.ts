/**
 * Logger Utility
 * 
 * This module provides a debug logging utility that only logs in development mode.
 * In production, all logs are no-ops to avoid console.log statements in production builds.
 */

const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined;

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log a debug message (only in development)
 */
export function debug(message: string, ...args: unknown[]): void {
  if (isDevelopment) {
    console.log(`[DEBUG] ${message}`, ...args);
  }
}

/**
 * Log an info message (only in development)
 */
export function info(message: string, ...args: unknown[]): void {
  if (isDevelopment) {
    console.info(`[INFO] ${message}`, ...args);
  }
}

/**
 * Log a warning message (only in development)
 */
export function warn(message: string, ...args: unknown[]): void {
  if (isDevelopment) {
    console.warn(`[WARN] ${message}`, ...args);
  }
}

/**
 * Log an error message (only in development)
 */
export function error(message: string, ...args: unknown[]): void {
  if (isDevelopment) {
    console.error(`[ERROR] ${message}`, ...args);
  }
}

/**
 * Log an error with optional error object
 */
export function logError(error: unknown, context?: string): void {
  if (isDevelopment) {
    const prefix = context ? `[ERROR] ${context}` : '[ERROR]';
    if (error instanceof Error) {
      console.error(prefix, error.message, error);
    } else {
      console.error(prefix, error);
    }
  }
}

/**
 * Create a scoped logger for a specific module
 */
export function createLogger(scope: string) {
  return {
    debug: (message: string, ...args: unknown[]) => debug(`[${scope}] ${message}`, ...args),
    info: (message: string, ...args: unknown[]) => info(`[${scope}] ${message}`, ...args),
    warn: (message: string, ...args: unknown[]) => warn(`[${scope}] ${message}`, ...args),
    error: (message: string, ...args: unknown[]) => error(`[${scope}] ${message}`, ...args),
  };
}
