import React from 'react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPaise } from '../utils/currency';
import type { Product } from '../types';
import { 
  Heart, 
  Trash2, 
  ShoppingBag, 
  Plus
} from 'lucide-react';

interface WishlistPageProps {
  onSelectProduct: (product: Product) => void;
  onShopNow: () => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({
  onSelectProduct,
  onShopNow,
}) => {
  const { wishlistProducts, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const handleMoveToCart = (product: Product) => {
    addToCart(product, 1);
    removeFromWishlist(product.id);
  };

  const handleMoveAllToCart = () => {
    if (wishlistProducts.length === 0) return;
    wishlistProducts.forEach((p) => addToCart(p, 1));
    wishlistProducts.forEach((p) => removeFromWishlist(p.id));
    showToast('Moved All to Cart! 🌸', `${wishlistProducts.length} items added to your basket`, 'cart');
  };

  if (wishlistProducts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-full bg-[#FFE3E8] flex items-center justify-center text-[#D96B82]">
          <Heart className="w-10 h-10" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#3D272A]">Your Wishlist is Empty</h2>
        <p className="text-sm text-[#7A5B62] max-w-sm mx-auto">
          Save your favorite handmade tulip bells, daisies, and bouquets here to order later!
        </p>
        <button
          onClick={onShopNow}
          className="px-8 py-3.5 rounded-full bg-[#D96B82] text-white font-medium hover:bg-[#C0536A] shadow-md transition-all inline-flex items-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" /> Explore Collection 🌸
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#F0E6E8]">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#D96B82]">Your Saved Blooms</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#3D272A]">
            My Wishlist ({wishlistProducts.length})
          </h1>
        </div>

        <button
          onClick={handleMoveAllToCart}
          className="px-5 py-2.5 rounded-full bg-[#3D272A] text-white text-xs font-bold hover:bg-[#2A1A1C] shadow-sm transition-all flex items-center gap-2"
        >
          <ShoppingBag className="w-4 h-4 text-[#FFE3E8]" /> Move All to Cart
        </button>
      </div>

      {/* Grid of Wishlist Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {wishlistProducts.map((product) => (
          <div
            key={product.id}
            className="group bg-white rounded-2xl overflow-hidden border border-[#F0E6E8] shadow-sm hover:shadow-md transition-all flex flex-col"
          >
            {/* Image */}
            <div className="relative aspect-square overflow-hidden bg-[#FFE3E8]/30">
              <img
                src={product.images[0]}
                alt={product.name}
                loading="lazy"
                onClick={() => onSelectProduct(product)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
              />

              <button
                onClick={() => removeFromWishlist(product.id)}
                className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm text-red-500 flex items-center justify-center hover:bg-white transition-all shadow-sm"
                title="Remove from Wishlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Info */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] font-bold text-[#D96B82] uppercase tracking-wider block">
                  {product.category}
                </span>
                <h3
                  onClick={() => onSelectProduct(product)}
                  className="font-semibold text-xs sm:text-sm text-[#3D272A] line-clamp-2 mt-0.5 hover:text-[#D96B82] cursor-pointer"
                >
                  {product.name}
                </h3>
              </div>

              <div className="pt-2 border-t border-[#F5EDEF] flex items-center justify-between">
                <span className="font-serif font-bold text-sm sm:text-base text-[#3D272A]">
                  {formatPaise(product.price)}
                </span>
                <button
                  onClick={() => handleMoveToCart(product)}
                  className="px-3 py-1.5 rounded-full bg-[#D96B82] text-white text-[11px] font-bold hover:bg-[#C0536A] transition-all flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
