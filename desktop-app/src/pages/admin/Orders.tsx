'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Search, Filter, ChevronDown, MoreHorizontal, Trash2, Clock, DollarSign } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getOrders, updateOrderStatus, updatePaymentStatus, deleteOrder, getOrderCounts } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { fmtCurrency } from '@/lib/utils';
import type { OrderWithDetails } from '@/types';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending', color: 'warning' },
  { value: 'PREPARING', label: 'Preparing', color: 'default' },
  { value: 'READY', label: 'Ready', color: 'secondary' },
  { value: 'COMPLETED', label: 'Completed', color: 'success' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'destructive' },
] as const;

const PAYMENT_STATUS_OPTIONS = [
  { value: 'UNPAID', label: 'Unpaid', color: 'warning' },
  { value: 'PAID', label: 'Paid', color: 'success' },
  { value: 'PARTIAL', label: 'Partial', color: 'default' },
  { value: 'REFUNDED', label: 'Refunded', color: 'destructive' },
] as const;

const PAYMENT_METHODS = ['CASH', 'UPI', 'CARD', 'OTHER'] as const;

export default function Orders() {
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const tableFilter = 'all';
  const [deleteOrderId, setDeleteOrderId] = useState<number | null>(null);
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; order: OrderWithDetails } | null>(null);
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; order: OrderWithDetails } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const queryClient = useQueryClient();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', page, size, statusFilter, paymentStatusFilter, tableFilter],
    queryFn: () => getOrders({
      page,
      size,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      paymentStatus: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined,
      tableNumber: tableFilter !== 'all' ? tableFilter : undefined,
    }),
    placeholderData: (previousData) => previousData,
  });

  const { data: countsData } = useQuery({
    queryKey: ['order-counts'],
    queryFn: () => getOrderCounts(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateOrderStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-counts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Order status updated');
      setStatusDialog(null);
    },
    onError: () => toast.error('Failed to update status'),
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, paymentStatus, paymentMethod }: { id: number; paymentStatus: string; paymentMethod?: string }) =>
      updatePaymentStatus(id, { payment_status: paymentStatus, payment_method: paymentMethod }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-counts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Payment status updated');
      setPaymentDialog(null);
    },
    onError: () => toast.error('Failed to update payment status'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-counts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Order deleted');
      setDeleteOrderId(null);
    },
    onError: () => toast.error('Failed to delete order'),
  });

  const orders = ordersData?.data?.content || [];
  const totalElements = ordersData?.data?.total_elements || 0;
  const totalPages = ordersData?.data?.total_pages || 0;
  const counts = countsData?.data || {};

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find(s => s.value === status);
    return <Badge variant={option?.color as any}>{option?.label || status}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const option = PAYMENT_STATUS_OPTIONS.find(s => s.value === status);
    return <Badge variant={option?.color as any}>{option?.label || status}</Badge>;
  };

  const openStatusDialog = (order: OrderWithDetails) => setStatusDialog({ open: true, order });
  const openPaymentDialog = (order: OrderWithDetails) => setPaymentDialog({ open: true, order });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and track all orders</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        {STATUS_OPTIONS.map((stat) => (
          <Card key={stat.value} className="text-center">
            <CardContent className="p-4">
              <p className="text-2xl font-bold" style={{ color: `hsl(var(--${stat.color}))` }}>
                {counts[stat.value] || 0}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setPage(0)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Status
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {['all', ...STATUS_OPTIONS.map(s => s.value)].map((status) => (
                <DropdownMenuItem
                  key={status}
                  onSelect={() => { setStatusFilter(status); setPage(0); }}
                  className={statusFilter === status ? 'bg-accent text-accent-foreground' : ''}
                >
                  {status === 'all' ? 'All Statuses' : STATUS_OPTIONS.find(s => s.value === status)?.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Payment
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {['all', ...PAYMENT_STATUS_OPTIONS.map(s => s.value)].map((status) => (
                <DropdownMenuItem
                  key={status}
                  onSelect={() => { setPaymentStatusFilter(status); setPage(0); }}
                  className={paymentStatusFilter === status ? 'bg-accent text-accent-foreground' : ''}
                >
                  {status === 'all' ? 'All Payment Status' : PAYMENT_STATUS_OPTIONS.find(s => s.value === status)?.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  {['Order ID', 'Customer', 'Table', 'Items', 'Status', 'Payment', 'Amount', 'Time', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">Loading orders...</td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">No orders found</td>
                  </tr>
                ) : (
                  orders.map((order) => (
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
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {order.items.slice(0, 3).map((item) => (
                            <Badge key={item.id} variant="outline" className="text-xs">
                              {item.product_name} x{item.quantity}
                            </Badge>
                          ))}
                          {order.items.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{order.items.length - 3} more</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(order.order.status)}</td>
                      <td className="px-4 py-3">{getPaymentBadge(order.order.payment_status)}</td>
                      <td className="px-4 py-3 font-bold">{fmtCurrency(Number(order.order.total_amount))}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(order.order.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => openStatusDialog(order)}>
                              <Clock className="w-4 h-4 mr-2" /> Change Status
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => openPaymentDialog(order)}>
                              <DollarSign className="w-4 h-4 mr-2" /> Payment Status
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setDeleteOrderId(order.order.id)} className="text-destructive focus:text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages} ({totalElements} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Change Dialog */}
      <AnimatePresence>
        {statusDialog && (
          <Dialog open={statusDialog.open} onOpenChange={(open) => !open && setStatusDialog(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Order Status</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2 sm:grid-cols-2">
                {STATUS_OPTIONS.map((status) => (
                  <Button
                    key={status.value}
                    variant={statusDialog.order.order.status === status.value ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => updateStatusMutation.mutate({ id: statusDialog.order.order.id, status: status.value })}
                    disabled={updateStatusMutation.isPending}
                  >
                    {status.label}
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Payment Status Dialog */}
      <AnimatePresence>
        {paymentDialog && (
          <Dialog open={paymentDialog.open} onOpenChange={(open) => !open && setPaymentDialog(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Payment Status</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  {PAYMENT_STATUS_OPTIONS.map((status) => (
                    <Button
                      key={status.value}
                      variant={paymentDialog.order.order.payment_status === status.value ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => updatePaymentMutation.mutate({
                        id: paymentDialog.order.order.id,
                        paymentStatus: status.value,
                        paymentMethod: status.value === 'PAID' ? paymentMethod : undefined,
                      })}
                      disabled={updatePaymentMutation.isPending}
                    >
                      {status.label}
                    </Button>
                  ))}
                </div>
                {paymentDialog.order.order.payment_status !== 'PAID' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Payment Method (for Paid status)</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteOrderId && (
          <Dialog open={true} onOpenChange={(open) => !open && setDeleteOrderId(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Order?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground mb-4">
                Are you sure you want to delete order <strong>#{deleteOrderId}</strong>? This action cannot be undone.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOrderId(null)}>Cancel</Button>
                <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteOrderId)} disabled={deleteMutation.isPending}>
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}