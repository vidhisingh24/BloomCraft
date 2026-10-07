import React, { useMemo } from 'react';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  MessageSquareHeart, 
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';
import type { Order, CustomRequest, OrderStatus } from '../../types';
import { formatPaise } from '../../utils/currency';
import { formatISTDate } from '../../utils/date';
import { paymentMethodLabel } from '../../utils/orderLabels';

interface DashboardOverviewProps {
  orders: Order[];
  customRequests: CustomRequest[];
  products?: any[];
  onNavigateTab: (tab: 'overview' | 'orders' | 'custom' | 'products' | 'delivery') => void;
  onUpdateOrderStatus?: (orderId: string, newStatus: OrderStatus) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  orders,
  customRequests,
  onNavigateTab,
}) => {
  // Exact active metrics based on current orders state
  const newOrdersCount = orders.filter((o) => o.status === 'placed').length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'confirmed' || o.status === 'preparing').length;
  const readyOrdersCount = orders.filter((o) => o.status === 'ready' || o.status === 'shipped').length;
  const customRequestsCount = customRequests.filter((c) => c.status === 'received' || c.status === 'quoted').length;
  const completedOrdersCount = orders.filter((o) => o.status === 'delivered').length;

  const liveOrders = useMemo(() => orders.filter((o) => o.status !== 'cancelled'), [orders]);
  const receivedPaise = liveOrders
    .filter((o) => o.payment.status === 'paid')
    .reduce((sum, o) => sum + o.pricing.total, 0);
  const awaitingCheck = liveOrders.filter((o) => o.payment.status === 'awaiting_verification');
  const awaitingCheckPaise = awaitingCheck.reduce((sum, o) => sum + o.pricing.total, 0);
  const unpaidHandoverPaise = liveOrders
    .filter((o) => o.payment.method === 'cod' && o.payment.status === 'pending')
    .reduce((sum, o) => sum + o.pricing.total, 0);
  const upiCount = liveOrders.filter((o) => o.payment.method === 'upi').length;

  // Product-wise sales summary dynamically derived from orders
  const productSalesSummary = useMemo(() => {
    const summaryMap = new Map<string, { name: string; count: number; totalPaise: number; image?: string }>();

    liveOrders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.name;
        const existing = summaryMap.get(key) || { 
          name: key, 
          count: 0, 
          totalPaise: 0, 
          image: item.image 
        };
        const qty = item.quantity || 1;
        existing.count += qty;
        existing.totalPaise += item.priceAtAdd * qty;
        if (!existing.image && (item.image)) {
          existing.image = item.image;
        }
        summaryMap.set(key, existing);
      });
    });

    return Array.from(summaryMap.values()).sort((a, b) => b.totalPaise - a.totalPaise);
  }, [liveOrders]);

  // Orders sorted newest first by createdAt
  const sortedOrders = useMemo(() => {
    return [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders]);

  const recentOrders = sortedOrders.slice(0, 8);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'placed':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'preparing':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'ready':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };


  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#F4A6B7]/20">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D272A] tracking-tight">
            Maker Studio Overview 🌸
          </h1>
          <p className="text-sm text-[#7A5B62] font-medium">
            Live orders, custom requests, and studio sales records
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFE3E8]/80 border border-[#F4A6B7]/50 text-xs text-[#C0536A] font-medium shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#D96B82] animate-ping" />
          <span>Vadodara Studio Live</span>
        </div>
      </div>

      {/* 2. Four KPI Metric Cards (Active Workflow Status) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* New Orders */}
        <div
          onClick={() => onNavigateTab('orders')}
          className="bg-white p-5 rounded-3xl border border-[#F0E6E8] shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#7A5B62] uppercase tracking-wider">New Orders</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold font-serif text-[#3D272A]">{newOrdersCount}</span>
            <span className="text-xs font-semibold text-[#D96B82] group-hover:underline flex items-center gap-0.5">
              View <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Pending Crafting */}
        <div
          onClick={() => onNavigateTab('orders')}
          className="bg-white p-5 rounded-3xl border border-[#F0E6E8] shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#7A5B62] uppercase tracking-wider">In Crafting</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold font-serif text-[#3D272A]">{pendingOrdersCount}</span>
            <span className="text-xs font-semibold text-[#D96B82] group-hover:underline flex items-center gap-0.5">
              Manage <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Ready / In Transit */}
        <div
          onClick={() => onNavigateTab('delivery')}
          className="bg-white p-5 rounded-3xl border border-[#F0E6E8] shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#7A5B62] uppercase tracking-wider">Ready / Shipped</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold font-serif text-[#3D272A]">{readyOrdersCount}</span>
            <span className="text-xs font-semibold text-[#D96B82] group-hover:underline flex items-center gap-0.5">
              Hub <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Custom Requests */}
        <div
          onClick={() => onNavigateTab('custom')}
          className="bg-white p-5 rounded-3xl border border-[#F0E6E8] shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#7A5B62] uppercase tracking-wider">Custom Quotes</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <MessageSquareHeart className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold font-serif text-[#3D272A]">{customRequestsCount}</span>
            <span className="text-xs font-semibold text-[#D96B82] group-hover:underline flex items-center gap-0.5">
              Quotes <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* 3. Money & fulfilment summary (all figures come from the orders in the database) */}
      <div className="bg-gradient-to-br from-white via-[#FFF9FA] to-[#FFF0F3] rounded-3xl border border-[#F4A6B7]/40 p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F4A6B7]/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#FFE3E8] border border-[#F4A6B7]/40 flex items-center justify-center text-[#D96B82] text-xl shadow-xs">
              💰
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl text-[#3D272A]">Sales & Payments</h2>
              <p className="text-xs text-[#7A5B62]">
                {liveOrders.length} active {liveOrders.length === 1 ? 'order' : 'orders'} • {upiCount} paid by UPI •{' '}
                {liveOrders.length - upiCount} pay on handover
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {awaitingCheck.length > 0 && (
              <button
                onClick={() => onNavigateTab('orders')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800 hover:bg-amber-100"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> {awaitingCheck.length} UPI {awaitingCheck.length === 1 ? 'payment' : 'payments'} to check
              </button>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFE3E8] border border-[#F4A6B7]/50 text-xs font-bold text-[#C0536A]">
              <CheckCircle className="w-3.5 h-3.5" /> {completedOrdersCount} delivered
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#F0E6E8] shadow-xs">
            <span className="text-[11px] font-bold text-[#7A5B62] uppercase tracking-wider block mb-1">Received</span>
            <span className="font-serif font-bold text-2xl sm:text-3xl text-[#0A7B3E] block">{formatPaise(receivedPaise)}</span>
            <span className="text-[10px] text-[#A38B90] mt-1 block">Orders marked paid</span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#F0E6E8] shadow-xs">
            <span className="text-[11px] font-bold text-[#7A5B62] uppercase tracking-wider block mb-1">UPI to verify</span>
            <span className="font-serif font-bold text-2xl sm:text-3xl text-amber-700 block">{formatPaise(awaitingCheckPaise)}</span>
            <span className="text-[10px] text-[#A38B90] mt-1 block">Match the UTR in your bank app, then mark paid</span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#F0E6E8] shadow-xs">
            <span className="text-[11px] font-bold text-[#7A5B62] uppercase tracking-wider block mb-1">To collect on handover</span>
            <span className="font-serif font-bold text-2xl sm:text-3xl text-[#D96B82] block">{formatPaise(unpaidHandoverPaise)}</span>
            <span className="text-[10px] text-[#A38B90] mt-1 block">Pay-on-handover orders not yet paid</span>
          </div>
        </div>

        {/* Product-Wise Sales Breakdown */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#3D272A] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D96B82]" /> Product Breakdown ({productSalesSummary.length} products • {liveOrders.reduce((sum, o) => sum + o.items.reduce((n, it) => n + it.quantity, 0), 0)} units)
            </span>

          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {productSalesSummary.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-white/90 p-3 rounded-2xl border border-[#F0E6E8] hover:border-[#F4A6B7]/60 transition-all flex flex-col justify-between"
              >
                <div>
                  <p className="font-semibold text-xs text-[#3D272A] line-clamp-1" title={item.name}>
                    {item.name}
                  </p>
                  <p className="text-[11px] text-[#7A5B62] mt-0.5">
                    {item.count} {item.count === 1 ? 'unit crafted' : 'units crafted'}
                  </p>
                </div>
                <div className="mt-2 pt-1.5 border-t border-[#F5EDEF] flex justify-between items-center">
                  <span className="text-[10px] font-bold text-[#A38B90]">Revenue</span>
                  <span className="font-serif font-bold text-xs text-[#D96B82]">
                    {formatPaise(item.totalPaise)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Recent Orders Section */}
      <div className="bg-white rounded-3xl border border-[#F0E6E8] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#F0E6E8] flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#3D272A]">Recent Orders</h3>
            <p className="text-xs text-[#7A5B62]">
              Newest first ({orders.length} total)
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-bold text-[#D96B82] hover:text-[#C0536A] flex items-center gap-1 transition-colors cursor-pointer"
          >
            View All ({orders.length}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FFF0F3]/40 border-b border-[#F0E6E8] text-[#7A5B62] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5EDEF]">
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-[#7A5B62]">
                    No orders yet. New orders appear here instantly. 🌸
                  </td>
                </tr>
              )}
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-[#3D272A] block">{order.id}</span>
                    <span className="text-[10px] text-[#A38B90]">{formatISTDate(order.createdAt)}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-[#3D272A]">{order.customer.name}</p>
                    <p className="text-[10px] text-[#7A5B62]">
                      {order.customer.phone ? `+91 ${order.customer.phone}` : "In-person sale"}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 max-w-[220px] truncate text-[#7A5B62]">
                    {order.items.map((it) => `${it.name} (${it.quantity})`).join(', ')}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#3D272A]">
                    {formatPaise(order.pricing.total)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-block font-semibold text-[11px] text-[#3D272A] bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#EBD8DC]">
                      {paymentMethodLabel(order.payment)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(order.status)}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
