import React from 'react';
import { ProductBottle } from '../../types';
import { Flame, ShoppingBag, Sparkles, CheckCircle } from '../ui/Icons';
import { ScrollReveal } from '../ui/ScrollReveal';

interface BottlesSectionProps {
  bottles: ProductBottle[];
  onOrderBottle: (bottle: ProductBottle) => void;
}

export const BottlesSection: React.FC<BottlesSectionProps> = ({ bottles, onOrderBottle }) => {
  if (!bottles || bottles.length === 0) return null;

  return (
    <section id="bottles" className="py-12 sm:py-16 bg-cream border-t-3 border-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <ScrollReveal animation="fade-up" duration={700}>
          <div className="text-center space-y-3 mb-10">
            <div className="inline-flex items-center gap-1.5 bg-jebew-red text-white border-2 border-black px-3.5 py-1 rounded-full text-xs font-black shadow-brutal-sm uppercase">
              <Flame className="w-3.5 h-3.5 fill-white" />
              KEMASAN MINI SERBA 10K
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-black tracking-tight">
              CHILI OIL & SAMBAL SERBA 10 RIBU
            </h2>
            <p className="text-sm sm:text-base font-bold text-gray-700 max-w-xl mx-auto">
              Bawa pulang pedasnya Mie Jebew ke rumahmu! Kemasan mini ekonomis serba Rp 10.000 tanpa pengawet.
            </p>
          </div>
        </ScrollReveal>

        {/* Bottles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {bottles.map((bottle, idx) => {
            const isOutOfStock = bottle.stock_status === 'out_of_stock';
            return (
              <ScrollReveal
                key={bottle.id}
                animation="apple-card"
                delay={idx * 120}
                duration={700}
                className="h-full"
              >
                <div className="group flex flex-col bg-white border-3 border-black rounded-3xl overflow-hidden shadow-brutal hover:shadow-brutal-lg transition-all h-full justify-between">
                  
                  {/* Image & Badges Container */}
                  <div className="relative aspect-[4/3] bg-amber-50 border-b-3 border-black overflow-hidden flex items-center justify-center p-4">
                    <img
                      src={bottle.image || '/rasa-mie/Original.jpeg'}
                      alt={bottle.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Top Left Badge */}
                    {bottle.badge && (
                      <div className="absolute top-3 left-3 bg-jebew-yellow border-2 border-black px-2.5 py-0.5 rounded-full text-xs font-black shadow-brutal-sm flex items-center gap-1 z-10">
                        <Sparkles className="w-3.5 h-3.5 text-black" />
                        <span>{bottle.badge}</span>
                      </div>
                    )}

                    {/* Heat Level & Volume Pill */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
                      <span className="bg-black text-yellow-300 border-2 border-black px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider shadow-sm">
                        {'🌶️'.repeat(Math.min(5, Math.max(1, bottle.heat_level)))} LEVEL {bottle.heat_level}
                      </span>
                      <span className="bg-white border-2 border-black px-2 py-0.5 rounded-lg text-[11px] font-black text-black shadow-sm">
                        {bottle.volume_ml} ml
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                          {bottle.subtitle || 'Bumbu Kemasan'}
                        </span>
                        {isOutOfStock ? (
                          <span className="text-[10px] font-black bg-gray-200 text-gray-700 px-2 py-0.5 rounded border border-black">
                            STOK HABIS
                          </span>
                        ) : (
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-black flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            TERSEDIA
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-black text-black leading-snug">
                        {bottle.name}
                      </h3>

                      <p className="text-xs sm:text-sm font-medium text-gray-700 leading-relaxed line-clamp-3">
                        {bottle.description}
                      </p>
                    </div>

                    {/* Price and Order Button */}
                    <div className="pt-3 border-t-2 border-dashed border-gray-300 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-bold text-gray-500">Harga Resmi</div>
                        <div className="text-xl font-black text-jebew-red">
                          Rp{bottle.price.toLocaleString('id-ID')}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => onOrderBottle(bottle)}
                        className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm border-2 border-black shadow-brutal-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                          isOutOfStock
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-400 shadow-none'
                            : 'bg-jebew-yellow hover:bg-yellow-400 active:translate-x-0.5 active:translate-y-0.5 text-black'
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>{isOutOfStock ? 'Habis' : 'Beli Botol'}</span>
                      </button>
                    </div>

                  </div>

                </div>
              </ScrollReveal>
            );
          })}
        </div>

      </div>
    </section>
  );
};
