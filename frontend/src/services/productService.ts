import type { Product, Category } from '../types';
import { MOCK_PRODUCTS } from '../data/mock/products';
import { storage, STORAGE_KEYS } from './storage';
import { siteConfig } from '../config/site.config';

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

function delay(ms: number = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStoredProducts(): Product[] {
  const overrides = storage.get<Record<string, Partial<Product>>>(
    STORAGE_KEYS.CATALOG_OVERRIDES,
    {}
  );
  return MOCK_PRODUCTS.map((p) => {
    if (overrides[p.id]) {
      return { ...p, ...overrides[p.id] };
    }
    return p;
  });
}

export const productService = {
  /**
   * Fetches all products with optional filters, search, and sorting
   */
  async getAll(filters?: ProductFilters): Promise<Product[]> {
    await delay(250);

    if (!siteConfig.useMockApi) {
      /*
       * Real Backend Integration Stub:
       * const params = new URLSearchParams(filters as any);
       * const res = await fetch(`${siteConfig.apiBaseUrl}/products?${params}`);
       * return await res.json();
       */
    }

    let products = getStoredProducts();

    if (!filters) return products;

    // Filter by Category
    if (filters.category && filters.category !== 'all') {
      products = products.filter((p) => p.category === filters.category);
    }

    // Filter by Keychain Flower Subtype
    if (filters.keychainType && filters.keychainType !== 'all') {
      products = products.filter((p) => p.keychainType === filters.keychainType);
    }

    // Filter by Search Query
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          (p.yarnType && p.yarnType.toLowerCase().includes(q))
      );
    }

    // Filter by In-Stock
    if (filters.inStockOnly) {
      products = products.filter((p) => p.availability !== 'out_of_stock');
    }

    // Filter by Customizable
    if (filters.isCustomizable) {
      products = products.filter((p) => p.isCustomizable);
    }

    // Filter by Price Range (in paise)
    if (filters.minPricePaise !== undefined) {
      products = products.filter((p) => p.price >= (filters.minPricePaise || 0));
    }
    if (filters.maxPricePaise !== undefined) {
      products = products.filter((p) => p.price <= (filters.maxPricePaise || Infinity));
    }

    // Filter by Color
    if (filters.color && filters.color !== 'all') {
      products = products.filter((p) =>
        p.colors.some((c) => c.name.toLowerCase() === filters.color!.toLowerCase())
      );
    }

    // Sorting
    if (filters.sortBy) {
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
        default:
          // Bestsellers first
          products.sort((a, b) => {
            const aBest = a.tags.includes('Bestseller') ? 1 : 0;
            const bBest = b.tags.includes('Bestseller') ? 1 : 0;
            return bBest - aBest;
          });
          break;
      }
    }

    return products;
  },

  /**
   * Fetches single product by slug
   */
  async getBySlug(slug: string): Promise<Product | null> {
    await delay(200);

    if (!siteConfig.useMockApi) {
      /*
       * const res = await fetch(`${siteConfig.apiBaseUrl}/products/slug/${slug}`);
       * if (!res.ok) return null;
       * return await res.json();
       */
    }

    const all = getStoredProducts();
    return all.find((p) => p.slug === slug || p.id === slug) || null;
  },

  /**
   * Fetches single product by ID
   */
  async getById(id: string): Promise<Product | null> {
    await delay(150);
    const all = getStoredProducts();
    return all.find((p) => p.id === id) || null;
  },

  /**
   * Maker Dashboard: Updates product availability in mock storage
   */
  async updateAvailability(
    id: string,
    availability: 'in_stock' | 'made_to_order' | 'out_of_stock'
  ): Promise<Product> {
    await delay(300);

    if (!siteConfig.useMockApi) {
      /*
       * const res = await fetch(`${siteConfig.apiBaseUrl}/products/${id}/availability`, {
       *   method: 'PATCH',
       *   headers: { 'Content-Type': 'application/json' },
       *   body: JSON.stringify({ availability }),
       * });
       * return await res.json();
       */
    }

    const overrides = storage.get<Record<string, Partial<Product>>>(
      STORAGE_KEYS.CATALOG_OVERRIDES,
      {}
    );
    overrides[id] = { ...(overrides[id] || {}), availability };
    storage.set(STORAGE_KEYS.CATALOG_OVERRIDES, overrides);

    const updated = await this.getById(id);
    if (!updated) throw new Error(`Product ${id} not found`);
    return updated;
  },

  /**
   * Maker Dashboard: Updates product price in mock storage
   */
  async updatePrice(id: string, pricePaise: number): Promise<Product> {
    await delay(300);

    if (!siteConfig.useMockApi) {
      /*
       * const res = await fetch(`${siteConfig.apiBaseUrl}/products/${id}/price`, {
       *   method: 'PATCH',
       *   headers: { 'Content-Type': 'application/json' },
       *   body: JSON.stringify({ price: pricePaise }),
       * });
       * return await res.json();
       */
    }

    const overrides = storage.get<Record<string, Partial<Product>>>(
      STORAGE_KEYS.CATALOG_OVERRIDES,
      {}
    );
    overrides[id] = { ...(overrides[id] || {}), price: pricePaise };
    storage.set(STORAGE_KEYS.CATALOG_OVERRIDES, overrides);

    const updated = await this.getById(id);
    if (!updated) throw new Error(`Product ${id} not found`);
    return updated;
  },
};
