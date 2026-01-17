'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useFlightStore, type Flight } from '@/store/useFlightStore';
import { formatDuration } from '@/lib/utils';

interface SelectedFlightSummaryProps {
    passengerCount: number;
    onEditOutbound?: () => void;
    onEditReturn?: () => void;
}

export function SelectedFlightSummary({
    passengerCount,
    onEditOutbound,
    onEditReturn,
}: SelectedFlightSummaryProps) {
    const {
        selectedOutboundFlight,
        selectedReturnFlight,
        searchParams,
        deselectOutbound,
        deselectReturn,
    } = useFlightStore();

    if (!selectedOutboundFlight) return null;

    const origin = searchParams.origin;
    const destination = searchParams.destination;
    const isRoundTrip = searchParams.tripType === 'round-trip';

    const outboundTotal = selectedOutboundFlight.price * passengerCount;
    const returnTotal = selectedReturnFlight ? selectedReturnFlight.price * passengerCount : 0;
    const grandTotal = outboundTotal + returnTotal;

    const FlightSummaryCard = ({
        flight,
        label,
        from,
        to,
        onDeselect
    }: {
        flight: Flight;
        label: string;
        from: string;
        to: string;
        onDeselect: () => void;
    }) => (
        <div className="flex items-center justify-between gap-3 py-2">
            <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-900 truncate">{from}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-medium text-gray-900 truncate">{to}</span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                    {flight.airline} · {flight.departureTime} · {formatDuration(flight.duration)}
                </div>
            </div>
            <div className="text-right shrink-0">
                <div className="font-semibold text-gray-900">
                    ${(flight.price * passengerCount).toLocaleString()}
                </div>
                <button
                    onClick={onDeselect}
                    className="text-xs text-[#3B82F6] hover:text-[#2563EB] mt-0.5"
                >
                    Change
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Version - Inline */}
            <div className="hidden md:block">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-100 p-4 mb-6"
                >
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">Selected Flights</h3>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                            {passengerCount} passenger{passengerCount > 1 ? 's' : ''}
                        </span>
                    </div>

                    <FlightSummaryCard
                        flight={selectedOutboundFlight}
                        label="Outbound"
                        from={origin?.cityName || origin?.iataCode || ''}
                        to={destination?.cityName || destination?.iataCode || ''}
                        onDeselect={deselectOutbound}
                    />

                    {selectedReturnFlight && (
                        <>
                            <div className="border-t border-gray-100 my-2" />
                            <FlightSummaryCard
                                flight={selectedReturnFlight}
                                label="Return"
                                from={destination?.cityName || destination?.iataCode || ''}
                                to={origin?.cityName || origin?.iataCode || ''}
                                onDeselect={deselectReturn}
                            />
                        </>
                    )}

                    {/* Total */}
                    {(selectedReturnFlight || !isRoundTrip) && (
                        <>
                            <div className="border-t border-gray-200 my-3" />
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-semibold text-gray-900">Total</div>
                                    <div className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded mt-1 inline-block">
                                        Demo version
                                    </div>
                                </div>
                                <div className="text-xl font-bold text-[#3B82F6]">
                                    ${grandTotal.toLocaleString()}
                                </div>
                            </div>
                        </>
                    )}
                </motion.div>
            </div>
        </>
    );
}
