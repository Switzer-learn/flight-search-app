/**
 * Amadeus API Token Cache Utility
 * 
 * This module provides a shared token cache for Amadeus API authentication.
 * The cache stores tokens with their expiry time and automatically refreshes
 * them before they expire.
 */

export interface TokenCache {
  token: string;
  expiry: number;
}

// In-memory token cache (shared across server actions)
let tokenCache: TokenCache | null = null;

/**
 * Get a valid Amadeus API token from cache or fetch a new one
 * @returns Promise that resolves to the access token
 * @throws Error if API credentials are not configured or authentication fails
 */
export async function getAmadeusToken(): Promise<string> {
  // Check cache - return cached token if still valid
  if (tokenCache && Date.now() < tokenCache.expiry) {
    return tokenCache.token;
  }
  
  const clientId = process.env.AMADEUS_API_KEY;
  const clientSecret = process.env.AMADEUS_API_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Amadeus API credentials not configured');
  }
  
  const authUrl = process.env.AMADEUS_AUTH_URL || 'https://test.api.amadeus.com/v1/security/oauth2/token';
  
  const response = await fetch(authUrl, {
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
  
  // Cache the token with expiry (subtract buffer to refresh early)
  const tokenExpiryBuffer = parseInt(process.env.TOKEN_EXPIRY_BUFFER || '60', 10);
  tokenCache = {
    token: data.access_token,
    expiry: Date.now() + (data.expires_in - tokenExpiryBuffer) * 1000,
  };
  
  return tokenCache.token;
}

/**
 * Clear the cached token (useful for testing or forced refresh)
 */
export function clearTokenCache(): void {
  tokenCache = null;
}

/**
 * Get the current token cache status (useful for debugging)
 * @returns The current cache entry or null if not cached
 */
export function getTokenCache(): TokenCache | null {
  return tokenCache;
}
