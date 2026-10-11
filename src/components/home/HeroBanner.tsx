import React, { useRef, useEffect } from 'react';
import { Flame, ArrowDown, Sparkles } from '../ui/Icons';
import { STORE_CONFIG } from '../../config/store';
import { useStoreStatus } from '../../hooks/useStoreStatus';
import { ScrollReveal } from '../ui/ScrollReveal';
import { usePublicData } from '../../context/PublicDataContext';

interface HeroBannerProps {
  onOrderNow: () => void;
  onExploreMenu: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onOrderNow,
  onExploreMenu,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { statusBadge } = useStoreStatus();
  const { homepage } = usePublicData();

  useEffect(() => {
    // Attempt playback cleanly
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay may be restricted on some devices until user interaction
        console.log('Video autoplay restrained, falling back to poster');
      });
    }
  }, []);

  const headline = homepage?.hero_headline || 'MIE JEBEW';
  const subheadline = homepage?.hero_subheadline || 'PEDASNYA BIKIN JEBEW! 🌶️';
  const description =
    homepage?.hero_description ||
    'Sensasi mie kenyal bertabur ayam cincang gurih dengan siraman chili oil pedas nampol level 0 sampai 5! Tanpa ribet login, pesan langsung lewat WhatsApp dalam hitungan detik.';
  const heroBadge = homepage?.hero_badge || 'BEST SELLER';
  const ctaOrderText = homepage?.cta_order_text || 'PESAN SEKARANG';
  const ctaMenuText = homepage?.cta_menu_text || 'LIHAT MENU';
  const announcement = homepage?.is_announcement_active ? homepage.announcement_banner : null;

  return (
    <section className="relative overflow-hidden pt-4 pb-8 sm:py-12 bg-cream">
      {/* Background brutal dot grid pattern */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          
          {/* Main Content Column (Mobile First) */}
          <ScrollReveal animation="fade-up" duration={750} delay={50} className="lg:col-span-7 flex flex-col justify-center text-left space-y-4 sm:space-y-6 order-1">
            
            {/* Announcement Banner if active */}
            {announcement && (
              <div className="bg-brand-red text-white border-2 border-black px-3.5 py-1.5 rounded-lg text-xs font-black uppercase shadow-brutal-sm flex items-center gap-2 animate-pulse">
                <Flame className="w-4 h-4 fill-white flex-shrink-0" />
                <span className="truncate">{announcement}</span>
              </div>
            )}

            {/* Badges bar */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-jebew-yellow border-2 border-black px-3 py-1 rounded-full text-xs sm:text-sm font-black shadow-brutal-sm uppercase tracking-wide">
                <Flame className="w-4 h-4 text-jebew-red fill-jebew-red" />
                {heroBadge}
              </span>
              <span className="inline-flex items-center gap-1 bg-white border-2 border-black px-3 py-1 rounded-full text-xs font-bold shadow-brutal-sm text-gray-800">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                100% Cabai Asli Pilihan
              </span>
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border-2 border-black px-3 py-1 rounded-full text-xs font-bold shadow-brutal-sm">
                {statusBadge}
              </span>
            </div>

            {/* Main Headline */}
            <div className="space-y-1 sm:space-y-2">
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[0.95] text-black">
                {headline}
              </h1>
              <div className="inline-block bg-jebew-red text-white font-black text-2xl sm:text-4xl md:text-5xl px-3 py-1 border-3 border-black shadow-brutal-sm sm:shadow-brutal rotate-[-1deg]">
                {subheadline}
              </div>
            </div>

            {/* Sub-headline description */}
            <p className="text-base sm:text-lg font-bold text-gray-800 leading-relaxed max-w-xl">
              {description}
            </p>

            {/* Mobile Video Card (Integrated directly into the mobile view so user sees it right away) */}
            <div className="lg:hidden relative w-full rounded-2xl border-brutal bg-black overflow-hidden shadow-brutal-md max-h-[360px] flex items-center justify-center">
              <video
                ref={videoRef}
                src={STORE_CONFIG.assets.videoBanner}
                poster={STORE_CONFIG.assets.videoPoster}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="w-full h-full object-cover max-h-[360px]"
              />
              
              {/* Overlay Gradient for readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

              {/* Bottom tag inside video */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white pointer-events-none">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-white border border-black p-0.5 shadow-sm">
                    <img src={STORE_CONFIG.assets.logo} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <span className="font-extrabold text-sm text-yellow-300 drop-shadow-md">
                    Level 0 s/d 5 Neraka Jebew! 🔥
                  </span>
                </div>
                <span className="text-[10px] bg-red-600 font-black px-2 py-0.5 rounded border border-white uppercase">
                  LIVE PROMO
                </span>
              </div>
            </div>

            {/* Primary & Secondary Call to Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={onOrderNow}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-jebew-red hover:bg-red-600 text-white font-black text-lg sm:text-xl px-8 py-4 border-3 border-black rounded-xl shadow-brutal active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
              >
                <Flame className="w-6 h-6 animate-pulse" />
                <span>{ctaOrderText}</span>
              </button>

              <button
                onClick={onExploreMenu}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-yellow-100 text-black font-extrabold text-base sm:text-lg px-6 py-4 border-3 border-black rounded-xl shadow-brutal active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
              >
                <ArrowDown className="w-5 h-5" />
                <span>{ctaMenuText}</span>
              </button>
            </div>

            {/* Highlights pill row */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-center">
              <div className="bg-white border-2 border-black p-2 rounded-lg shadow-brutal-sm">
                <div className="font-black text-xs sm:text-sm text-jebew-red">🌶️ LEVEL 0-5</div>
                <div className="text-[10px] sm:text-xs font-semibold text-gray-600">Bebas Custom</div>
              </div>
              <div className="bg-white border-2 border-black p-2 rounded-lg shadow-brutal-sm">
                <div className="font-black text-xs sm:text-sm text-jebew-orange">⚡ ORDER CEPAT</div>
                <div className="text-[10px] sm:text-xs font-semibold text-gray-600">Langsung ke WA</div>
              </div>
              <div className="bg-white border-2 border-black p-2 rounded-lg shadow-brutal-sm">
                <div className="font-black text-xs sm:text-sm text-whatsapp-dark">🛵 DIANTAR PANAS</div>
                <div className="text-[10px] sm:text-xs font-semibold text-gray-600">Kemasan Aman</div>
              </div>
            </div>

          </ScrollReveal>

          {/* Video Banner Column (Desktop Showcase) */}
          <ScrollReveal animation="apple-card" duration={800} delay={180} className="hidden lg:block lg:col-span-5 order-2">
            <div className="relative mx-auto max-w-sm">
              {/* Decorative brutal back layer */}
              <div className="absolute inset-0 bg-jebew-yellow border-3 border-black rounded-3xl translate-x-3 translate-y-3" />
              
              {/* Video container card */}
              <div className="relative bg-white border-3 border-black rounded-3xl overflow-hidden shadow-brutal-lg">
                
                {/* Window header */}
                <div className="bg-cream-100 border-b-2 border-black px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500 border border-black" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400 border border-black" />
                    <span className="w-3 h-3 rounded-full bg-green-500 border border-black" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-gray-700">
                    MIE JEBEW BANNER.MP4
                  </span>
                </div>

                {/* Video element */}
                <div className="relative aspect-[9/16] bg-black">
                  <video
                    src={STORE_CONFIG.assets.videoBanner}
                    poster={STORE_CONFIG.assets.videoPoster}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    className="w-full h-full object-cover"
                  />

                  {/* Floating badge inside video */}
                  <div className="absolute top-4 left-4 bg-jebew-red text-white font-black text-xs px-3 py-1 border-2 border-black rounded-full shadow-brutal-sm flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-white" />
                    BEST SELLER
                  </div>

                  {/* Bottom overlay inside video */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-none border-2 border-black p-3 rounded-xl shadow-brutal-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-cream border border-black rounded-lg p-0.5 flex-shrink-0">
                        <img src={STORE_CONFIG.assets.logo} alt="Mie Jebew" className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <div className="font-black text-sm text-black leading-tight">Mie Jebew Original</div>
                        <div className="text-xs font-bold text-jebew-red">Pedas Bikin Jebew! 🌶️</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

        </div>
      </div>

      {/* Marquee Ticker */}
      <div className="mt-8 border-y-3 border-black bg-jebew-yellow py-2.5 overflow-hidden whitespace-nowrap">
        <div className="flex items-center gap-6 animate-marquee font-black text-sm sm:text-base tracking-wider uppercase">
          <span>🌶️ CABE ASLI MELIMPAH</span>
          <span>•</span>
          <span>🍜 MIE KENYAL BIKIN NAGIH</span>
          <span>•</span>
          <span>🛵 PESAN CEPAT VIA WHATSAPP</span>
          <span>•</span>
          <span>💥 SENSASI JEBEW JUARA</span>
          <span>•</span>
          <span>🥚 ANEKA TOPPING SULTAN</span>
          <span>•</span>
          <span>⭐ 100% HALAL & HIGIENIS</span>
          <span>•</span>
          <span>🌶️ CABE ASLI MELIMPAH</span>
          <span>•</span>
          <span>🍜 MIE KENYAL BIKIN NAGIH</span>
          <span>•</span>
          <span>🛵 PESAN CEPAT VIA WHATSAPP</span>
          <span>•</span>
          <span>💥 SENSASI JEBEW JUARA</span>
          <span>•</span>
          <span>🥚 ANEKA TOPPING SULTAN</span>
          <span>•</span>
          <span>⭐ 100% HALAL & HIGIENIS</span>
        </div>
      </div>
    </section>
  );
};
