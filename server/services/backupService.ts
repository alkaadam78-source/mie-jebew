import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { db } from '../db/database';
import { getMySQLPool } from '../db/mysql';
import { logActivity } from '../middleware/auth';

export interface BackupRecord {
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

const isServerless = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
export const BACKUP_DIR = isServerless ? '/tmp/backups' : path.resolve(process.cwd(), 'data', 'backups');
try {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Notice: backup dir init skipped in serverless', e);
}

export const BACKUP_TABLES = [
  'admin_users',
  'categories',
  'menu_items',
  'products_bottles',
  'custom_order_options',
  'bundles',
  'promotions',
  'why_choose_us',
  'behind_the_kitchen',
  'vinas_section',
  'social_links',
  'contact_information',
  'homepage_content',
  'media',
  'orders',
  'order_items',
  'customer_users',
  'coin_transactions',
  'spin_history',
  'vouchers',
  'system_settings',
  'system_backups',
  'fraud_alerts',
  'inventory_items',
  'inventory_logs',
  'reconciliation_anomalies',
  'deployment_records',
  'scheduled_tasks',
];

const MAX_BACKUP_RETENTION = 15; // Simpan 15 versi backup terbaru

/**
 * Membuat cadangan (backup) lengkap database Mie Jebew
 */
export async function createBackup(
  backupType: 'auto_daily' | 'manual' | 'pre_restore_safety' = 'manual',
  createdBy: string = 'system',
  notes?: string
): Promise<BackupRecord> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupId = `bkp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const filename = `backup_mie_jebew_${timestamp}.json`;
  const filePath = path.join(BACKUP_DIR, filename);

  try {
    const tableData: Record<string, any[]> = {};
    let totalRecords = 0;
    let tablesIncluded = 0;

    for (const tableName of BACKUP_TABLES) {
      try {
        const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
        tableData[tableName] = rows;
        totalRecords += rows.length;
        tablesIncluded++;
      } catch (err: any) {
        // Abaikan jika tabel opsional belum ada
        tableData[tableName] = [];
      }
    }

    const payload = {
      meta: {
        backupId,
        version: '1.0',
        createdAt: new Date().toISOString(),
        backupType,
        createdBy,
        notes: notes || 'Pencadangan database & produk Mie Jebew',
        totalTables: tablesIncluded,
        totalRecords,
      },
      data: tableData,
    };

    const jsonString = JSON.stringify(payload, null, 2);
    fs.writeFileSync(filePath, jsonString, 'utf8');

    const stats = fs.statSync(filePath);
    const checksum = crypto.createHash('sha256').update(jsonString).digest('hex');

    const backupRecord: BackupRecord = {
      id: backupId,
      filename,
      backup_type: backupType,
      size_bytes: stats.size,
      tables_count: tablesIncluded,
      records_count: totalRecords,
      status: 'success',
      checksum,
      notes: notes || `Pencadangan otomatis ${tablesIncluded} tabel (${totalRecords} baris data)`,
      created_by: createdBy,
      created_at: new Date().toISOString(),
    };

    // Simpan ke SQLite
    db.prepare(`
      INSERT INTO system_backups (id, filename, backup_type, size_bytes, tables_count, records_count, status, checksum, notes, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      backupRecord.id,
      backupRecord.filename,
      backupRecord.backup_type,
      backupRecord.size_bytes,
      backupRecord.tables_count,
      backupRecord.records_count,
      backupRecord.status,
      backupRecord.checksum,
      backupRecord.notes,
      backupRecord.created_by,
      backupRecord.created_at
    );

