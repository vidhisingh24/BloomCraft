/**
 * Typed, safe localStorage wrapper with versioned keys and cross-tab synchronization.
 */

export const STORAGE_KEYS = {
  CART: 'bloomcraft:v1:cart',
  WISHLIST: 'bloomcraft:v1:wishlist',
  ORDERS: 'bloomcraft:v1:orders',
  CUSTOM_REQUESTS: 'bloomcraft:v1:custom_requests',
  CHECKOUT_DRAFT: 'bloomcraft:v1:checkout_draft',
  CATALOG_OVERRIDES: 'bloomcraft:v1:catalog_overrides',
  INTRO_SHOWN: 'bloomcraft:v1:intro_shown',
} as const;

/**
 * Custom event name dispatched when storage updates in the same window/tab
 */
const LOCAL_STORAGE_EVENT = 'bloomcraft:storage_updated';

export const storage = {
  get<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined' || !window.localStorage) {
      return defaultValue;
    }
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return defaultValue;
      const parsed = JSON.parse(raw);
      return parsed !== null && parsed !== undefined ? (parsed as T) : defaultValue;
    } catch (error) {
      console.warn(`[Storage] Failed to read or parse key "${key}". Resetting to default.`, error);
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const serialized = JSON.stringify(value);
      window.localStorage.setItem(key, serialized);

      // Dispatch event for same-window component updates
      window.dispatchEvent(
        new CustomEvent(LOCAL_STORAGE_EVENT, {
          detail: { key, value },
        })
      );
    } catch (error) {
      console.error(`[Storage] Failed to set key "${key}".`, error);
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.removeItem(key);
      window.dispatchEvent(
        new CustomEvent(LOCAL_STORAGE_EVENT, {
          detail: { key, value: null },
        })
      );
    } catch (error) {
      console.error(`[Storage] Failed to remove key "${key}".`, error);
    }
  },

  /**
   * Subscribes to storage changes both across browser tabs (via 'storage' event)
   * and in the current tab (via custom event).
   */
  subscribe<T>(key: string, callback: (newValue: T) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    // 1. Cross-tab listener
    const handleCrossTab = (e: StorageEvent) => {
      if (e.key === key) {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : null;
          callback(parsed);
        } catch {
          // Ignored
        }
      }
    };

    // 2. Same-tab listener
    const handleSameTab = (e: Event) => {
      const custom = e as CustomEvent<{ key: string; value: any }>;
      if (custom.detail && custom.detail.key === key) {
        callback(custom.detail.value);
      }
    };

    window.addEventListener('storage', handleCrossTab);
    window.addEventListener(LOCAL_STORAGE_EVENT, handleSameTab);

    return () => {
      window.removeEventListener('storage', handleCrossTab);
      window.removeEventListener(LOCAL_STORAGE_EVENT, handleSameTab);
    };
  },
};
