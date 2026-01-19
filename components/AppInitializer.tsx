'use client';

import { useEffect } from 'react';
import { searchAirports } from '@/app/actions/amadeus';
import { useFlightStore } from '@/store/useFlightStore';
import { logError, createLogger } from '@/lib/logger';

const logger = createLogger('AppInitializer');

/**
 * AppInitializer - Fetches airports from Amadeus API on first app load
 */
export function AppInitializer() {
    const {
        defaultAirportsFetched,
        setDefaultAirports,
        setError,
    } = useFlightStore();

    useEffect(() => {
        // Fetch airports on first load
        if (!defaultAirportsFetched) {
            async function fetchAirports() {
                try {
                    // Fetch airports with a single broad API call to minimize rate limiting
                    // The Amadeus API returns up to 100 results per call
                    const unique = await searchAirports('air');

                    if (unique.length > 0) {
                        setDefaultAirports(unique);
                    } else {
                        // API returned no data
                        setError('Failed to load airport data from Amadeus API');
                    }
                } catch (error) {
                    logError(error, 'Failed to fetch default airports');
                    setError('Failed to connect to Amadeus API. Please check your API credentials.');
                }
            }
            fetchAirports();
        }
    }, [defaultAirportsFetched, setDefaultAirports, setError]);

    // This component renders nothing - it just initializes data
    return null;
}
