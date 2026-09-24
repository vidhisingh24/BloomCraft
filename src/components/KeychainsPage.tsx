import React, { useState } from 'react';
import { Heart, ShoppingBag, Eye, Sparkles, ArrowRight } from 'lucide-react';
import { KEYCHAINS_DATA, type Product } from '../data/products';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

interface KeychainsPageProps {
  onSelectProduct: (product: Product) => void;
}

type SectionKey = 'all' | 'tulip' | 'daisy' | 'rose' | 'others';

interface SectionConfig {
  id: 'tulip' | 'daisy' | 'rose' | 'others';
  title: string;
  emoji: string;
  badge: string;
  description: string;
  tagline: string;
}

const SECTIONS: SectionConfig[] = [
  {
    id: 'tulip',
    title: 'Tulip Collection',
    emoji: '🌷',
    badge: 'Everlasting Bells',
    description: 'Bell-shaped silky crochet tulips with tender leaf accents, crafted in dreamy pastel tones.',
    tagline: 'Spring bloom that never fades',
  },
  {
    id: 'daisy',
    title: 'Daisy Collection',
    emoji: '🌼',
    badge: 'Cottagecore Blooms',
    description: 'Sunny chamomile & cheerful cottagecore daisies with textured yellow centers.',
    tagline: 'Bright cheer for your bags & keys',
  },
  {
    id: 'rose',
    title: 'Rose Collection',
    emoji: '🌹',
    badge: 'Heirloom Romance',
    description: 'Miniature rosebuds and layered velvet spiral roses symbolizing timeless handmade love.',
    tagline: 'Delicate everlasting tokens of love',
  },
  {
    id: 'others',
    title: 'Fruits, Animals & Others',
    emoji: '✨',
    badge: 'Cute Amigurumi',
    description: 'Plump strawberries, snuggly teddy bears, golden sunflowers, and baby sea turtles.',
    tagline: 'Pocket-sized companions full of personality',
  },
];

