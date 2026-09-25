import React, { useState } from 'react';
import { 
  MessageCircle
} from 'lucide-react';
import type { Order, OrderStatus } from '../../types';
import { formatPaise } from '../../utils/currency';
import { formatISTDate } from '../../utils/date';
import { buildWhatsAppLink } from '../../utils/whatsapp';

interface DeliveryManagerProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
}

type DeliveryCategoryTab = 'vadodara_local' | 'college' | 'parcel';

export const DeliveryManager: React.FC<DeliveryManagerProps> = ({
  orders,
  onUpdateOrderStatus,
}) => {
  const [activeTab, setActiveTab] = useState<DeliveryCategoryTab>('vadodara_local');

  const localOrders = orders.filter((o) => o.delivery.method === 'vadodara_local');
  const collegeOrders = orders.filter((o) => o.delivery.method === 'college');
  const parcelOrders = orders.filter((o) => o.delivery.method === 'parcel');

  const currentList =
    activeTab === 'vadodara_local'
      ? localOrders
      : activeTab === 'college'
      ? collegeOrders
      : parcelOrders;

  const handleWhatsApp = (order: Order) => {
    const phone = order.customer.phone.replace(/\D/g, '');
    let text = '';
    if (order.delivery.method === 'vadodara_local') {
      text = `🌸 Hi ${order.customer.name}! BloomCraft here regarding your pickup in ${(order.delivery.details as any).area} for order *${order.id}*. What time works best for you today?`;
    } else if (order.delivery.method === 'college') {
      text = `🌸 Hi ${order.customer.name}! BloomCraft here regarding your college delivery at ${(order.delivery.details as any).collegeName} (${(order.delivery.details as any).deliveryPoint}) for order *${order.id}*.`;
    } else {
      text = `🌸 Hi ${order.customer.name}! Your BloomCraft parcel order *${order.id}* has been dispatched via express courier to ${(order.delivery.details as any).city}!`;
    }
    window.open(buildWhatsAppLink(text, phone), '_blank');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#F4A6B7]/20">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D272A] tracking-tight">
            Delivery & Handover Hub 🚚
          </h1>
          <p className="text-sm text-[#7A5B62] font-medium">
            Organized schedules for Vadodara meetups, campus handovers, and parcel shipments
          </p>
        </div>
      </div>

      {/* 3 Delivery Category Navigation Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Vadodara Local */}
        <button
          onClick={() => setActiveTab('vadodara_local')}
          className={`p-4 rounded-3xl border transition-all text-left flex items-center gap-3 cursor-pointer ${
            activeTab === 'vadodara_local'
              ? 'bg-white text-[#3D272A] border-[#D96B82] shadow-md ring-2 ring-[#D96B82]/20'
              : 'bg-white/80 hover:bg-white text-[#7A5B62] border-rose-100'
          }`}
        >
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#D96B82] flex items-center justify-center text-lg shrink-0">
            📍
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-sm text-[#3D272A]">Vadodara Local</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#FFE3E8] text-[#C0536A] font-bold">
                {localOrders.length}
              </span>
            </div>
            <p className="text-[11px] text-[#7A5B62] mt-0.5">Meetups & Pickup Spots</p>
          </div>
        </button>

        {/* 2. College Delivery */}
        <button
          onClick={() => setActiveTab('college')}
          className={`p-4 rounded-3xl border transition-all text-left flex items-center gap-3 cursor-pointer ${
            activeTab === 'college'
              ? 'bg-white text-[#3D272A] border-[#D96B82] shadow-md ring-2 ring-[#D96B82]/20'
              : 'bg-white/80 hover:bg-white text-[#7A5B62] border-rose-100'
          }`}
        >
          <div className="w-10 h-10 rounded-2xl bg-[#E7F7EE] text-[#0A7B3E] flex items-center justify-center text-lg shrink-0">
            🏫
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-sm text-[#3D272A]">College Campus</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#E7F7EE] text-[#0A7B3E] font-bold">
                {collegeOrders.length}
              </span>
            </div>
            <p className="text-[11px] text-[#7A5B62] mt-0.5">Gate / Canteen Handovers</p>
          </div>
        </button>

        {/* 3. Parcel Shipping */}
        <button
          onClick={() => setActiveTab('parcel')}
          className={`p-4 rounded-3xl border transition-all text-left flex items-center gap-3 cursor-pointer ${
            activeTab === 'parcel'
              ? 'bg-white text-[#3D272A] border-[#D96B82] shadow-md ring-2 ring-[#D96B82]/20'
              : 'bg-white/80 hover:bg-white text-[#7A5B62] border-rose-100'
          }`}
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg shrink-0">
            📦
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-sm text-[#3D272A]">Pan-India Parcel</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                {parcelOrders.length}
              </span>
            </div>
            <p className="text-[11px] text-[#7A5B62] mt-0.5">Courier Doorstep Delivery</p>
          </div>
        </button>
      </div>

      {/* Orders in Active Delivery Category */}
      <div className="space-y-4">
        {currentList.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#F0E6E8]">
            <p className="text-sm font-semibold text-[#7A5B62]">No active orders under this delivery channel.</p>
          </div>
        ) : (
          currentList.map((order) => {
            const details: any = order.delivery.details;

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-[#F0E6E8] shadow-xs hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#F5EDEF]">
                  <div>
                    <span className="font-mono font-bold text-sm text-[#3D272A]">{order.id}</span>
                    <span className="text-xs text-[#A38B90] ml-2">Ordered: {formatISTDate(order.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={order.status}
                      onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                      className="text-xs px-3 py-1 rounded-xl font-bold bg-[#FAF8F5] border border-[#EBD8DC] text-[#3D272A]"
                    >
                      <option value="placed">Placed</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="preparing">In Crafting</option>
                      <option value="ready">Ready for Handover</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered 🌸</option>
                    </select>

                    <button
                      onClick={() => handleWhatsApp(order)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#20bd5a] flex items-center gap-1.5 shadow-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </button>
                  </div>
                </div>

                {/* Handover / Shipping Information Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#7A5B62]">
                  <div>
                    <span className="font-bold text-[#3D272A] uppercase tracking-wider block mb-0.5">Recipient</span>
                    <p className="font-semibold text-sm text-[#3D272A]">{order.customer.name}</p>
                    <p>+91 {order.customer.phone}</p>
                  </div>

                  <div>
                    <span className="font-bold text-[#3D272A] uppercase tracking-wider block mb-0.5">Location / Address</span>
                    {order.delivery.method === 'vadodara_local' && (
                      <p className="font-medium text-[#3D272A]">Area: {details.area || 'Vadodara'}</p>
                    )}
                    {order.delivery.method === 'college' && (
                      <div>
                        <p className="font-medium text-[#3D272A]">{details.collegeName}</p>
                        <p>Gate: {details.deliveryPoint}</p>
                      </div>
                    )}
                    {order.delivery.method === 'parcel' && (
                      <p className="font-medium text-[#3D272A]">
                        {details.house}, {details.street}, {details.city}, {details.state} - {details.pincode}
                      </p>
                    )}
                  </div>

                  <div>
                    <span className="font-bold text-[#3D272A] uppercase tracking-wider block mb-0.5">Preferred Slot / Date</span>
                    {details.preferredDate && <p>📅 Date: {details.preferredDate}</p>}
                    {details.preferredTimeSlot && <p>⏰ Slot: {details.preferredTimeSlot}</p>}
                    {details.instructions && <p className="italic">"{details.instructions}"</p>}
                  </div>
                </div>

                {/* Items & Total */}
                <div className="pt-3 border-t border-[#F5EDEF] flex justify-between items-center text-xs">
                  <span className="text-[#7A5B62]">
                    {order.items.map((it) => `${it.name || it.product?.name} (${it.quantity})`).join(', ')}
                  </span>
                  <span className="font-serif font-bold text-sm text-[#3D272A]">
                    {formatPaise(order.pricing.total)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
