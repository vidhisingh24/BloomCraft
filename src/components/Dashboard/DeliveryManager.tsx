import React, { useState } from 'react';
import { 
  MapPin, 
  GraduationCap, 
  Package, 
  MessageCircle, 
  Clock
} from 'lucide-react';
import type { DashboardOrder } from '../../data/dashboardData';

interface DeliveryManagerProps {
  orders: DashboardOrder[];
}

type DeliveryCategoryTab = 'local' | 'college' | 'parcel';

export const DeliveryManager: React.FC<DeliveryManagerProps> = ({ orders }) => {
  const [activeTab, setActiveTab] = useState<DeliveryCategoryTab>('local');

  const localOrders = orders.filter((o) => o.deliveryMethod === 'Vadodara Local');
  const collegeOrders = orders.filter((o) => o.deliveryMethod === 'College Delivery');
  const parcelOrders = orders.filter((o) => o.deliveryMethod === 'Parcel');

  const getStatusBadge = (status: DashboardOrder['status']) => {
    switch (status) {
      case 'New':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Preparing':
        return 'bg-[#FFE3E8] text-[#C0536A] border-rose-200';
      case 'Ready':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Delivered':
        return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#F4A6B7]/20">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D272A] tracking-tight">
            Delivery & Handover Hub
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
          onClick={() => setActiveTab('local')}
          className={`p-4 rounded-3xl border transition-all text-left flex items-center gap-3 cursor-pointer ${
            activeTab === 'local'
              ? 'bg-white text-[#3D272A] border-[#D96B82] shadow-md ring-2 ring-[#D96B82]/20'
              : 'bg-white/80 hover:bg-white text-[#7A5B62] border-rose-100'
          }`}
        >
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#D96B82] flex items-center justify-center text-lg flex-shrink-0">
            📍
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-sm text-[#3D272A]">Vadodara Local</h3>
              <span className="text-xs px-2 py-0.2 rounded-full bg-[#FFE3E8] text-[#C0536A] font-bold">
                {localOrders.length}
              </span>
            </div>
            <p className="text-[11px] text-[#A4838B] mt-0.5">Meetups & Pickup Spots</p>
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
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg flex-shrink-0">
            🏫
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-sm text-[#3D272A]">College Delivery</h3>
              <span className="text-xs px-2 py-0.2 rounded-full bg-purple-100 text-purple-800 font-bold">
                {collegeOrders.length}
              </span>
            </div>
            <p className="text-[11px] text-[#A4838B] mt-0.5">MSU, Parul & Campuses</p>
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
          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center text-lg flex-shrink-0">
            📦
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-sm text-[#3D272A]">Parcel Shipping</h3>
              <span className="text-xs px-2 py-0.2 rounded-full bg-sky-100 text-sky-800 font-bold">
                {parcelOrders.length}
              </span>
            </div>
            <p className="text-[11px] text-[#A4838B] mt-0.5">Pan-India Courier Boxes</p>
          </div>
        </button>
      </div>

      {/* Tab Content 1: Vadodara Local */}
      {activeTab === 'local' && (
        <div className="bg-white/95 rounded-3xl border border-[#F4A6B7]/30 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-rose-100">
            <div className="flex items-center gap-2">
              <span className="text-xl">📍</span>
              <h2 className="font-serif text-lg font-bold text-[#3D272A]">Vadodara Local Handover List</h2>
            </div>
            <p className="text-xs text-[#7A5B62] font-medium">{localOrders.length} active meetups</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localOrders.map((order) => (
              <div
                key={order.id}
                className="p-5 rounded-2xl bg-[#FFFDFB] border border-[#F4A6B7]/30 shadow-sm space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#C0536A]">{order.id}</span>
                    <h4 className="font-serif text-base font-bold text-[#3D272A]">{order.customerName}</h4>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                {/* Items */}
                <div className="text-xs text-[#5C3E45] bg-[#FFF0F3]/60 p-2.5 rounded-xl space-y-1">
                  {order.items.map((i, idx) => (
                    <p key={idx} className="flex justify-between">
                      <span>{i.quantity}x {i.name}</span>
                      <span className="font-semibold text-[#3D272A]">₹{i.price * i.quantity}</span>
                    </p>
                  ))}
                </div>

                {/* Meeting Point & Time */}
                <div className="space-y-1.5 text-xs text-[#7A5B62]">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#D96B82] flex-shrink-0 mt-0.5" />
                    <span className="text-[#3D272A] font-medium">{order.deliveryDetails}</span>
                  </div>
                  {order.timeSlot && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#D96B82]" />
                      <span>{order.timeSlot}</span>
                    </div>
                  )}
                </div>

                {/* Contact Actions */}
                <div className="pt-2 border-t border-rose-100/60 flex items-center justify-between">
                  <span className="font-mono text-xs text-[#7A5B62]">{order.phone}</span>
                  <a
                    href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(
                      order.customerName
                    )},%20this%20is%20Bloomcraft%20regarding%20your%20local%20delivery%20at%20${encodeURIComponent(
                      order.deliveryDetails
                    )}🌸`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-105"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Handover</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 2: College Delivery */}
      {activeTab === 'college' && (
        <div className="bg-white/95 rounded-3xl border border-[#F4A6B7]/30 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-rose-100">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏫</span>
              <h2 className="font-serif text-lg font-bold text-[#3D272A]">Campus & College Delivery Hub</h2>
            </div>
            <p className="text-xs text-[#7A5B62] font-medium">{collegeOrders.length} campus deliveries</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {collegeOrders.map((order) => (
              <div
                key={order.id}
                className="p-5 rounded-2xl bg-[#FFFDFB] border border-[#F4A6B7]/30 shadow-sm space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#C0536A]">{order.id}</span>
                    <h4 className="font-serif text-base font-bold text-[#3D272A]">{order.customerName}</h4>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                {/* Items */}
                <div className="text-xs text-[#5C3E45] bg-[#FFF0F3]/60 p-2.5 rounded-xl space-y-1">
                  {order.items.map((i, idx) => (
                    <p key={idx} className="flex justify-between">
                      <span>{i.quantity}x {i.name}</span>
                      <span className="font-semibold text-[#3D272A]">₹{i.price * i.quantity}</span>
                    </p>
                  ))}
                </div>

                {/* College Point */}
                <div className="space-y-1.5 text-xs text-[#7A5B62]">
                  <div className="flex items-start gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-[#3D272A] font-medium">{order.deliveryDetails}</span>
                  </div>
                  {order.timeSlot && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#D96B82]" />
                      <span>{order.timeSlot}</span>
                    </div>
                  )}
                </div>

                {/* Contact */}
                <div className="pt-2 border-t border-rose-100/60 flex items-center justify-between">
                  <span className="font-mono text-xs text-[#7A5B62]">{order.phone}</span>
                  <a
                    href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(
                      order.customerName
                    )},%20this%20is%20Bloomcraft%20regarding%20your%20campus%20delivery%20at%20${encodeURIComponent(
                      order.deliveryDetails
                    )}🌸`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-105"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Campus</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 3: Parcel Shipping */}
      {activeTab === 'parcel' && (
        <div className="bg-white/95 rounded-3xl border border-[#F4A6B7]/30 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-rose-100">
            <div className="flex items-center gap-2">
              <span className="text-xl">📦</span>
              <h2 className="font-serif text-lg font-bold text-[#3D272A]">Parcel Courier Outbound</h2>
            </div>
            <p className="text-xs text-[#7A5B62] font-medium">{parcelOrders.length} parcel shipments</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {parcelOrders.map((order) => (
              <div
                key={order.id}
                className="p-5 rounded-2xl bg-[#FFFDFB] border border-[#F4A6B7]/30 shadow-sm space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#C0536A]">{order.id}</span>
                    <h4 className="font-serif text-base font-bold text-[#3D272A]">{order.customerName}</h4>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                {/* Items */}
                <div className="text-xs text-[#5C3E45] bg-[#FFF0F3]/60 p-2.5 rounded-xl space-y-1">
                  {order.items.map((i, idx) => (
                    <p key={idx} className="flex justify-between">
                      <span>{i.quantity}x {i.name}</span>
                      <span className="font-semibold text-[#3D272A]">₹{i.price * i.quantity}</span>
                    </p>
                  ))}
                </div>

                {/* City & Address */}
                <div className="space-y-1.5 text-xs text-[#7A5B62]">
                  <div className="flex items-start gap-2">
                    <Package className="w-3.5 h-3.5 text-sky-600 flex-shrink-0 mt-0.5" />
                    <span className="text-[#3D272A] font-medium">{order.deliveryDetails}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#A4838B]">
                    <span>Standard Courier: DTDC / India Post Express</span>
                  </div>
                </div>

                {/* Contact */}
                <div className="pt-2 border-t border-rose-100/60 flex items-center justify-between">
                  <span className="font-mono text-xs text-[#7A5B62]">{order.phone}</span>
                  <a
                    href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(
                      order.customerName
                    )},%20this%20is%20Bloomcraft%20with%20your%20tracking%20update%20for%20order%20${order.id}🌸`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-105"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Send Tracking</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
