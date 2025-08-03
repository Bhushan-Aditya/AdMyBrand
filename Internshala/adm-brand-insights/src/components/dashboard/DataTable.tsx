'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight, Search, Download, TrendingUp, Eye, Edit, MoreHorizontal } from 'lucide-react';
import { TableData } from '@/types';
import { cn } from '@/lib/utils';

interface DataTableProps {
  data: TableData[];
  delay?: number;
}

export function DataTable({ data, delay = 0 }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof TableData>('campaign');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const itemsPerPage = 5;

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

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    const filtered = data.filter(item => {
      const matchesSearch = item.campaign.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort data
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    return filtered;
  }, [data, searchTerm, statusFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: keyof TableData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300 border-gray-200 dark:border-gray-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300 border-gray-200 dark:border-gray-800';
    }
  };

  const getPerformanceColor = (roas: number) => {
    if (roas >= 4) return 'text-green-600 dark:text-green-400';
    if (roas >= 3) return 'text-blue-600 dark:text-blue-400';
    if (roas >= 2) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.6, ease: "easeOut" }}
      whileHover={{ scale: 1.01 }}
      onMouseMove={handleMouseMove}
      className="group relative"
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        animate={{
          background: "linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))"
        }}
      />

      <motion.div
        style={{ rotateX, rotateY }}
        className="relative"
      >
        <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-background/80 to-muted/30 backdrop-blur-xl hover:shadow-3xl transition-all duration-500 group-hover:bg-gradient-to-br group-hover:from-background/90 group-hover:to-muted/40">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center space-x-3">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Campaign Performance
                </CardTitle>
                <motion.div
                  className="flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: delay + 0.2 }}
                >
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {filteredAndSortedData.length} campaigns
                  </span>
                </motion.div>
              </div>
              <div className="flex items-center space-x-2">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="outline" size="sm" className="group">
                    <Download className="h-4 w-4 mr-2 group-hover:animate-bounce" />
                    Export
                  </Button>
                </motion.div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            {/* Filters */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + 0.1 }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background/50 backdrop-blur-sm border-0 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-background/50 backdrop-blur-sm border-0">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>

            {/* Table */}
            <div className="rounded-xl border border-white/10 bg-background/30 backdrop-blur-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 hover:bg-muted/30">
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 transition-colors duration-200"
                      onClick={() => handleSort('campaign')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Campaign</span>
                        {sortField === 'campaign' && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-blue-500"
                          >
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </motion.div>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 transition-colors duration-200"
                      onClick={() => handleSort('spend')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Spend</span>
                        {sortField === 'spend' && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-blue-500"
                          >
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </motion.div>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 transition-colors duration-200"
                      onClick={() => handleSort('impressions')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Impressions</span>
                        {sortField === 'impressions' && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-blue-500"
                          >
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </motion.div>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 transition-colors duration-200"
                      onClick={() => handleSort('clicks')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Clicks</span>
                        {sortField === 'clicks' && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-blue-500"
                          >
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </motion.div>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 transition-colors duration-200"
                      onClick={() => handleSort('conversions')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Conversions</span>
                        {sortField === 'conversions' && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-blue-500"
                          >
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </motion.div>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 transition-colors duration-200"
                      onClick={() => handleSort('ctr')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>CTR</span>
                        {sortField === 'ctr' && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-blue-500"
                          >
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </motion.div>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 transition-colors duration-200"
                      onClick={() => handleSort('cpc')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>CPC</span>
                        {sortField === 'cpc' && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-blue-500"
                          >
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </motion.div>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 transition-colors duration-200"
                      onClick={() => handleSort('roas')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>ROAS</span>
                        {sortField === 'roas' && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-blue-500"
                          >
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </motion.div>
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {paginatedData.map((row, index) => (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: delay + (index * 0.1) }}
                        className={cn(
                          "hover:bg-muted/30 transition-all duration-200 cursor-pointer",
                          hoveredRow === row.id && "bg-muted/20",
                          selectedRows.has(row.id) && "bg-blue-500/10"
                        )}
                        onMouseEnter={() => setHoveredRow(row.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        onClick={() => {
                          const newSelected = new Set(selectedRows);
                          if (newSelected.has(row.id)) {
                            newSelected.delete(row.id);
                          } else {
                            newSelected.add(row.id);
                          }
                          setSelectedRows(newSelected);
                        }}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            {row.campaign}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{formatCurrency(row.spend)}</TableCell>
                        <TableCell>{formatNumber(row.impressions)}</TableCell>
                        <TableCell>{formatNumber(row.clicks)}</TableCell>
                        <TableCell>{formatNumber(row.conversions)}</TableCell>
                        <TableCell>{row.ctr}%</TableCell>
                        <TableCell>${row.cpc}</TableCell>
                        <TableCell className={cn("font-bold", getPerformanceColor(row.roas))}>
                          {row.roas}x
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                            getStatusColor(row.status)
                          )}>
                            {row.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <AnimatePresence>
                            {hoveredRow === row.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex items-center space-x-1"
                              >
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <motion.div 
              className="flex items-center justify-between mt-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + 0.5 }}
            >
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} results
              </div>
              <div className="flex items-center space-x-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="bg-background/50 backdrop-blur-sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </motion.div>
                <span className="text-sm px-3 py-1 bg-muted/20 rounded-lg">
                  Page {currentPage} of {totalPages}
                </span>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="bg-background/50 backdrop-blur-sm"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            {/* Bottom accent line */}
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: delay + 0.8, duration: 0.5 }}
            />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
} 