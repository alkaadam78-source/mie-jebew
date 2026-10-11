import React from 'react';
import { Star, MessageSquareQuote, ThumbsUp } from '../ui/Icons';
import { CUSTOMER_REVIEWS } from '../../data/menu';
import { ScrollReveal } from '../ui/ScrollReveal';

export const Testimonials: React.FC = () => {
  return (
    <section id="testimoni" className="py-10 sm:py-16 bg-cream-100 border-t-3 border-black overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <ScrollReveal animation="fade-up" duration={700}>
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex items-center gap-1.5 bg-jebew-yellow border-2 border-black px-3.5 py-1 rounded-full text-xs font-black shadow-brutal-sm uppercase">
              <ThumbsUp className="w-3.5 h-3.5" />
              ULASAN ASLI PELANGGAN
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-black tracking-tight">
              KATA MEREKA TENTANG JEBEW!
            </h2>
            <p className="text-xs sm:text-sm font-bold text-gray-600 max-w-md mx-auto">
              Sudah ribuan pelanggan terbukti ketagihan pedasnya Mie Jebew. Ini pengalaman jujur mereka!
            </p>
          </div>
        </ScrollReveal>

        {/* Swipe Carousel on Mobile, Grid on Desktop */}
        <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto no-scrollbar pb-4 snap-x snap-mandatory">
          {CUSTOMER_REVIEWS.map((rev, idx) => (
            <ScrollReveal
              key={rev.id}
              animation="apple-card"
              delay={idx * 100}
              duration={650}
              className="flex-shrink-0 w-80 sm:w-auto snap-start h-full"
            >
              <div className="bg-white border-3 border-black rounded-3xl p-5 shadow-brutal flex flex-col justify-between h-full">
                <div className="space-y-3">
                  {/* Stars & Quote Icon */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 stroke-black stroke-[1.5]" />
                      ))}
                    </div>
                    <MessageSquareQuote className="w-6 h-6 text-gray-300" />
                  </div>

                  {/* Comment */}
                  <p className="text-xs sm:text-sm font-semibold text-gray-800 leading-relaxed italic">
                    "{rev.comment}"
                  </p>
                </div>

                {/* Reviewer info */}
                <div className="pt-4 mt-4 border-t-2 border-gray-100 flex items-center gap-3">
                  {rev.avatar ? (
                    <img
                      src={rev.avatar}
                      alt={rev.name || rev.author}
                      className="w-10 h-10 rounded-full border-2 border-black object-cover"
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-full border-2 border-black flex items-center justify-center font-black text-sm ${rev.avatarBg || 'bg-brand-yellow text-black'}`}>
                      {(rev.name || rev.author || 'P').charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-black text-xs sm:text-sm text-black">{rev.name || rev.author}</div>
                    <div className="text-[10px] font-bold text-jebew-red">{rev.favoriteItem || rev.role || 'Pecinta Pedas'}</div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  );
};
