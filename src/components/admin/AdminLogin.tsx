import React, { useState } from 'react';
import { apiLogin } from '../../services/api';
import { Flame, ShieldCheck, ArrowRight, AlertCircle } from '../ui/Icons';
import { AdminUser } from '../../types';

interface AdminLoginProps {
  onLoginSuccess: (user: AdminUser) => void;
  onBackToStore: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToStore }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Username dan password wajib diisi.');
      return;
    }

    try {
      setLoading(true);
      const res = await apiLogin({
        username: username.trim(),
        password: password.trim(),
      });
      onLoginSuccess(res.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login gagal. Periksa kembali username dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center items-center px-4 py-12 selection:bg-jebew-yellow selection:text-black">
      
      {/* Background brutal dot grid pattern */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#000000 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 bg-jebew-red text-white border-2 border-black px-3.5 py-1 rounded-full text-xs font-black shadow-brutal-sm uppercase">
            <Flame className="w-3.5 h-3.5 fill-white" />
            ADMINISTRATOR PORTAL
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight">
            MIE JEBEW CMS
          </h1>
          <p className="text-xs sm:text-sm font-bold text-gray-600">
            Masuk untuk mengelola menu, produk, harga, dan konten website dari jarak jauh.
          </p>
        </div>

        {/* Login Box */}
        <div className="relative">
          <div className="absolute inset-0 bg-jebew-yellow border-3 border-black rounded-3xl translate-x-2.5 translate-y-2.5" />
          
          <div className="relative bg-white border-3 border-black rounded-3xl p-6 sm:p-8 shadow-brutal-md">
            
            {errorMessage && (
              <div className="mb-5 p-3.5 bg-red-50 border-2 border-red-500 rounded-xl flex items-start gap-2.5 text-xs font-bold text-red-700">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-black uppercase text-black mb-1.5">
                  Username atau Email
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: admin"
                  className="w-full px-4 py-3 bg-cream-50 border-2 border-black rounded-xl font-bold text-sm text-black placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-jebew-yellow transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black mb-1.5">
                  Kata Sandi (Password)
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-cream-50 border-2 border-black rounded-xl font-bold text-sm text-black placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-jebew-yellow transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[48px] bg-jebew-red hover:bg-red-700 active:bg-red-800 text-white font-black text-sm sm:text-base py-3 px-4 border-2 border-black rounded-xl shadow-brutal active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span>Memverifikasi Akun...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      <span>MASUK KE DASHBOARD</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </>
                  )}
                </button>
              </div>

            </form>

            <div className="mt-6 pt-5 border-t-2 border-dashed border-gray-200 text-center">
              <button
                type="button"
                onClick={onBackToStore}
                className="text-xs font-black text-gray-700 hover:text-black hover:underline cursor-pointer"
              >
                ← Kembali ke Website Public
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
