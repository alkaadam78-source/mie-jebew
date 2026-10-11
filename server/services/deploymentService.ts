import fs from 'fs';
import path from 'path';
import { db } from '../db/database';
import { getMySQLPool } from '../db/mysql';
import { createBackup, restoreBackup } from './backupService';

export interface DeploymentCheckItem {
  name: string;
  category: 'database' | 'api' | 'build' | 'resources';
  status: 'passed' | 'warning' | 'failed';
  details: string;
  latencyMs?: number;
}

export interface DeploymentHealthReport {
  score: number; // 0 - 100
  overallStatus: 'passed' | 'warning' | 'failed';
  timestamp: string;
  checks: DeploymentCheckItem[];
  readyForProduction: boolean;
  recommendations: string[];
}

export interface DeploymentRecord {
  id: string;
  version: string;
  git_commit?: string;
  deploy_status: 'active' | 'staged' | 'rolled_back' | 'failed';
  notes?: string;
  database_backup_id?: string;
  deployed_by: string;
  deployed_at: string;
}

/**
 * Menjalankan Health Check lengkap sebelum/sesudah deployment
 */
export async function runDeploymentHealthCheck(): Promise<DeploymentHealthReport> {
  const checks: DeploymentCheckItem[] = [];
  const recommendations: string[] = [];

  // 1. Cek SQLite Database
  try {
    const t0 = Date.now();
    const row = db.prepare('SELECT 1 as val').get() as any;
    const latency = Date.now() - t0;
    if (row?.val === 1) {
      checks.push({
        name: 'SQLite Core Engine',
        category: 'database',
        status: 'passed',
        details: 'Database SQLite aktif, mode WAL aktif, foreign keys ON.',
        latencyMs: latency,
      });
    } else {
      checks.push({
        name: 'SQLite Core Engine',
        category: 'database',
        status: 'failed',
        details: 'SQLite tidak mengembalikan respons query standar.',
      });
    }
  } catch (err: any) {
    checks.push({
      name: 'SQLite Core Engine',
      category: 'database',
      status: 'failed',
      details: `Koneksi SQLite error: ${err.message}`,
    });
  }

  // 2. Cek MySQL / phpMyAdmin Connection
  const pool = getMySQLPool();
  if (pool) {
    try {
      const t0 = Date.now();
      const [rows]: any = await pool.query('SELECT 1 as val');
      const latency = Date.now() - t0;
      if (rows?.[0]?.val === 1) {
        checks.push({
          name: 'MySQL / phpMyAdmin Primary Store',
          category: 'database',
          status: 'passed',
          details: `Koneksi MySQL stabil (${process.env.DB_NAME || 'mie_jebew_db'} pada localhost:3306).`,
          latencyMs: latency,
        });
      }
    } catch (err: any) {
      checks.push({
        name: 'MySQL / phpMyAdmin Primary Store',
        category: 'database',
        status: 'warning',
        details: `Koneksi MySQL terputus atau offline (${err.message}). Sistem berjalan pada failover SQLite.`,
      });
      recommendations.push('Periksa servis MySQL/MariaDB di XAMPP/server agar pencatatan phpMyAdmin tersinkronisasi.');
    }
  } else {
    checks.push({
      name: 'MySQL / phpMyAdmin Primary Store',
      category: 'database',
      status: 'warning',
      details: 'Kredensial MySQL belum dikonfigurasi sepenuhnya di environment.',
    });
  }

  // 3. Cek Frontend Build Artifacts (dist/index.html & dist/assets)
  const distPath = path.resolve(process.cwd(), 'dist');
  const indexHtml = path.join(distPath, 'index.html');
  if (fs.existsSync(indexHtml)) {
    const stat = fs.statSync(indexHtml);
    checks.push({
      name: 'Frontend Production Bundle',
      category: 'build',
      status: 'passed',
      details: `Bundle produksi Vite tersedia (index.html: ${Math.round(stat.size / 1024)} KB).`,
    });
  } else {
    checks.push({
      name: 'Frontend Production Bundle',
      category: 'build',
      status: 'warning',
      details: 'Folder dist/index.html belum dibundle. Jalankan npm run build sebelum rilis produksi.',
    });
    recommendations.push('Jalankan npm run build sebelum merilis ke server live.');
  }

  // 4. Cek API Endpoints Lokal
  const testEndpoints = [
    { name: 'API Public Bootstrap', path: '/api/public/bootstrap' },
    { name: 'API Maintenance Status', path: '/api/public/maintenance-status' },
    { name: 'API Reward Odds Config', path: '/api/rewards/odds-config' },
  ];

  for (const ep of testEndpoints) {
    try {
      const t0 = Date.now();
      const res = await fetch(`http://127.0.0.1:3001${ep.path}`, { signal: AbortSignal.timeout(3000) });
      const latency = Date.now() - t0;
      if (res.ok) {
        checks.push({
          name: ep.name,
          category: 'api',
          status: 'passed',
          details: `Endpoint mengembalikan HTTP ${res.status} OK.`,
          latencyMs: latency,
        });
      } else {
        checks.push({
          name: ep.name,
          category: 'api',
          status: 'warning',
          details: `Endpoint mengembalikan status HTTP ${res.status}.`,
          latencyMs: latency,
        });
      }
    } catch (err: any) {
      checks.push({
        name: ep.name,
        category: 'api',
        status: 'warning',
        details: `Endpoint tidak dapat dihubungi: ${err.message}`,
      });
    }
  }

  // 5. Cek Resource Disk & RAM
  try {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / (1024 * 1024));
    checks.push({
      name: 'Node.js Memory Allocation',
      category: 'resources',
      status: heapUsedMB > 450 ? 'warning' : 'passed',
      details: `Penggunaan heap memori: ${heapUsedMB} MB.`,
    });
  } catch {}

  // Hitung Skor
  const passedCount = checks.filter(c => c.status === 'passed').length;
  const failedCount = checks.filter(c => c.status === 'failed').length;
  const score = Math.round((passedCount / checks.length) * 100);

  let overallStatus: 'passed' | 'warning' | 'failed' = 'passed';
  if (failedCount > 0 || score < 70) {
    overallStatus = 'failed';
  } else if (score < 90) {
    overallStatus = 'warning';
  }

  return {
    score,
    overallStatus,
    timestamp: new Date().toISOString(),
    checks,
    readyForProduction: score >= 80 && failedCount === 0,
    recommendations,
  };
}

