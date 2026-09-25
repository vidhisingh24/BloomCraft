import React, { useRef, useState } from 'react';
import type { Order } from '../../types';
import { siteConfig } from '../../config/site.config';
import { formatPaise } from '../../utils/currency';
import { formatISTDateTime } from '../../utils/date';
import { useToast } from '../../context/ToastContext';
import { trackEvent } from '../../utils/analytics';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Download, 
  Printer, 
  Share2, 
  Check, 
  MapPin, 
  Phone, 
  ArrowLeft
} from 'lucide-react';

interface ReceiptViewProps {
  order: Order;
  onBack?: () => void;
}

export const ReceiptView: React.FC<ReceiptViewProps> = ({ order, onBack }) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const { showToast } = useToast();

  const handleDownloadPdf = async () => {
    if (!receiptRef.current) return;
    setIsGeneratingPdf(true);
    trackEvent('receipt_download', { orderId: order.id });

    try {
      showToast('Generating PDF 📄', 'Preparing your official keepsake receipt...', 'info');
      
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FAF8F5',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Bloomcraft-Receipt-${order.id}.pdf`);

      showToast('Receipt Downloaded! 🌸', `Bloomcraft-Receipt-${order.id}.pdf`, 'cart');
    } catch (err) {
      console.error('PDF generation error:', err);
      showToast('PDF Export Error', 'Please use the Print option as an alternative', 'info');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `BloomCraft Receipt — ${order.id}`,
          text: `Official order receipt for BloomCraft Order #${order.id}`,
          url: shareUrl,
        });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      showToast('Receipt Link Copied! 📋', 'Shareable link copied to clipboard', 'cart');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl border border-[#F0E6E8] shadow-xs">
        {onBack && (
          <button
            onClick={onBack}
            className="text-xs font-semibold text-[#7A5B62] hover:text-[#D96B82] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Order
          </button>
        )}

        <div className="flex items-center gap-2.5 ml-auto">
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-4 py-2.5 rounded-full bg-[#D96B82] text-white text-xs font-bold hover:bg-[#C0536A] shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            {isGeneratingPdf ? 'Rendering PDF...' : 'Download PDF'}
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-full bg-[#FAF8F5] border border-[#EBD8DC] text-[#3D272A] text-xs font-bold hover:bg-[#FFE3E8] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>

          <button
            onClick={handleShare}
            className="px-3.5 py-2.5 rounded-full bg-[#FAF8F5] border border-[#EBD8DC] text-[#3D272A] text-xs font-bold hover:bg-[#FFE3E8] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Share2 className="w-3.5 h-3.5" />}
            {copiedLink ? 'Copied' : 'Share'}
          </button>
        </div>
      </div>

      {/* Printable Receipt Card */}
      <div
        ref={receiptRef}
        id="bloomcraft-receipt"
        className="bg-[#FAF8F5] p-6 sm:p-10 rounded-3xl border border-[#EBD8DC] shadow-xs text-[#3D272A]"
      >
        {/* Brand Header */}
        <div className="text-center pb-6 border-b border-[#EBD8DC]">
          <div className="inline-flex items-center justify-center gap-2 mb-1">
            <span className="text-2xl">🌸</span>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-wider text-[#3D272A]">
              {siteConfig.name}
            </h1>
            <span className="text-2xl">🌸</span>
          </div>
          <p className="text-xs italic text-[#7A5B62] font-serif tracking-wide">
            {siteConfig.tagline}
          </p>
          <p className="text-[11px] text-[#A38B90] mt-1 font-medium">
            Handmade Studio • Vadodara, Gujarat, India • WhatsApp: {siteConfig.whatsappFormatted}
          </p>
        </div>

        {/* Order Meta & Customer Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-[#EBD8DC] text-xs">
          <div>
            <span className="text-[10px] font-bold text-[#D96B82] uppercase tracking-widest block mb-1">
              Order Details
            </span>
            <p className="font-mono font-bold text-sm text-[#3D272A]">{order.id}</p>
            <p className="text-[#7A5B62] mt-0.5">Date: {formatISTDateTime(order.createdAt)} (IST)</p>
            <p className="text-[#7A5B62]">
              Payment: <span className="font-semibold text-[#3D272A] uppercase">{order.payment.method}</span> ({order.payment.status.toUpperCase()})
            </p>
            {order.payment.upiTxnRef && (
              <p className="text-[#7A5B62] font-mono text-[11px]">UTR: {order.payment.upiTxnRef}</p>
            )}
          </div>

          <div>
            <span className="text-[10px] font-bold text-[#D96B82] uppercase tracking-widest block mb-1">
              Billed & Delivered To
            </span>
            <p className="font-bold text-sm text-[#3D272A]">{order.customer.name}</p>
            <p className="text-[#7A5B62]">+91 {order.customer.phone}</p>
            {order.customer.email && <p className="text-[#7A5B62]">{order.customer.email}</p>}
          </div>
        </div>

        {/* Delivery Mode Info */}
        <div className="py-4 border-b border-[#EBD8DC] text-xs bg-white/50 p-4 rounded-xl my-4">
          <span className="text-[10px] font-bold text-[#D96B82] uppercase tracking-widest block mb-1">
            Fulfillment Method
          </span>
          {order.delivery.method === 'vadodara_local' && (
            <div>
              <p className="font-bold text-[#3D272A]">📍 Vadodara Local Handover (Free Pickup)</p>
              <p className="text-[#7A5B62] mt-0.5">
                Area: {(order.delivery.details as any).area} • Preferred Date: {(order.delivery.details as any).preferredDate} ({(order.delivery.details as any).preferredTimeSlot})
              </p>
            </div>
          )}
          {order.delivery.method === 'college' && (
            <div>
              <p className="font-bold text-[#3D272A]">🏫 College Campus Delivery</p>
              <p className="text-[#7A5B62] mt-0.5">
                {(order.delivery.details as any).collegeName} • Handover Point: {(order.delivery.details as any).deliveryPoint} • Date: {(order.delivery.details as any).preferredDate}
              </p>
            </div>
          )}
          {order.delivery.method === 'parcel' && (
            <div>
              <p className="font-bold text-[#3D272A]">📦 Pan-India Courier Parcel</p>
              <p className="text-[#7A5B62] mt-0.5">
                {(order.delivery.details as any).house}, {(order.delivery.details as any).street}, {(order.delivery.details as any).city}, {(order.delivery.details as any).state} - {(order.delivery.details as any).pincode}
              </p>
            </div>
          )}
        </div>

        {/* Line Items Table */}
        <div className="py-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-[#EBD8DC] text-[#7A5B62] uppercase tracking-wider font-bold">
                <th className="py-2.5 pr-2">Handmade Item</th>
                <th className="py-2.5 px-2 text-center">Qty</th>
                <th className="py-2.5 px-2 text-right">Price</th>
                <th className="py-2.5 pl-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0E6E8]">
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3 pr-2">
                    <p className="font-bold text-[#3D272A]">{item.name || item.product?.name}</p>
                    <p className="text-[11px] text-[#7A5B62]">
                      {item.selectedColor ? `Color: ${item.selectedColor}` : ''}
                      {item.customNote ? ` • Note: "${item.customNote}"` : ''}
                    </p>
                  </td>
                  <td className="py-3 px-2 text-center font-semibold text-[#3D272A]">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-2 text-right text-[#7A5B62]">
                    {formatPaise(item.priceAtAdd)}
                  </td>
                  <td className="py-3 pl-2 text-right font-bold text-[#3D272A]">
                    {formatPaise(item.priceAtAdd * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing Summary */}
        <div className="border-t-2 border-[#EBD8DC] pt-4 space-y-2 text-xs text-[#7A5B62]">
          <div className="flex justify-between">
            <span>Items Subtotal</span>
            <span className="font-semibold text-[#3D272A]">{formatPaise(order.pricing.subtotal)}</span>
          </div>

          <div className="flex justify-between">
            <span>Delivery & Packaging</span>
            <span className="font-semibold text-[#3D272A]">
              {order.pricing.delivery === 0 ? 'FREE' : formatPaise(order.pricing.delivery)}
            </span>
          </div>

          {order.pricing.giftWrap > 0 && (
            <div className="flex justify-between text-[#D96B82]">
              <span>Handcrafted Gift Wrap & Ribbon</span>
              <span className="font-semibold">{formatPaise(order.pricing.giftWrap)}</span>
            </div>
          )}

          {order.pricing.discount > 0 && (
            <div className="flex justify-between text-[#0A7B3E]">
              <span>Coupon Discount ({order.couponCode || 'PROMO'})</span>
              <span className="font-semibold">-{formatPaise(order.pricing.discount)}</span>
            </div>
          )}

          <div className="border-t border-[#EBD8DC] pt-3 flex justify-between items-baseline">
            <span className="font-serif font-bold text-base text-[#3D272A]">Total Amount</span>
            <span className="font-serif font-bold text-2xl text-[#D96B82]">
              {formatPaise(order.pricing.total)}
            </span>
          </div>
        </div>

        {order.giftMessage && (
          <div className="mt-6 p-4 rounded-xl bg-[#FFF0F3] border border-[#FFE3E8] text-xs">
            <span className="font-bold text-[#D96B82] uppercase tracking-wider block mb-1">
              🎁 Enclosed Keepsake Gift Message
            </span>
            <p className="italic text-[#3D272A]">"{order.giftMessage}"</p>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-8 pt-6 border-t border-[#EBD8DC] text-center space-y-2">
          <p className="text-xs font-serif italic text-[#3D272A]">
            Thank you for supporting our slow, handmade crochet art! 🌸
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-[#7A5B62]">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-[#D96B82]" /> {siteConfig.whatsappFormatted}
            </span>
            <span className="flex items-center gap-1">
              <span className="text-sm">📸</span> {siteConfig.instagramHandle}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#D96B82]" /> Vadodara, Gujarat
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