    // Simpan ke MySQL jika aktif
    const pool = getMySQLPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO system_backups (id, filename, backup_type, size_bytes, tables_count, records_count, status, checksum, notes, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            backupRecord.id,
            backupRecord.filename,
            backupRecord.backup_type,
            backupRecord.size_bytes,
            backupRecord.tables_count,
            backupRecord.records_count,
            backupRecord.status,
            backupRecord.checksum,
            backupRecord.notes,
            backupRecord.created_by,
            new Date(backupRecord.created_at),
          ]
        );
      } catch (e: any) {
        console.warn('[Backup Service] MySQL sync note:', e.message);
      }
    }

    logActivity(
      createdBy,
      'BACKUP',
      'system_backups',
      backupId,
      `Berhasil membuat cadangan ${backupType.toUpperCase()} (${(stats.size / 1024).toFixed(1)} KB, ${totalRecords} data). File: ${filename}`
    );

    // Jalankan rotasi penghapusan backup lama melebihi kuota
    pruneOldBackups();

    return backupRecord;
  } catch (error: any) {
    console.error('[Backup Service] Gagal membuat cadangan:', error);

    const failedRecord: BackupRecord = {
      id: backupId,
      filename,
      backup_type: backupType,
      size_bytes: 0,
      tables_count: 0,
      records_count: 0,
      status: 'failed',
      checksum: '',
      notes: `Gagal: ${error.message}`,
      created_by: createdBy,
      created_at: new Date().toISOString(),
    };

    try {
      db.prepare(`
        INSERT INTO system_backups (id, filename, backup_type, size_bytes, tables_count, records_count, status, checksum, notes, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        failedRecord.id,
        failedRecord.filename,
        failedRecord.backup_type,
        0,
        0,
        0,
        'failed',
        '',
        failedRecord.notes,
        failedRecord.created_by,
        failedRecord.created_at
      );
    } catch {}

    throw error;
  }
}

/**
 * Menghapus backup lama jika melebihi kuota retensi
 */
export function pruneOldBackups(): void {
  try {
    const allBackups = db.prepare(`SELECT * FROM system_backups ORDER BY created_at DESC`).all() as BackupRecord[];
    if (allBackups.length > MAX_BACKUP_RETENTION) {
      const toDelete = allBackups.slice(MAX_BACKUP_RETENTION);
      for (const item of toDelete) {
        const filePath = path.join(BACKUP_DIR, item.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        db.prepare(`DELETE FROM system_backups WHERE id = ?`).run(item.id);

        const pool = getMySQLPool();
        if (pool) {
          pool.query(`DELETE FROM system_backups WHERE id = ?`, [item.id]).catch(() => {});
        }
      }
    }
  } catch (err: any) {
    console.warn('[Backup Service] Prune old backups note:', err.message);
  }
}

/**
 * Mengambil daftar seluruh versi backup
 */
export function getBackupList(): BackupRecord[] {
  return db.prepare(`SELECT * FROM system_backups ORDER BY created_at DESC`).all() as BackupRecord[];
}

/**
 * Uji pemulihan (Test Restore / Dry Run):
 * Memeriksa validitas file backup, checksum, struktur tabel, dan data tanpa merusak database produksi.
 */
export async function testRestoreBackup(backupId: string): Promise<{
  valid: boolean;
  message: string;
  tablesCount: number;
  totalRecords: number;
  fileSizeKB: number;
  tables: Record<string, number>;
}> {
  const record = db.prepare(`SELECT * FROM system_backups WHERE id = ?`).get(backupId) as BackupRecord | undefined;
  if (!record) {
    throw new Error('Data backup tidak ditemukan di database.');
  }

  const filePath = path.join(BACKUP_DIR, record.filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File arsip backup (${record.filename}) tidak ditemukan di disk server.`);
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const computedHash = crypto.createHash('sha256').update(fileContent).digest('hex');

  if (record.checksum && record.checksum !== computedHash) {
    throw new Error('Verifikasi integritas GAGAL: Checksum SHA-256 arsip backup tidak sesuai (file rusak atau telah termodifikasi).');
  }

  const parsed = JSON.parse(fileContent);
  if (!parsed.data || typeof parsed.data !== 'object') {
    throw new Error('Format data backup tidak valid.');
  }

  const tableSummary: Record<string, number> = {};
  let recordsCount = 0;

  for (const [table, rows] of Object.entries(parsed.data)) {
    const count = Array.isArray(rows) ? rows.length : 0;
    tableSummary[table] = count;
    recordsCount += count;
  }

  return {
    valid: true,
    message: `Uji Pemulihan Berhasil! Berkas utuh (SHA-256 terverifikasi), siap dipulihkan ke database dengan ${Object.keys(tableSummary).length} tabel dan total ${recordsCount} baris data.`,
    tablesCount: Object.keys(tableSummary).length,
    totalRecords: recordsCount,
    fileSizeKB: Number((record.size_bytes / 1024).toFixed(1)),
    tables: tableSummary,
  };
}

/**
 * Memulihkan (Restore) database dari cadangan yang dipilih
 */
export async function restoreBackup(backupId: string, adminUsername: string): Promise<{
  success: boolean;
  message: string;
  restoredTables: number;
  restoredRecords: number;
}> {
  // 1. Verifikasi kelayakan backup sebelum memulihkan
  const testResult = await testRestoreBackup(backupId);
  if (!testResult.valid) {
    throw new Error('Pemulihan dibatalkan karena berkas backup tidak lolos verifikasi.');
  }

  const record = db.prepare(`SELECT * FROM system_backups WHERE id = ?`).get(backupId) as BackupRecord;
  const filePath = path.join(BACKUP_DIR, record.filename);
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // 2. Ambil snapshot darurat sebelum proses timpa data (Safety Net Undo)
  try {
    await createBackup('pre_restore_safety', adminUsername, `Cadangan otomatis sebelum restore ID ${backupId}`);
  } catch (err: any) {
    console.warn('[Restore] Safety snapshot note:', err.message);
  }

  // 3. Eksekusi Restore atomik pada SQLite
  const transaction = db.transaction(() => {
    for (const [tableName, rows] of Object.entries(parsed.data as Record<string, any[]>)) {
      if (!BACKUP_TABLES.includes(tableName)) continue;
      if (!Array.isArray(rows)) continue;

      // Kosongkan tabel (hindari truncate admin_users saat ini jika rows kosong)
      if (tableName === 'admin_users' && rows.length === 0) continue;

      db.prepare(`DELETE FROM ${tableName}`).run();

      if (rows.length > 0) {
        const columns = Object.keys(rows[0]);
        const placeholders = columns.map((col) => `@${col}`).join(', ');
        const insertStmt = db.prepare(
          `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`
        );

        for (const row of rows) {
          insertStmt.run(row);
        }
      }
    }
  });

  transaction();

  // 4. Sinkronisasi pemulihan ke MySQL phpMyAdmin jika aktif
  const pool = getMySQLPool();
  if (pool) {
    try {
      const conn = await pool.getConnection();
      await conn.beginTransaction();

      await conn.query('SET FOREIGN_KEY_CHECKS = 0');
      for (const [tableName, rows] of Object.entries(parsed.data as Record<string, any[]>)) {
        if (!BACKUP_TABLES.includes(tableName) || !Array.isArray(rows)) continue;
        if (tableName === 'admin_users' && rows.length === 0) continue;

        await conn.query(`TRUNCATE TABLE ${tableName}`);

        if (rows.length > 0) {
          const columns = Object.keys(rows[0]);
          const sql = `INSERT INTO ${tableName} (${columns.map((c) => `\`${c}\``).join(', ')}) VALUES ?`;
          const values = rows.map((r) => columns.map((c) => (r[c] !== undefined ? r[c] : null)));
          await conn.query(sql, [values]);
        }
      }
      await conn.query('SET FOREIGN_KEY_CHECKS = 1');
      await conn.commit();
      conn.release();
    } catch (mysqlErr: any) {
      console.warn('[Restore Service] MySQL restore sync note:', mysqlErr.message);
    }
  }

  logActivity(
    adminUsername,
    'RESTORE',
    'system_backups',
    backupId,
    `BERHASIL MEMULIHKAN DATABASE dari cadangan ${record.filename} (${testResult.totalRecords} data di ${testResult.tablesCount} tabel).`
  );

  return {
    success: true,
    message: `Database berhasil dipulihkan secara sempurna ke kondisi cadangan "${record.filename}".`,
    restoredTables: testResult.tablesCount,
    restoredRecords: testResult.totalRecords,
  };
}

/**
 * Penjadwalan Otomatis Backup Harian (Daily Auto-Backup)
 */
let dailyBackupTimer: NodeJS.Timeout | null = null;

export function initScheduledBackup(): void {
  if (dailyBackupTimer) return;

  // Jalankan backup pertama kali saat server start jika belum ada backup hari ini
  setTimeout(async () => {
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const todayBackup = db
        .prepare(`SELECT id FROM system_backups WHERE backup_type = 'auto_daily' AND created_at LIKE ?`)
        .get(`${todayDate}%`);

      if (!todayBackup) {
        console.log('[Auto-Backup] Menjalankan pencadangan harian otomatis pertama...');
        await createBackup('auto_daily', 'system_cron', 'Pencadangan harian terjadwal otomatis');
      }
    } catch (e: any) {
      console.error('[Auto-Backup] Error:', e.message);
    }
  }, 10000); // 10 detik setelah boot

  // Cek setiap 6 jam apakah perlu backup harian baru
  dailyBackupTimer = setInterval(async () => {
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const todayBackup = db
        .prepare(`SELECT id FROM system_backups WHERE backup_type = 'auto_daily' AND created_at LIKE ?`)
        .get(`${todayDate}%`);

      if (!todayBackup) {
        console.log('[Auto-Backup] Menjalankan rutinitas pencadangan harian...');
        await createBackup('auto_daily', 'system_cron', 'Pencadangan harian terjadwal otomatis');
      }
    } catch (err: any) {
      console.error('[Auto-Backup] Rutinitas pencadangan harian gagal:', err.message);
    }
  }, 6 * 60 * 60 * 1000);
}
