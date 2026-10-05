import { describe, it, expect } from 'vitest';
import {
  buildWhatsAppLink,
  buildOrderMessage,
  buildProductEnquiry,
  buildCustomRequestMessage,
} from './whatsapp';
import type { Order, Product, CustomRequest } from '../types';

describe('WhatsApp message builders', () => {
  it('buildWhatsAppLink generates valid URL with encoded message', () => {
    const link = buildWhatsAppLink('Hello BloomCraft! 🌸', '919876543210');
    expect(link).toContain('https://wa.me/919876543210?text=');
    expect(link).toContain(encodeURIComponent('Hello BloomCraft! 🌸'));
  });

  it('buildOrderMessage generates clean structured text with order details', () => {
    const mockOrder: Order = {
      id: 'BC-2026-00125',
      createdAt: new Date().toISOString(),
      customer: {
        name: 'Aarav Patel',
        phone: '9876543210',
      },
      items: [
        {
          id: 'kc-tulip-pink-duo-item',
          productId: 'kc-tulip-pink-duo',
          product: {} as any,
          name: 'Baby Pink Double Tulip Bell Charm',
          image: '/images/keychains/tulip_pink_duo.jpg',
          quantity: 2,
          selectedColor: 'Baby Pink',
          priceAtAdd: 12000,
        },
      ],
      pricing: {
        subtotal: 24000,
        delivery: 0,
        giftWrap: 4000,
        discount: 0,
        total: 28000,
      },
      delivery: {
        method: 'vadodara_local',
        details: {
          area: 'Alkapuri',
          preferredDate: '2026-10-01',
          preferredTimeSlot: 'Evening (5:00 PM – 8:30 PM)',
        },
        charge: 0,
      },
      payment: {
        method: 'upi',
        status: 'pending',
      },
      status: 'placed',
      statusHistory: [],
    };

    const msg = buildOrderMessage(mockOrder);
    expect(msg).toContain('BC-2026-00125');
    expect(msg).toContain('Aarav Patel');
    expect(msg).toContain('Baby Pink Double Tulip Bell Charm');
    expect(msg).toContain('₹280');
    expect(msg).toContain('Alkapuri');
  });

  it('buildProductEnquiry generates correct pre-filled text', () => {
    const mockProduct: Product = {
      id: 'kc-tulip-coral-duo',
      slug: 'coral-red-twin-tulip',
      name: 'Coral Red Twin Tulip Bell Charm',
      images: ['/images/keychains/tulip_coral_duo.jpg'],
      description: 'Bright cheerful coral red twin tulip bells.',
      shortDescription: 'Twin tulip charm',
      price: 12000,
      category: 'keychain',
      tags: [],
      colors: [],
      availability: 'in_stock',
      maxQtyPerOrder: 5,
      makingTimeDays: 2,
      isCustomizable: true,
      createdAt: new Date().toISOString(),
    };

    const msg = buildProductEnquiry(mockProduct, 'Coral Red Duo', 3);
    expect(msg).toContain('Coral Red Twin Tulip Bell Charm');
    expect(msg).toContain('Coral Red Duo');
    expect(msg).toContain('Qty: 3');
    expect(msg).toContain('₹120');
  });

  it('buildCustomRequestMessage formats custom request details', () => {
    const mockCustomReq: CustomRequest = {
      id: 'CUSTOM-BC-001',
      createdAt: new Date().toISOString(),
      customer: {
        name: 'Riya Mehta',
        phone: '9876543210',
      },
      itemType: 'Crochet Bouquet',
      description: 'Lilac and peach roses bouquet with mini pearl beads on petals',
      colors: ['Lavender Lilac', 'Peach'],
      quantity: 1,
      budget: { min: 800, max: 1200 },
      neededBy: '2026-10-15',
      status: 'received',
      referenceImages: [],
    };

    const msg = buildCustomRequestMessage(mockCustomReq);
    expect(msg).toContain('CUSTOM-BC-001');
    expect(msg).toContain('Riya Mehta');
    expect(msg).toContain('Lilac and peach roses');
    expect(msg).toContain('₹800 – ₹1200');
  });
});
