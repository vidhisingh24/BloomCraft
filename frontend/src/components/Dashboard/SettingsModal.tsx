import React, { useState } from 'react';
import { X, Check, Store, MapPin } from 'lucide-react';
import { siteConfig } from '../../config/siteConfig';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [isOpenForOrders, setIsOpenForOrders] = useState(true);
  const [leadTime, setLeadTime] = useState('2-3 Days');
  const [whatsappNumber, setWhatsappNumber] = useState(siteConfig.whatsappFormatted);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-[#FFFDFB] rounded-3xl border border-[#F4A6B7]/40 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-[#F4A6B7]/20 bg-[#FFF0F3]/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FFE3E8] text-[#D96B82] flex items-center justify-center text-sm font-semibold">
              ⚙️
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#3D272A]">Studio & Craft Settings</h3>
              <p className="text-xs text-[#7A5B62]">Manage your handmade business operating preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#7A5B62] hover:text-[#C0536A] hover:bg-[#FFE3E8]/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Order Acceptance Status */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FFF0F3]/70 border border-[#F4A6B7]/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFE3E8] text-[#D96B82] flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#3D272A]">Store Order Acceptance</p>
                <p className="text-[11px] text-[#7A5B62]">
                  {isOpenForOrders ? 'Currently taking new handmade orders 🌸' : 'Studio on craft pause'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpenForOrders(!isOpenForOrders)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                isOpenForOrders ? 'bg-[#D96B82]' : 'bg-stone-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  isOpenForOrders ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Lead Time & Turnaround */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A5B62] mb-1.5">
                Standard Craft Lead Time
              </label>
              <select
                value={leadTime}
                onChange={(e) => setLeadTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl bg-white border border-[#F4A6B7]/40 text-xs text-[#3D272A] focus:outline-none focus:ring-2 focus:ring-[#D96B82]/50"
              >
                <option value="1-2 Days">1-2 Days (Fast)</option>
                <option value="2-3 Days">2-3 Days (Standard)</option>
                <option value="3-5 Days">3-5 Days (Elaborate)</option>
                <option value="1 Week">1 Week (Custom Batch)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A5B62] mb-1.5">
                Primary WhatsApp Contact
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl bg-white border border-[#F4A6B7]/40 text-xs text-[#3D272A] focus:outline-none focus:ring-2 focus:ring-[#D96B82]/50"
              />
            </div>
          </div>

          {/* Delivery Hub Defaults */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#3D272A]">
              <MapPin className="w-3.5 h-3.5 text-[#D96B82]" />
              <span>Active Delivery Hubs (Vadodara & Beyond)</span>
            </div>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <span className="px-2.5 py-1 rounded-full bg-[#FFE3E8] text-[#C0536A] font-medium border border-rose-200">
                📍 Vadodara Local Handover
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#FFE3E8] text-[#C0536A] font-medium border border-rose-200">
                🏫 MSU & Local Campuses
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#FFE3E8] text-[#C0536A] font-medium border border-rose-200">
                📦 DTDC / India Post Parcels
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#F4A6B7]/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-medium text-[#7A5B62] hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-[#D96B82] hover:bg-[#C0536A] shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Studio Preferences</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
