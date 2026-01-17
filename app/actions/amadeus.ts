'use server';

// Shared token cache
let tokenCache: { token: string; expiry: number } | null = null;

export async function getAmadeusToken(): Promise<string> {
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

// Airport/City Search API
export interface AirportLocation {
  iataCode: string;
  name: string;
  cityName: string;
  countryCode: string;
  countryName: string;
}

export async function searchAirports(keyword: string): Promise<AirportLocation[]> {
  if (!keyword || keyword.length < 2) return [];
  
  try {
    const token = await getAmadeusToken();
    
    const response = await fetch(
      `https://test.api.amadeus.com/v1/reference-data/locations?subType=AIRPORT,CITY&keyword=${encodeURIComponent(keyword)}&page[limit]=100`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    
    if (!response.ok) {
      console.error('Airport search failed:', await response.text());
      return [];
    }
    
    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      return [];
    }
    
    return data.data.map((loc: any) => ({
      iataCode: loc.iataCode,
      name: loc.name,
      cityName: loc.address?.cityName || loc.name,
      countryCode: loc.address?.countryCode || '',
      countryName: loc.address?.countryName || '',
    }));
  } catch (error) {
    console.error('Airport search error:', error);
    return [];
  }
}

