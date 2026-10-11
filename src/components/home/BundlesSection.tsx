import React from 'react';
import { BundleItem } from '../../types';
import { Sparkles, Check, ShoppingBag } from '../ui/Icons';
import { ScrollReveal } from '../ui/ScrollReveal';

interface BundlesSectionProps {
  bundles: BundleItem[];
  onOrderBundle: (bundle: BundleItem) => void;
}

export const BundlesSection: React.FC<BundlesSectionProps> = ({ bundles, onOrderBundle }) => {
  if (!bundles || bundles.length === 0) return null;

  return (
    <section id="bundles" className="py-12 sm:py-16 bg-cream border-t-3 border-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <ScrollReveal animation="fade-up" duration={700}>
          <div className="text-center space-y-3 mb-10">
            <div className="inline-flex items-center gap-1.5 bg-jebew-yellow border-2 border-black px-3.5 py-1 rounded-full text-xs font-black shadow-brutal-sm uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              PAKET COMBO SERBA 10K
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-black tracking-tight">
              PILIHAN PAKET SERBA 10 RIBU
            </h2>
            <p className="text-sm sm:text-base font-bold text-gray-700 max-w-xl mx-auto">
              Kombinasi komplit mie pedas, minuman segar, dan ekstra topping — Semua paket serba Rp 10.000!
            </p>
          </div>
        </ScrollReveal>

        {/* Bundles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bundles.map((bundle, idx) => {
            const items = Array.isArray(bundle.items_included)
              ? bundle.items_included
              : [];

            return (
              <ScrollReveal
                key={bundle.id}
                animation="apple-card"
                delay={idx * 120}
                duration={700}
                className="h-full"
              >
                <div className="bg-white border-3 border-black rounded-3xl p-6 shadow-brutal hover:shadow-brutal-lg transition-all h-full flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    
                    {/* Header Pill & Name */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {bundle.savings_badge && (
                          <span className="inline-block bg-emerald-100 text-emerald-900 border-2 border-black px-2.5 py-0.5 rounded-full text-xs font-black uppercase shadow-brutal-sm mb-2">
                            {bundle.savings_badge}
                          </span>
                        )}
                        <h3 className="text-2xl font-black text-black leading-snug">
                          {bundle.name}
                        </h3>
                      </div>

                      <div className="text-right">
                        <span className="text-xs line-through font-bold text-gray-500 block">
                          Rp{bundle.original_price.toLocaleString('id-ID')}
                        </span>
                        <span className="text-2xl font-black text-jebew-red">
                          Rp{bundle.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm font-medium text-gray-700 leading-relaxed">
                      {bundle.description}
                    </p>

                    {/* Items List */}
                    {items.length > 0 && (
                      <div className="bg-cream-50 border-2 border-black rounded-2xl p-4 space-y-2">
                        <div className="text-xs font-black uppercase text-gray-600 tracking-wider">
                          Sudah Termasuk:
                        </div>
                        <ul className="space-y-1.5">
                          {items.map((it, iIdx) => (
                            <li key={iIdx} className="flex items-center gap-2 text-xs sm:text-sm font-bold text-black">
                              <span className="w-5 h-5 rounded-md bg-jebew-yellow border border-black flex items-center justify-center text-black flex-shrink-0">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </span>
                              <span>{it}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Order Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => onOrderBundle(bundle)}
                      className="w-full min-h-[46px] bg-jebew-red hover:bg-red-700 active:bg-red-800 text-white font-black text-sm py-3 px-4 border-2 border-black rounded-xl shadow-brutal active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>PESAN BUNDLE INI</span>
                    </button>
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
