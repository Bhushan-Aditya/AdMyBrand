'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MetricCardsGrid } from '@/components/dashboard/MetricCard';
import { RevenueChart, UsersChart, ChannelsChart, ConversionChart } from '@/components/dashboard/ChartContainer';
import { DataTable } from '@/components/dashboard/DataTable';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { useNotifications, Notification } from '@/components/ui/Notification';
import { mockDashboardData, getUpdatedMetrics } from '@/lib/data';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, Sparkles, Target, BarChart3, Users, Target as TargetIcon, TrendingUp, Eye } from 'lucide-react';

// Memoized components for better performance
const MemoizedHeader = memo(Header);
const MemoizedSidebar = memo(Sidebar);
const MemoizedMetricCardsGrid = memo(MetricCardsGrid);
const MemoizedRevenueChart = memo(RevenueChart);
const MemoizedUsersChart = memo(UsersChart);
const MemoizedChannelsChart = memo(ChannelsChart);
const MemoizedConversionChart = memo(ConversionChart);
const MemoizedDataTable = memo(DataTable);
const MemoizedFloatingActionButton = memo(FloatingActionButton);

// Types for components
interface QuickStatsCardProps {
  stat: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    color: string;
  };
  index: number;
}

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  delay: number;
  subtitle?: string;
}

// Optimized stats cards - Mobile Friendly
const StatsCard = memo<StatsCardProps>(({ title, value, icon: Icon, color, delay, subtitle }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.3 }}
    whileHover={{ 
      scale: 1.02, 
      y: -2,
      transition: { duration: 0.2 }
    }}
    className="group relative h-full"
  >
    {/* Magical glow effect */}
    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-lg" />
    
    <div className={`relative bg-gradient-to-br ${color} p-2 sm:p-3 lg:p-4 xl:p-5 rounded-xl border hover:scale-105 transition-transform duration-200 h-full flex flex-col justify-between`}>
      <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2 lg:mb-3">
        <div className="p-1 sm:p-1.5 lg:p-2 rounded-lg bg-white/20 group-hover:shadow-lg transition-shadow duration-200 flex-shrink-0">
          <Icon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />
        </div>
        <h3 className="text-xs font-medium text-white truncate">{title}</h3>
      </div>
      
      <div className="flex-1">
        <p className="text-sm sm:text-lg lg:text-xl xl:text-2xl font-bold text-white mb-1 break-words">{value}</p>
        {subtitle && (
          <p className="text-xs text-white/80 mb-1 sm:mb-2 lg:mb-3 break-words leading-relaxed">{subtitle}</p>
        )}
      </div>
      
      <div className="mt-1 sm:mt-2">
        <div className="h-1 sm:h-1.5 lg:h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/40 rounded-full w-3/4" />
        </div>
      </div>
      
      {/* Magical corner accent */}
      <div className="absolute top-0 right-0 w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6 xl:w-8 xl:h-8 bg-gradient-to-br from-white/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  </motion.div>
));

StatsCard.displayName = 'StatsCard';

// Optimized quick stats component - Mobile Friendly
const QuickStatsCard = memo<QuickStatsCardProps>(({ stat, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05, duration: 0.3 }}
    whileHover={{ 
      scale: 1.02, 
      y: -2,
      transition: { duration: 0.2 }
    }}
    className="group relative h-full"
  >
    {/* Magical glow effect */}
    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-lg" />
    
    <div className="relative bg-gradient-to-br from-background/50 to-muted/30 backdrop-blur-sm border border-white/10 rounded-xl p-2 sm:p-3 lg:p-4 xl:p-6 text-center hover:scale-105 transition-transform duration-200 h-full flex flex-col justify-center">
      <div className={`inline-flex p-1 sm:p-1.5 lg:p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 mb-1 sm:mb-2 lg:mb-3 xl:mb-4 group-hover:shadow-lg transition-shadow duration-200`}>
        <stat.icon className={`h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 ${stat.color}`} />
      </div>
      <div className="text-sm sm:text-lg lg:text-xl xl:text-2xl font-bold text-foreground mb-1 sm:mb-2">{stat.value}</div>
      <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
      
      {/* Magical corner accent */}
      <div className="absolute top-0 right-0 w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6 xl:w-8 xl:h-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  </motion.div>
));

QuickStatsCard.displayName = 'QuickStatsCard';

