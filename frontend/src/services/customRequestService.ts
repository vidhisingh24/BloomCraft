import type { CustomRequest } from '../types';
import { getSupabase } from '../lib/supabase';

export interface CustomRequestInput {
  customer: { name: string; phone: string; email?: string };
  itemType?: string;
  description: string;
  colors: string[];
  quantity?: number;
  occasion?: string;
}

interface CustomRequestRow {
  id: string;
  created_at: string;
  customer: CustomRequest['customer'];
  item_type: string | null;
  reference_images: string[];
  description: string;
  colors: string[];
  quantity: number;
  budget: CustomRequest['budget'];
  needed_by: string | null;
  occasion: string | null;
  status: CustomRequest['status'];
  quoted_price: number | null;
  notes: string | null;
}

function fromRow(r: CustomRequestRow): CustomRequest {
  return {
    id: r.id,
    createdAt: r.created_at,
    customer: r.customer,
    itemType: r.item_type ?? undefined,
    referenceImages: r.reference_images,
    description: r.description,
    colors: r.colors,
    quantity: r.quantity,
    budget: r.budget,
    neededBy: r.needed_by ?? undefined,
    occasion: r.occasion ?? undefined,
    status: r.status,
    quotedPrice: r.quoted_price ?? undefined,
    notes: r.notes ?? undefined,
  };
}

async function update(id: string, patch: Partial<CustomRequestRow>): Promise<CustomRequest> {
  const { data, error } = await getSupabase()
    .from('custom_requests')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return fromRow(data as CustomRequestRow);
}

export const customRequestService = {
  /** Saves a custom-order enquiry so it shows up in the Maker Studio. Returns its reference. */
  async create(input: CustomRequestInput): Promise<{ id: string }> {
    const { data, error } = await getSupabase().rpc('submit_custom_request', { payload: input });
    if (error) throw error;
    return { id: (data as { id: string }).id };
  },

  /** Maker: every request, newest first. */
  async getAll(): Promise<CustomRequest[]> {
    const { data, error } = await getSupabase()
      .from('custom_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as CustomRequestRow[]).map(fromRow);
  },

  async updateStatus(id: string, status: CustomRequest['status']): Promise<CustomRequest> {
    return update(id, { status });
  },

  /** Maker: send a quote (₹) with optional notes. */
  async updateQuote(id: string, quotedPrice: number, notes?: string): Promise<CustomRequest> {
    return update(id, {
      quoted_price: quotedPrice,
      status: 'quoted',
      ...(notes !== undefined ? { notes } : {}),
    });
  },

  /** Maker: live feed of new requests. Returns an unsubscribe function. */
  subscribe(onInsert: (request: CustomRequest) => void): () => void {
    const supabase = getSupabase();
    const channel = supabase
      .channel('custom-requests-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'custom_requests' }, (payload) =>
        onInsert(fromRow(payload.new as CustomRequestRow))
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  },
};
