export interface SiteConfig {
  name: string;
  tagline: string;
  heroHeading: string;
  heroSubheading: string;
  currency: string;
  whatsappNumber: string; // Easily customizable in one place
  whatsappFormatted: string;
  instagramHandle: string;
  instagramUrl: string;
  email: string;
  address: string;
  shippingNote: string;
}

export const siteConfig: SiteConfig = {
  name: "BLOOMCRAFT",
  tagline: "Handcrafted with love, made to bloom.",
  heroHeading: "Little Things, Handcrafted With Love.",
  heroSubheading: "Beautiful crochet creations made specially for your special moments.",
  currency: "₹",
  whatsappNumber: "919876543210", // Primary business WhatsApp number
  whatsappFormatted: "+91 98765 43210",
  instagramHandle: "@bloomcraft.crochet",
  instagramUrl: "https://instagram.com",
  email: "hello@bloomcraft.in",
  address: "Handmade Studio, Jaipur & Mumbai, India",
  shippingNote: "🌸 Free handcrafted keepsake gift card on orders above ₹799",
};

/**
 * Builds a direct WhatsApp chat link with an optional pre-filled message
 */
export function getWhatsAppUrl(message?: string): string {
  const defaultMsg = "Hi BloomCraft! 🌸 I love your handmade crochet collection and would like to know more.";
  const text = encodeURIComponent(message || defaultMsg);
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${text}`;
}

/**
 * Builds WhatsApp message for custom quote request
 */
export function getCustomQuoteWhatsAppUrl(data: {
  name: string;
  phoneOrEmail: string;
  color: string;
  quantity: number;
  itemType?: string;
  description: string;
  occasion?: string;
}): string {
  const text = `🌸 *New Custom Crochet Request* 🌸\n\n` +
    `*Customer:* ${data.name}\n` +
    `*Contact:* ${data.phoneOrEmail}\n` +
    `*Category:* ${data.itemType || "Custom Crochet"}\n` +
    `*Color Theme:* ${data.color}\n` +
    `*Quantity:* ${data.quantity}\n` +
    (data.occasion ? `*Occasion:* ${data.occasion}\n` : "") +
    `\n*Custom Idea Details:*\n"${data.description}"\n\n` +
    `🌸 *Sent from BloomCraft Website*`;

  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

/**
 * Builds WhatsApp message for cart checkout
 */
export function getCartOrderWhatsAppUrl(
  items: Array<{ name: string; price: number; quantity: number; selectedColor?: string }>,
  total: number,
  notes?: string
): string {
  const itemsList = items
    .map((item, idx) => `${idx + 1}. *${item.name}* (Qty: ${item.quantity}) — ₹${item.price * item.quantity}`)
    .join("\n");

  const notesSection = notes ? `\n*Order Note / Gift Message:*\n"${notes}"\n` : "";

  const text = `🌸 *New Order Request - BloomCraft* 🌸\n\n` +
    `Hi BloomCraft! I'd like to place an order for the following handcrafted items:\n\n` +
    `${itemsList}\n\n` +
    `*Subtotal:* ₹${total}\n` +
    `*Packaging:* Eco-Friendly Kraft Gift Box Included 🎀\n` +
    notesSection +
    `\nPlease confirm stock availability and estimated dispatch time! 💕`;

  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(text)}`;
}
