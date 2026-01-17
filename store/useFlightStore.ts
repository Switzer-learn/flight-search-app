'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AirportLocation } from '@/app/actions/amadeus';

// Types
export interface SearchParams {
  origin: AirportLocation | null;
  destination: AirportLocation | null;
  departureDate: string;
  returnDate: string;
  tripType: 'one-way' | 'round-trip';
  adults: number;
  children: number;
  infants: number;
}

export interface Flight {
  id: string;
  airline: string;
  airlineCode: string;
  price: number;
  currency: string;
  departureTime: string;
  arrivalTime: string;
  duration: number; // in minutes
  stops: number;
  stopCities: string[];
  outbound: {
    departure: string;
    arrival: string;
    duration: number;
  };
  inbound?: {
    departure: string;
    arrival: string;
    duration: number;
  };
}

export interface Filters {
  stops: 'any' | 'direct' | '1' | '2+';
  priceRange: [number, number];
  airlines: string[];
  departureTime: string[]; // 'morning', 'afternoon', 'evening', 'night'
}

export type SortOption = 'best' | 'cheapest' | 'fastest' | 'earliest' | 'latest';

// Airport cache - stores search results by keyword
interface AirportCache {
  [keyword: string]: AirportLocation[];
}

interface FlightStore {
  // State
  searchParams: SearchParams;
  rawFlights: Flight[];
  filteredFlights: Flight[];
  filters: Filters;
  sortOption: SortOption;
  isLoading: boolean;
  error: string | null;
  chartView: 'time' | 'duration';
  highlightedFlightId: string | null;
  
  // Round-trip selection state
  selectedOutboundFlight: Flight | null;
  selectedReturnFlight: Flight | null;
  returnFlights: Flight[];
  filteredReturnFlights: Flight[];
  isLoadingReturn: boolean;
  currentLeg: 'outbound' | 'return';
  
  // Airport Cache
  airportCache: AirportCache;
  defaultAirports: AirportLocation[];
  defaultAirportsFetched: boolean;
  recommendations: unknown[];  // Legacy - not used
  recommendationsFetched: boolean;
  
  // Actions
  setSearchParams: (params: Partial<SearchParams>) => void;
  setFlights: (flights: Flight[]) => void;
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
  setSortOption: (option: SortOption) => void;
  setChartView: (view: 'time' | 'duration') => void;
  setLoading: (loading: boolean) => void;
  setHighlightedFlight: (id: string | null) => void;
  setError: (error: string | null) => void;
  
  // Round-trip selection actions
  selectOutboundFlight: (flight: Flight) => void;
  selectReturnFlight: (flight: Flight) => void;
  setReturnFlights: (flights: Flight[]) => void;
  setLoadingReturn: (loading: boolean) => void;
  clearFlightSelections: () => void;
  deselectOutbound: () => void;
  deselectReturn: () => void;
  
  // Airport Cache Actions
  cacheAirports: (keyword: string, airports: AirportLocation[]) => void;
  getCachedAirports: (keyword: string) => AirportLocation[] | null;
  setDefaultAirports: (airports: AirportLocation[]) => void;
  setRecommendations: (recs: unknown[]) => void;
}

const defaultFilters: Filters = {
  stops: 'any',
  priceRange: [0, 10000],
  airlines: [],
  departureTime: [],
};

const defaultSearchParams: SearchParams = {
  origin: null,
  destination: null,
  departureDate: '',
  returnDate: '',
  tripType: 'one-way',
  adults: 1,
  children: 0,
  infants: 0,
};

// Helper: Apply filters and sorting
function applyFiltersAndSort(flights: Flight[], filters: Filters, sortOption: SortOption): Flight[] {
  let result = [...flights];
  
  // Filter by stops
  if (filters.stops !== 'any') {
    result = result.filter(f => {
      if (filters.stops === 'direct') return f.stops === 0;
      if (filters.stops === '1') return f.stops <= 1;
      if (filters.stops === '2+') return f.stops >= 2;
      return true;
    });
  }
  
  // Filter by price range
  result = result.filter(f => f.price >= filters.priceRange[0] && f.price <= filters.priceRange[1]);
  
  // Filter by airlines
  if (filters.airlines.length > 0) {
    result = result.filter(f => filters.airlines.includes(f.airline));
  }
  
  // Filter by departure time
  if (filters.departureTime.length > 0) {
    result = result.filter(f => {
      const hour = parseInt(f.departureTime.split(':')[0]);
      const period = hour >= 5 && hour < 12 ? 'morning' :
                     hour >= 12 && hour < 18 ? 'afternoon' :
                     hour >= 18 && hour < 24 ? 'evening' : 'night';
      return filters.departureTime.includes(period);
    });
  }
  
  // Sort
  switch (sortOption) {
    case 'cheapest':
      result.sort((a, b) => a.price - b.price);
      break;
    case 'fastest':
      result.sort((a, b) => a.duration - b.duration);
      break;
    case 'earliest':
      result.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
      break;
    case 'latest':
      result.sort((a, b) => b.departureTime.localeCompare(a.departureTime));
      break;
    default: // 'best' - price weighted with duration
      result.sort((a, b) => (a.price + a.duration * 0.5) - (b.price + b.duration * 0.5));
  }
  
  return result;
}

// Move highlighted flight to top
function applyHighlight(flights: Flight[], highlightedId: string | null): Flight[] {
  if (!highlightedId) return flights;
  const highlighted = flights.find(f => f.id === highlightedId);
  if (!highlighted) return flights;
  return [highlighted, ...flights.filter(f => f.id !== highlightedId)];
}

