import { db } from '../db/database';
import { getMySQLPool } from '../db/mysql';
import { logActivity } from '../middleware/auth';

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

export interface BalanceMismatchItem {
  userId: number;
  userName: string;
  phone: string;
  currentBalance: number;
  expectedLedgerSum: number;
  difference: number;
  lastTransactionAt?: string;
}

// In-memory tracking for rate-based anomalies
const loginAttemptMap = new Map<string, { count: number; firstAttempt: number }>();
const spinAttemptMap = new Map<string, number[]>();
const redeemAttemptMap = new Map<string, number[]>();

/**
 * Mencatat dan mendeteksi percobaan login berlebihan (Brute Force Protection)
 */
export async function recordFailedLoginAttempt(ip: string, username: string): Promise<boolean> {
  const now = Date.now();
  const key = `${ip}_${username}`;
  const record = loginAttemptMap.get(key) || { count: 0, firstAttempt: now };

  // Reset jendela waktu setelah 15 menit
  if (now - record.firstAttempt > 15 * 60 * 1000) {
    record.count = 1;
    record.firstAttempt = now;
  } else {
    record.count++;
  }
  loginAttemptMap.set(key, record);

  // Jika gagal >= 5 kali dalam 15 menit, buat alert Anomali Brute Force
  if (record.count >= 5) {
    await createFraudAlert({
      alert_type: 'brute_force',
      severity: 'high',
      target_user_name: username,
      ip_address: ip,
      details: `Terdeteksi ${record.count} kali percobaan login gagal beruntun dalam 15 menit untuk username "${username}" dari IP ${ip}.`,
    });
    return true; // Flagged as brute force
  }

  return false;
}

/**
 * Mendeteksi aktivitas putaran spin wheel yang tidak wajar (Spamming / Concurrency Attack)
 */
export async function detectSpinWheelSpam(userId: number, userName: string, ip: string): Promise<boolean> {
  const now = Date.now();
  const userKey = `user_${userId}`;
  const timestamps = spinAttemptMap.get(userKey) || [];

  // Filter timestamps dalam 60 detik terakhir
  const recent = timestamps.filter((t) => now - t < 60 * 1000);
  recent.push(now);
  spinAttemptMap.set(userKey, recent);

  // Jika memanggil spin >= 3 kali dalam 60 detik (padahal kuota 1x sehari)
  if (recent.length >= 3) {
    await createFraudAlert({
      alert_type: 'spin_spam',
      severity: 'high',
      target_user_id: String(userId),
      target_user_name: userName,
      ip_address: ip,
      details: `Pengguna mencoba memutar Spin Wheel ${recent.length} kali dalam waktu 60 detik (indikasi penggunaan bot/script exploit).`,
    });
    return true;
  }

  return false;
}

/**
 * Mendeteksi penukaran koin bertubi-tubi yang mencurigakan (Rapid Redemption)
 */
export async function detectRapidRedemption(userId: number, userName: string, ip: string): Promise<boolean> {
  const now = Date.now();
  const userKey = `redeem_${userId}`;
  const timestamps = redeemAttemptMap.get(userKey) || [];

  // Filter dalam 10 detik terakhir
  const recent = timestamps.filter((t) => now - t < 10 * 1000);
  recent.push(now);
  redeemAttemptMap.set(userKey, recent);

  if (recent.length >= 3) {
    await createFraudAlert({
      alert_type: 'rapid_redeem',
      severity: 'medium',
      target_user_id: String(userId),
      target_user_name: userName,
      ip_address: ip,
      details: `Pengguna melakukan penukaran koin sebanyak ${recent.length} kali dalam 10 detik (indikasi spamming API / multi-tab).`,
    });
    return true;
  }

  return false;
}

/**
 * Mendeteksi pembuatan banyak akun dari IP yang sama (Multi-Account Farming)
 */
export async function detectMultiAccountCreation(ip: string): Promise<void> {
  try {
    const row = db
      .prepare(`SELECT COUNT(DISTINCT id) as count FROM customer_users WHERE id IN (SELECT user_id FROM coin_transactions WHERE ip_address = ?)`)
      .get(ip) as { count: number } | undefined;

    if (row && row.count >= 4) {
      await createFraudAlert({
        alert_type: 'multi_account',
        severity: 'medium',
        ip_address: ip,
        details: `Terdeteksi ${row.count} akun berbeda terhubung dengan alamat IP yang sama (${ip}) (kemungkinan pola referral/coin farming).`,
      });
    }
  } catch {}
}

/**
 * Membuat entri alert fraud baru di database
 */
