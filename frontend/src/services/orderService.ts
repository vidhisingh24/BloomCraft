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

export type OrderSource = NonNullable<Order['source']>;

/** An order the maker records by hand (prices in paise). */
export interface ManualOrderInput {
  source: Exclude<OrderSource, 'website'>;
  orderedAt: string; // YYYY-MM-DD
  customer: { name: string; phone?: string };
  items: { name: string; quantity: number; price: number; productId?: string; image?: string; customNote?: string }[];
  deliveryMethod: DeliveryMethod;
  deliveryCharge: number;
  discount: number;
  payment: { method: PaymentMethod; provider?: string; status: 'paid' | 'pending' };
  status: OrderStatus;
  note?: string;
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
  source?: Order['source'];
  maker_note?: string | null;
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
    source: r.source ?? 'website',
    makerNote: r.maker_note ?? undefined,
  };
}

/** RPCs return the order already in the app's shape (see public.order_to_json). */
function fromRpc(data: unknown): Order {
  const o = data as Order & { giftMessage: string | null; couponCode: string | null; makerNote?: string | null };
  return {
    ...o,
    giftMessage: o.giftMessage ?? undefined,
    couponCode: o.couponCode ?? undefined,
    makerNote: o.makerNote ?? undefined,
    source: o.source ?? 'website',
  };
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

  /** Maker: record a sale that happened outside the website (Instagram, WhatsApp, in person…). */
  async createManual(input: ManualOrderInput): Promise<Order> {
    const { data, error } = await getSupabase().rpc('admin_add_manual_order', { payload: input });
    if (error) throw error;
    return fromRpc(data);
  },

  /** Maker: permanently delete an order (test orders, duplicates, mistakes). */
  async delete(id: string): Promise<void> {
    const { error } = await getSupabase().rpc('admin_delete_order', { p_order_id: id });
    if (error) throw error;
  },

  /** Maker: live feed of new and changed orders. Returns an unsubscribe function. */
  subscribe(
    onChange: (order: Order, event: 'INSERT' | 'UPDATE') => void,
    onDelete?: (orderId: string) => void
  ): () => void {
    const supabase = getSupabase();
    const channel = supabase
      .channel('orders-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          onChange(fromRow(payload.new as OrderRow), payload.eventType);
        } else if (payload.eventType === 'DELETE' && onDelete) {
          onDelete((payload.old as { id: string }).id);
        }
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  },
};
