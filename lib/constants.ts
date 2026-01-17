/**
 * Application Constants
 * 
 * This module contains all magic numbers and configuration constants
 * used throughout the application.
 */

// API Configuration
export const API_CONFIG = {
  /** Maximum number of results to fetch per API call */
  PAGE_LIMIT: 100,
  /** Maximum number of flight offers to fetch */
  FLIGHT_OFFERS_LIMIT: 50,
  /** Token expiry buffer in seconds - refresh token this many seconds before expiry */
  TOKEN_EXPIRY_BUFFER: 60,
} as const;

// Passenger Limits
export const PASSENGER_LIMITS = {
  /** Maximum total passengers allowed */
  MAX_PASSENGERS: 9,
  /** Maximum adults allowed */
  MAX_ADULTS: 9,
  /** Maximum children allowed */
  MAX_CHILDREN: 8,
  /** Maximum infants allowed */
  MAX_INFANTS: 8,
} as const;

// Price Configuration
export const PRICE_CONFIG = {
  /** Default maximum price for initial filter range */
  DEFAULT_PRICE_RANGE_MAX: 1000,
  /** Weight for duration in "best" sort algorithm */
  PRICE_DURATION_WEIGHT: 0.5,
  /** Minimum price difference for slider handles */
  MIN_PRICE_GAP: 10,
} as const;

// Date Configuration
export const DATE_CONFIG = {
  /** Maximum days in advance to search for flights */
  MAX_DAYS_AHEAD: 365,
  /** Default days ahead for departure date */
  DEFAULT_DEPARTURE_DAYS_AHEAD: 7,
  /** Default days ahead for return date */
  DEFAULT_RETURN_DAYS_AHEAD: 14,
} as const;

// Input Validation
export const INPUT_VALIDATION = {
  /** Minimum keyword length for airport search */
  MIN_KEYWORD_LENGTH: 2,
  /** Maximum keyword length for airport search */
  MAX_KEYWORD_LENGTH: 100,
  /** Valid characters for airport keyword */
  KEYWORD_PATTERN: /^[a-zA-Z0-9\s\-']+$/,
  /** IATA code pattern (3 letters) */
  IATA_CODE_PATTERN: /^[A-Z]{3}$/,
} as const;

// Rate Limiting
export const RATE_LIMIT = {
  /** Maximum requests per second per endpoint */
  MAX_REQUESTS_PER_SECOND: 5,
  /** Time window in milliseconds for rate limiting */
  TIME_WINDOW_MS: 1000,
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  /** Maximum number of airport cache entries to persist in localStorage */
  MAX_AIRPORT_CACHE_ENTRIES: 50,
} as const;

// Responsive Breakpoints (for reference, matches Tailwind defaults)
export const BREAKPOINTS = {
  /** Mobile breakpoint */
  SM: 640,
  /** Tablet breakpoint */
  MD: 768,
  /** Desktop breakpoint */
  LG: 1024,
  /** Large desktop breakpoint */
  XL: 1280,
} as const;
