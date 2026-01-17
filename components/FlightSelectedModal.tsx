'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { type Flight } from '@/store/useFlightStore';
import { formatDuration } from '@/lib/utils';

interface FlightSelectedModalProps {
    outboundFlight: Flight | null;
    returnFlight?: Flight | null;
    isOpen: boolean;
    onClose: () => void;
    passengerCount: number;
    originCode: string;
    originCity: string;
    destinationCode: string;
    destinationCity: string;
    isRoundTrip?: boolean;
}

function FlightDetailCard({
    flight,
    label,
    fromCode,
    fromCity,
    toCode,
    toCity,
}: {
    flight: Flight;
    label: string;
    fromCode: string;
    fromCity: string;
    toCode: string;
    toCity: string;
}) {
    return (
        <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs font-medium text-[#3B82F6] mb-3">{label}</div>

            {/* Route */}
            <div className="flex items-center gap-3 mb-3">
                <div>
                    <div className="text-lg font-bold text-gray-900">{fromCode}</div>
                    <div className="text-xs text-gray-500">{fromCity}</div>
                </div>
                <div className="flex-1 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    <div className="flex-1 h-px bg-gray-300" />
                    <svg className="w-4 h-4 text-[#3B82F6]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3.64 14.26l2.86.95 4.02-4.02-8-4 1.41-1.41 9.2 2.2 3.67-3.67c.78-.78 2.05-.78 2.83 0 .78.78.78 2.05 0 2.83l-3.67 3.67 2.2 9.2-1.41 1.41-4-8-4.02 4.02.95 2.86-1.41 1.41-2.2-4.66-4.66-2.2 1.41-1.41z" />
                    </svg>
                    <div className="flex-1 h-px bg-gray-300" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                </div>
                <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{toCode}</div>
                    <div className="text-xs text-gray-500">{toCity}</div>
                </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                    <div className="text-gray-400">Airline</div>
                    <div className="font-medium text-gray-700 truncate">{flight.airline}</div>
                </div>
                <div>
                    <div className="text-gray-400">Time</div>
                    <div className="font-medium text-gray-700">{flight.departureTime}</div>
                </div>
                <div>
                    <div className="text-gray-400">Duration</div>
                    <div className="font-medium text-gray-700">{formatDuration(flight.duration)}</div>
                </div>
                <div>
                    <div className="text-gray-400">Stops</div>
                    <div className="font-medium text-gray-700">
                        {flight.stops === 0 ? 'Direct' : `${flight.stops}`}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function FlightSelectedModal({
    outboundFlight,
    returnFlight,
    isOpen,
    onClose,
    passengerCount,
    originCode,
    originCity,
    destinationCode,
    destinationCity,
    isRoundTrip = false,
}: FlightSelectedModalProps) {
    if (!outboundFlight) return null;

    const outboundTotal = outboundFlight.price * passengerCount;
    const returnTotal = returnFlight ? returnFlight.price * passengerCount : 0;
    const grandTotal = outboundTotal + returnTotal;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-4 right-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden max-w-md mx-auto max-h-[90vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="bg-linear-to-r from-[#3B82F6] to-[#2563EB] px-5 py-4 text-white sticky top-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="font-semibold">
                                            {isRoundTrip ? 'Round Trip Selected!' : 'Flight Selected!'}
                                        </div>
                                        <div className="text-xs text-white/70">
                                            {passengerCount} passenger{passengerCount > 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-3">
                            {/* Outbound Flight */}
                            <FlightDetailCard
                                flight={outboundFlight}
                                label="✈️ Outbound Flight"
                                fromCode={originCode}
                                fromCity={originCity}
                                toCode={destinationCode}
                                toCity={destinationCity}
                            />

                            {/* Return Flight (for round-trip) */}
                            {isRoundTrip && returnFlight && (
                                <FlightDetailCard
                                    flight={returnFlight}
                                    label="✈️ Return Flight"
                                    fromCode={destinationCode}
                                    fromCity={destinationCity}
                                    toCode={originCode}
                                    toCity={originCity}
                                />
                            )}

                            {/* Price Summary */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Outbound</span>
                                        <span className="text-gray-700">${outboundTotal.toLocaleString()}</span>
                                    </div>
                                    {isRoundTrip && returnFlight && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Return</span>
                                            <span className="text-gray-700">${returnTotal.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="border-t border-gray-200 pt-2 flex justify-between">
                                        <span className="font-medium text-gray-900">Total</span>
                                        <span className="text-xl font-bold text-[#3B82F6]">
                                            ${grandTotal.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={onClose}
                                className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium py-3 rounded-xl transition-colors"
                            >
                                Continue
                            </button>

                            {/* Demo Notice */}
                            <div className="text-center">
                                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                    Demo version - No actual booking
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
