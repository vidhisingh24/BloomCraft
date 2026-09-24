import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, MessageCircle, Gift } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    subtotal,
    checkoutOnWhatsApp,
    clearCart,
  } = useCart();

  const [orderNotes, setOrderNotes] = useState('');

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-[#3D272A]/40 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-[#FFFDFB] shadow-2xl border-l border-[#F4A6B7]/30 flex flex-col">
          
          {/* Header */}
          <div className="p-4 sm:p-6 bg-gradient-to-r from-[#FFE3E8]/60 to-[#FFF0F3] border-b border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-[#D96B82]">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-[#3D272A]">Your Bloom Cart</h2>
                <p className="text-xs text-[#7A5B62]">
                  {cart.length === 0 ? 'Cart is empty' : `${cart.length} unique handcrafted ${cart.length === 1 ? 'item' : 'items'}`}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-full text-[#5C3E45] hover:bg-white/80 transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#FFE3E8] flex items-center justify-center mx-auto text-2xl">
                  🌸
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#3D272A]">
                    Your cart is blooming empty!
                  </h3>
                  <p className="text-xs text-[#7A5B62] max-w-xs mx-auto mt-1">
                    Explore our lovely keychains or everlasting flower bouquets to fill your bag.
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 rounded-full bg-[#D96B82] text-white text-xs font-semibold shadow-sm hover:bg-[#C0536A] transition-all"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.product.id + (item.selectedColor || '')}
                      className="flex gap-3.5 p-3.5 rounded-2xl bg-white border border-rose-100/90 shadow-sm"
                    >
                      {/* Product Thumbnail */}
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-20 h-20 rounded-xl object-cover bg-[#FFF0F3] shrink-0"
                      />

                      {/* Info */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-serif text-sm font-bold text-[#3D272A] line-clamp-1">
                              {item.product.name}
                            </h4>
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-[#A4838B] hover:text-rose-600 transition-colors p-1"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {item.selectedColor && (
                            <p className="text-[11px] text-[#C0536A] font-medium">
                              Color: {item.selectedColor}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-bold text-[#C0536A]">
                            ₹{item.product.price * item.quantity}
                          </span>

                          {/* Quantity Controls */}
                          <div className="flex items-center border border-rose-200 rounded-lg bg-[#FAF8F5] overflow-hidden">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center text-xs text-[#5C3E45] hover:bg-[#FFE3E8]"
                            >
                              -
                            </button>
                            <span className="w-6 text-center text-xs font-semibold text-[#3D272A]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center text-xs text-[#5C3E45] hover:bg-[#FFE3E8]"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Free Keepsake Packaging Checkbox */}
                <div className="p-3.5 rounded-2xl bg-[#FFF0F3]/70 border border-rose-200/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-[#D96B82]" />
                    <div>
                      <p className="font-semibold text-[#3D272A]">Kraft Gift Wrap & Box</p>
                      <p className="text-[10px] text-[#7A5B62]">Included Free with Every Order 🎀</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#25D366]">FREE</span>
                </div>

                {/* Optional Order Note */}
                <div>
                  <label className="block text-xs font-semibold text-[#5C3E45] mb-1">
                    Special Instructions / Gift Message (Optional):
                  </label>
                  <textarea
                    rows={2}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="e.g. Please add a handwritten tag saying 'Happy Birthday Sara!'"
                    className="w-full p-2.5 rounded-xl border border-rose-200 bg-white text-xs text-[#3D272A] focus:outline-none focus:ring-1 focus:ring-[#D96B82]"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={clearCart}
                    className="text-[11px] text-[#A4838B] hover:text-rose-600 transition-colors"
                  >
                    Clear all items
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Footer & Checkout button */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-6 bg-white border-t border-rose-100 shadow-lg space-y-3 sm:space-y-4">
              <div className="space-y-1.5 text-xs text-[#5C3E45]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#3D272A]">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#7A5B62]">
                  <span>Packaging & Gift Tag</span>
                  <span className="text-[#25D366] font-semibold">Free</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#3D272A] pt-2 border-t border-rose-100">
                  <span>Total Amount</span>
                  <span className="text-[#C0536A] text-lg">₹{subtotal}</span>
                </div>
              </div>

              {/* Checkout / Order on WhatsApp button as requested */}
              <button
                onClick={() => checkoutOnWhatsApp(orderNotes)}
                className="w-full py-3.5 px-4 rounded-full bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#20ba5a] hover:to-[#0f7a6e] text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Checkout / Order on WhatsApp</span>
              </button>

              <p className="text-center text-[10px] text-[#A4838B]">
                🔒 Direct artisan WhatsApp ordering. No payment gateway hassle.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
