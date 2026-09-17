import React, { useState } from 'react';
import { MessageCircle, X, Sparkles } from 'lucide-react';
import { getWhatsAppUrl } from '../config/siteConfig';

export const FloatingWhatsApp: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(true);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
      {/* Interactive Tooltip Card */}
      {showTooltip && (
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-rose-200/80 text-xs text-[#3D272A] animate-float-slow">
          <Sparkles className="w-3.5 h-3.5 text-[#D96B82]" />
          <span>Chat with artisan & order directly!</span>
          <button
            onClick={() => setShowTooltip(false)}
            className="text-[#A4838B] hover:text-[#3D272A] ml-1 p-0.5"
            aria-label="Dismiss message"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Main Floating Button */}
      <a
        href={getWhatsAppUrl('Hi BloomCraft! 🌸 I would like to inquire about ordering handcrafted crochet items.')}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#20ba5a] hover:to-[#0f7a6e] text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white/50"
        aria-label="Order on WhatsApp"
      >
        <MessageCircle className="w-5 h-5 fill-white shrink-0 group-hover:rotate-12 transition-transform" />
        <span className="text-xs sm:text-sm font-bold tracking-wide shadow-sm whitespace-nowrap">
          Order on WhatsApp
        </span>

        {/* Pulse ring animation */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-30 animate-ping pointer-events-none -z-10" />
      </a>
    </div>
  );
};
