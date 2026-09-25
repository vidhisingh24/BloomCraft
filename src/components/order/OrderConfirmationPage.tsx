import React, { useEffect, useState } from 'react';
import type { Order } from '../../types';
import { OrderStatusTracker } from './OrderStatusTracker';
import { buildOrderMessage, buildWhatsAppLink } from '../../utils/whatsapp';
import { formatPaise } from '../../utils/currency';
import { useToast } from '../../context/ToastContext';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  MessageSquare, 
  FileText, 
  ShoppingBag, 
  Sparkles,
  Clock
} from 'lucide-react';

interface OrderConfirmationPageProps {
  order: Order;
  onViewReceipt: (order: Order) => void;
  onContinueShopping: () => void;
  onTrackOrder: (orderId: string) => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({
  order,
  onViewReceipt,
  onContinueShopping,
  onTrackOrder,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    // Launch celebratory pastel petal confetti on order success
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FFE3E8', '#FFB6C1', '#D96B82', '#FFF0F3', '#C0536A'],
        disableForReducedMotion: true,
      });
    } catch {
      // Ignored if reduced motion or library unavailable
    }
  }, []);

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.id);
    setCopiedId(true);
    showToast('Order ID Copied! 📋', order.id, 'cart');
    setTimeout(() => setCopiedId(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const msg = buildOrderMessage(order);
    const url = buildWhatsAppLink(msg);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Celebratory Banner */}
      <div className="bg-gradient-to-br from-[#FFF0F3] via-white to-[#FFE3E8]/40 rounded-3xl p-8 sm:p-10 border border-[#F0E6E8] text-center shadow-sm relative overflow-hidden">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full bg-[#FFE3E8] flex items-center justify-center text-[#D96B82] shadow-inner">
          <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
        </div>

        <span className="text-xs uppercase tracking-widest font-bold text-[#D96B82] flex items-center justify-center gap-1.5 mb-1">
          <Sparkles className="w-3.5 h-3.5" /> Order Placed Successfully
        </span>

        <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#3D272A] mb-3">
          Thank You for Choosing BloomCraft 🌸
        </h1>

        <p className="text-sm sm:text-base text-[#7A5B62] max-w-lg mx-auto">
          Your handcrafted creation has been received and queued in our studio. We will begin crafting your blooms with love!
        </p>

        {/* Order ID Pill */}
        <div className="mt-6 inline-flex items-center gap-2 bg-white px-5 py-2.5 rounded-full border border-[#EBD8DC] shadow-sm">
          <span className="text-xs text-[#7A5B62]">Order Reference:</span>
          <span className="font-mono font-bold text-sm sm:text-base text-[#3D272A]">{order.id}</span>
          <button
            onClick={handleCopyOrderId}
            className="text-[#D96B82] hover:text-[#C0536A] p-1 rounded transition-colors"
            title="Copy Order ID"
          >
            {copiedId ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Live Order Status Tracker */}
      <OrderStatusTracker
        status={order.status}
        deliveryMethod={order.delivery.method}
        statusHistory={order.statusHistory}
      />

      {/* Quick Summary Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#F0E6E8] shadow-sm space-y-6">
        <h3 className="text-lg font-serif font-bold text-[#3D272A] pb-3 border-b border-[#F0E6E8]">
          Delivery & Contact Summary
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-[#7A5B62]">
          <div>
            <span className="font-bold text-[#3D272A] uppercase tracking-wider block mb-1">
              Customer Details
            </span>
            <p className="text-sm font-semibold text-[#3D272A]">{order.customer.name}</p>
            <p>+91 {order.customer.phone}</p>
            {order.customer.email && <p>{order.customer.email}</p>}
          </div>

          <div>
            <span className="font-bold text-[#3D272A] uppercase tracking-wider block mb-1">
              Fulfillment Method
            </span>
            {order.delivery.method === 'vadodara_local' && (
              <div>
                <p className="font-semibold text-[#3D272A]">📍 Vadodara Local Handover</p>
                <p>Area: {(order.delivery.details as any).area}</p>
                <p>Slot: {(order.delivery.details as any).preferredTimeSlot}</p>
              </div>
            )}
            {order.delivery.method === 'college' && (
              <div>
                <p className="font-semibold text-[#3D272A]">🏫 College Delivery</p>
                <p>{(order.delivery.details as any).collegeName}</p>
                <p>Point: {(order.delivery.details as any).deliveryPoint}</p>
              </div>
            )}
            {order.delivery.method === 'parcel' && (
              <div>
                <p className="font-semibold text-[#3D272A]">📦 Pan-India Courier</p>
                <p>{(order.delivery.details as any).city}, {(order.delivery.details as any).state} - {(order.delivery.details as any).pincode}</p>
              </div>
            )}
          </div>
        </div>

        {/* Ordered Items List */}
        <div className="pt-4 border-t border-[#F0E6E8]">
          <span className="font-bold text-xs text-[#3D272A] uppercase tracking-wider block mb-3">
            Handmade Items ({order.items.length})
          </span>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
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

          <div className="mt-4 pt-3 border-t border-[#F5EDEF] flex justify-between items-baseline">
            <span className="font-bold text-sm text-[#3D272A]">Total Paid / Due</span>
            <span className="font-serif font-bold text-xl text-[#D96B82]">
              {formatPaise(order.pricing.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          onClick={() => onViewReceipt(order)}
          className="w-full py-3.5 px-6 rounded-full bg-[#3D272A] text-white font-semibold text-sm hover:bg-[#2A1A1C] shadow-md transition-all flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4 text-[#FFE3E8]" /> View & Download Receipt
        </button>

        <button
          onClick={handleWhatsAppShare}
          className="w-full py-3.5 px-6 rounded-full bg-[#25D366] text-white font-semibold text-sm hover:bg-[#20bd5a] shadow-md transition-all flex items-center justify-center gap-2"
        >
          <MessageSquare className="w-4 h-4" /> Send Details on WhatsApp
        </button>

        <button
          onClick={() => onTrackOrder(order.id)}
          className="w-full py-3 px-6 rounded-full bg-white border border-[#EBD8DC] text-[#3D272A] font-semibold text-sm hover:bg-[#FAF8F5] transition-all flex items-center justify-center gap-2"
        >
          <Clock className="w-4 h-4 text-[#D96B82]" /> Track Order Progress
        </button>

        <button
          onClick={onContinueShopping}
          className="w-full py-3 px-6 rounded-full bg-white border border-[#EBD8DC] text-[#7A5B62] font-semibold text-sm hover:bg-[#FAF8F5] transition-all flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4 text-[#D96B82]" /> Continue Shopping
        </button>
      </div>
    </div>
  );
};
