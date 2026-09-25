import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { siteConfig } from '../../config/site.config';
import { DELIVERY_METHODS, VADODARA_AREAS, VADODARA_TIME_SLOTS, INDIAN_STATES } from '../../config/delivery.config';
import { MOCK_COLLEGES } from '../../data/mock/colleges';
import { lookupPincode } from '../../data/mock/pincodes';
import { formatPaise } from '../../utils/currency';
import { getMinDeliveryDate } from '../../utils/date';
import { validateCustomer, validateDelivery, normalizeIndianPhone } from '../../utils/validation';
import { storage, STORAGE_KEYS } from '../../services/storage';
import { orderService } from '../../services/orderService';
import { trackEvent } from '../../utils/analytics';
import type { Customer, DeliveryMethod, PaymentMethod, Order, CartItem } from '../../types';
import { 
  User, 
  MapPin, 
  CreditCard, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Copy, 
  Check, 
  ShoppingBag, 
  Truck, 
  Sparkles, 
  Gift, 
  QrCode,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface CheckoutDraft {
  step: number;
  customer: Customer;
  deliveryMethod: DeliveryMethod;
  localDetails: {
    area: string;
    preferredDate: string;
    preferredTimeSlot: string;
    message: string;
  };
  collegeDetails: {
    collegeName: string;
    campus: string;
    deliveryPoint: string;
    preferredDate: string;
    instructions: string;
  };
  parcelDetails: {
    house: string;
    street: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
    instructions: string;
  };
  paymentMethod: PaymentMethod;
  upiTxnRef: string;
}

const DEFAULT_DRAFT: CheckoutDraft = {
  step: 1,
  customer: { name: '', phone: '', email: '' },
  deliveryMethod: 'vadodara_local',
  localDetails: {
    area: 'Alkapuri',
    preferredDate: '',
    preferredTimeSlot: VADODARA_TIME_SLOTS[2],
    message: '',
  },
  collegeDetails: {
    collegeName: MOCK_COLLEGES[0].name,
    campus: 'Main Campus',
    deliveryPoint: 'Main Gate',
    preferredDate: '',
    instructions: '',
  },
  parcelDetails: {
    house: '',
    street: '',
    area: '',
    city: 'Vadodara',
    state: 'Gujarat',
    pincode: '',
    instructions: '',
  },
  paymentMethod: 'upi',
  upiTxnRef: '',
};

interface CheckoutFlowProps {
  initialMethod?: DeliveryMethod;
  onOrderSuccess: (order: Order) => void;
  onBackToShop: () => void;
}

export const CheckoutFlow: React.FC<CheckoutFlowProps> = ({
  initialMethod,
  onOrderSuccess,
  onBackToShop,
}) => {
  const { cart, pricing, giftWrapRequested, giftMessage, appliedCoupon, clearCart, setActiveDeliveryMethod } = useCart();
  const { showToast } = useToast();

  const [draft, setDraft] = useState<CheckoutDraft>(() => {
    const saved = storage.get<CheckoutDraft>(STORAGE_KEYS.CHECKOUT_DRAFT, DEFAULT_DRAFT);
    if (initialMethod) {
      return { ...saved, deliveryMethod: initialMethod };
    }
    return saved;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Maximum lead time in days for products in cart
  const maxLeadTime = cart.reduce(
    (max: number, item: CartItem) => Math.max(max, item.product?.makingTimeDays || 2),
    2
  );
  const minDate = getMinDeliveryDate(maxLeadTime);

  // Update CartContext delivery method so pricing matches
  useEffect(() => {
    setActiveDeliveryMethod(draft.deliveryMethod);
  }, [draft.deliveryMethod, setActiveDeliveryMethod]);

  // Persist draft on changes
  useEffect(() => {
    storage.set(STORAGE_KEYS.CHECKOUT_DRAFT, draft);
  }, [draft]);

  // Auto-fill dates if empty
  useEffect(() => {
    if (!draft.localDetails.preferredDate) {
      setDraft((d) => ({ ...d, localDetails: { ...d.localDetails, preferredDate: minDate } }));
    }
    if (!draft.collegeDetails.preferredDate) {
      setDraft((d) => ({ ...d, collegeDetails: { ...d.collegeDetails, preferredDate: minDate } }));
    }
  }, [minDate, draft.localDetails.preferredDate, draft.collegeDetails.preferredDate]);

  const handlePincodeChange = (pincode: string) => {
    const cleaned = pincode.replace(/\D/g, '').slice(0, 6);
    setDraft((d) => ({
      ...d,
      parcelDetails: { ...d.parcelDetails, pincode: cleaned },
    }));

    if (cleaned.length === 6) {
      const match = lookupPincode(cleaned);
      if (match) {
        setDraft((d) => ({
          ...d,
          parcelDetails: {
            ...d.parcelDetails,
            pincode: cleaned,
            city: match.city,
            state: match.state,
            area: d.parcelDetails.area || match.area || '',
          },
        }));
        showToast('Pincode Detected 📍', `${match.city}, ${match.state}`, 'info');
      }
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(siteConfig.upiId);
    setCopiedUpi(true);
    showToast('UPI ID Copied! 📋', siteConfig.upiId, 'cart');
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const goToStep = (step: number) => {
    setDraft((d) => ({ ...d, step }));
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextFromStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    const res = validateCustomer(draft.customer);
    if (!res.isValid) {
      setErrors(res.errors);
      return;
    }
    setErrors({});
    trackEvent('begin_checkout', { customerName: draft.customer.name });
    goToStep(2);
  };

  const handleNextFromStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    let currentDetails: any = draft.localDetails;
    if (draft.deliveryMethod === 'college') currentDetails = draft.collegeDetails;
    if (draft.deliveryMethod === 'parcel') currentDetails = draft.parcelDetails;

    const res = validateDelivery(draft.deliveryMethod, currentDetails);
    if (!res.isValid) {
      setErrors(res.errors);
      return;
    }
    setErrors({});
    trackEvent('select_delivery_method', { method: draft.deliveryMethod });
    goToStep(3);
  };

  const handleNextFromStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent('add_payment_info', { paymentMethod: draft.paymentMethod });
    goToStep(4);
  };

  const handlePlaceOrder = async () => {
    if (!agreedToTerms) {
      setErrors({ terms: 'Please agree to the handmade craft policies to continue' });
      return;
    }

    if (cart.length === 0) {
      showToast('Cart is Empty', 'Please add some crochet blooms to your cart first', 'info');
      return;
    }

    setIsSubmitting(true);

    try {
      let deliveryDetails: any = draft.localDetails;
      if (draft.deliveryMethod === 'college') deliveryDetails = draft.collegeDetails;
      if (draft.deliveryMethod === 'parcel') deliveryDetails = draft.parcelDetails;

      const orderPayload = {
        customer: {
          name: draft.customer.name.trim(),
          phone: normalizeIndianPhone(draft.customer.phone) || draft.customer.phone.trim(),
          email: draft.customer.email?.trim() || undefined,
        },
        items: cart.map((item: CartItem) => ({
          ...item,
          name: item.product?.name || 'Crochet Piece',
          image: item.product?.images?.[0] || '/images/keychains/tulip_pink_duo.jpg',
        })),
        pricing: { ...pricing },
        delivery: {
          method: draft.deliveryMethod,
          details: deliveryDetails,
          charge: pricing.delivery,
        },
        payment: {
          method: draft.paymentMethod,
          status: draft.paymentMethod === 'upi' && draft.upiTxnRef ? ('awaiting_verification' as const) : ('pending' as const),
          upiTxnRef: draft.upiTxnRef.trim() || undefined,
        },
        giftWrapRequested,
        giftMessage: giftMessage.trim() || undefined,
        couponCode: appliedCoupon?.code,
      };

      const createdOrder = await orderService.create(orderPayload);

      trackEvent('purchase', {
        orderId: createdOrder.id,
        totalPaise: createdOrder.pricing.total,
        itemCount: createdOrder.items.length,
      });

      // Clear draft & cart
      storage.remove(STORAGE_KEYS.CHECKOUT_DRAFT);
      clearCart();

      showToast('Order Placed! 🌸', `Order #${createdOrder.id} confirmed`, 'cart');
      onOrderSuccess(createdOrder);
    } catch (err: any) {
      console.error('Order placement failed:', err);
      showToast('Order Failed', err.message || 'Please check your connection and try again', 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0 && draft.step === 1) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#FFE3E8] flex items-center justify-center text-[#D96B82]">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-[#3D272A] mb-3">Your Basket is Empty</h2>
        <p className="text-[#7A5B62] mb-8 max-w-md mx-auto">
          Explore our handmade crochet collection of tulip bells, daisy charms, and everlasting bouquets.
        </p>
        <button
          onClick={onBackToShop}
          className="px-8 py-3.5 rounded-full bg-[#D96B82] text-white font-medium hover:bg-[#C0536A] shadow-md hover:shadow-lg transition-all duration-300"
        >
          Browse Collection 🌸
        </button>
      </div>
    );
  }

  const steps = [
    { num: 1, label: 'Details', icon: User },
    { num: 2, label: 'Delivery', icon: MapPin },
    { num: 3, label: 'Payment', icon: CreditCard },
    { num: 4, label: 'Review', icon: CheckCircle2 },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      {/* Header & Back Link */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#F0E6E8]">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#D96B82] font-semibold">BloomCraft Checkout</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#3D272A]">Complete Your Handmade Order</h1>
        </div>
        <button
          onClick={onBackToShop}
          className="text-sm font-medium text-[#7A5B62] hover:text-[#D96B82] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Shop
        </button>
      </div>

      {/* Progress Stepper */}
      <div className="mb-10">
        <div className="flex items-center justify-between relative">
          {/* Background Connecting Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#EBD8DC] -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-0 h-0.5 bg-[#D96B82] -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${((draft.step - 1) / (steps.length - 1)) * 100}%` }}
          />

          {steps.map((s) => {
            const Icon = s.icon;
            const isDone = draft.step > s.num;
            const isCurrent = draft.step === s.num;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => isDone && goToStep(s.num)}
                disabled={!isDone && !isCurrent}
                className="relative z-10 flex flex-col items-center group focus:outline-none"
              >
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-semibold text-sm sm:text-base transition-all duration-300 ${
                    isDone
                      ? 'bg-[#D96B82] text-white shadow-md'
                      : isCurrent
                      ? 'bg-[#3D272A] text-white ring-4 ring-[#FFE3E8] shadow-lg scale-105'
                      : 'bg-white text-[#A38B90] border-2 border-[#EBD8DC]'
                  }`}
                >
                  {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span
                  className={`text-xs sm:text-sm font-medium mt-2 transition-colors ${
                    isCurrent ? 'text-[#3D272A] font-bold' : isDone ? 'text-[#D96B82]' : 'text-[#A38B90]'
                  }`}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Form on Left, Order Summary Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#F0E6E8]">
          
          {/* STEP 1: CUSTOMER DETAILS */}
          {draft.step === 1 && (
            <form onSubmit={handleNextFromStep1} className="space-y-6">
              <div className="border-b border-[#F5EDEF] pb-4">
                <h2 className="text-xl font-serif font-bold text-[#3D272A] flex items-center gap-2">
                  <User className="w-5 h-5 text-[#D96B82]" /> Step 1: Your Contact Information
                </h2>
                <p className="text-xs text-[#7A5B62] mt-1">
                  We will use this to contact you for delivery coordination.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#3D272A] mb-1.5">
                  Full Name <span className="text-[#D96B82]">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  required
                  placeholder="e.g. Ananya Deshmukh"
                  value={draft.customer.name}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      customer: { ...d.customer, name: e.target.value },
                    }))
                  }
                  className={`w-full px-4 py-3 rounded-xl border text-base ${
                    errors.name ? 'border-red-400 bg-red-50/30' : 'border-[#EBD8DC] focus:border-[#D96B82]'
                  } focus:outline-none focus:ring-2 focus:ring-[#FFE3E8]`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#3D272A] mb-1.5">
                  WhatsApp / Phone Number <span className="text-[#D96B82]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#7A5B62]">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="tel"
                    name="tel"
                    autoComplete="tel"
                    required
                    placeholder="9876543210"
                    value={draft.customer.phone}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        customer: { ...d.customer, phone: e.target.value },
                      }))
                    }
                    className={`w-full pl-14 pr-4 py-3 rounded-xl border text-base ${
                      errors.phone ? 'border-red-400 bg-red-50/30' : 'border-[#EBD8DC] focus:border-[#D96B82]'
                    } focus:outline-none focus:ring-2 focus:ring-[#FFE3E8]`}
                  />
                </div>
                {errors.phone ? (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.phone}</p>
                ) : (
                  <p className="text-[11px] text-[#A38B90] mt-1">10-digit Indian mobile number for order updates</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#3D272A] mb-1.5">
                  Email Address <span className="text-xs font-normal text-[#A38B90]">(Optional, for digital receipt)</span>
                </label>
                <input
                  type="email"
                  inputMode="email"
                  name="email"
                  autoComplete="email"
                  placeholder="ananya@example.com"
                  value={draft.customer.email || ''}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      customer: { ...d.customer, email: e.target.value },
                    }))
                  }
                  className={`w-full px-4 py-3 rounded-xl border text-base ${
                    errors.email ? 'border-red-400 bg-red-50/30' : 'border-[#EBD8DC] focus:border-[#D96B82]'
                  } focus:outline-none focus:ring-2 focus:ring-[#FFE3E8]`}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.email}</p>}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#D96B82] text-white font-medium hover:bg-[#C0536A] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  Continue to Delivery <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: DELIVERY METHOD & DETAILS */}
          {draft.step === 2 && (
            <form onSubmit={handleNextFromStep2} className="space-y-6">
              <div className="border-b border-[#F5EDEF] pb-4">
                <h2 className="text-xl font-serif font-bold text-[#3D272A] flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#D96B82]" /> Step 2: How would you like to receive your order?
                </h2>
                <p className="text-xs text-[#7A5B62] mt-1">
                  Choose local Vadodara pickup, college campus handover, or courier parcel delivery.
                </p>
              </div>

              {/* 3 Delivery Method Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Vadodara Local */}
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, deliveryMethod: 'vadodara_local' }))}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    draft.deliveryMethod === 'vadodara_local'
                      ? 'border-[#D96B82] bg-[#FFF0F3] shadow-sm ring-2 ring-[#FFE3E8]'
                      : 'border-[#F0E6E8] bg-white hover:border-[#D96B82]/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">📍</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E7F7EE] text-[#0A7B3E]">FREE</span>
                  </div>
                  <h3 className="font-semibold text-sm text-[#3D272A]">Vadodara Local</h3>
                  <p className="text-xs text-[#7A5B62] mt-1 line-clamp-2">Direct handover at a convenient Vadodara spot</p>
                </button>

                {/* 2. College Delivery */}
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, deliveryMethod: 'college' }))}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    draft.deliveryMethod === 'college'
                      ? 'border-[#D96B82] bg-[#FFF0F3] shadow-sm ring-2 ring-[#FFE3E8]'
                      : 'border-[#F0E6E8] bg-white hover:border-[#D96B82]/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">🏫</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E7F7EE] text-[#0A7B3E]">FREE</span>
                  </div>
                  <h3 className="font-semibold text-sm text-[#3D272A]">College Campus</h3>
                  <p className="text-xs text-[#7A5B62] mt-1 line-clamp-2">Hand-delivered to your Vadodara campus gate</p>
                </button>

                {/* 3. Parcel Delivery */}
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, deliveryMethod: 'parcel' }))}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    draft.deliveryMethod === 'parcel'
                      ? 'border-[#D96B82] bg-[#FFF0F3] shadow-sm ring-2 ring-[#FFE3E8]'
                      : 'border-[#F0E6E8] bg-white hover:border-[#D96B82]/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">📦</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF0F3] text-[#D96B82]">
                      {pricing.subtotal >= (DELIVERY_METHODS.parcel.freeAbovePaise || 99900) ? 'FREE' : '₹60'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-[#3D272A]">All-India Parcel</h3>
                  <p className="text-xs text-[#7A5B62] mt-1 line-clamp-2">Standard doorstep delivery in protective box</p>
                </button>
              </div>

              {/* METHOD-SPECIFIC FORM FIELDS */}

              {/* A. Vadodara Local Details */}
              {draft.deliveryMethod === 'vadodara_local' && (
                <div className="bg-[#FAF8F5] p-5 rounded-xl border border-[#F0E6E8] space-y-4">
                  <div className="flex items-start gap-2 bg-[#FFF0F3] p-3 rounded-lg text-xs text-[#7A5B62]">
                    <Sparkles className="w-4 h-4 text-[#D96B82] shrink-0 mt-0.5" />
                    <span>Talk with the Bloomcraft maker to arrange a mutually convenient meeting or pickup spot in Vadodara!</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#3D272A] uppercase tracking-wider mb-2">
                      Choose or Type Your Vadodara Area <span className="text-[#D96B82]">*</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {VADODARA_AREAS.slice(0, 8).map((area) => (
                        <button
                          key={area}
                          type="button"
                          onClick={() =>
                            setDraft((d) => ({
                              ...d,
                              localDetails: { ...d.localDetails, area },
                            }))
                          }
                          className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                            draft.localDetails.area === area
                              ? 'bg-[#3D272A] text-white border-[#3D272A]'
                              : 'bg-white text-[#7A5B62] border-[#EBD8DC] hover:border-[#D96B82]'
                          }`}
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Alkapuri, Near Inorbit Mall or Fatehgunj"
                      value={draft.localDetails.area}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          localDetails: { ...d.localDetails, area: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EBD8DC] text-sm bg-white focus:outline-none focus:border-[#D96B82]"
                    />
                    {errors.area && <p className="text-xs text-red-500 mt-1">{errors.area}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#3D272A] uppercase tracking-wider mb-1">
                        Preferred Handover Date <span className="text-[#D96B82]">*</span>
                      </label>
                      <input
                        type="date"
                        min={minDate}
                        value={draft.localDetails.preferredDate}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            localDetails: { ...d.localDetails, preferredDate: e.target.value },
                          }))
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-[#EBD8DC] text-sm bg-white focus:outline-none focus:border-[#D96B82]"
                      />
                      <p className="text-[10px] text-[#A38B90] mt-1">Lead time: ~{maxLeadTime} days for handmade crafting</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#3D272A] uppercase tracking-wider mb-1">
                        Preferred Time Slot
                      </label>
                      <select
                        value={draft.localDetails.preferredTimeSlot}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            localDetails: { ...d.localDetails, preferredTimeSlot: e.target.value },
                          }))
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-[#EBD8DC] text-sm bg-white focus:outline-none focus:border-[#D96B82]"
                      >
                        {VADODARA_TIME_SLOTS.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#3D272A] uppercase tracking-wider mb-1">
                      Additional Handover Note <span className="text-[10px] font-normal text-[#A38B90]">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Free after 5 PM, can meet near garden or tea spot"
                      value={draft.localDetails.message}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          localDetails: { ...d.localDetails, message: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EBD8DC] text-sm bg-white focus:outline-none focus:border-[#D96B82]"
                    />
                  </div>
                </div>
              )}

              {/* B. College Delivery Details */}
              {draft.deliveryMethod === 'college' && (
                <div className="bg-[#FAF8F5] p-5 rounded-xl border border-[#F0E6E8] space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#3D272A] uppercase tracking-wider mb-1">
                      Select Your College / University <span className="text-[#D96B82]">*</span>
                    </label>
                    <select
                      value={draft.collegeDetails.collegeName}
                      onChange={(e) => {
                        const val = e.target.value;
                        const match = MOCK_COLLEGES.find((c) => c.name === val);
                        setDraft((d) => ({
                          ...d,
                          collegeDetails: {
                            ...d.collegeDetails,
                            collegeName: val,
                            campus: match ? match.campusArea : d.collegeDetails.campus,
                            deliveryPoint: match ? match.popularDeliveryPoint : d.collegeDetails.deliveryPoint,
                          },
                        }));
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EBD8DC] text-sm bg-white focus:outline-none focus:border-[#D96B82]"
                    >
                      {MOCK_COLLEGES.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                      <option value="Other / Not Listed">Other College (Specify below)</option>
                    </select>
                  </div>

                  {draft.collegeDetails.collegeName === 'Other / Not Listed' && (
                    <div>
                      <label className="block text-xs font-bold text-[#3D272A] uppercase tracking-wider mb-1">
                        Enter College Name & Location <span className="text-[#D96B82]">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Vadodara Institute of Engineering, Kotambi"
                        value={draft.collegeDetails.campus}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            collegeDetails: { ...d.collegeDetails, campus: e.target.value },
                          }))
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-[#EBD8DC] text-sm bg-white focus:outline-none focus:border-[#D96B82]"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#3D272A] uppercase tracking-wider mb-1">
                        Handover Point on Campus <span className="text-[#D96B82]">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Main Gate, Canteen, Department"
                        value={draft.collegeDetails.deliveryPoint}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            collegeDetails: { ...d.collegeDetails, deliveryPoint: e.target.value },
                          }))
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-[#EBD8DC] text-sm bg-white focus:outline-none focus:border-[#D96B82]"
                      />
                      {errors.deliveryPoint && <p className="text-xs text-red-500 mt-1">{errors.deliveryPoint}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#3D272A] uppercase tracking-wider mb-1">
                        Preferred Delivery Date <span className="text-[#D96B82]">*</span>
                      </label>
                      <input
                        type="date"
                        min={minDate}
                        value={draft.collegeDetails.preferredDate}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            collegeDetails: { ...d.collegeDetails, preferredDate: e.target.value },
                          }))
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-[#EBD8DC] text-sm bg-white focus:outline-none focus:border-[#D96B82]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#3D272A] uppercase tracking-wider mb-1">
                      Instructions for Campus Handover <span className="text-[10px] font-normal text-[#A38B90]">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Call 10 mins before reaching gate during recess"
                      value={draft.collegeDetails.instructions}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          collegeDetails: { ...d.collegeDetails, instructions: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EBD8DC] text-sm bg-white focus:outline-none focus:border-[#D96B82]"
                    />
                  </div>
                </div>
              )}

              {/* C. Parcel Delivery Details */}
              {draft.deliveryMethod === 'parcel' && (
                <div className="bg-[#FAF8F5] p-5 rounded-xl border border-[#F0E6E8] space-y-4">
                  <div className="flex items-center justify-between text-xs font-medium text-[#7A5B62] bg-[#FFF0F3] p-3 rounded-lg">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-[#D96B82]" /> Dispatch in ~{maxLeadTime} days + 3–7 days courier transit
                    </span>
                    <span className="font-bold text-[#D96B82]">
                      {pricing.delivery === 0 ? 'FREE Pan-India' : 'Flat ₹60'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#3D272A] uppercase tracking-wider mb-1">
                        PIN Code <span className="text-[#D96B82]">*</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="e.g. 390001"
                        value={draft.parcelDetails.pincode}
                        onChange={(e) => handlePincodeChange(e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white ${
                          errors.pincode ? 'border-red-400' : 'border-[#EBD8DC]'
                        } focus:outline-none focus:border-[#D96B82]`}
                      />
                      {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#3D272A] uppercase tracking-wider mb-1">
                        City <span className="text-[#D96B82]">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Vadodara"
                        value={draft.parcelDetails.city}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            parcelDetails: { ...d.parcelDetails, city: e.target.value },
                          }))
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-[#EBD8DC] text-sm bg-white focus:outline-none focus:border-[#D96B82]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#3D272A] uppercase tracking-wider mb-1">
                      Flat / House No. & Building <span className="text-[#D96B82]">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Flat 402, Bloom Heights"
                      value={draft.parcelDetails.house}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          parcelDetails: { ...d.parcelDetails, house: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EBD8DC] text-sm bg-white focus:outline-none focus:border-[#D96B82]"
                    />
                    {errors.house && <p className="text-xs text-red-500 mt-1">{errors.house}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#3D272A] uppercase tracking-wider mb-1">
                        Street / Locality <span className="text-[#D96B82]">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. RC Dutt Road, Opp. Central Park"
                        value={draft.parcelDetails.street}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            parcelDetails: { ...d.parcelDetails, street: e.target.value },
                          }))
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-[#EBD8DC] text-sm bg-white focus:outline-none focus:border-[#D96B82]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#3D272A] uppercase tracking-wider mb-1">
                        State <span className="text-[#D96B82]">*</span>
                      </label>
                      <select
                        value={draft.parcelDetails.state}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            parcelDetails: { ...d.parcelDetails, state: e.target.value },
                          }))
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-[#EBD8DC] text-sm bg-white focus:outline-none focus:border-[#D96B82]"
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="px-6 py-3 rounded-full border border-[#EBD8DC] text-[#7A5B62] font-medium hover:bg-[#FAF8F5] transition-all flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  className="px-8 py-3.5 rounded-full bg-[#D96B82] text-white font-medium hover:bg-[#C0536A] shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  Proceed to Payment <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: PAYMENT METHOD */}
          {draft.step === 3 && (
            <form onSubmit={handleNextFromStep3} className="space-y-6">
              <div className="border-b border-[#F5EDEF] pb-4">
                <h2 className="text-xl font-serif font-bold text-[#3D272A] flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#D96B82]" /> Step 3: Select Payment Method
                </h2>
                <p className="text-xs text-[#7A5B62] mt-1">
                  Pay via direct UPI with zero transaction fees, or pay on handover.
                </p>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                {/* 1. UPI */}
                <div
                  onClick={() => setDraft((d) => ({ ...d, paymentMethod: 'upi' }))}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    draft.paymentMethod === 'upi'
                      ? 'border-[#D96B82] bg-[#FFF0F3]/60 shadow-sm ring-2 ring-[#FFE3E8]'
                      : 'border-[#F0E6E8] bg-white hover:border-[#D96B82]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FFE3E8] flex items-center justify-center text-[#D96B82]">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-[#3D272A]">UPI Online Payment (Recommended)</h3>
                        <p className="text-xs text-[#7A5B62]">Google Pay, PhonePe, Paytm, BHIM</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      checked={draft.paymentMethod === 'upi'}
                      onChange={() => setDraft((d) => ({ ...d, paymentMethod: 'upi' }))}
                      className="w-4 h-4 accent-[#D96B82]"
                    />
                  </div>

                  {draft.paymentMethod === 'upi' && (
                    <div className="mt-4 pt-4 border-t border-[#F0E6E8] space-y-4">
                      <div className="bg-white p-4 rounded-xl border border-[#EBD8DC] flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div>
                          <span className="text-[11px] text-[#A38B90] uppercase font-bold tracking-wider">BloomCraft Official UPI ID</span>
                          <p className="font-mono font-bold text-[#3D272A] text-base">{siteConfig.upiId}</p>
                          <p className="text-xs text-[#7A5B62]">{siteConfig.upiPayeeName}</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          className="px-4 py-2 rounded-lg bg-[#FAF8F5] border border-[#EBD8DC] text-xs font-semibold text-[#3D272A] hover:bg-[#FFE3E8] transition-all flex items-center gap-1.5 shrink-0"
                        >
                          {copiedUpi ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-[#D96B82]" />}
                          {copiedUpi ? 'Copied!' : 'Copy UPI ID'}
                        </button>
                      </div>

                      {/* Mobile UPI Deep Link */}
                      <a
                        href={`upi://pay?pa=${siteConfig.upiId}&pn=${encodeURIComponent(siteConfig.upiPayeeName)}&am=${(pricing.total / 100).toFixed(2)}&tn=BloomCraft%20Order`}
                        className="sm:hidden block w-full py-3 rounded-xl bg-[#3D272A] text-white text-center font-medium text-sm shadow-md"
                      >
                        ⚡ Open Any UPI App ({formatPaise(pricing.total)})
                      </a>

                      <div>
                        <label className="block text-xs font-bold text-[#3D272A] uppercase tracking-wider mb-1">
                          UPI Transaction Reference / UTR Number <span className="text-[10px] font-normal text-[#A38B90]">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 12-digit UTR from your payment app"
                          value={draft.upiTxnRef}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              upiTxnRef: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-[#EBD8DC] text-sm bg-white focus:outline-none focus:border-[#D96B82]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Cash on Handover / COD */}
                <div
                  onClick={() => setDraft((d) => ({ ...d, paymentMethod: 'cod' }))}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    draft.paymentMethod === 'cod'
                      ? 'border-[#D96B82] bg-[#FFF0F3]/60 shadow-sm ring-2 ring-[#FFE3E8]'
                      : 'border-[#F0E6E8] bg-white hover:border-[#D96B82]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] flex items-center justify-center text-[#7A5B62]">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-[#3D272A]">Pay on Handover / Delivery</h3>
                        <p className="text-xs text-[#7A5B62]">Cash or UPI scan when you receive your handmade blooms</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      checked={draft.paymentMethod === 'cod'}
                      onChange={() => setDraft((d) => ({ ...d, paymentMethod: 'cod' }))}
                      className="w-4 h-4 accent-[#D96B82]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="px-6 py-3 rounded-full border border-[#EBD8DC] text-[#7A5B62] font-medium hover:bg-[#FAF8F5] transition-all flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  className="px-8 py-3.5 rounded-full bg-[#D96B82] text-white font-medium hover:bg-[#C0536A] shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  Review Order <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: REVIEW & PLACE ORDER */}
          {draft.step === 4 && (
            <div className="space-y-6">
              <div className="border-b border-[#F5EDEF] pb-4">
                <h2 className="text-xl font-serif font-bold text-[#3D272A] flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#D96B82]" /> Step 4: Final Order Review
                </h2>
                <p className="text-xs text-[#7A5B62] mt-1">
                  Please verify your details before placing your handmade crochet order.
                </p>
              </div>

              {/* Summary Cards */}
              <div className="space-y-4">
                {/* 1. Customer Details */}
                <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#F0E6E8] flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#D96B82] uppercase tracking-wider">Customer Details</span>
                    <p className="font-semibold text-sm text-[#3D272A] mt-0.5">{draft.customer.name}</p>
                    <p className="text-xs text-[#7A5B62]">+91 {draft.customer.phone} {draft.customer.email ? `• ${draft.customer.email}` : ''}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="text-xs font-semibold text-[#D96B82] hover:underline"
                  >
                    Edit
                  </button>
                </div>

                {/* 2. Delivery Details */}
                <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#F0E6E8] flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#D96B82] uppercase tracking-wider">
                      Delivery: {draft.deliveryMethod === 'vadodara_local' ? '📍 Vadodara Local' : draft.deliveryMethod === 'college' ? '🏫 College Delivery' : '📦 Pan-India Parcel'}
                    </span>
                    {draft.deliveryMethod === 'vadodara_local' && (
                      <p className="text-xs text-[#7A5B62] mt-1">
                        Area: <span className="font-semibold text-[#3D272A]">{draft.localDetails.area}</span> • Date: {draft.localDetails.preferredDate} ({draft.localDetails.preferredTimeSlot})
                      </p>
                    )}
                    {draft.deliveryMethod === 'college' && (
                      <p className="text-xs text-[#7A5B62] mt-1">
                        {draft.collegeDetails.collegeName} • Point: <span className="font-semibold text-[#3D272A]">{draft.collegeDetails.deliveryPoint}</span> • Date: {draft.collegeDetails.preferredDate}
                      </p>
                    )}
                    {draft.deliveryMethod === 'parcel' && (
                      <p className="text-xs text-[#7A5B62] mt-1">
                        {draft.parcelDetails.house}, {draft.parcelDetails.street}, {draft.parcelDetails.city}, {draft.parcelDetails.state} - {draft.parcelDetails.pincode}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="text-xs font-semibold text-[#D96B82] hover:underline"
                  >
                    Edit
                  </button>
                </div>

                {/* 3. Payment Method */}
                <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#F0E6E8] flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#D96B82] uppercase tracking-wider">Payment Method</span>
                    <p className="font-semibold text-sm text-[#3D272A] mt-0.5">
                      {draft.paymentMethod === 'upi' ? 'UPI Payment' : 'Pay on Handover (Cash/UPI)'}
                    </p>
                    {draft.upiTxnRef && (
                      <p className="text-xs text-[#7A5B62]">UTR Ref: {draft.upiTxnRef}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => goToStep(3)}
                    className="text-xs font-semibold text-[#D96B82] hover:underline"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Items Mini Table */}
              <div className="border border-[#F0E6E8] rounded-xl overflow-hidden">
                <div className="bg-[#FFF0F3] px-4 py-2.5 text-xs font-bold text-[#3D272A] uppercase tracking-wider">
                  Ordered Creations ({cart.length})
                </div>
                <div className="divide-y divide-[#F5EDEF] max-h-60 overflow-y-auto">
                  {cart.map((item: CartItem) => (
                    <div key={item.id} className="p-3 flex items-center gap-3">
                      <img
                        src={item.product?.images?.[0] || '/images/keychains/tulip_pink_duo.jpg'}
                        alt={item.product?.name}
                        className="w-12 h-12 rounded-lg object-cover bg-[#FFE3E8]/30 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-[#3D272A] truncate">{item.product?.name}</h4>
                        <p className="text-[11px] text-[#7A5B62]">
                          {item.selectedColor ? `Color: ${item.selectedColor}` : ''}
                          {item.customNote ? ` • Note: "${item.customNote}"` : ''}
                        </p>
                        <span className="text-xs font-bold text-[#D96B82]">
                          {formatPaise(item.priceAtAdd)} × {item.quantity}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[#3D272A]">
                        {formatPaise(item.priceAtAdd * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#7A5B62]">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-[#D96B82]"
                  />
                  <span>
                    I understand each BloomCraft creation is 100% handcrafted with care. I agree with the cancellation & handmade craft guidelines.
                  </span>
                </label>
                {errors.terms && <p className="text-xs text-red-500 mt-1">{errors.terms}</p>}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className="px-6 py-3 rounded-full border border-[#EBD8DC] text-[#7A5B62] font-medium hover:bg-[#FAF8F5] transition-all flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-10 py-4 rounded-full bg-[#D96B82] text-white font-bold text-base hover:bg-[#C0536A] shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Placing Order...
                    </span>
                  ) : (
                    <>
                      Place Order ({formatPaise(pricing.total)}) 🌸
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: STICKY ORDER SUMMARY */}
        <div className="lg:col-span-5 bg-[#FAF8F5] rounded-2xl p-6 border border-[#F0E6E8] lg:sticky lg:top-24">
          <h3 className="font-serif font-bold text-lg text-[#3D272A] pb-3 border-b border-[#EBD8DC] flex items-center justify-between">
            <span>Order Summary</span>
            <span className="text-xs font-sans font-semibold text-[#D96B82] bg-[#FFF0F3] px-2.5 py-1 rounded-full">
              {cart.length} item{cart.length !== 1 ? 's' : ''}
            </span>
          </h3>

          <div className="py-4 space-y-2.5 text-sm text-[#7A5B62] border-b border-[#EBD8DC]">
            <div className="flex justify-between">
              <span>Items Subtotal</span>
              <span className="font-medium text-[#3D272A]">{formatPaise(pricing.subtotal)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span>Delivery / Shipping</span>
              <span className={`font-semibold ${pricing.delivery === 0 ? 'text-[#0A7B3E]' : 'text-[#3D272A]'}`}>
                {pricing.delivery === 0 ? 'FREE' : formatPaise(pricing.delivery)}
              </span>
            </div>

            {pricing.giftWrap > 0 && (
              <div className="flex justify-between items-center text-[#D96B82]">
                <span className="flex items-center gap-1"><Gift className="w-3.5 h-3.5" /> Gift Wrapping Box</span>
                <span className="font-medium">{formatPaise(pricing.giftWrap)}</span>
              </div>
            )}

            {pricing.discount > 0 && (
              <div className="flex justify-between items-center text-[#0A7B3E]">
                <span>Discount ({appliedCoupon?.code})</span>
                <span className="font-medium">-{formatPaise(pricing.discount)}</span>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-between items-baseline">
            <div>
              <span className="text-xs text-[#A38B90] block uppercase font-bold tracking-wider">Total Payable</span>
              <span className="text-2xl font-bold font-serif text-[#3D272A]">{formatPaise(pricing.total)}</span>
            </div>
            <span className="text-xs text-[#7A5B62]">All taxes & box included</span>
          </div>

          <div className="mt-6 pt-4 border-t border-[#EBD8DC] flex items-center gap-3 text-xs text-[#7A5B62]">
            <ShieldCheck className="w-5 h-5 text-[#0A7B3E] shrink-0" />
            <span>Handmade locally in Vadodara with 100% premium milk cotton yarn.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
