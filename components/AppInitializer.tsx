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
                    // Fetch popular airports from different regions
                    const [us, uk, asia] = await Promise.all([
                        searchAirports('new'),
                        searchAirports('lon'),
                        searchAirports('tok'),
                    ]);

                    // Combine and deduplicate using Set for O(n) performance
                    const allAirports = [...us, ...uk, ...asia];
                    const seenIataCodes = new Set<string>();
                    const unique: typeof allAirports = [];

                    for (const airport of allAirports) {
                        if (!seenIataCodes.has(airport.iataCode)) {
                            seenIataCodes.add(airport.iataCode);
                            unique.push(airport);
                        }
                    }

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
