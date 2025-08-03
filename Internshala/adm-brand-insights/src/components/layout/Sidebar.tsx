'use client';

import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Settings, 
  FileText, 
  Target,
  PieChart,
  Calendar,
  Sparkles,
  Zap,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const menuItems = [
  { icon: BarChart3, label: 'Dashboard', active: true, badge: null },
  { icon: TrendingUp, label: 'Analytics', active: false, badge: 'New' },
  { icon: Users, label: 'Audience', active: false, badge: null },
  { icon: Target, label: 'Campaigns', active: false, badge: '5' },
  { icon: PieChart, label: 'Channels', active: false, badge: null },
  { icon: FileText, label: 'Reports', active: false, badge: '2' },
  { icon: Calendar, label: 'Schedule', active: false, badge: null },
  { icon: Settings, label: 'Settings', active: false, badge: null },
];

export function Sidebar() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-5deg", "5deg"]);

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
    <motion.aside 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      onMouseMove={handleMouseMove}
      className="hidden lg:flex flex-col w-64 bg-background/80 backdrop-blur-xl border-r border-white/10 min-h-screen relative"
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-purple-500/5 to-pink-500/5"
        animate={{
          background: [
            "linear-gradient(180deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.05), rgba(236, 72, 153, 0.05))",
            "linear-gradient(180deg, rgba(236, 72, 153, 0.05), rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.05))",
            "linear-gradient(180deg, rgba(139, 92, 246, 0.05), rgba(236, 72, 153, 0.05), rgba(59, 130, 246, 0.05))",
          ]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        style={{ rotateX, rotateY }}
        className="relative z-10"
      >
        {/* Sidebar Header */}
        <motion.div 
          className="p-6 border-b border-white/10 bg-background/50 backdrop-blur-sm"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center space-x-3">
            <motion.div
              className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Sparkles className="h-4 w-4 text-white" />
            </motion.div>
            <h2 className="text-lg font-semibold text-foreground">Navigation</h2>
          </div>
        </motion.div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 relative">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              onMouseEnter={() => setHoveredItem(item.label)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <motion.button
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden group",
                  item.active
                    ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-white/10"
                )}
              >
                {/* Animated background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  animate={{
                    scale: hoveredItem === item.label ? [1, 1.1, 1] : 1,
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />

                <div className="flex items-center space-x-3 relative z-10">
                  <motion.div
                    className={cn(
                      "p-2 rounded-lg transition-all duration-300",
                      item.active
                        ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                        : "bg-muted/50 text-muted-foreground group-hover:bg-blue-500/10 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                    )}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <item.icon className="h-5 w-5" />
                  </motion.div>
                  <span>{item.label}</span>
                </div>

                {/* Badge */}
                {item.badge && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-bold",
                      item.badge === 'New' 
                        ? "bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/20"
                        : "bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                    )}
                  >
                    {item.badge}
                  </motion.div>
                )}

                {/* Active indicator */}
                {item.active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute right-2 w-2 h-2 bg-blue-600 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  />
                )}

                {/* Hover effect */}
                <AnimatePresence>
                  {hoveredItem === item.label && !item.active && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="absolute right-2"
                    >
                      <Zap className="h-3 w-3 text-blue-400" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <motion.div 
          className="p-4 border-t border-white/10 bg-background/50 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-white/10">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-medium text-foreground">Pro Tips</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Use the date range picker to analyze specific time periods and compare performance across campaigns.
            </p>
            
            {/* Quick stats */}
            <motion.div 
              className="mt-3 pt-3 border-t border-white/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Active Campaigns</span>
                <span className="font-semibold text-green-600 dark:text-green-400">12</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-muted-foreground">Total Spend</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">$45.2K</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </motion.aside>
  );
} 