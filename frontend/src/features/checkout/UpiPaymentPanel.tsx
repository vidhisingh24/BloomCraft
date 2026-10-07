import React, { useEffect, useState } from 'react';
import { siteConfig } from '../../config/site.config';
import { formatPaise } from '../../utils/currency';
import { useToast } from '../../context/ToastContext';
import { OFFICIAL_QR_BY_PAISE, UPI_APPS, buildUpiLink, upiQrDataUrl } from './upi';
import { Copy, Check, Download, Loader2, ShieldCheck, Smartphone, QrCode, ChevronDown } from 'lucide-react';

interface Props {
  amountPaise: number;
  utr: string;
  error?: string;
  onUtrChange: (utr: string) => void;
}

/**
 * Real UPI payment, no simulation:
 * 1. desktop: scan the QR (official Google Pay card for ₹85 / ₹100, otherwise a QR generated
 *    for the same UPI ID with the exact total); phone: tap the button to open the UPI app;
 * 2. enter the 12-digit UPI reference (UTR) shown by the app;
 * 3. the order is saved as "awaiting verification" and the maker marks it paid from the
 *    dashboard after checking the bank app.
 */
export const UpiPaymentPanel: React.FC<Props> = ({ amountPaise, utr, error, onUtrChange }) => {
  const { showToast } = useToast();
  const official = OFFICIAL_QR_BY_PAISE[amountPaise];
  const link = buildUpiLink(amountPaise);
  const [generated, setGenerated] = useState('');
  const [copied, setCopied] = useState(false);
  const [showQrOnPhone, setShowQrOnPhone] = useState(false);

  useEffect(() => {
    if (official) return;
    let cancelled = false;
    upiQrDataUrl(link)
      .then((url) => !cancelled && setGenerated(url))
      .catch(() => !cancelled && setGenerated(''));
    return () => {
      cancelled = true;
    };
  }, [link, official]);

  const qrSrc = official || generated;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(siteConfig.upiId);
    } catch {
      /* clipboard blocked: the ID is visible anyway */
    }
    setCopied(true);
    showToast('UPI ID Copied! 📋', siteConfig.upiId, 'cart');
    setTimeout(() => setCopied(false), 2500);
  };

  const qrCard = (
    <div className="text-center">
      <div className="inline-block p-2 rounded-2xl border border-[#F0E6E8] bg-white shadow-xs">
        {qrSrc ? (
          <img
            src={qrSrc}
            alt={`UPI QR code to pay ${formatPaise(amountPaise)} to ${siteConfig.upiId}`}
            className={official ? 'w-48 sm:w-52 h-auto rounded-xl' : 'w-48 h-48 sm:w-52 sm:h-52'}
          />
        ) : (
          <div className="w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[#D96B82]" />
          </div>
        )}
      </div>
      <p className="text-xs text-[#A38B90] mt-1.5">
        {official ? 'Official Google Pay QR' : 'Amount pre-filled in your UPI app'}
        {qrSrc && (
          <>
            {' · '}
            <a
              href={qrSrc}
              download={`BloomCraft-UPI-${(amountPaise / 100).toFixed(0)}.${official ? 'jpg' : 'png'}`}
              className="inline-flex items-center gap-0.5 font-semibold text-[#D96B82] hover:underline"
            >
              <Download className="w-3 h-3" /> Save
            </a>
          </>
        )}
      </p>
    </div>
  );

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EBD8DC] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        {/* QR: always visible on tablets/desktops; folded on phones (you can't scan your own screen) */}
        <div className="hidden sm:block shrink-0">{qrCard}</div>

        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <p className="text-[11px] text-[#A38B90] uppercase font-bold tracking-wider">Amount to pay</p>
            <p className="text-2xl font-bold text-[#3D272A] leading-tight">{formatPaise(amountPaise)}</p>
          </div>

          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#F0E6E8]">
            <div className="min-w-0">
              <p className="text-[10px] text-[#A38B90] uppercase font-bold tracking-wider">UPI ID</p>
              <p className="font-mono font-semibold text-[#3D272A] text-sm truncate" title={siteConfig.upiId}>
                {siteConfig.upiId}
              </p>
              <p className="text-[11px] text-[#7A5B62] truncate">{siteConfig.upiPayeeName} · BloomCraft maker</p>
            </div>
            <button
              type="button"
              onClick={copy}
              className="px-3 py-2 rounded-lg bg-white border border-[#EBD8DC] text-xs font-semibold text-[#3D272A] hover:bg-[#FFE3E8] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-[#D96B82]" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Phones: open the installed UPI app with the amount filled in */}
          <a
            href={link}
            className="sm:hidden w-full py-3 rounded-xl bg-[#D96B82] text-white text-center font-semibold text-sm shadow-md flex items-center justify-center gap-2"
          >
            <Smartphone className="w-4 h-4" /> Pay {formatPaise(amountPaise)} in my UPI app
          </a>
          <button
            type="button"
            onClick={() => setShowQrOnPhone((v) => !v)}
            className="sm:hidden w-full py-2 text-xs font-semibold text-[#7A5B62] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            {showQrOnPhone ? 'Hide QR code' : 'Show QR code (pay from another phone)'}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showQrOnPhone ? 'rotate-180' : ''}`} />
          </button>
          {showQrOnPhone && <div className="sm:hidden">{qrCard}</div>}

          <div className="flex flex-wrap items-center gap-1.5">
            {UPI_APPS.map((a) => (
              <span
                key={a.id}
                title={a.name}
                className="w-6 h-6 rounded-md text-white text-[9px] font-bold flex items-center justify-center"
                style={{ backgroundColor: a.bg }}
              >
                {a.short}
              </span>
            ))}
            <span className="text-[11px] text-[#7A5B62] ml-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> zero fees, paid directly to the maker
            </span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-[#F0E6E8]">
        <label htmlFor="upi-utr" className="block text-xs font-bold text-[#3D272A] uppercase tracking-wider mb-1">
          After paying: UPI Reference / UTR <span className="text-[#D96B82]">*</span>
        </label>
        <input
          id="upi-utr"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={12}
          placeholder="12-digit number, e.g. 412345678901"
          value={utr}
          onKeyDown={(e) => {
            if (e.key.length === 1 && !/[0-9]/.test(e.key) && !e.ctrlKey && !e.metaKey) e.preventDefault();
          }}
          onChange={(e) => onUtrChange(e.target.value.replace(/\D/g, '').slice(0, 12))}
          className={`w-full px-4 py-2.5 rounded-xl border text-base sm:text-sm bg-white font-mono tracking-wider focus:outline-none ${
            error ? 'border-red-400 bg-red-50/30' : 'border-[#EBD8DC] focus:border-[#D96B82]'
          }`}
        />
        {error ? (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        ) : (
          <p className="text-[11px] text-[#A38B90] mt-1">
            {utr.length > 0 && utr.length < 12
              ? `${utr.length}/12 digits`
              : 'Shown as "UPI transaction ID" / "UTR" in your payment app. The maker confirms it and marks your order paid.'}
          </p>
        )}
      </div>
    </div>
  );
};
