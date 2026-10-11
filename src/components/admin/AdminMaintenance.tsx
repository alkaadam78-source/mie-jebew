import React, { useState, useEffect } from 'react';
import {
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  RefreshCwIcon,
  FlameIcon,
  SaveIcon,
  XIcon,
} from '../ui/Icons';

interface MaintenanceConfig {
  isEnabled: boolean;
  mode: 'full' | 'read_only';
  title: string;
  message: string;
  updatedBy: string;
  updatedAt: string;
}

export const AdminMaintenance: React.FC = () => {
  const [config, setConfig] = useState<MaintenanceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Form edit fields
  const [editMode, setEditMode] = useState<'full' | 'read_only'>('full');
  const [editTitle, setEditTitle] = useState('');
  const [editMessage, setEditMessage] = useState('');

  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const token = localStorage.getItem('token') || '';

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/system/maintenance', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const conf: MaintenanceConfig = data.config;
        setConfig(conf);
        setEditMode(conf.mode);
        setEditTitle(conf.title);
        setEditMessage(conf.message);
      }
    } catch (err) {
      console.error('Failed to load maintenance status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleToggleClick = (action: 'enable' | 'disable') => {
    if (action === 'enable') {
      // Wajib konfirmasi sebelum mengaktifkan
      setShowConfirmModal(true);
    } else {
      // Nonaktifkan langsung
      executeToggle(false);
    }
  };

  const executeToggle = async (enable: boolean) => {
    try {
      setUpdating(true);
      const res = await fetch('/api/system/maintenance/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isEnabled: enable,
          mode: editMode,
          title: editTitle.trim() || undefined,
          message: editMessage.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setShowConfirmModal(false);
        setFeedback({
          text: data.message,
          type: 'success',
        });
      } else {
        const err = await res.json();
        setFeedback({ text: err.error || 'Gagal mengubah status pemeliharaan.', type: 'error' });
      }
    } catch {
      setFeedback({ text: 'Terjadi kesalahan sistem.', type: 'error' });
    } finally {
      setUpdating(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleSaveTextChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    try {
      setUpdating(true);
      const res = await fetch('/api/system/maintenance/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isEnabled: config.isEnabled,
          mode: editMode,
          title: editTitle.trim(),
          message: editMessage.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setFeedback({
          text: 'Pengaturan pesan dan mode pemeliharaan berhasil diperbarui!',
          type: 'success',
        });
      }
    } catch {
      setFeedback({ text: 'Gagal menyimpan perubahan.', type: 'error' });
    } finally {
      setUpdating(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 border-4 border-black font-black uppercase text-sm shadow-[4px_4px_0_0_#000] flex items-center justify-between ${
            feedback.type === 'success' ? 'bg-emerald-400 text-black' : 'bg-brand-red text-white'
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-80">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 sm:p-6 border-4 border-black shadow-[6px_6px_0_0_#000]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-brand-red border-2 border-black flex items-center justify-center font-black text-white">
              <FlameIcon className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
              EMERGENCY MAINTENANCE MODE
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-bold text-neutral-600">
            Sistem darurat untuk mengontrol akses pengunjung ke website dengan satu tombol dari panel admin tanpa harus mengubah kode.
          </p>
        </div>

        <button
          onClick={fetchStatus}
          disabled={loading}
          className="px-4 py-2 bg-brand-yellow hover:bg-yellow-400 border-3 border-black font-black uppercase text-xs shadow-[3px_3px_0_0_#000] flex items-center gap-2 self-start md:self-auto active:scale-95"
        >
          <RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Main Status Display Card */}
      {config && (
        <div
          className={`border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0_0_#000] transition-all ${
            config.isEnabled ? 'bg-amber-100' : 'bg-emerald-50'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-full border-2 border-black flex items-center justify-center ${
                    config.isEnabled ? 'bg-brand-red animate-ping' : 'bg-emerald-500'
                  }`}
                />
                <span className="text-xs font-black uppercase tracking-widest text-neutral-600">
                  STATUS WEBSITE SAAT INI:
                </span>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className={`text-2xl sm:text-4xl font-black uppercase px-4 py-1.5 border-4 border-black shadow-[4px_4px_0_0_#000] ${
                    config.isEnabled
                      ? 'bg-brand-red text-white'
                      : 'bg-emerald-400 text-black'
                  }`}
                >
                  {config.isEnabled ? '⚠️ MAINTENANCE AKTIF' : '🟢 WEBSITE ONLINE'}
                </span>

                {config.isEnabled && (
                  <span className="text-xs sm:text-sm font-black uppercase px-3 py-1 bg-black text-white border-2 border-black">
                    Mode: {config.mode === 'full' ? 'FULL MAINTENANCE (DITUTUP TOTAL)' : 'READ-ONLY (KATALOG SAJA)'}
                  </span>
                )}
              </div>

              {/* Status Timestamps & Admin Audit */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-neutral-700 pt-2 border-t-2 border-black/20">
                <div className="flex items-center gap-1.5">
                  <ClockIcon className="w-4 h-4 text-neutral-600" />
                  <span>
                    Terakhir Diubah:{' '}
                    <strong>
                      {new Date(config.updatedAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>
                    Oleh Admin: <strong className="underline uppercase">{config.updatedBy}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Tombol Utama Toggle */}
            <div className="self-start md:self-center">
              {config.isEnabled ? (
                <button
                  onClick={() => handleToggleClick('disable')}
                  disabled={updating}
                  className="px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm uppercase border-4 border-black shadow-[4px_4px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-2"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>{updating ? 'Memproses...' : 'AKTIFKAN KEMBALI WEBSITE (GO ONLINE)'}</span>
                </button>
              ) : (
                <button
                  onClick={() => handleToggleClick('enable')}
                  disabled={updating}
                  className="px-6 py-4 bg-brand-red hover:bg-red-700 text-white font-black text-sm uppercase border-4 border-black shadow-[4px_4px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-2 animate-pulse"
                >
                  <AlertCircleIcon className="w-5 h-5" />
                  <span>{updating ? 'Memproses...' : 'AKTIFKAN EMERGENCY MAINTENANCE'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Configuration & Options Form */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] space-y-6">
        <div className="pb-3 border-b-3 border-black flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black uppercase text-neutral-900">
              PENGATURAN MODE & PESAN PEMELIHARAAN
            </h2>
            <p className="text-xs font-bold text-neutral-500">
              Sesuaikan pesan yang ditampilkan kepada pelanggan saat pemeliharaan darurat berlangsung.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveTextChanges} className="space-y-5">
          {/* Radio Pilihan Mode */}
          <div>
            <label className="text-xs font-black uppercase text-neutral-700 block mb-2">
              PILIH TIPE PEMELIHARAAN:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label
                className={`p-4 border-3 border-black cursor-pointer transition-all flex items-start gap-3 ${
                  editMode === 'full' ? 'bg-amber-100 ring-2 ring-black shadow-[3px_3px_0_0_#000]' : 'bg-neutral-50 hover:bg-neutral-100'
                }`}
              >
                <input
                  type="radio"
                  name="maintenanceMode"
                  value="full"
                  checked={editMode === 'full'}
                  onChange={() => setEditMode('full')}
                  className="mt-1"
                />
                <div>
                  <span className="font-black text-sm uppercase block text-brand-red">
                    🔴 FULL MAINTENANCE (DITUTUP TOTAL)
                  </span>
                  <p className="text-xs font-bold text-neutral-600 mt-1">
                    Seluruh website publik ditutup dan menampilkan Halaman Pemeliharaan sementara. Pengguna tidak bisa browsing atau bertransaksi sama sekali.
                  </p>
                </div>
              </label>

              <label
                className={`p-4 border-3 border-black cursor-pointer transition-all flex items-start gap-3 ${
                  editMode === 'read_only' ? 'bg-amber-100 ring-2 ring-black shadow-[3px_3px_0_0_#000]' : 'bg-neutral-50 hover:bg-neutral-100'
                }`}
              >
                <input
                  type="radio"
                  name="maintenanceMode"
                  value="read_only"
                  checked={editMode === 'read_only'}
                  onChange={() => setEditMode('read_only')}
                  className="mt-1"
                />
                <div>
                  <span className="font-black text-sm uppercase block text-amber-800">
                    🟡 READ-ONLY MODE (KATALOG SAJA)
                  </span>
                  <p className="text-xs font-bold text-neutral-600 mt-1">
                    Pengguna tetap dapat melihat katalog menu & botol sambal, tetapi tombol Checkout, Pembayaran, Spin Wheel, dan Tukar Koin dinonaktifkan.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Input Judul */}
          <div>
            <label className="text-xs font-black uppercase text-neutral-700 block mb-1">
              Judul Pesan Pemeliharaan (Tampil di Halaman Publik):
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Contoh: Website Sedang Dalam Pemeliharaan"
              className="w-full px-3 py-2 border-2 border-black font-bold text-xs focus:bg-amber-50"
            />
          </div>

          {/* Input Deskripsi Pesan */}
          <div>
            <label className="text-xs font-black uppercase text-neutral-700 block mb-1">
              Pesan / Keterangan Pemeliharaan:
            </label>
            <textarea
              rows={3}
              value={editMessage}
              onChange={(e) => setEditMessage(e.target.value)}
              placeholder="Contoh: Kami sedang melakukan perbaikan sementara. Silakan kembali beberapa saat lagi!"
              className="w-full px-3 py-2 border-2 border-black font-bold text-xs focus:bg-amber-50"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={updating}
              className="px-5 py-2.5 bg-black text-white font-black uppercase text-xs border-2 border-black shadow-[3px_3px_0_0_#000] hover:bg-neutral-800 active:scale-95 flex items-center gap-1.5"
            >
              <SaveIcon className="w-4 h-4" />
              <span>{updating ? 'Menyimpan...' : 'Simpan Perubahan Teks'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Safety Policy & Admin Privileges Info */}
      <div className="p-4 bg-neutral-100 border-3 border-black text-xs font-bold text-neutral-700 space-y-2">
        <div className="flex items-center gap-2 font-black uppercase text-neutral-900">
          <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
          <span>Keamanan & Hak Akses Administrator:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-neutral-600">
          <li>Admin dan Super Admin yang terautentikasi <strong>selalu dapat mengakses Dashboard Admin</strong> (`/admin`) dan seluruh rute manajemen tanpa terpengaruh maintenance.</li>
          <li>Setiap aktivasi dan penonaktifan maintenance secara otomatis dicatat ke dalam <strong>Audit Activity Logs</strong> (termasuk nama admin, timestamp, dan mode).</li>
          <li>Pemeriksaan pemeliharaan diperiksa secara ketat di <strong>Backend Server API</strong>, sehingga request checkout atau script bypass dari luar akan tetap ditolak.</li>
        </ul>
      </div>

      {/* MODAL KONFIRMASI AKTIFKAN MAINTENANCE (Wajib sesuai permintaan) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 w-full max-w-md shadow-[8px_8px_0_0_#e11d48] space-y-4 relative animate-fade-in">
            <div className="flex items-center gap-3 text-brand-red">
              <AlertCircleIcon className="w-8 h-8 flex-shrink-0 animate-bounce" />
              <div>
                <h3 className="font-black text-lg uppercase tracking-tight">
                  KONFIRMASI AKTIFKAN MAINTENANCE
                </h3>
                <span className="text-[10px] font-bold text-neutral-500 uppercase">
                  Peringatan Akses Pelanggan
                </span>
              </div>
            </div>

            <div className="p-3 bg-red-50 border-2 border-brand-red text-xs font-bold text-red-950 space-y-1">
              <p className="font-black text-brand-red uppercase">
                ⚠️ PERHATIAN:
              </p>
              <p>
                Pengguna/pelanggan sementara <strong>TIDAK DAPAT MENGGUNAKAN WEBSITE</strong> untuk berbelanja, checkout, spin wheel, atau klaim voucher!
              </p>
              <p className="text-[11px] text-neutral-600 pt-1 border-t border-red-200">
                Mode yang akan diterapkan: <strong>{editMode.toUpperCase()}</strong>
              </p>
            </div>

            <p className="text-xs text-neutral-600 font-bold">
              Apakah Anda yakin ingin mengaktifkan Emergency Maintenance Mode sekarang?
            </p>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => executeToggle(true)}
                disabled={updating}
                className="flex-1 py-3 bg-brand-red hover:bg-red-700 text-white font-black uppercase text-xs border-2 border-black shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 text-center"
              >
                {updating ? 'Mengaktifkan...' : 'Ya, Aktifkan Maintenance'}
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="py-3 px-4 bg-neutral-200 hover:bg-neutral-300 font-black uppercase text-xs border-2 border-black"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
