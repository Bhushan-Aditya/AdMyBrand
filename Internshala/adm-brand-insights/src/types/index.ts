export interface MetricData {
  revenue: number;
  users: number;
  conversions: number;
  growth: number;
}

export interface ChartData {
  date: string;
  value: number;
  category?: string;
}

export interface TableData {
  id: string;
  campaign: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  roas: number;
  status: 'active' | 'paused' | 'completed';
}

export interface DashboardData {
  metrics: MetricData;
  revenueData: ChartData[];
  userData: ChartData[];
  conversionData: ChartData[];
  campaignData: TableData[];
  topChannels: { name: string; value: number; color: string }[];
} 