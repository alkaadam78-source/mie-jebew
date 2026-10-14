import React from 'react';
import { BehindKitchenItem } from '../../types';
import { UtensilsCrossed } from '../ui/Icons';
import { ScrollReveal } from '../ui/ScrollReveal';

interface BehindKitchenSectionProps {
  items: BehindKitchenItem[];
}

export const BehindKitchenSection: React.FC<BehindKitchenSectionProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <section id="behind-kitchen" className="py-12 sm:py-16 bg-cream border-t-3 border-black relative">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <ScrollReveal animation="fade-up" duration={700}>
          <div className="text-center space-y-3 mb-10">
            <div className="inline-flex items-center gap-1.5 bg-black text-yellow-300 border-2 border-black px-3.5 py-1 rounded-full text-xs font-black shadow-brutal-sm uppercase">
              <UtensilsCrossed className="w-3.5 h-3.5" />
              TIM CRAVE CORNER • DI BALIK DAPUR JEBEW
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-black tracking-tight">
              BEHIND THE KITCHEN
            </h2>
            <p className="text-sm sm:text-base font-bold text-gray-700 max-w-lg mx-auto">
              Intip proses persiapan, racikan bumbu higienis, dan dedikasi tim kami dalam menghadirkan mie pedas terenak.
            </p>
          </div>
        </ScrollReveal>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item, idx) => (
            <ScrollReveal
              key={item.id}
              animation="apple-card"
              delay={idx * 100}
              duration={700}
              className="h-full"
            >
              <div className="group bg-white border-3 border-black rounded-3xl overflow-hidden shadow-brutal hover:shadow-brutal-lg transition-all h-full flex flex-col justify-between">
                
                <div className="relative aspect-[4/3] bg-neutral-900 overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {item.tag && (
                    <span className="absolute top-3 left-3 bg-white border-2 border-black px-2.5 py-0.5 rounded-full text-[11px] font-black text-black shadow-brutal-sm">
                      {item.tag}
                    </span>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-2">
                  <h3 className="text-lg font-black text-black leading-snug">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-xs sm:text-sm font-medium text-gray-700 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

              </div>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  );
};
