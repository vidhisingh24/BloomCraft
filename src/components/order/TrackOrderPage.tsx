import React, { useState, useEffect } from 'react';
import type { Order } from '../../types';
import { orderService } from '../../services/orderService';
import { OrderStatusTracker } from './OrderStatusTracker';
import { formatPaise } from '../../utils/currency';
import { useToast } from '../../context/ToastContext';
import { trackEvent } from '../../utils/analytics';
import { 
  Search, 
  FileText, 
  ShoppingBag, 
  AlertCircle
} from 'lucide-react';

interface TrackOrderPageProps {
  initialOrderId?: string;
  onViewReceipt: (order: Order) => void;
  onShopNow: () => void;
}

export const TrackOrderPage: React.FC<TrackOrderPageProps> = ({
  initialOrderId,
  onViewReceipt,
  onShopNow,
}) => {
  const [orderQuery, setOrderQuery] = useState(initialOrderId || '');
  const [phoneQuery, setPhoneQuery] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (initialOrderId) {
      handleSearchById(initialOrderId);
    }
  }, [initialOrderId]);

  const handleSearchById = async (idToSearch: string) => {
    if (!idToSearch.trim()) return;
    setIsLoading(true);
    setHasSearched(true);
    trackEvent('track_order_lookup', { query: idToSearch });

    try {
      const order = await orderService.getById(idToSearch);
      setFoundOrder(order);
      if (!order) {
        showToast('Order Not Found', `No order matching reference "${idToSearch}"`, 'info');
      }
    } catch (err) {
      console.error('Error finding order:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderQuery.trim()) {
      handleSearchById(orderQuery.trim());
    } else if (phoneQuery.trim()) {
      handleSearchByPhone();
    }
  };

  const handleSearchByPhone = async () => {
    if (!phoneQuery.trim()) return;
    setIsLoading(true);
    setHasSearched(true);

    try {
      const orders = await orderService.getByPhone(phoneQuery.trim());
      if (orders.length > 0) {
        setFoundOrder(orders[0]);
      } else {
        setFoundOrder(null);
        showToast('No Orders Found', `No orders found for phone "${phoneQuery}"`, 'info');
      }
    } catch (err) {
      console.error('Error finding orders by phone:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-xs uppercase tracking-widest font-bold text-[#D96B82]">Live Studio Tracking</span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#3D272A]">
          Track Your Handmade Order
        </h1>
        <p className="text-sm text-[#7A5B62] max-w-md mx-auto">
          Enter your Order Reference ID (e.g. <span className="font-mono font-semibold">BC-2026-00125</span>) or WhatsApp number to view real-time status.
        </p>
      </div>

      {/* Search Bar Form */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#F0E6E8] shadow-sm">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-7">
              <label className="block text-xs font-bold text-[#3D272A] uppercase tracking-wider mb-1.5">
                Order Reference ID
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-[#A38B90] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. BC-2026-00125"
                  value={orderQuery}
                  onChange={(e) => setOrderQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#EBD8DC] text-sm focus:outline-none focus:border-[#D96B82] focus:ring-2 focus:ring-[#FFE3E8]"
                />
              </div>
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-bold text-[#3D272A] uppercase tracking-wider mb-1.5">
                Or Phone Number
              </label>
              <input
                type="tel"
                placeholder="10-digit mobile"
                value={phoneQuery}
                onChange={(e) => setPhoneQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#EBD8DC] text-sm focus:outline-none focus:border-[#D96B82] focus:ring-2 focus:ring-[#FFE3E8]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || (!orderQuery.trim() && !phoneQuery.trim())}
            className="w-full py-3.5 rounded-xl bg-[#D96B82] text-white font-bold text-sm hover:bg-[#C0536A] shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Checking Studio Records...
              </span>
            ) : (
              <>
                <Search className="w-4 h-4" /> Track My Order
              </>
            )}
          </button>
        </form>
      </div>

      {/* SEARCH RESULT DISPLAY */}
      {foundOrder ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Status Tracker */}
          <OrderStatusTracker
            status={foundOrder.status}
            deliveryMethod={foundOrder.delivery.method}
            statusHistory={foundOrder.statusHistory}
          />

          {/* Order Snapshot Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#F0E6E8] shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#F0E6E8]">
              <div>
                <span className="font-mono font-bold text-base text-[#3D272A]">{foundOrder.id}</span>
                <p className="text-xs text-[#7A5B62] mt-0.5">Recipient: {foundOrder.customer.name}</p>
              </div>
              <button
                onClick={() => onViewReceipt(foundOrder)}
                className="px-4 py-2 rounded-full bg-[#FAF8F5] border border-[#EBD8DC] text-xs font-bold text-[#3D272A] hover:bg-[#FFE3E8] transition-all flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-[#D96B82]" /> View Official Receipt
              </button>
            </div>

            {/* Items */}
            <div className="space-y-3">
              {foundOrder.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image || '/images/keychains/tulip_pink_duo.jpg'}
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover bg-[#FFE3E8]/30"
                    />
                    <div>
                      <p className="font-semibold text-[#3D272A]">{item.name}</p>
                      <p className="text-[#7A5B62]">
                        {item.selectedColor ? `Color: ${item.selectedColor}` : ''}
                        {item.customNote ? ` • Note: "${item.customNote}"` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-[#3D272A]">
                    {item.quantity} × {formatPaise(item.priceAtAdd)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#F5EDEF] flex justify-between items-baseline">
              <span className="text-xs text-[#7A5B62]">Total Order Value</span>
              <span className="font-serif font-bold text-xl text-[#D96B82]">
                {formatPaise(foundOrder.pricing.total)}
              </span>
            </div>
          </div>
        </div>
      ) : hasSearched && !isLoading ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-[#F0E6E8] space-y-4">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="font-serif font-bold text-lg text-[#3D272A]">No Matching Order Found</h3>
          <p className="text-xs text-[#7A5B62] max-w-sm mx-auto">
            Please double-check the reference ID (e.g. BC-2026-00125) or contact us on WhatsApp for live assistance.
          </p>
          <button
            onClick={onShopNow}
            className="px-6 py-2.5 rounded-full bg-[#D96B82] text-white text-xs font-semibold hover:bg-[#C0536A] transition-all inline-flex items-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Explore Creations
          </button>
        </div>
      ) : null}
    </div>
  );
};
