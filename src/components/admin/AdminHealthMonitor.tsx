import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  SaveIcon,
  Phone,
  Sliders,
} from '../ui/Icons';

export interface HealthData {
  timestamp: string;
  overallStatus: 'healthy' | 'degraded' | 'critical';
  system: {
    uptimeSeconds: number;
    uptimeFormatted: string;
    platform: string;
    nodeVersion: string;
    cpuCores: number;
    memory: {
      heapUsedMB: number;
      heapTotalMB: number;
      rssMB: number;
      systemTotalMB: number;
      systemFreeMB: number;
      systemUsedPercent: number;
    };
    disk: {
      totalGB: number;
      freeGB: number;
      usedGB: number;
      usedPercent: number;
      isWarning: boolean;
    };
  };
  databases: {
    sqlite: {
      status: 'connected' | 'error';
      fileSizeMB: number;
      walMode: boolean;
    };
    mysql: {
      status: 'connected' | 'offline';
      latencyMs: number;
      database: string;
    };
  };
  endpoints: {
    endpoint: string;
    status: 'ok' | 'degraded' | 'error';
    statusCode: number;
    latencyMs: number;
    message?: string;
  }[];
  errorStats: {
    totalRequests24h: number;
    errorCount4xx: number;
    errorCount5xx: number;
    errorRatePercent: number;
  };
  alertConfig: {
    enabled: boolean;
    webhookUrl?: string;
    whatsappAlertNumber?: string;
    emailAlert?: string;
    diskThresholdPercent: number;
    errorThresholdPercent: number;
    notifyOnDbFailure: boolean;
  };
}

