import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useCatalog } from '../../context/CatalogContext';

/** Thin banner shown while the collection loads, or with a retry button if it failed. */
export const CatalogStatus: React.FC = () => {
  const { loading, error, reload, products } = useCatalog();

  if (error) {
    return (
      <div className="max-w-3xl mt-4 mx-4 sm:mx-auto px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-700 flex items-center justify-between gap-3" role="alert">
        <span>{error}</span>
        <button onClick={reload} className="shrink-0 inline-flex items-center gap-1.5 font-semibold hover:underline">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }
  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 text-xs text-[#7A5B62]" role="status">
        <span className="w-4 h-4 border-2 border-[#F4A6B7] border-t-[#C0536A] rounded-full animate-spin" />
        Loading the collection…
      </div>
    );
  }
  return null;
};
