'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useFlightStore } from '@/store/useFlightStore';
import { motion, AnimatePresence } from 'framer-motion';

export function PriceChart() {
    const {
        filteredFlights,
        filteredReturnFlights,
        selectedOutboundFlight,
        searchParams,
        chartView,
        setChartView,
        setHighlightedFlight,
        highlightedFlightId
    } = useFlightStore();

    // Start collapsed on mobile, expanded on desktop
    const [isExpanded, setIsExpanded] = useState(true);

    // Detect mobile on mount and auto-collapse
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            if (mobile) setIsExpanded(false);
        };
        checkMobile();
    }, []);

    // Determine which flights to show based on selection state
    const isRoundTrip = searchParams.tripType === 'round-trip';
    const showReturnData = isRoundTrip && selectedOutboundFlight && filteredReturnFlights.length > 0;
    const flightsToShow = showReturnData ? filteredReturnFlights : filteredFlights;
    const chartLabel = showReturnData ? 'Return Flights' : 'Outbound Flights';

    const chartData = useMemo(() => {
        if (!flightsToShow.length) return [];

        const cheapestPrice = Math.min(...flightsToShow.map(f => f.price));

        return flightsToShow.map(f => {
            // Parse departure time to minutes since midnight for X axis (Time view)
            const [hours, minutes] = f.departureTime.split(':').map(Number);
            const timeValue = hours * 60 + minutes;

            return {
                id: f.id,
                x: chartView === 'time' ? timeValue : f.duration,
                y: f.price,
                airline: f.airline,
                departureTime: f.departureTime,
                duration: f.duration,
                stops: f.stops,
                isCheapest: f.price === cheapestPrice,
                isLongLayover: f.stops >= 2,
                isHighlighted: f.id === highlightedFlightId,
            };
        });
    }, [flightsToShow, chartView, highlightedFlightId]);

    const xDomain = useMemo(() => {
        if (!chartData.length) return [0, 100];
        const values = chartData.map(d => d.x);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const padding = (max - min) * 0.1;
        return [Math.max(0, min - padding), max + padding];
    }, [chartData]);

    const yDomain = useMemo(() => {
        if (!chartData.length) return [0, 1000];
        const values = chartData.map(d => d.y);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const padding = (max - min) * 0.1;
        return [Math.max(0, min - padding), max + padding];
    }, [chartData]);

    const formatXAxis = (value: number) => {
        if (chartView === 'time') {
            const hours = Math.floor(value / 60);
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHour = hours % 12 || 12;
            return `${displayHour}${period}`;
        }
        const h = Math.floor(value / 60);
        return `${h}h`;
    };

    const getDotColor = (entry: typeof chartData[0]) => {
        if (entry.isHighlighted) return '#8B5CF6'; // Purple for highlighted
        if (entry.isCheapest) return '#10B981'; // Green
        if (entry.isLongLayover) return '#F97316'; // Orange
        return '#3B82F6'; // Blue
    };

    const handleDotClick = useCallback((data: any) => {
        if (data?.id) {
            // Toggle highlight - if same dot clicked, unhighlight
            setHighlightedFlight(highlightedFlightId === data.id ? null : data.id);
        }
    }, [highlightedFlightId, setHighlightedFlight]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (!active || !payload?.[0]) return null;
        const data = payload[0].payload;
        const h = Math.floor(data.duration / 60);
        const m = data.duration % 60;
        const durationStr = m > 0 ? `${h}h ${m}m` : `${h}h`;

        return (
            <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-4 min-w-[180px]">
                <div className="font-semibold text-gray-900 mb-2">{data.airline}</div>
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Departure</span>
                        <span className="font-medium text-gray-900">{data.departureTime}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Duration</span>
                        <span className="font-medium text-gray-900">{durationStr}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Price</span>
                        <span className="font-bold text-[#3B82F6]">${data.y}</span>
                    </div>
                </div>
                <div className={`mt-2 text-xs font-medium ${data.stops === 0 ? 'text-[#10B981]' : 'text-[#F97316]'}`}>
                    {data.stops === 0 ? 'Non-stop' : `${data.stops} stop${data.stops > 1 ? 's' : ''}`}
                </div>
                <div className="mt-2 text-xs text-gray-400">
                    Click to {data.isHighlighted ? 'unhighlight' : 'highlight'}
                </div>
            </div>
        );
    };

    if (!filteredFlights.length) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-8">
                <div className="h-[250px] flex items-center justify-center text-gray-400">
                    No flights to display
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 hover:bg-gray-50 rounded-lg py-1 px-2 -ml-2 transition-colors"
                >
                    <h3 className="font-semibold text-gray-900">Price Insights</h3>
                    {isRoundTrip && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${showReturnData ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                            {showReturnData ? 'Return' : 'Outbound'}
                        </span>
                    )}
                    <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Toggle - only show when expanded */}
                {isExpanded && (
                    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                        {(['time', 'duration'] as const).map((view) => (
                            <button
                                key={view}
                                onClick={() => setChartView(view)}
                                className={`px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all
                                    ${chartView === view
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {view === 'time' ? 'Time' : 'Duration'}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Collapsible Chart */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <p className="text-xs text-gray-400 mt-2 mb-4">Click a dot to highlight the flight</p>

                        {/* Chart */}
                        <ResponsiveContainer width="100%" height={220}>
                            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                                <XAxis
                                    type="number"
                                    dataKey="x"
                                    domain={xDomain}
                                    tickFormatter={formatXAxis}
                                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                                    axisLine={{ stroke: '#E5E7EB' }}
                                    tickLine={false}
                                    name={chartView === 'time' ? 'Time of Day' : 'Duration'}
                                />
                                <YAxis
                                    type="number"
                                    dataKey="y"
                                    domain={yDomain}
                                    tickFormatter={(v) => `$${v}`}
                                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                                    axisLine={{ stroke: '#E5E7EB' }}
                                    tickLine={false}
                                    name="Price"
                                    width={45}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Scatter
                                    data={chartData}
                                    fill="#3B82F6"
                                    onClick={(data) => handleDotClick(data)}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={getDotColor(entry)}
                                            r={entry.isHighlighted ? 10 : (entry.isCheapest ? 8 : 6)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>

                        {/* Legend */}
                        <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-4 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#10B981]" />
                                <span className="text-gray-500">Best Price</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#3B82F6]" />
                                <span className="text-gray-500">Standard</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#F97316]" />
                                <span className="text-gray-500">2+ Stops</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#8B5CF6]" />
                                <span className="text-gray-500">Highlighted</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
