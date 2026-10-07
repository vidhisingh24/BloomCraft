import jsPDF from 'jspdf';
import type { Order } from '../../types';
import { siteConfig } from '../../config/site.config';
import { formatISTDateTime } from '../../utils/date';

/**
 * Builds the receipt PDF by drawing it with jsPDF (text + shapes) instead of screenshotting
 * the DOM: html2canvas can't parse Tailwind v4's oklch() colours, which made the old
 * "Download PDF" fail. Drawing also gives crisp, selectable text and a small file.
 *
 * jsPDF's built-in fonts are Latin-1 only, so "₹" is written as "Rs." and emoji / other
 * symbols are stripped from user-entered text.
 */

const PINK: [number, number, number] = [217, 107, 130];
const INK: [number, number, number] = [61, 39, 42];
const MUTED: [number, number, number] = [122, 91, 98];
const LINE: [number, number, number] = [235, 216, 220];
const CREAM: [number, number, number] = [250, 248, 245];
const GREEN: [number, number, number] = [10, 123, 62];

function clean(value: unknown): string {
  return String(value ?? '')
    .replace(/₹/g, 'Rs.')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function money(paise: number): string {
  return `Rs. ${(paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: paise % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

function paymentLabel(order: Order): string {
  if (order.payment.method === 'cod') return 'Pay on Handover (Cash / UPI)';
  return order.payment.provider ? `UPI (${order.payment.provider})` : 'UPI';
}

function deliveryLines(order: Order): [string, string] {
  const d = order.delivery.details as unknown as Record<string, string | undefined>;
  if (order.delivery.method === 'vadodara_local') {
    return [
      'Vadodara Local Handover (Free Pickup)',
      `Area: ${clean(d.area)} | Date: ${clean(d.preferredDate)} | Slot: ${clean(d.preferredTimeSlot)}`,
    ];
  }
  if (order.delivery.method === 'college') {
    return [
      'College Campus Delivery',
      `${clean(d.collegeName)} | Handover: ${clean(d.deliveryPoint)} | Date: ${clean(d.preferredDate)}`,
    ];
  }
  return [
    'Pan-India Courier Parcel',
    [d.house, d.street, d.area, d.city, d.state].map(clean).filter(Boolean).join(', ') +
      (d.pincode ? ` - ${clean(d.pincode)}` : ''),
  ];
}

export function buildReceiptPdf(order: Order): jsPDF {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const M = 16;
  let y = 0;

  const text = (
    value: string,
    x: number,
    yy: number,
    opts: { size?: number; bold?: boolean; color?: [number, number, number]; align?: 'left' | 'right' | 'center' } = {},
  ) => {
    pdf.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    pdf.setFontSize(opts.size ?? 9);
    pdf.setTextColor(...(opts.color ?? INK));
    pdf.text(value, x, yy, { align: opts.align ?? 'left' });
  };
  const rule = (yy: number) => {
    pdf.setDrawColor(...LINE);
    pdf.setLineWidth(0.3);
    pdf.line(M, yy, W - M, yy);
  };
  const ensureSpace = (needed: number) => {
    if (y + needed > H - 30) {
      pdf.addPage();
      y = M;
    }
  };

  // ---- header band
  pdf.setFillColor(...CREAM);
  pdf.rect(0, 0, W, 42, 'F');
  pdf.setFillColor(...PINK);
  pdf.rect(0, 0, W, 3, 'F');
  text(clean(siteConfig.name), M, 18, { size: 22, bold: true });
  text(clean(siteConfig.tagline), M, 25, { size: 9, color: MUTED });
  text(
    `Handmade Studio, Vadodara, Gujarat | WhatsApp ${clean(siteConfig.whatsappFormatted)}${siteConfig.email ? ` | ${clean(siteConfig.email)}` : ''}`,
    M,
    31,
    { size: 7.5, color: MUTED },
  );
  text('ORDER RECEIPT', W - M, 18, { size: 13, bold: true, color: PINK, align: 'right' });
  text(clean(order.id), W - M, 25, { size: 9, bold: true, align: 'right' });
  text(`${clean(formatISTDateTime(order.createdAt))} IST`, W - M, 31, {
    size: 7.5,
    color: MUTED,
    align: 'right',
  });
  y = 52;

  // ---- billed to / payment
  const col2 = W / 2 + 4;
  text('BILLED & DELIVERED TO', M, y, { size: 7, bold: true, color: PINK });
  text('PAYMENT', col2, y, { size: 7, bold: true, color: PINK });
  y += 5.5;
  text(clean(order.customer.name), M, y, { size: 10, bold: true });
  text(paymentLabel(order), col2, y, { size: 10, bold: true });
  y += 5;
  text(order.customer.phone ? `+91 ${clean(order.customer.phone).replace(/^\+?91/, '')}` : '', M, y, {
    color: MUTED,
  });
  const paid = order.payment.status === 'paid';
  text(`Status: ${order.payment.status.replace(/_/g, ' ').toUpperCase()}`, col2, y, {
    color: paid ? GREEN : MUTED,
    bold: paid,
  });
  y += 5;
  if (order.customer.email) text(clean(order.customer.email), M, y, { color: MUTED });
  if (order.payment.upiTxnRef) text(`UPI Ref (UTR): ${clean(order.payment.upiTxnRef)}`, col2, y, { color: MUTED });
  y += 8;

  // ---- fulfilment
  const [method, detail] = deliveryLines(order);
  const detailLines = pdf.splitTextToSize(detail, W - 2 * M - 8) as string[];
  const boxH = 12 + detailLines.length * 4;
  pdf.setFillColor(...CREAM);
  pdf.roundedRect(M, y, W - 2 * M, boxH, 2, 2, 'F');
  text('FULFILMENT', M + 4, y + 5.5, { size: 7, bold: true, color: PINK });
  text(method, M + 4, y + 10.5, { size: 9.5, bold: true });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(...MUTED);
  pdf.text(detailLines, M + 4, y + 15);
  y += boxH + 8;

  // ---- items table
  const cQty = W - M - 62;
  const cPrice = W - M - 32;
  const cTotal = W - M;
  text('HANDMADE ITEM', M, y, { size: 7.5, bold: true, color: MUTED });
  text('QTY', cQty, y, { size: 7.5, bold: true, color: MUTED, align: 'center' });
  text('PRICE', cPrice, y, { size: 7.5, bold: true, color: MUTED, align: 'right' });
  text('TOTAL', cTotal, y, { size: 7.5, bold: true, color: MUTED, align: 'right' });
  y += 2.5;
  pdf.setDrawColor(...LINE);
  pdf.setLineWidth(0.6);
  pdf.line(M, y, W - M, y);
  y += 6;

  for (const item of order.items) {
    const name = clean(item.name);
    const nameLines = pdf.splitTextToSize(name, cQty - M - 12) as string[];
    const meta = [
      item.selectedColor ? `Colour: ${clean(item.selectedColor)}` : '',
      item.customNote ? `Note: "${clean(item.customNote)}"` : '',
    ]
      .filter(Boolean)
      .join(' | ');
    ensureSpace(nameLines.length * 4.5 + (meta ? 4 : 0) + 6);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(...INK);
    pdf.text(nameLines, M, y);
    text(String(item.quantity), cQty, y, { size: 9.5, align: 'center' });
    text(money(item.priceAtAdd), cPrice, y, { size: 9.5, color: MUTED, align: 'right' });
    text(money(item.priceAtAdd * item.quantity), cTotal, y, { size: 9.5, bold: true, align: 'right' });
    y += nameLines.length * 4.5;
    if (meta) {
      text(meta, M, y, { size: 7.5, color: MUTED });
      y += 4;
    }
    y += 2;
    rule(y);
    y += 6;
  }

  // ---- totals
  ensureSpace(50);
  const label = W - M - 70;
  const row = (l: string, v: string, color: [number, number, number] = MUTED) => {
    text(l, label, y, { size: 9, color });
    text(v, cTotal, y, { size: 9, bold: true, color: color === MUTED ? INK : color, align: 'right' });
    y += 5.5;
  };
  row('Items subtotal', money(order.pricing.subtotal));
  row('Delivery & packaging', order.pricing.delivery === 0 ? 'FREE' : money(order.pricing.delivery));
  if (order.pricing.giftWrap > 0) row('Gift wrap & ribbon', money(order.pricing.giftWrap), PINK);
  if (order.pricing.discount > 0) {
    row(`Coupon (${clean(order.couponCode || 'PROMO')})`, `- ${money(order.pricing.discount)}`, GREEN);
  }
  pdf.setDrawColor(...LINE);
  pdf.setLineWidth(0.4);
  pdf.line(label, y - 1.5, W - M, y - 1.5);
  y += 4;
  text('Total amount', label, y, { size: 11, bold: true });
  text(money(order.pricing.total), cTotal, y, { size: 15, bold: true, color: PINK, align: 'right' });

  if (paid) {
    pdf.setDrawColor(...GREEN);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(M, y - 12, 34, 14, 2, 2, 'S');
    text('PAID', M + 17, y - 3.5, { size: 14, bold: true, color: GREEN, align: 'center' });
  }
  y += 12;

  // ---- gift message
  if (order.giftMessage) {
    const msg = pdf.splitTextToSize(`"${clean(order.giftMessage)}"`, W - 2 * M - 8) as string[];
    ensureSpace(14 + msg.length * 4);
    pdf.setFillColor(255, 240, 243);
    pdf.roundedRect(M, y, W - 2 * M, 10 + msg.length * 4, 2, 2, 'F');
    text('ENCLOSED GIFT MESSAGE', M + 4, y + 5.5, { size: 7, bold: true, color: PINK });
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.setTextColor(...INK);
    pdf.text(msg, M + 4, y + 10);
  }

  // ---- footer on every page
  const pages = pdf.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    pdf.setPage(p);
    rule(H - 22);
    text('Thank you for supporting slow, handmade crochet art!', W / 2, H - 16, {
      size: 9,
      color: INK,
      align: 'center',
    });
    text(
      `WhatsApp ${clean(siteConfig.whatsappFormatted)} | ${clean(siteConfig.instagramHandle)} | Vadodara, Gujarat`,
      W / 2,
      H - 11,
      { size: 7.5, color: MUTED, align: 'center' },
    );
    text(`Page ${p} of ${pages}`, W - M, H - 6, { size: 7, color: MUTED, align: 'right' });
  }
  return pdf;
}

export function downloadReceiptPdf(order: Order): string {
  const fileName = `Bloomcraft-Receipt-${clean(order.id)}.pdf`;
  buildReceiptPdf(order).save(fileName);
  return fileName;
}
