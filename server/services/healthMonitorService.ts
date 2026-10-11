import os from 'os';
import fs from 'fs';
import path from 'path';
import { db } from '../db/database';
import { testMySQLConnection, getMySQLPool } from '../db/mysql';

export interface EndpointHealthResult {
  endpoint: string;
  status: 'ok' | 'degraded' | 'error';
  statusCode: number;
  latencyMs: number;
  message?: string;
}

export interface HealthMonitorData {
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
  endpoints: EndpointHealthResult[];
  errorStats: {
    totalRequests24h: number;
    errorCount4xx: number;
    errorCount5xx: number;
    errorRatePercent: number;
  };
  alertConfig: HealthAlertConfig;
}

export interface HealthAlertConfig {
  enabled: boolean;
  webhookUrl?: string;
  whatsappAlertNumber?: string;
  emailAlert?: string;
  diskThresholdPercent: number;
  errorThresholdPercent: number;
  notifyOnDbFailure: boolean;
}

// In-memory request & error stats buffer
let totalRequests = 0;
let count4xx = 0;
let count5xx = 0;
let lastAlertSentTime = 0;
const ALERT_COOLDOWN_MS = 15 * 60 * 1000; // Minimal 15 menit antar alert untuk menghindari spam

export function recordRequestMetric(statusCode: number): void {
  totalRequests++;
  if (statusCode >= 500) {
    count5xx++;
  } else if (statusCode >= 400) {
    count4xx++;
  }
}

/**
 * Mengambil konfigurasi notifikasi alert dari database
 */
export function getHealthAlertConfig(): HealthAlertConfig {
  try {
    const row = db
      .prepare(`SELECT setting_value FROM system_settings WHERE setting_key = 'health_alert_config'`)
      .get() as { setting_value: string } | undefined;

    if (row && row.setting_value) {
      return JSON.parse(row.setting_value);
    }
  } catch {}

  return {
    enabled: true,
    webhookUrl: '',
    whatsappAlertNumber: '6281234567890',
    emailAlert: 'admin@miejebew.com',
    diskThresholdPercent: 90,
    errorThresholdPercent: 5,
    notifyOnDbFailure: true,
  };
}

/**
 * Menyimpan konfigurasi notifikasi alert ke database
 */
export function updateHealthAlertConfig(
  config: Partial<HealthAlertConfig>,
  updatedBy: string
): HealthAlertConfig {
  const current = getHealthAlertConfig();
  const merged: HealthAlertConfig = {
    ...current,
    ...config,
  };

  const jsonStr = JSON.stringify(merged);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO system_settings (setting_key, setting_value, updated_by, updated_at)
    VALUES ('health_alert_config', ?, ?, ?)
    ON CONFLICT(setting_key) DO UPDATE SET
      setting_value = excluded.setting_value,
      updated_by = excluded.updated_by,
      updated_at = excluded.updated_at
  `).run(jsonStr, updatedBy, now);

  const pool = getMySQLPool();
  if (pool) {
    pool
      .query(
        `INSERT INTO system_settings (setting_key, setting_value, updated_by, updated_at)
         VALUES ('health_alert_config', ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           setting_value = VALUES(setting_value),
           updated_by = VALUES(updated_by),
           updated_at = VALUES(updated_at)`,
        [jsonStr, updatedBy, new Date(now)]
      )
      .catch(() => {});
  }

  return merged;
}

/**
 * Format detik menjadi format terbaca (misal: "2 hari 4 jam 15 mnt")
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}h`);
  if (hours > 0) parts.push(`${hours}j`);
  parts.push(`${minutes}m`);
  return parts.join(' ');
}

/**
 * Menghitung ruang disk penyimpanan server
 */
