import React from 'react';
import { WhyChooseUsItem } from '../../types';
import { Sparkles } from '../ui/Icons';
import { ScrollReveal } from '../ui/ScrollReveal';

interface WhyChooseUsSectionProps {
  items: WhyChooseUsItem[];
}

export const WhyChooseUsSection: React.FC<WhyChooseUsSectionProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <section id="why-us" className="py-12 sm:py-16 bg-cream-100 border-t-3 border-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <ScrollReveal animation="fade-up" duration={700}>
          <div className="text-center space-y-3 mb-10">
            <div className="inline-flex items-center gap-1.5 bg-jebew-yellow border-2 border-black px-3.5 py-1 rounded-full text-xs font-black shadow-brutal-sm uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              KEUNGGULAN KAMI
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-black tracking-tight">
              KENAPA MEMILIH MIE JEBEW?
            </h2>
            <p className="text-sm sm:text-base font-bold text-gray-700 max-w-lg mx-auto">
              Komitmen kami untuk memberikan kualitas rasa terbaik dan pengalaman kuliner pedas yang higienis.
            </p>
          </div>
        </ScrollReveal>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((item, idx) => (
            <ScrollReveal
              key={item.id}
              animation="apple-card"
              delay={idx * 80}
              duration={650}
              className="h-full"
            >
              <div className="bg-white border-3 border-black rounded-2xl p-5 shadow-brutal hover:shadow-brutal-lg transition-all h-full flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-xl bg-cream border-2 border-black flex items-center justify-center text-3xl shadow-brutal-sm">
                    {item.icon || '🌶️'}
                  </div>
                  <h3 className="text-lg font-black text-black leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="h-1.5 w-10 bg-jebew-red rounded-full" />
              </div>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  );
};
