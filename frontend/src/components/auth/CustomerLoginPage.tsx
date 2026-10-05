import React, { useState } from 'react';
import { 
  Heart, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft, 
  ShoppingBag, 
  User, 
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
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
  const { loginCustomer } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim()) {
      showToast('Please Enter Email or Phone', 'Provide your details to continue to the shop.', 'info');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      showToast('Please Enter Your Name', 'Let us know how to address you, lovely!', 'info');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      showToast('Passwords Do Not Match', 'Please check your password and confirmation.', 'info');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const customerName = mode === 'signup' ? name.trim() : (name.trim() || 'Sonal Raj');
      loginCustomer(identifier.trim(), customerName);
      setIsLoading(false);

      showToast(
        `Welcome, ${customerName}! 🌸`,
        mode === 'signup' ? 'Your customer account is ready. Explore our handmade blooms!' : 'Your next handmade favorite is waiting for you.',
        'success'
      );
      onLoginSuccess();
    }, 450);
  };

  const handleQuickDemoCustomer = () => {
    setIdentifier('sonal.raj@gmail.com');
    setName('Sonal Raj');
    setPassword('bloom2026');
    setIsLoading(true);

    setTimeout(() => {
      loginCustomer('sonal.raj@gmail.com', 'Sonal Raj');
      setIsLoading(false);
      showToast('Welcome, Sonal! 🌸', 'Taking you to the BloomCraft boutique...', 'success');
      onLoginSuccess();
    }, 400);
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

              {/* Sign In vs Sign Up Tabs */}
              <div className="flex rounded-2xl bg-[#FAF8F5] p-1 border border-[#EBD8DC]">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    mode === 'signin'
                      ? 'bg-white text-[#C0536A] shadow-xs'
                      : 'text-[#7A5B62] hover:text-[#3D272A]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    mode === 'signup'
                      ? 'bg-white text-[#C0536A] shadow-xs'
                      : 'text-[#7A5B62] hover:text-[#3D272A]'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Authentication Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name field (Only in Sign Up mode) */}
                {mode === 'signup' && (
                  <div className="space-y-1 text-left animate-fadeIn">
                    <label className="text-xs font-semibold text-[#5C3E45]">Your Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A4838B]">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Sonal Raj"
                        className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-[#EBD8DC] focus:border-[#C0536A] focus:ring-2 focus:ring-[#FFE3E8] text-xs sm:text-sm text-[#3D272A] outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Email or Phone field */}
                <div className="space-y-1 text-left">
                  <label className="text-xs font-semibold text-[#5C3E45]">Email or Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A4838B]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. sonal.raj@gmail.com or +91 98765 43210"
                      className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-[#EBD8DC] focus:border-[#C0536A] focus:ring-2 focus:ring-[#FFE3E8] text-xs sm:text-sm text-[#3D272A] outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-1 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#5C3E45]">Password</label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => showToast('Demo Mode', 'You can use any password or click the instant demo button below.', 'info')}
                        className="text-[11px] text-[#C0536A] hover:underline font-medium"
                      >
                        Forgot password?
                      </button>
                    )}
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
                      className="w-full pl-10 pr-10 py-2.5 bg-white rounded-xl border border-[#EBD8DC] focus:border-[#C0536A] focus:ring-2 focus:ring-[#FFE3E8] text-xs sm:text-sm text-[#3D272A] outline-none transition-all"
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

                {/* Confirm Password (Only in Sign Up mode) */}
                {mode === 'signup' && (
                  <div className="space-y-1 text-left animate-fadeIn">
                    <label className="text-xs font-semibold text-[#5C3E45]">Confirm Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A4838B]">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-[#EBD8DC] focus:border-[#C0536A] focus:ring-2 focus:ring-[#FFE3E8] text-xs sm:text-sm text-[#3D272A] outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between text-xs text-[#7A5B62] pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[#EBD8DC] text-[#C0536A] focus:ring-[#FFE3E8] w-4 h-4 accent-[#C0536A]"
                    />
                    <span>Remember my customer session</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-2xl bg-[#C0536A] hover:bg-[#A83D53] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#C0536A]/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>{mode === 'signin' ? 'Sign In & Explore Store' : 'Create Customer Account'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* 1-Click Fast Customer Demo */}
              <div className="pt-3 border-t border-[#F4A6B7]/20 space-y-2 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#A4838B] block">
                  ⚡ 1-Click Fast Demo Login
                </span>
                <button
                  type="button"
                  onClick={handleQuickDemoCustomer}
                  className="w-full py-2 px-3 rounded-xl bg-[#FFE3E8]/80 hover:bg-[#FFE3E8] border border-[#F4A6B7]/40 text-[#C0536A] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>🌸 1-Click Demo (Sonal Raj - Vadodara)</span>
                </button>
              </div>

              {/* Toggle Mode Footer */}
              <div className="text-center pt-2 text-xs text-[#7A5B62]">
                {mode === 'signin' ? (
                  <p>
                    New to Bloomcraft?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="font-bold text-[#C0536A] hover:underline"
                    >
                      Create an account
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signin')}
                      className="font-bold text-[#C0536A] hover:underline"
                    >
                      Sign In here
                    </button>
                  </p>
                )}
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-[#A4838B] border-t border-[#F4A6B7]/20">
        <p>© 2026 {siteConfig.name} • Handmade with 🌸 in Vadodara</p>
      </footer>
    </div>
  );
};

export default CustomerLoginPage;