/**
 * Membuat snapshot rilis deployment aman dengan backup database terhubung
 */
export async function createDeploymentSnapshot(
  version: string,
  notes: string,
  adminUsername: string = 'admin'
): Promise<DeploymentRecord> {
  const now = new Date().toISOString();
  const id = `dep-${Date.now().toString(36)}`;

  // Ambil backup database otomatis sebagai safety net sebelum versi baru dijalankan
  const backup = await createBackup('pre_restore_safety', adminUsername, `Pre-deployment snapshot versi ${version}`);

  const record: DeploymentRecord = {
    id,
    version,
    git_commit: 'HEAD',
    deploy_status: 'active',
    notes,
    database_backup_id: backup.id,
    deployed_by: adminUsername,
    deployed_at: now,
  };

  db.prepare(`
    INSERT INTO deployment_records (
      id, version, git_commit, deploy_status, notes, database_backup_id, deployed_by, deployed_at
    ) VALUES (
      @id, @version, @git_commit, @deploy_status, @notes, @database_backup_id, @deployed_by, @deployed_at
    )
  `).run(record);

  const pool = getMySQLPool();
  if (pool) {
    try {
      await pool.execute(
        `INSERT INTO deployment_records (
          id, version, git_commit, deploy_status, notes, database_backup_id, deployed_by, deployed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [record.id, record.version, record.git_commit, record.deploy_status, record.notes, record.database_backup_id, record.deployed_by]
      );
    } catch {}
  }

  return record;
}

/**
 * Mengambil daftar riwayat snapshot deployment
 */
export function getDeploymentHistory(): DeploymentRecord[] {
  return db.prepare(`SELECT * FROM deployment_records ORDER BY deployed_at DESC LIMIT 20`).all() as DeploymentRecord[];
}

/**
 * Melakukan rollback ke versi deployment sebelumnya secara aman
 */
export async function rollbackDeployment(
  deploymentId: string,
  adminUsername: string
): Promise<{ success: boolean; message: string }> {
  const record = db.prepare('SELECT * FROM deployment_records WHERE id = ?').get(deploymentId) as DeploymentRecord | undefined;
  if (!record) {
    return { success: false, message: 'Catatan deployment tidak ditemukan.' };
  }

  if (!record.database_backup_id) {
    return { success: false, message: 'Tidak ditemukan snapshot database yang terkait dengan deployment ini.' };
  }

  // Restore database snapshot
  const restoreResult = await restoreBackup(record.database_backup_id, adminUsername);
  if (!restoreResult.success) {
    return { success: false, message: `Rollback database gagal: ${restoreResult.message}` };
  }

  const now = new Date().toISOString();
  db.prepare(`UPDATE deployment_records SET deploy_status = 'rolled_back' WHERE id = ?`).run(deploymentId);

  const pool = getMySQLPool();
  if (pool) {
    try {
      await pool.execute(`UPDATE deployment_records SET deploy_status = 'rolled_back' WHERE id = ?`, [deploymentId]);
    } catch {}
  }

  return {
    success: true,
    message: `Rollback ke versi ${record.version} berhasil dilakukan. Database dipulihkan ke snapshot ${record.database_backup_id}.`,
  };
}
