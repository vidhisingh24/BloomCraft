import React, { useState } from 'react';
import { ShoppingBag, Heart, Menu, X, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { siteConfig } from '../config/site.config';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onReplaySplash?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { totalItems, setIsCartOpen } = useCart();
  const { totalWishlist } = useWishlist();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'keychains', label: 'Keychains' },
    { id: 'bouquets', label: 'Bouquets' },
    { id: 'customize', label: 'Customize' },
    { id: 'track', label: 'Track Order' },
    { id: 'orders', label: 'My Orders' },
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFFDFB]/90 backdrop-blur-md border-b border-[#F4A6B7]/30 transition-all">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-[#FFE3E8] via-[#FFF0F3] to-[#FFE3E8] py-1 sm:py-1.5 px-3 sm:px-4 text-center text-[10px] sm:text-xs text-[#7A5B62] font-medium border-b border-[#F4A6B7]/20 flex items-center justify-center gap-1.5 sm:gap-2">
        <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D96B82] shrink-0" />
        <span className="truncate sm:whitespace-normal">Handcrafted with 100% Love in Vadodara • Direct WhatsApp Ordering</span>
        <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D96B82] shrink-0 hidden sm:inline" />
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand Name */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 sm:gap-2.5 text-left group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FFE3E8] border border-[#F4A6B7]/40 flex items-center justify-center text-[#D96B82] shadow-xs group-hover:rotate-12 transition-transform duration-300 shrink-0">
              <span className="text-base sm:text-lg">🌸</span>
            </div>
            <div>
              <span className="font-serif text-xl sm:text-2xl md:text-3xl font-bold tracking-wider text-[#3D272A] block leading-none">
                {siteConfig.name}
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[#A4838B] font-medium block mt-0.5">
                Handmade Crochet Studio
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`relative px-3.5 py-1.5 text-xs lg:text-sm font-medium transition-all rounded-full ${
                    isActive
                      ? 'text-[#C0536A] font-semibold bg-[#FFE3E8]/70'
                      : 'text-[#5C3E45] hover:text-[#C0536A] hover:bg-[#FFF0F3]/60'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#D96B82] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Wishlist Button */}
            <button
              onClick={() => handleNavClick('wishlist')}
              className="relative p-2.5 rounded-full text-[#5C3E45] hover:text-[#C0536A] hover:bg-[#FFE3E8]/60 transition-colors"
              title="View Wishlist"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {totalWishlist > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#D96B82] text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {totalWishlist}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-full bg-[#FFE3E8]/80 text-[#C0536A] hover:bg-[#FFE3E8] transition-all shadow-xs"
              title="View Cart"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#3D272A] text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Maker Studio Button (Quick access to Dashboard demo) */}
            <button
              onClick={() => handleNavClick('dashboard')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF8F5] border border-[#EBD8DC] text-xs font-semibold text-[#7A5B62] hover:bg-[#FFE3E8] hover:text-[#3D272A] transition-all"
            >
              <span>Maker Studio</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-full text-[#5C3E45] hover:bg-[#FFE3E8]/60 transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Slide-in Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FFFDFB] border-b border-[#F4A6B7]/30 px-4 py-4 space-y-2 shadow-lg animate-fadeIn">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className={`w-full text-left px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                activeTab === link.id
                  ? 'bg-[#FFE3E8] text-[#C0536A] font-semibold'
                  : 'text-[#5C3E45] hover:bg-[#FFF0F3]'
              }`}
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => handleNavClick('wishlist')}
            className="w-full text-left px-4 py-2.5 rounded-2xl text-sm font-medium text-[#5C3E45] hover:bg-[#FFF0F3] flex items-center justify-between"
          >
            <span>My Wishlist</span>
            {totalWishlist > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#D96B82] text-white">
                {totalWishlist}
              </span>
            )}
          </button>
          <button
            onClick={() => handleNavClick('dashboard')}
            className="w-full text-left px-4 py-2.5 rounded-2xl text-sm font-medium text-[#D96B82] hover:bg-[#FFF0F3] flex items-center justify-between"
          >
            <span>Maker Studio Dashboard 🌸</span>
          </button>
        </div>
      )}
    </header>
  );
};
