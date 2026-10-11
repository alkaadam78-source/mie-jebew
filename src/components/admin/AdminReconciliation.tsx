import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  X,
} from '../ui/Icons';

export interface ReconciliationAnomalyItem {
  id: string;
  anomaly_type: 'paid_order_pending' | 'order_reward_missing' | 'voucher_multiple_use' | 'coin_balance_mismatch' | 'stock_mismatch';
  reference_id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  data_payload?: string;
  status: 'unresolved' | 'resolved' | 'ignored';
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface ReconciliationSummaryData {
  totalScannedOrders: number;
  totalScannedVouchers: number;
  totalScannedCustomers: number;
  totalAnomalies: number;
  unresolvedCount: number;
  resolvedCount: number;
  lastAuditedAt: string;
  anomalies: ReconciliationAnomalyItem[];
}

export const AdminReconciliation: React.FC = () => {
  const [summary, setSummary] = useState<ReconciliationSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');
  const [resolvingItem, setResolvingItem] = useState<ReconciliationAnomalyItem | null>(null);
  const [resolutionAction, setResolutionAction] = useState<string>('mark_resolved');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const token = localStorage.getItem('token') || '';

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/reconciliation/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleRunAudit = async () => {
    try {
      setAuditing(true);
      setFeedback(null);
      const res = await fetch('/api/admin/reconciliation/run', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
        setFeedback({
          type: 'success',
          message: `Audit rekonsiliasi selesai. ${data.unresolvedCount} anomali memerlukan perhatian.`,
        });
      } else {
        setFeedback({ type: 'error', message: 'Gagal menjalankan audit rekonsiliasi' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Koneksi server gagal' });
    } finally {
      setAuditing(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingItem) return;

    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/reconciliation/resolve/${resolvingItem.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: resolutionAction,
          notes: resolutionNotes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: data.message });
        setResolvingItem(null);
        setResolutionNotes('');
        fetchSummary();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Gagal menyelesaikan anomali' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Koneksi server gagal' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAnomalies = (summary?.anomalies || []).filter((item) => {
    if (activeFilter === 'unresolved') return item.status === 'unresolved';
    if (activeFilter === 'resolved') return item.status === 'resolved';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚖️</span>
            <h1 className="text-2xl font-black uppercase tracking-tight">Rekonsiliasi Transaksi</h1>
            <span className="px-2 py-0.5 bg-jebew-yellow text-black border-2 border-black text-[10px] font-black uppercase rounded shadow-brutal-xs">
              Audit Otomatis
            </span>
          </div>
          <p className="text-xs font-bold text-neutral-600 mt-1">
            Membandingkan catatan pembayaran, status pesanan, buku besar koin, dan pemakaian voucher untuk mendeteksi ketidaksesuaian data.
          </p>
        </div>

        <button
          onClick={handleRunAudit}
          disabled={auditing}
          className="px-4 py-2.5 bg-jebew-red hover:bg-red-700 text-white font-black text-xs uppercase border-2 border-black shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${auditing ? 'animate-spin' : ''}`} />
          {auditing ? 'Memeriksa Data...' : 'Audit Ulang Transaksi'}
        </button>
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

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border-3 border-black p-4 shadow-[4px_4px_0_0_#000]">
          <div className="text-[10px] font-black uppercase text-neutral-500">Total Pesanan Diperiksa</div>
          <div className="text-2xl font-black mt-1">{summary?.totalScannedOrders ?? 0}</div>
          <div className="text-[10px] font-bold text-neutral-500 mt-0.5">Transaksi pesanan masuk</div>
        </div>

        <div className="bg-white border-3 border-black p-4 shadow-[4px_4px_0_0_#000]">
          <div className="text-[10px] font-black uppercase text-neutral-500">Pelanggan & Buku Koin</div>
          <div className="text-2xl font-black mt-1">{summary?.totalScannedCustomers ?? 0}</div>
          <div className="text-[10px] font-bold text-neutral-500 mt-0.5">Saldo koin terverifikasi</div>
        </div>

        <div className="bg-amber-50 border-3 border-black p-4 shadow-[4px_4px_0_0_#000]">
          <div className="text-[10px] font-black uppercase text-amber-800">Anomali Perlu Tindakan</div>
          <div className="text-2xl font-black text-amber-900 mt-1">{summary?.unresolvedCount ?? 0}</div>
          <div className="text-[10px] font-bold text-amber-700 mt-0.5">Status belum diselesaikan</div>
        </div>

        <div className="bg-green-50 border-3 border-black p-4 shadow-[4px_4px_0_0_#000]">
          <div className="text-[10px] font-black uppercase text-green-800">Anomali Diselesaikan</div>
          <div className="text-2xl font-black text-green-900 mt-1">{summary?.resolvedCount ?? 0}</div>
          <div className="text-[10px] font-bold text-green-700 mt-0.5">Koreksi diaudit aman</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b-2 border-black pb-2">
        <button
          onClick={() => setActiveFilter('unresolved')}
          className={`px-3 py-1.5 font-black text-xs uppercase border-2 border-black transition-all cursor-pointer ${
            activeFilter === 'unresolved' ? 'bg-amber-400 shadow-[2px_2px_0_0_#000]' : 'bg-white hover:bg-neutral-100'
          }`}
        >
          Perlu Tindakan ({summary?.unresolvedCount ?? 0})
        </button>
        <button
          onClick={() => setActiveFilter('resolved')}
          className={`px-3 py-1.5 font-black text-xs uppercase border-2 border-black transition-all cursor-pointer ${
            activeFilter === 'resolved' ? 'bg-green-400 shadow-[2px_2px_0_0_#000]' : 'bg-white hover:bg-neutral-100'
          }`}
        >
          Telah Selesai ({summary?.resolvedCount ?? 0})
        </button>
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 font-black text-xs uppercase border-2 border-black transition-all cursor-pointer ${
            activeFilter === 'all' ? 'bg-black text-white shadow-[2px_2px_0_0_#000]' : 'bg-white hover:bg-neutral-100'
          }`}
        >
          Semua ({summary?.totalAnomalies ?? 0})
        </button>
      </div>

      {/* Anomalies List */}
      {loading ? (
        <div className="p-12 text-center bg-white border-3 border-black shadow-[4px_4px_0_0_#000]">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-jebew-red mb-2" />
          <p className="font-black text-xs uppercase">Memuat Catatan Rekonsiliasi...</p>
        </div>
      ) : filteredAnomalies.length === 0 ? (
        <div className="p-12 text-center bg-green-50 border-3 border-black shadow-[4px_4px_0_0_#000]">
          <ShieldCheck className="w-12 h-12 text-green-600 mx-auto mb-2" />
          <h3 className="text-base font-black uppercase text-green-900">Semua Data Sinkron & Sehat!</h3>
          <p className="text-xs font-bold text-green-700 mt-1">
            Tidak ditemukan ketidaksesuaian antara catatan pembayaran, pesanan, saldo koin, dan pemakaian voucher.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAnomalies.map((item) => {
            const isResolved = item.status === 'resolved';
            const severityColor =
              item.severity === 'critical'
                ? 'bg-red-500 text-white'
                : item.severity === 'high'
                ? 'bg-orange-500 text-white'
                : item.severity === 'medium'
                ? 'bg-amber-400 text-black'
                : 'bg-blue-400 text-black';

            return (
              <div
                key={item.id}
                className={`p-4 border-3 border-black shadow-[4px_4px_0_0_#000] ${
                  isResolved ? 'bg-neutral-50 opacity-75' : 'bg-white'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase border border-black rounded ${severityColor}`}>
                        {item.severity}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-neutral-500">#{item.reference_id}</span>
                      <span className="text-[10px] font-bold text-neutral-400">• {new Date(item.created_at).toLocaleString('id-ID')}</span>
                      {isResolved && (
                        <span className="px-2 py-0.5 bg-green-200 text-green-900 text-[9px] font-black uppercase border border-green-700 rounded">
                          SELESAI ({item.resolved_by})
                        </span>
                      )}
                    </div>
                    <h4 className="font-black text-sm text-black">{item.title}</h4>
                    <p className="text-xs font-bold text-neutral-700">{item.description}</p>
                    {item.resolution_notes && (
                      <div className="text-[11px] font-mono font-semibold text-neutral-500 bg-neutral-100 p-1.5 border border-neutral-300 rounded mt-1">
                        Catatan Penyelesaian: {item.resolution_notes}
                      </div>
                    )}
                  </div>

                  {!isResolved && (
                    <button
                      onClick={() => {
                        setResolvingItem(item);
                        setResolutionAction(
                          item.anomaly_type === 'paid_order_pending'
                            ? 'fix_order_status'
                            : item.anomaly_type === 'coin_balance_mismatch'
                            ? 'sync_coin_balance'
                            : 'mark_resolved'
                        );
                      }}
                      className="px-3.5 py-2 bg-jebew-yellow hover:bg-yellow-400 text-black font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer shrink-0"
                    >
                      Selesaikan
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resolution Modal */}
      {resolvingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white border-4 border-black p-6 shadow-[8px_8px_0_0_#000]">
            <button
              onClick={() => setResolvingItem(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-neutral-100 border border-black rounded"
            >
              <X className="w-4 h-4 text-black" />
            </button>

            <h3 className="text-lg font-black uppercase tracking-tight mb-2">Tindakan Rekonsiliasi</h3>
            <p className="text-xs font-bold text-neutral-600 mb-4">{resolvingItem.title}</p>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Aksi Perbaikan</label>
                <select
                  value={resolutionAction}
                  onChange={(e) => setResolutionAction(e.target.value)}
                  className="w-full p-2.5 bg-neutral-50 border-2 border-black font-bold text-xs"
                >
                  {resolvingItem.anomaly_type === 'paid_order_pending' && (
                    <option value="fix_order_status">Perbarui Status Pesanan Menjadi "Processing" (Diproses)</option>
                  )}
                  {resolvingItem.anomaly_type === 'coin_balance_mismatch' && (
                    <option value="sync_coin_balance">Sinkronkan Saldo Customer Sesuai Total Buku Besar</option>
                  )}
                  <option value="mark_resolved">Tandai Selesai Secara Manual</option>
                  <option value="dismiss">Abaikan Anomali Ini</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Catatan Audit / Alasan</label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Contoh: Sudah dikonfirmasi pembayaran manual ke admin WhatsApp..."
                  rows={3}
                  className="w-full p-2.5 bg-neutral-50 border-2 border-black font-bold text-xs"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setResolvingItem(null)}
                  className="flex-1 py-2.5 bg-neutral-200 font-black text-xs uppercase border-2 border-black"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-jebew-red text-white font-black text-xs uppercase border-2 border-black shadow-[3px_3px_0_0_#000] disabled:opacity-50"
                >
                  {actionLoading ? 'Menyimpan...' : 'Eksekusi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
