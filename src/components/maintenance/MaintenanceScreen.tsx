import React from 'react';
import { FlameIcon, RefreshCwIcon, PhoneIcon, InstagramIcon } from '../ui/Icons';

interface MaintenanceScreenProps {
  title?: string;
  message?: string;
  updatedAt?: string;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({
  title = 'Website Sedang Dalam Pemeliharaan',
  message = 'Kami sedang melakukan perbaikan dan pemeliharaan sistem sementara. Silakan kembali beberapa saat lagi!',
  updatedAt,
}) => {
  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col justify-between font-sans relative overflow-hidden select-none">
      {/* Background Subtle Patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:20px_20px]" />

      {/* Header Bar */}
      <header className="p-4 sm:p-6 border-b-4 border-black bg-brand-yellow text-black flex items-center justify-between shadow-[0_4px_0_0_#000] relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-brand-red border-2 border-black flex items-center justify-center text-white shadow-[2px_2px_0_0_#000]">
            <FlameIcon className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <span className="font-black text-xl uppercase tracking-tight block leading-tight">
              MIE JEBEW
            </span>
            <span className="text-[10px] font-black uppercase text-brand-red tracking-wider block">
              SHADOW OF SPICE • BANDUNG
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-brand-red text-white font-black text-xs uppercase border-2 border-black animate-pulse">
            🚨 MAINTENANCE MODE
          </span>
        </div>
      </header>

      {/* Main Content Box */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="w-full max-w-xl bg-white text-neutral-900 border-4 border-black p-6 sm:p-10 shadow-[8px_8px_0_0_#e11d48] text-center space-y-6">
          {/* Badge */}
          <div className="inline-block px-4 py-1.5 bg-brand-red text-white border-3 border-black font-black uppercase text-xs tracking-wider shadow-[3px_3px_0_0_#000]">
            ⚙️ PERBAIKAN & PEMELIHARAAN SISTEM
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight leading-tight">
              {title}
            </h1>
            <div className="w-24 h-1.5 bg-brand-yellow mx-auto border-2 border-black" />
            <p className="text-sm sm:text-base font-bold text-neutral-700 leading-relaxed max-w-md mx-auto">
              {message}
            </p>
          </div>

          {/* Highlight Card */}
          <div className="p-4 bg-amber-50 border-3 border-black text-left shadow-[3px_3px_0_0_#000] space-y-2">
            <div className="flex items-center gap-2 font-black text-xs uppercase text-neutral-900">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-red animate-ping" />
              <span>Info Penting Bagi Pelanggan:</span>
            </div>
            <p className="text-xs font-bold text-neutral-600 leading-relaxed">
              Selama pemeliharaan darurat berlangsung, transaksi online, checkout pesanan, dan putaran koin dinonaktifkan sementara. Seluruh saldo koin dan voucher Anda tersimpan dengan aman di database.
            </p>
            {updatedAt && (
              <div className="text-[10px] font-mono font-bold text-neutral-500 pt-1 border-t border-neutral-300">
                Waktu Pemeliharaan: {new Date(updatedAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB
              </div>
            )}
          </div>

          {/* Buttons & Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto px-6 py-3 bg-brand-yellow hover:bg-yellow-400 text-black border-3 border-black font-black uppercase text-xs shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2"
            >
              <RefreshCwIcon className="w-4 h-4" />
              <span>Muat Ulang Halaman</span>
            </button>

            <a
              href="https://wa.me/6281234567890?text=Halo%20Admin%20Mie%20Jebew,%20saya%20mau%20order%20manual%20karena%20website%20sedang%20maintenance."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white border-3 border-black font-black uppercase text-xs shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2"
            >
              <PhoneIcon className="w-4 h-4" />
              <span>Order Darurat via WhatsApp</span>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 border-t-4 border-black bg-black text-center text-xs font-bold text-neutral-400 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-2 px-6">
        <span>&copy; {new Date().getFullYear()} Mie Jebew Official. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <a
            href="https://www.instagram.com/reel/Dd5dITdSxT-/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white flex items-center gap-1 uppercase font-black text-[11px]"
          >
            <InstagramIcon className="w-3.5 h-3.5 text-brand-red" />
            <span>Resep Gily</span>
          </a>
        </div>
      </footer>
    </div>
  );
};
