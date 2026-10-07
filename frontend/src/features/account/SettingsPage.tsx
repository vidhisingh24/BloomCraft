import React, { useState } from 'react';
import { ArrowLeft, KeyRound, LogOut, MonitorSmartphone, ShieldAlert, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCart } from '../../context/CartContext';
import { friendlyError } from '../../lib/supabase';
import { passwordProblem } from '../../utils/validation';
import { buildWhatsAppLink } from '../../utils/whatsapp';

interface SettingsPageProps {
  onNavigate: (tab: string) => void;
}

const card = 'bg-white rounded-3xl border border-[#F0E6E8] p-5 sm:p-6 space-y-3';
const input =
  'w-full px-3.5 py-2.5 rounded-xl border border-[#EBD8DC] bg-white text-sm focus:outline-none focus:border-[#D96B82] focus:ring-2 focus:ring-[#FFE3E8]';

/** Account settings: password, sign-out options, local data and account deletion. */
export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { user, updatePassword, sendPasswordReset, logout, logoutEverywhere } = useAuth();
  const { clearCart } = useCart();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  const hasPassword = user.providers.includes('email');

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const weak = passwordProblem(password);
    if (weak) return setError(weak);
    if (password !== confirm) return setError('The two passwords do not match.');
    setBusy(true);
    setError('');
    try {
      await updatePassword(password);
      setPassword('');
      setConfirm('');
      showToast('Password changed 🔒', 'Use your new password next time you sign in.', 'success');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const signOut = async (everywhere: boolean) => {
    if (everywhere && !window.confirm('Sign out on all your phones and computers?')) return;
    await (everywhere ? logoutEverywhere() : logout());
    showToast(everywhere ? 'Signed out everywhere' : 'Signed out', 'See you soon 🌸', 'info');
    onNavigate('home');
  };

  const deleteRequest = buildWhatsAppLink(
    `Hi BloomCraft! Please delete my account and personal data.\nAccount e-mail: ${user.email ?? '—'}`
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      <div>
        <button onClick={() => onNavigate('profile')} className="text-xs font-semibold text-[#7A5B62] hover:text-[#C0536A] inline-flex items-center gap-1 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to profile
        </button>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D272A]">Settings</h1>
        <p className="text-xs text-[#7A5B62]">Signed in as {user.email ?? `+91 ${user.phone}`}</p>
      </div>

      {/* Password */}
      <section className={card}>
        <h2 className="font-serif text-lg font-bold text-[#3D272A] flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#D96B82]" /> Password
        </h2>
        {hasPassword ? (
          <form onSubmit={changePassword} className="space-y-3" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="password" autoComplete="new-password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
              <input type="password" autoComplete="new-password" placeholder="Repeat new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} />
            </div>
            <p className="text-[11px] text-[#A4838B]">At least 8 characters, with letters and numbers.</p>
            {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
            <button disabled={busy} className="px-5 py-2.5 rounded-xl bg-[#C0536A] hover:bg-[#A83D53] text-white text-sm font-bold disabled:opacity-60">
              {busy ? 'Saving…' : 'Change password'}
            </button>
          </form>
        ) : (
          <div className="text-sm text-[#7A5B62] space-y-2">
            <p>You sign in with Google, so there is no BloomCraft password to change.</p>
            {user.email && (
              <button
                onClick={() =>
                  void sendPasswordReset(user.email!)
                    .then(() => showToast('Check your e-mail', 'We sent a link to add a password.', 'success'))
                    .catch((err) => showToast('Could not send the link', friendlyError(err), 'info'))
                }
                className="text-xs font-bold text-[#C0536A] hover:underline"
              >
                Also add a password for e-mail sign-in →
              </button>
            )}
          </div>
        )}
      </section>

      {/* Sessions */}
      <section className={card}>
        <h2 className="font-serif text-lg font-bold text-[#3D272A] flex items-center gap-2">
          <MonitorSmartphone className="w-4 h-4 text-[#D96B82]" /> Signed-in devices
        </h2>
        <p className="text-xs text-[#7A5B62]">You stay signed in on each device until you sign out.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={() => void signOut(false)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[#EBD8DC] text-sm font-semibold text-[#3D272A] hover:bg-[#FFF0F3]">
            <LogOut className="w-4 h-4" /> Sign out on this device
          </button>
          <button onClick={() => void signOut(true)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[#EBD8DC] text-sm font-semibold text-[#3D272A] hover:bg-[#FFF0F3]">
            <ShieldAlert className="w-4 h-4" /> Sign out everywhere
          </button>
        </div>
      </section>

      {/* Device data */}
      <section className={card}>
        <h2 className="font-serif text-lg font-bold text-[#3D272A]">Saved on this device</h2>
        <p className="text-xs text-[#7A5B62]">Your cart and wishlist are kept in this browser.</p>
        <button
          onClick={() => {
            if (window.confirm('Empty your cart on this device?')) {
              clearCart();
              showToast('Cart emptied', '', 'info');
            }
          }}
          className="text-xs font-bold text-[#C0536A] hover:underline"
        >
          Empty my cart
        </button>
      </section>

      {/* Delete account */}
      <section className={`${card} border-red-100`}>
        <h2 className="font-serif text-lg font-bold text-red-700 flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Delete account
        </h2>
        <p className="text-xs text-[#7A5B62]">
          We delete your account, saved addresses and personal details. Past orders are kept only as long as needed for
          deliveries, returns and accounting.
        </p>
        <a
          href={deleteRequest}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 text-sm font-semibold text-red-700 hover:bg-red-50"
        >
          Request deletion on WhatsApp
        </a>
      </section>
    </div>
  );
};