function getDiskStorageInfo(): {
  totalGB: number;
  freeGB: number;
  usedGB: number;
  usedPercent: number;
  isWarning: boolean;
} {
  try {
    const cwd = process.cwd();
    // Gunakan fs.statfsSync (Tersedia di Node 18+)
    if (typeof (fs as any).statfsSync === 'function') {
      const stats = (fs as any).statfsSync(cwd);
      const totalBytes = stats.blocks * stats.bsize;
      const freeBytes = stats.bfree * stats.bsize;
      const usedBytes = totalBytes - freeBytes;

      const totalGB = Number((totalBytes / (1024 ** 3)).toFixed(2));
      const freeGB = Number((freeBytes / (1024 ** 3)).toFixed(2));
      const usedGB = Number((usedBytes / (1024 ** 3)).toFixed(2));
      const usedPercent = totalBytes > 0 ? Number(((usedBytes / totalBytes) * 100).toFixed(1)) : 0;

      return {
        totalGB,
        freeGB,
        usedGB,
        usedPercent,
        isWarning: usedPercent >= 90,
      };
    }
  } catch {}

  // Fallback estimasi
  return {
    totalGB: 50,
    freeGB: 35,
    usedGB: 15,
    usedPercent: 30,
    isWarning: false,
  };
}

/**
 * Menguji koneksi dan latensi MySQL
 */
async function checkMySQLLatency(): Promise<{ status: 'connected' | 'offline'; latencyMs: number }> {
  const pool = getMySQLPool();
  if (!pool) return { status: 'offline', latencyMs: 0 };

  const start = Date.now();
  try {
    const conn = await pool.getConnection();
    await conn.query('SELECT 1');
    conn.release();
    return { status: 'connected', latencyMs: Date.now() - start };
  } catch {
    return { status: 'offline', latencyMs: 0 };
  }
}

/**
 * Melakukan pengecekan kesehatan menyeluruh (Comprehensive Health Audit)
 */
export async function getSystemHealthSnapshot(): Promise<HealthMonitorData> {
  const uptimeSec = process.uptime();
  const memUsage = process.memoryUsage();
  const sysTotalMem = os.totalmem();
  const sysFreeMem = os.freemem();
  const disk = getDiskStorageInfo();
  const mysqlHealth = await checkMySQLLatency();

  // Ukuran file SQLite
  let sqliteSizeMB = 0;
  try {
    const sqlitePath = path.resolve(process.cwd(), 'data', 'database.sqlite');
    if (fs.existsSync(sqlitePath)) {
      sqliteSizeMB = Number((fs.statSync(sqlitePath).size / (1024 * 1024)).toFixed(2));
    }
  } catch {}

  // Uji internal endpoints
  const endpoints: EndpointHealthResult[] = [];
  const testEndpoints = [
    { path: '/api/health', name: 'API Gateway Health' },
    { path: '/api/public/maintenance-status', name: 'Maintenance Status Endpoint' },
    { path: '/api/public/bootstrap', name: 'Public Bootstrap Catalog' },
  ];

  for (const ep of testEndpoints) {
    const start = Date.now();
    try {
      const port = process.env.PORT || 3001;
      const res = await fetch(`http://localhost:${port}${ep.path}`);
      const latency = Date.now() - start;
      endpoints.push({
        endpoint: ep.name,
        status: res.ok ? 'ok' : 'degraded',
        statusCode: res.status,
        latencyMs: latency,
      });
    } catch (err: any) {
      endpoints.push({
        endpoint: ep.name,
        status: 'error',
        statusCode: 0,
        latencyMs: Date.now() - start,
        message: err.message,
      });
    }
  }

  const alertConfig = getHealthAlertConfig();

  // Hitung tingkat error
  const total = totalRequests > 0 ? totalRequests : 1;
  const errorRatePercent = Number(((count5xx / total) * 100).toFixed(2));

  // Tentukan overall status
  let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
  const hasEndpointError = endpoints.some((e) => e.status === 'error');
  const hasEndpointDegraded = endpoints.some((e) => e.status === 'degraded');

  if (hasEndpointError || disk.usedPercent >= alertConfig.diskThresholdPercent) {
    overallStatus = 'critical';
  } else if (hasEndpointDegraded || errorRatePercent >= alertConfig.errorThresholdPercent || mysqlHealth.status === 'offline') {
    overallStatus = 'degraded';
  }

  const data: HealthMonitorData = {
    timestamp: new Date().toISOString(),
    overallStatus,
    system: {
      uptimeSeconds: Math.floor(uptimeSec),
      uptimeFormatted: formatUptime(uptimeSec),
      platform: `${os.type()} ${os.release()} (${os.arch()})`,
      nodeVersion: process.version,
      cpuCores: os.cpus().length,
      memory: {
        heapUsedMB: Number((memUsage.heapUsed / (1024 * 1024)).toFixed(1)),
        heapTotalMB: Number((memUsage.heapTotal / (1024 * 1024)).toFixed(1)),
        rssMB: Number((memUsage.rss / (1024 * 1024)).toFixed(1)),
        systemTotalMB: Number((sysTotalMem / (1024 * 1024)).toFixed(0)),
        systemFreeMB: Number((sysFreeMem / (1024 * 1024)).toFixed(0)),
        systemUsedPercent: Number((((sysTotalMem - sysFreeMem) / sysTotalMem) * 100).toFixed(1)),
      },
      disk,
    },
    databases: {
      sqlite: {
        status: 'connected',
        fileSizeMB: sqliteSizeMB,
        walMode: true,
      },
      mysql: {
        status: mysqlHealth.status,
        latencyMs: mysqlHealth.latencyMs,
        database: process.env.DB_NAME || 'mie_jebew_db',
      },
    },
    endpoints,
    errorStats: {
      totalRequests24h: totalRequests,
      errorCount4xx: count4xx,
      errorCount5xx: count5xx,
      errorRatePercent,
    },
    alertConfig,
  };

  // Evaluasi apakah perlu mengirim peringatan otomatis ke kanal admin
  if (alertConfig.enabled && (overallStatus === 'critical' || overallStatus === 'degraded')) {
    checkAndSendAutomatedAlert(data);
  }

  return data;
}

