import React, { useState, useEffect } from 'react';
import type { Order } from '../../types';
import { orderService } from '../../services/orderService';
import { OrderStatusTracker } from './OrderStatusTracker';
import { formatPaise } from '../../utils/currency';
import { useToast } from '../../context/ToastContext';
import { trackEvent } from '../../utils/analytics';
import { useAuth } from '../../context/AuthContext';
import { friendlyError } from '../../lib/supabase';
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

  const { user } = useAuth();

  // Signed-in customers (and the maker) can open their own orders without the phone number.
  useEffect(() => {
    if (!initialOrderId || !user) return;
    let active = true;
    setIsLoading(true);
    setHasSearched(true);
    orderService
      .getAll()
      .then((orders) => {
        if (active) setFoundOrder(orders.find((o) => o.id === initialOrderId.toUpperCase()) ?? null);
      })
      .catch(() => active && setFoundOrder(null))
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, [initialOrderId, user]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = orderQuery.trim().toUpperCase();
    if (!id || phoneQuery.length !== 10) {
      showToast('Order number and phone needed', 'Enter both the order number and the phone used at checkout.', 'info');
      return;
    }
    setIsLoading(true);
    setHasSearched(true);
    trackEvent('track_order_lookup', { query: id });
    try {
      const order = await orderService.track(id, phoneQuery);
      setFoundOrder(order);
      if (!order) {
        showToast('Order Not Found', 'Check the order number and the phone number used at checkout.', 'info');
      }
    } catch (err) {
      setFoundOrder(null);
      showToast('Could not check the order', friendlyError(err), 'info');
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
          Enter your order number (e.g. <span className="font-mono font-semibold">BC-2026-00001</span>) and the phone number used at checkout.
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
                  placeholder="e.g. BC-2026-00001"
                  value={orderQuery}
                  onChange={(e) => setOrderQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#EBD8DC] text-sm focus:outline-none focus:border-[#D96B82] focus:ring-2 focus:ring-[#FFE3E8]"
                />
              </div>
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-bold text-[#3D272A] uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile"
                value={phoneQuery}
                onChange={(e) => setPhoneQuery(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full px-4 py-3 rounded-xl border border-[#EBD8DC] text-sm focus:outline-none focus:border-[#D96B82] focus:ring-2 focus:ring-[#FFE3E8]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !orderQuery.trim() || phoneQuery.length !== 10}
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
            Please check the order number and the phone number used at checkout, or message us on WhatsApp.
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
