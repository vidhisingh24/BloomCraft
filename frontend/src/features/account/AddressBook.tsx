import React, { useCallback, useEffect, useState } from 'react';
import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { friendlyError } from '../../lib/supabase';
import { addressService, formatAddress, type AddressInput, type SavedAddress } from '../../services/addressService';
import { AddressForm } from './AddressForm';

/** The customer's saved delivery addresses: add, edit, delete and choose a default. */
export const AddressBook: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState<SavedAddress | 'new' | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setAddresses(await addressService.list());
    } catch (err) {
      setLoadError(friendlyError(err, 'Could not load your addresses.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const blank: AddressInput = {
    label: 'Home',
    fullName: user?.name ?? '',
    phone: user?.phone ?? '',
    house: '',
    street: '',
    area: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: addresses.length === 0,
  };

  const save = async (input: AddressInput) => {
    setBusy(true);
    try {
      if (editing === 'new') await addressService.create(input);
      else if (editing) await addressService.update(editing.id, input);
      setEditing(null);
      showToast('Address saved 📍', input.label, 'success');
      await load();
    } catch (err) {
      showToast('Could not save the address', friendlyError(err), 'info');
    } finally {
      setBusy(false);
    }
  };

  const act = async (task: () => Promise<void>, done: string) => {
    setBusy(true);
    try {
      await task();
      showToast(done, '', 'success');
      await load();
    } catch (err) {
      showToast('Something went wrong', friendlyError(err), 'info');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-white rounded-3xl border border-[#F0E6E8] p-5 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#3D272A] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#D96B82]" /> Saved Addresses
          </h2>
          <p className="text-xs text-[#7A5B62] mt-0.5">Pick one at checkout instead of typing it every time.</p>
        </div>
        {!editing && addresses.length < 10 && (
          <button
            onClick={() => setEditing('new')}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FFE3E8] text-[#C0536A] text-xs font-bold hover:bg-[#FFD4DC] shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add address
          </button>
        )}
      </div>

      {editing && (
        <div className="rounded-2xl border border-[#F4A6B7]/40 bg-[#FFF8F9] p-4">
          <AddressForm
            initial={editing === 'new' ? blank : editing}
            submitLabel={editing === 'new' ? 'Save address' : 'Update address'}
            busy={busy}
            onSubmit={(a) => void save(a)}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {loading && <p className="text-xs text-[#7A5B62]">Loading your addresses…</p>}
      {loadError && (
        <p className="text-xs text-red-600">
          {loadError}{' '}
          <button onClick={() => void load()} className="font-bold underline">
            Retry
          </button>
        </p>
      )}
      {!loading && !loadError && addresses.length === 0 && !editing && (
        <p className="text-sm text-[#7A5B62]">No saved addresses yet.</p>
      )}

      <ul className="space-y-3">
        {addresses.map((a) => (
          <li key={a.id} className="rounded-2xl border border-[#F0E6E8] p-4 flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
            <div className="text-sm min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#EBD8DC] text-[11px] font-bold text-[#5C3E45]">{a.label}</span>
                {a.isDefault && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">Default</span>
                )}
              </div>
              <p className="font-semibold text-[#3D272A]">
                {a.fullName} · +91 {a.phone}
              </p>
              <p className="text-xs text-[#7A5B62] break-words">{formatAddress(a)}</p>
            </div>
            <div className="flex sm:flex-col gap-2 shrink-0 text-xs">
              {!a.isDefault && (
                <button disabled={busy} onClick={() => void act(() => addressService.setDefault(a.id), 'Default address updated')} className="inline-flex items-center gap-1 font-semibold text-[#5C3E45] hover:text-[#C0536A]">
                  <Star className="w-3.5 h-3.5" /> Make default
                </button>
              )}
              <button disabled={busy} onClick={() => setEditing(a)} className="inline-flex items-center gap-1 font-semibold text-[#5C3E45] hover:text-[#C0536A]">
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                disabled={busy}
                onClick={() => {
                  if (window.confirm(`Delete the "${a.label}" address?`)) void act(() => addressService.remove(a.id), 'Address deleted');
                }}
                className="inline-flex items-center gap-1 font-semibold text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
