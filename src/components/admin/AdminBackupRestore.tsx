import React, { useState, useEffect } from 'react';
import {
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Package,
  SaveIcon,
  X,
} from '../ui/Icons';

export interface BackupItem {
  id: string;
  filename: string;
  backup_type: 'auto_daily' | 'manual' | 'pre_restore_safety';
  size_bytes: number;
  tables_count: number;
  records_count: number;
  status: 'success' | 'failed';
  checksum: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

export const AdminBackupRestore: React.FC = () => {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [backupNotes, setBackupNotes] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal State
  const [restoreModal, setRestoreModal] = useState<{ isOpen: boolean; backup: BackupItem | null; processing: boolean }>({
    isOpen: false,
    backup: null,
    processing: false,
  });

  const [testResultModal, setTestResultModal] = useState<{
    isOpen: boolean;
    data: any | null;
    loading: boolean;
  }>({
    isOpen: false,
    data: null,
    loading: false,
  });

  const token = localStorage.getItem('token') || '';

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/system/backup/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups || []);
      }
    } catch (err: any) {
      setFeedback({ text: 'Gagal memuat daftar backup: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    try {
      setCreating(true);
      setFeedback(null);
      const res = await fetch('/api/system/backup/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: backupNotes.trim() || undefined }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ text: data.message, type: 'success' });
        setBackupNotes('');
        fetchBackups();
      } else {
        setFeedback({ text: data.error || 'Gagal membuat cadangan.', type: 'error' });
      }
    } catch (err: any) {
      setFeedback({ text: 'Kesalahan jaringan: ' + err.message, type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleTestRestore = async (backup: BackupItem) => {
    setTestResultModal({ isOpen: true, data: null, loading: true });
    try {
      const res = await fetch(`/api/system/backup/test-restore/${backup.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResultModal({ isOpen: true, data: data.result, loading: false });
      } else {
        setTestResultModal({
          isOpen: true,
          data: { valid: false, message: data.error || 'Uji pemulihan gagal diverifikasi.' },
          loading: false,
        });
      }
    } catch (err: any) {
      setTestResultModal({
        isOpen: true,
        data: { valid: false, message: 'Gagal terhubung ke server: ' + err.message },
        loading: false,
      });
    }
  };

  const executeRestore = async () => {
    if (!restoreModal.backup) return;

    try {
      setRestoreModal((prev) => ({ ...prev, processing: true }));
      const res = await fetch(`/api/system/backup/restore/${restoreModal.backup.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ text: data.message, type: 'success' });
        setRestoreModal({ isOpen: false, backup: null, processing: false });
        fetchBackups();
      } else {
        setFeedback({ text: data.error || 'Gagal memulihkan database.', type: 'error' });
        setRestoreModal((prev) => ({ ...prev, processing: false }));
      }
    } catch (err: any) {
      setFeedback({ text: 'Kesalahan saat memulihkan: ' + err.message, type: 'error' });
      setRestoreModal((prev) => ({ ...prev, processing: false }));
    }
  };

  const downloadBackup = (backupId: string, filename: string) => {
    fetch(`/api/system/backup/download/${backupId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => alert('Gagal mengunduh: ' + err.message));
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-brand-yellow border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-block px-2.5 py-0.5 bg-black text-white text-[10px] font-black uppercase tracking-wider mb-1">
              AUTOMATIC DATABASE & ASSET BACKUP
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
              CADANGAN & PEMULIHAN SISTEM
            </h1>
            <p className="text-xs font-bold text-neutral-800 mt-1 max-w-2xl leading-relaxed">
              Seluruh database, produk, pesanan, dan saldo koin dicadangkan secara otomatis setiap hari. Anda dapat membuat arsip manual kapan saja dan memulihkan (*restore*) ke kondisi sebelumnya jika terjadi kesalahan data.
            </p>
          </div>

          <button
            onClick={fetchBackups}
            className="px-4 py-2 bg-white hover:bg-neutral-100 border-2 border-black font-black uppercase text-xs flex items-center gap-2 shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 border-3 border-black text-xs font-black flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-100 text-emerald-950 border-emerald-900 shadow-[4px_4px_0_0_#059669]'
              : 'bg-red-100 text-red-950 border-red-900 shadow-[4px_4px_0_0_#e11d48]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-brand-red flex-shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Manual Backup Trigger Card */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] space-y-4">
        <div className="flex items-center gap-2 border-b-2 border-black pb-3">
          <SaveIcon className="w-5 h-5 text-brand-red" />
          <h2 className="font-black text-sm uppercase tracking-wider text-black">
            Buat Cadangan Manual Baru
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            value={backupNotes}
            onChange={(e) => setBackupNotes(e.target.value)}
            placeholder="Catatan cadangan (opsional, contoh: Sebelum pembaruan harga besar)"
            className="flex-1 px-4 py-2.5 border-2 border-black font-bold text-xs focus:bg-amber-50"
          />

          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white font-black uppercase text-xs border-2 border-black shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${creating ? 'animate-bounce' : ''}`} />
            <span>{creating ? 'Mencadangkan...' : 'Cadangkan Database Sekarang'}</span>
          </button>
        </div>

        <div className="text-[11px] font-bold text-neutral-500 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-neutral-400" />
          <span>
            Pencadangan harian otomatis berjalan setiap 24 jam. Sistem menyimpan hingga 15 versi cadangan terbaru dengan verifikasi integritas SHA-256.
          </span>
        </div>
      </div>

      {/* Backup Versions List */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] space-y-4">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-neutral-800" />
            <h2 className="font-black text-sm uppercase tracking-wider text-black">
              Daftar Versi Cadangan Tersimpan ({backups.length}/15)
            </h2>
          </div>
          <span className="text-xs font-bold text-neutral-500">
            Retensi Otomatis Aktif
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-neutral-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-red mb-2" />
            Memuat arsip cadangan...
          </div>
        ) : backups.length === 0 ? (
          <div className="p-8 text-center text-xs font-bold text-neutral-500 bg-neutral-50 border-2 border-neutral-300">
            Belum ada arsip cadangan tersimpan. Klik tombol di atas untuk membuat cadangan pertama.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-3 border-black bg-neutral-100 uppercase font-black text-neutral-700">
                  <th className="p-3">Waktu (WIB)</th>
                  <th className="p-3">Tipe</th>
                  <th className="p-3">Nama Berkas</th>
                  <th className="p-3">Ukuran / Data</th>
                  <th className="p-3">Catatan</th>
                  <th className="p-3 text-right">Aksi & Pemulihan</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-neutral-200">
                {backups.map((item) => {
                  let typeBadge = 'bg-blue-100 text-blue-900 border-blue-400';
                  if (item.backup_type === 'auto_daily') typeBadge = 'bg-emerald-100 text-emerald-900 border-emerald-500';
                  if (item.backup_type === 'pre_restore_safety') typeBadge = 'bg-amber-100 text-amber-900 border-amber-500';

                  return (
                    <tr key={item.id} className="hover:bg-amber-50/50 transition-colors">
                      <td className="p-3 font-mono font-bold whitespace-nowrap">
                        {new Date(item.created_at).toLocaleString('id-ID', {
                          timeZone: 'Asia/Jakarta',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase border ${typeBadge}`}>
                          {item.backup_type.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="p-3 font-mono text-[11px] text-neutral-700">
                        <div className="font-bold text-neutral-900">{item.filename}</div>
                        {item.checksum && (
                          <div className="text-[9px] text-neutral-400 font-mono truncate max-w-xs" title={item.checksum}>
                            SHA: {item.checksum.substring(0, 16)}...
                          </div>
                        )}
                      </td>

                      <td className="p-3 whitespace-nowrap font-bold">
                        <div>{(item.size_bytes / 1024).toFixed(1)} KB</div>
                        <div className="text-[10px] text-neutral-500">
                          {item.tables_count} tabel • {item.records_count} data
                        </div>
                      </td>

                      <td className="p-3 text-neutral-600 font-medium text-[11px] max-w-xs truncate">
                        {item.notes || '-'}
                      </td>

                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleTestRestore(item)}
                          className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 border-2 border-black font-black uppercase text-[10px]"
                          title="Uji integritas berkas tanpa mengubah database produksi"
                        >
                          Uji Restore
                        </button>

                        <button
                          onClick={() => downloadBackup(item.id, item.filename)}
                          className="px-2.5 py-1 bg-brand-yellow hover:bg-yellow-400 border-2 border-black font-black uppercase text-[10px]"
                          title="Unduh berkas JSON cadangan"
                        >
                          Unduh
                        </button>

                        <button
                          onClick={() => setRestoreModal({ isOpen: true, backup: item, processing: false })}
                          className="px-2.5 py-1 bg-brand-red text-white hover:bg-red-700 border-2 border-black font-black uppercase text-[10px] shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5"
                          title="Pulihkan database ke versi ini"
                        >
                          Pulihkan
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL KONFIRMASI PEMULIHAN (RESTORE DIALOG) */}
      {restoreModal.isOpen && restoreModal.backup && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 w-full max-w-lg shadow-[8px_8px_0_0_#e11d48] space-y-4 animate-fade-in">
            <div className="flex items-center gap-3 text-brand-red">
              <AlertCircle className="w-8 h-8 flex-shrink-0 animate-bounce" />
              <div>
                <h3 className="font-black text-lg uppercase tracking-tight">
                  KONFIRMASI PEMULIHAN DATABASE
                </h3>
                <span className="text-[10px] font-bold text-neutral-500 uppercase">
                  Tindakan Kritis: Penimpaan Data
                </span>
              </div>
            </div>

            <div className="p-4 bg-red-50 border-3 border-brand-red text-xs font-bold text-red-950 space-y-2">
              <p className="font-black text-brand-red uppercase">
                ⚠️ PERINGATAN PEMULIHAN SISTEM:
              </p>
              <p>
                Anda akan memulihkan database ke versi cadangan <strong>"{restoreModal.backup.filename}"</strong> ({restoreModal.backup.records_count} data di {restoreModal.backup.tables_count} tabel).
              </p>
              <p className="text-[11px] text-neutral-700">
                Sistem akan secara otomatis membuat snapshot pengaman darurat (*Pre-Restore Safety Snapshot*) sebelum menimpa data, sehingga Anda dapat kembali jika pemulihan salah.
              </p>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={executeRestore}
                disabled={restoreModal.processing}
                className="flex-1 py-3 bg-brand-red hover:bg-red-700 text-white font-black uppercase text-xs border-2 border-black shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 text-center disabled:opacity-50"
              >
                {restoreModal.processing ? 'Memulihkan Data...' : 'Ya, Pulihkan Database Sekarang'}
              </button>
              <button
                onClick={() => setRestoreModal({ isOpen: false, backup: null, processing: false })}
                disabled={restoreModal.processing}
                className="py-3 px-4 bg-neutral-200 hover:bg-neutral-300 font-black uppercase text-xs border-2 border-black"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HASIL UJI PEMULIHAN (TEST RESTORE DRY RUN RESULT) */}
      {testResultModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 w-full max-w-md shadow-[6px_6px_0_0_#000] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <h3 className="font-black text-base uppercase text-black">
                Hasil Uji Pemulihan (Dry-Run)
              </h3>
              <button
                onClick={() => setTestResultModal({ isOpen: false, data: null, loading: false })}
                className="p-1 hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {testResultModal.loading ? (
              <div className="p-6 text-center text-xs font-bold text-neutral-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-red mb-2" />
                Memverifikasi berkas cadangan dan checksum SHA-256...
              </div>
            ) : testResultModal.data ? (
              <div className="space-y-3 text-xs">
                <div
                  className={`p-3 border-2 border-black font-bold ${
                    testResultModal.data.valid ? 'bg-emerald-100 text-emerald-950' : 'bg-red-100 text-red-950'
                  }`}
                >
                  {testResultModal.data.message}
                </div>

                {testResultModal.data.valid && (
                  <div className="p-3 bg-neutral-50 border-2 border-black space-y-1.5 font-bold">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Total Tabel:</span>
                      <span>{testResultModal.data.tablesCount} Tabel</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Total Baris Data:</span>
                      <span>{testResultModal.data.totalRecords} Baris</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Ukuran Arsip:</span>
                      <span>{testResultModal.data.fileSizeKB} KB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Status Integritas:</span>
                      <span className="text-emerald-700">100% Lolos Uji Validasi</span>
                    </div>
                  </div>
                )}

                <div className="pt-2 text-right">
                  <button
                    onClick={() => setTestResultModal({ isOpen: false, data: null, loading: false })}
                    className="px-4 py-2 bg-black text-white font-black uppercase text-xs border-2 border-black"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