// Optimized welcome message component
const WelcomeMessage = memo<{ showWelcome: boolean }>(({ showWelcome }) => (
  <AnimatePresence>
    {showWelcome && (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-8 p-6 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl border border-white/10 backdrop-blur-sm"
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <Sparkles className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Welcome back! 👋</h2>
            <p className="text-muted-foreground">Your analytics dashboard is ready with real-time insights.</p>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
));

WelcomeMessage.displayName = 'WelcomeMessage';

export default function Dashboard() {
  const [data, setData] = useState(mockDashboardData);
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const { notifications, removeNotification } = useNotifications();

  // Memoize expensive calculations
  const quickStats = useMemo(() => [
    { icon: BarChart3, label: 'Active Campaigns', value: '12', color: 'text-blue-500' },
    { icon: Users, label: 'Total Reach', value: '2.4M', color: 'text-green-500' },
    { icon: TargetIcon, label: 'Avg. CTR', value: '3.2%', color: 'text-purple-500' },
  ], []);

  // Optimize real-time updates with longer intervals and debouncing
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => ({
        ...prev,
        metrics: getUpdatedMetrics()
      }));
    }, 15000); // Update every 15 seconds instead of 10

    return () => clearInterval(interval);
  }, []);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Reduced from 1.5 seconds

    return () => clearTimeout(timer);
  }, []);

  // Hide welcome message after 2.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Memoized callback for FAB actions
  const handleFABAction = useCallback((action: string) => {
    setSelectedAction(action);
    console.log(`FAB Action: ${action}`);
    
    // Show action feedback
    setTimeout(() => {
      setSelectedAction(null);
    }, 2000);
  }, []);

  if (isLoading) {
    return <LoadingScreen isLoading={isLoading} />;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Optimized static background - no animations */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-purple-500/3 to-pink-500/3" />
        
        {/* Floating magical particles */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400/30 rounded-full animate-pulse" />
        <div className="absolute top-40 right-20 w-1 h-1 bg-purple-400/30 rounded-full animate-ping" />
        <div className="absolute bottom-40 left-20 w-1.5 h-1.5 bg-pink-400/30 rounded-full animate-pulse" />
        <div className="absolute bottom-20 right-10 w-1 h-1 bg-blue-400/20 rounded-full animate-ping" />
      </div>

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(({ id, props }) => (
          <div key={id} className="relative">
            <Notification
              {...props}
              onClose={() => removeNotification(id)}
            />
          </div>
        ))}
      </div>

      <MemoizedHeader />
      
      <div className="flex">
        <MemoizedSidebar />
        
        <main className="flex-1 p-2 sm:p-3 lg:p-6 xl:p-8 relative z-10">
          <WelcomeMessage showWelcome={showWelcome} />

          <div className="space-y-2 sm:space-y-3 lg:space-y-6 xl:space-y-8">
            {/* Page Header - Mobile Optimized */}
            <motion.div 
              className="space-y-1 sm:space-y-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-foreground">
                Dashboard Overview
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                Monitor your marketing performance and track key metrics in real-time.
              </p>
            </motion.div>

            {/* Quick Stats Row - Mobile Optimized */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 xl:gap-6">
              {quickStats.map((stat, index) => (
                <QuickStatsCard key={stat.label} stat={stat} index={index} />
              ))}
            </div>

            {/* Metric Cards */}
            <div className="space-y-2 sm:space-y-3 lg:space-y-4 xl:space-y-6">
              <MemoizedMetricCardsGrid metrics={data.metrics} />
            </div>

            {/* Charts Grid - Mobile Optimized */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 xl:gap-6">
              <MemoizedRevenueChart data={data.revenueData} delay={0.1} />
              <MemoizedUsersChart data={data.userData} delay={0.2} />
            </div>

            {/* Additional Charts Row - Mobile Optimized */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 xl:gap-6">
              <div className="lg:col-span-1">
                <MemoizedChannelsChart data={data.topChannels} delay={0.3} />
              </div>
              
              {/* Stats Cards - Mobile Optimized */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                  <StatsCard
                    title="Avg. Session Duration"
                    value="4m 32s"
                    icon={Activity}
                    color="from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800"
                    delay={0.4}
                  />
                  
                  <StatsCard
                    title="Bounce Rate"
                    value="23.4%"
                    icon={Target}
                    color="from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800"
                    delay={0.5}
                  />
                </div>
                
                {/* Additional Small Widgets Beside Pie Chart */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 mt-2 sm:mt-3 lg:mt-4">
                  {/* Small Widget 1 - Click Through Rate */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                    whileHover={{ 
                      scale: 1.02, 
                      y: -2,
                      transition: { duration: 0.2 }
                    }}
                    className="group relative"
                  >
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/5 via-cyan-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-lg" />
                    <div className="relative bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900 border border-cyan-200 dark:border-cyan-800 rounded-xl p-2 sm:p-3 lg:p-4 flex flex-col justify-between hover:scale-105 transition-transform duration-200">
                      <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2 lg:mb-3">
                        <div className="p-1 sm:p-1.5 lg:p-2 rounded-lg bg-white/20 flex-shrink-0">
                          <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />
                        </div>
                        <h3 className="text-xs font-medium text-white truncate">CTR</h3>
                      </div>
                      <div>
                        <p className="text-sm sm:text-lg lg:text-xl font-bold text-white mb-1">2.8%</p>
                        <p className="text-xs text-white/80 mb-1 sm:mb-2 lg:mb-3">+0.3% from last week</p>
                      </div>
                      <div className="mt-1 sm:mt-2">
                        <div className="h-1 sm:h-1.5 lg:h-2 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-white/40 rounded-full w-3/4" />
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6 bg-gradient-to-br from-white/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </motion.div>

                  {/* Small Widget 2 - Impressions */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7, duration: 0.3 }}
                    whileHover={{ 
                      scale: 1.02, 
                      y: -2,
                      transition: { duration: 0.2 }
                    }}
                    className="group relative"
                  >
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-pink-500/5 via-pink-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-lg" />
                    <div className="relative bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 border border-pink-200 dark:border-pink-800 rounded-xl p-2 sm:p-3 lg:p-4 flex flex-col justify-between hover:scale-105 transition-transform duration-200">
                      <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2 lg:mb-3">
                        <div className="p-1 sm:p-1.5 lg:p-2 rounded-lg bg-white/20 flex-shrink-0">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />
                        </div>
                        <h3 className="text-xs font-medium text-white truncate">Impressions</h3>
                      </div>
                      <div>
                        <p className="text-sm sm:text-lg lg:text-xl font-bold text-white mb-1">1.2M</p>
                        <p className="text-xs text-white/80 mb-1 sm:mb-2 lg:mb-3">+15% from last week</p>
                      </div>
                      <div className="mt-1 sm:mt-2">
                        <div className="h-1 sm:h-1.5 lg:h-2 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-white/40 rounded-full w-4/5" />
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6 bg-gradient-to-br from-white/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Top Performing Campaign - Mobile Optimized */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 xl:gap-6">
              <StatsCard
                title="Top Performing Campaign"
                value="Product Launch"
                subtitle="ROAS: 4.1x | Spend: $23,400"
                icon={Zap}
                color="from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800"
                delay={0.8}
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                {/* Small Widget 1 - Conversion Rate */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9, duration: 0.3 }}
                  whileHover={{ 
                    scale: 1.02, 
                    y: -2,
                    transition: { duration: 0.2 }
                  }}
                  className="group relative"
                >
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500/5 via-emerald-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-lg" />
                  <div className="relative bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border border-emerald-200 dark:border-emerald-800 rounded-xl p-2 sm:p-3 lg:p-4 flex flex-col justify-between hover:scale-105 transition-transform duration-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2 lg:mb-3">
                      <div className="p-1 sm:p-1.5 lg:p-2 rounded-lg bg-white/20 flex-shrink-0">
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />
                      </div>
                      <h3 className="text-xs font-medium text-white truncate">Conversion Rate</h3>
                    </div>
                    <div>
                      <p className="text-sm sm:text-lg lg:text-xl font-bold text-white mb-1">3.2%</p>
                      <p className="text-xs text-white/80 mb-1 sm:mb-2 lg:mb-3">+0.8% from last month</p>
                    </div>
                    <div className="mt-1 sm:mt-2">
                      <div className="h-1 sm:h-1.5 lg:h-2 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white/40 rounded-full w-2/3" />
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6 bg-gradient-to-br from-white/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </motion.div>

                {/* Small Widget 2 - Cost per Click */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.0, duration: 0.3 }}
                  whileHover={{ 
                    scale: 1.02, 
                    y: -2,
                    transition: { duration: 0.2 }
                  }}
                  className="group relative"
                >
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-500/5 via-orange-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-lg" />
                  <div className="relative bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border border-orange-200 dark:border-orange-800 rounded-xl p-2 sm:p-3 lg:p-4 flex flex-col justify-between hover:scale-105 transition-transform duration-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2 lg:mb-3">
                      <div className="p-1 sm:p-1.5 lg:p-2 rounded-lg bg-white/20 flex-shrink-0">
                        <Target className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />
                      </div>
                      <h3 className="text-xs font-medium text-white truncate">Cost per Click</h3>
                    </div>
                    <div>
                      <p className="text-sm sm:text-lg lg:text-xl font-bold text-white mb-1">$2.45</p>
                      <p className="text-xs text-white/80 mb-1 sm:mb-2 lg:mb-3">-12% from last month</p>
                    </div>
                    <div className="mt-1 sm:mt-2">
                      <div className="h-1 sm:h-1.5 lg:h-2 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white/40 rounded-full w-1/2" />
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6 bg-gradient-to-br from-white/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Conversion Chart */}
            <MemoizedConversionChart data={data.conversionData} delay={0.4} />

            {/* Data Table */}
            <MemoizedDataTable data={data.campaignData} delay={0.5} />
          </div>
        </main>
      </div>

      {/* Floating Action Button */}
      <MemoizedFloatingActionButton onAction={handleFABAction} />

      {/* Action Feedback */}
      <AnimatePresence>
        {selectedAction && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="fixed bottom-24 right-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
          >
            {selectedAction} action triggered!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
