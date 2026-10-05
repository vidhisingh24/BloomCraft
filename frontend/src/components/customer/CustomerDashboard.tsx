import React, { useState } from 'react';
import { 
  Heart, 
  ShoppingBag, 
  Sparkles, 
  ArrowRight, 
  MessageCircle, 
  Palette, 
  Flower2 
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';
import { siteConfig } from '../../config/site.config';
import { MOCK_PRODUCTS } from '../../data/mock/products';
import { CUSTOMIZED_ITEMS } from '../../data/customizedItems';
import { formatPaise } from '../../utils/currency';
import { buildWhatsAppLink } from '../../utils/whatsapp';
import type { Product } from '../../types';

interface CustomerDashboardProps {
  onSelectProduct: (product: Product) => void;
  onNavigateOrderHistory?: () => void;
  onNavigateTrackOrder?: () => void;
  onNavigatePolicies?: () => void;
  onReplayWelcome?: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  onSelectProduct,
  onNavigateOrderHistory,
  onNavigateTrackOrder,
  onNavigatePolicies,
}) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { showToast } = useToast();

  // Keychain category filter
  const [keychainFilter, setKeychainFilter] = useState<'all' | 'lily' | 'rose' | 'daisy' | 'others'>('all');

  // Bouquet category filter
  const [bouquetFilter, setBouquetFilter] = useState<'all' | 'lilies' | 'tulips' | 'happiness' | 'character' | 'keepsakes'>('all');

  // Filter Keychains
  const keychains = MOCK_PRODUCTS.filter((p) => p.category === 'keychain');
  const filteredKeychains = keychains.filter((p) => {
    if (keychainFilter === 'all') return true;
    if (keychainFilter === 'lily') return p.keychainType === 'tulip';
    if (keychainFilter === 'rose') return p.keychainType === 'rose';
    if (keychainFilter === 'daisy') return p.keychainType === 'daisy';
    if (keychainFilter === 'others') return p.keychainType === 'others';
    return true;
  });

  // Filter Bouquets
  const bouquets = MOCK_PRODUCTS.filter((p) => p.category === 'bouquet');
  const filteredBouquets = bouquets.filter((b) => {
    if (bouquetFilter === 'all') return true;
    if (bouquetFilter === 'lilies') return b.id.includes('lily') || b.name.toLowerCase().includes('lily');
    if (bouquetFilter === 'tulips') return b.id.includes('tulip') || b.name.toLowerCase().includes('tulip');
    if (bouquetFilter === 'happiness') return b.id.includes('happiness') || b.name.toLowerCase().includes('happiness');
    if (bouquetFilter === 'character') return b.id.includes('spiderman') || b.tags.some((t) => t.toLowerCase().includes('character') || t.toLowerCase().includes('spidey'));
    if (bouquetFilter === 'keepsakes') return b.id.includes('love') || b.tags.some((t) => t.toLowerCase().includes('romantic') || t.toLowerCase().includes('love'));
    return true;
  });

  // Other creations (accessories, amigurumi, fruit charms, talismans)
  const otherCreations = MOCK_PRODUCTS.filter(
    (p) => p.category === 'other' || (p.category === 'keychain' && p.keychainType === 'others')
  );

  // Smooth scroll helper
  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const yOffset = -70; // Header offset
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // WhatsApp Customization Link (Exact requested text)
  const customWhatsAppMessage = "Hi Bloomcraft! I saw your custom creations and would love to discuss a crochet design of my own. Could you help me personalize a product?";
  const customWhatsAppUrl = buildWhatsAppLink(customWhatsAppMessage);

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleToggleWishlist = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div className="w-full bg-[#FAF8F5] text-[#3D272A] overflow-x-hidden selection:bg-[#FFE3E8] selection:text-[#C0536A]">
      
      {/* =========================================================================
          SECTION 1 — WELCOME HERO
         ========================================================================= */}
      <section 
        id="hero" 
        className="relative min-h-[85vh] sm:min-h-[80vh] flex items-center justify-center pt-8 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden"
      >
        {/* Ambient background rose glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[42rem] h-[42rem] bg-gradient-to-b from-[#FFE3E8]/80 via-[#FFF0F3]/50 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-4 right-10 w-80 h-80 bg-[#F4A6B7]/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-6 sm:space-y-8">
          
          {/* Top Artisan Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-[#F4A6B7]/40 shadow-xs text-xs font-semibold text-[#C0536A] backdrop-blur-sm animate-fadeIn">
            <Sparkles className="w-3.5 h-3.5 text-[#D96B82]" />
            <span>Handcrafted in Vadodara • 100% Milk Cotton Yarn</span>
            <Sparkles className="w-3.5 h-3.5 text-[#D96B82]" />
          </div>

          {/* Main Hero Headline */}
          <div className="space-y-4">
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#3D272A] leading-[1.12]">
              Little Things, <br className="hidden sm:block" />
              <span className="text-[#C0536A] italic font-normal">Made with Love.</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-[#7A5B62] max-w-2xl mx-auto leading-relaxed font-light">
              Explore handmade crochet creations, find your favorites, and discover something made especially for you.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              onClick={() => scrollToSection('keychains')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#C0536A] hover:bg-[#A83D53] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#C0536A]/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
            >
              <Flower2 className="w-4 h-4" />
              <span>Explore Collections</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => scrollToSection('custom-creations')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white/90 hover:bg-[#FFE3E8] text-[#3D272A] hover:text-[#C0536A] text-xs sm:text-sm font-bold border border-[#EBD8DC] shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
            >
              <Palette className="w-4 h-4 text-[#C0536A]" />
              <span>Discover Custom Creations</span>
            </button>
          </div>

          {/* Quick Highlight Strips */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto text-left">
            <div className="p-3 rounded-2xl bg-white/70 border border-[#F4A6B7]/20 backdrop-blur-xs flex items-center gap-2.5">
              <span className="text-xl">🌸</span>
              <div>
                <span className="text-xs font-bold text-[#3D272A] block leading-tight">Forever Blooms</span>
                <span className="text-[10px] text-[#7A5B62]">Never wilt or wither</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-white/70 border border-[#F4A6B7]/20 backdrop-blur-xs flex items-center gap-2.5">
              <span className="text-xl">🛵</span>
              <div>
                <span className="text-xs font-bold text-[#3D272A] block leading-tight">Vadodara Pickup</span>
                <span className="text-[10px] text-[#7A5B62]">Campus & Local Handover</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-white/70 border border-[#F4A6B7]/20 backdrop-blur-xs flex items-center gap-2.5">
              <span className="text-xl">🎨</span>
              <div>
                <span className="text-xs font-bold text-[#3D272A] block leading-tight">Custom Palettes</span>
                <span className="text-[10px] text-[#7A5B62]">Yarn colors tailored</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-white/70 border border-[#F4A6B7]/20 backdrop-blur-xs flex items-center gap-2.5">
              <span className="text-xl">💬</span>
              <div>
                <span className="text-xs font-bold text-[#3D272A] block leading-tight">Direct WhatsApp</span>
                <span className="text-[10px] text-[#7A5B62]">Chat with the maker</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 2 — KEYCHAIN COLLECTION
         ========================================================================= */}
      <section id="keychains" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#F4A6B7]/25">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFE3E8] text-[#C0536A] text-[11px] font-bold uppercase tracking-wider">
            <span>Everyday Charms</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#3D272A]">
            Tiny Treasures, Big Love
          </h2>
          <p className="font-serif italic text-base sm:text-lg text-[#C0536A]">
            “Little handmade companions to carry everywhere.”
          </p>
        </div>

        {/* Category Filters for Keychains */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {[
            { id: 'all', label: 'All Keychains' },
            { id: 'lily', label: 'Lily & Tulip Bells' },
            { id: 'rose', label: 'Rose Keychains' },
            { id: 'daisy', label: 'Daisy Keychains' },
            { id: 'others', label: 'Other Flower Charms' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setKeychainFilter(cat.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                keychainFilter === cat.id
                  ? 'bg-[#C0536A] text-white shadow-sm'
                  : 'bg-white text-[#7A5B62] border border-[#EBD8DC] hover:border-[#C0536A] hover:text-[#C0536A]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Keychains Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredKeychains.map((product) => {
            const isLiked = isInWishlist(product.id);
            return (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="group relative bg-white rounded-3xl p-3.5 sm:p-4 border border-[#F4A6B7]/30 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer hover:-translate-y-1"
              >
                {/* Product Image & Wishlist Button */}
                <div>
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#FAF8F5] mb-3 border border-[#F4A6B7]/15">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    
                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => handleToggleWishlist(product, e)}
                      aria-label="Save to Wishlist"
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-[#F4A6B7]/40 flex items-center justify-center text-[#7A5B62] hover:text-[#C0536A] transition-transform active:scale-90 shadow-xs"
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#D96B82] text-[#D96B82]' : ''}`} />
                    </button>

                    {/* Handmade Tag */}
                    {product.tags && product.tags[0] && (
                      <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-[9px] font-bold text-[#C0536A] uppercase tracking-wider shadow-xs">
                        {product.tags[0]}
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-1 text-left">
                    <h3 className="font-serif text-sm sm:text-base font-bold text-[#3D272A] group-hover:text-[#C0536A] transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-[11px] text-[#7A5B62] line-clamp-2 leading-relaxed">
                      {product.shortDescription || product.description}
                    </p>
                  </div>
                </div>

                {/* Price and Add to Cart */}
                <div className="pt-3 mt-3 border-t border-[#F4A6B7]/20 flex items-center justify-between">
                  <div>
                    <span className="font-serif text-sm sm:text-base font-bold text-[#3D272A]">
                      {formatPaise(product.price)}
                    </span>
                    {product.compareAtPrice && (
                      <span className="text-[10px] text-[#A4838B] line-through ml-1.5">
                        {formatPaise(product.compareAtPrice)}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleAddToCart(product, e)}
                    className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#FFE3E8] hover:bg-[#C0536A] text-[#C0536A] hover:text-white transition-all text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer active:scale-90"
                    title="Add to Cart"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </section>

      {/* =========================================================================
          SECTION 3 — CROCHET BOUQUETS
         ========================================================================= */}
      <section id="bouquets" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#F4A6B7]/25">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFE3E8] text-[#C0536A] text-[11px] font-bold uppercase tracking-wider">
            <span>Everlasting Floral Art</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#3D272A]">
            Flowers That Last Forever
          </h2>
          <p className="font-serif italic text-base sm:text-lg text-[#C0536A]">
            “Handcrafted blooms for the moments worth remembering.”
          </p>
        </div>

        {/* Category Filters for Bouquets */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {[
            { id: 'all', label: 'All Bouquets' },
            { id: 'lilies', label: 'Lily & Chamomile' },
            { id: 'tulips', label: 'Tulip & Blossom' },
            { id: 'happiness', label: 'Bouquet of Happiness' },
            { id: 'character', label: 'Spidey Edition' },
            { id: 'keepsakes', label: 'I ❤️ U Keepsakes' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setBouquetFilter(cat.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                bouquetFilter === cat.id
                  ? 'bg-[#C0536A] text-white shadow-sm'
                  : 'bg-white text-[#7A5B62] border border-[#EBD8DC] hover:border-[#C0536A] hover:text-[#C0536A]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Bouquets Editorial Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {filteredBouquets.map((bouquet) => {
            const isLiked = isInWishlist(bouquet.id);
            return (
              <div
                key={bouquet.id}
                onClick={() => onSelectProduct(bouquet)}
                className="group relative bg-white rounded-3xl p-4 border border-[#F4A6B7]/35 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between cursor-pointer hover:-translate-y-1"
              >
                <div>
                  {/* Large High-Res Bouquet Photography */}
                  <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden bg-[#FAF8F5] mb-4 border border-[#F4A6B7]/20 shadow-inner">
                    <img
                      src={bouquet.images[0]}
                      alt={bouquet.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                    
                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => handleToggleWishlist(bouquet, e)}
                      aria-label="Save to Wishlist"
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm border border-[#F4A6B7]/40 flex items-center justify-center text-[#7A5B62] hover:text-[#C0536A] transition-transform active:scale-90 shadow-sm"
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#D96B82] text-[#D96B82]' : ''}`} />
                    </button>

                    {/* Stems Badge */}
                    {bouquet.stemsCount && (
                      <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-medium text-white shadow-xs">
                        🌸 {bouquet.stemsCount}
                      </span>
                    )}
                  </div>

                  {/* Bouquet Details */}
                  <div className="space-y-1.5 text-left">
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-[#3D272A] group-hover:text-[#C0536A] transition-colors">
                      {bouquet.name}
                    </h3>
                    <p className="text-xs text-[#7A5B62] line-clamp-2 leading-relaxed font-light">
                      {bouquet.description}
                    </p>
                  </div>
                </div>

                {/* Price and Cart */}
                <div className="pt-4 mt-4 border-t border-[#F4A6B7]/20 flex items-center justify-between">
                  <div>
                    <span className="font-serif text-lg font-bold text-[#3D272A]">
                      {formatPaise(bouquet.price)}
                    </span>
                    {bouquet.compareAtPrice && (
                      <span className="text-xs text-[#A4838B] line-through ml-2">
                        {formatPaise(bouquet.compareAtPrice)}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleAddToCart(bouquet, e)}
                    className="px-4 py-2 rounded-xl bg-[#C0536A] hover:bg-[#A83D53] text-white transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </section>

      {/* =========================================================================
          SECTION 4 — OTHER CROCHET CREATIONS
         ========================================================================= */}
      <section id="other-creations" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#F4A6B7]/25">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFE3E8] text-[#C0536A] text-[11px] font-bold uppercase tracking-wider">
            <span>Special Accents & Companions</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#3D272A]">
            More Little Things to Love
          </h2>
          <p className="font-serif italic text-base sm:text-lg text-[#C0536A]">
            “Delightful handmade accessories, cute charms, and amigurumi companions.”
          </p>
        </div>

        {/* Other Creations Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {otherCreations.map((product) => {
            const isLiked = isInWishlist(product.id);
            return (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="group relative bg-white rounded-3xl p-4 sm:p-5 border border-[#F4A6B7]/30 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between cursor-pointer hover:-translate-y-1.5 text-left"
              >
                <div>
                  <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden bg-[#FAF8F5] mb-4 border border-[#F4A6B7]/20 shadow-inner">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <button
                      onClick={(e) => handleToggleWishlist(product, e)}
                      aria-label="Save to Wishlist"
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#7A5B62] hover:text-[#C0536A] shadow-sm transition-transform active:scale-90"
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#D96B82] text-[#D96B82]' : ''}`} />
                    </button>
                    {product.tags && product.tags.length > 0 && (
                      <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-medium text-white shadow-xs">
                        ✨ {product.tags[0]}
                      </span>
                    )}
                  </div>
                  <h4 className="font-serif text-lg sm:text-xl font-bold text-[#3D272A] line-clamp-1 group-hover:text-[#C0536A] transition-colors">
                    {product.name}
                  </h4>
                  <p className="text-xs text-[#7A5B62] line-clamp-2 mt-1.5 font-light leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="pt-3 mt-4 border-t border-[#F4A6B7]/20 flex items-center justify-between">
                  <div>
                    <span className="font-serif text-lg font-bold text-[#3D272A]">
                      {formatPaise(product.price)}
                    </span>
                    {product.compareAtPrice && (
                      <span className="text-xs text-[#A4838B] line-through ml-2">
                        {formatPaise(product.compareAtPrice)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleAddToCart(product, e)}
                    className="px-4 py-2 rounded-xl bg-[#C0536A] hover:bg-[#A83D53] text-white transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </section>

      {/* =========================================================================
          SECTION 5 — CUSTOM CREATIONS
         ========================================================================= */}
      <section 
        id="custom-creations" 
        className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#F4A6B7]/25"
      >
        <div className="bg-gradient-to-br from-[#FFFDFB] via-[#FFF0F3]/60 to-[#FFE3E8]/40 rounded-3xl p-6 sm:p-10 lg:p-12 border border-[#F4A6B7]/35 shadow-xl space-y-10">
          
          {/* Main Custom Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFE3E8] text-[#C0536A] text-xs font-bold uppercase tracking-wider border border-[#F4A6B7]/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bespoke Maker Atelier</span>
            </div>
            
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#3D272A]">
              Dream It. We'll Crochet It.
            </h2>
            
            <p className="text-xs sm:text-sm md:text-base text-[#7A5B62] leading-relaxed">
              Have a special color combination, a favorite flower, or a unique idea in mind? Explore our personalized creations and talk directly with the maker about bringing your idea to life.
            </p>
          </div>

          {/* Previous Custom Creations Showcase Collage - 3 items covering the full width */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {CUSTOMIZED_ITEMS.slice(0, 3).map((item) => (
              <div 
                key={item.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-[#F4A6B7]/30 shadow-md hover:shadow-2xl transition-all duration-300 space-y-4 flex flex-col justify-between hover:-translate-y-1.5"
              >
                <div>
                  <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden bg-[#FAF8F5] border border-[#F4A6B7]/20 shadow-inner mb-4">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-semibold text-white">
                      {item.badge}
                    </span>
                    <span className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-bold text-[#3D272A] shadow-sm">
                      ₹{item.price}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-serif text-lg sm:text-xl font-bold text-[#3D272A]">
                      {item.title}
                    </h4>
                    <p className="text-xs text-[#7A5B62] line-clamp-2 mt-1 leading-relaxed font-light">
                      {item.description}
                    </p>
                    {item.clientNote && (
                      <p className="text-xs text-[#C0536A] italic mt-2 font-serif line-clamp-2">
                        {item.clientNote}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#F4A6B7]/20 flex items-center justify-between">
                  <span className="font-serif font-bold text-lg text-[#3D272A]">
                    ₹{item.price}
                  </span>
                  <a
                    href={buildWhatsAppLink(`🌸 Hi BloomCraft! I'd like to order "${item.title}" (₹${item.price}). Could you please share available color palettes and turnaround? ✨`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Inquire</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
            
            {/* Primary WhatsApp Direct Button */}
            <a
              href={customWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#25D366]/25 hover:shadow-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>Discuss Your Idea on WhatsApp</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <button
              onClick={() => {
                showToast('Custom Palette Idea', 'Share your favorite color themes directly on WhatsApp with Vidhi!', 'info');
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white hover:bg-[#FFE3E8] text-[#3D272A] text-xs font-bold border border-[#EBD8DC] shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Palette className="w-4 h-4 text-[#C0536A]" />
              <span>Customize Your Own</span>
            </button>
          </div>

          {/* Reassuring Maker Note */}
          <div className="pt-2 text-center text-xs text-[#7A5B62] flex items-center justify-center gap-2">
            <span>🌸 Direct consultation with Maker Vidhi</span>
            <span>•</span>
            <span>No extra custom charge on standard color tweaks</span>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 6 — FOOTER
         ========================================================================= */}
      <footer className="bg-[#FFFDFB] border-t border-[#F4A6B7]/30 pt-12 pb-10 mt-16 transition-colors relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[#F4A6B7]/20">
            
            {/* Col 1: Brand & Tagline */}
            <div className="md:col-span-5 space-y-3 text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#FFE3E8] border border-[#F4A6B7]/40 flex items-center justify-center text-base shadow-xs">
                  🌸
                </div>
                <span className="font-serif text-2xl font-bold tracking-wider text-[#3D272A]">
                  {siteConfig.name}
                </span>
              </div>

              <p className="font-serif italic text-sm text-[#C0536A]">
                “{siteConfig.tagline}”
              </p>

              <p className="text-xs text-[#7A5B62] leading-relaxed max-w-sm font-light">
                Heirloom-quality crochet flowers, bespoke gifts & everlasting bouquets handcrafted slowly with love in Vadodara, Gujarat.
              </p>

              {/* Social & Contact */}
              <div className="pt-2 flex items-center gap-3">
                <a
                  href={customWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-[#25D366]/15 hover:bg-[#25D366] text-[#128C7E] hover:text-white flex items-center justify-center transition-all shadow-xs"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                </a>
                <a
                  href={siteConfig.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-[#FFE3E8] hover:bg-[#D96B82] text-[#C0536A] hover:text-white flex items-center justify-center transition-all shadow-xs"
                  aria-label="Instagram"
                >
                  <span className="text-xs font-bold">IG</span>
                </a>
              </div>
            </div>

            {/* Col 2: Navigation Anchors */}
            <div className="md:col-span-3 space-y-2.5 text-left">
              <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#3D272A]">
                Collections
              </h4>
              <ul className="space-y-1.5 text-xs text-[#5C3E45]">
                <li>
                  <button onClick={() => scrollToSection('keychains')} className="hover:text-[#C0536A] transition-colors">
                    Tiny Treasures (Keychains)
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('bouquets')} className="hover:text-[#C0536A] transition-colors">
                    Flowers That Last Forever (Bouquets)
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('other-creations')} className="hover:text-[#C0536A] transition-colors">
                    More Little Things (Accessories)
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('custom-creations')} className="hover:text-[#C0536A] transition-colors">
                    Dream It. We'll Crochet It.
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Customer Care & Policies */}
            <div className="md:col-span-4 space-y-2.5 text-left">
              <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#3D272A]">
                Customer Support
              </h4>
              <ul className="space-y-1.5 text-xs text-[#5C3E45]">
                {onNavigateOrderHistory && (
                  <li>
                    <button onClick={onNavigateOrderHistory} className="hover:text-[#C0536A] transition-colors">
                      My Orders & Receipts
                    </button>
                  </li>
                )}
                {onNavigateTrackOrder && (
                  <li>
                    <button onClick={onNavigateTrackOrder} className="hover:text-[#C0536A] transition-colors">
                      Track Live Delivery
                    </button>
                  </li>
                )}
                {onNavigatePolicies && (
                  <li>
                    <button onClick={onNavigatePolicies} className="hover:text-[#C0536A] transition-colors">
                      Vadodara Pickup & Shipping Policies
                    </button>
                  </li>
                )}
              </ul>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#A4838B]">
            <p>
              Handcrafted with love, made to bloom. © {new Date().getFullYear()} {siteConfig.name}.
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-[#C0536A] transition-colors text-[11px]"
            >
              Back to Top ↑
            </button>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default CustomerDashboard;
