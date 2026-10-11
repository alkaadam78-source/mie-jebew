import React, { useState } from 'react';
import { Clock, Phone, MapPin, ExternalLink, Check } from '../ui/Icons';
import { STORE_CONFIG } from '../../config/store';
import { useStoreStatus } from '../../hooks/useStoreStatus';
import { ScrollReveal } from '../ui/ScrollReveal';
import { usePublicData } from '../../context/PublicDataContext';

export const LocationSection: React.FC = () => {
  const { statusBadge, subText } = useStoreStatus();
  const { contact } = usePublicData();

  const [mapViewMode, setMapViewMode] = useState<'embed' | 'image'>('embed');
  const [copiedAddress, setCopiedAddress] = useState(false);

  const addressTitle = contact?.address_note || STORE_CONFIG.address.title;
  const addressStreet = contact?.address_description || STORE_CONFIG.address.street;
  const addressCity = STORE_CONFIG.address.city;
  const fullAddress = `${addressTitle}, ${addressStreet}, ${addressCity}`;
  const openingHours = contact?.opening_hours || `${STORE_CONFIG.openingHours.days}: ${STORE_CONFIG.openingHours.displayHours}`;
  const whatsappNumber = contact?.whatsapp_number || STORE_CONFIG.whatsappNumber;
  const whatsappDisplay = contact?.whatsapp_display || STORE_CONFIG.whatsappDisplay;
  const mapsUrl = contact?.google_maps_url || STORE_CONFIG.address.mapsUrl;
  const embedUrl = STORE_CONFIG.address.embedUrl;
  const previewImage = STORE_CONFIG.address.previewImage;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(fullAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2500);
  };

  return (
    <section id="lokasi" className="py-12 sm:py-20 bg-cream border-t-3 border-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <ScrollReveal animation="fade-up" duration={700}>
          <div className="text-center space-y-3 mb-10">
            <div className="inline-flex items-center gap-1.5 bg-jebew-yellow border-2 border-black px-4 py-1.5 rounded-full text-xs font-black shadow-brutal-sm uppercase">
              <MapPin className="w-3.5 h-3.5 text-jebew-red" />
              LOKASI OUTLET & GOOGLE MAPS
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-black tracking-tight uppercase">
              TEMUKAN KAMI DI BOGOR
            </h2>
            <p className="max-w-xl mx-auto text-xs sm:text-sm font-semibold text-gray-700">
              Kunjungi outlet kami langsung untuk dine-in / take-away, atau pesan online untuk pengantaran langsung ke rumahmu.
            </p>
          </div>
        </ScrollReveal>

        {/* Main Content: 2-Column Responsive Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Alamat & Jam Buka (5 Cols) */}
          <ScrollReveal animation="fade-up" delay={100} duration={700} className="lg:col-span-5 space-y-5">
            {/* Status Alert Banner */}
            <div className="border-2 border-black p-4 rounded-2xl flex items-center justify-between shadow-brutal-sm bg-emerald-50 text-emerald-900">
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full border border-black bg-green-500 animate-pulse" />
                <div>
                  <div className="font-black text-sm sm:text-base">{statusBadge}</div>
                  <div className="text-xs font-semibold text-gray-700">{subText}</div>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg border border-black/20 bg-white/70">
                WIB (Bogor)
              </span>
            </div>

            {/* Address Details Card */}
            <div className="bg-white border-3 border-black rounded-3xl p-5 sm:p-6 shadow-brutal space-y-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-gray-700 pb-1 border-b-2 border-gray-100">
                <MapPin className="w-4 h-4 text-jebew-red" />
                <span>ALAMAT RESMI OUTLET</span>
              </div>

              <div>
                <h4 className="font-black text-lg sm:text-xl text-black">
                  {addressTitle}
                </h4>
                <p className="text-xs sm:text-sm font-bold text-gray-800 mt-1 leading-relaxed">
                  {addressStreet}
                </p>
                <p className="text-xs font-semibold text-gray-600 mt-0.5">
                  {addressCity}
                </p>
              </div>

              {/* Action Buttons for Location */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-h-[42px] bg-jebew-red hover:bg-red-700 active:bg-red-800 text-white font-black text-xs py-2 px-3 border-2 border-black rounded-xl shadow-brutal-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka di Google Maps</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="min-h-[42px] bg-white hover:bg-cream-100 text-black font-black text-xs py-2 px-3.5 border-2 border-black rounded-xl shadow-brutal-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
                >
                  {copiedAddress ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Tersalin ✓</span>
                    </>
                  ) : (
                    <span>Salin Alamat</span>
                  )}
                </button>
              </div>
            </div>

            {/* Operating Hours & WhatsApp */}
            <div className="bg-white border-3 border-black rounded-3xl p-5 sm:p-6 shadow-brutal space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase text-gray-700">
                  <Clock className="w-4 h-4 text-jebew-orange" />
                  <span>JADWAL BUKA RESTO</span>
                </div>
                <p className="font-extrabold text-sm sm:text-base text-black">
                  {openingHours}
                </p>
                <p className="text-[11px] font-semibold text-gray-600">
                  Melayani pesanan makan di tempat (dine-in), bungkus (takeaway), maupun pesan antar (delivery).
                </p>
              </div>

              <div className="pt-2 border-t-2 border-gray-100">
                <a
                  href={`https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent('Halo Mie Jebew! Saya mau tanya rute / pesan makanan...')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[48px] bg-whatsapp hover:bg-emerald-600 active:bg-emerald-700 text-white font-black text-xs sm:text-sm p-3 border-2 border-black rounded-xl shadow-brutal-xs active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>WHATSAPP KASIR ({whatsappDisplay})</span>
                </a>
              </div>
            </div>
          </ScrollReveal>

          {/* Right Column: Google Maps Showcase & Preview (7 Cols) */}
          <ScrollReveal animation="fade-up" delay={200} duration={700} className="lg:col-span-7">
            <div className="bg-white border-3 border-black rounded-3xl p-4 sm:p-6 shadow-brutal space-y-4">
              
              {/* Map Header with View Mode Switcher */}
              <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b-2 border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-jebew-yellow border-2 border-black flex items-center justify-center font-black text-sm shadow-brutal-xs">
                    🗺️
                  </div>
                  <div>
                    <h4 className="font-black text-sm sm:text-base text-black leading-tight">
                      PETA LOKASI GOOGLE MAPS
                    </h4>
                    <span className="text-[11px] font-bold text-gray-600">
                      Titik Lokasi: SMK Infokom Kota Bogor
                    </span>
                  </div>
                </div>

                {/* Mode Selector Toggle */}
                <div className="flex items-center gap-1 bg-cream border-2 border-black p-1 rounded-xl shadow-brutal-xs">
                  <button
                    type="button"
                    onClick={() => setMapViewMode('embed')}
                    className={`px-2.5 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
                      mapViewMode === 'embed'
                        ? 'bg-jebew-red text-white shadow-brutal-xs'
                        : 'text-gray-700 hover:text-black'
                    }`}
                  >
                    Peta Interaktif
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapViewMode('image')}
                    className={`px-2.5 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
                      mapViewMode === 'image'
                        ? 'bg-jebew-red text-white shadow-brutal-xs'
                        : 'text-gray-700 hover:text-black'
                    }`}
                  >
                    Foto Peta
                  </button>
                </div>
              </div>

              {/* Map Display Frame */}
              <div className="relative w-full h-[320px] sm:h-[400px] rounded-2xl border-3 border-black overflow-hidden shadow-brutal-sm bg-gray-100">
                {mapViewMode === 'embed' ? (
                  <iframe
                    src={embedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Google Maps SMK Infokom Kota Bogor"
                    className="w-full h-full"
                  />
                ) : (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block w-full h-full relative cursor-pointer"
                  >
                    <img
                      src={previewImage}
                      alt="Gambar Google Maps SMK Infokom Kota Bogor"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Location Overlay Pin Badge */}
                    <div className="absolute top-4 left-4 bg-white/95 border-2 border-black rounded-xl p-2.5 shadow-brutal-sm backdrop-blur-xs max-w-xs space-y-0.5">
                      <div className="flex items-center gap-1.5 font-black text-xs text-black">
                        <MapPin className="w-3.5 h-3.5 text-jebew-red fill-jebew-red" />
                        <span>SMK Infokom Kota Bogor</span>
                      </div>
                      <p className="text-[10px] font-semibold text-gray-700">
                        Jl. Letjen Ibrahim Adjie No.178, Sindangbarang
                      </p>
                    </div>

                    {/* Floating Click Callout */}
                    <div className="absolute bottom-4 right-4 bg-jebew-yellow border-2 border-black rounded-xl px-3 py-1.5 font-black text-xs text-black shadow-brutal-xs group-hover:bg-yellow-400 transition-colors flex items-center gap-1.5">
                      <span>Buka di Aplikasi Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </a>
                )}
              </div>

              {/* Quick Navigation Footer */}
              <div className="bg-cream-100 border-2 border-black rounded-2xl p-3.5 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-500 text-white flex items-center justify-center text-xs font-black">
                    ✓
                  </div>
                  <span className="text-xs font-bold text-gray-800">
                    Bisa diakses langsung lewat Google Maps, GoJek & Grab
                  </span>
                </div>

                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-100 font-black text-xs py-1.5 px-3 border-2 border-black rounded-lg shadow-brutal-xs cursor-pointer active:translate-x-0.5 active:translate-y-0.5 transition-all text-black"
                >
                  <span>Petunjuk Arah Rute</span>
                  <ExternalLink className="w-3.5 h-3.5 text-black" />
                </a>
              </div>

            </div>
          </ScrollReveal>

        </div>

      </div>
    </section>
  );
};

export default LocationSection;
