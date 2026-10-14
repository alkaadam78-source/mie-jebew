import React, { useState, useEffect, useCallback } from 'react';
import { PromotionalPopupData } from '../../types';
import { X, Flame, ArrowRight, Utensils } from '../ui/Icons';

interface PromotionalPopupProps {
  popup: PromotionalPopupData | null;
  onOrderNow?: () => void;
  onSelectOriginal?: () => void;
  onActionClick?: (ctaLink: string) => void;
  currentPage?: 'home' | 'menu' | string;
}

export const PromotionalPopup: React.FC<PromotionalPopupProps> = ({
  popup,
  onOrderNow,
  onSelectOriginal,
  onActionClick,
  currentPage = 'home',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Check if popup should be shown based on frequency & dismissal
  const shouldDisplay = useCallback((config: PromotionalPopupData): boolean => {
    // Target page check
    if (config.target_page !== 'all' && config.target_page !== currentPage) {
      return false;
    }

    // Schedule check
    const now = new Date();
    if (config.start_date && now < new Date(String(config.start_date))) return false;
    if (config.end_date && now > new Date(String(config.end_date))) return false;

    // Frequency check
    const storageKeySession = `mie_jebew_popup_dismissed_${config.id}`;
    const storageKeyDaily = `mie_jebew_popup_daily_${config.id}`;

    if (config.frequency === 'once_per_session') {
      const dismissed = sessionStorage.getItem(storageKeySession);
      if (dismissed === 'true') return false;
    } else if (config.frequency === 'once_per_day') {
      const today = new Date().toISOString().slice(0, 10);
      const lastSeen = localStorage.getItem(storageKeyDaily);
      if (lastSeen === today) return false;
    }

    return true;
  }, [currentPage]);

  useEffect(() => {
    if (!popup) return;

    if (!shouldDisplay(popup)) {
      setIsOpen(false);
      return;
    }

    const delayMs = Math.max(200, (popup.delay_seconds || 0) * 1000);
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [popup, shouldDisplay]);

  // Keyboard accessibility: ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleDismiss = () => {
    setIsOpen(false);
    if (!popup) return;

    const storageKeySession = `mie_jebew_popup_dismissed_${popup.id}`;
    const storageKeyDaily = `mie_jebew_popup_daily_${popup.id}`;

    if (popup.frequency === 'once_per_session') {
      sessionStorage.setItem(storageKeySession, 'true');
    } else if (popup.frequency === 'once_per_day') {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem(storageKeyDaily, today);
    }
  };

  const handleCtaClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    handleDismiss();

    if (onActionClick && popup?.cta_link) {
      onActionClick(popup.cta_link);
    } else if (onSelectOriginal) {
      onSelectOriginal();
    } else if (onOrderNow) {
      onOrderNow();
    } else {
      const target = document.getElementById("menu-item-mie-1") || document.getElementById("menu");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  if (!isOpen || !popup) return null;

  const fallbackBanner = '/promo-popup-banner.jpg';
  const displayImage = imageError ? fallbackBanner : (popup.image_url || fallbackBanner);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-popup-headline"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm transition-all duration-300 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      {/* Neo-Brutalism Modal Card */}
      <div className="relative w-full max-w-xl bg-[#FFFDF5] border-4 border-black shadow-[10px_10px_0_0_#000] rounded-2xl overflow-hidden transition-all duration-300 animate-scaleUp">
        
        {/* Top Accent Strip */}
        <div className="bg-jebew-yellow border-b-3 border-black px-4 py-1.5 flex items-center justify-between text-xs font-black uppercase tracking-wider text-black">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <span>{popup.badge_text || 'PROMO SPESIAL 🔥'}</span>
          </div>
          <span className="hidden sm:inline text-[11px] font-bold text-neutral-800">MIE JEBEW OFFICIAL</span>
        </div>

        {/* Close Button (X) */}
        <button
          onClick={handleDismiss}
          aria-label="Tutup Popup Promosi"
          className="absolute top-2 right-2 z-20 w-8 h-8 sm:w-9 sm:h-9 bg-yellow-400 hover:bg-red-600 hover:text-white text-black font-black border-2 border-black rounded-lg shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-5 h-5 stroke-[3]" />
        </button>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 sm:p-6 items-center">
          
          {/* Left Column: Authentic Brand Copy */}
          <div className="md:col-span-7 space-y-3.5 text-left order-2 md:order-1">
            
            {/* Tag Brand Red Box */}
            <div className="inline-flex items-center gap-2 bg-red-600 border-2 border-black px-3 py-1 shadow-[3px_3px_0_0_#000] -rotate-1">
              <span className="font-black text-white text-base sm:text-lg tracking-wider">
                {popup.title || 'MIE JEBEW'}
              </span>
              <Flame className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            </div>

            {/* Headline */}
            <div>
              <h2
                id="promo-popup-headline"
                className="font-black text-2xl sm:text-3xl text-red-600 leading-tight uppercase tracking-tight drop-shadow-[1px_1px_0_#000]"
              >
                {popup.headline || 'PEDASNYA BIKIN NAGIH!'}
              </h2>
            </div>

            {/* Subtitle Badge Pill */}
            {popup.subtitle && (
              <div className="inline-block bg-black text-yellow-300 px-3 py-1 border-2 border-black rounded-md font-black text-xs sm:text-sm tracking-wide shadow-[2px_2px_0_0_#E11D48]">
                {popup.subtitle}
              </div>
            )}

            {/* Description */}
            <p className="text-xs sm:text-sm font-bold text-neutral-800 leading-relaxed border-l-3 border-red-600 pl-2.5">
              {popup.description || 'Mie pedas + topping favorit lo.'}
            </p>

            {/* Call To Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                onClick={handleCtaClick}
                className="flex-1 flex items-center justify-center gap-2 bg-black hover:bg-neutral-800 text-white font-black text-xs sm:text-sm uppercase tracking-wider py-3 px-4 border-3 border-black rounded-xl shadow-[4px_4px_0_0_#FACC15] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer group"
              >
                <span>{popup.cta_text || 'PESAN SEKARANG'}</span>
                <ArrowRight className="w-4 h-4 text-yellow-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={handleDismiss}
                className="bg-white hover:bg-neutral-100 text-neutral-700 font-bold text-xs py-2.5 px-3 border-2 border-black rounded-xl shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer text-center"
              >
                {popup.secondary_text || 'Nanti aja'}
              </button>
            </div>

          </div>

          {/* Right Column: Visual Poster with Neo-Brutalist Frame */}
          <div
            className="md:col-span-5 flex justify-center order-1 md:order-2 cursor-pointer group"
            onClick={handleCtaClick}
            title={popup.cta_text ? `Klik untuk ${popup.cta_text}` : 'Klik untuk buka promo'}
          >
            <div className="relative w-full max-w-[240px] md:max-w-none group">
              
              {/* Background Geometric Accent Layer */}
              <div className="absolute inset-0 bg-yellow-400 border-3 border-black rounded-xl translate-x-2 translate-y-2 -rotate-2" />

              {/* Real Image Container */}
              <div className="relative aspect-square sm:aspect-[4/5] bg-neutral-900 border-3 border-black rounded-xl overflow-hidden shadow-[4px_4px_0_0_#000]">
                <img
                  src={displayImage}
                  alt={popup.headline || 'Mie Jebew Promo'}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  onError={() => setImageError(true)}
                />

                {/* Corner Noodle Sticker */}
                <div className="absolute top-2 right-2 bg-yellow-400 border-2 border-black p-1.5 rounded-lg shadow-[2px_2px_0_0_#000] rotate-6">
                  <Utensils className="w-4 h-4 text-black" />
                </div>

                {/* Bottom Spicy Badge Overlay */}
                <div className="absolute bottom-2 left-2 right-2 bg-black/85 border border-yellow-400/80 px-2 py-1 rounded text-center">
                  <span className="text-[10px] font-black text-yellow-300 tracking-wider uppercase">
                    Cabai Asli Nusantara 🌶️
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Bottom Micro Footer */}
        <div className="bg-neutral-100 border-t-2 border-black px-4 py-1.5 text-center text-[10px] font-bold text-neutral-500">
          <span>Tutup popup dengan tombol (X) atau tekan tombol ESC pada keyboard</span>
        </div>

      </div>
    </div>
  );
};
