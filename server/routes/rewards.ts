import { Router, Response } from 'express';
import { db } from '../db/database';
import { getMySQLPool } from '../db/mysql';
import {
  verifyCustomerAuth,
  CustomerAuthenticatedRequest,
  getCountdownToMidnightWIB,
} from '../middleware/customerAuth';
import {
  executeServerSpin,
  executeServerRedeem,
  VOUCHER_PRICING,
  logSecurityEvent,
} from '../services/rewardService';
import { detectSpinWheelSpam, detectRapidRedemption } from '../services/antiFraudService';

export const rewardsRouter = Router();

// ==========================================
// GET /api/rewards/status (Publik)
// Informasi Status Reward & Countdown Reset 00:00 WIB
// ==========================================
rewardsRouter.get('/status', (_req, res: Response) => {
  const countdown = getCountdownToMidnightWIB();
  res.json({
    timezone: 'WIB (Asia/Jakarta, UTC+7)',
    resetSchedule: 'Setiap hari pukul 00:00 WIB',
    countdown,
    catalog: VOUCHER_PRICING,
    segments: SERVER_SPIN_SEGMENTS,
    serverTimestamp: Date.now(),
  });
});

// ==========================================
// POST /api/rewards/spin-wheel
// Putar Roda Keberuntungan (Server-Determined)
// Hanya bisa 1x per hari per akun (Reset 00:00 WIB)
// ==========================================
rewardsRouter.post('/spin-wheel', verifyCustomerAuth, async (req: CustomerAuthenticatedRequest, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || '';
  const customer = req.customer!;

  // Pengecekan Anomali Putaran Spin Spamming
  detectSpinWheelSpam(customer.id, customer.name, clientIp).catch(() => {});

  try {
    const result = await executeServerSpin(customer.id, clientIp, userAgent);
    res.json(result);
  } catch (err: any) {
    const status = err.message.includes('Permintaan sedang diproses')
      ? 429
      : err.message.includes('sudah menggunakan jatah')
      ? 400
      : 500;

    res.status(status).json({
      success: false,
      error: err.message || 'Gagal memproses putaran roda.',
      countdown: getCountdownToMidnightWIB(),
    });
  }
});

// ==========================================
// POST /api/rewards/redeem
// Tukar Koin Menjadi Voucher Diskon (Server-Validated)
// ==========================================
rewardsRouter.post('/redeem', verifyCustomerAuth, async (req: CustomerAuthenticatedRequest, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || '';
  const customer = req.customer!;
  const { rewardType } = req.body;

  if (!rewardType || typeof rewardType !== 'string') {
    return res.status(400).json({ error: 'Jenis reward voucher wajib dipilih.' });
  }

  // Pengecekan Anomali Rapid Redemption
  detectRapidRedemption(customer.id, customer.name, clientIp).catch(() => {});

  try {
    const result = await executeServerRedeem(customer.id, rewardType, clientIp, userAgent);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message || 'Gagal menukarkan voucher.',
    });
  }
});

// ==========================================
// GET /api/rewards/my-vouchers
// Ambil Semua Voucher Milik Customer
// ==========================================
rewardsRouter.get('/my-vouchers', verifyCustomerAuth, async (req: CustomerAuthenticatedRequest, res: Response) => {
  const customer = req.customer!;
  const pool = getMySQLPool();
  let vouchers: any[] = [];

  if (pool) {
    try {
      const [rows]: any = await pool.execute(
        `SELECT id, code, title, reward_type, discount_amount, cost_in_coins, is_used, created_at, used_at
         FROM vouchers
         WHERE user_id = ? OR user_identifier = ?
         ORDER BY created_at DESC`,
        [customer.id, customer.phone]
      );
      vouchers = rows || [];
    } catch {}
  }

  if (vouchers.length === 0) {
    vouchers = db.prepare(`
      SELECT id, code, title, reward_type, discount_amount, cost_in_coins, is_used, created_at, used_at
      FROM vouchers
      WHERE user_id = ? OR user_identifier = ?
      ORDER BY created_at DESC
    `).all(customer.id, customer.phone) as any[];
  }

  res.json({
    success: true,
    vouchers: vouchers.map((v) => ({
      id: v.id,
      code: v.code,
      title: v.title,
      type: v.reward_type,
      discountAmount: Number(v.discount_amount),
      costInCoins: Number(v.cost_in_coins),
      isUsed: Boolean(v.is_used),
      createdAt: v.created_at,
      usedAt: v.used_at,
    })),
  });
});

