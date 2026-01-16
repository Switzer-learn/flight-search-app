'use client';

import { useEffect, Suspense, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlightStore } from '@/store/useFlightStore';
import { searchFlights } from '@/app/actions/searchFlights';
import { searchAirports, type AirportLocation } from '@/app/actions/amadeus';
import { PriceChart } from '@/components/PriceChart';
import { FlightCard } from '@/components/FlightCard';
import { FilterSidebar } from '@/components/FilterSidebar';
import { AirportInput } from '@/components/AirportInput';
import { PassengerSelector } from '@/components/PassengerSelector';
import { format, addDays } from 'date-fns';

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

    // Fetch airport details from Amadeus API using IATA codes
    useEffect(() => {
        async function fetchAirportDetails() {
            if (!from || !to) return;

            // Check if we already have the airports in store
            if (storeSearchParams.origin?.iataCode === from && storeSearchParams.destination?.iataCode === to) {
                setEditOrigin(storeSearchParams.origin);
                setEditDestination(storeSearchParams.destination);
                return;
            }

            try {
                // Fetch origin and destination from API
                const [originResults, destResults] = await Promise.all([
                    searchAirports(from),
                    searchAirports(to),
                ]);

                const origin = originResults.find(a => a.iataCode === from) || originResults[0];
                const dest = destResults.find(a => a.iataCode === to) || destResults[0];

                if (origin) {
                    setEditOrigin(origin);
                } else {
                    // Create minimal airport object if API doesn't return it
                    setEditOrigin({ iataCode: from, name: from, cityName: from, countryCode: '', countryName: '' });
                }

                if (dest) {
                    setEditDestination(dest);
                } else {
                    setEditDestination({ iataCode: to, name: to, cityName: to, countryCode: '', countryName: '' });
                }
            } catch (err) {
                console.error('Failed to fetch airport details:', err);
                setAirportLoadError('Failed to load airport details');
                // Use IATA codes as fallback
                setEditOrigin({ iataCode: from, name: from, cityName: from, countryCode: '', countryName: '' });
                setEditDestination({ iataCode: to, name: to, cityName: to, countryCode: '', countryName: '' });
            }
        }

        fetchAirportDetails();
    }, [from, to, storeSearchParams.origin, storeSearchParams.destination]);

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
    const maxDate = format(addDays(new Date(), 365), 'yyyy-MM-dd');
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

    // Fetch flights on mount
    useEffect(() => {
        async function fetchFlights() {
            if (!from || !to || !date) {
                setError('Missing search parameters');
                return;
            }

            setLoading(true);
            const result = await searchFlights({
                origin: from,
                destination: to,
                departureDate: date,
                returnDate: returnDate || undefined,
                adults: adultsParam,
                children: childrenParam,
                infants: infantsParam,
            });

            if (result.error) {
                setError(result.error);
            } else {
                setFlights(result.flights);
                // Update store with current search params
                if (editOrigin && editDestination) {
                    setStoreParams({
                        origin: editOrigin,
                        destination: editDestination,
                        departureDate: date,
                        returnDate: returnDate || '',
                        tripType: tripTypeParam || (returnDate ? 'round-trip' : 'one-way'),
                        adults: adultsParam,
                        children: childrenParam,
                        infants: infantsParam,
                    });
                }
            }
            setLoading(false);
        }

        fetchFlights();
    }, [from, to, date, returnDate, adultsParam, childrenParam, infantsParam]);

    const cheapestPrice = rawFlights.length > 0 ? Math.min(...rawFlights.map(f => f.price)) : 0;

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

                        {/* Editable Search Bar */}
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
                            </div>

                            {/* Chart */}
                            <div className="mb-6">
                                <PriceChart />
                            </div>

                            {/* Flight List */}
                            <div className="space-y-3">
                                {filteredFlights.map(flight => (
                                    <FlightCard
                                        key={flight.id}
                                        flight={flight}
                                        isCheapest={flight.price === cheapestPrice}
                                        passengerCount={totalTravelers}
                                        isRoundTrip={isRoundTrip}
                                    />
                                ))}
                            </div>

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
