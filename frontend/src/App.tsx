import { useState, useEffect } from 'react';
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { IntroSplash } from './components/IntroSplash';
import { AuthExperience } from './components/auth/AuthExperience';
import { CustomerWelcomeAnimation } from './components/customer/CustomerWelcomeAnimation';
import { CustomerDashboard } from './components/customer/CustomerDashboard';
import { Navbar } from './components/Navbar';
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

export function AppContent() {
  const { isAuthenticated, isMaker, logout } = useAuth();
  const { showToast } = useToast();
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [showCustomerWelcome, setShowCustomerWelcome] = useState<boolean>(false);

  // Default initial landing view after intro animation is the Welcome Role Selection
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (isAuthenticated) {
      return isMaker ? 'dashboard' : 'home';
    }
    return 'auth';
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [checkoutInitialMethod, setCheckoutInitialMethod] = useState<DeliveryMethod | undefined>(undefined);
  const [trackInitialId, setTrackInitialId] = useState<string | undefined>(undefined);

  const handleSplashComplete = () => {
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

  // Welcome / Authentication Landing Experience (Choose Your Experience)
  if (activeTab === 'auth' || activeTab === 'login') {
    return (
      <div className="min-h-screen bg-[#FAF8F5]">
        {showSplash && (
          <IntroSplash onComplete={handleSplashComplete} />
        )}
        <div className={`transition-opacity duration-500 ${showSplash ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <AuthExperience
            initialView="welcome"
            onCustomerLoginSuccess={() => {
              setShowCustomerWelcome(true);
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onMakerLoginSuccess={() => {
              setActiveTab('dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onExploreStore={() => {
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      </div>
    );
  }

  // Maker Studio Dashboard (Protected Route: Maker only)
  if (activeTab === 'dashboard') {
    if (!isAuthenticated || !isMaker) {
      return (
        <div className="min-h-screen bg-[#FAF8F5]">
          {showSplash && (
            <IntroSplash onComplete={handleSplashComplete} />
          )}
          <div className={`transition-opacity duration-500 ${showSplash ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <AuthExperience
              initialView="maker-login"
              onCustomerLoginSuccess={() => {
                setShowCustomerWelcome(true);
                setActiveTab('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onMakerLoginSuccess={() => {
                setActiveTab('dashboard');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onExploreStore={() => {
                setActiveTab('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#FAF8F5]">
        {showSplash && (
          <IntroSplash onComplete={handleSplashComplete} />
        )}
        <div className={`transition-opacity duration-500 ${showSplash ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <DashboardLayout
            onExitDashboard={() => {
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onLogout={() => {
              logout();
              setActiveTab('auth');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#3D272A] relative selection:bg-[#FFE3E8] selection:text-[#C0536A]">
      {/* 1. Opening Brand Film Animation */}
      {showSplash && (
        <IntroSplash onComplete={handleSplashComplete} />
      )}

      {/* 2. Customer Post-Login Welcome Animation */}
      {showCustomerWelcome && (
        <CustomerWelcomeAnimation onComplete={() => setShowCustomerWelcome(false)} />
      )}

      {/* Main Website Structure */}
      <div className={`flex flex-col min-h-screen transition-opacity duration-700 ${showSplash ? 'opacity-0' : 'opacity-100'}`}>
        
        {/* Sticky Navbar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            // Guard against customer switching to dashboard
            if (tab === 'dashboard' && (!isAuthenticated || !isMaker)) {
              showToast('Maker Studio Protected', 'Please log in with your Maker account to access the studio.', 'info');
              setActiveTab('auth');
              return;
            }
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenLogin={() => {
            setActiveTab('auth');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onReplaySplash={() => {
            window.scrollTo({ top: 0, behavior: 'instant' });
            setShowSplash(true);
          }}
        />

        {/* Dynamic Pages / Views */}
        <main className="flex-1">
          {/* A. COMPLETE CUSTOMER DASHBOARD (Handmade Crochet Boutique Experience) */}
          {activeTab === 'home' && (
            <CustomerDashboard
              onSelectProduct={(product) => setSelectedProduct(product)}
              onNavigateOrderHistory={() => {
                setActiveTab('orders');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateTrackOrder={() => {
                setActiveTab('track');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigatePolicies={() => {
                setActiveTab('policies');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onReplayWelcome={() => setShowCustomerWelcome(true)}
            />
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

        {/* Footer (for non-home subpages) */}
        {activeTab !== 'home' && (
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
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <AppContent />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
