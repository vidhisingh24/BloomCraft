import type { Product, Category, Coupon } from '../types';
import { getSupabase } from '../lib/supabase';

export interface ProductFilters {
  category?: Category | 'all';
  keychainType?: 'tulip' | 'daisy' | 'rose' | 'others' | 'all';
  search?: string;
  inStockOnly?: boolean;
  isCustomizable?: boolean;
  minPricePaise?: number;
  maxPricePaise?: number;
  color?: string;
  sortBy?: 'popular' | 'newest' | 'price_asc' | 'price_desc';
}

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  images: string[];
  description: string;
  short_description: string;
  price: number;
  compare_at_price: number | null;
  category: Category;
  keychain_type: Product['keychainType'] | null;
  tags: string[];
  colors: Product['colors'];
  availability: Product['availability'];
  stock: number | null;
  max_qty_per_order: number;
  making_time_days: number;
  is_customizable: boolean;
  yarn_type: string | null;
  dimensions: string | null;
  stems_count: string | null;
  created_at: string;
}


function toProduct(r: ProductRow): Product {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    images: r.images,
    description: r.description,
    shortDescription: r.short_description,
    price: r.price,
    compareAtPrice: r.compare_at_price ?? undefined,
    category: r.category,
    keychainType: r.keychain_type ?? undefined,
    tags: r.tags,
    colors: r.colors,
    availability: r.availability,
    stock: r.stock ?? undefined,
    maxQtyPerOrder: r.max_qty_per_order,
    makingTimeDays: r.making_time_days,
    isCustomizable: r.is_customizable,
    yarnType: r.yarn_type ?? undefined,
    dimensions: r.dimensions ?? undefined,
    stemsCount: r.stems_count ?? undefined,
    createdAt: r.created_at,
  };
}

// The catalogue is small, so it is fetched once per visit and filtered in the browser.
let catalogPromise: Promise<Product[]> | null = null;

async function fetchCatalog(): Promise<Product[]> {
  const { data, error } = await getSupabase()
    .from('products')
    .select('*')
    .order('sort_order')
    .order('created_at');
  if (error) throw error;
  return (data as ProductRow[]).map(toProduct);
}

function applyFilters(all: Product[], filters?: ProductFilters): Product[] {
  let products = [...all];
  if (!filters) return products;

  if (filters.category && filters.category !== 'all') {
    products = products.filter((p) => p.category === filters.category);
  }
  if (filters.keychainType && filters.keychainType !== 'all') {
    products = products.filter((p) => p.keychainType === filters.keychainType);
  }
  if (filters.search?.trim()) {
    const q = filters.search.toLowerCase().trim();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        p.yarnType?.toLowerCase().includes(q)
    );
  }
  if (filters.inStockOnly) {
    products = products.filter((p) => p.availability !== 'out_of_stock');
  }
  if (filters.isCustomizable) {
    products = products.filter((p) => p.isCustomizable);
  }
  if (filters.minPricePaise !== undefined) {
    products = products.filter((p) => p.price >= (filters.minPricePaise ?? 0));
  }
  if (filters.maxPricePaise !== undefined) {
    products = products.filter((p) => p.price <= (filters.maxPricePaise ?? Infinity));
  }
  if (filters.color && filters.color !== 'all') {
    const color = filters.color.toLowerCase();
    products = products.filter((p) => p.colors.some((c) => c.name.toLowerCase() === color));
  }

  switch (filters.sortBy) {
    case 'price_asc':
      products.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      products.sort((a, b) => b.price - a.price);
      break;
    case 'newest':
      products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'popular':
      products.sort(
        (a, b) => Number(b.tags.includes('Bestseller')) - Number(a.tags.includes('Bestseller'))
      );
      break;
  }
  return products;
}

export const productService = {
  /** All active products (the maker also sees hidden ones), optionally filtered and sorted. */
  async getAll(filters?: ProductFilters): Promise<Product[]> {
    catalogPromise ??= fetchCatalog().catch((err) => {
      catalogPromise = null;
      throw err;
    });
    return applyFilters(await catalogPromise, filters);
  },

  async getById(id: string): Promise<Product | null> {
    const all = await this.getAll();
    return all.find((p) => p.id === id) ?? null;
  },

  /** Forget the cached catalogue (after the maker edits it, or after signing in/out). */
  invalidate(): void {
    catalogPromise = null;
  },

  /** Maker: change availability. */
  async updateAvailability(id: string, availability: Product['availability']): Promise<Product> {
    return updateProduct(id, { availability });
  },

  /** Maker: change price (paise). */
  async updatePrice(id: string, pricePaise: number): Promise<Product> {
    if (!Number.isInteger(pricePaise) || pricePaise < 0) throw new Error('Enter a valid price');
    return updateProduct(id, { price: pricePaise });
  },

  /** Looks up one coupon code; null when it does not exist, is switched off or has expired. */
  async checkCoupon(code: string): Promise<Coupon | null> {
    const { data, error } = await getSupabase().rpc('check_coupon', { p_code: code });
    if (error) throw error;
    return (data as Coupon | null) ?? null;
  },
};

async function updateProduct(id: string, patch: Partial<ProductRow>): Promise<Product> {
  const { data, error } = await getSupabase()
    .from('products')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  productService.invalidate();
  return toProduct(data as ProductRow);
}
