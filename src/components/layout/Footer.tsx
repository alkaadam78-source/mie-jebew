import React from 'react';
import { Flame, Phone, MapPin, Heart, ShieldCheck } from '../ui/Icons';
import { InstagramIcon } from '../ui/Icons';
import { STORE_CONFIG } from '../../config/store';
import { ScrollReveal } from '../ui/ScrollReveal';
import { usePublicData } from '../../context/PublicDataContext';

export const Footer: React.FC = () => {
  const { contact, socialLinks } = usePublicData();

  const whatsappDisplay = contact?.whatsapp_display || STORE_CONFIG.whatsappDisplay;
  const igLink = socialLinks.find((s) => s.platform.toLowerCase() === 'instagram');
  const igHandle = igLink?.handle || STORE_CONFIG.instagramHandle;

  return (
    <footer className="bg-black text-white border-t-4 border-black pt-12 pb-24 sm:pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Top Grid */}
        <ScrollReveal animation="fade-up" duration={700}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-neutral-800">
          
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl p-1 border-2 border-white flex items-center justify-center">
                <img
                  src={STORE_CONFIG.assets.logo}
                  alt="Mie Jebew Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="font-black text-2xl tracking-tight text-white flex items-center gap-1">
                  MIE JEBEW
                  <Flame className="w-5 h-5 text-jebew-red fill-jebew-red" />
                </span>
                <span className="text-xs font-bold text-yellow-400">
                  {STORE_CONFIG.tagline}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-sm">
              Pelopor mie pedas bumbu cabai asli khas nusantara. Dibuat fresh setiap hari dengan bumbu rempah autentik & minyak cabai spesial.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 bg-neutral-800 border border-neutral-700 px-2.5 py-1 rounded-md text-[11px] font-bold text-neutral-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                100% Halal
              </span>
              <span className="inline-flex items-center gap-1 bg-neutral-800 border border-neutral-700 px-2.5 py-1 rounded-md text-[11px] font-bold text-neutral-300">
                Higienis & Segar
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-black text-sm uppercase tracking-wider text-yellow-400">
              NAVIGASI CEPAT
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm font-bold text-neutral-300">
              <li>
                <a href="#menu" className="hover:text-yellow-400 transition-colors">
                  🍜 Katalog Menu & Level
                </a>
              </li>
              <li>
                <a href="#bottles" className="hover:text-yellow-400 transition-colors">
                  🌶️ Sambal & Chili Oil Botolan
                </a>
              </li>
              <li>
                <a href="#bundles" className="hover:text-yellow-400 transition-colors">
                  📦 Paket Bundle Komplit
                </a>
              </li>
              <li>
                <a href="#promo" className="hover:text-yellow-400 transition-colors">
                  🔥 Penawaran Spesial Promo
                </a>
              </li>
              <li>
                <a href="#vinas" className="hover:text-yellow-400 transition-colors">
                  ❤️ Resep Rahasia Gily (Crave Corner)
                </a>
              </li>
              <li>
                <a href="#lokasi" className="hover:text-yellow-400 transition-colors">
                  📍 Outlet & Jam Buka
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Hours */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="font-black text-sm uppercase tracking-wider text-yellow-400">
              HUBUNGI KAMI
            </h4>
            <div className="space-y-2.5 text-xs sm:text-sm text-neutral-300 font-medium">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-jebew-red flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">{STORE_CONFIG.address.title}</span>
                  <a
                    href={STORE_CONFIG.address.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-neutral-400 hover:text-yellow-400 underline block transition-colors"
                  >
                    {STORE_CONFIG.address.street}, {STORE_CONFIG.address.city} ↗
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-whatsapp flex-shrink-0" />
                <span>WhatsApp: {whatsappDisplay}</span>
              </div>
              <div className="flex items-center gap-2">
                <InstagramIcon className="w-4 h-4 text-pink-400 flex-shrink-0" />
                <span>Instagram: {igHandle}</span>
              </div>
            </div>
          </div>

          </div>
        </ScrollReveal>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400 text-center sm:text-left font-medium">
          <p>© {new Date().getFullYear()} Mie Jebew Official. Hak Cipta Dilindungi.</p>
          <div className="flex items-center gap-4">
            <p className="flex items-center justify-center gap-1">
              Dibuat dengan rasa cinta kuliner pedas nusantara <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
};
