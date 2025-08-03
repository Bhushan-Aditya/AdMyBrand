'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, Target, TrendingUp, Settings, Download, Share2 } from 'lucide-react';
import { useState } from 'react';
import { actionHandlers } from '@/lib/actions';
import { notificationManager } from './Notification';

interface FloatingActionButtonProps {
  onAction?: (action: string) => void;
}

export function FloatingActionButton({ onAction }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const actions = [
    { icon: Download, label: 'Export', color: 'from-blue-500 to-cyan-500' },
    { icon: Share2, label: 'Share', color: 'from-purple-500 to-pink-500' },
    { icon: TrendingUp, label: 'Analytics', color: 'from-green-500 to-emerald-500' },
    { icon: Target, label: 'Campaigns', color: 'from-orange-500 to-red-500' },
    { icon: Settings, label: 'Settings', color: 'from-gray-500 to-slate-500' },
  ];

  const handleAction = async (actionLabel: string) => {
    setIsLoading(actionLabel);
    setIsOpen(false);
    
    try {
      const handler = actionHandlers[actionLabel as keyof typeof actionHandlers];
      if (handler) {
        const result = await handler();
        notificationManager.addNotification({
          message: result.message,
          type: result.success ? 'success' : 'error',
          duration: 4000
        });
        onAction?.(actionLabel);
      } else {
        notificationManager.addNotification({
          message: `Action ${actionLabel} not implemented yet`,
          type: 'info',
          duration: 3000
        });
      }
    } catch {
      notificationManager.addNotification({
        message: `Failed to execute ${actionLabel}`,
        type: 'error',
        duration: 4000
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-40">
      {/* Background blur when open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <AnimatePresence>
        {isOpen && (
          <div className="absolute bottom-16 right-0 space-y-3">
            {actions.map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, scale: 0, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0, x: 20 }}
                transition={{
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 300,
                }}
                whileHover={{ scale: 1.1, x: -5 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={() => setHoveredAction(action.label)}
                onMouseLeave={() => setHoveredAction(null)}
                onClick={() => handleAction(action.label)}
                disabled={isLoading === action.label}
                className="group relative"
              >
                {/* Button background */}
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${action.color} shadow-lg flex items-center justify-center relative overflow-hidden hover:scale-110 transition-transform duration-200 ${
                    isLoading === action.label ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading === action.label ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-6 w-6 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <action.icon className="h-6 w-6 text-white relative z-10" />
                  )}
                  
                  {/* Single sparkle on hover */}
                  {hoveredAction === action.label && !isLoading && (
                    <Sparkles className="h-3 w-3 text-yellow-300 absolute -top-1 -right-1" />
                  )}
                </div>

                {/* Label */}
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: hoveredAction === action.label ? 1 : 0, x: hoveredAction === action.label ? 0 : 10 }}
                  className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap"
                >
                  {isLoading === action.label ? 'Loading...' : action.label}
                </motion.div>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main FAB button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading !== null}
        className="relative group"
      >
        {/* Main button background */}
        <div
          className={`w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-2xl flex items-center justify-center relative overflow-hidden hover:scale-105 transition-transform duration-200 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {/* Static background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-600" />
          
          {/* Icon */}
          <motion.div
            className="relative z-10 text-white"
            animate={{
              rotate: isOpen ? 45 : 0,
            }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
          >
            <Plus className="h-8 w-8" />
          </motion.div>

          {/* Static sparkle */}
          <Sparkles className="h-4 w-4 text-yellow-300 absolute -top-1 -right-1" />
        </div>

        {/* Hover glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/50 to-purple-500/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </motion.button>
    </div>
  );
} 