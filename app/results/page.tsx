'use client';

import { useEffect, Suspense, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlightStore, type Flight } from '@/store/useFlightStore';
import { searchFlights } from '@/app/actions/searchFlights';
import { searchAirports, type AirportLocation } from '@/app/actions/amadeus';
import { PriceChart } from '@/components/PriceChart';
import { FlightCard } from '@/components/FlightCard';
import { FilterSidebar } from '@/components/FilterSidebar';
import { AirportInput } from '@/components/AirportInput';
import { PassengerSelector } from '@/components/PassengerSelector';
import { SelectedFlightSummary } from '@/components/SelectedFlightSummary';
import { FlightSelectedModal } from '@/components/FlightSelectedModal';
import { format, addDays } from 'date-fns';
import { DATE_CONFIG } from '@/lib/constants';
import { logError, createLogger } from '@/lib/logger';

const logger = createLogger('ResultsPage');

function ResultsContent() {
    const router = useRouter();
    const urlParams = useSearchParams();
    const {
        filteredFlights,
        rawFlights,
        isLoading,
        error,
        setFlights,
        setLoading,
        setError,
        setSearchParams: setStoreParams,
        searchParams: storeSearchParams,
        // Round-trip selection
        selectedOutboundFlight,
        selectedReturnFlight,
        filteredReturnFlights,
        isLoadingReturn,
        currentLeg,
        selectOutboundFlight,
        selectReturnFlight,
        setReturnFlights,
        setLoadingReturn,
        clearFlightSelections,
    } = useFlightStore();

    // URL params
    const from = urlParams.get('from');
    const to = urlParams.get('to');
    const date = urlParams.get('date');
    const returnDate = urlParams.get('return');
    const tripTypeParam = urlParams.get('tripType') as 'one-way' | 'round-trip' | null;
    const adultsParam = parseInt(urlParams.get('adults') || '1');
    const childrenParam = parseInt(urlParams.get('children') || '0');
    const infantsParam = parseInt(urlParams.get('infants') || '0');

    // Editable search bar state
    const [isEditing, setIsEditing] = useState(false);
    const [editOrigin, setEditOrigin] = useState<AirportLocation | null>(null);
    const [editDestination, setEditDestination] = useState<AirportLocation | null>(null);
    const [editDate, setEditDate] = useState(date || '');
    const [editReturnDate, setEditReturnDate] = useState(returnDate || '');
    const [editTripType, setEditTripType] = useState<'one-way' | 'round-trip'>(tripTypeParam || (returnDate ? 'round-trip' : 'one-way'));
    const [editAdults, setEditAdults] = useState(adultsParam);
    const [editChildren, setEditChildren] = useState(childrenParam);
    const [editInfants, setEditInfants] = useState(infantsParam);
    const [airportLoadError, setAirportLoadError] = useState<string | null>(null);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    // Manual expansion state for flight sections
    const [isOutboundExpanded, setIsOutboundExpanded] = useState(true);
    const [isReturnExpanded, setIsReturnExpanded] = useState(false);

    // Mobile flight selection modal state
    const [showFlightModal, setShowFlightModal] = useState(false);

    // Get cache functions from store
    const { getCachedAirports, cacheAirports } = useFlightStore();

    // Fetch airport details - prioritize store, then cache, then API
    useEffect(() => {
        async function fetchAirportDetails() {
            if (!from || !to) return;

            // 1. First check if we already have the airports in store (from homepage)
            if (storeSearchParams.origin?.iataCode === from && storeSearchParams.destination?.iataCode === to) {
                setEditOrigin(storeSearchParams.origin);
                setEditDestination(storeSearchParams.destination);
                return;
            }

            // Helper to get airport from cache or API
            const getAirport = async (code: string): Promise<AirportLocation | null> => {
                // Check cache first
                const cached = getCachedAirports(code);
                if (cached && cached.length > 0) {
                    const match = cached.find(a => a.iataCode === code);
                    if (match) return match;
                }

                // Fall back to API only if not cached
                try {
                    const results = await searchAirports(code);
                    if (results.length > 0) {
                        // Cache the results
                        cacheAirports(code, results);
                        return results.find(a => a.iataCode === code) || results[0];
                    }
                } catch (err) {
                    logError(err, 'Airport search failed');
                }
                return null;
            };

            try {
                // Fetch origin and destination (uses cache when available)
                const [origin, dest] = await Promise.all([
                    getAirport(from),
                    getAirport(to),
                ]);

                if (origin) {
                    setEditOrigin(origin);
                } else {
                    // Create minimal airport object if not found
                    setEditOrigin({ iataCode: from, name: from, cityName: from, countryCode: '', countryName: '' });
                }

                if (dest) {
                    setEditDestination(dest);
                } else {
                    setEditDestination({ iataCode: to, name: to, cityName: to, countryCode: '', countryName: '' });
                }
            } catch (err) {
                logError(err, 'Failed to fetch airport details');
                setAirportLoadError('Failed to load airport details');
                // Use IATA codes as fallback
                setEditOrigin({ iataCode: from, name: from, cityName: from, countryCode: '', countryName: '' });
                setEditDestination({ iataCode: to, name: to, cityName: to, countryCode: '', countryName: '' });
            }
        }

        fetchAirportDetails();
    }, [from, to, storeSearchParams.origin, storeSearchParams.destination, getCachedAirports, cacheAirports]);

    // Initialize other edit state when URL params change
    useEffect(() => {
        setEditDate(date || '');
        setEditReturnDate(returnDate || '');
        setEditTripType(tripTypeParam || (returnDate ? 'round-trip' : 'one-way'));
        setEditAdults(adultsParam);
        setEditChildren(childrenParam);
        setEditInfants(infantsParam);
    }, [date, returnDate, tripTypeParam, adultsParam, childrenParam, infantsParam]);

    // Check if any changes were made
    const hasChanges = useMemo(() => {
        return (
            editOrigin?.iataCode !== from ||
            editDestination?.iataCode !== to ||
            editDate !== date ||
            editReturnDate !== (returnDate || '') ||
            editTripType !== (tripTypeParam || (returnDate ? 'round-trip' : 'one-way')) ||
            editAdults !== adultsParam ||
            editChildren !== childrenParam ||
            editInfants !== infantsParam
        );
    }, [editOrigin, editDestination, editDate, editReturnDate, editTripType, editAdults, editChildren, editInfants, from, to, date, returnDate, tripTypeParam, adultsParam, childrenParam, infantsParam]);

    const today = format(new Date(), 'yyyy-MM-dd');
    const maxDate = format(addDays(new Date(), DATE_CONFIG.MAX_DAYS_AHEAD), 'yyyy-MM-dd');
    const totalTravelers = editAdults + editChildren + editInfants;
    const isRoundTrip = editTripType === 'round-trip';

    // Apply filter changes
    const handleApplyChanges = () => {
        if (!editOrigin || !editDestination || !editDate) return;

        const params = new URLSearchParams({
            from: editOrigin.iataCode,
            to: editDestination.iataCode,
            date: editDate,
            adults: editAdults.toString(),
            tripType: editTripType,
        });
        if (editTripType === 'round-trip' && editReturnDate) {
            params.set('return', editReturnDate);
        }
        if (editChildren > 0) params.set('children', editChildren.toString());
        if (editInfants > 0) params.set('infants', editInfants.toString());

        router.push(`/results?${params.toString()}`);
        setIsEditing(false);
    };

    // Fetch flights on mount - for round-trip, fetch both directions simultaneously
    useEffect(() => {
        async function fetchFlights() {
            if (!from || !to || !date) {
                setError('Missing search parameters');
                return;
            }

            setLoading(true);

            // For round-trip, fetch both outbound AND return flights in parallel
            if (isRoundTrip && returnDate) {
                const [outboundResult, returnResult] = await Promise.all([
                    searchFlights({
                        origin: from,
                        destination: to,
                        departureDate: date,
                        adults: adultsParam,
                        children: childrenParam,
                        infants: infantsParam,
                    }),
                    searchFlights({
                        origin: to,  // Swap for return
                        destination: from,
                        departureDate: returnDate,
                        adults: adultsParam,
                        children: childrenParam,
                        infants: infantsParam,
                    }),
                ]);

                if (outboundResult.error) {
                    setError(outboundResult.error);
                } else {
                    logger.debug('Outbound flights:', outboundResult.flights.length);
                    logger.debug('Return flights:', returnResult.flights.length, returnResult.error);

                    setFlights(outboundResult.flights);
                    // Pre-load return flights
                    if (!returnResult.error) {
                        setReturnFlights(returnResult.flights);
                    } else {
                        logger.error('Return flight error:', returnResult.error);
                    }
                    // Update store with current search params
                    if (editOrigin && editDestination) {
                        setStoreParams({
                            origin: editOrigin,
                            destination: editDestination,
                            departureDate: date,
                            returnDate: returnDate,
                            tripType: 'round-trip',
                            adults: adultsParam,
                            children: childrenParam,
                            infants: infantsParam,
                        });
                    }
                }
            } else {
                // One-way trip - just fetch outbound
                const result = await searchFlights({
                    origin: from,
                    destination: to,
                    departureDate: date,
                    adults: adultsParam,
                    children: childrenParam,
                    infants: infantsParam,
                });

                if (result.error) {
                    setError(result.error);
                } else {
                    setFlights(result.flights);
                    if (editOrigin && editDestination) {
                        setStoreParams({
                            origin: editOrigin,
                            destination: editDestination,
                            departureDate: date,
                            returnDate: '',
                            tripType: 'one-way',
                            adults: adultsParam,
                            children: childrenParam,
                            infants: infantsParam,
                        });
                    }
                }
            }
            setLoading(false);
        }

        // Clear any previous selections when search changes
        clearFlightSelections();
        fetchFlights();
    }, [from, to, date, returnDate, adultsParam, childrenParam, infantsParam, isRoundTrip]);

    // Handle flight selection (outbound or return)
    const handleFlightSelect = useCallback((flight: Flight) => {
        // Check if mobile (viewport width < 768px)
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

        if (isRoundTrip && !selectedOutboundFlight) {
            // Selecting outbound flight
            selectOutboundFlight(flight);
            // Collapse outbound, expand return
            setIsOutboundExpanded(false);
            setIsReturnExpanded(true);
        } else if (isRoundTrip && selectedOutboundFlight && !selectedReturnFlight) {
            // Selecting return flight - now show modal on mobile
            selectReturnFlight(flight);
            setIsReturnExpanded(false);
            if (isMobile) {
                setShowFlightModal(true);
            }
        } else {
            // One-way trip - select and show modal on mobile
            selectOutboundFlight(flight);
            if (isMobile) {
                setShowFlightModal(true);
            }
        }
    }, [isRoundTrip, selectedOutboundFlight, selectedReturnFlight, selectOutboundFlight, selectReturnFlight]);

    const cheapestPrice = rawFlights.length > 0 ? Math.min(...rawFlights.map(f => f.price)) : 0;
    const cheapestReturnPrice = filteredReturnFlights.length > 0 ? Math.min(...filteredReturnFlights.map(f => f.price)) : 0;

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                        {/* Logo */}
                        <button
                            onClick={() => router.push('/')}
                            className="text-xl font-bold bg-linear-to-r from-[#3B82F6] to-[#2563EB] bg-clip-text text-transparent cursor-pointer"
                        >
                            SkyScout
                        </button>

                        {/* Mobile Search Summary */}
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="flex md:hidden items-center gap-1.5 flex-1 justify-center bg-gray-50 py-1.5 px-3 rounded-full text-xs truncate"
                        >
                            <span className="font-medium text-gray-900 truncate">
                                {editOrigin?.cityName || from} → {editDestination?.cityName || to}
                            </span>
                            <svg
                                className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${isEditing ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Desktop Editable Search Bar */}
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="hidden md:flex items-center gap-3 flex-1 justify-center hover:bg-gray-50 py-2 px-4 rounded-xl transition-colors cursor-pointer"
                        >
                            {/* Origin */}
                            <span className="text-sm font-medium text-gray-900">
                                {editOrigin?.cityName || from}
                            </span>
                            <span className="text-gray-400">→</span>
                            {/* Destination */}
                            <span className="text-sm font-medium text-gray-900">
                                {editDestination?.cityName || to}
                            </span>
                            <span className="text-gray-300">•</span>
                            {/* Date */}
                            <span className="text-sm text-gray-600">
                                {date}
                                {returnDate && ` → ${returnDate}`}
                            </span>
                            <span className="text-gray-300">•</span>
                            {/* Travelers */}
                            <span className="text-sm text-gray-600">
                                {totalTravelers} traveler{totalTravelers > 1 ? 's' : ''}
                            </span>
                            <span className="text-gray-300">•</span>
                            {/* Trip Type */}
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                {isRoundTrip ? 'Round Trip' : 'One Way'}
                            </span>
                            {/* Chevron */}
                            <svg
                                className={`w-4 h-4 text-gray-400 transition-transform ${isEditing ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>

                    {/* Expanded Edit Bar */}
                    <AnimatePresence>
                        {isEditing && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="pt-4 pb-2">
                                    {/* Trip Type Toggle */}
                                    <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-4">
                                        {(['one-way', 'round-trip'] as const).map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setEditTripType(type)}
                                                className={`px-4 py-1.5 rounded-lg font-medium text-sm transition-all
                          ${editTripType === type
                                                        ? 'bg-white text-gray-900 shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                {type === 'one-way' ? 'One Way' : 'Round Trip'}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex flex-wrap items-end gap-3">
                                        <AirportInput
                                            label="From"
                                            placeholder="Origin"
                                            value={editOrigin}
                                            onChange={setEditOrigin}
                                            size="small"
                                        />
                                        <AirportInput
                                            label="To"
                                            placeholder="Destination"
                                            value={editDestination}
                                            onChange={setEditDestination}
                                            size="small"
                                        />
                                        <div className="shrink-0">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Departure</label>
                                            <input
                                                type="date"
                                                value={editDate}
                                                onChange={(e) => setEditDate(e.target.value)}
                                                min={today}
                                                max={maxDate}
                                                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm
                          focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none text-gray-800"
                                            />
                                        </div>
                                        {editTripType === 'round-trip' && (
                                            <div className="shrink-0">
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Return</label>
                                                <input
                                                    type="date"
                                                    value={editReturnDate}
                                                    onChange={(e) => setEditReturnDate(e.target.value)}
                                                    min={editDate || today}
                                                    max={maxDate}
                                                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm
                            focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none text-gray-800"
                                                />
                                            </div>
                                        )}
                                        <PassengerSelector
                                            adults={editAdults}
                                            children={editChildren}
                                            infants={editInfants}
                                            onChange={(a, c, i) => {
                                                setEditAdults(a);
                                                setEditChildren(c);
                                                setEditInfants(i);
                                            }}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            {hasChanges && (
                                                <motion.button
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    onClick={handleApplyChanges}
                                                    className="px-5 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-medium rounded-lg transition-colors"
                                                >
                                                    Filter
                                                </motion.button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-6">
                {isLoading ? (
                    <LoadingState />
                ) : error ? (
                    <ErrorState message={error} onRetry={() => router.refresh()} />
                ) : rawFlights.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="flex gap-6">
                        {/* Desktop Sidebar */}
                        <div className="hidden lg:block w-72 shrink-0">
                            <FilterSidebar />
                        </div>

                        {/* Results */}
                        <div className="flex-1 min-w-0">
                            {/* Results Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h1 className="text-lg font-semibold text-gray-900">
                                    {filteredFlights.length} flight{filteredFlights.length !== 1 ? 's' : ''} found
                                </h1>
                                {/* Mobile Filter Button */}
                                <button
                                    onClick={() => setIsFilterDrawerOpen(true)}
                                    className="lg:hidden flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                    Filters
                                </button>
                            </div>

                            {/* Chart */}
                            <div className="mb-6">
                                <PriceChart />
                            </div>

                            {/* Selected Flight Summary - Desktop */}
                            <SelectedFlightSummary passengerCount={totalTravelers} />

                            {/* Outbound Flights Section - Collapsible */}
                            {isRoundTrip && (
                                <div className="mb-6">
                                    <button
                                        onClick={() => {
                                            // Toggle expansion - if already selected, allow reopening to change
                                            if (selectedOutboundFlight) {
                                                setIsOutboundExpanded(!isOutboundExpanded);
                                            }
                                        }}
                                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${selectedOutboundFlight
                                            ? 'bg-[#3B82F6]/5 border-[#3B82F6]/20 cursor-pointer hover:bg-[#3B82F6]/10'
                                            : 'bg-white border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${selectedOutboundFlight ? 'bg-[#10B981] text-white' : 'bg-[#3B82F6] text-white'
                                                }`}>
                                                {selectedOutboundFlight ? '✓' : '1'}
                                            </div>
                                            <div className="text-left">
                                                <div className="text-sm font-medium text-gray-900">
                                                    Outbound · {editOrigin?.cityName || from} → {editDestination?.cityName || to}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {selectedOutboundFlight
                                                        ? `${selectedOutboundFlight.airline} · ${selectedOutboundFlight.departureTime} - Click to change`
                                                        : `${date} · ${filteredFlights.length} flights available`
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                        <svg
                                            className={`w-5 h-5 text-gray-400 transition-transform ${(!selectedOutboundFlight || isOutboundExpanded) ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    <AnimatePresence>
                                        {(!selectedOutboundFlight || isOutboundExpanded) && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="space-y-3 pt-4">
                                                    {filteredFlights.map(flight => (
                                                        <FlightCard
                                                            key={flight.id}
                                                            flight={flight}
                                                            isCheapest={flight.price === cheapestPrice}
                                                            passengerCount={totalTravelers}
                                                            isRoundTrip={false}
                                                            onSelect={(f) => {
                                                                handleFlightSelect(f);
                                                                setIsOutboundExpanded(false);
                                                                setIsReturnExpanded(true);
                                                            }}
                                                            originCode={from || ''}
                                                            destinationCode={to || ''}
                                                        />
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* One-way Flight List (non-round-trip) */}
                            {!isRoundTrip && (
                                <div className="space-y-3">
                                    {filteredFlights.map(flight => (
                                        <FlightCard
                                            key={flight.id}
                                            flight={flight}
                                            isCheapest={flight.price === cheapestPrice}
                                            passengerCount={totalTravelers}
                                            isRoundTrip={false}
                                            onSelect={handleFlightSelect}
                                            originCode={from || ''}
                                            destinationCode={to || ''}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Return Flights Section - Collapsible, expands after outbound selected */}
                            {isRoundTrip && (
                                <div className="mb-6">
                                    <button
                                        onClick={() => {
                                            // Toggle expansion - if already selected, allow reopening to change
                                            if (selectedOutboundFlight && selectedReturnFlight) {
                                                setIsReturnExpanded(!isReturnExpanded);
                                            }
                                        }}
                                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${!selectedOutboundFlight
                                            ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'
                                            : selectedReturnFlight
                                                ? 'bg-[#3B82F6]/5 border-[#3B82F6]/20 cursor-pointer hover:bg-[#3B82F6]/10'
                                                : 'bg-white border-gray-200'
                                            }`}
                                        disabled={!selectedOutboundFlight}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${selectedReturnFlight ? 'bg-[#10B981] text-white' :
                                                selectedOutboundFlight ? 'bg-[#3B82F6] text-white' : 'bg-gray-300 text-white'
                                                }`}>
                                                {selectedReturnFlight ? '✓' : '2'}
                                            </div>
                                            <div className="text-left">
                                                <div className="text-sm font-medium text-gray-900">
                                                    Return · {editDestination?.cityName || to} → {editOrigin?.cityName || from}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {selectedReturnFlight
                                                        ? `${selectedReturnFlight.airline} · ${selectedReturnFlight.departureTime} - Click to change`
                                                        : `${returnDate} · ${filteredReturnFlights.length} flights available`
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                        <svg
                                            className={`w-5 h-5 text-gray-400 transition-transform ${(selectedOutboundFlight && !selectedReturnFlight) || isReturnExpanded ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    <AnimatePresence>
                                        {selectedOutboundFlight && (!selectedReturnFlight || isReturnExpanded) && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="space-y-3 pt-4">
                                                    {filteredReturnFlights.length > 0 ? (
                                                        filteredReturnFlights.map(flight => (
                                                            <FlightCard
                                                                key={flight.id}
                                                                flight={flight}
                                                                isCheapest={flight.price === cheapestReturnPrice}
                                                                passengerCount={totalTravelers}
                                                                isRoundTrip={false}
                                                                onSelect={(f) => {
                                                                    handleFlightSelect(f);
                                                                    setIsReturnExpanded(false);
                                                                }}
                                                                originCode={to || ''}
                                                                destinationCode={from || ''}
                                                            />
                                                        ))
                                                    ) : (
                                                        <div className="text-center py-8 bg-white rounded-2xl border border-gray-100">
                                                            <p className="text-gray-500">No return flights available</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {filteredFlights.length === 0 && rawFlights.length > 0 && (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 mb-4">No flights match your filters</p>
                                    <button
                                        onClick={() => useFlightStore.getState().resetFilters()}
                                        className="text-[#3B82F6] hover:text-[#2563EB] font-medium"
                                    >
                                        Reset Filters
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Mobile Filter Drawer */}
            <AnimatePresence>
                {isFilterDrawerOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsFilterDrawerOpen(false)}
                            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
                        />
                        {/* Drawer */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white z-50 lg:hidden overflow-y-auto shadow-2xl"
                        >
                            {/* Drawer Header */}
                            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
                                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                                <button
                                    onClick={() => setIsFilterDrawerOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            {/* Filter Content */}
                            <div className="p-4">
                                <FilterSidebar />
                            </div>
                            {/* Apply Button */}
                            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
                                <button
                                    onClick={() => setIsFilterDrawerOpen(false)}
                                    className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium py-3 rounded-xl transition-colors"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Mobile Flight Selection Modal */}
            <FlightSelectedModal
                outboundFlight={selectedOutboundFlight}
                returnFlight={selectedReturnFlight}
                isOpen={showFlightModal}
                onClose={() => setShowFlightModal(false)}
                passengerCount={totalTravelers}
                originCode={from || ''}
                originCity={editOrigin?.cityName || from || ''}
                destinationCode={to || ''}
                destinationCity={editDestination?.cityName || to || ''}
                isRoundTrip={isRoundTrip}
            />
        </div>
    );
}

function LoadingState() {
    return (
        <div className="flex gap-6">
            <div className="hidden lg:block w-72 shrink-0">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-20 mb-5" />
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-4 bg-gray-100 rounded" />
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex-1">
                <div className="h-8 bg-gray-200 rounded w-40 mb-6 animate-pulse" />
                <div className="bg-white rounded-2xl border border-gray-100 h-[300px] mb-6 animate-pulse" />
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 h-32 animate-pulse" />
                    ))}
                </div>
            </div>
        </div>
    );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
        >
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">{message}</p>
            <button
                onClick={onRetry}
                className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
                Try Again
            </button>
        </motion.div>
    );
}

function EmptyState() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
        >
            <div className="text-5xl mb-4">✈️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No flights found</h2>
            <p className="text-gray-500 max-w-md mx-auto">
                We couldn&apos;t find any flights for this route. Try different dates or destinations.
            </p>
        </motion.div>
    );
}

export default function ResultsPage() {
    return (
        <Suspense fallback={<LoadingState />}>
            <ResultsContent />
        </Suspense>
    );
}
