'use server';

import type { Flight } from '@/store/useFlightStore';
import { getAmadeusToken } from '@/lib/amadeusTokenCache';
import { withRateLimit } from '@/lib/rateLimiter';
import { logError, createLogger } from '@/lib/logger';
import { API_CONFIG, PRICE_CONFIG } from '@/lib/constants';

const logger = createLogger('searchFlights');

// Amadeus API response types
export interface AmadeusSegment {
  departure: {
    at: string;
    iataCode: string;
  };
  arrival: {
    at: string;
    iataCode: string;
  };
  carrierCode: string;
  duration?: string;
}

export interface AmadeusItinerary {
  duration: string;
  segments: AmadeusSegment[];
}

export interface AmadeusPrice {
  total: string;
  currency: string;
}

export interface AmadeusFlightOffer {
  id: string;
  price: AmadeusPrice;
  itineraries: AmadeusItinerary[];
}

export interface AmadeusDictionaries {
  carriers?: Record<string, string>;
}

export interface AmadeusFlightOffersResponse {
  data: AmadeusFlightOffer[];
  dictionaries?: AmadeusDictionaries;
}

export interface SearchFlightsParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
}

export interface SearchFlightsResult {
  flights: Flight[];
  error: string | null;
}

/**
 * Validate IATA code format
 */
function validateIataCode(code: string): void {
  if (!/^[A-Z]{3}$/i.test(code)) {
    throw new Error('Invalid IATA code format');
  }
}

/**
 * Validate date format (YYYY-MM-DD)
 */
function validateDate(date: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Invalid date format');
  }
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    throw new Error('Invalid date');
  }
}

/**
 * Validate passenger counts
 */
function validatePassengers(params: SearchFlightsParams): void {
  const total = params.adults + (params.children || 0) + (params.infants || 0);
  if (total < 1 || total > 9) {
    throw new Error('Total passengers must be between 1 and 9');
  }
  if (params.adults < 1) {
    throw new Error('At least one adult is required');
  }
}

/**
 * Validate search parameters
 */
function validateSearchParams(params: SearchFlightsParams): void {
  validateIataCode(params.origin);
  validateIataCode(params.destination);
  validateDate(params.departureDate);
  if (params.returnDate) {
    validateDate(params.returnDate);
  }
  validatePassengers(params);
}

/**
 * Parse ISO duration (PT8H25M) to minutes
 */
function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  return hours * 60 + minutes;
}

/**
 * Transform Amadeus flight offer to our Flight type
 */
function transformFlightOffer(offer: AmadeusFlightOffer, dictionaries?: AmadeusDictionaries): Flight {
  const outbound = offer.itineraries[0];
  const inbound = offer.itineraries[1];
  const firstSegment = outbound.segments[0];
  const lastSegment = outbound.segments[outbound.segments.length - 1];
  
  // Get stop cities (exclude origin and destination)
  const stopCities = outbound.segments.length > 1
    ? outbound.segments.slice(0, -1).map((s) => s.arrival.iataCode)
    : [];
  
  // Get carrier name from dictionaries if available
  const carrierCode = firstSegment.carrierCode;
  const airlineName = dictionaries?.carriers?.[carrierCode] || carrierCode;
  
  return {
    id: offer.id,
    airline: airlineName,
    airlineCode: carrierCode,
    price: parseFloat(offer.price.total),
    currency: offer.price.currency,
    departureTime: firstSegment.departure.at.split('T')[1].substring(0, 5),
    arrivalTime: lastSegment.arrival.at.split('T')[1].substring(0, 5),
    duration: parseDuration(outbound.duration),
    stops: outbound.segments.length - 1,
    stopCities,
    outbound: {
      departure: firstSegment.departure.at,
      arrival: lastSegment.arrival.at,
      duration: parseDuration(outbound.duration),
    },
    inbound: inbound ? {
      departure: inbound.segments[0].departure.at,
      arrival: inbound.segments[inbound.segments.length - 1].arrival.at,
      duration: parseDuration(inbound.duration),
    } : undefined,
  };
}

/**
 * Search flights via Amadeus API
 * @param params - Search parameters
 * @returns Promise resolving to search result with flights and error
 */
async function searchFlightsInternal(params: SearchFlightsParams): Promise<SearchFlightsResult> {
  try {
    // Validate input
    validateSearchParams(params);
    
    const token = await getAmadeusToken();
    const flightOffersUrl = process.env.AMADEUS_FLIGHT_OFFERS_URL || 'https://test.api.amadeus.com/v2/shopping/flight-offers';
    
    const searchParams = new URLSearchParams({
      originLocationCode: params.origin,
      destinationLocationCode: params.destination,
      departureDate: params.departureDate,
      adults: params.adults.toString(),
      max: API_CONFIG.FLIGHT_OFFERS_LIMIT.toString(),
      currencyCode: 'USD',
    });
    
    if (params.returnDate) {
      searchParams.set('returnDate', params.returnDate);
    }
    if (params.children && params.children > 0) {
      searchParams.set('children', params.children.toString());
    }
    if (params.infants && params.infants > 0) {
      searchParams.set('infants', params.infants.toString());
    }
    
    logger.debug('Flight search request', {
      origin: params.origin,
      destination: params.destination,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
    });
    
    const response = await fetch(`${flightOffersUrl}?${searchParams}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('Flight search API error', { status: response.status, errorData });
      return { flights: [], error: 'Failed to fetch flights. Please try again.' };
    }
    
    const data: AmadeusFlightOffersResponse = await response.json();
    
    logger.debug('Flight search response', {
      origin: params.origin,
      destination: params.destination,
      flightCount: data.data?.length || 0,
    });
    
    if (!data.data || data.data.length === 0) {
      return { flights: [], error: null }; // No flights found, not an error
    }
    
    // Transform Amadeus response to our Flight type
    const flights: Flight[] = data.data.map((offer) => transformFlightOffer(offer, data.dictionaries));
    
    return { flights, error: null };
  } catch (error) {
    logError(error, 'Search flights error');
    return { flights: [], error: error instanceof Error ? error.message : 'An error occurred' };
  }
}

// Export rate-limited version
export const searchFlights = withRateLimit(searchFlightsInternal, 'searchFlights');
