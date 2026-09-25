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
  apiBaseUrl: string;
  useMockApi: boolean;
}

export const siteConfig: SiteConfig = {
  name: env.VITE_BUSINESS_NAME || "BLOOMCRAFT",
  tagline: env.VITE_TAGLINE || "Handcrafted with love, made to bloom.",
  heroHeading: env.VITE_HERO_HEADING || "Little Things, Handcrafted With Love.",
  heroSubheading: env.VITE_HERO_SUBHEADING || "Beautiful crochet creations made specially for your special moments.",
  currency: "₹",
  whatsappNumber: env.VITE_WHATSAPP_NUMBER || "919876543210",
  whatsappFormatted: env.VITE_WHATSAPP_FORMATTED || "+91 98765 43210",
  instagramHandle: env.VITE_INSTAGRAM_HANDLE || "@bloomcraft.crochet",
  instagramUrl: env.VITE_INSTAGRAM_URL || "https://instagram.com/bloomcraft.crochet",
  email: env.VITE_SUPPORT_EMAIL || "hello@bloomcraft.in",
  address: "Handmade Studio, Vadodara, Gujarat, India",
  city: "Vadodara",
  state: "Gujarat",
  country: "India",
  pincode: "390001",
  shippingNote: "🌸 Free handcrafted gift note with every order • Free parcel shipping above ₹999",
  upiId: env.VITE_UPI_ID || "bloomcraft@oksbi",
  upiPayeeName: env.VITE_UPI_PAYEE_NAME || "BloomCraft Vadodara",
  apiBaseUrl: env.VITE_API_BASE_URL || "https://api.bloomcraft.in/v1",
  useMockApi: env.VITE_USE_MOCK_API !== "false", // Defaults to true for mock demo
};
