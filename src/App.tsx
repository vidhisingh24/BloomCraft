import { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { IntroSplash } from './components/IntroSplash';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CategoryCards } from './components/CategoryCards';
import { CraftStory } from './components/CraftStory';
import { KeychainsPage } from './components/KeychainsPage';
import { BouquetsPage } from './components/BouquetsPage';
import { CustomizePage } from './components/CustomizePage';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { ProductModal } from './components/ProductModal';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { Footer } from './components/Footer';
import type { Product } from './data/products';

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

  const handleSplashComplete = () => {
    try {
      sessionStorage.setItem(INTRO_STORAGE_KEY, 'true');
    } catch {
      // sessionStorage unavailable/ignored in sandboxed environments
    }
    setShowSplash(false);
  };

  // Listen for custom navigation events
  useEffect(() => {
    const handleCustomNav = (e: any) => {
      if (e.detail) {
        setActiveTab(e.detail);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('nav-to', handleCustomNav);
    return () => window.removeEventListener('nav-to', handleCustomNav);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#3D272A] relative selection:bg-[#FFE3E8] selection:text-[#C0536A]">
      {/* 1. Opening Animation (Rose Petals + Brand Reveal + Crochet Story) */}
      {showSplash && (
        <IntroSplash onComplete={handleSplashComplete} />
      )}

      {/* Main Website Structure */}
      <div className={`flex flex-col min-h-screen transition-opacity duration-700 ${showSplash ? 'opacity-0' : 'opacity-100'}`}>
        
        {/* Sticky Navbar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onReplaySplash={() => {
            window.scrollTo({ top: 0, behavior: 'instant' });
            setShowSplash(true);
          }}
        />

        {/* Dynamic Pages / Views */}
        <main className="flex-1">
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

              {/* Craft Story & Customer Reviews */}
              <CraftStory
                onSelectProduct={(product) => setSelectedProduct(product)}
                onNavigate={(tab) => {
                  setActiveTab(tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          )}

          {activeTab === 'keychains' && (
            <KeychainsPage
              onSelectProduct={(product) => setSelectedProduct(product)}
            />
          )}

          {activeTab === 'bouquets' && (
            <BouquetsPage
              onSelectProduct={(product) => setSelectedProduct(product)}
              onNavigateCustomize={() => {
                setActiveTab('customize');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {activeTab === 'customize' && (
            <CustomizePage />
          )}
        </main>

        {/* Global Drawers & Modals */}
        <CartDrawer />
        <WishlistDrawer />
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />

        {/* Floating WhatsApp Button */}
        <FloatingWhatsApp />

        {/* Footer */}
        <Footer
          onNavigate={(tab) => setActiveTab(tab)}
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
