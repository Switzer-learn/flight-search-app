'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Flight } from '@/store/useFlightStore';
import { formatDuration } from '@/lib/utils';

interface FlightCardProps {
    flight: Flight;
    isCheapest?: boolean;
    passengerCount?: number;
    isRoundTrip?: boolean;
    onSelect?: (flight: Flight, isReturn?: boolean) => void;
}

export function FlightCard({
    flight,
    isCheapest,
    passengerCount = 1,
    isRoundTrip = false,
    onSelect
}: FlightCardProps) {
    const [showReturnSelect, setShowReturnSelect] = useState(false);

    const stopsText = flight.stops === 0
        ? 'Non-stop'
        : flight.stops === 1
            ? `1 stop${flight.stopCities[0] ? ` · ${flight.stopCities[0]}` : ''}`
            : `${flight.stops} stops`;

    // Total price = per-person price × number of passengers
    const totalPrice = flight.price * passengerCount;

    const handleSelect = () => {
        if (isRoundTrip && !showReturnSelect) {
            setShowReturnSelect(true);
        } else {
            onSelect?.(flight, false);
        }
    };

    const handleSelectReturn = () => {
        onSelect?.(flight, true);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            className={`bg-white rounded-2xl border p-5 transition-shadow duration-200
        ${isCheapest
                    ? 'border-[#10B981] shadow-lg shadow-[#10B981]/10'
                    : 'border-gray-100 hover:shadow-lg hover:shadow-gray-100/50'}`}
        >
            {isCheapest && (
                <div className="inline-block bg-[#10B981]/10 text-[#10B981] text-xs font-semibold px-3 py-1 rounded-full mb-3">
                    Best Price
                </div>
            )}

            <div className="flex items-center justify-between gap-4">
                {/* Airline & Flight Info */}
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        {/* Airline Logo Placeholder */}
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                            {flight.airlineCode}
                        </div>
                        <span className="text-sm text-gray-500">{flight.airline}</span>
                    </div>

                    {/* Time & Duration */}
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-xl font-semibold text-gray-900">{flight.departureTime}</div>
                        </div>

                        {/* Duration Bar */}
                        <div className="flex-1 flex flex-col items-center">
                            <span className="text-xs text-gray-400 mb-1">{formatDuration(flight.duration)}</span>
                            <div className="w-full h-[2px] bg-gray-200 relative">
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-400 rounded-full" />
                                {flight.stops > 0 && (
                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#F97316] rounded-full" />
                                )}
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-400 rounded-full" />
                            </div>
                            <span className={`text-xs mt-1 ${flight.stops > 0 ? 'text-[#F97316]' : 'text-[#10B981]'}`}>
                                {stopsText}
                            </span>
                        </div>

                        <div className="text-left">
                            <div className="text-xl font-semibold text-gray-900">{flight.arrivalTime}</div>
                        </div>
                    </div>
                </div>

                {/* Price & CTA */}
                <div className="text-right pl-6 border-l border-gray-100">
                    <div className="text-2xl font-bold text-gray-900">
                        ${totalPrice.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400 mb-3">
                        {passengerCount > 1 ? `for ${passengerCount} travelers` : 'per person'}
                    </div>
                    <button
                        onClick={handleSelect}
                        className="bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors"
                    >
                        Select
                    </button>
                </div>
            </div>

            {/* Round Trip Return Selection */}
            <AnimatePresence>
                {showReturnSelect && isRoundTrip && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-gray-100"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-sm font-medium text-gray-900">Select as return flight?</span>
                                <p className="text-xs text-gray-500">Click to choose this for your return journey</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowReturnSelect(false)}
                                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSelectReturn}
                                    className="bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors"
                                >
                                    Select Return
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
