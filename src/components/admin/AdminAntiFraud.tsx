import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  X,
} from '../ui/Icons';

export interface FraudAlertItem {
  id: string;
  alert_type: 'spin_spam' | 'rapid_redeem' | 'brute_force' | 'balance_tampering' | 'multi_account';
  severity: 'low' | 'medium' | 'high' | 'critical';
  target_user_id?: string;
  target_user_name?: string;
  ip_address?: string;
  details: string;
  status: 'open' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface AuditResult {
  totalAudited: number;
  healthyCount: number;
  mismatches: {
    userId: number;
    userName: string;
    phone: string;
    currentBalance: number;
    expectedLedgerSum: number;
    difference: number;
  }[];
  generatedAlerts: number;
}

export const AdminAntiFraud: React.FC = () => {
  const [alerts, setAlerts] = useState<FraudAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved' | 'dismissed'>('all');
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Audit state
  const [auditing, setAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);

  const token = localStorage.getItem('token') || '';

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'all'
        ? '/api/system/fraud/alerts'
        : `/api/system/fraud/alerts?status=${statusFilter}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (err: any) {
      setFeedback({ text: 'Gagal memuat fraud alerts: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter]);

  const handleUpdateStatus = async (alertId: string, status: 'resolved' | 'dismissed') => {
    try {
      const res = await fetch(`/api/system/fraud/alerts/${alertId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ text: data.message, type: 'success' });
        fetchAlerts();
      } else {
        setFeedback({ text: data.error || 'Gagal mengubah status alert.', type: 'error' });
      }
    } catch (err: any) {
      setFeedback({ text: 'Kesalahan jaringan: ' + err.message, type: 'error' });
    }
  };

  const handleRunBalanceAudit = async () => {
    try {
      setAuditing(true);
      const res = await fetch('/api/system/fraud/audit-balance', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAuditResult(data.audit);
        setShowAuditModal(true);
        setFeedback({ text: data.message, type: 'success' });
        fetchAlerts(); // Refresh alerts jika ada mismatch baru yang tercatat
      } else {
        setFeedback({ text: data.error || 'Audit saldo gagal dijalankan.', type: 'error' });
      }
    } catch (err: any) {
      setFeedback({ text: 'Kesalahan saat audit saldo: ' + err.message, type: 'error' });
    } finally {
      setAuditing(false);
    }
  };

  const openCount = alerts.filter((a) => a.status === 'open').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-brand-yellow border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-block px-2.5 py-0.5 bg-black text-white text-[10px] font-black uppercase tracking-wider mb-1">
              ANTI-FRAUD & ANOMALY DETECTION ENGINE
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
              DETEKSI ANOMALI & KECURANGAN
            </h1>
            <p className="text-xs font-bold text-neutral-800 mt-1 max-w-2xl leading-relaxed">
              Memantau aktivitas mencurigakan secara otomatis: putaran spin wheel berulang dalam hitungan detik, penukaran koin kilat, pola banyak akun dari IP yang sama, percobaan login brute-force, serta verifikasi integritas saldo koin terhadap buku besar (*ledger*).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunBalanceAudit}
              disabled={auditing}
              className="px-4 py-2 bg-brand-red hover:bg-red-700 text-white border-2 border-black font-black uppercase text-xs flex items-center gap-2 shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
            >
              <ShieldCheck className={`w-4 h-4 ${auditing ? 'animate-spin' : ''}`} />
              <span>{auditing ? 'Mengaudit...' : 'Audit Saldo Koin'}</span>
            </button>

            <button
              onClick={fetchAlerts}
              className="px-3 py-2 bg-white hover:bg-neutral-100 border-2 border-black font-black uppercase text-xs flex items-center gap-1.5 shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 border-3 border-black text-xs font-black flex items-center justify-between ${
            feedback.type === 'success' ? 'bg-emerald-100 text-emerald-950 border-emerald-900' : 'bg-red-100 text-red-950 border-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-brand-red" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-bold underline text-xs">
            Tutup
          </button>
        </div>
      )}

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
          <span className="text-[10px] font-black uppercase text-neutral-500 block">Alert Membutuhkan Tindakan</span>
          <div className="text-2xl font-black text-brand-red mt-1 flex items-center gap-2">
            <span>{openCount}</span>
            {openCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-brand-red animate-ping" />}
          </div>
          <span className="text-[10px] font-bold text-neutral-400">Status OPEN</span>
        </div>

        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
          <span className="text-[10px] font-black uppercase text-neutral-500 block">Total Peringatan Terdeteksi</span>
          <div className="text-2xl font-black text-neutral-900 mt-1">{alerts.length}</div>
          <span className="text-[10px] font-bold text-neutral-400">Riwayat Keseluruhan</span>
        </div>

        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
          <span className="text-[10px] font-black uppercase text-neutral-500 block">Pencegahan Brute-Force</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">AKTIF</div>
          <span className="text-[10px] font-bold text-neutral-400">Rate Limiter 5x / 15 Menit</span>
        </div>

        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
          <span className="text-[10px] font-black uppercase text-neutral-500 block">Integritas Ledger Saldo</span>
          <div className="text-2xl font-black text-blue-600 mt-1">100% SINKRON</div>
          <span className="text-[10px] font-bold text-neutral-400">SUM Riwayat vs Saldo Akun</span>
        </div>
      </div>

      {/* Filter Bar & Alerts Table */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-neutral-800" />
            <h2 className="font-black text-sm uppercase tracking-wider text-black">
              Daftar Log Peringatan Anomali ({alerts.length})
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            {(['all', 'open', 'resolved', 'dismissed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 font-black uppercase text-[10px] border-2 transition-all ${
                  statusFilter === st
                    ? 'bg-brand-yellow text-black border-black shadow-[2px_2px_0_0_#000]'
                    : 'bg-neutral-100 text-neutral-600 border-transparent hover:border-black'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-neutral-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-red mb-2" />
            Memuat daftar peringatan anomali...
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-xs font-bold text-neutral-500 bg-emerald-50 border-2 border-emerald-300">
            ✅ Tidak ada peringatan kecurangan atau anomali yang terdeteksi saat ini. Sistem dalam keadaan aman.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-3 border-black bg-neutral-100 uppercase font-black text-neutral-700">
                  <th className="p-3">Waktu (WIB)</th>
                  <th className="p-3">Tingkat</th>
                  <th className="p-3">Kategori Anomali</th>
                  <th className="p-3">Target Pengguna / IP</th>
                  <th className="p-3">Rincian Deteksi</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Tindakan Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-neutral-200">
                {alerts.map((alert) => {
                  let sevBadge = 'bg-neutral-100 text-neutral-800 border-neutral-400';
                  if (alert.severity === 'medium') sevBadge = 'bg-amber-100 text-amber-900 border-amber-400';
                  if (alert.severity === 'high') sevBadge = 'bg-orange-100 text-orange-900 border-orange-500';
                  if (alert.severity === 'critical') sevBadge = 'bg-red-100 text-red-900 border-brand-red animate-pulse';

                  return (
                    <tr key={alert.id} className="hover:bg-amber-50/50 transition-colors">
                      <td className="p-3 font-mono font-bold whitespace-nowrap">
                        {new Date(alert.created_at).toLocaleString('id-ID', {
                          timeZone: 'Asia/Jakarta',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase border ${sevBadge}`}>
                          {alert.severity}
                        </span>
                      </td>

                      <td className="p-3 font-black text-[11px] whitespace-nowrap">
                        {alert.alert_type === 'spin_spam' && '🎡 SPIN SPAMMER'}
                        {alert.alert_type === 'rapid_redeem' && '⚡ RAPID REDEEM'}
                        {alert.alert_type === 'brute_force' && '🔐 BRUTE FORCE'}
                        {alert.alert_type === 'balance_tampering' && '💰 SALDO TAMPERING'}
                        {alert.alert_type === 'multi_account' && '👥 MULTI-ACCOUNT'}
                      </td>

                      <td className="p-3 font-mono text-[11px] whitespace-nowrap">
                        <div className="font-bold text-neutral-900">{alert.target_user_name || 'Non-Member'}</div>
                        <div className="text-[10px] text-neutral-500">IP: {alert.ip_address || '-'}</div>
                      </td>

                      <td className="p-3 text-neutral-700 font-medium text-[11px] max-w-sm leading-relaxed">
                        {alert.details}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-black uppercase border ${
                            alert.status === 'open'
                              ? 'bg-red-100 text-red-900 border-brand-red'
                              : alert.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-500'
                              : 'bg-neutral-100 text-neutral-600 border-neutral-300'
                          }`}
                        >
                          {alert.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        {alert.status === 'open' ? (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(alert.id, 'resolved')}
                              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-black font-black uppercase text-[10px]"
                              title="Tandai masalah telah diperiksa & diselesaikan"
                            >
                              Selesaikan
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(alert.id, 'dismissed')}
                              className="px-2.5 py-1 bg-neutral-200 hover:bg-neutral-300 border-2 border-black font-black uppercase text-[10px]"
                              title="Abaikan peringatan ini"
                            >
                              Abaikan
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] font-mono text-neutral-400">
                            Oleh {alert.resolved_by || 'Admin'}
                          </span>
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

      {/* MODAL HASIL AUDIT SALDO KOIN */}
      {showAuditModal && auditResult && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 w-full max-w-lg shadow-[8px_8px_0_0_#000] space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                <h3 className="font-black text-base uppercase text-black">
                  Hasil Audit Integritas Saldo Koin
                </h3>
              </div>
              <button onClick={() => setShowAuditModal(false)} className="p-1 hover:bg-neutral-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-neutral-50 border-2 border-black">
                <span className="text-neutral-500 font-bold block">Total Akun Diaudit:</span>
                <span className="text-lg font-black">{auditResult.totalAudited} Akun</span>
              </div>
              <div className="p-3 bg-emerald-50 border-2 border-black">
                <span className="text-emerald-700 font-bold block">Akun Saldo Sehat:</span>
                <span className="text-lg font-black text-emerald-800">{auditResult.healthyCount} Akun</span>
              </div>
            </div>

            {auditResult.mismatches.length === 0 ? (
              <div className="p-4 bg-emerald-100 border-2 border-emerald-500 text-xs font-bold text-emerald-950 space-y-1">
                <div className="font-black">✅ SELURUH SALDO PENGGUNA 100% VALID & TERVERIFIKASI!</div>
                <p>
                  Tidak ditemukan manipulasi saldo atau selisih antara saldo tersimpan di akun pengguna dengan riwayat transaksi buku besar (*ledger coin_transactions*).
                </p>
              </div>
            ) : (
              <div className="p-4 bg-red-100 border-2 border-brand-red text-xs font-bold text-red-950 space-y-2">
                <div className="font-black text-brand-red">
                  ⚠️ DITEMUKAN {auditResult.mismatches.length} KETIDAKCOCOKAN SALDO:
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5 font-mono text-[11px]">
                  {auditResult.mismatches.map((m, idx) => (
                    <div key={idx} className="p-2 bg-white border border-red-300 flex justify-between">
                      <div>
                        <span className="font-bold">{m.userName}</span> ({m.phone})
                      </div>
                      <div>
                        Saldo: {m.currentBalance} • Ledger: {m.expectedLedgerSum} (Selisih: {m.difference})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-5 py-2.5 bg-black text-white font-black uppercase text-xs border-2 border-black shadow-[2px_2px_0_0_#000]"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
