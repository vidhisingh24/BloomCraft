import React, { useState } from 'react';
import { INDIAN_STATES } from '../../config/delivery.config';
import { findPincode } from '../../data/pincodes';
import { digitsOnly } from '../../utils/validation';
import { addressProblem, type AddressInput } from '../../services/addressService';

const LABELS = ['Home', 'Hostel', 'Work', 'Other'];
const input =
  'w-full px-3.5 py-2.5 rounded-xl border border-[#EBD8DC] bg-white text-sm text-[#3D272A] focus:outline-none focus:border-[#D96B82] focus:ring-2 focus:ring-[#FFE3E8]';
const labelCls = 'block text-xs font-semibold text-[#5C3E45] mb-1';

interface AddressFormProps {
  initial: AddressInput;
  submitLabel: string;
  busy?: boolean;
  onSubmit: (address: AddressInput) => void;
  onCancel?: () => void;
}

/** Add / edit a delivery address. The PIN code fills in city and state automatically. */
export const AddressForm: React.FC<AddressFormProps> = ({ initial, submitLabel, busy, onSubmit, onCancel }) => {
  const [a, setA] = useState<AddressInput>(initial);
  const [error, setError] = useState('');
  const [pinInfo, setPinInfo] = useState('');

  const set = <K extends keyof AddressInput>(key: K, value: AddressInput[K]) => setA((prev) => ({ ...prev, [key]: value }));

  const onPincode = async (raw: string) => {
    const pin = digitsOnly(raw).slice(0, 6);
    set('pincode', pin);
    setPinInfo('');
    if (pin.length !== 6) return;
    const match = await findPincode(pin);
    if (!match) return;
    setA((prev) =>
      prev.pincode !== pin
        ? prev
        : { ...prev, city: match.city, state: match.state, area: prev.area || match.area || '' }
    );
    setPinInfo(`📍 ${match.city}, ${match.state}`);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const problem = addressProblem(a);
    if (problem) return setError(problem);
    setError('');
    onSubmit(a);
  };

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div>
        <span className={labelCls}>Save as</span>
        <div className="flex flex-wrap gap-2">
          {LABELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => set('label', l)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                a.label === l ? 'bg-[#FFE3E8] border-[#D96B82] text-[#C0536A]' : 'bg-white border-[#EBD8DC] text-[#7A5B62] hover:border-[#D96B82]/50'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className={labelCls}>Receiver’s name *</span>
          <input className={input} autoComplete="name" maxLength={80} value={a.fullName} onChange={(e) => set('fullName', e.target.value)} />
        </label>
        <label className="block">
          <span className={labelCls}>Mobile number *</span>
          <input
            className={input}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="10 digits"
            value={a.phone}
            onChange={(e) => set('phone', digitsOnly(e.target.value).slice(-10))}
          />
        </label>
      </div>

      <label className="block">
        <span className={labelCls}>House / flat / room no. & building *</span>
        <input className={input} autoComplete="address-line1" maxLength={120} value={a.house} onChange={(e) => set('house', e.target.value)} />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className={labelCls}>Street / road</span>
          <input className={input} autoComplete="address-line2" maxLength={120} value={a.street ?? ''} onChange={(e) => set('street', e.target.value)} />
        </label>
        <label className="block">
          <span className={labelCls}>Area / locality</span>
          <input className={input} maxLength={120} value={a.area ?? ''} onChange={(e) => set('area', e.target.value)} />
        </label>
      </div>

      <label className="block">
        <span className={labelCls}>Landmark</span>
        <input className={input} maxLength={120} placeholder="e.g. opposite the temple" value={a.landmark ?? ''} onChange={(e) => set('landmark', e.target.value)} />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block">
          <span className={labelCls}>PIN code *</span>
          <input
            className={input}
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="6 digits"
            value={a.pincode}
            onChange={(e) => void onPincode(e.target.value)}
          />
          {pinInfo && <span className="block text-[11px] text-emerald-700 mt-1">{pinInfo}</span>}
        </label>
        <label className="block">
          <span className={labelCls}>City *</span>
          <input className={input} autoComplete="address-level2" maxLength={60} value={a.city} onChange={(e) => set('city', e.target.value)} />
        </label>
        <label className="block">
          <span className={labelCls}>State *</span>
          <select className={input} value={a.state} onChange={(e) => set('state', e.target.value)}>
            <option value="">Choose…</option>
            {[...new Set([...INDIAN_STATES, ...(a.state ? [a.state] : [])])].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex items-center gap-2 text-xs text-[#5C3E45]">
        <input type="checkbox" checked={a.isDefault} onChange={(e) => set('isDefault', e.target.checked)} className="w-4 h-4 accent-[#C0536A]" />
        Use as my default delivery address
      </label>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2" role="alert">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-xl bg-[#C0536A] hover:bg-[#A83D53] text-white text-sm font-bold disabled:opacity-60">
          {busy ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-xl text-sm text-[#7A5B62] hover:bg-[#FAF8F5]">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};
