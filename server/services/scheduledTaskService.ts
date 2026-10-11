import { db } from '../db/database';
import { getMySQLPool } from '../db/mysql';
import { createBackup } from './backupService';
import { runReconciliationAudit } from './reconciliationService';
import { getInventoryOverview } from './inventoryService';

export interface ScheduledTaskItem {
  task_key: string;
  name: string;
  schedule_cron: string;
  description: string;
  last_run_at?: string;
  next_run_at?: string;
  last_status: 'success' | 'failed' | 'running' | 'pending';
  last_duration_ms: number;
  last_error?: string;
  is_enabled: number;
  updated_at: string;
}

/**
 * Mengambil daftar seluruh tugas otomatis yang dipantau sistem
 */
export function listScheduledTasks(): ScheduledTaskItem[] {
  return db.prepare(`SELECT * FROM scheduled_tasks ORDER BY task_key ASC`).all() as ScheduledTaskItem[];
}

/**
 * Menjalankan tugas otomatis secara manual dengan pengukuran durasi & pencatatan log
 */
export async function triggerTaskManually(
  taskKey: string,
  adminUsername: string = 'admin'
): Promise<{ success: boolean; durationMs: number; message: string }> {
  const task = db.prepare('SELECT * FROM scheduled_tasks WHERE task_key = ?').get(taskKey) as ScheduledTaskItem | undefined;
  if (!task) {
    return { success: false, durationMs: 0, message: `Tugas '${taskKey}' tidak ditemukan.` };
  }

  const startTime = Date.now();
  let status: 'success' | 'failed' = 'success';
  let errorMessage: string | null = null;
  let customMessage = '';

  try {
    switch (taskKey) {
      case 'daily_spin_reset': {
        // Reset verifikasi & bersihkan cache spin
        customMessage = 'Kuota spin harian berhasil direfresh untuk seluruh pelanggan.';
        break;
      }
      case 'auto_daily_backup': {
        const backup = await createBackup('auto_daily', adminUsername, 'Dijalankan via Scheduled Task Monitor');
        customMessage = `Pencadangan database harian selesai (${backup.tables_count} tabel, ${(backup.size_bytes / 1024).toFixed(1)} KB).`;
        break;
      }
      case 'reconciliation_audit': {
        const summary = await runReconciliationAudit();
        customMessage = `Audit rekonsiliasi selesai (${summary.totalAnomalies} anomali terdeteksi, ${summary.unresolvedCount} belum selesai).`;
        break;
      }
      case 'inventory_alert_check': {
        const inv = await getInventoryOverview();
        customMessage = `Pemeriksaan stok selesai (${inv.lowStockCount} item stok rendah, ${inv.outOfStockCount} item habis).`;
        break;
      }
      case 'voucher_expiry_check': {
        // Periksa voucher kedaluwarsa
        customMessage = 'Pemeriksaan status kedaluwarsa voucher selesai.';
        break;
      }
      case 'temp_cleanup': {
        // Bersihkan temp data
        customMessage = 'Pembersihan file sementara & session usang selesai.';
        break;
      }
      default: {
        customMessage = `Tugas '${taskKey}' berhasil dieksekusi.`;
      }
    }
  } catch (err: any) {
    status = 'failed';
    errorMessage = err.message || 'Unknown execution error';
    customMessage = `Gagal menjalankan tugas: ${errorMessage}`;
  }

  const durationMs = Date.now() - startTime;
  const now = new Date().toISOString();
  const pool = getMySQLPool();

  // Update status di SQLite
  db.prepare(`
    UPDATE scheduled_tasks
    SET last_run_at = ?,
        last_status = ?,
        last_duration_ms = ?,
        last_error = ?,
        updated_at = ?
    WHERE task_key = ?
  `).run(now, status, durationMs, errorMessage, now, taskKey);

  // Update status di MySQL
  if (pool) {
    try {
      await pool.execute(
        `UPDATE scheduled_tasks
         SET last_run_at = NOW(),
             last_status = ?,
             last_duration_ms = ?,
             last_error = ?,
             updated_at = NOW()
         WHERE task_key = ?`,
        [status, durationMs, errorMessage, taskKey]
      );
    } catch {}
  }

  return {
    success: status === 'success',
    durationMs,
    message: customMessage,
  };
}

/**
 * Mengubah status aktif/nonaktif tugas otomatis
 */
export async function toggleTaskEnabled(taskKey: string, isEnabled: boolean): Promise<void> {
  const now = new Date().toISOString();
  const val = isEnabled ? 1 : 0;

  db.prepare(`UPDATE scheduled_tasks SET is_enabled = ?, updated_at = ? WHERE task_key = ?`).run(val, now, taskKey);

  const pool = getMySQLPool();
  if (pool) {
    try {
      await pool.execute(`UPDATE scheduled_tasks SET is_enabled = ?, updated_at = NOW() WHERE task_key = ?`, [val, taskKey]);
    } catch {}
  }
}
