import React, { useState } from 'react';
import {
  MessageCircle,
  Sparkles,
  Heart,
  Palette,
  Clock,
  ZoomIn,
  X,
  Send,
  PhoneCall
} from 'lucide-react';
import { CUSTOMIZED_ITEMS, type CustomizedItem } from '../data/customizedItems';
import { siteConfig } from '../config/site.config';
import { buildWhatsAppLink } from '../utils/whatsapp';

export const CustomizePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'customized' | 'bouquets' | 'keychains' | 'special'>('all');
  const [activeLightboxItem, setActiveLightboxItem] = useState<CustomizedItem | null>(null);

  // Quick WhatsApp customizer form state
  const [customerName, setCustomerName] = useState('');
  const [itemType, setItemType] = useState('Customized Rakhi (₹410)');
  const [customDetails, setCustomDetails] = useState('');
  const [preferredColors, setPreferredColors] = useState('');

  // Primary customized catalog items
  const customizedCatalog = [
    {
      name: 'Customized Rakhi',
      price: '₹410',
      pricePaise: 41000,
      image: '/images/customized/custom_rakhi.png',
      description: 'Set of 5 exquisite handcrafted floral crochet Rakhis with pearl beads on delicate colored threads (Sunflower, Pink Bloom, Daisy, Crimson Flower, Sky Blue Rose).',
      turnaround: '2 Days',
      badge: 'Festive Set of 5',
    },
    {
      name: 'Customized Waist Chain',
      price: '₹250',
      pricePaise: 25000,
      image: '/images/customized/custom_lace_collar_charm.jpg',
      description: 'Delicate handcrafted customized waist chain with intricate crochet lace detailing and artisan beads.',
      turnaround: '3 Days',
      badge: 'Bespoke Accessory',
    },
    {
      name: 'Customized Bow Clip',
      price: '₹200',
      pricePaise: 20000,
      image: '/images/customized/custom_crimson_mesh_bow.png',
      description: 'Artisan structured crochet bow clip with delicate lattice stitch and custom ribbon tails.',
      turnaround: '2 Days',
      badge: 'Hair Statement',
    },
  ];

  // Filtered showcase items
  const filteredItems = CUSTOMIZED_ITEMS.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  // Handle direct WhatsApp custom order builder
  const handleSendCustomWhatsApp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const nameText = customerName.trim() ? customerName.trim() : 'a customer';
    const categoryText = itemType;
    const colorsText = preferredColors.trim() ? preferredColors.trim() : 'Open to suggestions';
    const detailsText = customDetails.trim()
      ? customDetails.trim()
      : 'I have a custom crochet idea in mind and would like to discuss design, colors, and pricing.';

    const message = `🌸 *CUSTOM CROCHET ENQUIRY — BLOOMCRAFT* 🌸

Hi BloomCraft! I'd love to discuss a custom handmade crochet order:

👤 *Name:* ${nameText}
🧶 *Category / Item:* ${categoryText}
🎨 *Preferred Colors:* ${colorsText}

📝 *Details / Idea:*
"${detailsText}"

Could you please share your availability, turnaround time, and confirm the order? ✨`;

    const url = buildWhatsAppLink(message);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Handle ordering a catalog item via WhatsApp
  const handleOrderCatalogItemWhatsApp = (item: typeof customizedCatalog[0]) => {
    const message = `🌸 *CUSTOM PRODUCT ORDER — BLOOMCRAFT* 🌸

Hi BloomCraft! I would like to order:

✨ *Product:* ${item.name}
💰 *Price:* ${item.price}
🏷️ *Details:* ${item.description}
⏱️ *Making Time:* ${item.turnaround}

Could you please confirm color options and delivery details? ✨`;

    const url = buildWhatsAppLink(message);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Handle ordering similar to a showcase item via WhatsApp
  const handleOrderSimilarWhatsApp = (item: CustomizedItem) => {
    const message = `🌸 *CUSTOM ORDER INQUIRY — BLOOMCRAFT* 🌸

Hi BloomCraft! I saw your customized work on the website and loved:

✨ *"${item.title}"*
💰 *Price:* ₹${item.price}
🏷️ *Category:* ${item.badge || item.category}
🎨 *Color Palette:* ${item.colors.join(', ')}

I would like to order this design. Could you please confirm color options and delivery? 💬`;

    const url = buildWhatsAppLink(message);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Direct general WhatsApp chat
  const handleDirectWhatsAppChat = () => {
    const message = `🌸 Hi BloomCraft! I'd like to customize a handmade crochet piece (waist chain/bow clip/flower keychain/rakhi/bouquet). Could we chat about custom options and designs? ✨`;
    const url = buildWhatsAppLink(message);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-16">

        {/* 1. HERO & INTRODUCTION */}
        <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFE3E8] text-[#D96B82] text-xs font-bold uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3.5 h-3.5" /> Bespoke Handmade Studio
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#3D272A] tracking-tight leading-tight">
            Handcrafted <span className="text-[#D96B82] italic">Custom Creations</span>
          </h1>

          <p className="text-sm sm:text-base text-[#7A5B62] leading-relaxed max-w-2xl mx-auto">
            Explore our dedicated customized catalog and bespoke gallery. Whether you want custom Rakhis, personalized waist chains, structured bow clips, or floral keychains, we handcraft each piece with 100% milk cotton yarn.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleDirectWhatsAppChat}
              className="px-6 py-3 rounded-full bg-[#25D366] text-white font-bold text-sm hover:bg-[#20bd5a] shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              Chat on WhatsApp to Customize
            </button>

            <a
              href="#custom-pricing-table"
              className="px-6 py-3 rounded-full bg-white border border-[#EBD8DC] text-[#3D272A] font-semibold text-sm hover:bg-[#FFE3E8] transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#D96B82]" />
              View Customized Pricing Table
            </a>
          </div>
        </div>

        {/* 2. CUSTOMIZED PRODUCTS CATALOG & PRICING TABLE */}
        <div id="custom-pricing-table" className="scroll-mt-12 bg-white rounded-3xl p-6 sm:p-10 border border-[#F0E6E8] shadow-sm space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#F0E6E8] pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#D96B82] mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Official Catalog
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#3D272A]">
                Customized Products & Pricing
              </h2>
              <p className="text-xs sm:text-sm text-[#7A5B62] mt-1">
                Exact selling prices for all handcrafted bespoke creations
              </p>
            </div>

            <div className="text-xs bg-[#FFF0F3] px-3.5 py-1.5 rounded-full border border-[#F4A6B7]/30 text-[#C0536A] font-semibold">
              Category: <strong className="text-[#3D272A]">Customized Products</strong>
            </div>
          </div>

          {/* Responsive Table for Desktop & Tablet */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F0E6E8] text-xs font-bold uppercase tracking-wider text-[#7A5B62] bg-[#FAF8F5]">
                  <th className="py-3.5 px-4 rounded-l-xl">Product</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4 text-center">Making Time</th>
                  <th className="py-3.5 px-4 text-right">Selling Price</th>
                  <th className="py-3.5 px-4 text-center rounded-r-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF0F2] text-sm">
                {customizedCatalog.map((prod) => (
                  <tr key={prod.name} className="hover:bg-[#FFFDFB] transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#F0E6E8] shrink-0">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <span className="font-serif font-bold text-[#3D272A] block text-base">
                            {prod.name}
                          </span>
                          <span className="inline-block text-[10px] px-2 py-0.5 rounded-md bg-[#FFE3E8] text-[#C0536A] font-semibold mt-0.5">
                            {prod.badge}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs text-[#7A5B62] max-w-xs">
                      {prod.description}
                    </td>
                    <td className="py-4 px-4 text-center text-xs font-medium text-[#7A5B62]">
                      <span className="inline-flex items-center gap-1 bg-[#FAF8F5] px-2.5 py-1 rounded-full border border-[#EBD8DC]">
                        <Clock className="w-3 h-3 text-[#D96B82]" /> {prod.turnaround}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-serif font-bold text-lg text-[#3D272A]">
                        {prod.price}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleOrderCatalogItemWhatsApp(prod)}
                        className="px-4 py-2 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs shadow-xs hover:shadow transition-all inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-white" />
                        Order on WhatsApp
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards for Mobile View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
            {customizedCatalog.map((prod) => (
              <div
                key={prod.name}
                className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#F0E6E8] space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-white border border-[#F0E6E8]">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#3D272A]/80 text-white text-[10px] font-semibold">
                      {prod.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#3D272A]">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-[#7A5B62] mt-1 leading-relaxed">
                      {prod.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EBD8DC] flex items-center justify-between">
                  <span className="font-serif font-bold text-lg text-[#3D272A]">
                    {prod.price}
                  </span>
                  <button
                    onClick={() => handleOrderCatalogItemWhatsApp(prod)}
                    className="px-4 py-2 rounded-full bg-[#25D366] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white" />
                    Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. HOW WHATSAPP CUSTOMIZATION WORKS (3 SIMPLE STEPS) */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#F0E6E8] shadow-xs">
          <div className="text-center mb-8">
            <span className="text-xs uppercase font-bold text-[#D96B82] tracking-widest">Simple & Personal</span>
            <h2 className="text-xl sm:text-3xl font-serif font-bold text-[#3D272A] mt-1">
              How Custom Orders Work
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Step 1 */}
            <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#F0E6E8] flex flex-col items-center text-center space-y-3 relative group hover:border-[#D96B82] transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#FFE3E8] text-[#D96B82] font-bold text-base flex items-center justify-center shadow-xs">
                1
              </div>
              <h3 className="font-serif font-bold text-[#3D272A] text-lg">Share Your Vision</h3>
              <p className="text-xs text-[#7A5B62] leading-relaxed">
                Send us your reference photos, Pinterest pins, color palette, or special requests directly on WhatsApp.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#F0E6E8] flex flex-col items-center text-center space-y-3 relative group hover:border-[#D96B82] transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#FFE3E8] text-[#D96B82] font-bold text-base flex items-center justify-center shadow-xs">
                2
              </div>
              <h3 className="font-serif font-bold text-[#3D272A] text-lg">Design & Pricing</h3>
              <p className="text-xs text-[#7A5B62] leading-relaxed">
                We confirm the yarn colors, flower combinations, making timeline, and provide a clear quote.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#F0E6E8] flex flex-col items-center text-center space-y-3 relative group hover:border-[#D96B82] transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#FFE3E8] text-[#D96B82] font-bold text-base flex items-center justify-center shadow-xs">
                3
              </div>
              <h3 className="font-serif font-bold text-[#3D272A] text-lg">Handcrafted & Delivered</h3>
              <p className="text-xs text-[#7A5B62] leading-relaxed">
                Your order is crocheted with 100% milk cotton yarn, beautifully gift-wrapped, and dispatched safely.
              </p>
            </div>
          </div>
        </div>

        {/* 4. SHOWCASE OF CUSTOMIZED CREATIONS */}
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#F0E6E8] pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#D96B82] mb-1">
                <Heart className="w-3.5 h-3.5 fill-[#D96B82]" /> Gallery of Bespoke Orders
              </div>
              <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[#3D272A]">
                What We Have Customized
              </h2>
            </div>

            {/* Filter Category Chips */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: 'All Creations' },
                { id: 'customized', label: 'Customized Catalog' },
                { id: 'bouquets', label: 'Custom Bouquets' },
                { id: 'keychains', label: 'Personalized Keychains' },
                { id: 'special', label: 'Special Gifts' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id as any)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                    selectedCategory === tab.id
                      ? 'bg-[#3D272A] text-white shadow-xs'
                      : 'bg-white border border-[#EBD8DC] text-[#7A5B62] hover:border-[#D96B82] hover:text-[#3D272A]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl overflow-hidden border border-[#F0E6E8] shadow-sm hover:shadow-md transition-all flex flex-col group"
              >
                {/* Image Container with Zoom & Badge */}
                <div
                  className="relative aspect-4/3 overflow-hidden bg-[#FAF8F5] cursor-pointer"
                  onClick={() => setActiveLightboxItem(item)}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-xs text-[#3D272A] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                      <ZoomIn className="w-3.5 h-3.5" /> View Photo
                    </span>
                  </div>

                  {/* Badge */}
                  {item.badge && (
                    <div className="absolute top-3 left-3 bg-[#3D272A]/85 backdrop-blur-xs text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-xs">
                      {item.badge}
                    </div>
                  )}

                  {/* Price Tag Pill */}
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs text-[#3D272A] text-xs font-bold px-3 py-1 rounded-full border border-[#EBD8DC] shadow-xs">
                    ₹{item.price}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif font-bold text-lg text-[#3D272A] leading-snug group-hover:text-[#D96B82] transition-colors">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-xs text-[#7A5B62] leading-relaxed line-clamp-3">
                      {item.description}
                    </p>
                  </div>

                  {/* Colors & Details */}
                  <div className="space-y-3 pt-2 border-t border-[#FAF0F2]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#A38B90] font-medium flex items-center gap-1">
                        <Palette className="w-3.5 h-3.5 text-[#D96B82]" /> Palette:
                      </span>
                      <span className="text-[#3D272A] font-semibold text-right">
                        {item.colors.join(', ')}
                      </span>
                    </div>

                    {item.clientNote && (
                      <div className="bg-[#FFF5F7] p-2.5 rounded-xl border border-[#FFE3E8] text-[11px] text-[#7A5B62] italic">
                        {item.clientNote}
                      </div>
                    )}

                    {/* WhatsApp Action Button */}
                    <button
                      onClick={() => handleOrderSimilarWhatsApp(item)}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#25D366]/10 text-[#0A7B3E] hover:bg-[#25D366] hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2 border border-[#25D366]/30 hover:border-transparent"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Order for ₹{item.price} on WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. INTERACTIVE WHATSAPP CUSTOMIZATION BUILDER */}
        <div id="custom-builder" className="scroll-mt-10">
          <div className="bg-gradient-to-br from-[#FFF5F7] via-white to-[#FAF8F5] rounded-3xl p-6 sm:p-12 border border-[#F0E6E8] shadow-sm space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFE3E8] text-[#D96B82] text-xs font-bold uppercase tracking-wider">
                <Send className="w-3.5 h-3.5" /> Direct WhatsApp Customizer
              </div>
              <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[#3D272A]">
                Want Something Custom Made?
              </h2>
              <p className="text-xs sm:text-sm text-[#7A5B62]">
                Fill in what you have in mind or click below to message us directly on WhatsApp. We reply promptly with turnaround and yarn details!
              </p>
            </div>

            <form onSubmit={handleSendCustomWhatsApp} className="max-w-2xl mx-auto space-y-6">
              {/* Category Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3D272A]">
                  1. What would you like to customize?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    'Customized Rakhi (₹410)',
                    'Customized Waist Chain (₹250)',
                    'Customized Bow Clip (₹200)',
                    'Custom Bouquet',
                    'Amigurumi Mascot',
                    'Full Gift Hamper',
                    'Other Idea',
                  ].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setItemType(type)}
                      className={`p-3 rounded-2xl border text-xs font-semibold text-center transition-all ${
                        itemType === type
                          ? 'border-[#D96B82] bg-[#FFE3E8] text-[#3D272A] shadow-xs'
                          : 'border-[#EBD8DC] bg-white text-[#7A5B62] hover:border-[#D96B82]/50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3D272A]">
                    Your Name <span className="text-[10px] font-normal text-[#A38B90]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sneha Patel"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EBD8DC] text-xs sm:text-sm bg-white focus:outline-none focus:border-[#D96B82]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3D272A]">
                    Preferred Colors <span className="text-[10px] font-normal text-[#A38B90]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pastel Pink, Lilac, Sunflower Yellow"
                    value={preferredColors}
                    onChange={(e) => setPreferredColors(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EBD8DC] text-xs sm:text-sm bg-white focus:outline-none focus:border-[#D96B82]"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3D272A]">
                  Describe Your Custom Idea
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell us flower types, size, occasion, reference photos you have, or special letter charms..."
                  value={customDetails}
                  onChange={(e) => setCustomDetails(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-[#EBD8DC] text-xs sm:text-sm bg-white focus:outline-none focus:border-[#D96B82]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="w-full sm:flex-1 py-4 rounded-full bg-[#25D366] text-white font-bold text-sm sm:text-base hover:bg-[#20bd5a] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5 fill-white" />
                  Send Custom Request on WhatsApp 🌸
                </button>

                <button
                  type="button"
                  onClick={handleDirectWhatsAppChat}
                  className="w-full sm:w-auto px-6 py-4 rounded-full bg-white border border-[#EBD8DC] text-[#3D272A] font-semibold text-xs sm:text-sm hover:bg-[#FFE3E8] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4 text-[#D96B82]" />
                  Direct WhatsApp Chat
                </button>
              </div>

              <p className="text-center text-[11px] text-[#A38B90]">
                🌸 WhatsApp number: <strong className="text-[#3D272A]">{siteConfig.whatsappFormatted}</strong> • We answer promptly with pricing & photos!
              </p>
            </form>
          </div>
        </div>

        {/* 6. LIGHTBOX MODAL */}
        {activeLightboxItem && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
            onClick={() => setActiveLightboxItem(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-white/20 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveLightboxItem(null)}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative aspect-4/3 bg-[#FAF8F5]">
                <img
                  src={activeLightboxItem.image}
                  alt={activeLightboxItem.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-block bg-[#FFE3E8] text-[#D96B82] text-xs font-bold px-3 py-1 rounded-full">
                      {activeLightboxItem.badge}
                    </span>
                    <span className="font-serif font-bold text-xl text-[#3D272A]">
                      ₹{activeLightboxItem.price}
                    </span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#3D272A]">
                    {activeLightboxItem.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#7A5B62] mt-1 leading-relaxed">
                    {activeLightboxItem.description}
                  </p>
                </div>

                <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#F0E6E8] flex items-center justify-between text-xs">
                  <span className="text-[#7A5B62] font-semibold">Custom Palette:</span>
                  <span className="font-bold text-[#3D272A]">{activeLightboxItem.colors.join(', ')}</span>
                </div>

                <button
                  onClick={() => {
                    handleOrderSimilarWhatsApp(activeLightboxItem);
                    setActiveLightboxItem(null);
                  }}
                  className="w-full py-3.5 rounded-full bg-[#25D366] text-white font-bold text-sm hover:bg-[#20bd5a] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  Order on WhatsApp for ₹{activeLightboxItem.price}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
