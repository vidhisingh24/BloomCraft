import React from 'react';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  MessageSquareHeart, 
  ArrowRight
} from 'lucide-react';
import type { Order, CustomRequest, OrderStatus } from '../../types';
import { formatPaise } from '../../utils/currency';

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
  const newOrdersCount = orders.filter((o) => o.status === 'placed').length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'confirmed' || o.status === 'preparing').length;
  const readyOrdersCount = orders.filter((o) => o.status === 'ready' || o.status === 'shipped').length;
  const customRequestsCount = customRequests.filter((c) => c.status === 'received' || c.status === 'quoted').length;

  const recentOrders = orders.slice(0, 5);

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
            Live orders, custom requests, and studio workflow
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFE3E8]/80 border border-[#F4A6B7]/50 text-xs text-[#C0536A] font-medium shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#D96B82] animate-ping" />
          <span>Vadodara Studio Live</span>
        </div>
      </div>

      {/* 2. Four KPI Metric Cards */}
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

      {/* 3. Recent Orders Section */}
      <div className="bg-white rounded-3xl border border-[#F0E6E8] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#F0E6E8] flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#3D272A]">Recent Orders</h3>
            <p className="text-xs text-[#7A5B62]">Latest purchases placed on the BloomCraft demo store</p>
          </div>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-bold text-[#D96B82] hover:text-[#C0536A] flex items-center gap-1 transition-colors"
          >
            View All ({orders.length}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FFF0F3]/40 border-b border-[#F0E6E8] text-[#7A5B62] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5EDEF]">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#3D272A]">
                    {order.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-[#3D272A]">{order.customer.name}</p>
                    <p className="text-[10px] text-[#7A5B62]">+91 {order.customer.phone}</p>
                  </td>
                  <td className="py-3.5 px-4 max-w-[200px] truncate text-[#7A5B62]">
                    {order.items.map((it) => `${it.name || it.product?.name} (${it.quantity})`).join(', ')}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#3D272A]">
                    {formatPaise(order.pricing.total)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-xs font-medium text-[#3D272A]">
                      {order.delivery.method === 'vadodara_local' ? '📍 Vadodara Local' : order.delivery.method === 'college' ? '🏫 College' : '📦 Parcel'}
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
