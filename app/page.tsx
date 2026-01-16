'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { SearchForm } from '@/components/SearchForm';
import { useFlightStore } from '@/store/useFlightStore';
import type { TravelRecommendation } from '@/app/actions/amadeus';
import type { AirportLocation } from '@/app/actions/amadeus';

export default function Home() {
  const router = useRouter();
  const {
    recommendations,
    recommendationsFetched,
    setSearchParams,
    error,
    defaultAirportsFetched,
  } = useFlightStore();

  // Handle recommendation click - set as destination
  const handleRecommendationClick = (dest: TravelRecommendation) => {
    const airportLocation: AirportLocation = {
      iataCode: dest.iataCode,
      name: dest.name,
      cityName: dest.name,
      countryCode: '',
      countryName: '',
    };
    setSearchParams({ destination: airportLocation });
  };

  // Show error state if API failed
  if (error && defaultAirportsFetched) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#F0F7FF] via-white to-[#E8F4FF] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-lg"
        >
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Connection Error</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <p className="text-sm text-gray-400 mb-8">
            Please check your Amadeus API credentials in .env.local
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Retry
          </button>
        </motion.div>
      </div>
    );
  }

  const isLoading = !recommendationsFetched;

  return (
    <div className="min-h-screen bg-linear-to-br from-[#F0F7FF] via-white to-[#E8F4FF]">
      {/* Header */}
      <header className="w-full px-6 py-4">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer">
            <span className="text-2xl font-bold bg-linear-to-r from-[#3B82F6] to-[#2563EB] bg-clip-text text-transparent">
              SkyScout
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="/coming-soon" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Explore</a>
            <a href="/coming-soon" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Trips</a>
            <a href="/coming-soon" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Profile</a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="px-6 pt-8 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Hero Text */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
              Find your next flight
            </h1>
            <p className="text-lg md:text-xl text-gray-500 max-w-xl mx-auto">
              Compare prices across airlines and find the best deals for your journey.
            </p>
          </div>

          {/* Search Form */}
          <SearchForm />

          {/* Travel Recommendations - from Amadeus API only */}
          <div className="mt-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">
              Recommended Destinations
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              {recommendations.length > 0 ? 'Click to set as your destination' : 'Powered by Amadeus Travel Recommendations API'}
            </p>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white/60 rounded-2xl p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-12" />
                  </div>
                ))}
              </div>
            ) : recommendations.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
                {recommendations.map((dest, index) => (
                  <motion.button
                    key={dest.iataCode}
                    onClick={() => handleRecommendationClick(dest)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group bg-white/60 backdrop-blur-sm border border-gray-100 rounded-2xl p-4 text-left
                      hover:bg-white hover:shadow-lg hover:shadow-gray-100/50 hover:border-[#3B82F6]/30 transition-all duration-300 cursor-pointer"
                  >
                    <div className="text-sm font-semibold text-gray-900 group-hover:text-[#3B82F6] transition-colors">
                      {dest.name}
                    </div>
                    <div className="text-xs text-gray-400">{dest.iataCode}</div>
                    {dest.relevance > 0 && (
                      <div className="mt-2">
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#3B82F6] rounded-full"
                            style={{ width: `${Math.min(dest.relevance * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {Math.round(dest.relevance * 100)}% match
                        </span>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">
                  No recommendations available from Amadeus API
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
