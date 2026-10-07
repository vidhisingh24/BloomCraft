import React, { useState } from 'react';
import { Heart, Mail, Package, Pencil, Settings, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useWishlist } from '../../context/WishlistContext';
import { friendlyError } from '../../lib/supabase';
import { PhoneNumberCard } from './PhoneNumberCard';
import { AddressBook } from './AddressBook';

interface ProfilePageProps {
  onNavigate: (tab: string) => void;
}

/** "My Profile": name, e-mail, verified mobile number, saved addresses and shortcuts. */
export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, updateName } = useAuth();
  const { totalWishlist } = useWishlist();
  const { showToast } = useToast();
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return showToast('Please enter your name', '', 'info');
    setBusy(true);
    try {
      await updateName(name);
      setEditingName(false);
      showToast('Name updated 🌸', name.trim(), 'success');
    } catch (err) {
      showToast('Could not update your name', friendlyError(err), 'info');
    } finally {
      setBusy(false);
    }
  };

  const since = new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const viaGoogle = user.providers.includes('google');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#FFF0F3] via-white to-[#FFE3E8]/40 rounded-3xl border border-[#F0E6E8] p-6 flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-[#D96B82] text-white flex items-center justify-center text-2xl font-serif font-bold shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          {editingName ? (
            <form onSubmit={saveName} className="flex flex-col sm:flex-row gap-2">
              <input
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="flex-1 px-3.5 py-2 rounded-xl border border-[#EBD8DC] text-sm focus:outline-none focus:border-[#D96B82]"
              />
              <div className="flex gap-2">
                <button disabled={busy} className="px-4 py-2 rounded-xl bg-[#C0536A] text-white text-sm font-bold disabled:opacity-60">
                  Save
                </button>
                <button type="button" onClick={() => setEditingName(false)} className="px-3 py-2 rounded-xl text-sm text-[#7A5B62]">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D272A] flex items-center gap-2">
              <span className="truncate">{user.name}</span>
              <button onClick={() => setEditingName(true)} className="p-1.5 rounded-full text-[#A4838B] hover:text-[#C0536A] hover:bg-white" aria-label="Edit name">
                <Pencil className="w-4 h-4" />
              </button>
            </h1>
          )}
          <p className="text-xs text-[#7A5B62] mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {user.email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </span>
            )}
            <span>{viaGoogle ? 'Signed in with Google' : 'E-mail account'} · Member since {since}</span>
          </p>
        </div>
      </section>

      {/* Shortcuts */}
      <section className="grid grid-cols-3 gap-3">
        {[
          { tab: 'orders', icon: Package, label: 'My Orders' },
          { tab: 'wishlist', icon: Heart, label: `Wishlist${totalWishlist ? ` (${totalWishlist})` : ''}` },
          { tab: 'settings', icon: Settings, label: 'Settings' },
        ].map(({ tab, icon: Icon, label }) => (
          <button
            key={tab}
            onClick={() => onNavigate(tab)}
            className="bg-white rounded-2xl border border-[#F0E6E8] p-4 flex flex-col items-center gap-2 text-xs font-semibold text-[#3D272A] hover:border-[#D96B82]/50 hover:shadow-sm transition-all"
          >
            <Icon className="w-5 h-5 text-[#D96B82]" />
            {label}
          </button>
        ))}
      </section>

      <PhoneNumberCard />
      <AddressBook />

      <p className="text-center text-[11px] text-[#A4838B] flex items-center justify-center gap-1">
        <User className="w-3 h-3" /> Your details are private: only you and BloomCraft can see them.
      </p>
    </div>
  );
};
