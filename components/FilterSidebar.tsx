'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFlightStore, type SortOption } from '@/store/useFlightStore';
import { PRICE_CONFIG } from '@/lib/constants';

export function FilterSidebar() {
    const { rawFlights, filters, setFilters, resetFilters, sortOption, setSortOption } = useFlightStore();

    // Calculate price bounds from raw flights
    const priceBounds = useMemo(() => {
        if (rawFlights.length === 0) return { min: 0, max: PRICE_CONFIG.DEFAULT_PRICE_RANGE_MAX };
        const prices = rawFlights.map(f => f.price);
        return {
            min: Math.floor(Math.min(...prices)),
            max: Math.ceil(Math.max(...prices)),
        };
    }, [rawFlights]);

    // Local state for slider (for immediate UI feedback)
    const [localMinPrice, setLocalMinPrice] = useState(priceBounds.min);
    const [localMaxPrice, setLocalMaxPrice] = useState(priceBounds.max);

    // Sync local state with store on mount or when flights change
    useEffect(() => {
        setLocalMinPrice(priceBounds.min);
        setLocalMaxPrice(priceBounds.max);
    }, [priceBounds]);

    // Debounced filter update
    const updatePriceFilter = useCallback((min: number, max: number) => {
        setFilters({ priceRange: [min, max] });
    }, [setFilters]);

    // Handle slider change with debounce
    const handleMinPriceChange = (value: number) => {
        const clampedValue = Math.min(value, localMaxPrice - 10);
        setLocalMinPrice(clampedValue);
        updatePriceFilter(clampedValue, localMaxPrice);
    };

    const handleMaxPriceChange = (value: number) => {
        const clampedValue = Math.max(value, localMinPrice + 10);
        setLocalMaxPrice(clampedValue);
        updatePriceFilter(localMinPrice, clampedValue);
    };

    // Calculate counts dynamically
    const counts = useMemo(() => {
        const direct = rawFlights.filter(f => f.stops === 0).length;
        const oneStop = rawFlights.filter(f => f.stops <= 1).length;
        const twoPlus = rawFlights.filter(f => f.stops >= 2).length;

        const airlines: Record<string, number> = {};
        rawFlights.forEach(f => {
            airlines[f.airline] = (airlines[f.airline] || 0) + 1;
        });

        return { direct, oneStop, twoPlus, airlines };
    }, [rawFlights]);

    const uniqueAirlines = Object.entries(counts.airlines).sort((a, b) => a[0].localeCompare(b[0]));

    const activeFiltersCount = [
        filters.stops !== 'any',
        filters.airlines.length > 0,
        filters.departureTime.length > 0,
        localMinPrice > priceBounds.min || localMaxPrice < priceBounds.max,
    ].filter(Boolean).length;

    const handleStopsChange = (value: typeof filters.stops) => {
        setFilters({ stops: value });
    };

    const handleAirlineToggle = (airline: string) => {
        const newAirlines = filters.airlines.includes(airline)
            ? filters.airlines.filter(a => a !== airline)
            : [...filters.airlines, airline];
        setFilters({ airlines: newAirlines });
    };

    const handleTimeToggle = (period: string) => {
        const newTimes = filters.departureTime.includes(period)
            ? filters.departureTime.filter(t => t !== period)
            : [...filters.departureTime, period];
        setFilters({ departureTime: newTimes });
    };

    const handleResetFilters = () => {
        resetFilters();
        setLocalMinPrice(priceBounds.min);
        setLocalMaxPrice(priceBounds.max);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-4"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                {activeFiltersCount > 0 && (
                    <button
                        onClick={handleResetFilters}
                        className="text-sm text-[#3B82F6] hover:text-[#2563EB] font-medium"
                    >
                        Clear All ({activeFiltersCount})
                    </button>
                )}
            </div>

            {/* Sort */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
                <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white
            focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none text-gray-900"
                >
                    <option value="best">Best</option>
                    <option value="cheapest">Cheapest</option>
                    <option value="fastest">Fastest</option>
                    <option value="earliest">Earliest Departure</option>
                    <option value="latest">Latest Departure</option>
                </select>
            </div>

            {/* Stops */}
            <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Stops</h4>
                <div className="space-y-2">
                    {[
                        { value: 'any' as const, label: 'Any', count: rawFlights.length },
                        { value: 'direct' as const, label: 'Non-stop', count: counts.direct },
                        { value: '1' as const, label: '1 stop or fewer', count: counts.oneStop },
                        { value: '2+' as const, label: '2+ stops', count: counts.twoPlus },
                    ].map(option => (
                        <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="radio"
                                name="stops"
                                checked={filters.stops === option.value}
                                onChange={() => handleStopsChange(option.value)}
                                className="w-4 h-4 text-[#3B82F6] border-gray-300 focus:ring-[#3B82F6]"
                            />
                            <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1">
                                {option.label}
                            </span>
                            <span className="text-xs text-gray-400">({option.count})</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Price Range - Working Dual Slider */}
            <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Price Range</h4>
                <div className="text-sm text-gray-900 font-medium mb-3">
                    ${localMinPrice.toLocaleString()} - ${localMaxPrice.toLocaleString()}
                </div>

                {/* Min Price Slider */}
                <div className="mb-2">
                    <label className="text-xs text-gray-500 mb-1 block">Min Price</label>
                    <input
                        type="range"
                        min={priceBounds.min}
                        max={priceBounds.max}
                        value={localMinPrice}
                        onChange={(e) => handleMinPriceChange(Number(e.target.value))}
                        className="w-full accent-[#3B82F6] cursor-pointer"
                    />
                </div>

                {/* Max Price Slider */}
                <div>
                    <label className="text-xs text-gray-500 mb-1 block">Max Price</label>
                    <input
                        type="range"
                        min={priceBounds.min}
                        max={priceBounds.max}
                        value={localMaxPrice}
                        onChange={(e) => handleMaxPriceChange(Number(e.target.value))}
                        className="w-full accent-[#3B82F6] cursor-pointer"
                    />
                </div>
            </div>

            {/* Airlines */}
            {uniqueAirlines.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Airlines</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {uniqueAirlines.map(([airline, count]) => (
                            <label key={airline} className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={filters.airlines.includes(airline)}
                                    onChange={() => handleAirlineToggle(airline)}
                                    className="w-4 h-4 rounded text-[#3B82F6] border-gray-300 focus:ring-[#3B82F6]"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1 truncate">
                                    {airline}
                                </span>
                                <span className="text-xs text-gray-400">({count})</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Departure Time */}
            <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Departure Time</h4>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { value: 'morning', label: 'Morning', time: '5am-12pm' },
                        { value: 'afternoon', label: 'Afternoon', time: '12pm-6pm' },
                        { value: 'evening', label: 'Evening', time: '6pm-12am' },
                        { value: 'night', label: 'Night', time: '12am-5am' },
                    ].map(period => (
                        <button
                            key={period.value}
                            onClick={() => handleTimeToggle(period.value)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all
                ${filters.departureTime.includes(period.value)
                                    ? 'bg-[#3B82F6] text-white border-[#3B82F6]'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                        >
                            <div>{period.label}</div>
                            <div className="text-[10px] opacity-70">{period.time}</div>
                        </button>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
