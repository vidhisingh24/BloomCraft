import React from 'react';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  MessageSquareHeart, 
  Plus, 
  ArrowRight
} from 'lucide-react';
import type { DashboardOrder, DashboardCustomRequest } from '../../data/dashboardData';

interface DashboardOverviewProps {
  orders: DashboardOrder[];
  customRequests: DashboardCustomRequest[];
  onNavigateTab: (tab: 'overview' | 'orders' | 'custom' | 'products' | 'delivery') => void;
  onOpenAddProduct: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  orders,
  customRequests,
  onNavigateTab,
  onOpenAddProduct,
}) => {
  const newOrdersCount = orders.filter((o) => o.status === 'New').length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'Preparing').length;
  const readyOrdersCount = orders.filter((o) => o.status === 'Ready').length;
  const newCustomCount = customRequests.filter((c) => c.status === 'New Request' || c.status === 'Reviewing').length;

  const recentOrders = orders.slice(0, 4);

  const getStatusBadge = (status: DashboardOrder['status']) => {
    switch (status) {
      case 'New':
        return 'bg-amber-100/80 text-amber-800 border-amber-300/60';
      case 'Preparing':
        return 'bg-rose-100 text-[#C0536A] border-rose-200';
      case 'Ready':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300/60';
      case 'Delivered':
        return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  const getDeliveryIcon = (method: DashboardOrder['deliveryMethod']) => {
    switch (method) {
      case 'Vadodara Local':
        return '📍';
      case 'College Delivery':
        return '🏫';
      case 'Parcel':
        return '📦';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* 1. Welcoming Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#F4A6B7]/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D272A] tracking-tight">
              Good morning, Bloomcraft 🌸
            </h1>
          </div>
          <p className="text-sm text-[#7A5B62] font-medium">
            Here's what's happening with your orders today.
          </p>
        </div>

        {/* Studio Live Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFE3E8]/80 border border-[#F4A6B7]/50 text-xs text-[#C0536A] font-medium shadow-sm self-start sm:self-center">
          <span className="w-2 h-2 rounded-full bg-[#D96B82] animate-ping" />
          <span>Studio Active • Handmade in Vadodara</span>
        </div>
      </div>

      {/* 2. Compact 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* New Orders */}
        <button
          onClick={() => onNavigateTab('orders')}
          className="p-5 rounded-3xl bg-white/95 border border-rose-100 hover:border-[#F4A6B7] shadow-sm hover:shadow-md transition-all text-left group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-800">
              Needs Action
            </span>
          </div>
          <p className="text-xs uppercase tracking-wider text-[#7A5B62] font-semibold">New Orders</p>
          <p className="font-serif text-3xl font-bold text-[#3D272A] mt-1">{newOrdersCount}</p>
          <p className="text-[11px] text-[#A4838B] mt-1 flex items-center gap-1">
            <span>Awaiting confirmation</span>
            <ArrowRight className="w-3 h-3 text-[#D96B82] group-hover:translate-x-0.5 transition-transform" />
          </p>
        </button>

        {/* Pending Orders */}
        <button
          onClick={() => onNavigateTab('orders')}
          className="p-5 rounded-3xl bg-white/95 border border-rose-100 hover:border-[#F4A6B7] shadow-sm hover:shadow-md transition-all text-left group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFE3E8] text-[#D96B82] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FFE3E8] text-[#C0536A]">
              In Crafting
            </span>
          </div>
          <p className="text-xs uppercase tracking-wider text-[#7A5B62] font-semibold">Pending Orders</p>
          <p className="font-serif text-3xl font-bold text-[#3D272A] mt-1">{pendingOrdersCount}</p>
          <p className="text-[11px] text-[#A4838B] mt-1 flex items-center gap-1">
            <span>Currently stitching</span>
            <ArrowRight className="w-3 h-3 text-[#D96B82] group-hover:translate-x-0.5 transition-transform" />
          </p>
        </button>

        {/* Ready for Delivery */}
        <button
          onClick={() => onNavigateTab('delivery')}
          className="p-5 rounded-3xl bg-white/95 border border-rose-100 hover:border-[#F4A6B7] shadow-sm hover:shadow-md transition-all text-left group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Packed
            </span>
          </div>
          <p className="text-xs uppercase tracking-wider text-[#7A5B62] font-semibold">Ready for Delivery</p>
          <p className="font-serif text-3xl font-bold text-[#3D272A] mt-1">{readyOrdersCount}</p>
          <p className="text-[11px] text-[#A4838B] mt-1 flex items-center gap-1">
            <span>Local & campus handover</span>
            <ArrowRight className="w-3 h-3 text-[#D96B82] group-hover:translate-x-0.5 transition-transform" />
          </p>
        </button>

        {/* Custom Requests */}
        <button
          onClick={() => onNavigateTab('custom')}
          className="p-5 rounded-3xl bg-white/95 border border-rose-100 hover:border-[#F4A6B7] shadow-sm hover:shadow-md transition-all text-left group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquareHeart className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              Custom
            </span>
          </div>
          <p className="text-xs uppercase tracking-wider text-[#7A5B62] font-semibold">Custom Requests</p>
          <p className="font-serif text-3xl font-bold text-[#3D272A] mt-1">{newCustomCount}</p>
          <p className="text-[11px] text-[#A4838B] mt-1 flex items-center gap-1">
            <span>Special yarn inquiries</span>
            <ArrowRight className="w-3 h-3 text-[#D96B82] group-hover:translate-x-0.5 transition-transform" />
          </p>
        </button>
      </div>

      {/* 3. Quick Actions */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#FFFDFB] border border-[#F4A6B7]/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#FFE3E8] text-[#D96B82] flex items-center justify-center text-sm">
            ✨
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-[#3D272A]">Maker Quick Actions</h3>
            <p className="text-xs text-[#7A5B62]">One-click shortcuts to manage today's workflow</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenAddProduct}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#D96B82] hover:bg-[#C0536A] text-white text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Product</span>
          </button>

          <button
            onClick={() => onNavigateTab('orders')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#FFF0F3] text-[#3D272A] hover:text-[#C0536A] border border-[#F4A6B7]/40 text-xs font-semibold transition-all hover:scale-105 cursor-pointer"
          >
            <span>View Orders</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#D96B82]" />
          </button>

          <button
            onClick={() => onNavigateTab('custom')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FFE3E8]/70 hover:bg-[#FFE3E8] text-[#C0536A] border border-[#F4A6B7]/40 text-xs font-semibold transition-all hover:scale-105 cursor-pointer"
          >
            <span>View Custom Requests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Recent Orders Table */}
      <div className="bg-white/95 rounded-3xl border border-[#F4A6B7]/30 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F4A6B7]/20 bg-[#FFF0F3]/40">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#3D272A]">Recent Orders</h2>
            <p className="text-xs text-[#7A5B62]">Latest purchases needing preparation or delivery</p>
          </div>

          <button
            onClick={() => onNavigateTab('orders')}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#C0536A] hover:text-[#D96B82] transition-colors"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Table List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#7A5B62] uppercase tracking-wider font-semibold border-b border-[#F4A6B7]/20">
              <tr>
                <th className="px-6 py-3.5">Order ID</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Items</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Delivery Method</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-100/60 text-[#3D272A]">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-[#FFFDFB] transition-colors">
                  {/* Order ID */}
                  <td className="px-6 py-4 font-mono font-bold text-[#C0536A]">
                    {order.id}
                  </td>

                  {/* Customer */}
                  <td className="px-6 py-4">
                    <p className="font-semibold text-[#3D272A]">{order.customerName}</p>
                    <p className="text-[11px] text-[#A4838B]">{order.phone}</p>
                  </td>

                  {/* Items */}
                  <td className="px-6 py-4 max-w-xs">
                    <div className="flex items-center gap-2">
                      <img
                        src={order.items[0]?.image}
                        alt="item"
                        className="w-8 h-8 rounded-xl object-cover border border-rose-200 bg-[#FFF0F3] flex-shrink-0"
                      />
                      <div className="truncate">
                        <p className="font-medium truncate">{order.items[0]?.name}</p>
                        {order.items.length > 1 && (
                          <span className="text-[10px] text-[#C0536A] font-semibold">
                            +{order.items.length - 1} more item
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="px-6 py-4 font-semibold text-[#3D272A]">
                    ₹{order.total}
                  </td>

                  {/* Delivery Method */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-[#5C3E45] font-medium border border-stone-200/80 text-[11px]">
                      <span>{getDeliveryIcon(order.deliveryMethod)}</span>
                      <span>{order.deliveryMethod}</span>
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status}
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
