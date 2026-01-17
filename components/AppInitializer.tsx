'use client';

import { useEffect } from 'react';
import { searchAirports } from '@/app/actions/amadeus';
import { useFlightStore } from '@/store/useFlightStore';

/**
 * AppInitializer - Fetches airports and recommendations from Amadeus API on first app load
 */
export function AppInitializer() {
    const {
        defaultAirportsFetched,
        setDefaultAirports,
        recommendationsFetched,
        setRecommendations,
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

                    // Combine and deduplicate
                    const allAirports = [...us, ...uk, ...asia];
                    const unique = allAirports.filter((airport, index, self) =>
                        index === self.findIndex(a => a.iataCode === airport.iataCode)
                    );

                    if (unique.length > 0) {
                        setDefaultAirports(unique);
                    } else {
                        // API returned no data
                        setError('Failed to load airport data from Amadeus API');
                    }
                } catch (error) {
                    console.error('Failed to fetch default airports:', error);
                    setError('Failed to connect to Amadeus API. Please check your API credentials.');
                }
            }
            fetchAirports();
        }
    }, [defaultAirportsFetched, setDefaultAirports, setError]);

    // This component renders nothing - it just initializes data
    return null;
}
