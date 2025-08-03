'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Users, Target } from 'lucide-react';
import { MetricData } from '@/types';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  delay?: number;
}

export function MetricCard({ title, value, change, icon: Icon, delay = 0 }: MetricCardProps) {
  const isPositive = change >= 0;
  
  // Format value with proper decimal handling
  const formattedValue = typeof value === 'number' 
    ? new Intl.NumberFormat('en-US', { 
        style: title.toLowerCase().includes('revenue') ? 'currency' : undefined,
        currency: title.toLowerCase().includes('revenue') ? 'USD' : undefined,
        minimumFractionDigits: 0,
        maximumFractionDigits: title.toLowerCase().includes('revenue') ? 0 : 1,
        notation: value >= 1000000 ? 'compact' : 'standard',
        compactDisplay: 'short'
      }).format(value)
    : value;

  // Format change percentage with limited decimals
  const formattedChange = Math.abs(change).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.3, ease: "easeOut" }}
      whileHover={{ 
        scale: 1.02, 
        y: -4,
        transition: { duration: 0.2 }
      }}
      className="group relative h-full"
    >
      {/* Magical glow effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl" />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden rounded-xl">
        <div className="absolute -top-1 -right-1 w-1 h-1 sm:w-2 sm:h-2 bg-blue-400/30 rounded-full group-hover:animate-ping" />
        <div className="absolute -bottom-1 -left-1 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-purple-400/30 rounded-full group-hover:animate-pulse" />
      </div>

      <Card className="relative h-full overflow-hidden border-0 shadow-xl bg-gradient-to-br from-background/90 to-muted/30 backdrop-blur-xl hover:shadow-2xl transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-background/95 group-hover:to-muted/40 border border-white/10">
        <CardHeader className="pb-2 sm:pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
              {title}
            </CardTitle>
            <div className="p-1 sm:p-1.5 lg:p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 hover:scale-110 transition-transform duration-200 group-hover:shadow-lg">
              <Icon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative pt-0">
          <div className="space-y-2 sm:space-y-3">
            <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground leading-tight">
              {formattedValue}
            </div>
            
            <motion.div
              className="flex items-center space-x-1 sm:space-x-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.1 }}
            >
              {isPositive ? (
                <TrendingUp className="h-2 w-2 sm:h-3 sm:w-3 text-green-500 flex-shrink-0" />
              ) : (
                <TrendingDown className="h-2 w-2 sm:h-3 sm:w-3 text-red-500 flex-shrink-0" />
              )}
              <span className={`text-xs font-medium ${
                isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {isPositive ? '+' : ''}{formattedChange}%
              </span>
              <span className="text-xs text-muted-foreground truncate">from last month</span>
            </motion.div>
          </div>

          {/* Animated bottom accent line */}
          <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-0 group-hover:w-full transition-all duration-500 ease-out" />
          
          {/* Magical corner accent */}
          <div className="absolute top-0 right-0 w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface MetricCardsGridProps {
  metrics: MetricData;
}

export function MetricCardsGrid({ metrics }: MetricCardsGridProps) {
  const metricCards = [
    {
      title: "Total Revenue",
      value: metrics.revenue,
      change: Math.round(metrics.growth * 10) / 10, // Round to 1 decimal
      icon: DollarSign,
      delay: 0.1,
    },
    {
      title: "Active Users",
      value: metrics.users,
      change: 8.2,
      icon: Users,
      delay: 0.2,
    },
    {
      title: "Conversions",
      value: metrics.conversions,
      change: 12.5,
      icon: Target,
      delay: 0.3,
    },
    {
      title: "Growth Rate",
      value: `${Math.round(metrics.growth * 10) / 10}%`,
      change: 2.1,
      icon: TrendingUp,
      delay: 0.4,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 xl:gap-6">
      {metricCards.map((metric) => (
        <MetricCard
          key={metric.title}
          title={metric.title}
          value={metric.value}
          change={metric.change}
          icon={metric.icon}
          delay={metric.delay}
        />
      ))}
    </div>
  );
} 