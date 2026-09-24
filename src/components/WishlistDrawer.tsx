import React from 'react';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

export const WishlistDrawer: React.FC = () => {
  const { wishlistProducts, isWishlistOpen, setIsWishlistOpen, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (!isWishlistOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsWishlistOpen(false)}
        className="absolute inset-0 bg-[#3D272A]/40 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-[#FFFDFB] shadow-2xl border-l border-[#F4A6B7]/30 flex flex-col">
          
          {/* Header */}
          <div className="p-4 sm:p-6 bg-gradient-to-r from-[#FFE3E8]/60 to-[#FFF0F3] border-b border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-[#D96B82]">
                <Heart className="w-4 h-4 fill-[#D96B82]" />
              </div>
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-[#3D272A]">Saved Favorites</h2>
                <p className="text-xs text-[#7A5B62]">
                  {wishlistProducts.length} {wishlistProducts.length === 1 ? 'item' : 'items'} saved
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsWishlistOpen(false)}
              className="p-2 rounded-full text-[#5C3E45] hover:bg-white/80 transition-colors cursor-pointer"
              aria-label="Close wishlist"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {wishlistProducts.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#FFE3E8] flex items-center justify-center mx-auto text-2xl">
                  💖
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#3D272A]">
                    No favorites saved yet!
                  </h3>
                  <p className="text-xs text-[#7A5B62] max-w-xs mx-auto mt-1">
                    Click the ❤️ icon on any keychain or bouquet to save it for later.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {wishlistProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex gap-3.5 p-3.5 rounded-2xl bg-white border border-rose-100 shadow-sm items-center"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-16 h-16 rounded-xl object-cover bg-[#FFF0F3] shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif text-sm font-bold text-[#3D272A] truncate">
                        {product.name}
                      </h4>
                      <p className="text-xs font-bold text-[#C0536A] mt-0.5">
                        ₹{product.price}
                      </p>
                      <button
                        onClick={() => {
                          addToCart(product, 1);
                          toggleWishlist(product);
                        }}
                        className="mt-2 text-xs font-semibold text-[#D96B82] hover:text-[#C0536A] flex items-center gap-1"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Move to Cart</span>
                      </button>
                    </div>

                    <button
                      onClick={() => toggleWishlist(product)}
                      className="text-[#A4838B] hover:text-rose-600 transition-colors p-2"
                      title="Remove from favorites"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
