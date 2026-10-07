import { useState, useEffect, lazy, Suspense } from 'react';
import { ToastProvider, useToast } from '../context/ToastContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import { CatalogProvider } from '../context/CatalogContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { SetupNotice } from '../components/feedback/SetupNotice';
import { NewPasswordModal } from '../features/auth/NewPasswordModal';
import { IntroSplash } from '../features/intro/IntroSplash';
import { AuthExperience } from '../features/auth/AuthExperience';
import { CustomerWelcomeAnimation } from '../features/auth/CustomerWelcomeAnimation';
import { HomePage } from '../features/shop/HomePage';
import { Navbar } from '../components/layout/Navbar';
import { CartDrawer } from '../features/cart/CartDrawer';
import { WishlistDrawer } from '../features/wishlist/WishlistDrawer';
import { ProductModal } from '../features/shop/ProductModal';
import { FloatingWhatsApp } from '../components/layout/FloatingWhatsApp';
import { Footer } from '../components/layout/Footer';
import { ErrorBoundary } from '../components/feedback/ErrorBoundary';
import { OfflineBanner } from '../components/feedback/OfflineBanner';
import { PageLoader } from '../components/feedback/PageLoader';

// Pages other than home and sign-in load on demand to keep the first visit fast.
const KeychainsPage = lazy(() => import('../features/shop/KeychainsPage').then((m) => ({ default: m.KeychainsPage })));
const BouquetsPage = lazy(() => import('../features/shop/BouquetsPage').then((m) => ({ default: m.BouquetsPage })));
const CustomizePage = lazy(() => import('../features/custom/CustomizePage').then((m) => ({ default: m.CustomizePage })));
const CheckoutFlow = lazy(() => import('../features/checkout/CheckoutFlow').then((m) => ({ default: m.CheckoutFlow })));
const OrderConfirmationPage = lazy(() => import('../features/orders/OrderConfirmationPage').then((m) => ({ default: m.OrderConfirmationPage })));
const ReceiptView = lazy(() => import('../features/orders/ReceiptView').then((m) => ({ default: m.ReceiptView })));
const TrackOrderPage = lazy(() => import('../features/orders/TrackOrderPage').then((m) => ({ default: m.TrackOrderPage })));
const OrdersHistoryPage = lazy(() => import('../features/orders/OrdersHistoryPage').then((m) => ({ default: m.OrdersHistoryPage })));
const WishlistPage = lazy(() => import('../features/wishlist/WishlistPage').then((m) => ({ default: m.WishlistPage })));
const ProfilePage = lazy(() => import('../features/account/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('../features/account/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const PolicyPages = lazy(() => import('../features/policy/PolicyPages').then((m) => ({ default: m.PolicyPages })));
const DashboardLayout = lazy(() => import('../features/dashboard').then((m) => ({ default: m.DashboardLayout })));
import type { Product, Order, DeliveryMethod } from '../types';

export function AppContent() {
  const { isAuthenticated, isMaker, logout, loading: authLoading, passwordRecovery } = useAuth();
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

  // Signed-in visitors never see the login screen again: once the saved session is restored,
  // skip straight to the shop (or the studio for the maker).
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    setActiveTab((tab) => (tab === 'auth' || tab === 'login' ? (isMaker ? 'dashboard' : 'home') : tab));
  }, [authLoading, isAuthenticated, isMaker]);

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
  const sessionLoader = <PageLoader fullScreen label="Signing you in…" />;

  if ((activeTab === 'auth' || activeTab === 'login' || activeTab === 'dashboard') && authLoading) {
    return (
      <>
        {showSplash && <IntroSplash onComplete={handleSplashComplete} />}
        {sessionLoader}
      </>
    );
  }

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
          <ErrorBoundary resetKey={activeTab}>
          <Suspense fallback={<PageLoader fullScreen label="Opening Maker Studio…" />}>
          <DashboardLayout
            onExitDashboard={() => {
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onLogout={() => {
              void logout();
              setActiveTab('auth');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
          </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#3D272A] relative selection:bg-[#FFE3E8] selection:text-[#C0536A]">
      <OfflineBanner />

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
          <ErrorBoundary resetKey={activeTab}>
          <Suspense fallback={<PageLoader />}>
          {/* A. COMPLETE CUSTOMER DASHBOARD (Handmade Crochet Boutique Experience) */}
          {activeTab === 'home' && (
            <HomePage
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

          {/* PROFILE & SETTINGS (signed-in customers) */}
          {(activeTab === 'profile' || activeTab === 'settings') && !isAuthenticated && !authLoading && (
            <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
              <h2 className="text-2xl font-serif font-bold text-[#3D272A]">Sign in to see your profile</h2>
              <button
                onClick={() => setActiveTab('auth')}
                className="px-8 py-3 rounded-full bg-[#D96B82] text-white font-medium hover:bg-[#C0536A]"
              >
                Sign In
              </button>
            </div>
          )}
          {activeTab === 'profile' && isAuthenticated && (
            <ProfilePage
              onNavigate={(tab) => {
                setActiveTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
          {activeTab === 'settings' && isAuthenticated && (
            <SettingsPage
              onNavigate={(tab) => {
                setActiveTab(tab);
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
          </Suspense>
          </ErrorBoundary>
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

        {passwordRecovery && <NewPasswordModal />}

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
  if (!isSupabaseConfigured) return <SetupNotice />;
  return (
    <ToastProvider>
      <AuthProvider>
        <CatalogProvider>
          <CartProvider>
            <WishlistProvider>
              <AppContent />
            </WishlistProvider>
          </CartProvider>
        </CatalogProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
