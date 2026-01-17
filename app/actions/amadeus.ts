'use server';

import { getAmadeusToken } from '@/lib/amadeusTokenCache';
import { withRateLimit } from '@/lib/rateLimiter';
import { logError, createLogger } from '@/lib/logger';
import { API_CONFIG, INPUT_VALIDATION } from '@/lib/constants';

const logger = createLogger('amadeus');

// Amadeus API response types
export interface AmadeusLocationData {
  iataCode: string;
  name: string;
  address?: {
    cityName?: string;
    countryCode?: string;
    countryName?: string;
  };
}

export interface AmadeusLocationResponse {
  data: AmadeusLocationData[];
}

export interface AirportLocation {
  iataCode: string;
  name: string;
  cityName: string;
  countryCode: string;
  countryName: string;
}

/**
 * Validate airport search keyword
 * @param keyword - The search keyword
 * @throws Error if keyword is invalid
 */
function validateKeyword(keyword: string): void {
  if (keyword.length < INPUT_VALIDATION.MIN_KEYWORD_LENGTH) {
    throw new Error(`Keyword must be at least ${INPUT_VALIDATION.MIN_KEYWORD_LENGTH} characters`);
  }
  if (keyword.length > INPUT_VALIDATION.MAX_KEYWORD_LENGTH) {
    throw new Error(`Keyword must be at most ${INPUT_VALIDATION.MAX_KEYWORD_LENGTH} characters`);
  }
  if (!INPUT_VALIDATION.KEYWORD_PATTERN.test(keyword)) {
    throw new Error('Keyword contains invalid characters');
  }
}

/**
 * Transform Amadeus location data to our AirportLocation format
 */
function transformLocation(loc: AmadeusLocationData): AirportLocation {
  return {
    iataCode: loc.iataCode,
    name: loc.name,
    cityName: loc.address?.cityName || loc.name,
    countryCode: loc.address?.countryCode || '',
    countryName: loc.address?.countryName || '',
  };
}

/**
 * Search airports and cities via Amadeus API
 * @param keyword - Search keyword (city name or airport code)
 * @returns Promise resolving to array of airport locations
 */
async function searchAirportsInternal(keyword: string): Promise<AirportLocation[]> {
  // Validate input
  validateKeyword(keyword);
  
  const token = await getAmadeusToken();
  const locationsUrl = process.env.AMADEUS_LOCATIONS_URL || 'https://test.api.amadeus.com/v1/reference-data/locations';
  
  const response = await fetch(
    `${locationsUrl}?subType=AIRPORT,CITY&keyword=${encodeURIComponent(keyword)}&page[limit]=${API_CONFIG.PAGE_LIMIT}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Airport search API error', { status: response.status, errorText });
    throw new Error(`Failed to search airports: ${response.status} ${response.statusText}`);
  }
  
  const data: AmadeusLocationResponse = await response.json();
  
  if (!data.data || data.data.length === 0) {
    return [];
  }
  
  return data.data.map(transformLocation);
}

// Export rate-limited version
export const searchAirports = withRateLimit(searchAirportsInternal, 'searchAirports');
