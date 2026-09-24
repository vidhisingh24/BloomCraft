import React, { useState } from 'react';
import { 
  Search, 
  MessageCircle, 
  ChevronDown
} from 'lucide-react';
import type { DashboardOrder, OrderStatus } from '../../data/dashboardData';

interface OrdersManagerProps {
  orders: DashboardOrder[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
}

type FilterTab = 'All' | OrderStatus;

export const OrdersManager: React.FC<OrdersManagerProps> = ({
  orders,
  onUpdateOrderStatus,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filterTabs: FilterTab[] = ['All', 'New', 'Preparing', 'Ready', 'Delivered'];

  const filteredOrders = orders.filter((order) => {
    const matchesFilter = activeFilter === 'All' || order.status === activeFilter;
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      order.deliveryDetails.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'New':
        return 'bg-amber-100 text-amber-800 border-amber-300/60';
      case 'Preparing':
        return 'bg-[#FFE3E8] text-[#C0536A] border-rose-200';
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
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#F4A6B7]/20">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D272A] tracking-tight">
            Orders Management
          </h1>
          <p className="text-sm text-[#7A5B62] font-medium">
            Manage preparation, handmade packaging, and handover schedules
          </p>
        </div>

        {/* Count summary */}
        <div className="text-xs text-[#7A5B62] bg-[#FFF0F3] px-4 py-2 rounded-2xl border border-[#F4A6B7]/30">
          Showing <span className="font-bold text-[#C0536A]">{filteredOrders.length}</span> orders
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-[#FFF0F3]/70 border border-[#F4A6B7]/30 self-start">
          {filterTabs.map((tab) => {
            const count = tab === 'All' ? orders.length : orders.filter((o) => o.status === tab).length;
            const isActive = activeFilter === tab;

            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white text-[#C0536A] shadow-sm border border-[#F4A6B7]/40'
                    : 'text-[#7A5B62] hover:text-[#C0536A] hover:bg-white/50'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-[#FFE3E8] text-[#C0536A]' : 'bg-white/80 text-[#7A5B62]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#A4838B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer, ID, item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-white border border-[#F4A6B7]/40 text-xs text-[#3D272A] placeholder-[#A4838B] focus:outline-none focus:ring-2 focus:ring-[#D96B82]/50 shadow-sm"
          />
        </div>
      </div>

      {/* Orders Container: Mobile Cards (< md) + Desktop Table (>= md) */}
      <div className="bg-white/95 rounded-3xl border border-[#F4A6B7]/30 shadow-sm overflow-hidden">
        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-rose-100/70 p-4 space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-10 text-[#7A5B62]">
              <span className="text-3xl">🌸</span>
              <p className="font-serif font-bold text-sm text-[#3D272A] mt-2">No orders found</p>
              <p className="text-xs text-[#A4838B]">No orders matching your active filter.</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={`m-${order.id}`} className="pt-4 first:pt-0 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#C0536A]">{order.id}</span>
                    <span className="text-[10px] text-[#A4838B]">• {order.date}</span>
                  </div>
                  <div className="relative inline-block">
                    <select
                      value={order.status}
                      onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                      className={`appearance-none px-3 py-1 pr-6 rounded-full text-xs font-semibold border cursor-pointer focus:outline-none shadow-sm ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      <option value="New">New</option>
                      <option value="Preparing">Preparing</option>
                      <option value="Ready">Ready</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-[#3D272A]">{order.customerName}</p>
                    <p className="text-[11px] text-[#A4838B] font-mono">{order.phone}</p>
                  </div>
                  <a
                    href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(
                      order.customerName
                    )},%20this%20is%20Bloomcraft%20regarding%20your%20crochet%20order%20${order.id}🌸`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                <div className="space-y-2 bg-[#FFFDFB] p-3 rounded-2xl border border-rose-100/70">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-10 h-10 rounded-xl object-cover border border-rose-200 bg-[#FFF0F3] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs text-[#3D272A] truncate">
                          {item.quantity}x {item.name}
                        </p>
                        {item.color && (
                          <p className="text-[10px] text-[#C0536A] font-medium">{item.color}</p>
                        )}
                      </div>
                      <span className="text-xs font-bold text-[#3D272A]">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                  {order.notes && (
                    <p className="text-[10px] text-[#7A5B62] pt-1.5 border-t border-rose-100">
                      <span className="font-semibold text-[#C0536A]">Note: </span>
                      {order.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-[#5C3E45] font-semibold text-[10px] border border-stone-200">
                    <span>{getDeliveryIcon(order.deliveryMethod)}</span>
                    <span>{order.deliveryMethod}</span>
                  </span>
                  <p className="font-bold text-sm text-[#C0536A]">Total: ₹{order.total}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#7A5B62] uppercase tracking-wider font-semibold border-b border-[#F4A6B7]/20">
              <tr>
                <th className="px-5 py-3.5">Order ID</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Items & Yarn Craft</th>
                <th className="px-5 py-3.5">Delivery Details</th>
                <th className="px-5 py-3.5">Date & Total</th>
                <th className="px-5 py-3.5">Status Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-100/60 text-[#3D272A]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#7A5B62]">
                    <div className="max-w-xs mx-auto text-center space-y-2">
                      <span className="text-3xl">🌸</span>
                      <p className="font-serif font-bold text-sm text-[#3D272A]">No orders found</p>
                      <p className="text-xs text-[#A4838B]">No orders matching your active filter or search query.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FFFDFB] transition-colors">
                    {/* Order ID */}
                    <td className="px-5 py-4 font-mono font-bold text-[#C0536A] align-top">
                      {order.id}
                    </td>

                    {/* Customer Info */}
                    <td className="px-5 py-4 align-top">
                      <p className="font-semibold text-[#3D272A]">{order.customerName}</p>
                      <p className="text-[11px] text-[#A4838B] font-mono">{order.phone}</p>
                      {/* WhatsApp shortcut */}
                      <a
                        href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(
                          order.customerName
                        )},%20this%20is%20Bloomcraft%20regarding%20your%20crochet%20order%20${order.id}🌸`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1 text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>Chat</span>
                      </a>
                    </td>

                    {/* Items & Yarn Craft */}
                    <td className="px-5 py-4 align-top max-w-xs">
                      <div className="space-y-1.5">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-7 h-7 rounded-lg object-cover border border-rose-200 bg-[#FFF0F3] flex-shrink-0 mt-0.5"
                            />
                            <div>
                              <p className="font-medium text-[11px] leading-tight text-[#3D272A]">
                                {item.quantity}x {item.name}
                              </p>
                              {item.color && (
                                <p className="text-[10px] text-[#C0536A] font-medium">{item.color}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {order.notes && (
                        <div className="mt-2 p-2 rounded-xl bg-[#FFF0F3] border border-rose-200/60 text-[10px] text-[#7A5B62]">
                          <span className="font-semibold text-[#C0536A]">Note: </span>
                          <span>{order.notes}</span>
                        </div>
                      )}
                    </td>

                    {/* Delivery Details */}
                    <td className="px-5 py-4 align-top">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-100 text-[#5C3E45] font-semibold text-[11px] border border-stone-200 mb-1">
                        <span>{getDeliveryIcon(order.deliveryMethod)}</span>
                        <span>{order.deliveryMethod}</span>
                      </span>
                      <p className="text-[11px] text-[#7A5B62] leading-tight max-w-[180px]">
                        {order.deliveryDetails}
                      </p>
                      {order.timeSlot && (
                        <p className="text-[10px] text-[#D96B82] font-medium mt-1">
                          ⏰ {order.timeSlot}
                        </p>
                      )}
                    </td>

                    {/* Date & Total */}
                    <td className="px-5 py-4 align-top">
                      <p className="font-bold text-sm text-[#3D272A]">₹{order.total}</p>
                      <p className="text-[10px] text-[#A4838B] mt-0.5">{order.date}</p>
                    </td>

                    {/* Status Select / Change */}
                    <td className="px-5 py-4 align-top">
                      <div className="relative inline-block">
                        <select
                          value={order.status}
                          onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className={`appearance-none px-3 py-1.5 pr-7 rounded-full text-xs font-semibold border cursor-pointer focus:outline-none shadow-sm transition-all ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          <option value="New">New</option>
                          <option value="Preparing">Preparing</option>
                          <option value="Ready">Ready</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                        <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
