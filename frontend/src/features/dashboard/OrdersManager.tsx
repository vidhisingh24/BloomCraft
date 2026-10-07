import React, { useState } from 'react';
import { 
  Search, 
  MessageCircle, 
  Download,
  Eye,
  X,
  Plus,
  Trash2
} from 'lucide-react';
import type { Order, OrderStatus, Payment, Product } from '../../types';
import type { ManualOrderInput } from '../../services/orderService';
import { ManualOrderForm } from './ManualOrderForm';
import { formatPaise } from '../../utils/currency';
import { formatISTDate } from '../../utils/date';
import { useToast } from '../../context/ToastContext';
import { paymentMethodLabel } from '../../utils/orderLabels';
import { EARLIER_SALES_CORRECTION } from '../../config/sales.config';

interface OrdersManagerProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus, note?: string) => void;
  onUpdatePaymentStatus: (orderId: string, status: Payment['status']) => void;
  products: Product[];
  /** Resolves true when the order was saved. */
  onAddManualOrder: (input: ManualOrderInput) => Promise<boolean>;
  onDeleteOrder: (orderId: string) => void;
  /** Orders with a save in progress: their controls are disabled until it finishes. */
  savingIds?: ReadonlySet<string>;
}

type FilterTab = 'all' | OrderStatus;

