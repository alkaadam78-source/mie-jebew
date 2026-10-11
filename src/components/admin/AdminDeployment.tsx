import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
} from '../ui/Icons';

export interface DeploymentCheckItem {
  name: string;
  category: 'database' | 'api' | 'build' | 'resources';
  status: 'passed' | 'warning' | 'failed';
  details: string;
  latencyMs?: number;
}

export interface DeploymentHealthReport {
  score: number;
  overallStatus: 'passed' | 'warning' | 'failed';
  timestamp: string;
  checks: DeploymentCheckItem[];
  readyForProduction: boolean;
  recommendations: string[];
}

export interface DeploymentRecordItem {
  id: string;
  version: string;
  git_commit?: string;
  deploy_status: 'active' | 'staged' | 'rolled_back' | 'failed';
  notes?: string;
  database_backup_id?: string;
  deployed_by: string;
  deployed_at: string;
}

export const AdminDeployment: React.FC = () => {
  const [healthReport, setHealthReport] = useState<DeploymentHealthReport | null>(null);
  const [history, setHistory] = useState<DeploymentRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
  const [versionInput, setVersionInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rollbackConfirm, setRollbackConfirm] = useState<DeploymentRecordItem | null>(null);
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const token = localStorage.getItem('token') || '';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hRes, dRes] = await Promise.all([
        fetch('/api/admin/deployment/health-check', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/deployment/history', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (hRes.ok) {
        const hData = await hRes.json();
        setHealthReport(hData);
      }
      if (dRes.ok) {
        const dData = await dRes.json();
        setHistory(dData.history || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunHealthCheck = async () => {
    try {
      setChecking(true);
      setFeedback(null);
      const res = await fetch('/api/admin/deployment/health-check', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHealthReport(data);
        setFeedback({
          type: 'success',
          message: `Health Check Selesai. Skor Kesiapan: ${data.score}% (${data.overallStatus.toUpperCase()})`,
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menjalankan health check' });
    } finally {
      setChecking(false);
    }
  };

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionInput.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/deployment/snapshot', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: versionInput.trim(),
          notes: notesInput.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: `Snapshot deployment ${versionInput} berhasil dibuat dengan cadangan database terhubung.`,
        });
        setSnapshotModalOpen(false);
        setVersionInput('');
        setNotesInput('');
        fetchData();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Gagal membuat snapshot' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Koneksi server gagal' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteRollback = async () => {
    if (!rollbackConfirm) return;

    try {
      setRollbackLoading(true);
      const res = await fetch(`/api/admin/deployment/rollback/${rollbackConfirm.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: data.message });
        setRollbackConfirm(null);
        fetchData();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Rollback gagal' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Koneksi server gagal' });
    } finally {
      setRollbackLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            <h1 className="text-2xl font-black uppercase tracking-tight">Deployment & Rollback</h1>
            <span className="px-2 py-0.5 bg-green-400 text-black border-2 border-black text-[10px] font-black uppercase rounded shadow-brutal-xs">
              Safe Release System
            </span>
          </div>
          <p className="text-xs font-bold text-neutral-600 mt-1">
            Uji kesiapan rilis produksi, simpan snapshot versi stabil dengan auto-backup, dan sediakan pemulihan rollback darurat jika update mengalami kendala.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunHealthCheck}
            disabled={checking}
            className="px-3.5 py-2.5 bg-white hover:bg-neutral-100 text-black font-black text-xs uppercase border-2 border-black shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Menguji...' : 'Uji Kesiapan'}
          </button>
          <button
            onClick={() => setSnapshotModalOpen(true)}
            className="px-4 py-2.5 bg-jebew-red hover:bg-red-700 text-white font-black text-xs uppercase border-2 border-black shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
          >
            + Buat Snapshot Versi
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 border-3 border-black font-black text-xs flex items-center justify-between ${
            feedback.type === 'success' ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-bold underline cursor-pointer">
            Tutup
          </button>
        </div>
      )}

      {/* Readiness Gauge & Score Card */}
      {healthReport && (
        <div className="bg-white border-3 border-black p-6 shadow-[5px_5px_0_0_#000] space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-black pb-4">
            <div>
              <div className="text-[10px] font-black uppercase text-neutral-500">Skor Kesiapan Produksi (Deployment Readiness)</div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-4xl font-black">{healthReport.score}%</span>
                <span
                  className={`px-3 py-1 text-xs font-black uppercase border-2 border-black rounded ${
                    healthReport.readyForProduction ? 'bg-green-400 text-black' : 'bg-amber-400 text-black'
                  }`}
                >
                  {healthReport.readyForProduction ? '✅ Siap Rilis Produksi' : '⚠️ Perlu Peninjauan'}
                </span>
              </div>
            </div>

            <div className="text-right text-[11px] font-mono font-semibold text-neutral-500">
              Terakhir diuji: {new Date(healthReport.timestamp).toLocaleString('id-ID')}
            </div>
          </div>

          {/* Checks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {healthReport.checks.map((item, idx) => (
              <div key={idx} className="p-3 bg-neutral-50 border-2 border-black rounded space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-black">{item.name}</span>
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded ${
                      item.status === 'passed'
                        ? 'bg-green-200 text-green-900'
                        : item.status === 'warning'
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-red-200 text-red-900'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-neutral-600">{item.details}</p>
                {item.latencyMs !== undefined && (
                  <div className="text-[10px] font-mono text-neutral-400">Latensi: {item.latencyMs}ms</div>
                )}
              </div>
            ))}
          </div>

          {healthReport.recommendations.length > 0 && (
            <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded text-xs font-bold text-amber-900 space-y-1">
              <div className="font-black uppercase text-[10px]">Rekomendasi Sebelum Rilis:</div>
              {healthReport.recommendations.map((rec, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span>•</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Deployment History Table */}
      <div className="bg-white border-3 border-black p-5 shadow-[4px_4px_0_0_#000] space-y-4">
        <h3 className="font-black text-sm uppercase tracking-tight flex items-center gap-2">
          <Clock className="w-4 h-4 text-jebew-red" />
          Riwayat Rilis & Titik Pemulihan Rollback
        </h3>

        {loading ? (
          <div className="p-8 text-center text-xs font-black uppercase text-neutral-500">Memuat Riwayat...</div>
        ) : history.length === 0 ? (
          <div className="p-6 text-center text-xs font-bold text-neutral-500">Belum ada riwayat snapshot deployment.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100 border-b-2 border-black">
                <tr>
                  <th className="p-3 font-black uppercase text-neutral-700">Versi Rilis</th>
                  <th className="p-3 font-black uppercase text-neutral-700">Waktu Rilis</th>
                  <th className="p-3 font-black uppercase text-neutral-700">Status</th>
                  <th className="p-3 font-black uppercase text-neutral-700">Cadangan DB Terkait</th>
                  <th className="p-3 font-black uppercase text-neutral-700">Catatan Rilis</th>
                  <th className="p-3 font-black uppercase text-neutral-700">Operator</th>
                  <th className="p-3 font-black uppercase text-neutral-700 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {history.map((rec) => {
                  const isActive = rec.deploy_status === 'active';
                  const isRolledBack = rec.deploy_status === 'rolled_back';

                  return (
                    <tr key={rec.id} className="hover:bg-neutral-50 font-semibold">
                      <td className="p-3 font-black text-black">
                        <span className="px-2 py-0.5 bg-neutral-100 border border-black rounded font-mono text-xs">
                          {rec.version}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] font-mono text-neutral-600">
                        {new Date(rec.deployed_at).toLocaleString('id-ID')}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-black uppercase rounded ${
                            isActive
                              ? 'bg-green-500 text-white'
                              : isRolledBack
                              ? 'bg-amber-400 text-black'
                              : 'bg-neutral-200 text-black'
                          }`}
                        >
                          {rec.deploy_status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-neutral-600">
                        {rec.database_backup_id ? `#${rec.database_backup_id.slice(0, 14)}...` : '-'}
                      </td>
                      <td className="p-3 text-neutral-700 text-[11px]">{rec.notes || '-'}</td>
                      <td className="p-3 text-neutral-600 font-bold">{rec.deployed_by}</td>
                      <td className="p-3 text-right">
                        {rec.database_backup_id && !isActive && (
                          <button
                            onClick={() => setRollbackConfirm(rec)}
                            className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 font-black text-[10px] uppercase border border-red-800 rounded cursor-pointer"
                          >
                            Rollback
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Snapshot Modal */}
      {snapshotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white border-4 border-black p-6 shadow-[8px_8px_0_0_#000]">
            <button
              onClick={() => setSnapshotModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-neutral-100 border border-black rounded"
            >
              <X className="w-4 h-4 text-black" />
            </button>

            <h3 className="text-lg font-black uppercase tracking-tight mb-1">Buat Snapshot Deployment</h3>
            <p className="text-xs font-bold text-neutral-600 mb-4">
              Sistem akan otomatis mengambil cadangan database saat ini sebagai safety net pemulihan.
            </p>

            <form onSubmit={handleCreateSnapshot} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase mb-1">
                  Nomor Versi <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={versionInput}
                  onChange={(e) => setVersionInput(e.target.value)}
                  placeholder="Contoh: v1.3.0"
                  required
                  className="w-full p-2.5 bg-neutral-50 border-2 border-black font-black text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Catatan Rilis</label>
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Contoh: Penambahan sistem auto-reconcile dan mandatory user gate..."
                  rows={3}
                  className="w-full p-2.5 bg-neutral-50 border-2 border-black font-bold text-xs"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSnapshotModalOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-200 font-black text-xs uppercase border-2 border-black"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-jebew-red text-white font-black text-xs uppercase border-2 border-black shadow-[3px_3px_0_0_#000] disabled:opacity-50"
                >
                  {submitting ? 'Memproses...' : 'Simpan Snapshot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rollback Confirmation Modal */}
      {rollbackConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white border-4 border-black p-6 shadow-[10px_10px_0_0_#000] space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-black uppercase tracking-tight">Konfirmasi Rollback Darurat</h3>
            </div>

            <p className="text-xs font-bold text-neutral-700 leading-relaxed">
              Anda akan memulihkan sistem ke versi <strong>{rollbackConfirm.version}</strong> dengan cadangan database snapshot (
              <span className="font-mono">{rollbackConfirm.database_backup_id}</span>).
            </p>

            <div className="p-3 bg-red-50 border-2 border-red-300 rounded text-xs font-bold text-red-900">
              ⚠️ Sebelum rollback dieksekusi, sistem akan otomatis membuat pre-restore safety snapshot data terkini untuk mencegah data loss permanen.
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRollbackConfirm(null)}
                className="flex-1 py-2.5 bg-neutral-200 font-black text-xs uppercase border-2 border-black"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteRollback}
                disabled={rollbackLoading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase border-2 border-black shadow-[3px_3px_0_0_#000] disabled:opacity-50"
              >
                {rollbackLoading ? 'Memulihkan...' : 'Lanjutkan Rollback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
