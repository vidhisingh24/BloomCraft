import React, { useState } from 'react';
import { 
  Search, 
  Maximize2, 
  X, 
  Send
} from 'lucide-react';
import type { CustomRequest } from '../../types';
import { formatISTDate } from '../../utils/date';
import { buildWhatsAppLink } from '../../utils/whatsapp';

interface CustomRequestsViewProps {
  customRequests: CustomRequest[];
  onUpdateCustomStatus: (requestId: string, newStatus: CustomRequest['status']) => void;
  onUpdateQuote: (requestId: string, quotedPrice: number, notes?: string) => void;
}

type FilterTab = 'all' | CustomRequest['status'];

export const CustomRequestsView: React.FC<CustomRequestsViewProps> = ({
  customRequests,
  onUpdateCustomStatus,
  onUpdateQuote,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);
  const [quoteInput, setQuoteInput] = useState<{ [id: string]: number }>({});

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All Requests' },
    { key: 'received', label: 'New Received' },
    { key: 'quoted', label: 'Quoted' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
  ];

  const filteredRequests = customRequests.filter((req) => {
    const matchesFilter = activeFilter === 'all' || req.status === activeFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      req.id.toLowerCase().includes(q) ||
      req.customer.name.toLowerCase().includes(q) ||
      req.customer.phone.includes(q) ||
      req.description.toLowerCase().includes(q) ||
      req.colors.some((c) => c.toLowerCase().includes(q));

    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: CustomRequest['status']) => {
    switch (status) {
      case 'received':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'quoted':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  const handleSendQuoteWhatsApp = (req: CustomRequest, price: number) => {
    onUpdateQuote(req.id, price);
    const phone = req.customer.phone.replace(/\D/g, '');
    const text = `🌸 *BLOOMCRAFT CUSTOM QUOTE — ${req.id}* 🌸\n\nHi ${req.customer.name}! We'd love to craft your custom crochet idea:\n\n🧶 *Category:* ${req.itemType || 'Custom Crochet'}\n🎨 *Palette:* ${req.colors.join(', ')}\n🔢 *Quantity:* ${req.quantity}\n\n👉 *Quoted Price:* *₹${price}* (Includes handcrafted gift box 🎀)\n\nPlease let us know if you'd like us to confirm and start crafting your bespoke piece! 💕`;
    window.open(buildWhatsAppLink(text, phone), '_blank');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#F4A6B7]/20">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D272A] tracking-tight">
              Custom Crochet Requests
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FFE3E8] text-[#C0536A] font-semibold">
              Bespoke Studio
            </span>
          </div>
          <p className="text-sm text-[#7A5B62] font-medium">
            Review reference photos, custom yarn color requests, and send quotes to customers
          </p>
        </div>

        <div className="text-xs text-[#7A5B62] bg-[#FFF0F3] px-3.5 py-2 rounded-xl border border-[#F4A6B7]/30">
          <span className="font-bold text-[#D96B82]">{filteredRequests.length}</span> requests
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-[#FFF0F3]/70 border border-[#F4A6B7]/30">
          {filterTabs.map((tab) => {
            const count = tab.key === 'all' ? customRequests.length : customRequests.filter((r) => r.status === tab.key).length;
            const isActive = activeFilter === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
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

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#A38B90] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search request ID, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[#EBD8DC] bg-white focus:outline-none focus:border-[#D96B82]"
          />
        </div>
      </div>

      {/* Request Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredRequests.map((req) => {
          const currentQuote = quoteInput[req.id] || req.quotedPrice || 0;

          return (
            <div
              key={req.id}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-[#F0E6E8] shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Card Top */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#F5EDEF]">
                  <div>
                    <span className="font-mono font-bold text-sm text-[#3D272A]">{req.id}</span>
                    <span className="text-[10px] text-[#A38B90] block">{formatISTDate(req.createdAt)}</span>
                  </div>

                  <select
                    value={req.status}
                    onChange={(e) => onUpdateCustomStatus(req.id, e.target.value as CustomRequest['status'])}
                    className={`text-xs px-2.5 py-1 rounded-xl font-bold border ${getStatusBadge(req.status)} focus:outline-none`}
                  >
                    <option value="received">Received</option>
                    <option value="quoted">Quoted</option>
                    <option value="accepted">Accepted</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed 🌸</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>

                {/* Customer & Info */}
                <div className="text-xs text-[#7A5B62] space-y-1">
                  <p className="font-bold text-sm text-[#3D272A]">{req.customer.name}</p>
                  <p>WhatsApp: +91 {req.customer.phone} {req.customer.email ? `• ${req.customer.email}` : ''}</p>
                  <p>Category: <span className="font-semibold text-[#3D272A]">{req.itemType || 'Custom Piece'}</span> (Qty: {req.quantity})</p>
                  {req.neededBy && <p>Needed By: <span className="font-semibold text-[#D96B82]">{req.neededBy}</span></p>}
                </div>

                {/* Description */}
                <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#EBD8DC] text-xs text-[#3D272A]">
                  <span className="text-[10px] uppercase font-bold text-[#A38B90] block mb-0.5">Idea Description</span>
                  <p className="italic leading-relaxed">"{req.description}"</p>
                </div>

                {/* Reference Photos */}
                {req.referenceImages && req.referenceImages.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#A38B90] block mb-1.5">
                      Customer Reference Photos ({req.referenceImages.length})
                    </span>
                    <div className="flex gap-2">
                      {req.referenceImages.map((img, i) => (
                        <div
                          key={i}
                          onClick={() => setZoomImage({ url: img, title: `${req.customer.name}'s Reference ${i + 1}` })}
                          className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#EBD8DC] group cursor-pointer"
                        >
                          <img src={img} alt="Reference" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Maximize2 className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quote & Actions Footer */}
              <div className="pt-3 border-t border-[#F5EDEF] space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7A5B62]">₹</span>
                    <input
                      type="number"
                      placeholder="Quote price in INR"
                      value={quoteInput[req.id] !== undefined ? quoteInput[req.id] : req.quotedPrice || ''}
                      onChange={(e) => setQuoteInput((prev: { [id: string]: number }) => ({ ...prev, [req.id]: Number(e.target.value) }))}
                      className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-[#EBD8DC] bg-[#FAF8F5] focus:outline-none focus:border-[#D96B82]"
                    />
                  </div>

                  <button
                    onClick={() => handleSendQuoteWhatsApp(req, currentQuote)}
                    disabled={!currentQuote}
                    className="px-4 py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#20bd5a] transition-all flex items-center gap-1.5 disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" /> Quote on WhatsApp
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      {zoomImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="relative max-w-2xl w-full bg-white rounded-3xl p-4 overflow-hidden shadow-2xl">
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white text-[#3D272A] flex items-center justify-center shadow-md hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={zoomImage.url} alt={zoomImage.title} className="w-full max-h-[75vh] object-contain rounded-2xl" />
            <p className="text-center text-xs font-semibold text-[#7A5B62] mt-2">{zoomImage.title}</p>
          </div>
        </div>
      )}
    </div>
  );
};
