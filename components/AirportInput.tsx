'use client';

import { useState, useCallback } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { type AirportLocation } from '@/app/actions/amadeus';
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

    const {
        defaultAirports,
        defaultAirportsFetched,
    } = useFlightStore();

    // Show loading when opened but default airports not yet loaded
    const isInitialLoading = !defaultAirportsFetched;

    // Custom filter function for client-side filtering
    // Matches by city name, airport name, or IATA code
    const filterOptions = useCallback((options: AirportLocation[], state: { inputValue: string }) => {
        const query = state.inputValue.toLowerCase().trim();
        if (!query) return options;

        return options.filter(airport =>
            airport.cityName.toLowerCase().includes(query) ||
            airport.name.toLowerCase().includes(query) ||
            airport.iataCode.toLowerCase().includes(query) ||
            airport.countryName?.toLowerCase().includes(query)
        );
    }, []);

    return (
        <Autocomplete
            value={value}
            onChange={(_, newValue) => onChange(newValue)}
            inputValue={inputValue}
            onInputChange={(_, newInputValue) => {
                setInputValue(newInputValue);
                // No API call here - filtering is done client-side
            }}
            options={defaultAirports}
            getOptionLabel={(option) => `${option.cityName} (${option.iataCode})`}
            isOptionEqualToValue={(option, val) => option.iataCode === val.iataCode}
            filterOptions={filterOptions}
            loading={isInitialLoading}
            noOptionsText={isInitialLoading ? 'Loading airports...' : 'No airports found'}
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
                                {isInitialLoading ? <CircularProgress color="inherit" size={20} /> : null}
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
