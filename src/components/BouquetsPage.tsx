import React from 'react';
import { Heart, ShoppingBag, Gift, Check, Eye } from 'lucide-react';
import { BOUQUETS_DATA, type Product } from '../data/products';
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

  return (
    <div className="py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFE3E8] border border-[#F4A6B7]/40 text-[#C0536A] text-xs font-semibold mb-3 shadow-sm">
            <span>💐</span>
            <span>Forever Floral Keepsakes</span>
          </div>

          {/* Heading as requested */}
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3D272A] tracking-tight">
            Flowers That Never Fade.
          </h1>

          <p className="text-sm sm:text-base text-[#7A5B62] mt-3 max-w-2xl mx-auto leading-relaxed">
            Unlike fresh flowers that wilt in days, our handcrafted crochet bouquets stay fresh, vibrant, and cherished forever. Finished with luxury Korean wrapping paper and satin ribbons.
          </p>

          {/* Feature highlights bar */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-[#5C3E45]">
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-rose-100 shadow-sm">
              <Check className="w-3.5 h-3.5 text-[#D96B82]" />
              Zero Maintenance Required
            </span>
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-rose-100 shadow-sm">
              <Check className="w-3.5 h-3.5 text-[#D96B82]" />
              100% Hypoallergenic & Dust-Resistant
            </span>
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-rose-100 shadow-sm">
              <Gift className="w-3.5 h-3.5 text-[#D96B82]" />
              Free Handwritten Greeting Card Included
            </span>
          </div>
        </div>

        {/* Bouquets Grid (4 sample products as requested) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {BOUQUETS_DATA.map((product) => {
            const isLiked = isInWishlist(product.id);

            return (
              <div
                key={product.id}
                className="group bg-white rounded-3xl overflow-hidden border border-[#F4A6B7]/30 crochet-shadow crochet-card-hover flex flex-col sm:flex-row transition-all"
              >
                {/* Image Section */}
                <div className="sm:w-1/2 relative bg-[#FFF0F3] min-h-[260px] sm:min-h-full">
                  <img
                    src={product.image}
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
                          className="px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-full text-[10px] font-bold text-[#C0536A] shadow-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Wishlist Button */}
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
                </div>

                {/* Content Section */}
                <div className="sm:w-1/2 p-6 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] font-semibold text-[#A4838B] uppercase tracking-wider">
                      Everlasting Bouquet
                    </div>
                    
                    <h3
                      onClick={() => onSelectProduct(product)}
                      className="font-serif text-xl sm:text-2xl font-bold text-[#3D272A] mt-1 group-hover:text-[#C0536A] transition-colors cursor-pointer"
                    >
                      {product.name}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#7A5B62] mt-2 leading-relaxed">
                      {product.description}
                    </p>

                    {/* Stems & Details */}
                    {product.stemsCount && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-[#5C3E45] font-medium bg-[#FFF0F3] px-3 py-1.5 rounded-xl">
                        <span>🌸</span>
                        <span>{product.stemsCount}</span>
                      </div>
                    )}
                  </div>

                  {/* Pricing and Add to Cart */}
                  <div className="mt-6 pt-4 border-t border-rose-100">
                    <div className="flex items-baseline justify-between mb-3">
                      <div>
                        <span className="text-xs text-[#7A5B62]">Price: </span>
                        <span className="text-2xl font-bold text-[#C0536A]">
                          ₹{product.price}
                        </span>
                        {product.originalPrice && (
                          <span className="text-xs line-through text-[#A4838B] ml-2">
                            ₹{product.originalPrice}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#25D366] font-semibold">
                        Ready to Ship
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => addToCart(product, 1)}
                        className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#D96B82] to-[#C0536A] hover:from-[#c95d73] hover:to-[#ae465c] text-white rounded-full text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </button>

                      <button
                        onClick={() => onSelectProduct(product)}
                        className="p-2.5 rounded-full border border-rose-200 text-[#5C3E45] hover:bg-[#FFE3E8] transition-colors"
                        title="Quick View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Bouquet CTA */}
        <div className="mt-16 bg-gradient-to-r from-[#FFF0F3] via-[#FFE3E8] to-[#FFF0F3] rounded-3xl p-8 sm:p-10 border border-[#F4A6B7]/40 text-center max-w-3xl mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#FFE3E8] flex items-center justify-center text-xl mx-auto mb-3">
            ✨
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D272A]">
            Need a Custom Mix of Flowers?
          </h3>
          <p className="text-sm text-[#7A5B62] mt-2 max-w-lg mx-auto">
            Choose your favourite flower varieties (Roses, Tulips, Sunflowers, Daisies, Peonies, Carnations) and customize ribbon colors & personalized messages.
          </p>
          <button
            onClick={onNavigateCustomize}
            className="mt-6 px-8 py-3 rounded-full bg-[#D96B82] hover:bg-[#C0536A] text-white font-semibold text-xs tracking-wide shadow-md transition-all hover:scale-105"
          >
            Design Your Dream Bouquet
          </button>
        </div>

      </div>
    </div>
  );
};
