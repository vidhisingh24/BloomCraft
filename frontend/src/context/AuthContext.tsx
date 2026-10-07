import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { productService } from '../services/productService';
import { storage, STORAGE_KEYS } from '../services/storage';

/**
 * Accounts are Supabase Auth users (Google or e-mail + password). The session is stored on the device and refreshed
 * automatically, so people stay signed in until they log out.
 * 'maker' = an account whose confirmed e-mail is listed in public.admin_emails.
 */
export type UserRole = 'customer' | 'maker';

export interface AuthUser {
  id: string;
  email?: string;
  /** 10-digit mobile number: verified by SMS when phoneVerified, otherwise as typed by the customer. */
  phone?: string;
  phoneVerified: boolean;
  name: string;
  role: UserRole;
  avatar: string;
  /** How the account signs in; Google-only accounts have no password to change. */
  providers: string[];
  createdAt: string;
}

export interface SignUpResult {
  /** True when Supabase wants the e-mail confirmed before the first sign-in. */
  needsConfirmation: boolean;
  user?: AuthUser;
}

interface AuthContextType {
  user: AuthUser | null;
  /** True until the stored session has been checked on page load. */
  loading: boolean;
  isAuthenticated: boolean;
  isMaker: boolean;
  isCustomer: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<AuthUser>;
  signUpWithPassword: (name: string, email: string, password: string) => Promise<SignUpResult>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  /** Saves the mobile number without SMS verification (used when phone OTP is switched off). */
  savePhone: (phone10: string) => Promise<void>;
  /** Sends an SMS code to verify a mobile number for this account. */
  startPhoneVerification: (phone10: string) => Promise<void>;
  confirmPhoneVerification: (phone10: string, code: string) => Promise<void>;
  /** Signs out on every device where this account is signed in. */
  logoutEverywhere: () => Promise<void>;
  /** True after opening a password-reset link: the app should ask for a new password. */
  passwordRecovery: boolean;
  updatePassword: (password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const redirectTo = () => `${window.location.origin}${window.location.pathname}`;
const toE164 = (phone10: string) => `+91${phone10.replace(/\D/g, '').slice(-10)}`;
const tenDigits = (phone?: string | null) => (phone ? phone.replace(/\D/g, '').slice(-10) : undefined);

function displayName(u: User, profileName?: string | null): string {
  const meta = u.user_metadata ?? {};
  const fromEmail = u.email
    ?.split('@')[0]
    .replace(/[._\d]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return profileName || meta.full_name || meta.name || fromEmail || 'Friend';
}

async function loadUser(u: User): Promise<AuthUser> {
  const supabase = getSupabase();
  const [{ data: admin }, { data: profile }] = await Promise.all([
    supabase.rpc('is_admin'),
    supabase.from('profiles').select('full_name').eq('id', u.id).maybeSingle(),
  ]);
  const role: UserRole = admin === true ? 'maker' : 'customer';
  const phoneVerified = Boolean(u.phone && u.phone_confirmed_at);
  return {
    id: u.id,
    email: u.email || undefined,
    phone: phoneVerified ? tenDigits(u.phone) : tenDigits(u.user_metadata?.phone as string | undefined),
    phoneVerified,
    name: displayName(u, profile?.full_name),
    role,
    avatar: role === 'maker' ? '✨' : '🌸',
    providers: (u.app_metadata?.providers as string[] | undefined) ?? [u.app_metadata?.provider ?? 'email'],
    createdAt: u.created_at,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabase();
    let active = true;

    const apply = async (session: Session | null) => {
      productService.invalidate();
      if (!session?.user) {
        if (active) setUser(null);
        return;
      }
      try {
        const next = await loadUser(session.user);
        if (active) setUser(next);
      } catch {
        if (active) setUser(null);
      }
    };

    supabase.auth
      .getSession()
      .then(({ data }) => apply(data.session))
      .finally(() => active && setLoading(false));

    // Fires on sign-in, sign-out, token refresh and in other tabs. Work is deferred so it
    // never runs inside Supabase's own auth lock.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return;
      setTimeout(() => void apply(session), 0);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const finish = useCallback(async (u: User | null | undefined): Promise<AuthUser> => {
    if (!u) throw new Error('Sign-in did not complete. Please try again.');
    const next = await loadUser(u);
    setUser(next);
    return next;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectTo() },
    });
    if (error) throw error;
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await getSupabase().auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      return finish(data.user);
    },
    [finish]
  );

  const signUpWithPassword = useCallback(
    async (name: string, email: string, password: string): Promise<SignUpResult> => {
      const { data, error } = await getSupabase().auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { full_name: name.trim() }, emailRedirectTo: redirectTo() },
      });
      if (error) throw error;
      // Supabase answers a sign-up for an e-mail that already has an account with an empty user
      // (so strangers cannot probe which e-mails exist). Tell the real owner what to do instead.
      if (data.user && data.user.identities?.length === 0) {
        throw Object.assign(new Error('An account with this e-mail already exists.'), { code: 'user_already_exists' });
      }
      if (data.session) {
        return { needsConfirmation: false, user: await finish(data.user) };
      }
      return { needsConfirmation: true };
    },
    [finish]
  );

  const resendConfirmation = useCallback(async (email: string) => {
    const { error } = await getSupabase().auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: redirectTo() },
    });
    if (error) throw error;
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    const { error } = await getSupabase().auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: redirectTo(),
    });
    if (error) throw error;
  }, []);

  const updateName = useCallback(
    async (name: string) => {
      if (!user) return;
      const clean = name.trim().slice(0, 80);
      const { error } = await getSupabase().from('profiles').update({ full_name: clean }).eq('id', user.id);
      if (error) throw error;
      setUser({ ...user, name: clean });
    },
    [user]
  );

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await getSupabase().auth.updateUser({ password });
    if (error) throw error;
    setPasswordRecovery(false);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data, error } = await getSupabase().auth.getUser();
    if (error) throw error;
    if (data.user) setUser(await loadUser(data.user));
  }, []);

  const savePhone = useCallback(
    async (phone10: string) => {
      const { error } = await getSupabase().auth.updateUser({ data: { phone: tenDigits(phone10) } });
      if (error) throw error;
      await refreshUser();
    },
    [refreshUser]
  );

  const startPhoneVerification = useCallback(async (phone10: string) => {
    const { error } = await getSupabase().auth.updateUser({ phone: toE164(phone10) });
    if (error) throw error;
  }, []);

  const confirmPhoneVerification = useCallback(
    async (phone10: string, code: string) => {
      const { error } = await getSupabase().auth.verifyOtp({
        phone: toE164(phone10),
        token: code.trim(),
        type: 'phone_change',
      });
      if (error) throw error;
      await refreshUser();
    },
    [refreshUser]
  );

  const logoutEverywhere = useCallback(async () => {
    setUser(null);
    storage.remove(STORAGE_KEYS.CHECKOUT_DRAFT);
    await getSupabase().auth.signOut({ scope: 'global' });
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    // Saved checkout details (name, phone, address) should not outlive the session on shared devices.
    storage.remove(STORAGE_KEYS.CHECKOUT_DRAFT);
    if (isSupabaseConfigured) await getSupabase().auth.signOut();
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isMaker: user?.role === 'maker',
      isCustomer: user?.role === 'customer',
      signInWithGoogle,
      signInWithPassword,
      signUpWithPassword,
      sendPasswordReset,
      resendConfirmation,
      updateName,
      savePhone,
      startPhoneVerification,
      confirmPhoneVerification,
      logoutEverywhere,
      passwordRecovery,
      updatePassword,
      logout,
    }),
    [
      user,
      loading,
      signInWithGoogle,
      signInWithPassword,
      signUpWithPassword,
      sendPasswordReset,
      resendConfirmation,
      updateName,
      savePhone,
      startPhoneVerification,
      confirmPhoneVerification,
      logoutEverywhere,
      passwordRecovery,
      updatePassword,
      logout,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
