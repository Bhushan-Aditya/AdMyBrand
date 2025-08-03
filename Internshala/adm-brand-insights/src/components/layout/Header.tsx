'use client';

import { Moon, Sun, Search, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useState } from 'react';
import { NotificationSystem } from '@/components/ui/NotificationSystem';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseXFromCenter = event.clientX - centerX;
    const mouseYFromCenter = event.clientY - centerY;
    mouseX.set(mouseXFromCenter / (rect.width / 2));
    mouseY.set(mouseYFromCenter / (rect.height / 2));
  };

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"
        animate={{
          background: [
            "linear-gradient(90deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.05), rgba(236, 72, 153, 0.05))",
            "linear-gradient(90deg, rgba(236, 72, 153, 0.05), rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.05))",
            "linear-gradient(90deg, rgba(139, 92, 246, 0.05), rgba(236, 72, 153, 0.05), rgba(59, 130, 246, 0.05))",
          ]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      <div className="container flex h-16 items-center justify-between px-4 relative">
        {/* Logo and Brand */}
        <motion.div 
          className="flex items-center space-x-4"
          onMouseMove={handleMouseMove}
        >
          <motion.div 
            style={{ rotateX, rotateY }}
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-3 group"
          >
            <motion.div 
              className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative overflow-hidden"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <span className="text-white font-bold text-lg relative z-10">AI</span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500"
                animate={{
                  rotate: [0, 360],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="absolute -top-1 -right-1"
                >
                  <Sparkles className="h-3 w-3 text-yellow-400" />
                </motion.div>
              </AnimatePresence>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                ADmyBRAND Insights
              </span>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <motion.div 
            className="relative w-full"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <motion.input
              type="text"
              placeholder="Search analytics, campaigns..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border bg-background/50 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              animate={{
                scale: isSearchFocused ? 1.02 : 1,
                boxShadow: isSearchFocused 
                  ? "0 0 0 3px rgba(59, 130, 246, 0.1)" 
                  : "0 0 0 0px rgba(59, 130, 246, 0)"
              }}
            />
            <AnimatePresence>
              {isSearchFocused && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                />
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Right Side Actions */}
        <motion.div 
          className="flex items-center space-x-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* Notifications */}
          <NotificationSystem />

          {/* Theme Toggle */}
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="group relative overflow-hidden"
            >
              <motion.div
                animate={{ rotate: theme === 'light' ? 0 : 180 }}
                transition={{ duration: 0.5 }}
              >
                {theme === 'light' ? (
                  <Moon className="h-5 w-5 transition-colors group-hover:text-blue-500" />
                ) : (
                  <Sun className="h-5 w-5 transition-colors group-hover:text-yellow-500" />
                )}
              </motion.div>
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </Button>
          </motion.div>

          {/* User Profile */}
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
          >
            <Button variant="ghost" size="icon" className="group relative">
              <User className="h-5 w-5 transition-colors group-hover:text-blue-500" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </Button>
          </motion.div>

          {/* Live Status Indicator */}
          <motion.div
            className="flex items-center space-x-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <motion.div
              className="w-2 h-2 bg-green-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-xs font-medium text-green-600 dark:text-green-400">Live</span>
          </motion.div>
        </motion.div>
      </div>
    </motion.header>
  );
} 