import type { Order, OrderStatus, Payment, PaymentMethod, DeliveryMethod } from '../types';
import { getSupabase } from '../lib/supabase';

/** What the browser sends to place an order. Prices are recomputed by the database. */
export interface PlaceOrderInput {
  customer: { name: string; phone: string; email?: string };
  items: { productId: string; quantity: number; selectedColor?: string; customNote?: string }[];
  delivery: { method: DeliveryMethod; details: object };
  payment: { method: PaymentMethod; upiTxnRef?: string };
  giftWrapRequested: boolean;
  giftMessage?: string;
  couponCode?: string;
  /** Total the customer saw (paise); the order is refused if the server total differs. */
  expectedTotal: number;
  /** Random UUID per checkout: retrying with the same value returns the already-saved order. */
  clientRef: string;
}

interface OrderRow {
  id: string;
  created_at: string;
  customer: Order['customer'];
  items: Order['items'];
  pricing: Order['pricing'];
  delivery: Order['delivery'];
  payment: Order['payment'];
  gift_wrap_requested: boolean;
  gift_message: string | null;
  coupon_code: string | null;
  status: OrderStatus;
  status_history: Order['statusHistory'];
}

function fromRow(r: OrderRow): Order {
  return {
    id: r.id,
    createdAt: r.created_at,
    customer: r.customer,
    items: r.items,
    pricing: r.pricing,
    delivery: r.delivery,
    payment: r.payment,
    giftWrapRequested: r.gift_wrap_requested,
    giftMessage: r.gift_message ?? undefined,
    couponCode: r.coupon_code ?? undefined,
    status: r.status,
    statusHistory: r.status_history,
  };
}

/** RPCs return the order already in the app's shape (see public.order_to_json). */
function fromRpc(data: unknown): Order {
  const o = data as Order & { giftMessage: string | null; couponCode: string | null };
  return { ...o, giftMessage: o.giftMessage ?? undefined, couponCode: o.couponCode ?? undefined };
}

export const orderService = {
  async create(input: PlaceOrderInput): Promise<Order> {
    const { data, error } = await getSupabase().rpc('place_order', { payload: input });
    if (error) throw error;
    return fromRpc(data);
  },

  /** Orders of the signed-in customer (or every order for the maker). */
  async getAll(): Promise<Order[]> {
    const { data, error } = await getSupabase()
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as OrderRow[]).map(fromRow);
  },

  /** Order lookup for anyone who knows both the order number and the checkout phone number. */
  async track(orderId: string, phone: string): Promise<Order | null> {
    const { data, error } = await getSupabase().rpc('track_order', {
      p_order_id: orderId.trim().toUpperCase(),
      p_phone: phone,
    });
    if (error) throw error;
    return data ? fromRpc(data) : null;
  },

  /** Maker: move an order along (appends to its status history). */
  async updateStatus(id: string, status: OrderStatus, note?: string): Promise<Order> {
    const { data, error } = await getSupabase().rpc('admin_update_order_status', {
      p_order_id: id,
      p_status: status,
      p_note: note ?? null,
    });
    if (error) throw error;
    return fromRpc(data);
  },

  /** Maker: confirm (or undo) a UPI payment after checking the UTR in the bank app. */
  async updatePaymentStatus(id: string, status: Payment['status']): Promise<Order> {
    const { data, error } = await getSupabase().rpc('admin_set_payment_status', {
      p_order_id: id,
      p_status: status,
    });
    if (error) throw error;
    return fromRpc(data);
  },

  /** Maker: live feed of new and changed orders. Returns an unsubscribe function. */
  subscribe(onChange: (order: Order, event: 'INSERT' | 'UPDATE') => void): () => void {
    const supabase = getSupabase();
    const channel = supabase
      .channel('orders-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          onChange(fromRow(payload.new as OrderRow), payload.eventType);
        }
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  },
};
