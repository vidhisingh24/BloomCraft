import React from 'react';
import { FounderCredit } from '../../components/layout/FounderCredit';
import { SocialLinks } from '../../components/SocialIcons';
import { Heart, ArrowLeft, Sparkles } from 'lucide-react';
import type { AuthUser } from '../../context/AuthContext';
import { AuthForm } from './AuthForm';
import { useToast } from '../../context/ToastContext';
import { siteConfig } from '../../config/site.config';

interface CustomerLoginPageProps {
  onLoginSuccess: () => void;
  onBackToWelcome: () => void;
  onExploreStore: () => void;
}

export const CustomerLoginPage: React.FC<CustomerLoginPageProps> = ({
  onLoginSuccess,
  onBackToWelcome,
  onExploreStore,
}) => {
  const { showToast } = useToast();

  const handleSuccess = (user: AuthUser) => {
    showToast(`Welcome, ${user.name.split(' ')[0]}! 🌸`, 'Your next handmade favourite is waiting for you.', 'success');
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF8F5] text-[#3D272A] relative flex flex-col justify-between overflow-x-hidden selection:bg-[#FFE3E8] selection:text-[#C0536A]">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-10 w-96 h-96 bg-[#FFE3E8]/80 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#F4A6B7]/30 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Back Link and Brand */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between border-b border-[#F4A6B7]/20">
        <button
          onClick={onBackToWelcome}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#7A5B62] hover:text-[#C0536A] transition-colors py-1.5 px-3 rounded-full hover:bg-white/80"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Role Selection</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#FFE3E8] border border-[#F4A6B7]/40 flex items-center justify-center text-sm shadow-xs">
            🌸
          </div>
          <span className="font-serif text-lg font-bold tracking-wide text-[#3D272A]">
            {siteConfig.name}
          </span>
        </div>

        <button
          onClick={onExploreStore}
          className="text-xs font-medium text-[#7A5B62] hover:text-[#C0536A] hover:underline"
        >
          Skip as Guest →
        </button>
      </header>

      {/* Main Container: Split with Product Preview on Laptop & Login Form */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Panel: Customer Boutique Showcase (5 cols on lg, hidden/compact on mobile) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between space-y-6">
            <div className="relative rounded-3xl overflow-hidden border border-[#F4A6B7]/35 shadow-xl bg-white">
              <img
                src="/intro/landscape-4.jpg"
                alt="Handmade crochet flowers and keychains"
                className="w-full h-80 object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2D1B20]/80 via-[#2D1B20]/20 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white space-y-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] uppercase tracking-wider font-semibold text-[#FFE3E8]">
                  <Sparkles className="w-3 h-3 text-[#FFE3E8]" /> Handcrafted with Love
                </span>
                <h3 className="font-serif text-2xl font-bold">
                  Flowers that never fade.
                </h3>
                <p className="text-xs text-[#FFE3E8]/90 font-light">
                  Hand-crocheted daisy keychains, bespoke rose bouquets, and heirloom keepsakes.
                </p>
              </div>
            </div>

            {/* Customer Perks Card */}
            <div className="p-4 rounded-2xl bg-white/70 border border-[#F4A6B7]/25 backdrop-blur-sm space-y-2 text-xs text-[#7A5B62]">
              <div className="flex items-center gap-2 font-semibold text-[#3D272A]">
                <Heart className="w-4 h-4 text-[#C0536A] fill-[#C0536A]" />
                <span>What awaits inside your customer account:</span>
              </div>
              <ul className="space-y-1 pl-6 list-disc text-[11px] text-[#7A5B62]">
                <li>Order tracking for Vadodara campus & courier delivery</li>
                <li>Saved wishlist of favorite tulip & daisy charms</li>
                <li>Direct WhatsApp custom bouquet inquiries</li>
              </ul>
            </div>
          </div>

          {/* Right Panel: Customer Login Form Card (7 cols on lg) */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-[#F4A6B7]/40 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-5">
              
              {/* Form Heading */}
              <div className="text-center space-y-1.5">
                <div className="w-11 h-11 rounded-2xl bg-[#FFE3E8] border border-[#F4A6B7]/40 flex items-center justify-center text-xl mx-auto shadow-xs">
                  🌸
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D272A]">
                  Welcome back, lovely!
                </h2>
                <p className="text-xs sm:text-sm text-[#7A5B62]">
                  Your next handmade favorite is waiting for you.
                </p>
              </div>

              <AuthForm audience="customer" onSuccess={handleSuccess} />


            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-[#A4838B] border-t border-[#F4A6B7]/20">
        <SocialLinks size="sm" className="justify-center mb-2" />
        <p>© {new Date().getFullYear()} {siteConfig.name} • Handmade with 🌸 in Vadodara</p>
        <FounderCredit className="mt-1" />
      </footer>
    </div>
  );
};

export default CustomerLoginPage;
