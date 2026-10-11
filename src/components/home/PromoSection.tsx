import React from 'react';
import { Flame, Check, ArrowRight } from '../ui/Icons';
import { PROMO_BUNDLES } from '../../data/menu';
import { MenuItem } from '../../types';
import { ScrollReveal } from '../ui/ScrollReveal';
import { usePublicData } from '../../context/PublicDataContext';

interface PromoSectionProps {
  onSelectPromo: (promoItem: MenuItem) => void;
}

export const PromoSection: React.FC<PromoSectionProps> = ({ onSelectPromo }) => {
  const { bundles } = usePublicData();

  const activeBundles = (bundles || []).filter((b) => Boolean(b.is_active));

  const promoList = activeBundles.length > 0
    ? activeBundles.map((b) => ({
        id: b.id,
        title: b.name,
        tagline: b.description,
        badge: b.savings_badge || 'SERBA 10K',
        originalPrice: b.original_price,
        promoPrice: b.price,
        image: b.image || '/rasa-mie/Original.jpeg',
        items: Array.isArray(b.items_included)
          ? b.items_included
          : typeof b.items_included === 'string'
          ? JSON.parse(b.items_included || '[]')
          : [],
      }))
    : PROMO_BUNDLES.filter((p) => p.isActive);

  if (promoList.length === 0) return null;

  return (
    <section id="promo" className="py-10 sm:py-14 bg-cream-100 border-t-3 border-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <ScrollReveal animation="fade-up" duration={700}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-jebew-red text-white border-2 border-black px-3 py-1 rounded-full text-xs font-black shadow-brutal-sm uppercase">
                <Flame className="w-3.5 h-3.5 fill-white" />
                PENAWARAN SPESIAL 10K
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-black tracking-tight mt-2">
                🔥 PAKET SERBA 10 RIBU
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-bold text-gray-600 max-w-sm">
              Kombinasi menu paket paling hemat & kenyang — Semuanya serba Rp 10.000 tanpa bikin kantong bolong!
            </p>
          </div>
        </ScrollReveal>

        {/* Promo Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {promoList.map((promo, idx) => (
            <ScrollReveal
              key={promo.id}
              animation="apple-card"
              delay={idx * 140}
              duration={750}
              className="h-full"
            >
              <div className="bg-white border-3 border-black rounded-3xl p-5 sm:p-6 shadow-brutal hover:shadow-brutal-lg transition-all relative overflow-hidden flex flex-col justify-between h-full">
              {/* Badge Ribbons */}
              <div className="flex items-center justify-between mb-4">
                <span className="bg-jebew-yellow border-2 border-black px-3 py-1 rounded-full font-black text-xs shadow-brutal-sm uppercase flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-jebew-red fill-jebew-red" />
                  {promo.badge || 'SERBA 10K'}
                </span>
                <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300">
                  HEMAT RP 4.000
                </span>
              </div>

              {/* Title & Tagline */}
              <div className="space-y-1 mb-4">
                <h3 className="font-black text-xl sm:text-2xl text-black">
                  {promo.title}
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-gray-600">
                  {promo.tagline}
                </p>
              </div>

              {/* Items in bundle */}
              <div className="bg-cream border-2 border-black rounded-2xl p-4 mb-5 space-y-2">
                <span className="font-black text-xs uppercase text-gray-700 tracking-wider">
                  ISI PAKET:
                </span>
                <ul className="space-y-1.5">
                  {promo.items.map((itemStr: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-900">
                      <div className="w-4 h-4 rounded-full bg-jebew-yellow border border-black flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span>{itemStr}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Order CTA with Price */}
              <div className="pt-3 border-t-2 border-gray-200 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    {promo.originalPrice > 0 && (
                      <span className="text-xs line-through font-bold text-gray-400">
                        Rp{promo.originalPrice.toLocaleString('id-ID')}
                      </span>
                    )}
                    <span className="text-xl sm:text-2xl font-black text-jebew-red">
                      Rp{(promo.promoPrice || 10000).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-gray-500 uppercase">
                    Harga Promo Serba 10K
                  </span>
                </div>

                <button
                  onClick={() => {
                    const asMenuItem: MenuItem = {
                      id: promo.id,
                      name: promo.title,
                      category: 'paket',
                      price: promo.promoPrice || 10000,
                      originalPrice: promo.originalPrice || 14000,
                      description: promo.items.join(', '),
                      image: promo.image || '/rasa-mie/Original.jpeg',
                      badge: promo.badge,
                      isSpicySelectable: true,
                    };
                    onSelectPromo(asMenuItem);
                  }}
                  className="px-5 py-3 bg-jebew-yellow hover:bg-yellow-400 active:bg-yellow-500 font-black text-xs sm:text-sm border-2 border-black rounded-xl shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>PILIH PAKET 10K</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  );
};