export async function createFraudAlert(params: {
  alert_type: 'spin_spam' | 'rapid_redeem' | 'brute_force' | 'balance_tampering' | 'multi_account';
  severity: 'low' | 'medium' | 'high' | 'critical';
  target_user_id?: string;
  target_user_name?: string;
  ip_address?: string;
  details: string;
}): Promise<FraudAlertItem> {
  const id = `frd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  // Cek apakah alert serupa yang masih open sudah ada dalam 1 jam terakhir untuk mencegah spam notifikasi
  const existing = db
    .prepare(
      `SELECT id FROM fraud_alerts
       WHERE alert_type = ? AND ip_address = ? AND status = 'open' AND created_at >= datetime('now', '-1 hour')`
    )
    .get(params.alert_type, params.ip_address || '') as { id: string } | undefined;

  if (existing) {
    return (db.prepare(`SELECT * FROM fraud_alerts WHERE id = ?`).get(existing.id) as FraudAlertItem);
  }

  const alertItem: FraudAlertItem = {
    id,
    alert_type: params.alert_type,
    severity: params.severity,
    target_user_id: params.target_user_id,
    target_user_name: params.target_user_name,
    ip_address: params.ip_address,
    details: params.details,
    status: 'open',
    created_at: now,
  };

  db.prepare(`
    INSERT INTO fraud_alerts (id, alert_type, severity, target_user_id, target_user_name, ip_address, details, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    alertItem.id,
    alertItem.alert_type,
    alertItem.severity,
    alertItem.target_user_id || null,
    alertItem.target_user_name || null,
    alertItem.ip_address || null,
    alertItem.details,
    alertItem.status,
    alertItem.created_at
  );

  const pool = getMySQLPool();
  if (pool) {
    pool
      .query(
        `INSERT INTO fraud_alerts (id, alert_type, severity, target_user_id, target_user_name, ip_address, details, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          alertItem.id,
          alertItem.alert_type,
          alertItem.severity,
          alertItem.target_user_id || null,
          alertItem.target_user_name || null,
          alertItem.ip_address || null,
          alertItem.details,
          alertItem.status,
          new Date(alertItem.created_at),
        ]
      )
      .catch(() => {});
  }

  // Rekam juga ke security_logs
  try {
    db.prepare(`
      INSERT INTO security_logs (user_id, ip_address, action_type, description, severity, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      params.target_user_id ? parseInt(params.target_user_id, 10) || null : null,
      params.ip_address || '127.0.0.1',
      `FRAUD_${params.alert_type.toUpperCase()}`,
      params.details,
      params.severity === 'critical' ? 'critical' : 'warning',
      now
    );
  } catch {}

  return alertItem;
}

/**
 * Mengambil daftar seluruh fraud alerts
 */
export function getFraudAlerts(statusFilter?: 'open' | 'resolved' | 'dismissed'): FraudAlertItem[] {
  if (statusFilter) {
    return db
      .prepare(`SELECT * FROM fraud_alerts WHERE status = ? ORDER BY created_at DESC LIMIT 100`)
      .all(statusFilter) as FraudAlertItem[];
  }
  return db
    .prepare(`SELECT * FROM fraud_alerts ORDER BY created_at DESC LIMIT 100`)
    .all() as FraudAlertItem[];
}

/**
 * Menyelesaikan (Resolve/Dismiss) fraud alert
 */
export async function updateFraudAlertStatus(
  alertId: string,
  newStatus: 'resolved' | 'dismissed',
  adminUsername: string
): Promise<void> {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE fraud_alerts
    SET status = ?, resolved_at = ?, resolved_by = ?
    WHERE id = ?
  `).run(newStatus, now, adminUsername, alertId);

  const pool = getMySQLPool();
  if (pool) {
    pool
      .query(
        `UPDATE fraud_alerts
         SET status = ?, resolved_at = ?, resolved_by = ?
         WHERE id = ?`,
        [newStatus, new Date(now), adminUsername, alertId]
      )
      .catch(() => {});
  }

  logActivity(
    adminUsername,
    'UPDATE_FRAUD_STATUS',
    'fraud_alerts',
    alertId,
    `Mengubah status fraud alert "${alertId}" menjadi ${newStatus.toUpperCase()}`
  );
}

/**
 * AUDIT INTEGRITAS SALDO KOIN:
 * Memverifikasi seluruh saldo customer_users dengan SUM transaksi riwayat di ledger coin_transactions.
 * Jika ditemukan selisih (tampering/kebocoran saldo), secara otomatis memicu alert Critical!
 */
export async function auditAllCustomerBalances(): Promise<{
  totalAudited: number;
  healthyCount: number;
  mismatches: BalanceMismatchItem[];
  generatedAlerts: number;
}> {
  const users = db.prepare(`SELECT id, name, phone, coins_balance FROM customer_users`).all() as {
    id: number;
    name: string;
    phone: string;
    coins_balance: number;
  }[];

  const mismatches: BalanceMismatchItem[] = [];
  let generatedAlerts = 0;

  for (const user of users) {
    const sumResult = db
      .prepare(`SELECT COALESCE(SUM(amount), 0) as total_sum FROM coin_transactions WHERE user_id = ?`)
      .get(user.id) as { total_sum: number };

    const expectedSum = sumResult.total_sum;
    const currentBalance = user.coins_balance;

    if (currentBalance !== expectedSum) {
      const diff = currentBalance - expectedSum;
      mismatches.push({
        userId: user.id,
        userName: user.name,
        phone: user.phone,
        currentBalance,
        expectedLedgerSum: expectedSum,
        difference: diff,
      });

      // Buat Critical Fraud Alert jika ada indikasi manipulasi saldo tidak sesuai riwayat transaksi
      await createFraudAlert({
        alert_type: 'balance_tampering',
        severity: 'critical',
        target_user_id: String(user.id),
        target_user_name: `${user.name} (${user.phone})`,
        details: `Ketidakcocokan Saldo Koin: Saldo pengguna (${currentBalance} koin) tidak sesuai dengan total riwayat transaksi ledger (${expectedSum} koin). Selisih anomali: ${diff > 0 ? '+' : ''}${diff} koin.`,
      });
      generatedAlerts++;
    }
  }

  return {
    totalAudited: users.length,
    healthyCount: users.length - mismatches.length,
    mismatches,
    generatedAlerts,
  };
}