export const OrdersManager: React.FC<OrdersManagerProps> = ({
  orders,
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
  products,
  onAddManualOrder,
  onDeleteOrder,
  savingIds,
}) => {
  const [showManualForm, setShowManualForm] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const { showToast } = useToast();

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All Orders' },
    { key: 'placed', label: 'New Placed' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'preparing', label: 'In Crafting' },
    { key: 'ready', label: 'Ready' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = activeFilter === 'all' || order.status === activeFilter;
    const matchesMethod = selectedMethod === 'all' || order.delivery.method === selectedMethod;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      order.id.toLowerCase().includes(q) ||
      order.customer.name.toLowerCase().includes(q) ||
      (order.customer.phone && order.customer.phone.includes(q)) ||
      order.items.some((i) => (i.name).toLowerCase().includes(q));

    return matchesStatus && matchesMethod && matchesSearch;
  });

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

  const handleWhatsAppCustomer = (order: Order) => {
    const cleanPhone = (order.customer.phone || '').replace(/\D/g, '');
    if (!cleanPhone) {
      showToast('Customer Info', `Order for ${order.customer.name} was completed via Direct Sale`, 'info');
      return;
    }
    const text = encodeURIComponent(
      `🌸 Hi ${order.customer.name}! This is BloomCraft Vadodara regarding your handmade order *${order.id}* (Status: ${order.status.toUpperCase()}). We're preparing your blooms with care!`
    );
    window.open(`https://wa.me/91${cleanPhone}?text=${text}`, '_blank');
  };

  const handleExportCsv = () => {
    if (filteredOrders.length === 0) {
      showToast('No Data', 'No orders to export', 'info');
      return;
    }

    const headers = ['Order ID', 'Date (IST)', 'Customer Name', 'Phone', 'Email', 'Items', 'Total (INR)', 'Delivery Method', 'Payment Method', 'Payment Status', 'Status'];
    const rows = filteredOrders.map((o) => [
      `"${o.id}"`,
      `"${formatISTDate(o.createdAt)}"`,
      `"${o.customer.name}"`,
      `"${o.customer.phone || 'Direct Sale'}"`,
      `"${o.customer.email || ''}"`,
      `"${o.items.map((i) => `${i.name} (Qty: ${i.quantity})`).join('; ')}"`,
      (o.pricing.total / 100).toFixed(2),
      `"${o.delivery.method}"`,
      `"${paymentMethodLabel(o.payment)}"`,
      `"${o.payment.status}"`,
      `"${o.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bloomcraft-Orders-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('CSV Exported 📊', `${filteredOrders.length} orders downloaded`, 'cart');
  };

  // Same rule as the Overview: cancelled orders are not sales. The earlier-sales correction
  // applies to the full list only (not to a filtered view).
  const showingAll = activeFilter === 'all' && selectedMethod === 'all' && !searchQuery.trim();
  const totalFilteredRevenuePaise =
    filteredOrders.filter((o) => o.status !== 'cancelled').reduce((acc, o) => acc + o.pricing.total, 0) +
    (showingAll ? EARLIER_SALES_CORRECTION.totalPaise : 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
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

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowManualForm(true)}
            className="px-4 py-2 rounded-xl bg-[#C0536A] text-xs font-bold text-white hover:bg-[#A83D53] transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add order manually
          </button>
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 rounded-xl bg-white border border-[#EBD8DC] text-xs font-bold text-[#3D272A] hover:bg-[#FFE3E8] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#D96B82]" /> Export CSV
          </button>
          <div className="text-xs text-[#7A5B62] bg-[#FFF0F3] px-3.5 py-2 rounded-xl border border-[#F4A6B7]/30 flex items-center gap-2">
            <span className="font-bold text-[#D96B82]">{filteredOrders.length}</span> orders
            <span className="text-[#A38B90]">•</span>
            <span className="font-bold text-[#3D272A]">{formatPaise(totalFilteredRevenuePaise)}</span>
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-[#FFF0F3]/70 border border-[#F4A6B7]/30">
          {filterTabs.map((tab) => {
            const count = tab.key === 'all' ? orders.length : orders.filter((o) => o.status === tab.key).length;
            const isActive = activeFilter === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#C0536A] shadow-xs border border-[#F4A6B7]/40'
                    : 'text-[#7A5B62] hover:text-[#C0536A] hover:bg-white/50'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-[#FFE3E8] text-[#C0536A]' : 'bg-white text-[#7A5B62]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input & Delivery Method Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-[#EBD8DC] bg-white text-[#3D272A] focus:outline-none focus:border-[#D96B82]"
          >
            <option value="all">All Methods</option>
            <option value="vadodara_local">📍 Vadodara Local</option>
            <option value="college">🏫 College Delivery</option>
            <option value="parcel">📦 Pan-India Parcel</option>
          </select>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-[#A38B90] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, name, items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[#EBD8DC] bg-white focus:outline-none focus:border-[#D96B82]"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-[#F0E6E8] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FFF0F3]/50 border-b border-[#F0E6E8] text-[#7A5B62] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Order ID & Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Items</th>
                <th className="py-3.5 px-4">Delivery</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Status & Action</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5EDEF]">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-sm text-[#3D272A] block">{order.id}</span>
                    <span className="text-[10px] text-[#A38B90]">{formatISTDate(order.createdAt)}</span>
                    <SourceBadge source={order.source} />
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-sm text-[#3D272A] block">{order.customer.name}</span>
                    <span className="text-xs text-[#7A5B62]">
                      {order.customer.phone ? `+91 ${order.customer.phone}` : 'Direct Sale'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 max-w-[200px]">
                    <span className="font-bold text-[#3D272A]">{formatPaise(order.pricing.total)}</span>
                    <p className="text-[11px] text-[#7A5B62] truncate">
                      {order.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                    </p>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-medium text-xs text-[#3D272A] block">
                      {order.delivery.method === 'vadodara_local' ? '📍 Vadodara Local' : order.delivery.method === 'college' ? '🏫 College' : '📦 Parcel'}
                    </span>
                    <span className="text-[10px] text-[#7A5B62]">
                      {order.delivery.method === 'vadodara_local' ? (order.delivery.details as any).area || 'Vadodara Handover' : order.delivery.method === 'college' ? (order.delivery.details as any).collegeName?.split('(')[0] : `${(order.delivery.details as any).city}, ${(order.delivery.details as any).state}`}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[11px] text-[#3D272A]">
                        {paymentMethodLabel(order.payment)}
                      </span>
                      <button
                        disabled={savingIds?.has(order.id)}
                        onClick={() => {
                          const paid = order.payment.status === 'paid';
                          const question = paid
                            ? `Mark ${order.id} as NOT paid again?`
                            : `Confirm you received ${formatPaise(order.pricing.total)}${
                                order.payment.upiTxnRef ? ` with UTR ${order.payment.upiTxnRef}` : ''
                              } for ${order.id}?`;
                          if (!window.confirm(question)) return;
                          onUpdatePaymentStatus(
                            order.id,
                            paid ? (order.payment.upiTxnRef ? 'awaiting_verification' : 'pending') : 'paid'
                          );
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait ${
                          order.payment.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800 hover:bg-green-100 hover:text-green-800'
                        }`}
                        title="Click to toggle payment verification"
                      >
                        {order.payment.status === 'paid'
                          ? 'Paid ✓'
                          : order.payment.status === 'awaiting_verification'
                            ? 'Check UTR'
                            : 'Verify'}
                      </button>
                    </div>
                    {order.payment.upiTxnRef && (
                      <span className="block text-[10px] font-mono text-[#7A5B62] mt-0.5" title="UPI reference (UTR) — match it in your bank / GPay app">
                        UTR {order.payment.upiTxnRef}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <select
                      value={order.status}
                      disabled={savingIds?.has(order.id)}
                      onChange={(e) => {
                        const next = e.target.value as OrderStatus;
                        if (next === 'cancelled' && !window.confirm(`Cancel order ${order.id}?`)) return;
                        onUpdateOrderStatus(order.id, next);
                      }}
                      className={`text-xs px-2.5 py-1 rounded-xl font-bold border ${getStatusBadge(order.status)} focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-wait`}
                    >
                      <option value="placed">Placed</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="preparing">In Crafting</option>
                      {order.delivery.method === 'parcel' ? (
                        <option value="shipped">Shipped (Courier)</option>
                      ) : (
                        <option value="ready">Ready (Pickup)</option>
                      )}
                      <option value="delivered">Delivered 🌸</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleWhatsAppCustomer(order)}
                        className="p-1.5 rounded-lg bg-[#E7F7EE] text-[#0A7B3E] hover:bg-[#d5f0df] transition-colors cursor-pointer"
                        title="WhatsApp Customer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setViewingOrder(order)}
                        className="p-1.5 rounded-lg bg-[#FAF8F5] border border-[#EBD8DC] text-[#3D272A] hover:bg-[#FFE3E8] transition-colors cursor-pointer"
                        title="View Full Order"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={savingIds?.has(order.id)}
                        onClick={() => {
                          if (window.confirm(`Delete order ${order.id} (${order.customer.name}, ${formatPaise(order.pricing.total)})? This cannot be undone.`)) {
                            onDeleteOrder(order.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Delete order"
                        aria-label={`Delete order ${order.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3D272A]/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-[#F0E6E8] space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E6E8]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#D96B82]">Order Inspection</span>
                <h3 className="font-mono font-bold text-lg text-[#3D272A]">{viewingOrder.id}</h3>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="p-1.5 rounded-full hover:bg-[#FAF8F5] text-[#7A5B62] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#7A5B62]">
              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EBD8DC]">
                <p className="font-bold text-[#3D272A]">{viewingOrder.customer.name}</p>
                <p>Phone: {viewingOrder.customer.phone ? `+91 ${viewingOrder.customer.phone}` : 'Direct Record on file'}</p>
                {viewingOrder.customer.email && <p>Email: {viewingOrder.customer.email}</p>}
                <p className="mt-1 text-[11px] text-[#A38B90]">
                  Payment: <span className="font-semibold text-[#3D272A]">{paymentMethodLabel(viewingOrder.payment)}</span> ({viewingOrder.payment.status.toUpperCase()})
                </p>
              </div>

              <div>
                <span className="font-bold text-[#3D272A] uppercase block mb-1">Ordered Items</span>
                <div className="space-y-2">
                  {viewingOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 rounded-xl bg-white border border-[#F0E6E8]">
                      <div className="flex items-center gap-3">
                        <img 
                          src={it.image || '/images/keychains/tulip_pink_duo.jpg'} 
                          alt={it.name || 'Handmade item'}
                          className="w-10 h-10 rounded-lg object-cover bg-[#FFE3E8]/30 border border-[#EBD8DC]"
                        />
                        <div>
                          <p className="font-semibold text-[#3D272A]">{it.name}</p>
                          <p className="text-[11px] text-[#7A5B62]">
                            {it.selectedColor ? `Color: ${it.selectedColor}` : ''}
                            {it.customNote ? ` • Note: "${it.customNote}"` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-[#3D272A]">{it.quantity} × {formatPaise(it.priceAtAdd)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-2 border-t border-[#F0E6E8]">
                <span className="font-bold text-sm text-[#3D272A]">Total Value</span>
                <span className="font-serif font-bold text-lg text-[#D96B82]">{formatPaise(viewingOrder.pricing.total)}</span>
              </div>
            </div>

            {viewingOrder.makerNote && (
              <p className="text-xs text-[#5C3E45] bg-[#FAF8F5] border border-[#F0E6E8] rounded-xl px-3 py-2">
                📝 {viewingOrder.makerNote}
              </p>
            )}

            <div className="pt-3 flex flex-wrap gap-2">
              <button
                disabled={savingIds?.has(viewingOrder.id)}
                onClick={() => {
                  if (window.confirm(`Delete order ${viewingOrder.id} (${viewingOrder.customer.name}, ${formatPaise(viewingOrder.pricing.total)})? This cannot be undone.`)) {
                    onDeleteOrder(viewingOrder.id);
                    setViewingOrder(null);
                  }
                }}
                className="px-4 py-2.5 rounded-full border border-red-200 text-xs font-bold text-red-700 hover:bg-red-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Delete order
              </button>
              <button
                onClick={() => handleWhatsAppCustomer(viewingOrder)}
                className="flex-1 py-2.5 rounded-full bg-[#25D366] text-white text-xs font-bold hover:bg-[#20bd5a] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp Customer
              </button>
              <button
                onClick={() => setViewingOrder(null)}
                className="px-6 py-2.5 rounded-full bg-[#FAF8F5] border border-[#EBD8DC] text-xs font-semibold text-[#7A5B62] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showManualForm && (
        <ManualOrderForm
          products={products}
          busy={savingManual}
          onClose={() => setShowManualForm(false)}
          onSubmit={(input) => {
            setSavingManual(true);
            void onAddManualOrder(input).then((ok) => {
              setSavingManual(false);
              if (ok) setShowManualForm(false);
            });
          }}
        />
      )}
    </div>
  );
};

const SOURCE_LABEL: Record<NonNullable<Order['source']>, string> = {
  website: '🌐 Website',
  instagram: '📸 Instagram',
  whatsapp: '💬 WhatsApp',
  in_person: '🤝 In person',
  other: '✨ Offline',
};

const SourceBadge: React.FC<{ source?: Order['source'] }> = ({ source = 'website' }) =>
  source === 'website' || source === 'other' ? null : (
    <span className="mt-1 inline-block px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#EBD8DC] text-[10px] font-semibold text-[#5C3E45]">
      {SOURCE_LABEL[source]}
    </span>
  );
