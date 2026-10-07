import React, { useState } from 'react';
import { ShoppingBag, Heart, Menu, X, Sparkles, LogOut, LayoutDashboard, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { siteConfig } from '../../config/site.config';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onReplaySplash?: () => void;
  onOpenLogin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenLogin }) => {
  const { totalItems, setIsCartOpen } = useCart();
  const { totalWishlist } = useWishlist();
  const { user, isMaker, isCustomer, logout, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    setActiveTab('home');
    showToast('Signed out', 'See you soon 🌸', 'info');
  };

  const navLinks: { id: string; label: string; sectionId?: string }[] = [
    { id: 'home', label: 'Home', sectionId: 'hero' },
    { id: 'keychains', label: 'Keychains', sectionId: 'keychains' },
    { id: 'bouquets', label: 'Bouquets', sectionId: 'bouquets' },
    { id: 'other-creations', label: 'Other Creations', sectionId: 'other-creations' },
    { id: 'customize', label: 'Customize', sectionId: 'custom-creations' },
    { id: 'track', label: 'Track Order' },
    { id: 'orders', label: 'My Orders' },
  ];

  const handleNavClick = (tabId: string, sectionId?: string) => {
    setMobileMenuOpen(false);
    if (sectionId) {
      if (activeTab !== 'home') {
        setActiveTab('home');
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) {
            const yOffset = -70;
            const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 150);
      } else {
        const el = document.getElementById(sectionId);
        if (el) {
          const yOffset = -70;
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    } else {
      setActiveTab(tabId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
                  onClick={() => handleNavClick(link.id, link.sectionId)}
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

            {/* Role-based User State / Maker Studio / Login */}
            {authLoading ? (
              <span className="hidden lg:block w-24 h-8 rounded-full bg-[#FFE3E8]/60 animate-pulse" aria-hidden="true" />
            ) : isMaker ? (
              <div className="hidden lg:flex items-center gap-2">
                <button
                  onClick={() => handleNavClick('dashboard')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFE3E8] text-[#C0536A] border border-[#F4A6B7]/40 text-xs font-bold hover:bg-[#FFD4DC] transition-all shadow-xs"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>{user?.name ? `${user.name.split(' ')[0]}'s Studio` : 'Maker Studio'}</span>
                </button>
                <button
                  onClick={() => void handleLogout()}
                  title="Sign Out"
                  className="p-2 rounded-full text-[#7A5B62] hover:text-[#C0536A] hover:bg-[#FFE3E8]/60 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : isCustomer ? (
              <div className="hidden lg:flex items-center gap-2">
                <button
                  onClick={() => handleNavClick('profile')}
                  title="My profile"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#EBD8DC] text-xs font-semibold text-[#5C3E45] hover:bg-[#FFF0F3] hover:text-[#C0536A] transition-all shadow-xs"
                >
                  <span className="text-sm">🌸</span>
                  <span className="max-w-[100px] truncate">{user?.name || 'Customer'}</span>
                </button>
                <button
                  onClick={() => void handleLogout()}
                  title="Sign Out"
                  className="p-2 rounded-full text-[#7A5B62] hover:text-[#C0536A] hover:bg-[#FFE3E8]/60 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (onOpenLogin) onOpenLogin();
                  else handleNavClick('auth');
                }}
                className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#3D272A] text-white text-xs font-bold hover:bg-[#5C3E45] transition-all shadow-xs"
              >
                <User className="w-3.5 h-3.5 text-[#FFE3E8]" />
                <span>Sign In</span>
              </button>
            )}

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
              onClick={() => handleNavClick(link.id, link.sectionId)}
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
          {isMaker ? (
            <>
              <button
                onClick={() => handleNavClick('dashboard')}
                className="w-full text-left px-4 py-2.5 rounded-2xl text-sm font-medium text-[#D96B82] bg-[#FFE3E8]/50 hover:bg-[#FFE3E8] flex items-center justify-between"
              >
                <span>Maker Studio Dashboard 🌸</span>
              </button>
              <button
                onClick={() => void handleLogout()}
                className="w-full text-left px-4 py-2.5 rounded-2xl text-sm font-medium text-[#7A5B62] hover:bg-[#FFF0F3] flex items-center justify-between"
              >
                <span>Sign Out ({user?.name || 'Maker'})</span>
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : isCustomer ? (
            <>
              <button
                onClick={() => handleNavClick('profile')}
                className="w-full text-left px-4 py-2.5 rounded-2xl text-sm font-medium text-[#5C3E45] hover:bg-[#FFF0F3] flex items-center justify-between"
              >
                <span>My Profile & Addresses</span>
                <User className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleNavClick('orders')}
                className="w-full text-left px-4 py-2.5 rounded-2xl text-sm font-medium text-[#5C3E45] hover:bg-[#FFF0F3] flex items-center justify-between"
              >
                <span>My Orders History</span>
              </button>
              <button
                onClick={() => handleNavClick('settings')}
                className="w-full text-left px-4 py-2.5 rounded-2xl text-sm font-medium text-[#5C3E45] hover:bg-[#FFF0F3] flex items-center justify-between"
              >
                <span>Settings</span>
              </button>
              <button
                onClick={() => void handleLogout()}
                className="w-full text-left px-4 py-2.5 rounded-2xl text-sm font-medium text-[#7A5B62] hover:bg-[#FFF0F3] flex items-center justify-between"
              >
                <span>Sign Out ({user?.name || 'Customer'})</span>
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenLogin) onOpenLogin();
                else handleNavClick('auth');
              }}
              className="w-full text-left px-4 py-2.5 rounded-2xl text-sm font-bold text-white bg-[#3D272A] hover:bg-[#5C3E45] flex items-center justify-between"
            >
              <span>Sign In (Customer / Maker) 🌸</span>
              <User className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </header>
  );
};
