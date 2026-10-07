import React from 'react';
import { FounderCredit } from '../../components/layout/FounderCredit';
import { SocialLinks } from '../../components/SocialIcons';
import { Sparkles, ArrowRight, Heart, LayoutDashboard, ShoppingBag, Store } from 'lucide-react';
import { siteConfig } from '../../config/site.config';

interface WelcomeRoleSelectionProps {
  onSelectCustomer: () => void;
  onSelectMaker: () => void;
  onExploreAsGuest: () => void;
}

export const WelcomeRoleSelection: React.FC<WelcomeRoleSelectionProps> = ({
  onSelectCustomer,
  onSelectMaker,
  onExploreAsGuest,
}) => {
  return (
    <div className="min-h-screen w-full bg-[#FAF8F5] text-[#3D272A] relative flex flex-col justify-between overflow-x-hidden selection:bg-[#FFE3E8] selection:text-[#C0536A]">
      {/* Background Subtle Ambient Blurs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FFE3E8]/70 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#F4A6B7]/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-[#FFF0F3]/80 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header: Brand Wordmark & Tagline */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-[#E8A5B4] animate-pulse" />
          <span className="text-[11px] sm:text-xs tracking-[0.28em] uppercase text-[#A4838B] font-semibold">
            VADODARA HANDMADE CROCHET ATELIER
          </span>
          <span className="w-2 h-2 rounded-full bg-[#E8A5B4] animate-pulse" />
        </div>

        {/* Brand Wordmark */}
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-widest text-[#3D272A] flex items-center justify-center gap-2.5">
          <span>{siteConfig.name.toUpperCase()}</span>
        </h1>

        {/* Tagline */}
        <p className="font-serif italic text-base sm:text-lg text-[#C0536A] mt-1.5 font-medium">
          Handcrafted with love, made to bloom.
        </p>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 flex flex-col justify-center">
        
        {/* Intro Headings */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 space-y-2.5">
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#3D272A] tracking-tight leading-tight">
            “Welcome to our little world of crochet.”
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-[#7A5B62] leading-relaxed">
            Every stitch tells a story. Come explore something handmade with love.
          </p>
        </div>

        {/* Two Distinct Options Grid (Side-by-side on laptop, stacked on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          
          {/* OPTION A: Customer Experience */}
          <div className="group relative bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-[#F4A6B7]/35 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
            
            {/* Top Badge & Image Container */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFE3E8] text-[#C0536A] text-[11px] font-bold tracking-wide border border-[#F4A6B7]/30">
                  <Heart className="w-3 h-3 fill-[#C0536A]" />
                  <span>Handmade Shopper</span>
                </span>
                <span className="text-[11px] text-[#A4838B] font-medium">Explore & Shop</span>
              </div>

              {/* Product Photograph */}
              <div className="relative w-full h-48 sm:h-52 rounded-2xl overflow-hidden mb-5 bg-[#FAF8F5] border border-[#F4A6B7]/20 shadow-inner group-hover:scale-[1.01] transition-transform duration-300">
                <img
                  src="/intro/landscape-4.jpg"
                  alt="Bloomcraft handmade crochet bouquet and floral arrangements"
                  className="w-full h-full object-cover object-center"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2D1B20]/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-[10px] tracking-wider uppercase font-semibold text-[#FFE3E8] block">
                    Everlasting Flora & Charms
                  </span>
                  <p className="font-serif italic text-sm text-white/95">
                    Made slowly, one petal at a time
                  </p>
                </div>
              </div>

              {/* Option Details */}
              <div className="space-y-2">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#3D272A] group-hover:text-[#C0536A] transition-colors">
                  I'm here to explore
                </h3>
                <p className="text-xs sm:text-sm text-[#7A5B62] leading-relaxed">
                  Discover handmade crochet treasures, find your favorites, and create something special.
                </p>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-1.5 mt-4">
                <span className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#EBD8DC] text-[10px] font-semibold text-[#7A5B62]">
                  🌸 Floral Bouquets
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#EBD8DC] text-[10px] font-semibold text-[#7A5B62]">
                  ✨ Tulip Keychains
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#EBD8DC] text-[10px] font-semibold text-[#7A5B62]">
                  🎁 Custom Gifts
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-6 mt-4 border-t border-[#F4A6B7]/20">
              <button
                onClick={onSelectCustomer}
                className="w-full py-3.5 px-5 rounded-2xl bg-[#C0536A] hover:bg-[#A83D53] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#C0536A]/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 group-hover:gap-3 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Continue as Customer</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

          </div>

          {/* OPTION B: Maker Experience */}
          <div className="group relative bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-[#F4A6B7]/35 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
            
            {/* Top Badge & Image Container */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F5] text-[#3D272A] text-[11px] font-bold tracking-wide border border-[#EBD8DC]">
                  <Sparkles className="w-3 h-3 text-[#D96B82]" />
                  <span>Artisan & Studio Owner</span>
                </span>
                <span className="text-[11px] text-[#A4838B] font-medium">Studio Management</span>
              </div>

              {/* Artisan Workspace Photograph */}
              <div className="relative w-full h-48 sm:h-52 rounded-2xl overflow-hidden mb-5 bg-[#FAF8F5] border border-[#F4A6B7]/20 shadow-inner group-hover:scale-[1.01] transition-transform duration-300">
                <img
                  src="/intro/landscape-2.jpg"
                  alt="Bloomcraft artisan crocheting delicate stitches with hook and soft blush yarn"
                  className="w-full h-full object-cover object-center"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#201014]/65 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-[10px] tracking-wider uppercase font-semibold text-[#FFE3E8] block">
                    The Maker's Workspace
                  </span>
                  <p className="font-serif italic text-sm text-white/95">
                    Orders, inventory & custom creations
                  </p>
                </div>
              </div>

              {/* Option Details */}
              <div className="space-y-2">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#3D272A] group-hover:text-[#C0536A] transition-colors">
                  I'm the Maker
                </h3>
                <p className="text-xs sm:text-sm text-[#7A5B62] leading-relaxed">
                  Manage your Bloomcraft shop, organize orders, and keep your creations blooming.
                </p>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-1.5 mt-4">
                <span className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#EBD8DC] text-[10px] font-semibold text-[#7A5B62]">
                  📦 Live Orders Hub
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#EBD8DC] text-[10px] font-semibold text-[#7A5B62]">
                  📊 Revenue Stats
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#EBD8DC] text-[10px] font-semibold text-[#7A5B62]">
                  💬 Custom Quotes
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-6 mt-4 border-t border-[#F4A6B7]/20">
              <button
                onClick={onSelectMaker}
                className="w-full py-3.5 px-5 rounded-2xl bg-[#3D272A] hover:bg-[#201014] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#3D272A]/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 group-hover:gap-3 cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4 text-[#FFE3E8]" />
                <span>Maker Login</span>
                <ArrowRight className="w-4 h-4 text-[#FFE3E8] transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

          </div>

        </div>

        {/* Guest Exploration Option */}
        <div className="text-center mt-8 pt-4">
          <button
            onClick={onExploreAsGuest}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#7A5B62] hover:text-[#C0536A] hover:underline transition-colors py-1.5 px-3 rounded-full hover:bg-white/60"
          >
            <Store className="w-4 h-4 text-[#C0536A]" />
            <span>Just looking around? Browse the storefront as a guest</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </main>

      {/* Footer Note */}
      <footer className="relative z-10 py-5 text-center text-xs text-[#A4838B] border-t border-[#F4A6B7]/20">
        <SocialLinks size="sm" className="justify-center mb-2" />
        <p>© {new Date().getFullYear()} {siteConfig.name} • Vadodara Handmade Crochet Studio • Handcrafted with 🌸</p>
        <FounderCredit className="mt-1" />
      </footer>
    </div>
  );
};

export default WelcomeRoleSelection;
