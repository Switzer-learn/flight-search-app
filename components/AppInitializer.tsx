'use client';

import { useEffect } from 'react';
import { searchAirports, getTravelRecommendations } from '@/app/actions/amadeus';
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

    useEffect(() => {
        // Fetch travel recommendations on first load
        if (!recommendationsFetched) {
            async function fetchRecommendations() {
                try {
                    const recs = await getTravelRecommendations(['NYC', 'LON', 'PAR'], 'US');
                    setRecommendations(recs);
                } catch (error) {
                    console.error('Failed to fetch recommendations:', error);
                    // Don't set error for recommendations - it's not critical
                    setRecommendations([]);
                }
            }
            fetchRecommendations();
        }
    }, [recommendationsFetched, setRecommendations]);

    // This component renders nothing - it just initializes data
    return null;
}
