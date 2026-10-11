import { db } from '../db/database';
import { getMySQLPool } from '../db/mysql';
import { logActivity } from '../middleware/auth';

export interface MaintenanceConfig {
  isEnabled: boolean;
  mode: 'full' | 'read_only';
  title: string;
  message: string;
  updatedBy: string;
  updatedAt: string;
}

const DEFAULT_CONFIG: MaintenanceConfig = {
  isEnabled: false,
  mode: 'full',
  title: 'Website Sedang Dalam Pemeliharaan',
  message: 'Kami sedang melakukan perbaikan sementara untuk meningkatkan performa layanan Mie Jebew. Silakan kembali beberapa saat lagi!',
  updatedBy: 'system',
  updatedAt: new Date().toISOString(),
};

// In-Memory cache dengan TTL 3 detik untuk kecepatan tinggi
let cachedConfig: MaintenanceConfig | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 3000;

export async function getMaintenanceConfig(): Promise<MaintenanceConfig> {
  const now = Date.now();
  if (cachedConfig && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedConfig;
  }

  // 1. Cek MySQL (phpMyAdmin)
  const pool = getMySQLPool();
  if (pool) {
    try {
      const [rows]: any = await pool.query(
        `SELECT setting_value, updated_by, updated_at FROM system_settings WHERE setting_key = 'maintenance_mode' LIMIT 1`
      );
      if (rows && rows.length > 0) {
        const parsed = JSON.parse(rows[0].setting_value);
        cachedConfig = {
          isEnabled: Boolean(parsed.isEnabled),
          mode: parsed.mode === 'read_only' ? 'read_only' : 'full',
          title: parsed.title || DEFAULT_CONFIG.title,
          message: parsed.message || DEFAULT_CONFIG.message,
          updatedBy: rows[0].updated_by || parsed.updatedBy || 'admin',
          updatedAt: rows[0].updated_at || parsed.updatedAt || new Date().toISOString(),
        };
        lastCacheTime = now;
        return cachedConfig;
      }
    } catch (err: any) {
      console.warn('[Maintenance] MySQL fetch fallback to SQLite:', err.message);
    }
  }

  // 2. Cek SQLite
  try {
    const row = db.prepare(`SELECT setting_value, updated_by, updated_at FROM system_settings WHERE setting_key = 'maintenance_mode'`).get() as any;
    if (row && row.setting_value) {
      const parsed = JSON.parse(row.setting_value);
      cachedConfig = {
        isEnabled: Boolean(parsed.isEnabled),
        mode: parsed.mode === 'read_only' ? 'read_only' : 'full',
        title: parsed.title || DEFAULT_CONFIG.title,
        message: parsed.message || DEFAULT_CONFIG.message,
        updatedBy: row.updated_by || parsed.updatedBy || 'admin',
        updatedAt: row.updated_at || parsed.updatedAt || new Date().toISOString(),
      };
      lastCacheTime = now;
      return cachedConfig;
    }
  } catch (err: any) {
    console.warn('[Maintenance] SQLite fetch warning:', err.message);
  }

  cachedConfig = { ...DEFAULT_CONFIG };
  lastCacheTime = now;
  return cachedConfig;
}

export async function updateMaintenanceConfig(
  newValues: Partial<MaintenanceConfig>,
  adminUsername: string
): Promise<MaintenanceConfig> {
  const current = await getMaintenanceConfig();
  const timestamp = new Date().toISOString();

  const isEnabled = typeof newValues.isEnabled === 'boolean' ? newValues.isEnabled : current.isEnabled;
  const mode = newValues.mode === 'read_only' ? 'read_only' : 'full';
  const title = (newValues.title || current.title).trim();
  const message = (newValues.message || current.message).trim();

  const updated: MaintenanceConfig = {
    isEnabled,
    mode,
    title,
    message,
    updatedBy: adminUsername,
    updatedAt: timestamp,
  };

  const jsonString = JSON.stringify(updated);

  // 1. Simpan ke MySQL
  const pool = getMySQLPool();
  if (pool) {
    try {
      await pool.execute(
        `INSERT INTO system_settings (setting_key, setting_value, updated_by, updated_at)
         VALUES ('maintenance_mode', ?, ?, NOW())
         ON DUPLICATE KEY UPDATE 
           setting_value = VALUES(setting_value),
           updated_by = VALUES(updated_by),
           updated_at = NOW()`,
        [jsonString, adminUsername]
      );
    } catch (err: any) {
      console.warn('[Maintenance] MySQL save error:', err.message);
    }
  }

  // 2. Simpan ke SQLite
  try {
    db.prepare(`
      INSERT INTO system_settings (setting_key, setting_value, updated_by, updated_at)
      VALUES ('maintenance_mode', ?, ?, ?)
      ON CONFLICT(setting_key) DO UPDATE SET
        setting_value = excluded.setting_value,
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at
    `).run(jsonString, adminUsername, timestamp);
  } catch (err: any) {
    console.warn('[Maintenance] SQLite save error:', err.message);
  }

  // Perbarui cache langsung
  cachedConfig = updated;
  lastCacheTime = Date.now();

  // 3. Catat di Audit Log MySQL & SQLite
  const actionText = isEnabled
    ? `MENGAKTIFKAN EMERGENCY MAINTENANCE MODE [Mode: ${mode.toUpperCase()}]. Pesan: "${message}"`
    : `MENONAKTIFKAN MAINTENANCE MODE (WEBSITE KEMBALI ONLINE UNTUK PUBLIK)`;

  await logActivity(
    adminUsername,
    'TOGGLE',
    'system_maintenance',
    isEnabled ? 'ON' : 'OFF',
    actionText
  );

  return updated;
}
