import React, { useState, useEffect } from 'react';
import { Heart, ShoppingBag, Eye, Sparkles, Search } from 'lucide-react';
import type { Product } from '../types';
import { productService } from '../services/productService';
import { formatPaise } from '../utils/currency';
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

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'price_asc' | 'price_desc'>('popular');
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    productService
      .getAll({
        category: 'keychain',
        keychainType: activeSection !== 'all' ? activeSection : undefined,
        search: searchQuery || undefined,
        inStockOnly,
        sortBy,
      })
      .then((data) => {
        setProducts(data);
        setIsLoading(false);
      });
  }, [activeSection, searchQuery, sortBy, inStockOnly]);

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
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
              onClick={() => onSelectProduct(product)}
              loading="lazy"
            />

            {/* Badges */}
            {product.tags && product.tags.length > 0 && (
              <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                {product.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-white/95 backdrop-blur-xs rounded-full text-[10px] font-bold text-[#C0536A] shadow-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Wishlist Button */}
            <button
              onClick={() => toggleWishlist(product)}
              className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#5C3E45] flex items-center justify-center shadow-md transition-all cursor-pointer"
              aria-label="Save to Wishlist"
            >
              <Heart
                className={`w-4 h-4 ${
                  isLiked ? 'fill-[#D96B82] text-[#D96B82]' : 'text-[#7A5B62]'
                }`}
              />
            </button>

            {/* Quick view button on hover */}
            <button
              onClick={() => onSelectProduct(product)}
              className="absolute bottom-2.5 left-2.5 right-2.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-xs text-[#3D272A] text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              <Eye className="w-3.5 h-3.5 text-[#D96B82]" />
              Quick View
            </button>
          </div>

          {/* Product Info */}
          <div>
            <span className="text-[10px] font-bold text-[#C0536A] uppercase tracking-wider block">
              {product.keychainType ? `${product.keychainType} bloom` : 'Crochet Charm'}
            </span>
            <h3
              onClick={() => onSelectProduct(product)}
              className="font-serif text-sm sm:text-base font-bold text-[#3D272A] line-clamp-1 mt-0.5 hover:text-[#D96B82] cursor-pointer"
            >
              {product.name}
            </h3>
            <p className="text-xs text-[#7A5B62] line-clamp-2 mt-1 leading-relaxed">
              {product.description}
            </p>
          </div>
        </div>

        {/* Footer with Price and Add to Cart */}
        <div className="pt-4 mt-3 border-t border-[#F5EDEF] flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-base sm:text-lg font-bold text-[#3D272A]">
                {formatPaise(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-xs text-[#A38B90] line-through">
                  {formatPaise(product.compareAtPrice)}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => addToCart(product, 1)}
            disabled={product.availability === 'out_of_stock'}
            className="px-3.5 py-2 rounded-full bg-[#D96B82] text-white text-xs font-semibold hover:bg-[#C0536A] shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFE3E8] border border-[#F4A6B7]/40 text-[#C0536A] text-xs font-semibold mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Handmade in Vadodara • 100% Milk Cotton</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3D272A] tracking-tight">
            Handcrafted Keychain Blooms 🌸
          </h1>

          <p className="text-sm sm:text-base text-[#7A5B62] mt-3 max-w-xl mx-auto leading-relaxed">
            Pocket-sized everlasting floral charms and adorable amigurumi creations to accompany your keys, bags, and everyday moments.
          </p>
        </div>

        {/* Section Tabs / Flower categories */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-6">
          <button
            onClick={() => setActiveSection('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeSection === 'all'
                ? 'bg-[#3D272A] text-white shadow-md'
                : 'bg-white text-[#7A5B62] border border-[#EBD8DC] hover:border-[#D96B82]'
            }`}
          >
            ✨ All Charms
          </button>
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeSection === sec.id
                  ? 'bg-[#D96B82] text-white shadow-md'
                  : 'bg-white text-[#7A5B62] border border-[#EBD8DC] hover:border-[#D96B82]'
              }`}
            >
              {sec.emoji} {sec.title}
            </button>
          ))}
        </div>

        {/* Search, Filter & Sort Controls */}
        <div className="bg-white p-4 rounded-2xl border border-[#F0E6E8] shadow-xs mb-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#A38B90] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by flower or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#EBD8DC] bg-[#FAF8F5] focus:outline-none focus:border-[#D96B82]"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <label className="flex items-center gap-1.5 text-xs text-[#7A5B62] cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-[#D96B82]"
              />
              <span>In Stock</span>
            </label>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-xl border border-[#EBD8DC] bg-[#FAF8F5] text-[#3D272A] focus:outline-none focus:border-[#D96B82]"
            >
              <option value="popular">Popular / Bestsellers</option>
              <option value="newest">Newest Additions</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 py-12">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-3xl p-4 border border-[#F0E6E8] animate-pulse space-y-3">
                <div className="aspect-square bg-[#FFE3E8]/40 rounded-2xl" />
                <div className="h-4 bg-[#FFE3E8]/50 rounded w-3/4" />
                <div className="h-3 bg-[#FFE3E8]/30 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#F0E6E8] p-8">
            <span className="text-3xl">🌸</span>
            <h3 className="font-serif font-bold text-lg text-[#3D272A] mt-2">No creations matched your search</h3>
            <p className="text-xs text-[#7A5B62] mt-1">Try searching for tulips, daisies, sunflowers, or resetting filters.</p>
            <button
              onClick={() => {
                setActiveSection('all');
                setSearchQuery('');
                setInStockOnly(false);
              }}
              className="mt-4 px-5 py-2 rounded-full bg-[#D96B82] text-white text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p) => renderProductCard(p))}
          </div>
        )}

      </div>
    </div>
  );
};
