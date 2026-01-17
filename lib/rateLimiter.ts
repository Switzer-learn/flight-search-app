/**
 * Rate Limiter Utility
 * 
 * This module provides a simple in-memory rate limiter for API calls.
 * It limits the number of requests per endpoint within a time window.
 */

import { RATE_LIMIT } from './constants';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory rate limit store (keyed by endpoint)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if a request should be rate limited
 * @param endpoint - The endpoint identifier (e.g., 'searchAirports', 'searchFlights')
 * @returns true if the request should be allowed, false if rate limited
 */
export function checkRateLimit(endpoint: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(endpoint);
  
  // No entry yet, allow request
  if (!entry) {
    rateLimitStore.set(endpoint, {
      count: 1,
      resetTime: now + RATE_LIMIT.TIME_WINDOW_MS,
    });
    return true;
  }
  
  // Clean up expired entries and reset count
  if (now > entry.resetTime) {
    rateLimitStore.set(endpoint, {
      count: 1,
      resetTime: now + RATE_LIMIT.TIME_WINDOW_MS,
    });
    return true;
  }
  
  // Check if under limit
  if (entry.count < RATE_LIMIT.MAX_REQUESTS_PER_SECOND) {
    entry.count++;
    return true;
  }
  
  // Rate limit exceeded
  return false;
}

/**
 * Get the time until the rate limit resets
 * @param endpoint - The endpoint identifier
 * @returns Time in milliseconds until reset, or 0 if not rate limited
 */
export function getRateLimitResetTime(endpoint: string): number {
  const entry = rateLimitStore.get(endpoint);
  if (!entry) return 0;
  return Math.max(0, entry.resetTime - Date.now());
}

/**
 * Reset rate limit for a specific endpoint (useful for testing)
 * @param endpoint - The endpoint identifier
 */
export function resetRateLimit(endpoint: string): void {
  rateLimitStore.delete(endpoint);
}

/**
 * Clear all rate limits (useful for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Create a rate-limited version of an async function
 * @param fn - The function to rate limit
 * @param endpoint - The endpoint identifier for rate limiting
 * @returns A rate-limited version of the function
 */
export function withRateLimit<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  endpoint: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    if (!checkRateLimit(endpoint)) {
      const resetTime = getRateLimitResetTime(endpoint);
      const resetSeconds = Math.ceil(resetTime / 1000);
      throw new Error(
        `Rate limit exceeded for ${endpoint}. Please try again in ${resetSeconds} second${resetSeconds !== 1 ? 's' : ''}.`
      );
    }
    return fn(...args);
  };
}
