import React, { useState } from 'react';
import { SocialLinks } from '../SocialIcons';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Package, 
  Heart, 
  Flower2, 
  LayoutDashboard,
  Store
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { siteConfig } from '../../config/site.config';

interface LandingLoginPageProps {
  onLoginSuccess: () => void;
  onExploreStore: () => void;
}

export const LandingLoginPage: React.FC<LandingLoginPageProps> = ({
  onLoginSuccess,
  onExploreStore,
}) => {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'maker' | 'customer'>('maker');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Please Enter Email', 'Provide your email ID to log in to the dashboard.', 'info');
      return;
    }

    setIsLoading(true);

    // Simulate snappy authentication
    setTimeout(() => {
      const derivedName = email.includes('vidhi') 
        ? 'Vidhi Singh' 
        : activeTab === 'maker' 
          ? 'Studio Maker' 
          : 'Valued Customer';

      login(email.trim(), derivedName, activeTab === 'maker' ? 'maker' : 'customer');
      setIsLoading(false);
      showToast(
        `Welcome Back, ${derivedName}! 🌸`,
        activeTab === 'maker' ? 'Opening Maker Studio Dashboard...' : 'Opening your BloomCraft Account...',
        'success'
      );
      onLoginSuccess();
    }, 450);
  };

  const handleQuickDemoMaker = () => {
    setEmail('vidhi@bloomcraft.com');
    setPassword('studio2026');
    setActiveTab('maker');
    setIsLoading(true);

    setTimeout(() => {
      login('vidhi@bloomcraft.com', 'Vidhi Singh', 'maker');
      setIsLoading(false);
      showToast('Welcome Back, Vidhi! 🌸', 'Opening Maker Studio Dashboard...', 'success');
      onLoginSuccess();
    }, 400);
  };

  const handleQuickDemoCustomer = () => {
    setEmail('sonal.raj@gmail.com');
    setPassword('customer123');
    setActiveTab('customer');
    setIsLoading(true);

    setTimeout(() => {
      login('sonal.raj@gmail.com', 'Sonal Raj', 'customer');
      setIsLoading(false);
      showToast('Welcome, Sonal! 🌸', 'Opening BloomCraft Dashboard...', 'success');
      onLoginSuccess();
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF8F5] text-[#3D272A] relative flex flex-col justify-between overflow-x-hidden selection:bg-[#FFE3E8] selection:text-[#C0536A]">
      {/* Background Decorative Ambient Blurs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FFE3E8]/60 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#F4A6B7]/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-10 w-72 h-72 bg-[#FFF0F3]/80 rounded-full blur-2xl pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between border-b border-[#F4A6B7]/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FFE3E8] to-[#FFF0F3] border border-[#F4A6B7]/40 flex items-center justify-center text-xl shadow-sm">
            🌸
          </div>
          <div>
            <span className="font-serif text-2xl font-bold tracking-tight text-[#3D272A] block leading-none">
              {siteConfig.name}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[#A4838B] font-semibold block mt-0.5">
              Handmade Crochet Atelier • Vadodara
            </span>
          </div>
        </div>

        {/* Explore Storefront Secondary Button */}
        <button
          onClick={onExploreStore}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-[#7A5B62] bg-white/80 hover:bg-[#FFE3E8] hover:text-[#C0536A] border border-[#EBD8DC] shadow-xs transition-all hover:scale-105"
        >
          <Store className="w-3.5 h-3.5 text-[#C0536A]" />
          <span>Browse Storefront</span>
          <ArrowRight className="w-3 h-3 ml-0.5" />
        </button>
      </header>

      {/* Main Content Area: Split Showcase & Login Card */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Brand Story & Live Studio Highlights (5 cols on lg) */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFE3E8] border border-[#F4A6B7]/40 text-[#C0536A] text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Studio & Maker Portal • Vadodara</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-3">
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#3D272A] leading-tight">
                Where every loop holds a <span className="text-[#C0536A] italic">story</span>.
              </h1>
              <p className="text-sm sm:text-base text-[#7A5B62] leading-relaxed max-w-lg">
                Log in to access your <strong>Maker Studio Dashboard</strong> to manage live customer orders, custom crochet bouquets, MSU campus deliveries, and artisan inventory.
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="p-3.5 rounded-2xl bg-white/75 border border-[#F4A6B7]/25 shadow-xs backdrop-blur-sm space-y-1">
                <div className="flex items-center gap-2 text-[#C0536A] font-semibold text-xs">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Live Studio Hub</span>
                </div>
                <p className="text-[11px] text-[#7A5B62] leading-snug">
                  Real-time order pipeline, stage updates & revenue analytics.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/75 border border-[#F4A6B7]/25 shadow-xs backdrop-blur-sm space-y-1">
                <div className="flex items-center gap-2 text-[#C0536A] font-semibold text-xs">
                  <Flower2 className="w-4 h-4" />
                  <span>Custom Bouquets</span>
                </div>
                <p className="text-[11px] text-[#7A5B62] leading-snug">
                  Manage custom yarn flower stem quotes & special requests.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/75 border border-[#F4A6B7]/25 shadow-xs backdrop-blur-sm space-y-1">
                <div className="flex items-center gap-2 text-[#C0536A] font-semibold text-xs">
                  <Package className="w-4 h-4" />
                  <span>Vadodara Local Hub</span>
                </div>
                <p className="text-[11px] text-[#7A5B62] leading-snug">
                  MSU campus drops, direct hostel deliveries & speed parcel.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/75 border border-[#F4A6B7]/25 shadow-xs backdrop-blur-sm space-y-1">
                <div className="flex items-center gap-2 text-[#C0536A] font-semibold text-xs">
                  <Heart className="w-4 h-4" />
                  <span>Artisan Craft</span>
                </div>
                <p className="text-[11px] text-[#7A5B62] leading-snug">
                  100% handcrafted crochet pieces that never wilt or fade.
                </p>
              </div>
            </div>

            {/* Quick quote banner */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FFE3E8]/50 border border-[#F4A6B7]/30 text-xs text-[#7A5B62]">
              <span className="text-xl">🌸</span>
              <p className="italic">
                "Handcrafted slowly with love, one stitch at a time in Vadodara."
              </p>
            </div>
          </div>

          {/* Right Column: Luxury Glassmorphism Login Card (6 cols on lg) */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-[#F4A6B7]/40 shadow-2xl rounded-3xl p-6 sm:p-8 relative transition-all">
              
              {/* Top Card Badge & Title */}
              <div className="text-center space-y-1.5 pb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FFE3E8] to-[#FFF0F3] border border-[#F4A6B7]/50 flex items-center justify-center text-2xl mx-auto shadow-xs">
                  ✨
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D272A]">
                  Welcome to BloomCraft
                </h2>
                <p className="text-xs sm:text-sm text-[#7A5B62]">
                  Sign in with your email to access the dashboard
                </p>
              </div>

              {/* Tab Selector: Maker vs Customer */}
              <div className="flex rounded-2xl bg-[#FAF8F5] p-1 border border-[#EBD8DC] mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('maker');
                    if (!email) setEmail('vidhi@bloomcraft.com');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'maker'
                      ? 'bg-white text-[#C0536A] shadow-xs'
                      : 'text-[#7A5B62] hover:text-[#3D272A]'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Maker / Studio</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('customer');
                    if (!email || email.includes('vidhi')) setEmail('sonal.raj@gmail.com');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'customer'
                      ? 'bg-white text-[#C0536A] shadow-xs'
                      : 'text-[#7A5B62] hover:text-[#3D272A]'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>Customer Account</span>
                </button>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Input Field */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-[#5C3E45] flex items-center justify-between">
                    <span>Email Address</span>
                    <span className="text-[10px] text-[#A4838B] font-normal">Any email ID works</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A4838B]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={activeTab === 'maker' ? 'vidhi@bloomcraft.com' : 'sonal.raj@gmail.com'}
                      className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-[#EBD8DC] focus:border-[#C0536A] focus:ring-2 focus:ring-[#FFE3E8] text-xs sm:text-sm text-[#3D272A] placeholder-[#B59DA3] outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Password Input Field */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#5C3E45]">Password</label>
                    <button
                      type="button"
                      onClick={() => showToast('Demo Mode', 'You can enter any password or use the 1-click login buttons below.', 'info')}
                      className="text-[11px] text-[#C0536A] hover:underline font-medium"
                    >
                      Forgot?
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
                      className="w-full pl-10 pr-10 py-2.5 bg-white rounded-xl border border-[#EBD8DC] focus:border-[#C0536A] focus:ring-2 focus:ring-[#FFE3E8] text-xs sm:text-sm text-[#3D272A] placeholder-[#B59DA3] outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#A4838B] hover:text-[#3D272A]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between text-xs text-[#7A5B62] pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[#EBD8DC] text-[#C0536A] focus:ring-[#FFE3E8] w-4 h-4 accent-[#C0536A]"
                    />
                    <span>Remember my studio session</span>
                  </label>
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#C0536A] to-[#D96B82] hover:from-[#AD4258] hover:to-[#C0536A] text-white text-sm font-bold shadow-md shadow-[#C0536A]/25 hover:shadow-lg hover:shadow-[#C0536A]/35 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-75"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In & Open Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* 1-Click Fast Demo Logins */}
              <div className="mt-5 pt-4 border-t border-[#F4A6B7]/20 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#A4838B] block text-center">
                  ⚡ 1-Click Instant Demo Login
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleQuickDemoMaker}
                    className="w-full py-2 px-3 rounded-xl bg-[#FFE3E8]/80 hover:bg-[#FFE3E8] border border-[#F4A6B7]/40 text-[#C0536A] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>🌸 Maker (Vidhi)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickDemoCustomer}
                    className="w-full py-2 px-3 rounded-xl bg-[#FAF8F5] hover:bg-[#FFF0F3] border border-[#EBD8DC] text-[#7A5B62] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>✨ Customer (Sonal)</span>
                  </button>
                </div>
              </div>

              {/* Security Badge Footer */}
              <div className="mt-4 pt-3 flex items-center justify-center gap-1.5 text-[10px] text-[#A4838B]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C0536A]" />
                <span>Secure Studio Login • BloomCraft Vadodara</span>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 py-4 text-center text-xs text-[#A4838B] border-t border-[#F4A6B7]/20">
        <SocialLinks size="sm" className="justify-center mb-2" />
        <p>© 2026 {siteConfig.name} • Vadodara Handmade Crochet Studio • Designed with 🌸</p>
      </footer>
    </div>
  );
};

export default LandingLoginPage;
