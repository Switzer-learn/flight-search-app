'use server';

import type { Flight } from '@/store/useFlightStore';

// Token cache
let tokenCache: { token: string; expiry: number } | null = null;

async function getAmadeusToken(): Promise<string> {
  // Check cache
  if (tokenCache && Date.now() < tokenCache.expiry) {
    return tokenCache.token;
  }
  
  const clientId = process.env.AMADEUS_API_KEY;
  const clientSecret = process.env.AMADEUS_API_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Amadeus API credentials not configured');
  }
  
  const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to authenticate with Amadeus API');
  }
  
  const data = await response.json();
  tokenCache = {
    token: data.access_token,
    expiry: Date.now() + (data.expires_in - 60) * 1000, // Refresh 1 min early
  };
  
  return tokenCache.token;
}

interface SearchFlightsParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
}

interface SearchFlightsResult {
  flights: Flight[];
  error: string | null;
}

// Parse ISO duration (PT8H25M) to minutes
function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  return hours * 60 + minutes;
}

export async function searchFlights(params: SearchFlightsParams): Promise<SearchFlightsResult> {
  try {
    const token = await getAmadeusToken();
    
    const searchParams = new URLSearchParams({
      originLocationCode: params.origin,
      destinationLocationCode: params.destination,
      departureDate: params.departureDate,
      adults: params.adults.toString(),
      max: '50',
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
    
    console.log('[searchFlights] Request:', {
      origin: params.origin,
      destination: params.destination,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      fullUrl: `https://test.api.amadeus.com/v2/shopping/flight-offers?${searchParams}`
    });
    
    const response = await fetch(
      `https://test.api.amadeus.com/v2/shopping/flight-offers?${searchParams}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[searchFlights] API error:', errorData);
      return { flights: [], error: 'Failed to fetch flights. Please try again.' };
    }
    
    const data = await response.json();
    
    console.log('[searchFlights] Response:', {
      origin: params.origin,
      destination: params.destination,
      flightCount: data.data?.length || 0,
    });
    
    if (!data.data || data.data.length === 0) {
      return { flights: [], error: null }; // No flights found, not an error
    }
    
    // Transform Amadeus response to our Flight type
    // Amadeus response structure: https://developers.amadeus.com/self-service/category/flights/api-doc/flight-offers-search
    const flights: Flight[] = data.data.map((offer: any) => {
      const outbound = offer.itineraries[0];
      const inbound = offer.itineraries[1];
      const firstSegment = outbound.segments[0];
      const lastSegment = outbound.segments[outbound.segments.length - 1];
      
      // Get stop cities (exclude origin and destination)
      const stopCities = outbound.segments.length > 1
        ? outbound.segments.slice(0, -1).map((s: any) => s.arrival.iataCode)
        : [];
      
      // Get carrier name from dictionaries if available
      const carrierCode = firstSegment.carrierCode;
      const airlineName = data.dictionaries?.carriers?.[carrierCode] || carrierCode;
      
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
    });
    
    return { flights, error: null };
  } catch (error) {
    console.error('Search flights error:', error);
    return { flights: [], error: error instanceof Error ? error.message : 'An error occurred' };
  }
}
