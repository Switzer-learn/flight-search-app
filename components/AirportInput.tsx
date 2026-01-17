'use client';

import { useState, useCallback } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { searchAirports as searchAirportsAPI, type AirportLocation } from '@/app/actions/amadeus';
import { useFlightStore } from '@/store/useFlightStore';
import { logError, createLogger } from '@/lib/logger';

const logger = createLogger('AirportInput');

interface AirportInputProps {
    label: string;
    placeholder: string;
    value: AirportLocation | null;
    onChange: (airport: AirportLocation | null) => void;
    size?: 'small' | 'medium';
}

export function AirportInput({ label, placeholder, value, onChange, size = 'medium' }: AirportInputProps) {
    const [inputValue, setInputValue] = useState('');
    const [options, setOptions] = useState<AirportLocation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        defaultAirports,
        defaultAirportsFetched,
        getCachedAirports,
        cacheAirports
    } = useFlightStore();

    // Show loading when opened but default airports not yet loaded
    const isInitialLoading = !defaultAirportsFetched && options.length === 0;

    // Search airports via Amadeus API
    const fetchAirports = useCallback(async (query: string) => {
        setError(null);

        if (query.length < 2) {
            // Show default airports when query is short
            setOptions(defaultAirports);
            return;
        }

        // Validate query - skip API call if invalid characters
        // (only allow letters, numbers, spaces, hyphens, apostrophes)
        if (!/^[a-zA-Z0-9\s\-']+$/.test(query)) {
            setOptions([]);
            setError('No airports found');
            return;
        }

        // Check cache first
        const cached = getCachedAirports(query);
        if (cached && cached.length > 0) {
            setOptions(cached);
            return;
        }

        // Fetch from Amadeus API
        setLoading(true);
        try {
            const results = await searchAirportsAPI(query);
            if (results.length > 0) {
                setOptions(results);
                cacheAirports(query, results);
            } else {
                setOptions([]);
                setError('No airports found');
            }
        } catch (err) {
            logError(err, 'Airport search failed');
            setError('Failed to search airports');
            setOptions([]);
        } finally {
            setLoading(false);
        }
    }, [defaultAirports, getCachedAirports, cacheAirports]);

    return (
        <Autocomplete
            value={value}
            onChange={(_, newValue) => onChange(newValue)}
            inputValue={inputValue}
            onInputChange={(_, newInputValue) => {
                setInputValue(newInputValue);
                fetchAirports(newInputValue);
            }}
            onOpen={() => {
                // Load default airports on open if not already loaded
                if (options.length === 0 && defaultAirports.length > 0) {
                    setOptions(defaultAirports);
                }
            }}
            options={Array.from(
                new Map(options.map(airport => [airport.iataCode, airport])).values()
            )}
            getOptionLabel={(option) => `${option.cityName} (${option.iataCode})`}
            isOptionEqualToValue={(option, val) => option.iataCode === val.iataCode}
            filterOptions={(x) => x} // We handle filtering via API
            loading={loading || isInitialLoading}
            noOptionsText={error || ((loading || isInitialLoading) ? 'Loading airports...' : 'Type to search airports')}
            size={size}
            slotProps={{
                popper: {
                    placement: 'bottom-start' as const,
                    modifiers: [
                        {
                            name: 'flip',
                            enabled: false,
                        },
                        {
                            name: 'preventOverflow',
                            options: {
                                altAxis: true,
                                mainAxis: true,
                                boundary: 'viewport',
                            },
                        },
                    ],
                    sx: {
                        '@media (max-width: 768px)': {
                            width: 'calc(100% - 32px) !important',
                            left: '16px !important',
                            right: '16px !important',
                            maxHeight: '50vh',
                            zIndex: 1301,
                            '& .MuiPaper-root': {
                                borderRadius: '12px',
                                maxHeight: '50vh',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                            },
                        },
                    },
                },
                listbox: {
                    sx: {
                        '@media (max-width: 768px)': {
                            maxHeight: '45vh',
                            padding: '8px 0',
                        },
                    },
                },
            }}
            sx={{
                minWidth: size === 'small' ? 120 : 180,
                width: '100%',
                '@media (max-width: 768px)': {
                    minWidth: 'unset',
                },
                '& .MuiOutlinedInput-root': {
                    borderRadius: size === 'small' ? '8px' : '12px',
                    backgroundColor: 'white',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#9CA3AF',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3B82F6',
                        borderWidth: '2px',
                    },
                },
                '& .MuiInputLabel-root': {
                    fontSize: size === 'small' ? '0.75rem' : '0.875rem',
                    color: '#6B7280',
                    '&.Mui-focused': {
                        color: '#3B82F6',
                    },
                },
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    placeholder={placeholder}
                    variant="outlined"

                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
            renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                    <Box
                        key={option.iataCode}
                        component="li"
                        {...otherProps}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            py: 1.5,
                            px: 2,
                            minHeight: 56,
                            '@media (max-width: 768px)': {
                                py: 2,
                                minHeight: 64,
                            },
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 48,
                                height: 32,
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                color: '#3B82F6',
                                fontWeight: 700,
                                fontSize: '0.875rem',
                                borderRadius: '6px',
                                flexShrink: 0,
                            }}
                        >
                            {option.iataCode}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                            <Box sx={{
                                fontWeight: 500,
                                color: '#111827',
                                fontSize: '0.875rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}>
                                {option.cityName}
                            </Box>
                            <Box sx={{
                                fontSize: '0.75rem',
                                color: '#6B7280',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                marginTop: '2px',
                            }}>
                                {option.name}
                            </Box>
                        </Box>
                        <Box sx={{
                            fontSize: '0.75rem',
                            color: '#9CA3AF',
                            flexShrink: 0,
                            display: { xs: 'none', sm: 'block' },
                        }}>
                            {option.countryName || option.countryCode}
                        </Box>
                    </Box>
                );
            }}
        />
    );
}

// Re-export type for convenience
export type { AirportLocation };
