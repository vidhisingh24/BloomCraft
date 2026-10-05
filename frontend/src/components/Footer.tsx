import React from 'react';
import { Heart, ArrowUp, RefreshCw } from 'lucide-react';
import { siteConfig } from '../config/site.config';
import { SocialLinks } from './SocialIcons';

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
      {/* Decorative top glow */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#D96B82]/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-rose-100">
          
          {/* Col 1: Brand & Tagline */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-[#FFE3E8] border border-[#F4A6B7]/40 flex items-center justify-center text-[#D96B82] shadow-xs">
                <span className="text-xl">🌸</span>
              </div>
              <span className="font-serif text-2xl font-bold tracking-wider text-[#3D272A]">
                {siteConfig.name}
              </span>
            </div>

            <p className="font-serif italic text-base text-[#7A5B62] font-medium">
              “{siteConfig.tagline}”
            </p>

            <p className="text-xs text-[#7A5B62] leading-relaxed max-w-sm">
              We specialize in heirloom-quality crochet keychains, everlasting floral bouquets, and bespoke amigurumi creations. Made with love in Vadodara, Gujarat.
            </p>

            {/* Social Icons & Splash Replay */}
            <div className="pt-2 flex items-center gap-3">
              <SocialLinks />

              {/* Replay intro animation button */}
              <button
                onClick={onReplaySplash}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-[#7A5B62] text-xs transition-colors cursor-pointer"
                title="Replay Rose Petals Opening Animation"
              >
                <RefreshCw className="w-3 h-3 text-[#D96B82]" />
                <span>Play Petals Intro</span>
              </button>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#3D272A]">
              Collections
            </h4>
            <ul className="space-y-2 text-xs text-[#5C3E45]">
              <li>
                <button
                  onClick={() => {
                    onNavigate('keychains');
                    scrollToTop();
                  }}
                  className="hover:text-[#C0536A] transition-colors"
                >
                  Tulip & Daisy Keychains
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
                  Everlasting Floral Bouquets
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
                  Bespoke Custom Orders
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('track');
                    scrollToTop();
                  }}
                  className="hover:text-[#C0536A] transition-colors"
                >
                  Track My Order
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('orders');
                    scrollToTop();
                  }}
                  className="hover:text-[#C0536A] transition-colors"
                >
                  Order History
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Policies */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#3D272A]">
              Studio Information & Policies
            </h4>
            <ul className="space-y-2 text-xs text-[#5C3E45]">
              <li>
                <button
                  onClick={() => {
                    onNavigate('policies');
                    scrollToTop();
                  }}
                  className="hover:text-[#C0536A] transition-colors"
                >
                  About BloomCraft & Slow Craft Story
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('policies');
                    scrollToTop();
                  }}
                  className="hover:text-[#C0536A] transition-colors"
                >
                  Vadodara Pickup & Shipping Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('policies');
                    scrollToTop();
                  }}
                  className="hover:text-[#C0536A] transition-colors"
                >
                  Returns & Handmade Quality Guarantee
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('policies');
                    scrollToTop();
                  }}
                  className="hover:text-[#C0536A] transition-colors"
                >
                  Privacy Policy & Terms of Service
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A4838B]">
          <div className="flex items-center gap-1 text-center sm:text-left">
            <span>Handcrafted with</span>
            <Heart className="w-3.5 h-3.5 text-[#D96B82] fill-[#D96B82] inline" />
            <span>in Vadodara, Gujarat. © {new Date().getFullYear()} {siteConfig.name}.</span>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 hover:text-[#C0536A] transition-colors"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
