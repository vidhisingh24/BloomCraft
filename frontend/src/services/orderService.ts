import type { Order, OrderStatus, Payment } from '../types';
import { INITIAL_MOCK_ORDERS } from '../data/mock/orders';
import { storage, STORAGE_KEYS } from './storage';
import { generateOrderId } from '../utils/ids';
import { normalizeIndianPhone } from '../utils/validation';
import { siteConfig } from '../config/site.config';

function delay(ms: number = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStoredOrders(): Order[] {
  const orders = storage.get<Order[]>(STORAGE_KEYS.ORDERS, []);
  if (!orders || orders.length === 0) {
    storage.set(STORAGE_KEYS.ORDERS, INITIAL_MOCK_ORDERS);
    return INITIAL_MOCK_ORDERS;
  }

  // Remove legacy demo orders if present
  const cleanedOrders = orders.filter(
    (o) => o.id !== 'BC-2026-00121' && o.id !== 'BC-2026-00122' && o.id !== 'BC-2026-00123'
  );

  // Check if any order has old literal 'Keychains No.', 'Rakhi Nos.', or outdated seed order details
  const hasLegacyItemNames = cleanedOrders.some((o) =>
    o.items.some((i) => i.name.startsWith('Keychains No.') || i.name.startsWith('Rakhi Nos.'))
  );

  const sonalOrder = cleanedOrders.find((o) => o.id === 'BC-2026-00018');
  const needsSonalOrderSync = !sonalOrder || sonalOrder.items.length < 2 || sonalOrder.pricing.total !== 18500 || sonalOrder.payment.status !== 'paid';

  if (hasLegacyItemNames || needsSonalOrderSync) {
    // Replace seed orders with updated INITIAL_MOCK_ORDERS while preserving any newly created orders
    const seedIds = new Set(INITIAL_MOCK_ORDERS.map((s) => s.id));
    const userCustomOrders = cleanedOrders.filter((o) => !seedIds.has(o.id));
    const merged = [...userCustomOrders, ...INITIAL_MOCK_ORDERS];
    storage.set(STORAGE_KEYS.ORDERS, merged);
    return merged;
  }

  const existingIds = new Set(cleanedOrders.map((o) => o.id));
  const missingSeeds = INITIAL_MOCK_ORDERS.filter((s) => !existingIds.has(s.id));

  if (missingSeeds.length > 0 || cleanedOrders.length !== orders.length) {
    const merged = [...cleanedOrders, ...missingSeeds];
    storage.set(STORAGE_KEYS.ORDERS, merged);
    return merged;
  }

  return cleanedOrders;
}

export const orderService = {
  /**
   * Creates a new order and saves to storage
   */
  async create(
    payload: Omit<Order, 'id' | 'createdAt' | 'status' | 'statusHistory'>
  ): Promise<Order> {
    await delay(400);

    if (!siteConfig.useMockApi) {
      /*
       * const res = await fetch(`${siteConfig.apiBaseUrl}/orders`, {
       *   method: 'POST',
       *   headers: { 'Content-Type': 'application/json' },
       *   body: JSON.stringify(payload),
       * });
       * return await res.json();
       */
    }

    const orderId = generateOrderId();
    const now = new Date().toISOString();

    const newOrder: Order = {
      ...payload,
      id: orderId,
      createdAt: now,
      status: 'placed',
      statusHistory: [
        {
          status: 'placed',
          at: now,
          note: `Order placed via ${payload.delivery.method === 'vadodara_local' ? 'Vadodara Local Handover' : payload.delivery.method === 'college' ? 'College Campus Delivery' : 'Courier Parcel'}`,
        },
      ],
    };

    const orders = getStoredOrders();
    const updated = [newOrder, ...orders];
    storage.set(STORAGE_KEYS.ORDERS, updated);

    return newOrder;
  },

  /**
   * Retrieves order by ID
   */
  async getById(id: string): Promise<Order | null> {
    await delay(200);

    if (!siteConfig.useMockApi) {
      /*
       * const res = await fetch(`${siteConfig.apiBaseUrl}/orders/${id}`);
       * if (!res.ok) return null;
       * return await res.json();
       */
    }

    const cleanId = id.trim().toUpperCase();
    const orders = getStoredOrders();
    return orders.find((o) => o.id.toUpperCase() === cleanId) || null;
  },

  /**
   * Retrieves all orders (used by dashboard and demo tracking)
   */
  async getAll(): Promise<Order[]> {
    await delay(250);

    if (!siteConfig.useMockApi) {
      /*
       * const res = await fetch(`${siteConfig.apiBaseUrl}/orders`);
       * return await res.json();
       */
    }

    const orders = getStoredOrders();
    return [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  /**
   * Finds orders for a customer by normalized phone number
   */
  async getByPhone(phone: string): Promise<Order[]> {
    await delay(250);
    const norm = normalizeIndianPhone(phone) || phone.replace(/\D/g, '');
    const orders = getStoredOrders();
    return orders.filter((o) => {
      const orderPhone = normalizeIndianPhone(o.customer.phone) || o.customer.phone.replace(/\D/g, '');
      return orderPhone === norm;
    });
  },

  /**
   * Updates order status and appends to status history entry
   */
  async updateStatus(
    id: string,
    newStatus: OrderStatus,
    note?: string
  ): Promise<Order> {
    await delay(300);

    if (!siteConfig.useMockApi) {
      /*
       * const res = await fetch(`${siteConfig.apiBaseUrl}/orders/${id}/status`, {
       *   method: 'PATCH',
       *   headers: { 'Content-Type': 'application/json' },
       *   body: JSON.stringify({ status: newStatus, note }),
       * });
       * return await res.json();
       */
    }

    const orders = getStoredOrders();
    const index = orders.findIndex((o) => o.id.toUpperCase() === id.trim().toUpperCase());

    if (index === -1) {
      throw new Error(`Order ${id} not found`);
    }

    const order = orders[index];
    const now = new Date().toISOString();

    const updatedOrder: Order = {
      ...order,
      status: newStatus,
      statusHistory: [
        ...order.statusHistory,
        {
          status: newStatus,
          at: now,
          note: note || `Status updated to ${newStatus}`,
        },
      ],
    };

    orders[index] = updatedOrder;
    storage.set(STORAGE_KEYS.ORDERS, orders);

    return updatedOrder;
  },

  /**
   * Updates payment verification status
   */
  async updatePaymentStatus(
    id: string,
    paymentStatus: Payment['status'],
    upiTxnRef?: string
  ): Promise<Order> {
    await delay(300);

    const orders = getStoredOrders();
    const index = orders.findIndex((o) => o.id.toUpperCase() === id.trim().toUpperCase());

    if (index === -1) {
      throw new Error(`Order ${id} not found`);
    }

    const order = orders[index];
    const updatedOrder: Order = {
      ...order,
      payment: {
        ...order.payment,
        status: paymentStatus,
        upiTxnRef: upiTxnRef || order.payment.upiTxnRef,
      },
    };

    orders[index] = updatedOrder;
    storage.set(STORAGE_KEYS.ORDERS, orders);

    return updatedOrder;
  },
};