export const AdminHealthMonitor: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form Config
  const [webhookUrl, setWebhookUrl] = useState('');
  const [whatsappAlertNumber, setWhatsappAlertNumber] = useState('');
  const [emailAlert, setEmailAlert] = useState('');
  const [diskThreshold, setDiskThreshold] = useState(90);
  const [errorThreshold, setErrorThreshold] = useState(5);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  const token = localStorage.getItem('token') || '';

  const fetchHealthMetrics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/system/health/metrics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const h: HealthData = data.health;
        setHealth(h);
        if (h.alertConfig) {
          setWebhookUrl(h.alertConfig.webhookUrl || '');
          setWhatsappAlertNumber(h.alertConfig.whatsappAlertNumber || '');
          setEmailAlert(h.alertConfig.emailAlert || '');
          setDiskThreshold(h.alertConfig.diskThresholdPercent || 90);
          setErrorThreshold(h.alertConfig.errorThresholdPercent || 5);
          setAlertsEnabled(Boolean(h.alertConfig.enabled));
        }
      }
    } catch (err: any) {
      setFeedback({ text: 'Gagal memuat metrik sistem: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthMetrics();
    const interval = setInterval(fetchHealthMetrics, 30000); // Polling otomatis setiap 30 detik
    return () => clearInterval(interval);
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingConfig(true);
      const res = await fetch('/api/system/health/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enabled: alertsEnabled,
          webhookUrl,
          whatsappAlertNumber,
          emailAlert,
          diskThresholdPercent: Number(diskThreshold),
          errorThresholdPercent: Number(errorThreshold),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ text: 'Konfigurasi kanal notifikasi peringatan berhasil disimpan!', type: 'success' });
      } else {
        setFeedback({ text: data.error || 'Gagal menyimpan konfigurasi.', type: 'error' });
      }
    } catch (err: any) {
      setFeedback({ text: 'Kesalahan jaringan: ' + err.message, type: 'error' });
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-brand-yellow border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-block px-2.5 py-0.5 bg-black text-white text-[10px] font-black uppercase tracking-wider mb-1">
              AUTOMATIC UPTIME & SYSTEM HEALTH MONITOR
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
              MONITORING KESEHATAN WEBSITE
            </h1>
            <p className="text-xs font-bold text-neutral-800 mt-1 max-w-2xl leading-relaxed">
              Memantau status ketersediaan website secara real-time, latensi database, integritas endpoint API utama, kapasitas memori & ruang disk server, serta mengirimkan notifikasi otomatis saat terjadi gangguan.
            </p>
          </div>

          <button
            onClick={fetchHealthMetrics}
            className="px-4 py-2 bg-white hover:bg-neutral-100 border-2 border-black font-black uppercase text-xs flex items-center gap-2 shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
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

      {loading && !health ? (
        <div className="bg-white border-4 border-black p-12 text-center shadow-[6px_6px_0_0_#000]">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand-red mb-3" />
          <div className="font-black text-sm uppercase">Memindai Metrik Server & Database...</div>
        </div>
      ) : health ? (
        <>
          {/* Status Bar Utama */}
          <div
            className={`border-4 border-black p-5 shadow-[6px_6px_0_0_#000] flex flex-col sm:flex-row items-center justify-between gap-4 ${
              health.overallStatus === 'healthy'
                ? 'bg-emerald-400 text-black'
                : health.overallStatus === 'degraded'
                ? 'bg-amber-300 text-black'
                : 'bg-brand-red text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full bg-black animate-ping" />
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider block">STATUS KESELURUHAN SISTEM</span>
                <span className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                  {health.overallStatus === 'healthy'
                    ? '🟢 WEBSITE NORMAL & BERJALAN OPTIMAL'
                    : health.overallStatus === 'degraded'
                    ? '🟡 PERINGATAN KINERJA MENURUN'
                    : '🔴 KRITIS: GANGGUAN SERVER TERDETEKSI'}
                </span>
              </div>
            </div>

            <div className="text-right text-xs font-mono font-bold">
              <div>Uptime: {health.system.uptimeFormatted}</div>
              <div className="text-[10px] opacity-80">
                Pembaruan: {new Date(health.timestamp).toLocaleTimeString('id-ID')} WIB
              </div>
            </div>
          </div>

          {/* Metric Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Kapasitas Ruang Disk */}
            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0_0_#000] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-neutral-500">Ruang Disk Server</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 border ${health.system.disk.isWarning ? 'bg-red-100 text-red-900 border-red-500' : 'bg-neutral-100 text-black border-black'}`}>
                  {health.system.disk.usedPercent}% TERPAKAI
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="w-full bg-neutral-200 border-2 border-black h-4 overflow-hidden">
                  <div
                    className={`h-full transition-all ${health.system.disk.isWarning ? 'bg-brand-red' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(health.system.disk.usedPercent, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-bold text-neutral-600">
                  <span>{health.system.disk.usedGB} GB Terpakai</span>
                  <span>{health.system.disk.freeGB} GB Sisa</span>
                </div>
              </div>
              <div className="text-[10px] font-mono text-neutral-400">Total: {health.system.disk.totalGB} GB Kapasitas</div>
            </div>

            {/* Card 2: Penggunaan Memori RAM */}
            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0_0_#000] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-neutral-500">Memori RAM (Node.js)</span>
                <span className="text-[10px] font-black px-1.5 py-0.5 bg-neutral-100 border border-black">
                  HEAP {health.system.memory.heapUsedMB} MB
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-lg font-black">{health.system.memory.systemUsedPercent}%</div>
                <div className="text-[11px] font-bold text-neutral-600">
                  Sistem: {(health.system.memory.systemTotalMB / 1024).toFixed(1)} GB Total RAM
                </div>
              </div>
              <div className="text-[10px] font-mono text-neutral-400">RSS Process: {health.system.memory.rssMB} MB</div>
            </div>

            {/* Card 3: Database Status */}
            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0_0_#000] space-y-3">
              <span className="text-xs font-black uppercase text-neutral-500 block">Koneksi Database</span>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5">
                  <span className="font-bold">MySQL phpMyAdmin:</span>
                  <span className={`px-1.5 py-0.5 text-[10px] font-black border ${health.databases.mysql.status === 'connected' ? 'bg-emerald-100 text-emerald-900 border-emerald-400' : 'bg-red-100 text-red-900 border-brand-red'}`}>
                    {health.databases.mysql.status === 'connected' ? `ONLINE (${health.databases.mysql.latencyMs}ms)` : 'OFFLINE'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold">SQLite Fallback:</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-400">
                    AKTIF ({health.databases.sqlite.fileSizeMB} MB)
                  </span>
                </div>
              </div>
              <div className="text-[10px] font-mono text-neutral-400">DB: {health.databases.mysql.database}</div>
            </div>

            {/* Card 4: Error Rate Monitor */}
            <div className="bg-white border-4 border-black p-5 shadow-[4px_4px_0_0_#000] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-neutral-500">Tingkat Error (24 Jam)</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 border ${health.errorStats.errorRatePercent > 5 ? 'bg-red-100 text-red-900 border-brand-red' : 'bg-emerald-100 text-emerald-900 border-emerald-400'}`}>
                  {health.errorStats.errorRatePercent}% ERROR
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-lg font-black">{health.errorStats.totalRequests24h} Permintaan</div>
                <div className="text-[11px] font-bold text-neutral-600">
                  4xx: {health.errorStats.errorCount4xx} • 5xx: {health.errorStats.errorCount5xx}
                </div>
              </div>
              <div className="text-[10px] font-mono text-neutral-400">Status Error Tracking: Aktif</div>
            </div>
          </div>

          {/* Endpoint Latency Health Audit Table */}
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-neutral-800" />
                <h2 className="font-black text-sm uppercase tracking-wider text-black">
                  Pemeriksaan Endpoint Kritis Real-Time
                </h2>
              </div>
              <span className="text-xs font-bold text-neutral-500">Semua Endpoint Dipantau Otomatis</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {health.endpoints.map((ep, idx) => (
                <div key={idx} className="p-4 border-2 border-black bg-neutral-50 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-black text-xs text-neutral-900 block">{ep.endpoint}</span>
                    <span className="text-[11px] font-mono text-neutral-500">
                      HTTP {ep.statusCode || 'N/A'} • Latensi: {ep.latencyMs} ms
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-black uppercase border ${
                      ep.status === 'ok'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-500'
                        : ep.status === 'degraded'
                        ? 'bg-amber-100 text-amber-900 border-amber-500'
                        : 'bg-red-100 text-red-900 border-brand-red'
                    }`}
                  >
                    {ep.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Alert Channel Configuration Box */}
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-black pb-3">
              <Sliders className="w-5 h-5 text-brand-red" />
              <div>
                <h2 className="font-black text-sm uppercase tracking-wider text-black">
                  Konfigurasi Kanal Peringatan Otomatis (Alert Channels)
                </h2>
                <p className="text-xs font-bold text-neutral-600 mt-0.5">
                  Admin tidak perlu membuka website secara manual setiap saat. Notifikasi otomatis dikirim ketika website down, error meningkat, atau disk server hampir penuh.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-black uppercase text-neutral-800">
                    Webhook Alert URL (Discord / Slack / Gateway)
                  </label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-3 py-2 border-2 border-black font-bold focus:bg-amber-50"
                  />
                  <span className="text-[10px] text-neutral-500 block">
                    Kirim pesan JSON otomatis saat terdeteksi anomali kritis.
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="font-black uppercase text-neutral-800">
                    Nomor WhatsApp Tujuan Peringatan
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 bg-neutral-200 border-2 border-r-0 border-black font-black text-neutral-700">
                      <Phone className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      value={whatsappAlertNumber}
                      onChange={(e) => setWhatsappAlertNumber(e.target.value)}
                      placeholder="6281234567890"
                      className="w-full px-3 py-2 border-2 border-black font-bold focus:bg-amber-50"
                    />
                  </div>
                  <span className="text-[10px] text-neutral-500 block">
                    Format nomor internasional (contoh: 62812...).
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="font-black uppercase text-neutral-800">
                    Ambang Batas Peringatan Disk (% Terpakai)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="50"
                      max="98"
                      value={diskThreshold}
                      onChange={(e) => setDiskThreshold(Number(e.target.value))}
                      className="flex-1 accent-brand-red"
                    />
                    <span className="font-black px-2 py-1 bg-neutral-100 border-2 border-black w-14 text-center">
                      {diskThreshold}%
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500 block">
                    Peringatan dikirim jika disk server melebihi ambang batas ini.
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="font-black uppercase text-neutral-800">
                    Ambang Batas Lonjakan Error Rate (%)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={errorThreshold}
                      onChange={(e) => setErrorThreshold(Number(e.target.value))}
                      className="flex-1 accent-brand-red"
                    />
                    <span className="font-black px-2 py-1 bg-neutral-100 border-2 border-black w-14 text-center">
                      {errorThreshold}%
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500 block">
                    Peringatan dikirim jika persentase HTTP 5xx melonjak di atas persentase ini.
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t-2 border-neutral-200">
                <label className="flex items-center gap-2 cursor-pointer font-black uppercase text-neutral-800">
                  <input
                    type="checkbox"
                    checked={alertsEnabled}
                    onChange={(e) => setAlertsEnabled(e.target.checked)}
                    className="w-4 h-4 accent-black"
                  />
                  <span>Aktifkan Pengiriman Notifikasi Peringatan Otomatis</span>
                </label>

                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white font-black uppercase text-xs border-2 border-black shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-2 disabled:opacity-50"
                >
                  <SaveIcon className="w-4 h-4" />
                  <span>{savingConfig ? 'Menyimpan...' : 'Simpan Konfigurasi Kanal Alert'}</span>
                </button>
              </div>
            </form>
          </div>
        </>
      ) : null}
    </div>
  );
};
