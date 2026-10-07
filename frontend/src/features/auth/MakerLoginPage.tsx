import React from 'react';
import { FounderCredit } from '../../components/layout/FounderCredit';
import { SocialLinks } from '../../components/SocialIcons';
import { Sparkles, ArrowLeft, ShieldCheck, Package, Boxes } from 'lucide-react';
import type { AuthUser } from '../../context/AuthContext';
import { AuthForm } from './AuthForm';
import { useToast } from '../../context/ToastContext';
import { siteConfig } from '../../config/site.config';

interface MakerLoginPageProps {
  onLoginSuccess: () => void;
  onBackToWelcome: () => void;
}

export const MakerLoginPage: React.FC<MakerLoginPageProps> = ({
  onLoginSuccess,
  onBackToWelcome,
}) => {
  const { showToast } = useToast();

  const handleSuccess = (user: AuthUser) => {
    showToast(`Welcome back, ${user.name.split(' ')[0]}! 🌸`, 'Opening your Maker Studio…', 'success');
    onLoginSuccess();
  };


  return (
    <div className="min-h-screen w-full bg-[#FAF8F5] text-[#3D272A] relative flex flex-col justify-between overflow-x-hidden selection:bg-[#FFE3E8] selection:text-[#C0536A]">
      {/* Background Ambient Tones */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-[#FFE3E8]/70 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#3D272A]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header with Back Button */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between border-b border-[#F4A6B7]/20">
        <button
          onClick={onBackToWelcome}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#7A5B62] hover:text-[#3D272A] transition-colors py-1.5 px-3 rounded-full hover:bg-white/80"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Role Selection</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#3D272A] text-[#FFE3E8] flex items-center justify-center text-xs font-bold shadow-xs">
            🌸
          </div>
          <span className="font-serif text-lg font-bold tracking-wide text-[#3D272A]">
            {siteConfig.name} <span className="text-xs font-sans text-[#C0536A] uppercase font-bold tracking-wider ml-1">Studio</span>
          </span>
        </div>

        <div className="text-[11px] text-[#A4838B] font-semibold tracking-wider uppercase hidden sm:block">
          Artisan Portal
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Panel: Maker Workspace & Live Operations Showcase (5 cols on lg) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between space-y-6">
            <div className="relative rounded-3xl overflow-hidden border border-[#3D272A]/15 shadow-xl bg-white">
              <img
                src="/intro/landscape-2.jpg"
                alt="Maker crochet workspace with hooks and yarn skeins"
                className="w-full h-80 object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#201014]/85 via-[#201014]/25 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white space-y-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] uppercase tracking-wider font-semibold text-[#FFE3E8]">
                  <Sparkles className="w-3 h-3 text-[#FFE3E8]" /> Maker Studio Operations
                </span>
                <h3 className="font-serif text-2xl font-bold">
                  Your craft, your shop.
                </h3>
                <p className="text-xs text-[#FFE3E8]/90 font-light">
                  Track live orders, quote custom requests, and keep your Vadodara drops on schedule.
                </p>
              </div>
            </div>

            {/* Studio Tools Highlights */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-white/70 border border-[#F4A6B7]/25 backdrop-blur-sm space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#3D272A]">
                  <Package className="w-3.5 h-3.5 text-[#C0536A]" />
                  <span>Orders Pipeline</span>
                </div>
                <p className="text-[10px] text-[#7A5B62]">
                  New, in-progress & dispatched stages.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/70 border border-[#F4A6B7]/25 backdrop-blur-sm space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#3D272A]">
                  <Boxes className="w-3.5 h-3.5 text-[#C0536A]" />
                  <span>Catalog & Stock</span>
                </div>
                <p className="text-[10px] text-[#7A5B62]">
                  Prices, availability & batch controls.
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel: Maker Login Form Card (7 cols on lg) */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-[#3D272A]/15 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-5">
              
              {/* Form Heading */}
              <div className="text-center space-y-1.5">
                <div className="w-11 h-11 rounded-2xl bg-[#3D272A] text-[#FFE3E8] flex items-center justify-center text-xl mx-auto shadow-xs">
                  ✨
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D272A]">
                  Welcome back, Maker.
                </h2>
                <p className="text-xs sm:text-sm text-[#7A5B62]">
                  Your creations, your customers, your little business.
                </p>
              </div>

              <AuthForm audience="maker" onSuccess={handleSuccess} />


              {/* Security Footnote */}
              <div className="pt-2 flex items-center justify-center gap-1.5 text-[10px] text-[#A4838B]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#3D272A]" />
                <span>Protected Maker Management Gateway</span>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-[#A4838B] border-t border-[#F4A6B7]/20">
        <SocialLinks size="sm" className="justify-center mb-2" />
        <p>© {new Date().getFullYear()} {siteConfig.name} • Maker Studio Administration</p>
        <FounderCredit className="mt-1" />
      </footer>
    </div>
  );
};

export default MakerLoginPage;
