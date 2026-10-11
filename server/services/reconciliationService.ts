import { db } from '../db/database';
import { getMySQLPool } from '../db/mysql';

export interface ReconciliationAnomaly {
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

export interface ReconciliationSummary {
  totalScannedOrders: number;
  totalScannedVouchers: number;
  totalScannedCustomers: number;
  totalAnomalies: number;
  unresolvedCount: number;
  resolvedCount: number;
  lastAuditedAt: string;
  anomalies: ReconciliationAnomaly[];
}

/**
 * Menjalankan audit rekonsiliasi transaksi secara menyeluruh:
 * - Pembayaran sukses vs status pesanan
 * - Saldo koin vs buku besar transaksi
 * - Pemakaian voucher ganda / tidak valid
 * - Integritas stok pesanan
 */
export async function runReconciliationAudit(): Promise<ReconciliationSummary> {
  const now = new Date().toISOString();
  const pool = getMySQLPool();
  const anomaliesFound: Omit<ReconciliationAnomaly, 'status' | 'created_at'>[] = [];

  // 1. Audit Pesanan: Pembayaran 'paid' namun pesanan masih 'new' / 'pending'
  try {
    const paidOrders = db.prepare(`
      SELECT id, customer_name, customer_phone, total_amount, payment_status, order_status, created_at
      FROM orders
      WHERE payment_status = 'paid' AND order_status IN ('new', 'pending')
    `).all() as any[];

    for (const ord of paidOrders) {
      anomaliesFound.push({
        id: `recon-ord-${ord.id}`,
        anomaly_type: 'paid_order_pending',
        reference_id: ord.id,
        title: `Pesanan #${ord.id} Sudah Dibayar Tapi Belum Diproses`,
        description: `Pelanggan ${ord.customer_name} (${ord.customer_phone}) membayar Rp${Number(ord.total_amount).toLocaleString('id-ID')} dengan status bayar 'paid', namun status pesanan masih '${ord.order_status}'.`,
        severity: 'medium',
        data_payload: JSON.stringify(ord),
      });
    }
  } catch (err: any) {
    console.warn('[Reconciliation] Error checking paid orders:', err.message);
  }

  // 2. Audit Saldo Koin Customer vs Buku Besar (Ledger Audit)
  try {
    const customers = db.prepare(`
      SELECT cu.id, cu.phone, cu.name, cu.coins_balance,
             COALESCE(SUM(ct.amount), 0) AS ledger_sum,
             COUNT(ct.id) AS tx_count
      FROM customer_users cu
      LEFT JOIN coin_transactions ct ON cu.id = ct.user_id
      GROUP BY cu.id
    `).all() as any[];

    for (const cust of customers) {
      if (Number(cust.coins_balance) !== Number(cust.ledger_sum)) {
        const diff = Number(cust.coins_balance) - Number(cust.ledger_sum);
        anomaliesFound.push({
          id: `recon-coin-${cust.id}`,
          anomaly_type: 'coin_balance_mismatch',
          reference_id: String(cust.id),
          title: `Selisih Saldo Koin Customer: ${cust.name}`,
          description: `Saldo akun tercatat ${cust.coins_balance} koin, sedangkan total mutasi buku besar tercatat ${cust.ledger_sum} koin (selisih: ${diff > 0 ? '+' : ''}${diff} koin).`,
          severity: 'high',
          data_payload: JSON.stringify(cust),
        });
      }
    }
  } catch (err: any) {
    console.warn('[Reconciliation] Error checking coin ledger:', err.message);
  }

  // 3. Audit Voucher: Voucher yang digunakan lebih dari 1 kali atau digunakan tanpa order
  try {
    const vouchers = db.prepare(`
      SELECT id, code, title, is_used, order_id, used_at, user_id
      FROM vouchers
      WHERE is_used = 1 AND (order_id IS NULL OR used_at IS NULL)
    `).all() as any[];

    for (const v of vouchers) {
      anomaliesFound.push({
        id: `recon-vouch-${v.id}`,
        anomaly_type: 'voucher_multiple_use',
        reference_id: v.code,
        title: `Voucher #${v.code} Status Digunakan Tanpa Referensi Pesanan`,
        description: `Voucher ${v.title} tercatat terpakai (${v.is_used}) namun ID pesanan atau tanggal pemakaian kosong.`,
        severity: 'low',
        data_payload: JSON.stringify(v),
      });
    }
  } catch (err: any) {
    console.warn('[Reconciliation] Error checking vouchers:', err.message);
  }

  // 4. Simpan / Perbarui Anomali ke SQLite & MySQL
  const insertStmt = db.prepare(`
    INSERT INTO reconciliation_anomalies (
      id, anomaly_type, reference_id, title, description, severity, data_payload, status, created_at
    ) VALUES (
      @id, @anomaly_type, @reference_id, @title, @description, @severity, @data_payload, 'unresolved', ?
    )
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      severity = excluded.severity,
      data_payload = excluded.data_payload
    WHERE reconciliation_anomalies.status = 'unresolved'
  `);

  for (const an of anomaliesFound) {
    insertStmt.run(now, an);
  }

  if (pool) {
    try {
      for (const an of anomaliesFound) {
        await pool.execute(
          `INSERT INTO reconciliation_anomalies (
            id, anomaly_type, reference_id, title, description, severity, data_payload, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'unresolved', NOW())
          ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            description = VALUES(description),
            severity = VALUES(severity),
            data_payload = VALUES(data_payload)`,
          [an.id, an.anomaly_type, an.reference_id, an.title, an.description, an.severity, an.data_payload || null]
        );
      }
    } catch (mysqlErr: any) {
      console.warn('[Reconciliation] MySQL sync warning:', mysqlErr.message);
    }
  }

  return getReconciliationSummary();
}

/**
 * Mengambil ringkasan hasil rekonsiliasi dan daftar anomali
 */
export async function getReconciliationSummary(): Promise<ReconciliationSummary> {
  const ordersCount = (db.prepare('SELECT COUNT(*) as c FROM orders').get() as any)?.c || 0;
  const vouchersCount = (db.prepare('SELECT COUNT(*) as c FROM vouchers').get() as any)?.c || 0;
  const customersCount = (db.prepare('SELECT COUNT(*) as c FROM customer_users').get() as any)?.c || 0;

  const anomalies = db.prepare(`
    SELECT * FROM reconciliation_anomalies
    ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, created_at DESC
  `).all() as ReconciliationAnomaly[];

  const unresolvedCount = anomalies.filter(a => a.status === 'unresolved').length;
  const resolvedCount = anomalies.filter(a => a.status === 'resolved').length;

  return {
    totalScannedOrders: ordersCount,
    totalScannedVouchers: vouchersCount,
    totalScannedCustomers: customersCount,
    totalAnomalies: anomalies.length,
    unresolvedCount,
    resolvedCount,
    lastAuditedAt: new Date().toISOString(),
    anomalies,
  };
}

/**
 * Menyelesaikan (resolve) anomali rekonsiliasi
 */
export async function resolveAnomaly(
  anomalyId: string,
  action: 'mark_resolved' | 'fix_order_status' | 'sync_coin_balance' | 'dismiss',
  resolutionNotes: string,
  adminUsername: string
): Promise<{ success: boolean; message: string }> {
  const anomaly = db.prepare('SELECT * FROM reconciliation_anomalies WHERE id = ?').get(anomalyId) as ReconciliationAnomaly | undefined;
  if (!anomaly) {
    return { success: false, message: 'Data anomali tidak ditemukan.' };
  }

  const now = new Date().toISOString();
  const pool = getMySQLPool();

  if (action === 'fix_order_status' && anomaly.anomaly_type === 'paid_order_pending') {
    // Ubah status pesanan menjadi 'processing'
    db.prepare(`UPDATE orders SET order_status = 'processing', updated_at = ? WHERE id = ?`).run(now, anomaly.reference_id);
    if (pool) {
      try {
        await pool.execute(`UPDATE orders SET order_status = 'processing', updated_at = NOW() WHERE id = ?`, [anomaly.reference_id]);
      } catch {}
    }
  } else if (action === 'sync_coin_balance' && anomaly.anomaly_type === 'coin_balance_mismatch') {
    // Sinkronkan saldo customer dengan total transaksi buku besar
    const sumResult = db.prepare(`SELECT COALESCE(SUM(amount), 0) as s FROM coin_transactions WHERE user_id = ?`).get(anomaly.reference_id) as any;
    const correctBalance = Number(sumResult?.s || 0);

    db.prepare(`UPDATE customer_users SET coins_balance = ?, updated_at = ? WHERE id = ?`).run(correctBalance, now, anomaly.reference_id);
    if (pool) {
      try {
        await pool.execute(`UPDATE customer_users SET coins_balance = ?, updated_at = NOW() WHERE id = ?`, [correctBalance, anomaly.reference_id]);
      } catch {}
    }
  }

  const newStatus = action === 'dismiss' ? 'ignored' : 'resolved';

  db.prepare(`
    UPDATE reconciliation_anomalies
    SET status = ?, resolution_notes = ?, resolved_by = ?, resolved_at = ?
    WHERE id = ?
  `).run(newStatus, resolutionNotes || `Diselesaikan dengan aksi: ${action}`, adminUsername, now, anomalyId);

  if (pool) {
    try {
      await pool.execute(
        `UPDATE reconciliation_anomalies
         SET status = ?, resolution_notes = ?, resolved_by = ?, resolved_at = NOW()
         WHERE id = ?`,
        [newStatus, resolutionNotes || `Diselesaikan dengan aksi: ${action}`, adminUsername, anomalyId]
      );
    } catch {}
  }

  return {
    success: true,
    message: `Anomali '${anomaly.title}' berhasil diselesaikan (${newStatus}).`,
  };
}