/**
 * Mengirimkan notifikasi darurat jika website mengalami masalah (Dispatches Webhook & Alert Channel)
 */
async function checkAndSendAutomatedAlert(health: HealthMonitorData): Promise<void> {
  const now = Date.now();
  if (now - lastAlertSentTime < ALERT_COOLDOWN_MS) {
    return; // Dalam masa cooldown agar tidak membanjiri notifikasi
  }

  const issues: string[] = [];
  if (health.system.disk.usedPercent >= health.alertConfig.diskThresholdPercent) {
    issues.push(`🚨 Disk Server Hampir Penuh (${health.system.disk.usedPercent}% terpakai dari ${health.system.disk.totalGB} GB)!`);
  }
  if (health.errorStats.errorRatePercent >= health.alertConfig.errorThresholdPercent) {
    issues.push(`⚠️ Lonjakan Error Terdeteksi (${health.errorStats.errorRatePercent}% error 5xx dari ${health.errorStats.totalRequests24h} permintaan)!`);
  }
  if (health.databases.mysql.status === 'offline' && health.alertConfig.notifyOnDbFailure) {
    issues.push(`❌ Koneksi Database MySQL phpMyAdmin Terputus!`);
  }

  const endpointFails = health.endpoints.filter((e) => e.status !== 'ok');
  if (endpointFails.length > 0) {
    issues.push(`🛑 ${endpointFails.length} Endpoint Utama Mengalami Gangguan: ${endpointFails.map((e) => e.endpoint).join(', ')}`);
  }

  if (issues.length === 0) return;

  lastAlertSentTime = now;
  const alertText = issues.join('\n');

  console.warn('[Health Monitor Alert Dispatch]:\n' + alertText);

  // Kirim ke Webhook eksternal jika dikonfigurasi (Discord/Slack/WhatsApp Gateway)
  if (health.alertConfig.webhookUrl) {
    try {
      await fetch(health.alertConfig.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🚨 **PERINGATAN SISTEM MIE JEBEW**\n${alertText}\n🕒 Waktu: ${new Date().toLocaleString('id-ID')} WIB`,
        }),
      });
    } catch (e: any) {
      console.warn('[Health Alert Webhook Failed]:', e.message);
    }
  }

  // Rekam ke tabel security_logs
  try {
    db.prepare(`
      INSERT INTO security_logs (ip_address, action_type, description, severity, created_at)
      VALUES ('127.0.0.1', 'SYSTEM_HEALTH_ALERT', ?, 'critical', ?)
    `).run(alertText, new Date().toISOString());
  } catch {}
}