export const KeychainsPage: React.FC<KeychainsPageProps> = ({ onSelectProduct }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [activeSection, setActiveSection] = useState<SectionKey>('all');

  const getProductsForSection = (sectionId: 'tulip' | 'daisy' | 'rose' | 'others') => {
    return KEYCHAINS_DATA.filter((item) => item.keychainType === sectionId);
  };

  const renderProductCard = (product: Product) => {
    const isLiked = isInWishlist(product.id);

    return (
      <div
        key={product.id}
        className="group bg-white rounded-3xl p-4 sm:p-5 border border-[#F4A6B7]/30 crochet-shadow crochet-card-hover flex flex-col justify-between transition-all"
      >
        <div>
          {/* Image Container with Wishlist + Quick View Badge */}
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#FFF0F3] mb-4">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
              onClick={() => onSelectProduct(product)}
              loading="lazy"
            />

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="absolute top-3 left-3 flex flex-col gap-1">
                <span className="px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-full text-[10px] font-bold text-[#C0536A] shadow-sm border border-rose-100">
                  {product.tags[0]}
                </span>
              </div>
            )}

            {/* Wishlist Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(product);
              }}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#5C3E45] flex items-center justify-center shadow-md transition-all hover:scale-110 active:scale-90 cursor-pointer"
              aria-label="Wishlist"
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  isLiked
                    ? 'fill-[#D96B82] text-[#D96B82]'
                    : 'text-[#7A5B62] hover:text-[#D96B82]'
                }`}
              />
            </button>

            {/* Quick View Button on Hover */}
            <button
              onClick={() => onSelectProduct(product)}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 px-3.5 py-1.5 bg-white/95 backdrop-blur-md text-[#3D272A] hover:text-[#C0536A] text-xs font-semibold rounded-full shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Quick Details</span>
            </button>
          </div>

          {/* Product Details */}
          <div className="space-y-1">
            <div className="text-[11px] font-medium text-[#A4838B] uppercase tracking-wider">
              {product.yarnType?.split(' ')[0]} Milk Cotton
            </div>
            <h3
              onClick={() => onSelectProduct(product)}
              className="font-serif text-lg sm:text-xl font-bold text-[#3D272A] group-hover:text-[#C0536A] transition-colors cursor-pointer leading-snug"
            >
              {product.name}
            </h3>
            <p className="text-xs text-[#7A5B62] line-clamp-2 mt-1 leading-relaxed">
              {product.description}
            </p>

            {/* Color Swatch / Options hint */}
            {product.colors && (
              <div className="pt-1.5 flex flex-wrap gap-1">
                {product.colors.slice(0, 2).map((col, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF8F5] text-[#7A5B62] border border-rose-100"
                  >
                    🌸 {col}
                  </span>
                ))}
                {product.colors.length > 2 && (
                  <span className="text-[10px] text-[#A4838B] self-center">
                    +{product.colors.length - 2} colors
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Price & Add to Cart */}
        <div className="mt-5 pt-3 border-t border-rose-100/70 flex items-center justify-between gap-3">
          <div>
            <span className="text-lg font-bold text-[#C0536A]">
              ₹{product.price}
            </span>
            {product.originalPrice && (
              <span className="text-xs line-through text-[#A4838B] ml-1.5">
                ₹{product.originalPrice}
              </span>
            )}
          </div>

          <button
            onClick={() => addToCart(product, 1)}
            className="px-4 py-2 bg-[#FFE3E8] hover:bg-[#D96B82] text-[#C0536A] hover:text-white rounded-full text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFE3E8] border border-[#F4A6B7]/40 text-[#C0536A] text-xs font-semibold mb-3 shadow-sm">
            <span>🧶</span>
            <span>Pocket-Sized Handmade Cuties</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3D272A] tracking-tight">
            Handcrafted Crochet Keychains
          </h1>
          <p className="text-sm sm:text-base text-[#7A5B62] mt-3 leading-relaxed">
            Carry a touch of handmade warmth everywhere you go. Hand-stitched with durable, ultra-soft milk cotton yarn.
          </p>

          {/* Section Navigation Tabs */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'all', label: 'All Keychains', icon: '🌸' },
              { id: 'tulip', label: 'Tulip Blooms', icon: '🌷' },
              { id: 'daisy', label: 'Daisy Charms', icon: '🌼' },
              { id: 'rose', label: 'Romantic Roses', icon: '🌹' },
              { id: 'others', label: 'Fruits & Animals', icon: '✨' },
            ].map((tab) => {
              const isActive = activeSection === tab.id;
              const count =
                tab.id === 'all'
                  ? KEYCHAINS_DATA.length
                  : getProductsForSection(tab.id as any).length;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveSection(tab.id as SectionKey);
                  }}
                  className={`px-4 py-2 text-xs font-semibold rounded-full transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-[#D96B82] text-white shadow-md scale-105'
                      : 'bg-white text-[#5C3E45] border border-rose-200/80 hover:bg-rose-50 hover:text-[#C0536A]'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-white/25 text-white' : 'bg-rose-100 text-[#C0536A]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section Render Mode */}
        {activeSection === 'all' ? (
          /* ALL SECTIONS IN DISTINCT CURATED BLOCKS */
          <div className="space-y-16">
            {SECTIONS.map((section) => {
              const items = getProductsForSection(section.id);
              if (items.length === 0) return null;

              return (
                <div key={section.id} className="space-y-6">
                  {/* Section Title Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-[#F4A6B7]/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#FFE3E8] border border-[#F4A6B7]/50 flex items-center justify-center text-xl shadow-sm">
                        {section.emoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D272A]">
                            {section.title}
                          </h2>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FFE3E8] text-[#C0536A] font-bold">
                            {items.length} items
                          </span>
                        </div>
                        <p className="text-xs text-[#7A5B62] mt-0.5">{section.description}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActiveSection(section.id);
                        window.scrollTo({ top: 150, behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C0536A] hover:text-[#D96B82] transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <span>Explore {section.title}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Product Grid for this section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                    {items.map(renderProductCard)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* INDIVIDUAL FILTERED SECTION */
          <div>
            {(() => {
              const currentSec = SECTIONS.find((s) => s.id === activeSection);
              const items = getProductsForSection(activeSection);

              return (
                <div className="space-y-6">
                  {/* Filtered Section Header Card */}
                  {currentSec && (
                    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#F4A6B7]/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-[#FFE3E8] border border-[#F4A6B7]/50 flex items-center justify-center text-2xl shadow-sm">
                          {currentSec.emoji}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D272A]">
                              {currentSec.title}
                            </h2>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FFE3E8] text-[#C0536A] font-bold">
                              {items.length} creations
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-[#7A5B62] mt-1">{currentSec.description}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveSection('all')}
                        className="px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-[#3D272A] text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
                      >
                        ← View All Sections
                      </button>
                    </div>
                  )}

                  {/* Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                    {items.map(renderProductCard)}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Custom Keychain Callout */}
        <div className="mt-16 p-6 sm:p-10 rounded-3xl bg-white border border-[#F4A6B7]/30 text-center max-w-2xl mx-auto shadow-sm">
          <div className="w-10 h-10 rounded-full bg-[#FFE3E8] text-[#D96B82] flex items-center justify-center text-lg mx-auto mb-3">
            ✨
          </div>
          <h4 className="font-serif text-xl sm:text-2xl font-bold text-[#3D272A]">
            Want a keychain in your favourite colors or custom initials?
          </h4>
          <p className="text-xs sm:text-sm text-[#7A5B62] mt-2 mb-5 leading-relaxed">
            We customize character keychains, alphabet name charms, and matching couple bells with 100% milk cotton yarn.
          </p>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('nav-to', { detail: 'customize' }));
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#D96B82] hover:bg-[#C0536A] text-white text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Request Custom Keychain</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default KeychainsPage;
