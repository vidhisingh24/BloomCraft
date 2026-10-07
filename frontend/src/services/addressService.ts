import { getSupabase } from '../lib/supabase';

/** A delivery address saved in the customer's account. */
export interface SavedAddress {
  id: string;
  label: string; // Home, Hostel, Work…
  fullName: string;
  phone: string; // 10 digits
  house: string;
  street?: string;
  area?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export type AddressInput = Omit<SavedAddress, 'id'>;

interface AddressRow {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  house: string;
  street: string | null;
  area: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

const fromRow = (r: AddressRow): SavedAddress => ({
  id: r.id,
  label: r.label,
  fullName: r.full_name,
  phone: r.phone,
  house: r.house,
  street: r.street ?? undefined,
  area: r.area ?? undefined,
  landmark: r.landmark ?? undefined,
  city: r.city,
  state: r.state,
  pincode: r.pincode,
  isDefault: r.is_default,
});

const toRow = (a: AddressInput) => ({
  label: a.label.trim() || 'Home',
  full_name: a.fullName.trim(),
  phone: a.phone,
  house: a.house.trim(),
  street: a.street?.trim() || null,
  area: a.area?.trim() || null,
  landmark: a.landmark?.trim() || null,
  city: a.city.trim(),
  state: a.state.trim(),
  pincode: a.pincode,
  is_default: a.isDefault,
});

/** One-line address for lists and summaries. */
export function formatAddress(a: Pick<SavedAddress, 'house' | 'street' | 'area' | 'landmark' | 'city' | 'state' | 'pincode'>): string {
  return [a.house, a.street, a.area, a.landmark && `near ${a.landmark}`, a.city, `${a.state} - ${a.pincode}`]
    .filter(Boolean)
    .join(', ');
}

/** Checks an address before saving; returns a message for the first problem, or null. */
export function addressProblem(a: AddressInput): string | null {
  if (a.fullName.trim().length < 2) return 'Please enter the receiver’s name.';
  if (!/^[6-9]\d{9}$/.test(a.phone)) return 'Please enter a valid 10-digit mobile number.';
  if (!a.house.trim()) return 'Please enter the house / flat / room number.';
  if (!/^[1-9]\d{5}$/.test(a.pincode)) return 'Please enter a valid 6-digit PIN code.';
  if (a.city.trim().length < 2) return 'Please enter the city.';
  if (a.state.trim().length < 2) return 'Please choose the state.';
  return null;
}

export const addressService = {
  /** The signed-in customer's addresses, default first. */
  async list(): Promise<SavedAddress[]> {
    const { data, error } = await getSupabase()
      .from('addresses')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at');
    if (error) throw error;
    return (data as AddressRow[]).map(fromRow);
  },

  async create(input: AddressInput): Promise<SavedAddress> {
    const { data, error } = await getSupabase().from('addresses').insert(toRow(input)).select('*').single();
    if (error) throw error;
    return fromRow(data as AddressRow);
  },

  async update(id: string, input: AddressInput): Promise<SavedAddress> {
    const { data, error } = await getSupabase().from('addresses').update(toRow(input)).eq('id', id).select('*').single();
    if (error) throw error;
    return fromRow(data as AddressRow);
  },

  async setDefault(id: string): Promise<void> {
    const { error } = await getSupabase().from('addresses').update({ is_default: true }).eq('id', id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await getSupabase().from('addresses').delete().eq('id', id);
    if (error) throw error;
  },
};
