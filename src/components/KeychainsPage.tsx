import React, { useState } from 'react';
import { Heart, ShoppingBag, Eye, Sparkles } from 'lucide-react';
import { KEYCHAINS_DATA, type Product } from '../data/products';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

interface KeychainsPageProps {
  onSelectProduct: (product: Product) => void;
}

export const KeychainsPage: React.FC<KeychainsPageProps> = ({ onSelectProduct }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [filter, setFilter] = useState<'all' | 'popular' | 'flowers' | 'animals'>('all');

  const filteredProducts = KEYCHAINS_DATA.filter((item) => {
    if (filter === 'popular') return item.tags?.includes('Bestseller') || item.tags?.includes('Most Loved');
    if (filter === 'flowers') return item.name.includes('Rose') || item.name.includes('Daisy') || item.name.includes('Lavender') || item.name.includes('Sunflower');
    if (filter === 'animals') return item.name.includes('Bear');
    return true;
  });

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

          {/* Filter Pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'all', label: 'All Keychains' },
              { id: 'popular', label: '🌸 Bestsellers' },
              { id: 'flowers', label: '💐 Floral Charms' },
              { id: 'animals', label: '🧸 Cute Amigurumi' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-4 py-2 text-xs font-semibold rounded-full transition-all ${
                  filter === tab.id
                    ? 'bg-[#D96B82] text-white shadow-sm'
                    : 'bg-white text-[#5C3E45] border border-rose-200/80 hover:bg-rose-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid (6 sample products) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredProducts.map((product) => {
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
                        <span className="px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-full text-[10px] font-bold text-[#C0536A] shadow-sm">
                          {product.tags[0]}
                        </span>
                      </div>
                    )}

                    {/* ❤️ Wishlist Icon Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product);
                      }}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#5C3E45] flex items-center justify-center shadow-md transition-all hover:scale-110 active:scale-90"
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
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 px-3.5 py-1.5 bg-white/95 backdrop-blur-md text-[#3D272A] hover:text-[#C0536A] text-xs font-semibold rounded-full shadow-md flex items-center gap-1.5"
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
                      className="font-serif text-lg sm:text-xl font-bold text-[#3D272A] group-hover:text-[#C0536A] transition-colors cursor-pointer"
                    >
                      {product.name}
                    </h3>
                    <p className="text-xs text-[#7A5B62] line-clamp-2 mt-1">
                      {product.description}
                    </p>
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
                    className="px-4 py-2 bg-[#FFE3E8] hover:bg-[#D96B82] text-[#C0536A] hover:text-white rounded-full text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 hover:scale-105 active:scale-95"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Keychain Callout */}
        <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-white border border-[#F4A6B7]/30 text-center max-w-xl mx-auto shadow-sm">
          <Sparkles className="w-6 h-6 text-[#D96B82] mx-auto mb-2" />
          <h4 className="font-serif text-xl font-bold text-[#3D272A]">
            Want a keychain in your favourite colors?
          </h4>
          <p className="text-xs sm:text-sm text-[#7A5B62] mt-1 mb-4">
            We customize character keychains, name initials, and matching couple charms.
          </p>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('nav-to', { detail: 'customize' }));
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#FFE3E8] text-[#C0536A] hover:bg-[#D96B82] hover:text-white text-xs font-semibold transition-all"
          >
            <span>Request Custom Keychain</span>
          </button>
        </div>

      </div>
    </div>
  );
};
