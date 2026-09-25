import React, { useEffect, useState } from 'react';
import { Heart, ShoppingBag, Gift, Check, Eye, ArrowRight } from 'lucide-react';
import type { Product } from '../types';
import { productService } from '../services/productService';
import { formatPaise } from '../utils/currency';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

interface BouquetsPageProps {
  onSelectProduct: (product: Product) => void;
  onNavigateCustomize: () => void;
}

export const BouquetsPage: React.FC<BouquetsPageProps> = ({
  onSelectProduct,
  onNavigateCustomize,
}) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [bouquets, setBouquets] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    productService.getAll({ category: 'bouquet' }).then((data) => {
      setBouquets(data);
      setIsLoading(false);
    });
  }, []);

  return (
    <div className="py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFE3E8] border border-[#F4A6B7]/40 text-[#C0536A] text-xs font-semibold mb-3 shadow-xs">
            <span>💐</span>
            <span>Forever Floral Keepsakes</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3D272A] tracking-tight">
            Flowers That Never Fade 🌸
          </h1>

          <p className="text-sm sm:text-base text-[#7A5B62] mt-3 max-w-2xl mx-auto leading-relaxed">
            Unlike fresh flowers that wilt in days, our handcrafted crochet bouquets stay fresh, vibrant, and cherished forever. Finished with luxury Korean wrapping paper and satin ribbons.
          </p>

          {/* Feature highlights bar */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-[#5C3E45]">
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-rose-100 shadow-xs">
              <Check className="w-3.5 h-3.5 text-[#D96B82]" />
              Zero Maintenance Required
            </span>
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-rose-100 shadow-xs">
              <Check className="w-3.5 h-3.5 text-[#D96B82]" />
              100% Hypoallergenic Milk Cotton
            </span>
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-rose-100 shadow-xs">
              <Gift className="w-3.5 h-3.5 text-[#D96B82]" />
              Free Handwritten Greeting Card Included
            </span>
          </div>
        </div>

        {/* Bouquets Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-12">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-3xl p-6 border border-[#F0E6E8] animate-pulse space-y-4">
                <div className="h-56 bg-[#FFE3E8]/40 rounded-2xl" />
                <div className="h-5 bg-[#FFE3E8]/50 rounded w-2/3" />
                <div className="h-4 bg-[#FFE3E8]/30 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {bouquets.map((product) => {
              const isLiked = isInWishlist(product.id);

              return (
                <div
                  key={product.id}
                  className="group bg-white rounded-3xl overflow-hidden border border-[#F4A6B7]/30 crochet-shadow crochet-card-hover flex flex-col sm:flex-row transition-all"
                >
                  {/* Image Section */}
                  <div className="sm:w-1/2 relative bg-[#FFF0F3] min-h-[260px] sm:min-h-full">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                      onClick={() => onSelectProduct(product)}
                      loading="lazy"
                    />

                    {/* Badges */}
                    {product.tags && (
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                        {product.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-1 bg-white/95 backdrop-blur-xs rounded-full text-[10px] font-bold text-[#C0536A] shadow-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Wishlist Button */}
                    <button
                      onClick={() => toggleWishlist(product)}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#5C3E45] flex items-center justify-center shadow-md transition-all cursor-pointer"
                      aria-label="Save to wishlist"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isLiked ? 'fill-[#D96B82] text-[#D96B82]' : 'text-[#7A5B62]'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Content Section */}
                  <div className="sm:w-1/2 p-6 sm:p-7 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase tracking-widest text-[#D96B82] font-bold">
                          Handcrafted Bouquet
                        </span>
                        {product.stemsCount && (
                          <span className="text-[10px] bg-[#FFE3E8]/80 text-[#C0536A] px-2 py-0.5 rounded-full font-medium">
                            {product.stemsCount}
                          </span>
                        )}
                      </div>

                      <h3
                        onClick={() => onSelectProduct(product)}
                        className="font-serif text-xl font-bold text-[#3D272A] hover:text-[#D96B82] transition-colors cursor-pointer"
                      >
                        {product.name}
                      </h3>

                      <p className="text-xs text-[#7A5B62] mt-2 leading-relaxed line-clamp-3">
                        {product.description}
                      </p>

                      {/* Dimensions / Lead Time */}
                      <div className="mt-4 pt-3 border-t border-[#F5EDEF] flex flex-wrap gap-3 text-[11px] text-[#5C3E45]">
                        {product.dimensions && (
                          <span>📏 {product.dimensions}</span>
                        )}
                        <span>⏳ ~{product.makingTimeDays} days crafting</span>
                      </div>
                    </div>

                    {/* Price and CTA */}
                    <div className="mt-6 pt-4 border-t border-[#F5EDEF] flex items-center justify-between">
                      <div>
                        <span className="block text-[10px] text-[#A38B90] uppercase font-semibold">Special Offer</span>
                        <div className="flex items-baseline gap-2">
                          <span className="font-serif text-2xl font-bold text-[#3D272A]">
                            {formatPaise(product.price)}
                          </span>
                          {product.compareAtPrice && (
                            <span className="text-xs text-[#A38B90] line-through">
                              {formatPaise(product.compareAtPrice)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectProduct(product)}
                          className="p-2.5 rounded-full bg-[#FAF8F5] border border-[#EBD8DC] text-[#3D272A] hover:bg-[#FFE3E8] transition-all"
                          title="View Bouquet Details"
                        >
                          <Eye className="w-4 h-4 text-[#D96B82]" />
                        </button>
                        <button
                          onClick={() => addToCart(product, 1)}
                          className="px-4 py-2.5 rounded-full bg-[#D96B82] text-white text-xs font-semibold hover:bg-[#C0536A] shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Custom Bouquet CTA Banner */}
        <div className="mt-16 bg-gradient-to-r from-[#FFE3E8] via-[#FFF0F3] to-[#FAF8F5] rounded-3xl p-8 sm:p-12 border border-[#F4A6B7]/40 text-center relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-3 relative z-10">
            <span className="text-xs uppercase tracking-widest font-bold text-[#C0536A]">
              Bespoke Stem Arrangements
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D272A]">
              Want a Custom Flower Combination? 🌸
            </h2>
            <p className="text-xs sm:text-sm text-[#7A5B62] leading-relaxed">
              Mix and match your favorite tulips, roses, lavender sprigs, and sunflowers with personalized color ribbons and kraft wrap.
            </p>
            <div className="pt-3">
              <button
                onClick={onNavigateCustomize}
                className="px-7 py-3 rounded-full bg-[#3D272A] text-white text-xs sm:text-sm font-semibold shadow-md hover:bg-[#2A1A1C] transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Request Custom Bouquet Quote</span>
                <ArrowRight className="w-4 h-4 text-[#FFE3E8]" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
