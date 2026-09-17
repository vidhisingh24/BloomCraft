import React from 'react';
import { ArrowRight, Sparkles, Heart, ShieldCheck } from 'lucide-react';

interface HeroProps {
  onShopNow: () => void;
  onCustomize: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onShopNow, onCustomize }) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
      {/* Soft Background Accents */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-gradient-to-br from-[#FFE3E8] to-[#FFF0F3] blur-3xl opacity-70 pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-80 h-80 rounded-full bg-gradient-to-tr from-[#FFF0F3] to-[#FFE3E8] blur-3xl opacity-60 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Soft Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFE3E8]/80 border border-[#F4A6B7]/40 text-[#C0536A] text-xs font-semibold tracking-wide shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#D96B82]" />
              <span>100% Handcrafted • Everlasting Flowers & Keychains</span>
            </div>

            {/* Main Heading */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#3D272A] leading-[1.15]">
              Little Things, <br className="hidden sm:inline" />
              <span className="text-[#C0536A] italic font-serif font-normal">Handcrafted</span> With Love.
            </h1>

            {/* Subtext */}
            <p className="text-base sm:text-lg lg:text-xl text-[#7A5B62] font-normal max-w-xl mx-auto lg:mx-0 leading-relaxed">
              “Beautiful crochet creations made specially for your special moments.”
            </p>

            {/* Call to Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={onShopNow}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-[#D96B82] to-[#C0536A] hover:from-[#c95d73] hover:to-[#ae465c] text-white font-semibold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onCustomize}
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white/90 hover:bg-white text-[#5C3E45] hover:text-[#C0536A] border border-[#F4A6B7]/60 font-semibold text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
              >
                <span>Customize Yours</span>
                <Sparkles className="w-4 h-4 text-[#D96B82]" />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-6 border-t border-rose-100/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-[#7A5B62]">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-[#D96B82] fill-[#D96B82]/20" />
                <span>Made With Pure Milk Cotton</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#D96B82]" />
                <span>Flowers That Never Wilt</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">🎁</span>
                <span>Cute Gift Packaging</span>
              </div>
            </div>
          </div>

          {/* Right Hero Visual Showcase */}
          <div className="lg:col-span-5 relative flex justify-center">
            {/* Visual Frame Container */}
            <div className="relative w-full max-w-md">
              {/* Main Crochet Showcase Image */}
              <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white">
                <img
                  src="https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80"
                  alt="BloomCraft Handcrafted Crochet Tulips & Flowers"
                  className="w-full h-80 sm:h-96 object-cover hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                
                {/* Romantic Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#3D272A]/70 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="text-xs font-medium uppercase tracking-widest text-[#FFE3E8]">
                    Featured Collection
                  </span>
                  <p className="font-serif text-xl font-semibold mt-0.5">
                    Everlasting Pastel Floral Arrangements
                  </p>
                  <p className="text-xs text-rose-100/90 mt-1">
                    Handmade petal by petal with ultra-soft yarn
                  </p>
                </div>
              </div>

              {/* Floating Badge 1 - Top Left */}
              <div className="absolute -top-4 -left-4 z-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-rose-100/80 flex items-center gap-3 animate-float-slow">
                <div className="w-10 h-10 rounded-xl bg-[#FFF0F3] flex items-center justify-center text-lg">
                  🍓
                </div>
                <div>
                  <p className="text-xs font-bold text-[#3D272A]">Strawberry Charm</p>
                  <p className="text-[11px] font-semibold text-[#D96B82]">₹249</p>
                </div>
              </div>

              {/* Floating Badge 2 - Bottom Right */}
              <div className="absolute -bottom-5 -right-4 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-lg border border-rose-100/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FFE3E8] flex items-center justify-center text-[#D96B82] font-serif font-bold text-sm">
                  100%
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-[#3D272A]">Handmade To Order</p>
                  <p className="text-[11px] text-[#7A5B62]">Zero Plastic Petals</p>
                </div>
              </div>

              {/* Decorative background glow circle */}
              <div className="absolute -inset-4 bg-gradient-to-r from-[#F4A6B7]/30 to-[#FFE3E8]/50 rounded-3xl -rotate-2 z-0 blur-sm" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
