import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, AlertCircle } from '../ui/Icons';
import { useCustomerAuth } from '../../context/CustomerAuthContext';

export const CustomerAuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, login, customer } = useCustomerAuth();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const isMandatory = !customer;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = name.trim();
    if (cleanName.length < 3) {
      setErrorMessage('Nama asli wajib diisi (minimal 3 karakter).');
      return;
    }

    const letters = (cleanName.match(/[a-zA-Z]/g) || []).length;
    if (letters < 3) {
      setErrorMessage('Nama asli harus mengandung minimal 3 huruf yang valid (contoh: Budi Santoso).');
      return;
    }

    const rawPhone = phone.trim().replace(/[^0-9]/g, '');
    let normalized = rawPhone;
    if (normalized.startsWith('0')) {
      normalized = '62' + normalized.slice(1);
    } else if (normalized.startsWith('8')) {
      normalized = '62' + normalized;
    }

    if (normalized.length < 10 || normalized.length > 15 || !normalized.startsWith('628')) {
      setErrorMessage('Nomor WhatsApp tidak valid. Masukkan nomor WhatsApp aktif berawalan 08 (contoh: 081234567890).');
      return;
    }

    setIsLoading(true);
    const result = await login(rawPhone, cleanName);
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Gagal masuk. Silakan coba beberapa saat lagi.');
    } else {
      setPhone('');
      setName('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => {
        if (!isMandatory) closeAuthModal();
      }}
    >
      <div
        className="relative w-full max-w-md bg-cream-50 border-4 border-black rounded-2xl shadow-[10px_10px_0_0_#000] p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Hanya muncul jika user sudah login sebelumnya */}
        {!isMandatory && (
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 w-9 h-9 bg-white hover:bg-gray-100 border-2 border-black rounded-lg flex items-center justify-center shadow-brutal-xs hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-jebew-yellow border-3 border-black rounded-2xl shadow-brutal-sm mb-3">
            <span className="text-3xl">🍜</span>
          </div>
          {isMandatory && (
            <div className="inline-block mb-1 px-3 py-0.5 bg-jebew-red text-white text-[11px] font-black uppercase tracking-wider border-2 border-black rounded-full shadow-brutal-xs">
              Pintu Masuk Wajib Pengunjung
            </div>
          )}
          <h2 className="text-2xl font-black text-black uppercase tracking-tight flex items-center justify-center gap-1.5">
            Selamat Datang di Mie Jebew
            <Sparkles className="w-5 h-5 text-jebew-red fill-jebew-red" />
          </h2>
          <p className="text-xs font-bold text-gray-700 mt-1 max-w-xs mx-auto">
            {isMandatory
              ? 'Wajib isi Nama Asli & Nomor WhatsApp aktif untuk membuka akses menu, memesan, dan memutar Roda Keberuntungan harian!'
              : 'Perbarui profil atau hubungkan nomor WhatsApp Anda.'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 border-2 border-red-600 rounded-xl flex items-start gap-2 text-xs font-bold text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase text-black mb-1">
              Nama Asli Lengkap <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              required
              className="w-full px-3.5 py-2.5 bg-white border-2 border-black rounded-xl font-bold text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-jebew-yellow shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-black mb-1">
              Nomor WhatsApp Asli <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-xs text-gray-600">
                🇮🇩 +62
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="81234567890"
                required
                className="w-full pl-18 pr-3.5 py-2.5 bg-white border-2 border-black rounded-xl font-bold text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-jebew-yellow shadow-inner"
              />
            </div>
            <p className="text-[10px] text-gray-500 font-semibold mt-1">
              Wajib nomor aktif untuk verifikasi pesanan, saldo koin, dan klaim kupon diskon.
            </p>
          </div>

          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3 text-xs font-bold text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 text-black">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <span>Gratis 1x putaran Roda Keberuntungan per hari</span>
            </div>
            <div className="flex items-center gap-1.5 text-black">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <span>Tukar koin dengan Voucher Diskon Rp 5.000 s/d Free Mie!</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-jebew-red hover:bg-red-700 text-white font-black text-sm uppercase tracking-wide border-2 border-black rounded-xl shadow-[4px_4px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Memverifikasi Akun...</span>
              </>
            ) : (
              <span>{isMandatory ? 'Masuk Sekarang & Buka Akses Web 🚀' : 'Simpan Profil'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
