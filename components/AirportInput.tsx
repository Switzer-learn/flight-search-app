'use client';

import { useState, useCallback } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { searchAirports as searchAirportsAPI, type AirportLocation } from '@/app/actions/amadeus';
import { useFlightStore } from '@/store/useFlightStore';

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
        getCachedAirports,
        cacheAirports
    } = useFlightStore();

    // Search airports via Amadeus API
    const fetchAirports = useCallback(async (query: string) => {
        setError(null);

        if (query.length < 2) {
            // Show default airports when query is short
            setOptions(defaultAirports);
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
            console.error('Airport search failed:', err);
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
            options={options}
            getOptionLabel={(option) => `${option.cityName} (${option.iataCode})`}
            isOptionEqualToValue={(option, val) => option.iataCode === val.iataCode}
            filterOptions={(x) => x} // We handle filtering via API
            loading={loading}
            noOptionsText={error || (loading ? 'Searching...' : 'Type to search airports')}
            size={size}
            sx={{
                flex: 1,
                minWidth: size === 'small' ? 140 : 200,
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
                    error={!!error}
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
                            py: 1,
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
                            }}
                        >
                            {option.iataCode}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ fontWeight: 500, color: '#111827', fontSize: '0.875rem' }}>
                                {option.cityName}
                            </Box>
                            <Box sx={{ fontSize: '0.75rem', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {option.name}
                            </Box>
                        </Box>
                        <Box sx={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
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
