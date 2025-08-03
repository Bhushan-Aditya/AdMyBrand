'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Target, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  isLoading: boolean;
}

export function LoadingScreen({ isLoading }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing...');

  useEffect(() => {
    if (isLoading) {
      // Simulate loading progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      // Update loading text based on progress
      const textInterval = setInterval(() => {
        setLoadingText(() => {
          if (progress < 30) return 'Loading components...';
          if (progress < 60) return 'Preparing dashboard...';
          if (progress < 90) return 'Almost ready...';
          return 'Launching dashboard...';
        });
      }, 500);

      return () => {
        clearInterval(interval);
        clearInterval(textInterval);
      };
    }
  }, [isLoading, progress]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center overflow-hidden"
        >
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse" />

          {/* Main loading container */}
          <div className="relative z-10 text-center">
            {/* Animated logo */}
            <motion.div
              className="relative mb-8"
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600"
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                <div className="relative z-10 text-white text-xl font-bold">
                  AI
                </div>
                
                {/* Animated sparkle */}
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{
                    scale: [1, 1.3, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                </motion.div>
              </div>
            </motion.div>

            {/* Loading text */}
            <motion.div
              className="mb-4"
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <h1 className="text-2xl font-bold text-white mb-2">
                ADmyBRAND Insights
              </h1>
              
              <p className="text-blue-200 text-lg">
                {loadingText}
              </p>
            </motion.div>

            {/* Animated progress bar */}
            <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden mx-auto mb-8">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Loading indicators */}
            <div className="flex items-center justify-center space-x-4">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <Target className="h-5 w-5 text-blue-400" />
              </motion.div>
              
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, -360],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 0.5,
                }}
              >
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </motion.div>
              
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 1,
                }}
              >
                <Sparkles className="h-5 w-5 text-pink-400" />
              </motion.div>
            </div>

            {/* Progress percentage */}
            <div className="mt-4 text-white text-sm font-medium">
              {Math.round(progress)}%
            </div>

            {/* Metrics preview */}
            <motion.div
              className="absolute bottom-8 left-8 right-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <div className="flex justify-center space-x-6">
                {[
                  { label: "Revenue", value: "$125K", color: "text-green-400" },
                  { label: "Users", value: "45.6K", color: "text-blue-400" },
                  { label: "Growth", value: "+12.5%", color: "text-purple-400" },
                ].map((metric, index) => (
                  <motion.div
                    key={metric.label}
                    className="text-center"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2 + index * 0.1 }}
                  >
                    <div className={`text-sm font-medium ${metric.color}`}>
                      {metric.label}
                    </div>
                    <div className="text-lg font-bold text-white">
                      {metric.value}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 