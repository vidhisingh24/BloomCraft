import React from 'react';
import { siteConfig } from '../../config/site.config';

/** "Founder Vidhi Singh" credit shown in every footer. */
export const FounderCredit: React.FC<{ className?: string }> = ({ className = '' }) => (
  <p className={`text-xs text-[#7A5B62] ${className}`}>
    Founder <span className="font-serif font-bold text-[#C0536A]">{siteConfig.founderName}</span>
  </p>
);