export const useFlightStore = create<FlightStore>()(
  persist(
    (set, get) => ({
  searchParams: defaultSearchParams,
  rawFlights: [],
  filteredFlights: [],
  filters: defaultFilters,
  sortOption: 'best',
  isLoading: false,
  error: null,
  chartView: 'time',
  highlightedFlightId: null,
  
  // Round-trip selection state
  selectedOutboundFlight: null,
  selectedReturnFlight: null,
  returnFlights: [],
  filteredReturnFlights: [],
  isLoadingReturn: false,
  currentLeg: 'outbound',
  
  // Airport & Recommendations Cache
  airportCache: {},
  defaultAirports: [],
  defaultAirportsFetched: false,
  recommendations: [],
  recommendationsFetched: false,
  
  setSearchParams: (params) => set((state) => ({
    searchParams: { ...state.searchParams, ...params }
  })),
  
  setFlights: (flights) => set((state) => {
    const priceRange: [number, number] = flights.length > 0 
      ? [Math.floor(Math.min(...flights.map(f => f.price)) / 10) * 10,
         Math.ceil(Math.max(...flights.map(f => f.price)) / 10) * 10]
      : [0, 10000];
    
    const newFilters = { ...state.filters, priceRange };
    return {
      rawFlights: flights,
      filteredFlights: applyFiltersAndSort(flights, newFilters, state.sortOption),
      filters: newFilters,
      error: null,
    };
  }),
  
  setFilters: (newFilters) => set((state) => {
    const filters = { ...state.filters, ...newFilters };
    return {
      filters,
      filteredFlights: applyFiltersAndSort(state.rawFlights, filters, state.sortOption),
    };
  }),
  
  resetFilters: () => set((state) => {
    const priceRange: [number, number] = state.rawFlights.length > 0
      ? [Math.floor(Math.min(...state.rawFlights.map(f => f.price)) / 10) * 10,
         Math.ceil(Math.max(...state.rawFlights.map(f => f.price)) / 10) * 10]
      : [0, 10000];
    const filters = { ...defaultFilters, priceRange };
    return {
      filters,
      filteredFlights: applyFiltersAndSort(state.rawFlights, filters, state.sortOption),
    };
  }),
  
  setSortOption: (sortOption) => set((state) => ({
    sortOption,
    filteredFlights: applyFiltersAndSort(state.rawFlights, state.filters, sortOption),
  })),
  
  setChartView: (chartView) => set({ chartView }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setHighlightedFlight: (id) => set((state) => ({
    highlightedFlightId: id,
    filteredFlights: applyHighlight(
      applyFiltersAndSort(state.rawFlights, state.filters, state.sortOption),
      id
    ),
  })),
  
  setError: (error) => set({ error, isLoading: false }),
  
  // Round-trip selection actions
  selectOutboundFlight: (flight) => set({
    selectedOutboundFlight: flight,
    currentLeg: 'return',
  }),
  
  selectReturnFlight: (flight) => set({
    selectedReturnFlight: flight,
  }),
  
  setReturnFlights: (flights) => set((state) => {
    // Apply filters but DON'T use the outbound price range - return flights have different prices
    const returnPriceRange: [number, number] = flights.length > 0 
      ? [Math.floor(Math.min(...flights.map(f => f.price)) / 10) * 10,
         Math.ceil(Math.max(...flights.map(f => f.price)) / 10) * 10]
      : [0, 10000];
    
    // Use filters with return-specific price range
    const returnFilters = { ...state.filters, priceRange: returnPriceRange };
    const filteredReturnFlights = applyFiltersAndSort(flights, returnFilters, state.sortOption);
    
    return {
      returnFlights: flights,
      filteredReturnFlights,
      isLoadingReturn: false,
    };
  }),
  
  setLoadingReturn: (isLoadingReturn) => set({ isLoadingReturn }),
  
  clearFlightSelections: () => set({
    selectedOutboundFlight: null,
    selectedReturnFlight: null,
    returnFlights: [],
    filteredReturnFlights: [],
    currentLeg: 'outbound',
  }),
  
  deselectOutbound: () => set({
    selectedOutboundFlight: null,
    selectedReturnFlight: null,
    returnFlights: [],
    filteredReturnFlights: [],
    currentLeg: 'outbound',
  }),
  
  deselectReturn: () => set({
    selectedReturnFlight: null,
  }),
  
  // Airport Cache Actions
  cacheAirports: (keyword, airports) => set((state) => ({
    airportCache: { ...state.airportCache, [keyword.toLowerCase()]: airports }
  })),
  
  getCachedAirports: (keyword) => {
    const cache = get().airportCache;
    return cache[keyword.toLowerCase()] || null;
  },
  
  setDefaultAirports: (airports) => set({
    defaultAirports: airports,
    defaultAirportsFetched: true,
  }),
  
    setRecommendations: (recs) => set({
      recommendations: recs,
      recommendationsFetched: true,
    }),
  }),
  {
    name: 'flight-store',
    storage: createJSONStorage(() => localStorage),
    // Only persist airport cache data - not flights or selections
    partialize: (state) => ({
      airportCache: state.airportCache,
      defaultAirports: state.defaultAirports,
      defaultAirportsFetched: state.defaultAirportsFetched,
    }),
  }
  )
);