// ==========================================
// ADMIN ENDPOINTS (Pusat Voucher & Koin)
// ==========================================
import { verifyAuth, requireRole, logActivity, AuthenticatedRequest } from '../middleware/auth';
import {
  SERVER_SPIN_SEGMENTS,
  updateServerSpinSegments,
  updateServerVoucherPricing,
} from '../services/rewardService';

// GET /api/rewards/admin/settings - Pengaturan Spin Wheel & Voucher
rewardsRouter.get('/admin/settings', verifyAuth, (_req: AuthenticatedRequest, res: Response) => {
  res.json({
    segments: SERVER_SPIN_SEGMENTS,
    catalog: VOUCHER_PRICING,
    spinLimit: '1x per hari (Reset 00:00 WIB)',
  });
});

// PUT /api/rewards/admin/settings - Simpan Pengaturan Spin Wheel & Voucher
rewardsRouter.put('/admin/settings', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { segments, catalog } = req.body;

    if (segments && Array.isArray(segments)) {
      await updateServerSpinSegments(segments, req.user!.username);
    }

    if (catalog && typeof catalog === 'object') {
      await updateServerVoucherPricing(catalog, req.user!.username);
    }

    await logActivity(
      req.user!.username,
      'UPDATE',
      'rewards_settings',
      'spin_and_voucher',
      'Memperbarui hadiah roda keberuntungan (Spin Wheel), probabilitas %, dan katalog voucher diskon'
    );

    res.json({
      success: true,
      message: 'Pengaturan hadiah spin wheel dan katalog voucher berhasil diperbarui!',
      segments: SERVER_SPIN_SEGMENTS,
      catalog: VOUCHER_PRICING,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memperbarui pengaturan voucher & koin.' });
  }
});

// GET /api/rewards/admin/users - Daftar Pengguna & Saldo Koin
rewardsRouter.get('/admin/users', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { search, limit = '100' } = req.query;
  const maxLimit = Math.min(200, Math.max(1, parseInt(limit as string, 10) || 100));
  const pool = getMySQLPool();

  try {
    if (pool) {
      try {
        let sql = `
          SELECT cu.id, cu.name, cu.phone, cu.coins_balance, cu.last_spin_wib_date, cu.created_at,
                 COUNT(DISTINCT sh.id) as total_spins,
                 COUNT(DISTINCT v.id) as total_vouchers_claimed
          FROM customer_users cu
          LEFT JOIN spin_history sh ON cu.id = sh.user_id
          LEFT JOIN vouchers v ON cu.id = v.user_id
          WHERE 1=1
        `;
        const params: any[] = [];
        if (search) {
          sql += ` AND (cu.name LIKE ? OR cu.phone LIKE ?)`;
          const s = `%${search}%`;
          params.push(s, s);
        }
        sql += ` GROUP BY cu.id ORDER BY cu.coins_balance DESC LIMIT ?`;
        params.push(maxLimit);

        const [rows]: any = await pool.query(sql, params);
        return res.json({ users: rows, source: 'mysql' });
      } catch (err: any) {
        console.warn('[Rewards Admin] MySQL fetch fallback to SQLite:', err.message);
      }
    }

    let sqliteSql = `
      SELECT cu.id, cu.name, cu.phone, cu.coins_balance, cu.last_spin_wib_date, cu.created_at,
             COUNT(DISTINCT sh.id) as total_spins,
             COUNT(DISTINCT v.id) as total_vouchers_claimed
      FROM customer_users cu
      LEFT JOIN spin_history sh ON cu.id = sh.user_id
      LEFT JOIN vouchers v ON cu.id = v.user_id
      WHERE 1=1
    `;
    const sqliteParams: any[] = [];
    if (search) {
      sqliteSql += ` AND (cu.name LIKE ? OR cu.phone LIKE ?)`;
      const s = `%${search}%`;
      sqliteParams.push(s, s);
    }
    sqliteSql += ` GROUP BY cu.id ORDER BY cu.coins_balance DESC LIMIT ?`;
    sqliteParams.push(maxLimit);

    const users = db.prepare(sqliteSql).all(...sqliteParams);
    res.json({ users, source: 'sqlite' });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memuat data pelanggan & saldo koin.' });
  }
});

