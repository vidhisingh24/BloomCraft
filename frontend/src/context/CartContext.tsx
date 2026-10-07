import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { CartItem, Product, Coupon, OrderPricing, DeliveryMethod } from '../types';
import { storage, STORAGE_KEYS } from '../services/storage';
import { calculatePricing } from '../utils/pricing';
import { useCatalog } from './CatalogContext';
import { productService } from '../services/productService';
import { friendlyError } from '../lib/supabase';
import { DELIVERY_METHODS } from '../config/delivery.config';
import { useToast } from './ToastContext';
import { formatPaise } from '../utils/currency';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, color?: string, customNote?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  giftWrapRequested: boolean;
  setGiftWrapRequested: (requested: boolean) => void;
  giftMessage: string;
  setGiftMessage: (msg: string) => void;
  totalItems: number;
  pricing: OrderPricing;
  activeDeliveryMethod: DeliveryMethod;
  setActiveDeliveryMethod: (method: DeliveryMethod) => void;
  freeDeliveryRemainingPaise: number;
  freeDeliveryThresholdPaise: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    return storage.get<CartItem[]>(STORAGE_KEYS.CART, []);
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [giftWrapRequested, setGiftWrapRequested] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [activeDeliveryMethod, setActiveDeliveryMethod] = useState<DeliveryMethod>('vadodara_local');

  const { showToast } = useToast();
  const { products } = useCatalog();

  // Keep saved cart items in step with the live catalogue: current prices, and drop anything
  // the maker has removed or marked out of stock.
  useEffect(() => {
    if (products.length === 0) return;
    const byId = new Map(products.map((p) => [p.id, p]));
    setCart((prev) => {
      let changed = false;
      const next: CartItem[] = [];
      for (const item of prev) {
        const live = byId.get(item.productId);
        if (!live || live.availability === 'out_of_stock') {
          changed = true;
          continue;
        }
        const quantity = Math.min(item.quantity, live.maxQtyPerOrder);
        if (live.price !== item.priceAtAdd || quantity !== item.quantity || live !== item.product) {
          changed = true;
          next.push({ ...item, product: live, priceAtAdd: live.price, quantity });
        } else {
          next.push(item);
        }
      }
      return changed ? next : prev;
    });
  }, [products]);

  // Sync to versioned storage
  useEffect(() => {
    storage.set(STORAGE_KEYS.CART, cart);
  }, [cart]);

  // Listen for storage events from other tabs
  useEffect(() => {
    const unsubscribe = storage.subscribe<CartItem[]>(STORAGE_KEYS.CART, (newCart) => {
      if (Array.isArray(newCart)) {
        setCart(newCart);
      }
    });
    return unsubscribe;
  }, []);

  const addToCart = useCallback(
    (product: Product, quantity: number = 1, color?: string, customNote?: string) => {
      if (product.availability === 'out_of_stock') {
        showToast('Sold out for now', `${product.name} is out of stock. Message us on WhatsApp to pre-order.`, 'info');
        return;
      }
      const selectedColor =
        color || (product.colors && product.colors.length > 0 ? product.colors[0].name : undefined);
      const cleanNote = customNote?.trim() ? customNote.trim().slice(0, 30) : undefined;
      const itemId = `${product.id}-${selectedColor || 'default'}-${cleanNote || 'none'}`;

      setCart((prev: CartItem[]) => {
        const existingIndex = prev.findIndex((item: CartItem) => item.id === itemId);
        if (existingIndex > -1) {
          const updated = [...prev];
          const newQty = Math.min(
            product.maxQtyPerOrder || 10,
            updated[existingIndex].quantity + quantity
          );
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: newQty,
          };
          return updated;
        } else {
          const newItem: CartItem = {
            id: itemId,
            productId: product.id,
            product,
            quantity: Math.min(product.maxQtyPerOrder || 10, quantity),
            selectedColor,
            customNote: cleanNote,
            priceAtAdd: product.price,
          };
          return [...prev, newItem];
        }
      });

      showToast(
        `Added to Cart 🌸`,
        `${product.name} (Qty: ${quantity})`,
        'cart'
      );
    },
    [showToast]
  );

  const removeFromCart = useCallback(
    (itemId: string) => {
      setCart((prev: CartItem[]) => {
        const index = prev.findIndex((item: CartItem) => item.id === itemId);
        if (index > -1) {
          const item = prev[index];
          showToast(`Removed from Cart`, `${item.product?.name || 'Item'} removed`, 'info');
          return prev.filter((it: CartItem) => it.id !== itemId);
        }
        return prev;
      });
    },
    [showToast]
  );

  const updateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(itemId);
        return;
      }
      setCart((prev: CartItem[]) =>
        prev.map((item: CartItem) => {
          if (item.id === itemId) {
            const max = item.product?.maxQtyPerOrder || 10;
            return { ...item, quantity: Math.min(max, quantity) };
          }
          return item;
        })
      );
    },
    [removeFromCart]
  );

  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedCoupon(null);
    setGiftWrapRequested(false);
    setGiftMessage('');
  }, []);

  const applyCoupon = useCallback(
    async (code: string): Promise<{ success: boolean; message: string }> => {
      let match: Coupon | null;
      try {
        match = await productService.checkCoupon(code);
      } catch (err) {
        return { success: false, message: friendlyError(err, 'Could not check the code. Please try again.') };
      }

      if (!match) {
        return { success: false, message: 'This coupon code is not valid.' };
      }

      const currentSubtotal = cart.reduce(
        (sum: number, item: CartItem) => sum + (item.priceAtAdd || item.product.price) * item.quantity,
        0
      );

      if (match.minOrderPaise && currentSubtotal < match.minOrderPaise) {
        return {
          success: false,
          message: `Coupon requires a minimum order of ${formatPaise(match.minOrderPaise)}`,
        };
      }

      setAppliedCoupon(match);
      showToast('Coupon Applied! 🎉', match.description, 'cart');
      return { success: true, message: `Applied "${match.code}": ${match.description}` };
    },
    [cart, showToast]
  );

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    showToast('Coupon Removed', 'Discount removed from your cart', 'info');
  }, [showToast]);

  const totalItems = useMemo(() => cart.reduce((acc: number, item: CartItem) => acc + item.quantity, 0), [cart]);

  const deliveryConfig = DELIVERY_METHODS[activeDeliveryMethod] || DELIVERY_METHODS.vadodara_local;
  const freeDeliveryThresholdPaise = DELIVERY_METHODS.parcel.freeAbovePaise || 99900;

  const pricing = useMemo(() => {
    return calculatePricing(cart, deliveryConfig.baseChargePaise, {
      giftWrap: giftWrapRequested,
      coupon: appliedCoupon,
      deliveryMethod: activeDeliveryMethod,
      freeDeliveryThreshold: freeDeliveryThresholdPaise,
    });
  }, [cart, deliveryConfig.baseChargePaise, giftWrapRequested, appliedCoupon, activeDeliveryMethod, freeDeliveryThresholdPaise]);

  const freeDeliveryRemainingPaise = Math.max(0, freeDeliveryThresholdPaise - pricing.subtotal);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        giftWrapRequested,
        setGiftWrapRequested,
        giftMessage,
        setGiftMessage,
        totalItems,
        pricing,
        activeDeliveryMethod,
        setActiveDeliveryMethod,
        freeDeliveryRemainingPaise,
        freeDeliveryThresholdPaise,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
