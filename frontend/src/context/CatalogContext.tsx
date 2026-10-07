import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Product } from '../types';
import { productService } from '../services/productService';
import { friendlyError, isSupabaseConfigured } from '../lib/supabase';

interface CatalogContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

/** Loads the product catalogue once and shares it with every page. */
export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    setLoading(true);
    productService
      .getAll()
      .then((p) => {
        if (!active) return;
        setProducts(p);
        setError(null);
      })
      .catch((err) => active && setError(friendlyError(err, 'Could not load the collection.')))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [version]);

  const reload = useCallback(() => {
    productService.invalidate();
    setVersion((v) => v + 1);
  }, []);

  return (
    <CatalogContext.Provider value={{ products, loading, error, reload }}>
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
};
