import React, { useState } from 'react';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft, 
  LayoutDashboard, 
  ShieldCheck, 
  Package, 
  Boxes
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
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
  const { loginMaker } = useAuth();
  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState('vidhi@bloomcraft.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim()) {
      showToast('Please Enter Maker Identifier', 'Provide your studio email or username.', 'info');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const derivedName = identifier.toLowerCase().includes('vidhi') 
        ? 'Vidhi Singh' 
        : 'Studio Maker';

      loginMaker(identifier.trim(), derivedName);
      setIsLoading(false);

      showToast(
        `Welcome Back, ${derivedName}! 🌸`,
        'Opening your Maker Studio Dashboard...',
        'success'
      );
      onLoginSuccess();
    }, 450);
  };

  const handleQuickDemoMaker = () => {
    setIdentifier('vidhi@bloomcraft.com');
    setPassword('maker2026');
    setIsLoading(true);

    setTimeout(() => {
      loginMaker('vidhi@bloomcraft.com', 'Vidhi Singh');
      setIsLoading(false);
      showToast('Welcome Back, Vidhi! 🌸', 'Opening Maker Studio Dashboard...', 'success');
      onLoginSuccess();
    }, 400);
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

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                {/* Identifier Input */}
                <div className="space-y-1 text-left">
                  <label className="text-xs font-semibold text-[#5C3E45]">Maker Email or Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A4838B]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="vidhi@bloomcraft.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-[#EBD8DC] focus:border-[#3D272A] focus:ring-2 focus:ring-[#FFE3E8] text-xs sm:text-sm text-[#3D272A] outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#5C3E45]">Studio Password</label>
                    <button
                      type="button"
                      onClick={() => showToast('Maker Security', 'In demo mode, you can type any password or use the 1-click maker login below.', 'info')}
                      className="text-[11px] text-[#C0536A] hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A4838B]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-white rounded-xl border border-[#EBD8DC] focus:border-[#3D272A] focus:ring-2 focus:ring-[#FFE3E8] text-xs sm:text-sm text-[#3D272A] outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#A4838B] hover:text-[#3D272A]"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between text-xs text-[#7A5B62] pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[#EBD8DC] text-[#3D272A] focus:ring-[#FFE3E8] w-4 h-4 accent-[#3D272A]"
                    />
                    <span>Remember Maker session</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-2xl bg-[#3D272A] hover:bg-[#201014] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#3D272A]/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LayoutDashboard className="w-4 h-4 text-[#FFE3E8]" />
                      <span>Enter Maker Studio</span>
                      <ArrowRight className="w-4 h-4 text-[#FFE3E8]" />
                    </>
                  )}
                </button>
              </form>

              {/* 1-Click Fast Studio Demo Login */}
              <div className="pt-3 border-t border-[#F4A6B7]/20 space-y-2 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#A4838B] block">
                  ⚡ 1-Click Instant Studio Demo
                </span>
                <button
                  type="button"
                  onClick={handleQuickDemoMaker}
                  className="w-full py-2 px-3 rounded-xl bg-[#FFE3E8] hover:bg-[#FFD4DC] border border-[#F4A6B7]/40 text-[#C0536A] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>🌸 1-Click Studio Login (Vidhi - Maker)</span>
                </button>
              </div>

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
        <p>© 2026 {siteConfig.name} • Maker Studio Administration</p>
      </footer>
    </div>
  );
};

export default MakerLoginPage;
