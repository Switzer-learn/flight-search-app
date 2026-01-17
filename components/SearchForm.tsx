'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { format, addDays } from 'date-fns';
import { useFlightStore } from '@/store/useFlightStore';
import { AirportInput, type AirportLocation } from '@/components/AirportInput';
import { PassengerSelector } from '@/components/PassengerSelector';
import { DATE_CONFIG, PASSENGER_LIMITS } from '@/lib/constants';

export function SearchForm() {
    const router = useRouter();
    const { searchParams, setSearchParams, setLoading } = useFlightStore();
    const [tripType, setTripType] = useState<'one-way' | 'round-trip'>(searchParams.tripType);
    const [origin, setOrigin] = useState<AirportLocation | null>(searchParams.origin);
    const [destination, setDestination] = useState<AirportLocation | null>(searchParams.destination);
    const [departureDate, setDepartureDate] = useState(searchParams.departureDate || format(addDays(new Date(), DATE_CONFIG.DEFAULT_DEPARTURE_DAYS_AHEAD), 'yyyy-MM-dd'));
    const [returnDate, setReturnDate] = useState(searchParams.returnDate || format(addDays(new Date(), DATE_CONFIG.DEFAULT_RETURN_DAYS_AHEAD), 'yyyy-MM-dd'));
    const [adults, setAdults] = useState(searchParams.adults);
    const [children, setChildren] = useState(searchParams.children);
    const [infants, setInfants] = useState(searchParams.infants);

    // Sync destination from store (when recommendation is clicked)
    useEffect(() => {
        if (searchParams.destination) {
            setDestination(searchParams.destination);
        }
    }, [searchParams.destination]);

    const today = format(new Date(), 'yyyy-MM-dd');
    const maxDate = format(addDays(new Date(), DATE_CONFIG.MAX_DAYS_AHEAD), 'yyyy-MM-dd');

    const canSearch = origin && destination && departureDate && (tripType === 'one-way' || returnDate);

    const handleSwap = () => {
        const temp = origin;
        setOrigin(destination);
        setDestination(temp);
    };

    const handleSearch = () => {
        if (!canSearch) return;

        // Update store
        setSearchParams({
            origin,
            destination,
            departureDate,
            returnDate: tripType === 'round-trip' ? returnDate : '',
            tripType,
            adults,
            children,
            infants,
        });
        setLoading(true);

        // Navigate to results with URL params
        const params = new URLSearchParams({
            from: origin!.iataCode,
            to: destination!.iataCode,
            date: departureDate,
            adults: adults.toString(),
            tripType,
        });
        if (tripType === 'round-trip' && returnDate) {
            params.set('return', returnDate);
        }
        if (children > 0) params.set('children', children.toString());
        if (infants > 0) params.set('infants', infants.toString());

        router.push(`/results?${params.toString()}`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-4xl mx-auto"
        >
            {/* Card Container */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-200/50 p-6 md:p-8 border border-gray-100">
                {/* Trip Type Toggle */}
                <div className="flex justify-center md:justify-start mb-6">
                    <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
                        {(['one-way', 'round-trip'] as const).map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setTripType(type)}
                                className={`px-5 py-2 rounded-lg font-medium text-sm transition-all duration-200
                ${tripType === type
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {type === 'one-way' ? 'One Way' : 'Round Trip'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Inputs */}
                <div className="space-y-4">
                    {/* Origin / Destination Row */}
                    <div className="flex flex-col md:flex-row gap-3 items-end">
                        <AirportInput
                            label="From"
                            placeholder="City or airport"
                            value={origin}
                            onChange={setOrigin}
                        />

                        {/* Swap Button */}
                        <button
                            type="button"
                            onClick={handleSwap}
                            aria-label="Swap origin and destination"
                            className="flex w-8 h-8 md:w-10 md:h-10 items-center justify-center rounded-full border-2 border-gray-200 
                bg-white text-gray-800 hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors text-base md:text-lg shrink-0 self-center md:self-end md:mb-1"
                        >
                            ⇄
                        </button>

                        <AirportInput
                            label="To"
                            placeholder="City or airport"
                            value={destination}
                            onChange={setDestination}
                        />
                    </div>

                    {/* Date Row - Departure and Return side by side */}
                    <div className="flex flex-row gap-3">
                        {/* Departure Date */}
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Departure</label>
                            <input
                                type="date"
                                value={departureDate}
                                onChange={(e) => setDepartureDate(e.target.value)}
                                min={today}
                                max={maxDate}
                                className="w-full bg-white border border-gray-200 rounded-xl px-3 md:px-4 py-3 
                                    text-gray-900 outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20
                                    hover:border-gray-300 transition-all duration-200 text-sm md:text-base"
                            />
                        </div>

                        {/* Return Date (conditional) */}
                        {tripType === 'round-trip' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex-1"
                            >
                                <label className="block text-xs font-medium text-gray-500 mb-1">Return</label>
                                <input
                                    type="date"
                                    value={returnDate}
                                    onChange={(e) => setReturnDate(e.target.value)}
                                    min={departureDate || today}
                                    max={maxDate}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-3 md:px-4 py-3 
                                        text-gray-900 outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20
                                        hover:border-gray-300 transition-all duration-200 text-sm md:text-base"
                                />
                            </motion.div>
                        )}
                    </div>

                    {/* Passengers Row */}
                    <div className="flex justify-start">
                        <PassengerSelector
                            adults={adults}
                            children={children}
                            infants={infants}
                            onChange={(a, c, i) => {
                                setAdults(a);
                                setChildren(c);
                                setInfants(i);
                            }}
                        />
                    </div>
                </div>

                {/* Search Button */}
                <motion.button
                    type="button"
                    onClick={handleSearch}
                    disabled={!canSearch}
                    whileHover={{ scale: canSearch ? 1.02 : 1 }}
                    whileTap={{ scale: canSearch ? 0.98 : 1 }}
                    className={`w-full mt-6 py-4 rounded-2xl font-semibold text-lg transition-all duration-300
            ${canSearch
                            ? 'bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-lg shadow-[#3B82F6]/30 cursor-pointer'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                    Search Flights
                </motion.button>
            </div>
        </motion.div>
    );
}
