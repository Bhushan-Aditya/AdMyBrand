import { DashboardData } from '@/types';

// Generate date range for the last 30 days
const generateDateRange = () => {
  const dates = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

// Generate realistic chart data with some variation
const generateChartData = (baseValue: number, variation: number = 0.3) => {
  const dates = generateDateRange();
  return dates.map((date, index) => ({
    date,
    value: Math.max(0, baseValue + (Math.random() - 0.5) * variation * baseValue + Math.sin(index * 0.2) * baseValue * 0.1)
  }));
};

// Generate campaign data
const generateCampaignData = (): DashboardData['campaignData'] => [
  {
    id: '1',
    campaign: 'Summer Sale Campaign',
    spend: 15420.50,
    impressions: 125000,
    clicks: 3200,
    conversions: 156,
    ctr: 2.56,
    cpc: 4.82,
    roas: 3.2,
    status: 'active'
  },
  {
    id: '2',
    campaign: 'Brand Awareness Q2',
    spend: 8900.00,
    impressions: 89000,
    clicks: 2100,
    conversions: 89,
    ctr: 2.36,
    cpc: 4.24,
    roas: 2.8,
    status: 'active'
  },
  {
    id: '3',
    campaign: 'Product Launch',
    spend: 23400.75,
    impressions: 198000,
    clicks: 5200,
    conversions: 234,
    ctr: 2.63,
    cpc: 4.50,
    roas: 4.1,
    status: 'active'
  },
  {
    id: '4',
    campaign: 'Holiday Special',
    spend: 18750.25,
    impressions: 156000,
    clicks: 4100,
    conversions: 187,
    ctr: 2.63,
    cpc: 4.57,
    roas: 3.5,
    status: 'paused'
  },
  {
    id: '5',
    campaign: 'Retargeting Campaign',
    spend: 12300.00,
    impressions: 98000,
    clicks: 2800,
    conversions: 123,
    ctr: 2.86,
    cpc: 4.39,
    roas: 2.9,
    status: 'active'
  }
];

// Generate channel data for pie chart
const generateChannelData = () => [
  { name: 'Google Ads', value: 45, color: '#3B82F6' },
  { name: 'Facebook Ads', value: 28, color: '#8B5CF6' },
  { name: 'Instagram Ads', value: 15, color: '#10B981' },
  { name: 'LinkedIn Ads', value: 8, color: '#F59E0B' },
  { name: 'Other', value: 4, color: '#EF4444' }
];

export const mockDashboardData: DashboardData = {
  metrics: {
    revenue: 125400.50,
    users: 45600,
    conversions: 789,
    growth: 12.5
  },
  revenueData: generateChartData(4000, 0.4),
  userData: generateChartData(1500, 0.3),
  conversionData: generateChartData(25, 0.5),
  campaignData: generateCampaignData(),
  topChannels: generateChannelData()
};

// Function to simulate real-time updates
export const getUpdatedMetrics = () => ({
  revenue: mockDashboardData.metrics.revenue + (Math.random() - 0.5) * 1000,
  users: mockDashboardData.metrics.users + Math.floor((Math.random() - 0.5) * 100),
  conversions: mockDashboardData.metrics.conversions + Math.floor((Math.random() - 0.5) * 10),
  growth: mockDashboardData.metrics.growth + (Math.random() - 0.5) * 2
}); 