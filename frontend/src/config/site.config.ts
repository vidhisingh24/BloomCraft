// Environment and site configuration for BloomCraft
const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {} as any;

export interface SiteConfig {
  name: string;
  tagline: string;
  heroHeading: string;
  heroSubheading: string;
  currency: string;
  whatsappNumber: string;
  whatsappFormatted: string;
  instagramHandle: string;
  instagramUrl: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  shippingNote: string;
  upiId: string;
  upiPayeeName: string;
  founderName: string;
  /** Show sign-in buttons only for providers switched on in Supabase → Authentication. */
  auth: { google: boolean; phoneOtp: boolean };
}

export const siteConfig: SiteConfig = {
  name: env.VITE_BUSINESS_NAME || "BLOOMCRAFT",
  tagline: env.VITE_TAGLINE || "Handcrafted with love, made to bloom.",
  heroHeading: env.VITE_HERO_HEADING || "Little Things, Handcrafted With Love.",
  heroSubheading: env.VITE_HERO_SUBHEADING || "Beautiful crochet creations made specially for your special moments.",
  currency: "₹",
  whatsappNumber: env.VITE_WHATSAPP_NUMBER || "919316097667",
  whatsappFormatted: env.VITE_WHATSAPP_FORMATTED || "+91 93160 97667",
  instagramHandle: env.VITE_INSTAGRAM_HANDLE || "@bloomcraftt.co",
  instagramUrl: env.VITE_INSTAGRAM_URL || "https://www.instagram.com/bloomcraftt.co/",
  /** Public support e-mail; leave empty to offer WhatsApp / Instagram only. */
  email: env.VITE_SUPPORT_EMAIL || "",
  address: "Handmade Studio, Vadodara, Gujarat, India",
  city: "Vadodara",
  state: "Gujarat",
  country: "India",
  pincode: "390001",
  shippingNote: "🌸 Free handcrafted gift note with every order • Free parcel shipping above ₹999",
  upiId: env.VITE_UPI_ID || "vidhiisingh2403@okicici",
  upiPayeeName: env.VITE_UPI_PAYEE_NAME || "Vidhi Singh",
  founderName: "Vidhi Singh",
  auth: {
    google: env.VITE_ENABLE_GOOGLE_LOGIN === "true",
    // SMS codes need an SMS provider in Supabase → Authentication → Providers → Phone.
    phoneOtp: env.VITE_ENABLE_PHONE_OTP === "true",
  },
};
