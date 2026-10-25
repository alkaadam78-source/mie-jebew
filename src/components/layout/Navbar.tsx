import React, { useState } from 'react';
import { ShoppingBag, Menu, X, Flame, PhoneCall, Clock, ExternalLink } from '../ui/Icons';
import { STORE_CONFIG } from '../../config/store';
import { useStoreStatus } from '../../hooks/useStoreStatus';
import { useCustomerAuth } from '../../context/CustomerAuthContext';

const GILY_RECIPE_VIDEO_URL =
  'https://www.instagram.com/reel/Dd5dITdSxT-/?utm_source=ig_web_copy_link&cplk=MzRlODBiNWFlZA==&srtk=MzRlODBiNWFlZA==';

interface NavbarProps {
  totalCartItems: number;
  onOpenCart: () => void;
  onScrollToMenu: () => void;
  coins?: number;
  canSpinToday?: boolean;
  onOpenSpinWheel?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  totalCartItems,
  onOpenCart,
  onScrollToMenu,
  coins,
  canSpinToday,
  onOpenSpinWheel,
}) => {
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const { statusBadge } = useStoreStatus();
  const { customer, isLoggedIn, openAuthModal, logout } = useCustomerAuth();

  const handleNavClick = (anchorId: string) => {
    setIsMenuDrawerOpen(false);
    if (anchorId === '#menu') {
      onScrollToMenu();
      return;
    }
    const el = document.querySelector(anchorId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-cream-50 border-b-3 border-black transition-all">
        {/* Top micro bar with operating hours */}
        <div className="bg-jebew-yellow border-b border-black text-xs font-bold py-1 px-4 text-center flex items-center justify-between overflow-x-auto no-scrollbar whitespace-nowrap">
          <div className="flex items-center gap-1.5 mx-auto">
            <span className="inline-block w-2 h-2 rounded-full bg-red-600 animate-ping" />
            <span>{statusBadge} • Jam Buka: {STORE_CONFIG.openingHours.displayHours} • Titik: SMK Infokom Bogor</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white border-2 border-black rounded-lg p-1 shadow-brutal-sm group-hover:-rotate-2 transition-transform">
              <img
                src={STORE_CONFIG.assets.logo}
                alt="Mie Jebew Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg sm:text-2xl leading-none tracking-tight text-black flex items-center gap-1">
                MIE JEBEW
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-jebew-red fill-jebew-red inline" />
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-gray-700 tracking-wider">
                SHADOW OF SPICE
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-5 font-bold text-sm">
            <button
              onClick={onScrollToMenu}
              className="hover:text-jebew-red transition-colors py-1 cursor-pointer"
            >
              Katalog Menu
            </button>
            <a href="#promo" className="hover:text-jebew-red transition-colors py-1">
              Paket Promo 🔥
            </a>
            <a href="#tim-cravecorner" className="hover:text-jebew-red transition-colors py-1 flex items-center gap-1">
              <span>Tim Crave Corner</span>
              <span className="text-[10px] bg-yellow-300 border border-black px-1.5 py-0.2 rounded-full font-black">
                TEAM
              </span>
            </a>
            <a href="#vinas" className="hover:text-jebew-red transition-colors py-1">
              Resep Gily
            </a>
            <a href="#lokasi" className="hover:text-jebew-red transition-colors py-1">
              Lokasi & Jam
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Spin Wheel & Koin */}
            {onOpenSpinWheel && (
              <button
                onClick={onOpenSpinWheel}
                aria-label="Roda Hadiah & Saldo Koin"
                className="relative flex items-center gap-1.5 bg-jebew-yellow hover:bg-yellow-400 text-black font-black text-xs px-2.5 sm:px-3 py-2 border-2 border-black rounded-lg shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              >
                <span className="text-sm">🎡</span>
                <span className="hidden sm:inline text-gray-800">Koin:</span>
                <span className="font-black text-black">{(coins ?? 0).toLocaleString('id-ID')}</span>
                {canSpinToday && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-jebew-red opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-jebew-red"></span>
                  </span>
                )}
              </button>
            )}

            {/* Customer User Account */}
            {isLoggedIn ? (
              <div className="hidden sm:flex items-center gap-1.5 bg-white border-2 border-black px-2.5 py-1.5 rounded-lg shadow-brutal-xs text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-black text-black max-w-[90px] truncate">{customer?.name}</span>
                <button
                  onClick={logout}
                  title="Keluar Akun"
                  className="text-[10px] text-gray-400 hover:text-red-600 font-black ml-0.5 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="hidden sm:flex items-center gap-1 bg-white hover:bg-gray-100 text-black font-black text-xs px-2.5 py-2 border-2 border-black rounded-lg shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                <span>👤</span>
                <span>Masuk</span>
              </button>
            )}

            {/* Order CTA (Desktop) */}
            <button
              onClick={onScrollToMenu}
              className="hidden xl:inline-flex items-center gap-1.5 bg-jebew-red hover:bg-red-700 text-white font-extrabold text-sm px-3.5 py-2 border-2 border-black rounded-lg shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
            >
              <Flame className="w-4 h-4" />
              Pesan Sekarang
            </button>

            {/* Cart Trigger Button */}
            <button
              onClick={onOpenCart}
              aria-label="Lihat Keranjang Belanja"
              className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-white border-2 border-black rounded-lg shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5 text-black" />
              {totalCartItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-jebew-red text-white text-[11px] font-black w-5 h-5 rounded-full border-2 border-black flex items-center justify-center animate-bounce">
                  {totalCartItems > 99 ? '99+' : totalCartItems}
                </span>
              )}
            </button>

            {/* Tombol Garis 3 (Hamburger Menu) - Tampil di HP, Laptop & PC */}
            <button
              onClick={() => setIsMenuDrawerOpen(true)}
              aria-label="Buka Menu Garis 3"
              className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-cream-100 hover:bg-cream-200 border-2 border-black rounded-lg shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer group"
              title="Menu Navigasi Lengkap"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-black group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================
          SLIDE-OVER MENU DRAWER (GARIS 3 - SEMUA PERANGKAT)
          Tampil Rapih di HP, Tablet, Laptop & PC
      ======================================================== */}
      {isMenuDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => setIsMenuDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-sm sm:max-w-md bg-cream border-l-4 border-black shadow-[ -8px_0_0_0_#000 ] flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-250">
              
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 bg-jebew-yellow border-b-3 border-black flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-white border-2 border-black p-1 shadow-brutal-xs flex items-center justify-center">
                    <img
                      src={STORE_CONFIG.assets.logo}
                      alt="Mie Jebew"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-black leading-tight flex items-center gap-1">
                      MIE JEBEW
                      <Flame className="w-4 h-4 text-jebew-red fill-jebew-red inline" />
                    </h3>
                    <p className="text-[11px] font-bold text-gray-800">
                      CRAVE CORNER OFFICIAL
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsMenuDrawerOpen(false)}
                  aria-label="Tutup Menu"
                  className="w-10 h-10 rounded-xl bg-white hover:bg-gray-100 border-2 border-black flex items-center justify-center shadow-brutal-xs active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5 text-black" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-4 sm:p-5 space-y-4 flex-1">
                
                {/* 1. Account Profile / Login Status */}
                <div className="bg-white border-2 border-black rounded-2xl p-3.5 shadow-brutal-xs">
                  {isLoggedIn ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-amber-200 border-2 border-black flex items-center justify-center text-sm font-black">
                          👤
                        </div>
                        <div>
                          <div className="font-black text-xs sm:text-sm text-black">
                            {customer?.name}
                          </div>
                          <div className="text-[10px] font-bold text-gray-500">
                            WhatsApp: +{customer?.phone}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          logout();
                          setIsMenuDrawerOpen(false);
                        }}
                        className="text-xs font-black text-red-600 hover:underline px-2 py-1 rounded border border-gray-300 cursor-pointer"
                      >
                        Keluar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs">
                        <div className="font-black text-black">Belum Masuk Akun?</div>
                        <div className="text-[10px] text-gray-600 font-semibold">
                          Kumpulkan koin & tukar diskon makan!
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setIsMenuDrawerOpen(false);
                          openAuthModal();
                        }}
                        className="bg-jebew-red hover:bg-red-700 text-white font-black text-xs px-3 py-1.5 rounded-xl border border-black shadow-brutal-xs cursor-pointer"
                      >
                        Masuk / Daftar
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Lucky Spin & Koin Banner Card */}
                {onOpenSpinWheel && (
                  <button
                    onClick={() => {
                      setIsMenuDrawerOpen(false);
                      onOpenSpinWheel();
                    }}
                    className="w-full bg-jebew-yellow hover:bg-yellow-400 border-3 border-black rounded-2xl p-3.5 shadow-brutal text-left flex items-center justify-between gap-3 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-white border-2 border-black flex items-center justify-center text-xl shadow-brutal-xs group-hover:rotate-12 transition-transform">
                        🎡
                      </div>
                      <div>
                        <div className="font-black text-sm text-black flex items-center gap-1.5">
                          LUCKY SPIN WHEEL
                          {canSpinToday && (
                            <span className="text-[9px] bg-jebew-red text-white px-1.5 py-0.2 rounded-full border border-black font-black animate-pulse">
                              SPIN!
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-gray-800">
                          Saldo: <strong className="text-brand-red font-black">{(coins ?? 0).toLocaleString('id-ID')} Koin</strong>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-black bg-white border border-black px-2 py-1 rounded-lg shadow-brutal-xs">
                      Buka 🎯
                    </span>
                  </button>
                )}

                {/* 3. Navigasi Menu Lengkap & Tim Crave Corner */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-black uppercase tracking-wider text-gray-600 px-1 pt-1">
                    DAFTAR NAVIGASI
                  </div>

                  {/* Menu Catalog */}
                  <button
                    onClick={() => handleNavClick('#menu')}
                    className="w-full flex items-center justify-between bg-white hover:bg-cream-100 border-2 border-black p-3 rounded-xl font-black text-xs sm:text-sm shadow-brutal-xs cursor-pointer text-left transition-all"
                  >
                    <span className="flex items-center gap-2.5">
                      <span>🍜</span>
                      <span>Katalog Menu & Level Pedas</span>
                    </span>
                    <span className="text-[10px] bg-red-100 text-red-700 border border-black px-1.5 py-0.5 rounded font-black">
                      SERBA 10K
                    </span>
                  </button>

                  {/* Promo Hemat */}
                  <button
                    onClick={() => handleNavClick('#promo')}
                    className="w-full flex items-center justify-between bg-white hover:bg-cream-100 border-2 border-black p-3 rounded-xl font-black text-xs sm:text-sm shadow-brutal-xs cursor-pointer text-left transition-all"
                  >
                    <span className="flex items-center gap-2.5">
                      <span>🔥</span>
                      <span>Paket Promo Hemat</span>
                    </span>
                    <span className="text-gray-400 font-bold">›</span>
                  </button>

                  

                  {/* TIM CRAVE CORNER (Special Highlight) */}
                  <button
                    onClick={() => handleNavClick('#tim-cravecorner')}
                    className="w-full flex items-center justify-between bg-amber-50 hover:bg-amber-100 border-2 border-black p-3 rounded-xl font-black text-xs sm:text-sm shadow-brutal-xs cursor-pointer text-left transition-all group"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-base group-hover:scale-125 transition-transform">👥</span>
                      <span className="text-black">Tim Crave Corner (Dapur Jebew)</span>
                    </span>
                    <span className="text-[10px] bg-jebew-yellow border border-black px-2 py-0.5 rounded-full font-black text-black">
                      KAMI
                    </span>
                  </button>

                  {/* RESEP GILY */}
                  <button
                    onClick={() => handleNavClick('#vinas')}
                    className="w-full flex items-center justify-between bg-white hover:bg-cream-100 border-2 border-black p-3 rounded-xl font-black text-xs sm:text-sm shadow-brutal-xs cursor-pointer text-left transition-all"
                  >
                    <span className="flex items-center gap-2.5">
                      <span>👩‍🍳</span>
                      <span>Resep Rahasia Gily</span>
                    </span>
                    <span className="text-gray-400 font-bold">›</span>
                  </button>

                  {/* Direct Instagram Video Reel: Resep Gily */}
                  <a
                    href={GILY_RECIPE_VIDEO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between bg-pink-50 hover:bg-pink-100 border-2 border-pink-700 p-3 rounded-xl font-black text-xs sm:text-sm shadow-brutal-xs cursor-pointer text-left transition-all text-pink-900"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-base">🎬</span>
                      <span>Tonton Video Resep Gily (Reels)</span>
                    </span>
                    <ExternalLink className="w-4 h-4 text-pink-700 shrink-0" />
                  </a>

                  {/* Testimoni */}
                  <button
                    onClick={() => handleNavClick('#testimoni')}
                    className="w-full flex items-center justify-between bg-white hover:bg-cream-100 border-2 border-black p-3 rounded-xl font-black text-xs sm:text-sm shadow-brutal-xs cursor-pointer text-left transition-all"
                  >
                    <span className="flex items-center gap-2.5">
                      <span>⭐</span>
                      <span>Kata Mereka (Testimoni)</span>
                    </span>
                    <span className="text-gray-400 font-bold">›</span>
                  </button>

                  {/* Lokasi Toko */}
                  <button
                    onClick={() => handleNavClick('#lokasi')}
                    className="w-full flex items-center justify-between bg-white hover:bg-cream-100 border-2 border-black p-3 rounded-xl font-black text-xs sm:text-sm shadow-brutal-xs cursor-pointer text-left transition-all"
                  >
                    <span className="flex items-center gap-2.5">
                      <span>📍</span>
                      <span>Titik Lokasi (SMK Infokom Bogor)</span>
                    </span>
                    <span className="text-gray-400 font-bold">›</span>
                  </button>
                </div>

                {/* 4. Social & Contact Links */}
                <div className="bg-white border-2 border-black rounded-2xl p-3.5 space-y-2 text-xs font-bold text-gray-700 shadow-brutal-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-black" />
                      <span>Jam Buka:</span>
                    </span>
                    <span className="font-black text-black">{STORE_CONFIG.openingHours.displayHours}</span>
                  </div>

                  <a
                    href={STORE_CONFIG.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-black hover:text-jebew-red pt-1 border-t border-gray-200"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>📸</span>
                      <span>Instagram Resmi:</span>
                    </span>
                    <span className="font-black underline">{STORE_CONFIG.instagramHandle}</span>
                  </a>

                  <a
                    href={`https://wa.me/${STORE_CONFIG.whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-black hover:text-green-700 pt-1 border-t border-gray-200"
                  >
                    <span className="flex items-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-whatsapp" />
                      <span>WhatsApp CS:</span>
                    </span>
                    <span className="font-black underline">{STORE_CONFIG.whatsappDisplay}</span>
                  </a>
                </div>

              </div>

              {/* Drawer Footer */}
              <div className="p-4 bg-cream-100 border-t-2 border-black text-center text-xs font-bold text-gray-600">
                <p>🍜 Mie Jebew Official • Powered by <strong className="text-black font-black">Crave Corner</strong></p>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
