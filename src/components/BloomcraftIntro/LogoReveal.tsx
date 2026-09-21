import React from 'react';
import { Sparkles } from 'lucide-react';

interface LogoRevealProps {
  isVisible: boolean;
}

export const LogoReveal: React.FC<LogoRevealProps> = ({ isVisible }) => {
  return (
    <div
      className={`relative z-20 flex flex-col items-center justify-center text-center px-6 max-w-2xl mx-auto transition-all duration-1000 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-6 scale-[0.96] pointer-events-none'
      }`}
    >
      {/* Concentric Expanding Shockwave Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
        <div className="w-48 h-48 rounded-full border-2 border-[#D96B82]/50 animate-shockwave-1" />
        <div className="w-56 h-56 rounded-full border border-[#F4A6B7]/60 animate-shockwave-2" />
        <div className="w-72 h-72 rounded-full bg-gradient-to-tr from-[#FFE3E8]/40 to-[#FFF0F3]/20 blur-2xl animate-glow-halo" />
      </div>

      {/* Studio Header Badge */}
      <div className="flex items-center gap-3 mb-5 opacity-90 animate-fade-in" style={{ animationDelay: '0.15s' }}>
        <span className="w-10 sm:w-16 h-px bg-gradient-to-r from-transparent to-[#D96B82]/60" />
        <span className="text-[11px] sm:text-xs uppercase tracking-[0.28em] text-[#C0536A] font-semibold font-sans">
          Artisanal Crochet Boutique
        </span>
        <span className="w-10 sm:w-16 h-px bg-gradient-to-l from-transparent to-[#D96B82]/60" />
      </div>

      {/* Decorative Crochet Flower Icon Badge with Blooming Pop */}
      <div className="relative mb-5 animate-bloom-pop">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/95 shadow-2xl shadow-[#D96B82]/35 border-2 border-[#F4A6B7]/60 flex items-center justify-center text-[#D96B82] backdrop-blur-md transform transition-transform duration-700 hover:scale-110">
          {/* Inner Golden Rim */}
          <div className="absolute inset-1.5 rounded-full border border-rose-200/60 pointer-events-none" />
          <span className="text-4xl sm:text-5xl filter drop-shadow-md select-none transform transition-transform duration-500 hover:rotate-12">
            🌸
          </span>
        </div>

        {/* Orbiting Sparkles */}
        <div className="absolute -top-2 -right-2 text-[#D96B82] animate-sparkle-burst">
          <Sparkles className="w-5 h-5 filter drop-shadow" />
        </div>
        <div className="absolute -bottom-1 -left-2 text-[#F4A6B7] animate-sparkle-burst" style={{ animationDelay: '0.4s' }}>
          <Sparkles className="w-4 h-4 filter drop-shadow" />
        </div>
        <div className="absolute top-1/2 -right-4 text-[#E07A8B] animate-sparkle-burst" style={{ animationDelay: '0.7s' }}>
          <span className="text-xs">✦</span>
        </div>
      </div>

      {/* Brand Title: BLOOMCRAFT with Explosive Boom Animation */}
      <div className="relative animate-title-boom">
        <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl font-black tracking-[0.16em] text-transparent bg-clip-text bg-gradient-to-b from-[#3D272A] via-[#592F38] to-[#3D272A] leading-tight select-none filter drop-shadow-[0_4px_12px_rgba(217,107,130,0.25)]">
          BLOOMCRAFT
        </h1>
        {/* Soft Ambient Text Glow */}
        <div className="absolute -inset-4 bg-gradient-to-r from-rose-200/0 via-rose-300/25 to-rose-200/0 blur-lg -z-10 pointer-events-none" />
      </div>

      {/* Brand Tagline */}
      <p
        className="mt-4 sm:mt-5 text-lg sm:text-2xl text-[#7A5B62] font-normal tracking-wide font-sans italic animate-fade-in"
        style={{ animationDelay: '0.5s' }}
      >
        Handcrafted with love, made to bloom.
      </p>

      {/* Delicate Floral Divider */}
      <div
        className="mt-7 sm:mt-8 flex items-center justify-center gap-3 text-[#D96B82]/70 animate-fade-in"
        style={{ animationDelay: '0.7s' }}
      >
        <span className="h-px w-14 sm:w-20 bg-gradient-to-r from-transparent to-[#D96B82]/50" />
        <span className="text-sm">🌸</span>
        <span className="h-px w-14 sm:w-20 bg-gradient-to-l from-transparent to-[#D96B82]/50" />
      </div>
    </div>
  );
};

export default LogoReveal;
