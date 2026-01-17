'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PassengerSelectorProps {
    adults: number;
    children: number;
    infants: number;
    onChange: (adults: number, children: number, infants: number) => void;
}

export function PassengerSelector({ adults, children, infants, onChange }: PassengerSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const total = adults + children + infants;
    const displayText = total === 1 ? '1 Passenger' : `${total} Passengers`;

    const Counter = ({ label, sublabel, value, min, max, onUpdate }: {
        label: string;
        sublabel: string;
        value: number;
        min: number;
        max: number;
        onUpdate: (v: number) => void;
    }) => (
        <div className="flex items-center justify-between py-3">
            <div>
                <div className="font-medium text-gray-900">{label}</div>
                <div className="text-sm text-gray-500">{sublabel}</div>
            </div>
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => value > min && onUpdate(value - 1)}
                    disabled={value <= min}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-lg font-light
            disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors text-gray-800"
                >
                    −
                </button>
                <span className="w-6 text-center font-medium text-gray-800">{value}</span>
                <button
                    type="button"
                    onClick={() => value < max && onUpdate(value + 1)}
                    disabled={value >= max}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-lg font-light
            disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors text-gray-800"
                >
                    +
                </button>
            </div>
        </div>
    );

    return (
        <div ref={containerRef} className="relative min-w-[160px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Passengers</label>

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
          w-full flex items-center justify-between bg-white border rounded-xl px-4 py-3
          transition-all duration-200 text-left
          ${isOpen ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]/20' : 'border-gray-200 hover:border-gray-300'}
        `}
            >
                <span className="font-medium text-gray-900">{displayText}</span>
                <span className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-72 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-4"
                    >
                        <Counter
                            label="Adults"
                            sublabel="12+ years"
                            value={adults}
                            min={1}
                            max={9}
                            onUpdate={(v) => onChange(v, children, Math.min(infants, v))}
                        />
                        <div className="border-t border-gray-100" />
                        <Counter
                            label="Children"
                            sublabel="2-11 years"
                            value={children}
                            min={0}
                            max={9}
                            onUpdate={(v) => onChange(adults, v, infants)}
                        />
                        <div className="border-t border-gray-100" />
                        <Counter
                            label="Infants"
                            sublabel="Under 2"
                            value={infants}
                            min={0}
                            max={adults} // 1 infant per adult
                            onUpdate={(v) => onChange(adults, children, v)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
