import type { Order } from '../../types';
import { formatPaise } from '../../utils/currency';

/** Short two-note chime, generated in the browser (no audio file to load). */
export function playChime(): void {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [880, 1318.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      const start = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
    setTimeout(() => void ctx.close(), 1000);
  } catch {
    // Sound is a nicety; ignore browsers that block it.
  }
}

export function canNotify(): boolean {
  return typeof Notification !== 'undefined' && Notification.permission === 'granted';
}

export async function askNotificationPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}

export function orderAlertText(order: Order): { title: string; body: string } {
  const paid =
    order.payment.method === 'upi' ? `UPI · UTR ${order.payment.upiTxnRef ?? '—'}` : 'Pay on handover';
  return {
    title: `🌸 New order ${order.id} — ${formatPaise(order.pricing.total)}`,
    body: `${order.customer.name} · ${order.items.length} item${order.items.length === 1 ? '' : 's'} · ${paid}`,
  };
}

/** System notification (works while the dashboard tab is in the background). */
export function systemNotify(title: string, body: string): void {
  if (!canNotify()) return;
  try {
    new Notification(title, { body, icon: '/favicon.svg', tag: title });
  } catch {
    // Some mobile browsers only allow notifications from a service worker.
  }
}
