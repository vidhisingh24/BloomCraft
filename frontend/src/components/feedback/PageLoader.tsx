import React from 'react';

/** Centered spinner used while a page or the saved session is loading. */
export const PageLoader: React.FC<{ label?: string; fullScreen?: boolean }> = ({
  label = 'Loading…',
  fullScreen = false,
}) => (
  <div
    className={`${fullScreen ? 'min-h-screen bg-[#FAF8F5]' : 'min-h-[50vh]'} flex flex-col items-center justify-center gap-3`}
    role="status"
    aria-live="polite"
  >
    <span className="w-9 h-9 border-[3px] border-[#F4A6B7]/50 border-t-[#C0536A] rounded-full animate-spin" />
    <span className="text-xs text-[#7A5B62]">{label}</span>
  </div>
);
