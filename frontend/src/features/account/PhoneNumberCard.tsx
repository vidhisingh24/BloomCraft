import React, { useEffect, useState } from 'react';
import { BadgeCheck, KeyRound, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { friendlyError } from '../../lib/supabase';
import { siteConfig } from '../../config/site.config';
import { digitsOnly } from '../../utils/validation';

const RESEND_SECONDS = 60;
const input =
  'w-full px-4 py-2.5 rounded-xl border border-[#EBD8DC] bg-white text-sm text-[#3D272A] focus:outline-none focus:border-[#D96B82] focus:ring-2 focus:ring-[#FFE3E8]';

/**
 * The account's mobile number. With SMS verification switched on, a 6-digit code proves the
 * number belongs to the customer; otherwise the number is simply saved.
 */
export const PhoneNumberCard: React.FC = () => {
  const { user, savePhone, startPhoneVerification, confirmPhoneVerification } = useAuth();
  const { showToast } = useToast();
  const otp = siteConfig.auth.phoneOtp;

  const [editing, setEditing] = useState(!user?.phone);
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!user) return null;

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await task();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const submitNumber = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      if (!/^[6-9]\d{9}$/.test(phone)) throw new Error('Please enter a valid 10-digit mobile number.');
      if (!otp) {
        await savePhone(phone);
        setEditing(false);
        showToast('Mobile number saved 📱', `+91 ${phone}`, 'success');
        return;
      }
      await startPhoneVerification(phone);
      setCodeSent(true);
      setCooldown(RESEND_SECONDS);
    });
  };

  const submitCode = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      if (!/^\d{6}$/.test(code)) throw new Error('Enter the 6-digit code from the SMS.');
      await confirmPhoneVerification(phone, code);
      setCodeSent(false);
      setCode('');
      setEditing(false);
      showToast('Mobile number verified ✅', `+91 ${phone}`, 'success');
    });
  };

  return (
    <section className="bg-white rounded-3xl border border-[#F0E6E8] p-5 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#3D272A] flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#D96B82]" /> Mobile Number
          </h2>
          <p className="text-xs text-[#7A5B62] mt-0.5">
            {otp
              ? 'We verify it with a one-time SMS code so we can reach you about your orders.'
              : 'Used to contact you about deliveries. It is filled in automatically at checkout.'}
          </p>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-xs font-bold text-[#C0536A] hover:underline shrink-0">
            {user.phone ? 'Change' : 'Add'}
          </button>
        )}
      </div>

      {!editing && user.phone && (
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-[#3D272A]">+91 {user.phone}</span>
          {user.phoneVerified ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
              <BadgeCheck className="w-3.5 h-3.5" /> Verified
            </span>
          ) : (
            otp && (
              <button
                onClick={() => setEditing(true)}
                className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold hover:bg-amber-100"
              >
                Not verified — verify now
              </button>
            )
          )}
        </div>
      )}

      {editing && !codeSent && (
        <form onSubmit={submitNumber} className="flex flex-col sm:flex-row gap-2" noValidate>
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-4 flex items-center text-sm text-[#7A5B62] pointer-events-none">+91</span>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={phone}
              onChange={(e) => setPhone(digitsOnly(e.target.value).slice(-10))}
              placeholder="98765 43210"
              className={`${input} pl-12`}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2.5 rounded-xl bg-[#C0536A] hover:bg-[#A83D53] text-white text-sm font-bold disabled:opacity-60"
          >
            {busy ? 'Please wait…' : otp ? 'Send code' : 'Save'}
          </button>
          {user.phone && (
            <button type="button" onClick={() => setEditing(false)} className="px-4 py-2.5 rounded-xl text-sm text-[#7A5B62] hover:bg-[#FAF8F5]">
              Cancel
            </button>
          )}
        </form>
      )}

      {editing && codeSent && (
        <form onSubmit={submitCode} className="space-y-2" noValidate>
          <p className="text-xs text-[#7A5B62]">
            We sent a 6-digit code to <strong>+91 {phone}</strong>.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <KeyRound className="w-4 h-4 text-[#A4838B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(digitsOnly(e.target.value).slice(0, 6))}
                placeholder="123456"
                className={`${input} pl-10 tracking-[0.3em]`}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2.5 rounded-xl bg-[#C0536A] hover:bg-[#A83D53] text-white text-sm font-bold disabled:opacity-60"
            >
              {busy ? 'Checking…' : 'Verify'}
            </button>
          </div>
          <div className="flex justify-between text-xs">
            <button type="button" onClick={() => setCodeSent(false)} className="text-[#7A5B62] hover:text-[#C0536A]">
              Use a different number
            </button>
            <button
              type="button"
              disabled={busy || cooldown > 0}
              onClick={() => void run(async () => {
                await startPhoneVerification(phone);
                setCooldown(RESEND_SECONDS);
              })}
              className="font-semibold text-[#C0536A] hover:underline disabled:text-[#A4838B] disabled:no-underline"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2" role="alert">{error}</p>}
    </section>
  );
};
