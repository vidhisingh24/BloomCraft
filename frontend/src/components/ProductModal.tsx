import React, { useState } from 'react';
import { X, Heart, ShoppingBag, MessageCircle, Check, Share2, Clock } from 'lucide-react';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatPaise } from '../utils/currency';
import { buildProductEnquiry, buildWhatsAppLink } from '../utils/whatsapp';
import { useToast } from '../context/ToastContext';
import { trackEvent } from '../utils/analytics';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { showToast } = useToast();
  
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [customNote, setCustomNote] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!product) return null;

  const isLiked = isInWishlist(product.id);
  const currentColor = selectedColor || (product.colors && product.colors.length > 0 ? product.colors[0].name : undefined);
  const maxQty = product.maxQtyPerOrder || 5;

  const handleAddToCart = () => {
    addToCart(product, quantity, currentColor, customNote);
    trackEvent('add_to_cart', {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
    });
    onClose();
  };

  const handleBuyOnWhatsApp = () => {
    trackEvent('whatsapp_click', { productId: product.id, action: 'product_enquiry' });
    const msg = buildProductEnquiry(product, currentColor, quantity);
    const url = buildWhatsAppLink(msg);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `BloomCraft — ${product.name}`,
          text: `Check out ${product.name} from BloomCraft!`,
          url,
        });
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      showToast('Link Copied! 📋', product.name, 'cart');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#3D272A]/50 backdrop-blur-xs animate-fadeIn">
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
        <div className="md:w-1/2 relative bg-[#FFF0F3] h-60 sm:h-72 md:h-auto md:min-h-[420px] shrink-0">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {product.tags && product.tags.length > 0 && (
            <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 flex flex-wrap gap-1.5 z-10">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-full text-[10px] sm:text-[11px] font-bold text-[#C0536A] shadow-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Section */}
        <div className="md:w-1/2 p-5 sm:p-6 md:p-8 flex flex-col justify-between overflow-y-auto space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs uppercase tracking-widest text-[#C0536A] font-semibold">
                {product.category === 'keychain' ? '🧶 Crochet Charm' : product.category === 'bouquet' ? '💐 Everlasting Bouquet' : '✨ Amigurumi Creation'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleShare}
                  className="p-2 rounded-full hover:bg-[#FFE3E8]/60 text-[#7A5B62] transition-colors"
                  title="Share product"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
                </button>
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
            </div>

            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#3D272A] mt-1">
              {product.name}
            </h2>

            {/* Price & Lead Time */}
            <div className="flex items-baseline gap-3 mt-2">
              <span className="font-serif text-2xl font-bold text-[#D96B82]">
                {formatPaise(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-xs text-[#A38B90] line-through">
                  {formatPaise(product.compareAtPrice)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#0A7B3E] font-medium mt-1">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {product.availability === 'out_of_stock'
                  ? 'Currently Out of Stock'
                  : product.availability === 'made_to_order'
                  ? `Made to Order (~${product.makingTimeDays} days)`
                  : `In Stock • Dispatches in ~${product.makingTimeDays} days`}
              </span>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-[#7A5B62] leading-relaxed mt-3">
              {product.description}
            </p>

            {/* Colors Swatches */}
            {product.colors && product.colors.length > 0 && (
              <div className="mt-4">
                <label className="block text-xs font-bold text-[#3D272A] uppercase tracking-wider mb-2">
                  Color Option: <span className="text-[#D96B82] font-normal">{currentColor}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSelectedColor(color.name)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all ${
                        currentColor === color.name
                          ? 'border-[#D96B82] bg-[#FFF0F3] text-[#3D272A] shadow-xs'
                          : 'border-[#EBD8DC] bg-white text-[#7A5B62] hover:border-[#D96B82]'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.hex }}
                      />
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Personalization Note (if customizable) */}
            {product.isCustomizable && (
              <div className="mt-4">
                <label className="block text-xs font-bold text-[#3D272A] uppercase tracking-wider mb-1">
                  Personalization Note <span className="text-[10px] font-normal text-[#A38B90]">(Optional, e.g. Name tag or initials)</span>
                </label>
                <input
                  type="text"
                  maxLength={30}
                  placeholder="e.g. Initials 'VS' or custom ribbon text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EBD8DC] text-xs bg-[#FAF8F5] focus:outline-none focus:border-[#D96B82]"
                />
              </div>
            )}

            {/* Quantity Stepper */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-bold text-[#3D272A] uppercase tracking-wider">Quantity</span>
              <div className="flex items-center border border-[#EBD8DC] rounded-xl bg-[#FAF8F5] p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 flex items-center justify-center text-sm font-bold text-[#7A5B62] hover:bg-[#FFE3E8] rounded-lg"
                >
                  -
                </button>
                <span className="w-8 text-center text-xs font-bold text-[#3D272A]">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  className="w-7 h-7 flex items-center justify-center text-sm font-bold text-[#7A5B62] hover:bg-[#FFE3E8] rounded-lg"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-3 border-t border-[#F0E6E8]">
            <button
              onClick={handleAddToCart}
              disabled={product.availability === 'out_of_stock'}
              className="w-full py-3.5 rounded-full bg-[#D96B82] text-white font-bold text-sm hover:bg-[#C0536A] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShoppingBag className="w-4 h-4" />
              {product.availability === 'out_of_stock' ? 'Out of Stock' : `Add to Basket • ${formatPaise(product.price * quantity)}`}
            </button>

            <button
              onClick={handleBuyOnWhatsApp}
              className="w-full py-2.5 rounded-full bg-[#FAF8F5] border border-[#EBD8DC] text-[#0A7B3E] font-semibold text-xs hover:bg-[#E7F7EE] transition-all flex items-center justify-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" /> Order / Enquire via WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
