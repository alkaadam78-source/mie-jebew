import React from 'react';
import { VinasSectionData } from '../../types';
import { Flame, ArrowRight, Heart } from '../ui/Icons';
import { ScrollReveal } from '../ui/ScrollReveal';

const GILY_RECIPE_VIDEO_URL =
  'https://www.instagram.com/reel/Dd5dITdSxT-/?utm_source=ig_web_copy_link&cplk=MzRlODBiNWFlZA==&srtk=MzRlODBiNWFlZA==';

interface VinasSectionProps {
  vinas: VinasSectionData;
  onExploreRecipe?: () => void;
}

export const VinasSection: React.FC<VinasSectionProps> = ({ vinas }) => {
  if (!vinas || !vinas.is_active) return null;

  // Sanitasi teks agar selalu menampilkan nama Gily
  const displayTitle = (vinas.title || "Gily's Signature Recipe").replace(/Vina/gi, 'Gily');
  const displaySubtitle = (vinas.subtitle || 'Kisah Rasa di Balik Kelezatan Pedas Mie Jebew').replace(/Vina/gi, 'Gily');
  const displayDesc = (vinas.description || '').replace(/Vina/gi, 'Gily');
  const displayQuote = (vinas.quote || '').replace(/Vina/gi, 'Gily');

  return (
    <section id="vinas" className="py-12 sm:py-20 bg-cream-50 border-t-3 border-black relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Visual Founder Image with Brutalist Border Frame */}
          <ScrollReveal animation="apple-card" duration={750} className="lg:col-span-5">
            <div className="relative mx-auto max-w-md">
              {/* Brutal offset back shadow */}
              <div className="absolute inset-0 bg-jebew-red border-3 border-black rounded-3xl translate-x-3 translate-y-3" />
              
              <div className="relative bg-white border-3 border-black rounded-3xl overflow-hidden shadow-brutal-md">
                <img
                  src={vinas.image_url || '/team-cravecorner.jpg'}
                  alt="Gily - Crave Corner"
                  loading="lazy"
                  decoding="async"
                  className="w-full aspect-[4/5] object-cover"
                />
                
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 border-2 border-black p-3 rounded-2xl shadow-brutal-sm">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-jebew-red fill-jebew-red flex-shrink-0" />
                    <div>
                      <div className="text-xs font-black text-black">Gily — Crave Corner Founder</div>
                      <div className="text-[11px] font-bold text-gray-600">Peracik Resep Rahasia Mie Jebew</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Story & Philosophy Content */}
          <ScrollReveal animation="fade-up" duration={750} delay={100} className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 bg-jebew-yellow border-2 border-black px-3.5 py-1 rounded-full text-xs font-black shadow-brutal-sm uppercase">
                <Flame className="w-3.5 h-3.5 text-jebew-red fill-jebew-red" />
                <span>FOUNDER'S SIGNATURE</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-black tracking-tight leading-tight">
                {displayTitle}
              </h2>
              <div className="text-base sm:text-lg font-black text-jebew-red">
                {displaySubtitle}
              </div>
            </div>

            {/* Blockquote */}
            <div className="relative pl-5 border-l-4 border-black italic font-bold text-gray-800 text-sm sm:text-base leading-relaxed bg-white/70 p-3 rounded-r-xl border-2 border-gray-200">
              "{displayQuote || 'Pedas itu bukan sekadar membakar lidah, tetapi sebuah harmoni antara gurihnya rempah nusantara dan kehangatan rasa yang membekas di hati.'}"
            </div>

            <p className="text-sm sm:text-base font-medium text-gray-700 leading-relaxed">
              {displayDesc ||
                'Resep Mie Jebew lahir dari eksperimen dapur oleh Gily bersama Tim Crave Corner, memadukan tradisi mie nusantara dengan sambal chili oil aromatik yang kaya rasa. Setiap bumbu diracik secara personal untuk memastikan kenikmatan rasa yang otentik dan tak terlupakan.'}
            </p>

            {/* Direct CTA Link to Instagram Video Reel */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                href={GILY_RECIPE_VIDEO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 bg-jebew-red hover:bg-red-700 text-white font-black text-sm sm:text-base px-6 py-3.5 border-3 border-black rounded-xl shadow-brutal active:translate-x-0.5 active:translate-y-0.5 hover:shadow-brutal-sm transition-all cursor-pointer group"
              >
                <span>Cicipi Resep Gily</span>
                <span className="text-base group-hover:scale-125 transition-transform">🎬</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </a>

              <a
                href="#menu"
                className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-100 text-black font-black text-sm sm:text-base px-5 py-3.5 border-2 border-black rounded-xl shadow-brutal-xs cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
              >
                <span>🍜 Pesan Menu Sekarang</span>
              </a>
            </div>
          </ScrollReveal>

        </div>
      </div>
    </section>
  );
};

export default VinasSection;
