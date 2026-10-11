import React from 'react';
import { AlertCircleIcon } from '../ui/Icons';

interface MaintenanceBannerProps {
  message?: string;
}

export const MaintenanceBanner: React.FC<MaintenanceBannerProps> = ({
  message = 'Website dalam mode Read-Only. Anda dapat menjelajahi menu, namun fitur pemesanan checkout dan spin koin dinonaktifkan sementara.',
}) => {
  return (
    <aside aria-label="Pengumuman Pemeliharaan" className="bg-brand-yellow border-b-3 border-black text-black px-4 py-2 text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 shadow-[0_2px_0_0_#000] sticky top-0 z-50">
      <AlertCircleIcon className="w-4 h-4 text-brand-red flex-shrink-0 animate-bounce" />
      <span className="line-clamp-1">{message}</span>
      <span className="hidden sm:inline px-2 py-0.5 bg-black text-white text-[10px] rounded border border-black">
        READ-ONLY
      </span>
    </aside>
  );
};
