'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Package, ShoppingBag, Calendar, Download, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardMetrics, getTopProducts, getTopCategories, getSalesReport } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, fmtCurrency } from '@/lib/utils';
import type { TopProduct, TopCategory, SalesReport } from '@/types';

const FILTER_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function Analytics() {
  const [filter, setFilter] = useState('monthly');
  const [salesFilter, setSalesFilter] = useState('monthly');

  const { data: metricsData } = useQuery({
    queryKey: ['analytics-metrics', filter],
    queryFn: () => getDashboardMetrics(filter),
  });

  const { data: topProductsData } = useQuery({
    queryKey: ['top-products', filter],
    queryFn: () => getTopProducts(filter, 10),
  });

  const { data: topCategoriesData } = useQuery({
    queryKey: ['top-categories', filter],
    queryFn: () => getTopCategories(filter, 10),
  });

  const { data: salesReportData } = useQuery({
    queryKey: ['sales-report', salesFilter],
    queryFn: () => getSalesReport(salesFilter),
  });

  const metrics = metricsData?.data;

  const exportCSV = (data: (SalesReport | TopProduct | TopCategory)[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(v => `"${v}"`).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Business insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            {FILTER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold">{fmtCurrency(Number(metrics?.total_revenue || 0))}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-green-500" />
              </div>
            </div>
            <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {metrics?.completed_orders || 0} completed orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-3xl font-bold">{metrics?.total_orders?.toLocaleString() || '0'}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <ShoppingBag className="w-7 h-7 text-blue-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Avg: {fmtCurrency(Number(metrics?.avg_order_value || 0))} per order
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Products Sold</p>
                <p className="text-3xl font-bold">
                  {topProductsData?.data?.reduce((sum, p) => sum + p.total_quantity, 0) || 0}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Package className="w-7 h-7 text-purple-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {topProductsData?.data?.length || 0} unique products
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Orders</p>
                <p className="text-3xl font-bold text-yellow-500">{metrics?.pending_orders || 0}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-7 h-7 text-yellow-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Products by Revenue</CardTitle>
            <Button variant="outline" size="sm" onClick={() => exportCSV(topProductsData?.data || [], 'top_products')}>
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProductsData?.data?.map((product, index) => (
                <motion.div
                  key={product.product_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                      index < 3 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-primary/10 text-primary'
                    )}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{product.product_name}</p>
                      <p className="text-xs text-muted-foreground">{product.total_quantity} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{fmtCurrency(Number(product.total_revenue))}</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </motion.div>
              ))}
              {(!topProductsData?.data || topProductsData.data.length === 0) && (
                <p className="text-center text-muted-foreground py-8">No sales data for this period</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Categories by Revenue</CardTitle>
            <Button variant="outline" size="sm" onClick={() => exportCSV(topCategoriesData?.data || [], 'top_categories')}>
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCategoriesData?.data?.map((category, index) => (
                <motion.div
                  key={category.category_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                      index < 3 ? 'bg-green-500/20 text-green-500' : 'bg-primary/10 text-primary'
                    )}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{category.category_name}</p>
                      <p className="text-xs text-muted-foreground">{category.total_quantity} items</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-500">{fmtCurrency(Number(category.total_revenue))}</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </motion.div>
              ))}
              {(!topCategoriesData?.data || topCategoriesData.data.length === 0) && (
                <p className="text-center text-muted-foreground py-8">No sales data for this period</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sales Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Sales Trend</CardTitle>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <select
                value={salesFilter}
                onChange={(e) => setSalesFilter(e.target.value)}
                className="px-2 py-1 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                {FILTER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <Button variant="outline" size="sm" onClick={() => exportCSV(salesReportData?.data || [], 'sales_report')}>
                <Download className="w-4 h-4 mr-1" /> Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Period', 'Orders', 'Revenue', 'Avg/Order'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {salesReportData?.data?.map((row: SalesReport) => (
                    <tr key={row.date} className="hover:bg-secondary/50">
                      <td className="px-4 py-3 font-medium">{row.date}</td>
                      <td className="px-4 py-3">{row.total_orders.toLocaleString()}</td>
                      <td className="px-4 py-3 font-bold text-primary">{fmtCurrency(Number(row.total_revenue))}</td>
                      <td className="px-4 py-3">
                        {row.total_orders > 0
                          ? fmtCurrency(Number(row.total_revenue) / row.total_orders)
                          : fmtCurrency(0)}
                      </td>
                    </tr>
                  ))}
                  {(!salesReportData?.data || salesReportData.data.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No sales data for this period</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-green-500/10 rounded-xl">
              <p className="text-sm text-green-500 font-medium">Completed Orders Revenue</p>
              <p className="text-2xl font-bold text-green-500">
                {fmtCurrency(Number(metrics?.total_revenue || 0))}
              </p>
            </div>
            <div className="p-4 bg-yellow-500/10 rounded-xl">
              <p className="text-sm text-yellow-500 font-medium">Pending Collection</p>
              <p className="text-2xl font-bold text-yellow-500">
                {fmtCurrency(0)}
              </p>
            </div>
            <div className="p-4 bg-red-500/10 rounded-xl">
              <p className="text-sm text-red-500 font-medium">Cancelled Orders Loss</p>
              <p className="text-2xl font-bold text-red-500">
                {fmtCurrency(0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}