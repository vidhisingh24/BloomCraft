import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useAuth, type AuthUser } from '../../context/AuthContext';
import { friendlyError } from '../../lib/supabase';
import { passwordProblem } from '../../utils/validation';
import { siteConfig } from '../../config/site.config';

interface AuthFormProps {
  /** The maker form has no "create account": only the listed admin e-mail can get in. */
  audience: 'customer' | 'maker';
  onSuccess: (user: AuthUser) => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
  'w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-[#EBD8DC] focus:border-[#C0536A] focus:ring-2 focus:ring-[#FFE3E8] text-sm text-[#3D272A] outline-none transition-all';

const GoogleLogo = () => (
  <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

const Field: React.FC<{ label: string; icon: React.ReactNode; children: React.ReactNode }> = ({ label, icon, children }) => (
  <label className="block space-y-1 text-left">
    <span className="text-xs font-semibold text-[#5C3E45]">{label}</span>
    <span className="relative block">
      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A4838B]">{icon}</span>
      {children}
    </span>
  </label>
);

/** Sign in with Google, or with e-mail + password (create account / forgot password). */
export const AuthForm: React.FC<AuthFormProps> = ({ audience, onSuccess }) => {
  const auth = useAuth();
  const isMakerForm = audience === 'maker';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [errorCode, setErrorCode] = useState('');

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError('');
    setErrorCode('');
    setNotice('');
    try {
      await task();
    } catch (err) {
      setError(friendlyError(err));
      setErrorCode((err as { code?: string })?.code ?? '');
    } finally {
      setBusy(false);
    }
  };

  const done = async (user: AuthUser) => {
    if (isMakerForm && user.role !== 'maker') {
      await auth.logout();
      throw new Error('This account does not have Maker Studio access.');
    }
    onSuccess(user);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      if (!EMAIL_RE.test(email.trim())) throw new Error('Please enter a valid e-mail address.');
      if (mode === 'signup') {
        if (name.trim().length < 2) throw new Error('Please enter your name.');
        const weak = passwordProblem(password);
        if (weak) throw new Error(weak);
        const res = await auth.signUpWithPassword(name, email, password);
        if (res.needsConfirmation) {
          setNotice(`Almost done! We sent a confirmation link to ${email.trim()}. Open it, then sign in here.`);
          setMode('signin');
          return;
        }
        if (res.user) await done(res.user);
        return;
      }
      if (!password) throw new Error('Please enter your password.');
      await done(await auth.signInWithPassword(email, password));
    });
  };

  const handleForgot = () => {
    void run(async () => {
      if (!EMAIL_RE.test(email.trim())) throw new Error('Type your e-mail above first, then tap "Forgot password?".');
      await auth.sendPasswordReset(email);
      setNotice(`Password reset link sent to ${email.trim()}.`);
    });
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError('');
    setErrorCode('');
    setNotice('');
  };

  const handleResend = () => {
    void run(async () => {
      await auth.resendConfirmation(email);
      setNotice(`We sent a new confirmation link to ${email.trim()}. Open it, then sign in here.`);
    });
  };

  return (
    <div className="space-y-4">
      {siteConfig.auth.google && (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(auth.signInWithGoogle)}
            className="w-full py-2.5 px-4 rounded-2xl bg-white border border-[#EBD8DC] hover:border-[#C0536A]/50 hover:bg-[#FFF8F9] text-sm font-semibold text-[#3D272A] flex items-center justify-center gap-2.5 transition-all disabled:opacity-60"
          >
            <GoogleLogo />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-[#A4838B]">
            <span className="flex-1 h-px bg-[#F0E6E8]" /> or with e-mail <span className="flex-1 h-px bg-[#F0E6E8]" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        {mode === 'signup' && (
          <Field label="Your Name" icon={<User className="w-4 h-4" />}>
            <input type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} maxLength={80} />
          </Field>
        )}

        <Field label="Email" icon={<Mail className="w-4 h-4" />}>
          <input
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </Field>

        <div className="space-y-1">
          <Field label="Password" icon={<Lock className="w-4 h-4" />}>
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#A4838B] hover:text-[#3D272A]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </Field>
          {mode === 'signup' ? (
            <p className="text-[11px] text-[#A4838B]">At least 8 characters, with letters and numbers.</p>
          ) : (
            <div className="text-right">
              <button type="button" onClick={handleForgot} className="text-[11px] text-[#C0536A] hover:underline font-medium">
                Forgot password?
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 space-y-1.5" role="alert">
            <p>{error}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {errorCode === 'invalid_credentials' && !isMakerForm && (
                <button type="button" onClick={switchMode} className="font-bold text-[#C0536A] hover:underline">
                  Create an account →
                </button>
              )}
              {(errorCode === 'invalid_credentials' || errorCode === 'user_already_exists' || errorCode === 'email_exists') && (
                <button type="button" onClick={handleForgot} className="font-bold text-[#C0536A] hover:underline">
                  Send me a password reset link →
                </button>
              )}
              {errorCode === 'email_not_confirmed' && (
                <button type="button" onClick={handleResend} className="font-bold text-[#C0536A] hover:underline">
                  Resend confirmation e-mail →
                </button>
              )}
            </div>
          </div>
        )}
        {notice && (
          <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2" role="status">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 px-4 rounded-2xl bg-[#C0536A] hover:bg-[#A83D53] text-white text-sm font-bold shadow-md shadow-[#C0536A]/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {busy ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {!isMakerForm && (
        <p className="text-center text-xs text-[#7A5B62]">
          {mode === 'signin' ? 'New to BloomCraft? ' : 'Already have an account? '}
          <button type="button" onClick={switchMode} className="font-bold text-[#C0536A] hover:underline">
            {mode === 'signin' ? 'Create an account' : 'Sign in'}
          </button>
        </p>
      )}

      <p className="text-center text-[10px] text-[#A4838B]">You stay signed in on this device until you log out.</p>
    </div>
  );
};

export default AuthForm;
