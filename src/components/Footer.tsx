import React from 'react';
import { Heart, MessageCircle, ArrowUp, RefreshCw } from 'lucide-react';
import { siteConfig, getWhatsAppUrl } from '../config/siteConfig';

interface FooterProps {
  onNavigate: (tab: string) => void;
  onReplaySplash: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onReplaySplash }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#FFFDFB] border-t border-[#F4A6B7]/30 pt-14 pb-12 transition-colors relative overflow-hidden">
      {/* Decorative top wave/glow */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#D96B82]/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-rose-100">
          
          {/* Col 1: Brand & Tagline */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-[#FFE3E8] border border-[#F4A6B7]/40 flex items-center justify-center text-[#D96B82] shadow-sm">
                <span className="text-xl">🌸</span>
              </div>
              <span className="font-serif text-2xl font-bold tracking-wider text-[#3D272A]">
                {siteConfig.name}
              </span>
            </div>

            {/* Tagline as requested */}
            <p className="font-serif italic text-base text-[#7A5B62] font-medium">
              “{siteConfig.tagline}”
            </p>

            <p className="text-xs text-[#7A5B62] leading-relaxed max-w-sm">
              We specialize in heirloom-quality crochet keychains, everlasting floral arrangements, and personalized yarn art. Made with care to bring long-lasting joy.
            </p>

            {/* Social Icons */}
            <div className="pt-2 flex items-center gap-3">
              <a
                href={siteConfig.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#FFE3E8] hover:bg-[#D96B82] text-[#C0536A] hover:text-white flex items-center justify-center transition-all shadow-sm group"
                aria-label="Instagram"
              >
                {/* Clean Instagram SVG */}
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#25D366]/15 hover:bg-[#25D366] text-[#128C7E] hover:text-white flex items-center justify-center transition-all shadow-sm"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
              </a>

              {/* Replay intro animation button */}
              <button
                onClick={onReplaySplash}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-[#7A5B62] text-xs transition-colors"
                title="Replay Rose Petals Opening Animation"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Play Petals Intro</span>
              </button>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#3D272A]">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs text-[#5C3E45]">
              <li>
                <button
                  onClick={() => {
                    onNavigate('home');
                    scrollToTop();
                  }}
                  className="hover:text-[#C0536A] transition-colors"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('keychains');
                    scrollToTop();
                  }}
                  className="hover:text-[#C0536A] transition-colors"
                >
                  Keychains
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('bouquets');
                    scrollToTop();
                  }}
                  className="hover:text-[#C0536A] transition-colors"
                >
                  Bouquets
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('customize');
                    scrollToTop();
                  }}
                  className="hover:text-[#C0536A] transition-colors"
                >
                  Customize
                </button>
              </li>
              <li className="pt-1 border-t border-rose-100">
                <button
                  onClick={() => {
                    onNavigate('dashboard');
                    scrollToTop();
                  }}
                  className="text-[#C0536A] hover:text-[#D96B82] font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span>🌸</span>
                  <span>Maker Studio</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Handmade Yarn Care Tips */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#3D272A]">
              Crochet Care Tips
            </h4>
            <div className="p-3.5 rounded-2xl bg-[#FFF0F3] border border-rose-100 text-xs text-[#7A5B62] space-y-1.5">
              <p className="flex items-start gap-1.5">
                <span>✨</span>
                <span>Gently dust bouquets with a soft dry brush or cool blowdryer setting.</span>
              </p>
              <p className="flex items-start gap-1.5">
                <span>🧼</span>
                <span>Spot clean keychains with mild soapy lukewarm water and air-dry flat.</span>
              </p>
              <p className="flex items-start gap-1.5">
                <span>🌸</span>
                <span>Keep out of heavy dampness to maintain yarn stiffness and color vibrancy.</span>
              </p>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A4838B]">
          <p className="flex items-center gap-1">
            <span>© {new Date().getFullYear()} BLOOMCRAFT. Crafted with love</span>
            <Heart className="w-3.5 h-3.5 fill-[#D96B82] text-[#D96B82]" />
            <span>in India.</span>
          </p>

          <div className="flex items-center gap-4">
            <span>WhatsApp: {siteConfig.whatsappFormatted}</span>
            <button
              onClick={scrollToTop}
              className="p-2 rounded-full bg-[#FFE3E8] hover:bg-[#D96B82] text-[#C0536A] hover:text-white transition-all"
              title="Back to Top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
