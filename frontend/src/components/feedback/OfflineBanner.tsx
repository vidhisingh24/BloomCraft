import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

/** Fixed notice while the device has no internet connection. */
export const OfflineBanner: React.FC = () => {
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline) return null;
  return (
    <div
      className="fixed top-0 inset-x-0 z-[120] bg-[#3D272A] text-white text-xs sm:text-sm py-2 px-4 flex items-center justify-center gap-2"
      role="status"
    >
      <WifiOff className="w-4 h-4" />
      You are offline — orders and sign-in will work again once you reconnect.
    </div>
  );
};
