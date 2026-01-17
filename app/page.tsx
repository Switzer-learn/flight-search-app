'use client';

import { motion } from 'framer-motion';
import { SearchForm } from '@/components/SearchForm';
import { useFlightStore } from '@/store/useFlightStore';

export default function Home() {
  const { error, defaultAirportsFetched } = useFlightStore();

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
        </div>
      </main>
    </div>
  );
}
