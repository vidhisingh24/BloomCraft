// Sends the maker an instant alert for every new order and custom request.
// Triggered by Supabase Database Webhooks (INSERT on public.orders and public.custom_requests).
//
// Secrets (Supabase → Edge Functions → Secrets) — set the channels you want, skip the rest:
//   WEBHOOK_SECRET        required; same value as the webhook's "x-webhook-secret" header
//   TELEGRAM_BOT_TOKEN    + TELEGRAM_CHAT_ID       → Telegram message (free, instant push)
//   CALLMEBOT_PHONE       + CALLMEBOT_APIKEY       → WhatsApp message to your own number (free)
//   RESEND_API_KEY        + MAKER_EMAIL (+ ALERT_FROM_EMAIL) → e-mail
//   SITE_URL              link to the dashboard in the alert (e.g. https://bloomcraft.vercel.app)

type Json = Record<string, unknown>;

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: Json | null;
}

const env = (name: string) => Deno.env.get(name)?.trim() || '';
const rupees = (paise: unknown) => `₹${(Number(paise ?? 0) / 100).toLocaleString('en-IN')}`;

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function orderMessage(o: Json): { subject: string; text: string } {
  const customer = (o.customer ?? {}) as Json;
  const pricing = (o.pricing ?? {}) as Json;
  const payment = (o.payment ?? {}) as Json;
  const delivery = (o.delivery ?? {}) as Json;
  const items = (o.items ?? []) as Json[];

  const paid = payment.method === 'upi'
    ? `UPI — UTR ${payment.upiTxnRef} (check your bank app, then mark Paid)`
    : 'Pay on handover';
  const method = { vadodara_local: 'Vadodara handover', college: 'College campus', parcel: 'Parcel' }[
    String(delivery.method)
  ] ?? String(delivery.method);

  const lines = [
    `🌸 New order ${o.id} — ${rupees(pricing.total)}`,
    '',
    ...items.map((i) => `• ${i.name} × ${i.quantity}${i.selectedColor ? ` (${i.selectedColor})` : ''}${i.customNote ? ` — “${i.customNote}”` : ''}`),
    '',
    `👤 ${customer.name} · +91 ${customer.phone}`,
    `🚚 ${method}`,
    `💳 ${paid}`,
  ];
  if (o.gift_wrap_requested) lines.push(`🎁 Gift wrap${o.gift_message ? `: “${o.gift_message}”` : ''}`);
  const site = env('SITE_URL');
  if (site) lines.push('', `Open Maker Studio: ${site}`);
  return { subject: `New BloomCraft order ${o.id} — ${rupees(pricing.total)}`, text: lines.join('\n') };
}

function customRequestMessage(r: Json): { subject: string; text: string } {
  const customer = (r.customer ?? {}) as Json;
  const lines = [
    `✨ New custom request ${r.id}`,
    '',
    `🧶 ${r.item_type ?? 'Custom piece'}`,
    `📝 ${r.description}`,
    `👤 ${customer.name} · +91 ${customer.phone}`,
    `💬 https://wa.me/91${customer.phone}`,
  ];
  return { subject: `New custom request ${r.id}`, text: lines.join('\n') };
}

async function sendTelegram(text: string): Promise<string> {
  const token = env('TELEGRAM_BOT_TOKEN');
  const chat = env('TELEGRAM_CHAT_ID');
  if (!token || !chat) return 'telegram: skipped';
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
  });
  return `telegram: ${res.status}`;
}

async function sendWhatsApp(text: string): Promise<string> {
  const phone = env('CALLMEBOT_PHONE');
  const key = env('CALLMEBOT_APIKEY');
  if (!phone || !key) return 'whatsapp: skipped';
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  return `whatsapp: ${res.status}`;
}

async function sendEmail(subject: string, text: string): Promise<string> {
  const key = env('RESEND_API_KEY');
  const to = env('MAKER_EMAIL');
  if (!key || !to) return 'email: skipped';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env('ALERT_FROM_EMAIL') || 'BloomCraft <onboarding@resend.dev>',
      to: [to],
      subject,
      text,
    }),
  });
  return `email: ${res.status}`;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const secret = env('WEBHOOK_SECRET');
  if (!secret || !timingSafeEqual(req.headers.get('x-webhook-secret') ?? '', secret)) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Webhook bodies are a few KB; refuse anything large before parsing it.
  const body = await req.text();
  if (body.length > 100_000) return new Response('Payload too large', { status: 413 });

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }
  if (payload.type !== 'INSERT' || !payload.record) return new Response('ignored');

  const message =
    payload.table === 'orders' ? orderMessage(payload.record)
    : payload.table === 'custom_requests' ? customRequestMessage(payload.record)
    : null;
  if (!message) return new Response('ignored');

  const results = await Promise.allSettled([
    sendTelegram(message.text),
    sendWhatsApp(message.text),
    sendEmail(message.subject, message.text),
  ]);
  const summary = results.map((r) => (r.status === 'fulfilled' ? r.value : `error: ${r.reason}`));
  console.log(payload.table, payload.record.id, summary.join(', '));
  return Response.json({ ok: true, channels: summary });
});
