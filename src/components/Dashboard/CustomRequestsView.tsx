import React, { useState } from 'react';
import { 
  Search, 
  MessageCircle, 
  Maximize2, 
  X, 
  ChevronDown,
  Palette
} from 'lucide-react';
import type { DashboardCustomRequest, CustomRequestStatus } from '../../data/dashboardData';

interface CustomRequestsViewProps {
  customRequests: DashboardCustomRequest[];
  onUpdateStatus: (requestId: string, newStatus: CustomRequestStatus) => void;
}

export const CustomRequestsView: React.FC<CustomRequestsViewProps> = ({
  customRequests,
  onUpdateStatus,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);

  const statusFilters = ['All', 'New Request', 'Reviewing', 'Quote Sent', 'Accepted', 'Completed'];

  const filteredRequests = customRequests.filter((req) => {
    const matchesFilter = activeFilter === 'All' || req.status === activeFilter;
    const matchesSearch =
      req.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requestedColors.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: CustomRequestStatus) => {
    switch (status) {
      case 'New Request':
        return 'bg-amber-100 text-amber-800 border-amber-300/60';
      case 'Reviewing':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Quote Sent':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Accepted':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300/60';
      case 'Completed':
        return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#F4A6B7]/20">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D272A] tracking-tight">
              Custom Crochet Requests
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FFE3E8] text-[#C0536A] font-semibold">
              Special Orders
            </span>
          </div>
          <p className="text-sm text-[#7A5B62] font-medium">
            Review reference photos, custom yarn color requests, and send quotes to customers
          </p>
        </div>

        {/* Total count badge */}
        <div className="text-xs text-[#7A5B62] bg-[#FFF0F3] px-4 py-2 rounded-2xl border border-[#F4A6B7]/30">
          Showing <span className="font-bold text-[#C0536A]">{filteredRequests.length}</span> custom requests
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-[#FFF0F3]/70 border border-[#F4A6B7]/30 self-start">
          {statusFilters.map((tab) => {
            const count =
              tab === 'All' ? customRequests.length : customRequests.filter((r) => r.status === tab).length;
            const isActive = activeFilter === tab;

            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
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
            placeholder="Search custom orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-white border border-[#F4A6B7]/40 text-xs text-[#3D272A] placeholder-[#A4838B] focus:outline-none focus:ring-2 focus:ring-[#D96B82]/50 shadow-sm"
          />
        </div>
      </div>

      {/* Custom Requests Grid with Prominent Reference Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {filteredRequests.length === 0 ? (
          <div className="col-span-2 text-center py-12 bg-white/80 rounded-3xl border border-rose-100 p-8">
            <span className="text-3xl">🌸</span>
            <p className="font-serif font-bold text-sm text-[#3D272A] mt-2">No custom requests found</p>
            <p className="text-xs text-[#A4838B]">No custom requests matching your filter.</p>
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white/95 rounded-3xl border border-[#F4A6B7]/40 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Reference Image - Visually Prominent as requested */}
                <div className="relative group w-full h-56 sm:h-64 bg-[#FFF0F3] overflow-hidden">
                  <img
                    src={req.referenceImage}
                    alt={req.description}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white font-mono text-xs font-bold border border-white/30">
                      {req.id}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-white/85 backdrop-blur-md text-[#3D272A] text-[11px] font-semibold border border-white/60">
                      Qty: {req.quantity}
                    </span>
                  </div>

                  {/* Zoom Lightbox Trigger */}
                  <button
                    onClick={() => setZoomImage({ url: req.referenceImage, title: req.description })}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/85 hover:bg-white text-[#3D272A] shadow-md transition-transform hover:scale-110 cursor-pointer"
                    title="Zoom Reference Image"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>

                  {/* Customer Floating Bar at bottom of image */}
                  <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-white">
                    <div>
                      <p className="text-sm font-bold drop-shadow-sm">{req.customerName}</p>
                      <p className="text-[11px] text-rose-100 font-mono drop-shadow-sm">{req.phone}</p>
                    </div>
                    {req.budgetQuote && (
                      <span className="px-3 py-1 rounded-full bg-[#D96B82]/90 backdrop-blur-md text-white text-xs font-bold shadow-md">
                        {req.budgetQuote}
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-5 space-y-4">
                  {/* Description */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-[#A4838B] mb-1">
                      Customer Idea & Notes
                    </label>
                    <p className="text-xs sm:text-sm text-[#3D272A] leading-relaxed">
                      {req.description}
                    </p>
                    {req.customerNotes && (
                      <p className="text-xs text-[#7A5B62] italic mt-1.5 p-2 rounded-xl bg-[#FFF0F3]/80 border border-rose-100">
                        "{req.customerNotes}"
                      </p>
                    )}
                  </div>

                  {/* Requested Color Palette */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-[#A4838B] mb-1.5">
                      <Palette className="w-3 h-3 text-[#D96B82]" />
                      <span>Requested Yarn Colors</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {req.requestedColors.map((color, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-full bg-[#FAF8F5] text-[#5C3E45] border border-rose-200/70 text-[11px] font-medium"
                        >
                          🌸 {color}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions & Status Bar */}
              <div className="px-5 py-3.5 border-t border-[#F4A6B7]/20 bg-[#FFFDFB] flex items-center justify-between gap-3">
                {/* Status Dropdown */}
                <div className="relative">
                  <select
                    value={req.status}
                    onChange={(e) => onUpdateStatus(req.id, e.target.value as CustomRequestStatus)}
                    className={`appearance-none px-3 py-1.5 pr-7 rounded-full text-xs font-semibold border cursor-pointer focus:outline-none shadow-sm transition-all ${getStatusBadge(
                      req.status
                    )}`}
                  >
                    <option value="New Request">New Request</option>
                    <option value="Reviewing">Reviewing</option>
                    <option value="Quote Sent">Quote Sent</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                </div>

                {/* Direct WhatsApp Response Button */}
                <a
                  href={`https://wa.me/${req.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(
                    req.customerName
                  )},%20this%20is%20Bloomcraft%20regarding%20your%20custom%20crochet%20request%20${req.id}🌸`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Chat Quote</span>
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Lightbox Zoom Modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setZoomImage(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-[#1A0C10] rounded-3xl overflow-hidden border border-white/20 shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 hover:bg-black text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomImage.url}
              alt={zoomImage.title}
              className="w-full max-h-[75vh] object-contain rounded-2xl"
            />
            <p className="text-xs text-rose-100/90 text-center py-3 px-4">
              {zoomImage.title}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
