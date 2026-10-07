import React from 'react';

/** Placeholder product cards shown inside a grid while the catalogue loads. */
export const ProductSkeletons: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <>
    {Array.from({ length: count }, (_, n) => (
      <div key={n} className="bg-white rounded-3xl p-4 border border-[#F0E6E8] animate-pulse space-y-3" aria-hidden="true">
        <div className="aspect-square bg-[#FFE3E8]/40 rounded-2xl" />
        <div className="h-4 bg-[#FFE3E8]/50 rounded w-3/4" />
        <div className="h-3 bg-[#FFE3E8]/30 rounded w-1/2" />
      </div>
    ))}
  </>
);
