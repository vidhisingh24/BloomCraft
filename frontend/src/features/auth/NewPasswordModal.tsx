import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { friendlyError } from '../../lib/supabase';
import { passwordProblem } from '../../utils/validation';

/** Shown after opening a password-reset e-mail link. */
export const NewPasswordModal: React.FC = () => {
  const { updatePassword } = useAuth();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const weak = passwordProblem(password);
    if (weak) return setError(weak);
    if (password !== confirm) return setError('The two passwords do not match.');
    setBusy(true);
    setError('');
    try {
      await updatePassword(password);
      showToast('Password updated 🌸', 'You are signed in with your new password.', 'success');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const input =
    'w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EBD8DC] focus:border-[#C0536A] focus:ring-2 focus:ring-[#FFE3E8] text-sm outline-none';

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="new-password-title">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-4 shadow-2xl">
        <h2 id="new-password-title" className="font-serif text-2xl font-bold text-[#3D272A]">Choose a new password</h2>
        {[
          { value: password, set: setPassword, label: 'New password' },
          { value: confirm, set: setConfirm, label: 'Repeat new password' },
        ].map((f) => (
          <label key={f.label} className="block space-y-1">
            <span className="text-xs font-semibold text-[#5C3E45]">{f.label}</span>
            <span className="relative block">
              <Lock className="w-4 h-4 text-[#A4838B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input type="password" autoComplete="new-password" value={f.value} onChange={(e) => f.set(e.target.value)} className={input} />
            </span>
          </label>
        ))}
        {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
        <button type="submit" disabled={busy} className="w-full py-3 rounded-2xl bg-[#C0536A] hover:bg-[#A83D53] text-white text-sm font-bold disabled:opacity-70">
          {busy ? 'Saving…' : 'Save Password'}
        </button>
      </form>
    </div>
  );
};
