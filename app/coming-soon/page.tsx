'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function ComingSoonPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-linear-to-br from-[#F0F7FF] via-white to-[#E8F4FF] flex items-center justify-center px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-lg"
            >
                {/* Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="text-7xl mb-8"
                >
                    🚀
                </motion.div>

                {/* Heading */}
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                    Coming Soon
                </h1>

                {/* Description */}
                <p className="text-lg text-gray-500 mb-8">
                    We&apos;re working hard to bring you this feature.
                    Stay tuned for updates!
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-8 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '65%' }}
                        transition={{ delay: 0.5, duration: 1.5, ease: 'easeOut' }}
                        className="h-full bg-linear-to-r from-[#3B82F6] to-[#2563EB] rounded-full"
                    />
                </div>
                <p className="text-sm text-gray-400 mb-8">65% Complete</p>

                {/* Back Button */}
                <motion.button
                    onClick={() => router.push('/')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-8 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-[#3B82F6]/30"
                >
                    Back to Home
                </motion.button>
            </motion.div>
        </div>
    );
}
