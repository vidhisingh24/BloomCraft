import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  MessageCircle, 
  Gift, 
  Tag, 
  Truck, 
  ArrowRight
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPaise } from '../utils/currency';
import { buildOrderMessage, buildWhatsAppLink } from '../utils/whatsapp';
import type { CartItem } from '../types';

export const CartDrawer: React.FC<{ onNavigateCheckout?: () => void }> = ({ onNavigateCheckout }) => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    pricing,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    giftWrapRequested,
    setGiftWrapRequested,
    giftMessage,
    setGiftMessage,
    freeDeliveryRemainingPaise,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCoupon(couponInput);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponError('');
      setCouponInput('');
    }
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    if (onNavigateCheckout) {
      onNavigateCheckout();
    } else {
      window.dispatchEvent(new CustomEvent('nav-to', { detail: 'checkout' }));
    }
  };

  const handleWhatsAppInstantOrder = () => {
    if (cart.length === 0) return;
    const dummyOrder: any = {
      id: 'DRAFT',
      createdAt: new Date().toISOString(),
      customer: { name: 'Customer', phone: '' },
      items: cart.map((it: CartItem) => ({
        ...it,
        name: it.product?.name || 'Crochet Bloom',
        image: it.product?.images?.[0] || '',
      })),
      pricing,
      delivery: {
        method: 'vadodara_local',
        details: { area: 'Vadodara' },
        charge: pricing.delivery,
      },
      payment: { method: 'upi', status: 'pending' },
      giftMessage: giftMessage.trim() || undefined,
    };
    const msg = buildOrderMessage(dummyOrder);
    const url = buildWhatsAppLink(msg);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-[#3D272A]/40 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-[#FFFDFB] shadow-2xl border-l border-[#F4A6B7]/30 flex flex-col">
          
          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-[#FFE3E8]/60 to-[#FFF0F3] border-b border-[#F0E6E8] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white shadow-xs flex items-center justify-center text-[#D96B82]">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-[#3D272A]">Your Bloom Basket</h2>
                <p className="text-xs text-[#7A5B62]">
                  {cart.length === 0 ? 'Empty basket' : `${cart.length} unique ${cart.length === 1 ? 'item' : 'items'}`}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-full text-[#7A5B62] hover:bg-white/80 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Banner */}
          {cart.length > 0 && (
            <div className="px-4 py-2 bg-[#FFF0F3] border-b border-[#FFE3E8] text-xs text-[#7A5B62] flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <Truck className="w-3.5 h-3.5 text-[#D96B82]" />
                {freeDeliveryRemainingPaise > 0 ? (
                  <>Add <strong>{formatPaise(freeDeliveryRemainingPaise)}</strong> for Free Parcel Shipping</>
                ) : (
                  <strong className="text-[#0A7B3E]">🎉 Free Pan-India Parcel Shipping Unlocked!</strong>
                )}
              </span>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#FFE3E8] flex items-center justify-center mx-auto text-2xl">
                  🌸
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#3D272A]">
                    Your basket is blooming empty!
                  </h3>
                  <p className="text-xs text-[#7A5B62] max-w-xs mx-auto mt-1">
                    Explore our handmade tulip bells, daisy charms, or bouquets to fill your bag.
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 rounded-full bg-[#D96B82] text-white text-xs font-semibold shadow-xs hover:bg-[#C0536A] transition-all"
                >
                  Explore Catalog 🌸
                </button>
              </div>
            ) : (
              <>
                {/* Items */}
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 p-3 rounded-2xl bg-white border border-[#F0E6E8] shadow-xs"
                    >
                      <img
                        src={item.product?.images?.[0] || '/images/keychains/tulip_pink_duo.jpg'}
                        alt={item.product?.name}
                        className="w-16 h-16 rounded-xl object-cover bg-[#FFF0F3] shrink-0"
                      />

                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <h4 className="font-serif text-xs sm:text-sm font-bold text-[#3D272A] line-clamp-1">
                              {item.product?.name}
                            </h4>
                            <p className="text-[11px] text-[#7A5B62]">
                              {item.selectedColor ? `Color: ${item.selectedColor}` : ''}
                              {item.customNote ? ` • "${item.customNote}"` : ''}
                            </p>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-[#A38B90] hover:text-red-500 p-1 transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          {/* Quantity Stepper */}
                          <div className="flex items-center border border-[#EBD8DC] rounded-lg bg-[#FAF8F5] p-0.5">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-5 h-5 flex items-center justify-center text-xs font-bold text-[#7A5B62] hover:bg-[#FFE3E8] rounded"
                            >
                              -
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-[#3D272A]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-5 h-5 flex items-center justify-center text-xs font-bold text-[#7A5B62] hover:bg-[#FFE3E8] rounded"
                            >
                              +
                            </button>
                          </div>

                          <span className="font-serif font-bold text-xs text-[#3D272A]">
                            {formatPaise((item.priceAtAdd || 0) * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gift Wrap Toggle */}
                <div className="bg-white p-3.5 rounded-2xl border border-[#F0E6E8] space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-[#D96B82]" />
                      <div>
                        <span className="text-xs font-semibold text-[#3D272A] block">Kraft Gift Wrap Box (+₹40)</span>
                        <span className="text-[10px] text-[#7A5B62]">Includes luxury ribbon & personalized note</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={giftWrapRequested}
                      onChange={(e) => setGiftWrapRequested(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#D96B82]"
                    />
                  </label>

                  {giftWrapRequested && (
                    <input
                      type="text"
                      maxLength={100}
                      placeholder="Write your custom gift message..."
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#EBD8DC] text-xs bg-[#FAF8F5] focus:outline-none focus:border-[#D96B82]"
                    />
                  )}
                </div>

                {/* Coupon Code Section */}
                <div className="bg-white p-3.5 rounded-2xl border border-[#F0E6E8] space-y-2">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-[#E7F7EE] px-3 py-2 rounded-xl text-xs text-[#0A7B3E]">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Code "{appliedCoupon.code}" Applied (-{formatPaise(pricing.discount)})</span>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-xs font-bold text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Discount code (e.g. BLOOM10)"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value);
                          setCouponError('');
                        }}
                        className="flex-1 px-3 py-2 rounded-xl border border-[#EBD8DC] text-xs bg-[#FAF8F5] focus:outline-none focus:border-[#D96B82] uppercase"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-[#3D272A] text-white text-xs font-bold hover:bg-[#2A1A1C] transition-all"
                      >
                        Apply
                      </button>
                    </form>
                  )}
                  {couponError && <p className="text-[11px] text-red-500">{couponError}</p>}
                </div>
              </>
            )}
          </div>

          {/* Footer & Checkout Sticky Bottom Bar */}
          {cart.length > 0 && (
            <div className="p-4 bg-white border-t border-[#F0E6E8] space-y-3">
              <div className="space-y-1.5 text-xs text-[#7A5B62]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#3D272A]">{formatPaise(pricing.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className="font-semibold text-[#3D272A]">
                    {pricing.delivery === 0 ? 'FREE' : formatPaise(pricing.delivery)}
                  </span>
                </div>
                {pricing.giftWrap > 0 && (
                  <div className="flex justify-between text-[#D96B82]">
                    <span>Gift Wrap Box</span>
                    <span className="font-semibold">{formatPaise(pricing.giftWrap)}</span>
                  </div>
                )}
                {pricing.discount > 0 && (
                  <div className="flex justify-between text-[#0A7B3E]">
                    <span>Discount</span>
                    <span className="font-semibold">-{formatPaise(pricing.discount)}</span>
                  </div>
                )}
                <div className="border-t border-[#F5EDEF] pt-2 flex justify-between items-baseline font-bold text-sm text-[#3D272A]">
                  <span>Total Amount</span>
                  <span className="font-serif text-lg text-[#D96B82]">{formatPaise(pricing.total)}</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={handleProceedToCheckout}
                  className="w-full py-3.5 rounded-full bg-[#D96B82] text-white font-bold text-sm hover:bg-[#C0536A] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleWhatsAppInstantOrder}
                  className="w-full py-2.5 rounded-full bg-[#FAF8F5] border border-[#EBD8DC] text-[#0A7B3E] font-semibold text-xs hover:bg-[#E7F7EE] transition-all flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" /> Or Order Directly on WhatsApp
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
