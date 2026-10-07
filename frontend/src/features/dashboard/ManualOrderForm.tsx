import React, { useMemo, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import type { Product } from '../../types';
import type { ManualOrderInput, OrderSource } from '../../services/orderService';
import { formatPaise } from '../../utils/currency';
import { digitsOnly } from '../../utils/validation';

interface ManualOrderFormProps {
  products: Product[];
  busy: boolean;
  onSubmit: (input: ManualOrderInput) => void;
  onClose: () => void;
}

interface Line {
  key: number;
  productId: string; // catalogue id, or 'manual' for a typed item
  name: string;
  quantity: string;
  priceRupees: string;
  note: string;
}

const SOURCES: { id: Exclude<OrderSource, 'website'>; label: string }[] = [
  { id: 'instagram', label: '📸 Instagram' },
  { id: 'whatsapp', label: '💬 WhatsApp' },
  { id: 'in_person', label: '🤝 In person' },
  { id: 'other', label: '✨ Other' },
];

const PAYMENT_OPTIONS = [
  { id: 'gpay', label: 'Google Pay', method: 'upi' as const, provider: 'Google Pay' },
  { id: 'phonepe', label: 'PhonePe', method: 'upi' as const, provider: 'PhonePe' },
  { id: 'paytm', label: 'Paytm', method: 'upi' as const, provider: 'Paytm' },
  { id: 'upi', label: 'Other UPI', method: 'upi' as const, provider: undefined },
  { id: 'cash', label: 'Cash', method: 'cod' as const, provider: 'Cash' },
];

const input =
  'w-full px-3 py-2 rounded-xl border border-[#EBD8DC] bg-white text-sm text-[#3D272A] focus:outline-none focus:border-[#D96B82] focus:ring-2 focus:ring-[#FFE3E8]';
const label = 'block text-[11px] font-bold uppercase tracking-wider text-[#5C3E45] mb-1';
const todayIST = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
const toPaise = (rupees: string) => Math.round(Number(rupees || '0') * 100);

let nextKey = 1;
const newLine = (): Line => ({ key: nextKey++, productId: 'manual', name: '', quantity: '1', priceRupees: '', note: '' });

/** Maker Studio form to record a sale that happened outside the website. */
export const ManualOrderForm: React.FC<ManualOrderFormProps> = ({ products, busy, onSubmit, onClose }) => {
  const [source, setSource] = useState<Exclude<OrderSource, 'website'>>('instagram');
  const [orderedAt, setOrderedAt] = useState(todayIST());
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [deliveryMethod, setDeliveryMethod] = useState<ManualOrderInput['deliveryMethod']>('vadodara_local');
  const [deliveryRupees, setDeliveryRupees] = useState('');
  const [discountRupees, setDiscountRupees] = useState('');
  const [paymentId, setPaymentId] = useState('gpay');
  const [paid, setPaid] = useState(true);
  const [status, setStatus] = useState<ManualOrderInput['status']>('delivered');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const update = (key: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const chooseProduct = (key: number, productId: string) => {
    const p = byId.get(productId);
    update(key, p ? { productId, name: p.name, priceRupees: String(p.price / 100) } : { productId: 'manual', name: '', priceRupees: '' });
  };

  const subtotal = lines.reduce((sum, l) => sum + toPaise(l.priceRupees) * (Number(l.quantity) || 0), 0);
  const total = Math.max(0, subtotal + toPaise(deliveryRupees) - toPaise(discountRupees));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError('Please enter the customer’s name.');
    if (phone && !/^[6-9]\d{9}$/.test(phone)) return setError('The mobile number should have 10 digits (or leave it empty).');
    for (const [i, l] of lines.entries()) {
      if (!l.name.trim()) return setError(`Item ${i + 1}: choose a product or type a name.`);
      if (!(Number(l.quantity) >= 1)) return setError(`Item ${i + 1}: quantity must be at least 1.`);
      if (l.priceRupees === '' || !(Number(l.priceRupees) >= 0)) return setError(`Item ${i + 1}: enter the price.`);
    }
    if (orderedAt > todayIST()) return setError('The order date cannot be in the future.');
    setError('');
    const pay = PAYMENT_OPTIONS.find((o) => o.id === paymentId)!;
    onSubmit({
      source,
      orderedAt,
      customer: { name: name.trim(), phone: phone || undefined },
      items: lines.map((l) => {
        const p = byId.get(l.productId);
        return {
          name: l.name.trim(),
          quantity: Math.round(Number(l.quantity)),
          price: toPaise(l.priceRupees),
          productId: p ? p.id : undefined,
          image: p?.images[0],
          customNote: l.note.trim() || undefined,
        };
      }),
      deliveryMethod,
      deliveryCharge: toPaise(deliveryRupees),
      discount: toPaise(discountRupees),
      payment: { method: pay.method, provider: pay.provider, status: paid ? 'paid' : 'pending' },
      status,
      note: note.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start sm:items-center justify-center p-3 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="manual-order-title">
      <form onSubmit={submit} className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-5 sm:p-7 space-y-5 my-6" noValidate>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="manual-order-title" className="font-serif text-xl sm:text-2xl font-bold text-[#3D272A]">Add an order manually</h2>
            <p className="text-xs text-[#7A5B62]">For sales from Instagram, WhatsApp, in person or anywhere else. They count in your sales totals.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-[#FAF8F5]" aria-label="Close">
            <X className="w-5 h-5 text-[#7A5B62]" />
          </button>
        </div>

        {/* Source & date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <span className={label}>Where did the order come from?</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SOURCES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSource(s.id)}
                  className={`py-2 rounded-xl border text-xs font-semibold ${
                    source === s.id ? 'bg-[#FFE3E8] border-[#D96B82] text-[#C0536A]' : 'bg-white border-[#EBD8DC] text-[#5C3E45]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className={label}>Order date</span>
            <input type="date" max={todayIST()} value={orderedAt} onChange={(e) => setOrderedAt(e.target.value)} className={input} />
          </label>
        </div>

        {/* Customer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className={label}>Customer name *</span>
            <input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className={input} placeholder="e.g. Riya Shah" />
          </label>
          <label className="block">
            <span className={label}>Mobile number (optional)</span>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(digitsOnly(e.target.value).slice(-10))}
              className={input}
              placeholder="10 digits"
            />
          </label>
        </div>

        {/* Items */}
        <div className="space-y-2">
          <span className={label}>Items</span>
          {lines.map((l, i) => (
            <div key={l.key} className="rounded-2xl border border-[#F0E6E8] p-3 space-y-2 bg-[#FFFCFC]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#7A5B62]">Item {i + 1}</span>
                {lines.length > 1 && (
                  <button type="button" onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} className="text-red-600 p-1" aria-label={`Remove item ${i + 1}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <select value={l.productId} onChange={(e) => chooseProduct(l.key, e.target.value)} className={input}>
                <option value="manual">✏️ Type my own item</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatPaise(p.price)}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                <input
                  className={`${input} sm:col-span-3`}
                  placeholder="Item name"
                  value={l.name}
                  maxLength={120}
                  onChange={(e) => update(l.key, { name: e.target.value })}
                />
                <input
                  className={`${input} sm:col-span-1`}
                  inputMode="numeric"
                  placeholder="Qty"
                  aria-label="Quantity"
                  value={l.quantity}
                  onChange={(e) => update(l.key, { quantity: digitsOnly(e.target.value).slice(0, 3) })}
                />
                <div className="relative sm:col-span-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#7A5B62]">₹</span>
                  <input
                    className={`${input} pl-7`}
                    inputMode="decimal"
                    placeholder="Price each"
                    aria-label="Price each in rupees"
                    value={l.priceRupees}
                    onChange={(e) => update(l.key, { priceRupees: e.target.value.replace(/[^\d.]/g, '').slice(0, 8) })}
                  />
                </div>
              </div>
              <input
                className={input}
                placeholder="Colour / name on keychain / details (optional)"
                value={l.note}
                maxLength={60}
                onChange={(e) => update(l.key, { note: e.target.value })}
              />
            </div>
          ))}
          <button type="button" onClick={() => setLines((ls) => [...ls, newLine()])} className="inline-flex items-center gap-1 text-xs font-bold text-[#C0536A] hover:underline">
            <Plus className="w-3.5 h-3.5" /> Add another item
          </button>
        </div>

        {/* Delivery, payment, status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="block">
            <span className={label}>Delivery</span>
            <select value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value as ManualOrderInput['deliveryMethod'])} className={input}>
              <option value="vadodara_local">📍 Vadodara handover</option>
              <option value="college">🏫 College campus</option>
              <option value="parcel">📦 Parcel</option>
            </select>
          </label>
          <label className="block">
            <span className={label}>Delivery charge (₹)</span>
            <input inputMode="decimal" value={deliveryRupees} placeholder="0" onChange={(e) => setDeliveryRupees(e.target.value.replace(/[^\d.]/g, ''))} className={input} />
          </label>
          <label className="block">
            <span className={label}>Discount (₹)</span>
            <input inputMode="decimal" value={discountRupees} placeholder="0" onChange={(e) => setDiscountRupees(e.target.value.replace(/[^\d.]/g, ''))} className={input} />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="block">
            <span className={label}>Paid with</span>
            <select value={paymentId} onChange={(e) => setPaymentId(e.target.value)} className={input}>
              {PAYMENT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <div>
            <span className={label}>Payment</span>
            <div className="grid grid-cols-2 gap-2">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => setPaid(v)}
                  className={`py-2 rounded-xl border text-xs font-semibold ${
                    paid === v
                      ? v
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                        : 'bg-amber-50 border-amber-400 text-amber-800'
                      : 'bg-white border-[#EBD8DC] text-[#5C3E45]'
                  }`}
                >
                  {v ? 'Received ✓' : 'Not yet'}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className={label}>Order status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as ManualOrderInput['status'])} className={input}>
              <option value="placed">New</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">In crafting</option>
              <option value="ready">Ready</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className={label}>Note for yourself (optional)</span>
          <textarea value={note} maxLength={500} rows={2} onChange={(e) => setNote(e.target.value)} className={input} placeholder="e.g. Instagram DM @username, paid in two parts" />
        </label>

        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2" role="alert">{error}</p>}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[#F0E6E8]">
          <p className="text-sm text-[#5C3E45]">
            Total: <span className="font-serif font-bold text-lg text-[#D96B82]">{formatPaise(total)}</span>
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-full border border-[#EBD8DC] text-sm text-[#7A5B62]">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="px-6 py-2.5 rounded-full bg-[#C0536A] hover:bg-[#A83D53] text-white text-sm font-bold disabled:opacity-60">
              {busy ? 'Saving…' : 'Save order'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
