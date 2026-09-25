import { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { IntroSplash } from './components/IntroSplash';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CategoryCards } from './components/CategoryCards';
import { CraftStory } from './components/CraftStory';
import { LocalVadodaraSection } from './components/LocalVadodaraSection';
import { KeychainsPage } from './components/KeychainsPage';
import { BouquetsPage } from './components/BouquetsPage';
import { CustomizePage } from './components/CustomizePage';
import { CheckoutFlow } from './components/checkout/CheckoutFlow';
import { OrderConfirmationPage } from './components/order/OrderConfirmationPage';
import { ReceiptView } from './components/receipt/ReceiptView';
import { TrackOrderPage } from './components/order/TrackOrderPage';
import { OrdersHistoryPage } from './components/order/OrdersHistoryPage';
import { WishlistPage } from './components/WishlistPage';
import { PolicyPages } from './components/policy/PolicyPages';
import { DashboardLayout } from './components/Dashboard';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { ProductModal } from './components/ProductModal';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { Footer } from './components/Footer';
import type { Product, Order, DeliveryMethod } from './types';

const INTRO_STORAGE_KEY = 'bloomcraft_intro_shown_v1';

export function AppContent() {
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return !sessionStorage.getItem(INTRO_STORAGE_KEY);
    } catch {
      return true;
    }
  });

  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [checkoutInitialMethod, setCheckoutInitialMethod] = useState<DeliveryMethod | undefined>(undefined);
  const [trackInitialId, setTrackInitialId] = useState<string | undefined>(undefined);

  const handleSplashComplete = () => {
    try {
      sessionStorage.setItem(INTRO_STORAGE_KEY, 'true');
    } catch {
      // sessionStorage ignored in sandboxed environments
    }
    setShowSplash(false);
  };

  // Check URL query params on load (e.g. ?method=vadodara_local)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const method = params.get('method');
      if (method === 'vadodara_local' || method === 'college' || method === 'parcel') {
        setCheckoutInitialMethod(method as DeliveryMethod);
        setActiveTab('checkout');
      }
    } catch {
      // ignore
    }
  }, []);

  // Listen for custom navigation events
  useEffect(() => {
    const handleCustomNav = (e: any) => {
      if (e.detail) {
        if (typeof e.detail === 'string') {
          setActiveTab(e.detail);
        } else if (e.detail.tab) {
          setActiveTab(e.detail.tab);
          if (e.detail.method) setCheckoutInitialMethod(e.detail.method);
          if (e.detail.order) setActiveOrder(e.detail.order);
          if (e.detail.orderId) setTrackInitialId(e.detail.orderId);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('nav-to', handleCustomNav);
    return () => window.removeEventListener('nav-to', handleCustomNav);
  }, []);

  // If in Dashboard View, render the Maker Studio space
  if (activeTab === 'dashboard') {
    return (
      <DashboardLayout
        onExitDashboard={() => {
          setActiveTab('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#3D272A] relative selection:bg-[#FFE3E8] selection:text-[#C0536A]">
      {/* 1. Opening Animation (Preserved exactly as requested) */}
      {showSplash && (
        <IntroSplash onComplete={handleSplashComplete} />
      )}

      {/* Main Website Structure */}
      <div className={`flex flex-col min-h-screen transition-opacity duration-700 ${showSplash ? 'opacity-0' : 'opacity-100'}`}>
        
        {/* Sticky Navbar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onReplaySplash={() => {
            window.scrollTo({ top: 0, behavior: 'instant' });
            setShowSplash(true);
          }}
        />

        {/* Dynamic Pages / Views */}
        <main className="flex-1">
          {/* A. HOMEPAGE */}
          {activeTab === 'home' && (
            <div>
              {/* Hero Section */}
              <Hero
                onShopNow={() => {
                  setActiveTab('keychains');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onCustomize={() => {
                  setActiveTab('customize');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />

              {/* Category Highlights */}
              <CategoryCards
                onSelectCategory={(category) => {
                  setActiveTab(category);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />

              {/* Vadodara & College Delivery Experience Section */}
              <LocalVadodaraSection
                onSelectLocalPickup={() => {
                  setCheckoutInitialMethod('vadodara_local');
                  setActiveTab('checkout');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onSelectCollegeDelivery={() => {
                  setCheckoutInitialMethod('college');
                  setActiveTab('checkout');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />

              {/* Craft Story & Customer Reviews */}
              <CraftStory
                onSelectProduct={(product) => setSelectedProduct(product as any)}
                onNavigate={(tab) => {
                  setActiveTab(tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          )}

          {/* B. KEYCHAINS PAGE */}
          {activeTab === 'keychains' && (
            <KeychainsPage
              onSelectProduct={(product) => setSelectedProduct(product)}
            />
          )}

          {/* C. BOUQUETS PAGE */}
          {activeTab === 'bouquets' && (
            <BouquetsPage
              onSelectProduct={(product) => setSelectedProduct(product)}
              onNavigateCustomize={() => {
                setActiveTab('customize');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {/* D. CUSTOMIZE PAGE */}
          {activeTab === 'customize' && (
            <CustomizePage />
          )}

          {/* E. CHECKOUT MULTI-STEP FLOW */}
          {activeTab === 'checkout' && (
            <CheckoutFlow
              initialMethod={checkoutInitialMethod}
              onOrderSuccess={(order) => {
                setActiveOrder(order);
                setActiveTab('order-confirmation');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onBackToShop={() => {
                setActiveTab('keychains');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {/* F. ORDER CONFIRMATION */}
          {activeTab === 'order-confirmation' && activeOrder && (
            <OrderConfirmationPage
              order={activeOrder}
              onViewReceipt={(order) => {
                setActiveOrder(order);
                setActiveTab('receipt');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onContinueShopping={() => {
                setActiveTab('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onTrackOrder={(orderId) => {
                setTrackInitialId(orderId);
                setActiveTab('track');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {/* G. OFFICIAL RECEIPT (PRINT / PDF) */}
          {activeTab === 'receipt' && activeOrder && (
            <ReceiptView
              order={activeOrder}
              onBack={() => {
                setActiveTab('order-confirmation');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {/* H. TRACK ORDER PAGE */}
          {activeTab === 'track' && (
            <TrackOrderPage
              initialOrderId={trackInitialId}
              onViewReceipt={(order) => {
                setActiveOrder(order);
                setActiveTab('receipt');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onShopNow={() => {
                setActiveTab('keychains');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {/* I. ORDERS HISTORY */}
          {activeTab === 'orders' && (
            <OrdersHistoryPage
              onSelectOrder={(order) => {
                setTrackInitialId(order.id);
                setActiveTab('track');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onViewReceipt={(order) => {
                setActiveOrder(order);
                setActiveTab('receipt');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onShopNow={() => {
                setActiveTab('keychains');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {/* J. WISHLIST PAGE */}
          {activeTab === 'wishlist' && (
            <WishlistPage
              onSelectProduct={(product) => setSelectedProduct(product)}
              onShopNow={() => {
                setActiveTab('keychains');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {/* K. POLICIES & STUDIO INFO */}
          {activeTab === 'policies' && (
            <PolicyPages
              onBackToShop={() => {
                setActiveTab('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
        </main>

        {/* Global Drawers & Modals */}
        <CartDrawer
          onNavigateCheckout={() => {
            setActiveTab('checkout');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
        <WishlistDrawer />
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />

        {/* Floating WhatsApp Button */}
        <FloatingWhatsApp />

        {/* Footer */}
        <Footer
          onNavigate={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onReplaySplash={() => {
            window.scrollTo({ top: 0, behavior: 'instant' });
            setShowSplash(true);
          }}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <CartProvider>
        <WishlistProvider>
          <AppContent />
        </WishlistProvider>
      </CartProvider>
    </ToastProvider>
  );
}
