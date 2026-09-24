import React, { useState } from 'react';
import { X, Heart, ShoppingBag, MessageCircle, Sparkles, Check } from 'lucide-react';
import type { Product } from '../data/products';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getWhatsAppUrl } from '../config/siteConfig';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const isLiked = isInWishlist(product.id);
  const currentColor = selectedColor || (product.colors ? product.colors[0] : undefined);

  const handleAddToCart = () => {
    addToCart(product, quantity, currentColor);
    onClose();
  };

  const handleBuyOnWhatsApp = () => {
    const text = `🌸 *BloomCraft Product Inquiry*\n\n` +
      `Hi! I would love to order:\n` +
      `• *Item:* ${product.name}\n` +
      (currentColor ? `• *Color:* ${currentColor}\n` : '') +
      `• *Quantity:* ${quantity}\n` +
      `• *Price:* ₹${product.price * quantity}\n\n` +
      `Could you please let me know when this can be dispatched? 💕`;
    
    window.open(getWhatsAppUrl(text), '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#3D272A]/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-rose-100 overflow-hidden max-h-[90vh] sm:max-h-[92vh] flex flex-col md:flex-row">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-30 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#5C3E45] flex items-center justify-center shadow-md transition-all cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image Showcase */}
        <div className="md:w-1/2 relative bg-[#FFF0F3] h-56 sm:h-72 md:h-auto md:min-h-[400px] shrink-0">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {product.tags && product.tags.length > 0 && (
            <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 flex flex-wrap gap-1.5 z-10">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-full text-[10px] sm:text-[11px] font-bold text-[#C0536A] shadow-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Section */}
        <div className="md:w-1/2 p-5 sm:p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs uppercase tracking-widest text-[#C0536A] font-semibold">
                {product.category === 'keychains' ? '🧶 Crochet Keychain' : '💐 Everlasting Bouquet'}
              </span>
              <button
                onClick={() => toggleWishlist(product)}
                className="p-2 rounded-full hover:bg-[#FFE3E8]/60 transition-colors"
                aria-label="Toggle Wishlist"
              >
                <Heart
                  className={`w-5 h-5 ${
                    isLiked ? 'fill-[#D96B82] text-[#D96B82]' : 'text-[#7A5B62]'
                  }`}
                />
              </button>
            </div>

            <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#3D272A] mt-1">
              {product.name}
            </h2>

            {/* Price */}
            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="text-2xl font-bold text-[#C0536A]">₹{product.price}</span>
              {product.originalPrice && (
                <span className="text-sm line-through text-[#A4838B]">
                  ₹{product.originalPrice}
                </span>
              )}
              <span className="text-[11px] font-semibold text-[#25D366] bg-[#25D366]/10 px-2 py-0.5 rounded-full">
                Handmade Fresh
              </span>
            </div>

            <p className="text-sm text-[#7A5B62] mt-3 leading-relaxed">
              {product.description}
            </p>

            {/* Yarn & Specs */}
            <div className="mt-4 py-3 border-y border-rose-100 text-xs text-[#5C3E45] space-y-1.5">
              {product.yarnType && (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#D96B82]" />
                  <span><strong>Material:</strong> {product.yarnType}</span>
                </div>
              )}
              {product.dimensions && (
                <div className="flex items-center gap-2">
                  <span className="text-xs">📏</span>
                  <span><strong>Size:</strong> {product.dimensions}</span>
                </div>
              )}
              {product.stemsCount && (
                <div className="flex items-center gap-2">
                  <span className="text-xs">🌸</span>
                  <span><strong>Arrangement:</strong> {product.stemsCount}</span>
                </div>
              )}
            </div>

            {/* Color Option Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="mt-4">
                <label className="text-xs font-semibold text-[#5C3E45] block mb-2">
                  Choose Color Variation:
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => {
                    const isSelected = currentColor === c;
                    return (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'border-[#D96B82] bg-[#FFE3E8] text-[#C0536A] font-semibold'
                            : 'border-rose-200 bg-white text-[#5C3E45] hover:bg-rose-50'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-[#D96B82]" />}
                        <span>{c}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Stepper */}
            <div className="mt-4 flex items-center gap-4">
              <label className="text-xs font-semibold text-[#5C3E45]">Quantity:</label>
              <div className="flex items-center border border-rose-200 rounded-full bg-[#FAF8F5] overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 flex items-center justify-center text-[#5C3E45] hover:bg-[#FFE3E8] transition-colors"
                >
                  -
                </button>
                <span className="w-10 text-center text-sm font-semibold text-[#3D272A]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 flex items-center justify-center text-[#5C3E45] hover:bg-[#FFE3E8] transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t border-rose-100 flex flex-col gap-2.5">
            <button
              onClick={handleAddToCart}
              className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-[#D96B82] to-[#C0536A] hover:from-[#c95d73] hover:to-[#ae465c] text-white font-semibold text-sm shadow-md hover:shadow transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Cart • ₹{product.price * quantity}</span>
            </button>

            <button
              onClick={handleBuyOnWhatsApp}
              className="w-full py-2.5 px-4 rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] font-semibold text-xs border border-[#25D366]/30 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>Order Directly on WhatsApp</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
