import React from 'react';
import { siteConfig } from '../../config/site.config';

/** "Founder Vidhi Singh" credit with the Privacy and Terms links, shown in every footer. */
export const FounderCredit: React.FC<{ className?: string }> = ({ className = '' }) => (
  <p className={`text-xs text-[#7A5B62] ${className}`}>
    Founder <span className="font-serif font-bold text-[#C0536A]">{siteConfig.founderName}</span>
    <span className="mx-1.5">·</span>
    <a href="/privacy" className="hover:text-[#C0536A] hover:underline">Privacy</a>
    <span className="mx-1.5">·</span>
    <a href="/terms" className="hover:text-[#C0536A] hover:underline">Terms</a>
  </p>
);