// POST /api/rewards/admin/adjust-coins - Penyesuaian Koin Pelanggan (Audit Logged)
rewardsRouter.post('/admin/adjust-coins', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  const { userId, amount, reason } = req.body;

  if (!userId || typeof amount !== 'number' || amount === 0) {
    return res.status(400).json({ error: 'User ID dan jumlah perubahan koin wajib diisi.' });
  }

  const cleanReason = (reason || 'Penyesuaian manual oleh admin').trim();
  const pool = getMySQLPool();

  try {
    let customer: any = null;
    if (pool) {
      try {
        const [rows]: any = await pool.query(`SELECT id, name, phone, coins_balance FROM customer_users WHERE id = ?`, [userId]);
        if (rows && rows.length > 0) customer = rows[0];
      } catch {}
    }
    if (!customer) {
      customer = db.prepare(`SELECT id, name, phone, coins_balance FROM customer_users WHERE id = ?`).get(userId);
    }

    if (!customer) {
      return res.status(404).json({ error: 'Pelanggan tidak ditemukan.' });
    }

    const prevBalance = Number(customer.coins_balance) || 0;
    const newBalance = Math.max(0, prevBalance + amount);
    const actualDiff = newBalance - prevBalance;

    // 1. Update MySQL
    if (pool) {
      try {
        await pool.execute(
          `UPDATE customer_users SET coins_balance = ?, updated_at = NOW() WHERE id = ?`,
          [newBalance, userId]
        );
        await pool.execute(
          `INSERT INTO coin_transactions (user_id, type, amount, balance_before, balance_after, description, reference_id, created_at)
           VALUES (?, 'admin_adjustment', ?, ?, ?, ?, ?, NOW())`,
          [
            userId,
            actualDiff,
            prevBalance,
            newBalance,
            `Admin (${req.user!.username}): ${cleanReason}`,
            `adj_${Date.now()}`,
          ]
        );
      } catch (err: any) {
        console.warn('[Adjust Coins] MySQL error:', err.message);
      }
    }

    // 2. Update SQLite
    db.prepare(`UPDATE customer_users SET coins_balance = ?, updated_at = ? WHERE id = ?`)
      .run(newBalance, new Date().toISOString(), userId);

    db.prepare(`
      INSERT INTO coin_transactions (user_id, type, amount, balance_before, balance_after, description, reference_id, created_at)
      VALUES (?, 'admin_adjustment', ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      actualDiff,
      prevBalance,
      newBalance,
      `Admin (${req.user!.username}): ${cleanReason}`,
      `adj_${Date.now()}`,
      new Date().toISOString()
    );

    // 3. Catat Audit Log
    const sign = actualDiff >= 0 ? `+${actualDiff}` : `${actualDiff}`;
    await logActivity(
      req.user!.username,
      'UPDATE',
      'customer_coins',
      String(userId),
      `Mengubah saldo koin ${customer.name} (${customer.phone}): ${sign} koin (dari ${prevBalance} ke ${newBalance}). Alasan: ${cleanReason}`
    );

    res.json({
      success: true,
      message: `Saldo koin ${customer.name} berhasil diperbarui (${sign} koin)!`,
      newBalance,
    });
  } catch (err: any) {
    console.error('[Adjust Coins] Error:', err);
    res.status(500).json({ error: 'Gagal menyesuaikan saldo koin.' });
  }
});

// GET /api/rewards/admin/redemptions - Riwayat Penukaran Voucher
rewardsRouter.get('/admin/redemptions', verifyAuth, async (_req: AuthenticatedRequest, res: Response) => {
  const pool = getMySQLPool();
  try {
    if (pool) {
      try {
        const [rows]: any = await pool.query(`
          SELECT v.*, cu.name as customer_name, cu.phone as customer_phone
          FROM vouchers v
          LEFT JOIN customer_users cu ON v.user_id = cu.id
          ORDER BY v.created_at DESC
          LIMIT 100
        `);
        return res.json({ redemptions: rows, source: 'mysql' });
      } catch {}
    }

    const redemptions = db.prepare(`
      SELECT v.*, cu.name as customer_name, cu.phone as customer_phone
      FROM vouchers v
      LEFT JOIN customer_users cu ON v.user_id = cu.id
      ORDER BY v.created_at DESC
      LIMIT 100
    `).all();

    res.json({ redemptions, source: 'sqlite' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat riwayat penukaran voucher.' });
  }
});

