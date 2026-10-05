import React, { useState } from 'react';
import { siteConfig } from '../../config/site.config';
import { 
  Heart, 
  Truck, 
  RefreshCw, 
  ShieldCheck, 
  HelpCircle, 
  Mail, 
  Phone, 
  MapPin,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

export type PolicyTab =
  | 'about'
  | 'contact'
  | 'faq'
  | 'shipping'
  | 'returns'
  | 'privacy'
  | 'terms';

interface PolicyPagesProps {
  initialTab?: PolicyTab;
  onBackToShop: () => void;
}

export const PolicyPages: React.FC<PolicyPagesProps> = ({
  initialTab = 'about',
  onBackToShop,
}) => {
  const [activeTab, setActiveTab] = useState<PolicyTab>(initialTab);

  const tabs: { key: PolicyTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'about', label: 'About BloomCraft', icon: Heart },
    { key: 'contact', label: 'Contact Us', icon: Mail },
    { key: 'faq', label: 'FAQ', icon: HelpCircle },
    { key: 'shipping', label: 'Shipping & Delivery', icon: Truck },
    { key: 'returns', label: 'Returns & Refunds', icon: RefreshCw },
    { key: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
    { key: 'terms', label: 'Terms & Conditions', icon: Sparkles },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#F0E6E8]">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#D96B82]">Information & Studio Guidelines</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#3D272A]">
            BloomCraft Studio Policies
          </h1>
        </div>
        <button
          onClick={onBackToShop}
          className="text-xs font-semibold text-[#7A5B62] hover:text-[#D96B82] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Shop
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#F0E6E8]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#3D272A] text-white shadow-xs'
                  : 'bg-white text-[#7A5B62] border border-[#EBD8DC] hover:border-[#D96B82]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FFE3E8]' : 'text-[#D96B82]'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Body */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#F0E6E8] shadow-xs text-sm text-[#7A5B62] leading-relaxed space-y-6">
        
        {/* ABOUT */}
        {activeTab === 'about' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-serif font-bold text-[#3D272A]">About BloomCraft 🌸</h2>
            <p>
              Welcome to <strong>BloomCraft</strong>, a slow-crafted handmade crochet brand founded in Vadodara, Gujarat. We believe in creating delicate, lasting tokens of love that never wilt or wither.
            </p>
            <p>
              Each double tulip bell charm, daisy keychain, everlasting bouquet, and amigurumi creation is 100% stitched stitch-by-stitch by hand using premium hypoallergenic milk cotton yarn.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="bg-[#FFF0F3] p-4 rounded-2xl">
                <span className="text-lg">🧶</span>
                <h4 className="font-bold text-[#3D272A] text-sm mt-1">100% Handmade</h4>
                <p className="text-xs text-[#7A5B62] mt-0.5">Slow-stitched with premium milk cotton yarn.</p>
              </div>
              <div className="bg-[#FFF0F3] p-4 rounded-2xl">
                <span className="text-lg">🌿</span>
                <h4 className="font-bold text-[#3D272A] text-sm mt-1">Everlasting Beauty</h4>
                <p className="text-xs text-[#7A5B62] mt-0.5">Forever blooms that never fade or wilt.</p>
              </div>
              <div className="bg-[#FFF0F3] p-4 rounded-2xl">
                <span className="text-lg">📍</span>
                <h4 className="font-bold text-[#3D272A] text-sm mt-1">Vadodara Studio</h4>
                <p className="text-xs text-[#7A5B62] mt-0.5">Personal pickup & campus delivery.</p>
              </div>
            </div>
          </div>
        )}

        {/* CONTACT */}
        {activeTab === 'contact' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-serif font-bold text-[#3D272A]">Get in Touch with the Maker 💌</h2>
            <p>
              Have a question about an order, custom idea, or campus delivery in Vadodara? We'd love to chat with you!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <a
                href={`https://wa.me/${siteConfig.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="p-5 rounded-2xl bg-[#E7F7EE] text-[#0A7B3E] hover:bg-[#d8f2e2] transition-colors block"
              >
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5" />
                  <div>
                    <h4 className="font-bold text-sm">WhatsApp Chat</h4>
                    <p className="text-xs">{siteConfig.whatsappFormatted}</p>
                  </div>
                </div>
              </a>

              <a
                href={siteConfig.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="p-5 rounded-2xl bg-[#FFF0F3] text-[#D96B82] hover:bg-[#ffe3e8] transition-colors block"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">📸</span>
                  <div>
                    <h4 className="font-bold text-sm">Instagram DM</h4>
                    <p className="text-xs">{siteConfig.instagramHandle}</p>
                  </div>
                </div>
              </a>
            </div>

            <div className="pt-4 border-t border-[#F5EDEF] flex items-center gap-2 text-xs text-[#7A5B62]">
              <MapPin className="w-4 h-4 text-[#D96B82]" />
              <span>Studio: Alkapuri / Sayajigunj, Vadodara, Gujarat 390001, India</span>
            </div>
          </div>
        )}

        {/* FAQ */}
        {activeTab === 'faq' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif font-bold text-[#3D272A]">Frequently Asked Questions 🌸</h2>
            
            <div className="space-y-4">
              <div className="border-b border-[#F0E6E8] pb-3">
                <h4 className="font-bold text-[#3D272A] text-sm">How long does handmade crafting take?</h4>
                <p className="text-xs text-[#7A5B62] mt-1">
                  Individual flower keychains take ~1–2 days. Hand-assembled bouquets take ~3–5 days to stitch each stem, arrange foliage, and complete Korean craft wrapping.
                </p>
              </div>

              <div className="border-b border-[#F0E6E8] pb-3">
                <h4 className="font-bold text-[#3D272A] text-sm">Can I arrange a specific meeting spot in Vadodara?</h4>
                <p className="text-xs text-[#7A5B62] mt-1">
                  Yes! Choose "Vadodara Local" during checkout and specify your area. We will coordinate on WhatsApp for a convenient handover near Alkapuri, Inorbit Mall, Fatehgunj, or your favorite spot.
                </p>
              </div>

              <div className="border-b border-[#F0E6E8] pb-3">
                <h4 className="font-bold text-[#3D272A] text-sm">How do I wash or care for my crochet items?</h4>
                <p className="text-xs text-[#7A5B62] mt-1">
                  Spot-clean with a damp cloth or hand wash gently in cold water with mild detergent. Air dry flat in shade. Do not machine wash or wring.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SHIPPING */}
        {activeTab === 'shipping' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-serif font-bold text-[#3D272A]">Shipping & Delivery Policy 📦</h2>
            <p>
              We ship across India with reliable courier partners and provide direct handovers in Vadodara:
            </p>
            <ul className="list-disc list-inside space-y-2 text-xs text-[#7A5B62]">
              <li><strong>📍 Vadodara Local Handover:</strong> 100% Free pickup/handover coordinated directly with the maker.</li>
              <li><strong>🏫 College Campus Delivery:</strong> Free campus gate delivery for MSU, Parul, Navrachana, ITM, GSFC, and other Vadodara universities.</li>
              <li><strong>📦 Pan-India Courier:</strong> Flat ₹60 parcel shipping, or <strong>FREE on orders above ₹999</strong>. Standard transit is 3–7 business days.</li>
            </ul>
          </div>
        )}

        {/* RETURNS */}
        {activeTab === 'returns' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-serif font-bold text-[#3D272A]">Returns & Handmade Craft Policy 🧶</h2>
            <p>
              Because each item is specially made-to-order by hand, minor variations in stitch tension or color hues make every piece unique and one-of-a-kind.
            </p>
            <p>
              If your creation arrives damaged in transit, please share an unboxing photo or video on WhatsApp within 48 hours of delivery, and we will gladly arrange a free replacement.
            </p>
          </div>
        )}

        {/* PRIVACY */}
        {activeTab === 'privacy' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-serif font-bold text-[#3D272A]">Privacy Policy 🔒</h2>
            <p>
              Your contact details (name, phone number, address) are strictly used for fulfilling your BloomCraft handmade order and coordinating delivery. We never sell, rent, or share your personal data with third parties.
            </p>
          </div>
        )}

        {/* TERMS */}
        {activeTab === 'terms' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-serif font-bold text-[#3D272A]">Terms & Conditions 📜</h2>
            <p>
              By placing an order on BloomCraft, you acknowledge that all items are artisanal handcrafted goods. Lead times are estimates and may vary slightly during peak holiday or festive seasons.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
