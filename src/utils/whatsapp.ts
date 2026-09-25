import { siteConfig } from '../config/site.config';
import type { Order, Product, CustomRequest } from '../types';
import { formatPaise } from './currency';

/**
 * Builds a direct wa.me link with encoded message
 */
export function buildWhatsAppLink(message: string, customPhone?: string): string {
  const phone = customPhone || siteConfig.whatsappNumber;
  const cleaned = phone.replace(/[^0-9]/g, '');
  const encoded = encodeURIComponent(message.trim());
  return `https://wa.me/${cleaned}?text=${encoded}`;
}

/**
 * Builds a structured WhatsApp message for an Order
 */
export function buildOrderMessage(order: Order): string {
  const itemsText = order.items
    .map((item, i) => {
      const colorText = item.selectedColor ? ` [${item.selectedColor}]` : '';
      const noteText = item.customNote ? ` (Personalization: "${item.customNote}")` : '';
      return `${i + 1}. *${item.name || item.product?.name || 'Crochet Item'}*${colorText} × ${item.quantity}${noteText} — ${formatPaise((item.priceAtAdd || 0) * item.quantity)}`;
    })
    .join('\n');

  let deliverySummary = '';
  if (order.delivery.method === 'vadodara_local') {
    const d = order.delivery.details as any;
    deliverySummary = `📍 *Vadodara Local Handover*\n• Preferred Area: ${d.area || 'To be decided'}\n• Date: ${d.preferredDate || 'Flexible'}\n• Slot: ${d.preferredTimeSlot || 'Flexible'}`;
  } else if (order.delivery.method === 'college') {
    const d = order.delivery.details as any;
    deliverySummary = `🏫 *College Delivery*\n• College: ${d.collegeName || 'Vadodara Campus'}\n• Campus/Spot: ${d.deliveryPoint || 'Main Gate'}\n• Preferred Date: ${d.preferredDate || 'Flexible'}`;
  } else {
    const d = order.delivery.details as any;
    deliverySummary = `📦 *Parcel Delivery*\n• Address: ${d.house ? `${d.house}, ${d.street}, ${d.area}` : 'Provided in order'}\n• City & State: ${d.city || 'Vadodara'}, ${d.state || 'Gujarat'} - ${d.pincode || ''}`;
  }

  const paymentText = `💳 *Payment Method:* ${order.payment.method === 'upi' ? 'UPI (Online)' : 'Cash / Pay on Handover'} (${order.payment.status.toUpperCase()})${order.payment.upiTxnRef ? `\n• UPI Txn Ref: ${order.payment.upiTxnRef}` : ''}`;

  return `🌸 *BLOOMCRAFT ORDER — ${order.id}* 🌸

Hi BloomCraft! I've placed an order on the website:

👤 *Customer:* ${order.customer.name} (${order.customer.phone})

🧶 *Items Ordered:*
${itemsText}

💰 *Price Breakdown:*
• Subtotal: ${formatPaise(order.pricing.subtotal)}
• Delivery: ${order.pricing.delivery === 0 ? 'FREE' : formatPaise(order.pricing.delivery)}
${order.pricing.giftWrap > 0 ? `• Gift Wrap & Card: ${formatPaise(order.pricing.giftWrap)}\n` : ''}${order.pricing.discount > 0 ? `• Discount: -${formatPaise(order.pricing.discount)}\n` : ''}👉 *Total Amount:* *${formatPaise(order.pricing.total)}*

${deliverySummary}

${paymentText}
${order.giftMessage ? `\n🎁 *Gift Message:* "${order.giftMessage}"\n` : ''}
Please confirm my handmade order and estimated delivery time! 💕`;
}

/**
 * Builds a pre-filled WhatsApp enquiry message for a specific product
 */
export function buildProductEnquiry(
  product: Product,
  color?: string,
  qty: number = 1
): string {
  const colorPart = color ? ` in *${color}*` : '';
  return `🌸 Hi BloomCraft! I am interested in ordering *${product.name}*${colorPart} (Qty: ${qty}) priced at ${formatPaise(product.price)} from your handmade crochet collection.\n\nCould you please share availability and customization options? ✨`;
}

/**
 * Builds WhatsApp message for custom crochet quote request
 */
export function buildCustomRequestMessage(request: CustomRequest): string {
  const budgetText =
    request.budget?.min || request.budget?.max
      ? `₹${request.budget.min || 0} – ₹${request.budget.max || ''}`
      : 'Flexible';

  return `🌸 *CUSTOM CROCHET REQUEST — ${request.id}* 🌸

Hi BloomCraft! I'd love to request a custom crochet piece:

👤 *Customer:* ${request.customer.name} (${request.customer.phone})
${request.itemType ? `🧶 *Category:* ${request.itemType}\n` : ''}🎨 *Color Theme:* ${request.colors?.length ? request.colors.join(', ') : 'Open to suggestions'}
🔢 *Quantity:* ${request.quantity || 1}
💰 *Target Budget:* ${budgetText}
${request.neededBy ? `📅 *Needed By:* ${request.neededBy}\n` : ''}${request.occasion ? `🎉 *Occasion:* ${request.occasion}\n` : ''}
📝 *Idea Description:*
"${request.description}"

${request.referenceImages?.length ? `📸 I have attached reference design ideas.` : ''}

Looking forward to your custom quote! 🌸`;
}
