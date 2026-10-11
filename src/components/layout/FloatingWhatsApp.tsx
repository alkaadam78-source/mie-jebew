import React from 'react';
import { MessageCircle } from '../ui/Icons';
import { STORE_CONFIG } from '../../config/store';

interface FloatingWhatsAppProps {
  hasCartItems: boolean;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({ hasCartItems }) => {
  const message = encodeURIComponent(
    'Halo Mie Jebew! Saya ingin bertanya seputar menu dan pemesanan...'
  );
  const waUrl = `https://api.whatsapp.com/send?phone=${STORE_CONFIG.whatsappNumber}&text=${message}`;

  return (
    <aside
      aria-label="Floating WhatsApp"
      className={`fixed right-4 z-30 transition-all duration-300 safe-area-bottom ${
        hasCartItems ? 'bottom-20 sm:bottom-24' : 'bottom-4 sm:bottom-6'
      }`}
    >
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat Mie Jebew di WhatsApp"
        className="group relative flex items-center gap-2 bg-whatsapp hover:bg-emerald-600 active:bg-emerald-700 text-white p-3 sm:px-4 sm:py-3 rounded-full border-3 border-black shadow-brutal active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer min-w-[48px] min-h-[48px]"
      >
        <MessageCircle className="w-6 h-6 fill-white" />
        <span className="hidden sm:inline font-black text-xs uppercase tracking-wider">
          Chat Mie Jebew
        </span>

        {/* Mobile floating tooltip indicator */}
        <span className="sm:hidden absolute -top-8 right-0 bg-black text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          Chat Mie Jebew
        </span>
      </a>
    </aside>
  );
};
