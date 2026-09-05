'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, ShoppingBag, DollarSign, Package, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardMetrics, getOrders, getTopProducts, getTopCategories } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, fmtCurrency } from '@/lib/utils';
import type { DashboardMetrics } from '@/types';

const FILTER_OPTIONS = [
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
  { value: 'yearly', label: 'This Year' },
];

const STAT_CARDS: { key: keyof DashboardMetrics; label: string; icon: typeof ShoppingBag; color: string; iconColor: string; isCurrency?: boolean }[] = [
  { key: 'total_orders', label: 'Total Orders', icon: ShoppingBag, color: 'bg-blue-500', iconColor: 'text-blue-500' },
  { key: 'total_revenue', label: 'Total Revenue', icon: DollarSign, color: 'bg-green-500', iconColor: 'text-green-500', isCurrency: true },
  { key: 'pending_orders', label: 'Pending', icon: Clock, color: 'bg-yellow-500', iconColor: 'text-yellow-500' },
  { key: 'completed_orders', label: 'Completed', icon: CheckCircle, color: 'bg-emerald-500', iconColor: 'text-emerald-500' },
];

export default function Dashboard() {
  const [filter, setFilter] = useState('monthly');

  const { data: metricsData } = useQuery({
    queryKey: ['dashboard-metrics', filter],
    queryFn: () => getDashboardMetrics(filter),
  });

  const { data: recentOrdersData } = useQuery({
    queryKey: ['recent-orders', filter],
    queryFn: () => getOrders({ size: 5, startDate: filter === 'daily' ? new Date().toISOString().split('T')[0] : undefined }),
  });

  const { data: topProductsData } = useQuery({
    queryKey: ['top-products', filter],
    queryFn: () => getTopProducts(filter, 5),
  });

  const { data: topCategoriesData } = useQuery({
    queryKey: ['top-categories', filter],
    queryFn: () => getTopCategories(filter, 5),
  });

  const metrics = metricsData?.data;
  const recentOrders = recentOrdersData?.data?.content || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
      PENDING: 'warning',
      PREPARING: 'default',
      READY: 'secondary',
      COMPLETED: 'success',
      CANCELLED: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of your cafe performance</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((stat) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * STAT_CARDS.indexOf(stat) }}
            className="bg-card rounded-2xl border border-border p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">
                  {stat.isCurrency
                    ? fmtCurrency(Number(metrics?.[stat.key] || 0))
                    : metrics?.[stat.key]?.toLocaleString() || '0'}
                </p>
              </div>
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', stat.color)}>
                <stat.icon className={cn('w-6 h-6 text-white', stat.iconColor)} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cancelled Orders</p>
                <p className="text-2xl font-bold text-destructive">{metrics?.cancelled_orders?.toLocaleString() || '0'}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{metrics?.total_customers?.toLocaleString() || '0'}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{metrics?.total_products?.toLocaleString() || '0'}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">{fmtCurrency(Number(metrics?.avg_order_value || 0))}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-pink-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProductsData?.data?.slice(0, 5).map((product, index) => (
                <motion.div
                  key={product.product_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{product.product_name}</p>
                      <p className="text-xs text-muted-foreground">{product.total_quantity} sold</p>
                    </div>
                  </div>
                  <p className="font-bold text-primary">{fmtCurrency(Number(product.total_revenue))}</p>
                </motion.div>
              ))}
              {(!topProductsData?.data || topProductsData.data.length === 0) && (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Top Categories by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCategoriesData?.data?.slice(0, 5).map((category, index) => (
                <motion.div
                  key={category.category_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-green-500/10 text-green-500 text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{category.category_name}</p>
                      <p className="text-xs text-muted-foreground">{category.total_quantity} items</p>
                    </div>
                  </div>
                  <p className="font-bold text-green-500">{fmtCurrency(Number(category.total_revenue))}</p>
                </motion.div>
              ))}
              {(!topCategoriesData?.data || topCategoriesData.data.length === 0) && (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Order ID', 'Customer', 'Table', 'Status', 'Payment', 'Amount', 'Time'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {recentOrders.map((order) => (
                    <tr key={order.order.id} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-primary">#{order.order.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{order.customer_name || 'Walk-in'}</p>
                        <p className="text-xs text-muted-foreground">{order.customer_mobile || ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        {order.order.table_number ? (
                          <Badge variant="secondary">{order.order.table_number}</Badge>
                        ) : (
                          <Badge variant="outline">Takeaway</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(order.order.status)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={order.order.payment_status === 'PAID' ? 'success' : 'warning'}>
                          {order.order.payment_status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-bold">{fmtCurrency(Number(order.order.total_amount))}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(order.order.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No recent orders</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}