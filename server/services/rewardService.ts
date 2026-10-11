import { db } from '../db/database';
import { getMySQLPool } from '../db/mysql';

export interface SpinResult {
  success: boolean;
  segmentIndex: number;
  coinsWon: number;
  label: string;
  newBalance: number;
  message: string;
  nextReset: string;
}

export interface RedeemResult {
  success: boolean;
  message: string;
  voucher?: {
    id: string;
    code: string;
    title: string;
    rewardType: string;
    discountAmount: number;
    costInCoins: number;
  };
  newBalance?: number;
}

import crypto from 'crypto';

// 8 Segmen Roda Keberuntungan (Server-Determined)
export let SERVER_SPIN_SEGMENTS = [
  { index: 0, coins: 4, label: '4 Koin', weight: 60, color: '#fde047' },
  { index: 1, coins: 8, label: '8 Koin', weight: 50, color: '#f97316' },
  { index: 2, coins: 16, label: '16 Koin', weight: 10, color: '#e11d48' },
  { index: 3, coins: 4, label: '4 Koin', weight: 60, color: '#fde047' },
  { index: 4, coins: 8, label: '8 Koin', weight: 50, color: '#f97316' },
  { index: 5, coins: 32, label: '32 Koin', weight: 3, color: '#8b5cf6' },
  { index: 6, coins: 4, label: '4 Koin', weight: 60, color: '#fde047' },
  { index: 7, coins: 64, label: '64 Koin', weight: 0.1, color: '#10b981' },
];

export let VOUCHER_PRICING: Record<string, { title: string; cost: number; discount: number; stockQuota?: number; validityDays?: number }> = {
  discount_5000: {
    title: 'Voucher Diskon Rp 5.000',
    cost: 300,
    discount: 5000,
    stockQuota: 100,
    validityDays: 14,
  },
  discount_5500: {
    title: 'Voucher Diskon Rp 5.500',
    cost: 400,
    discount: 5500,
    stockQuota: 75,
    validityDays: 14,
  },
  free_mie_original: {
    title: 'FREE 1 Mie Jebew Original',
    cost: 2500,
    discount: 15000,
    stockQuota: 20,
    validityDays: 30,
  },
};

/**
 * Inisialisasi pengaturan hadiah dari database (SQLite + MySQL) saat startup
 */
export function initRewardSettingsFromDB() {
  try {
    const rowSegments = db.prepare("SELECT setting_value FROM system_settings WHERE setting_key = 'spin_wheel_segments'").get() as any;
    if (rowSegments && rowSegments.setting_value) {
      const parsed = JSON.parse(rowSegments.setting_value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        SERVER_SPIN_SEGMENTS = parsed;
      }
    }

    const rowPricing = db.prepare("SELECT setting_value FROM system_settings WHERE setting_key = 'voucher_pricing'").get() as any;
    if (rowPricing && rowPricing.setting_value) {
      const parsed = JSON.parse(rowPricing.setting_value);
      if (parsed && typeof parsed === 'object') {
        VOUCHER_PRICING = parsed;
      }
    }
  } catch (err: any) {
    console.warn('[RewardService] Init settings from DB warning:', err.message);
  }
}

// Jalankan inisialisasi awal
initRewardSettingsFromDB();

export async function updateServerSpinSegments(newSegments: typeof SERVER_SPIN_SEGMENTS, adminUser: string = 'admin') {
  if (Array.isArray(newSegments) && newSegments.length > 0) {
    SERVER_SPIN_SEGMENTS = newSegments;
    const strVal = JSON.stringify(newSegments);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO system_settings (setting_key, setting_value, updated_by, updated_at)
      VALUES ('spin_wheel_segments', ?, ?, ?)
      ON CONFLICT(setting_key) DO UPDATE SET
        setting_value = excluded.setting_value,
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at
    `).run(strVal, adminUser, now);

    const pool = getMySQLPool();
    if (pool) {
      try {
        await pool.execute(
          `INSERT INTO system_settings (setting_key, setting_value, updated_by, updated_at)
           VALUES ('spin_wheel_segments', ?, ?, NOW())
           ON DUPLICATE KEY UPDATE
             setting_value = VALUES(setting_value),
             updated_by = VALUES(updated_by),
             updated_at = NOW()`,
          [strVal, adminUser]
        );
      } catch {}
    }
  }
}

export async function updateServerVoucherPricing(newPricing: typeof VOUCHER_PRICING, adminUser: string = 'admin') {
  if (newPricing && typeof newPricing === 'object') {
    VOUCHER_PRICING = newPricing;
    const strVal = JSON.stringify(newPricing);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO system_settings (setting_key, setting_value, updated_by, updated_at)
      VALUES ('voucher_pricing', ?, ?, ?)
      ON CONFLICT(setting_key) DO UPDATE SET
        setting_value = excluded.setting_value,
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at
    `).run(strVal, adminUser, now);

    const pool = getMySQLPool();
    if (pool) {
      try {
        await pool.execute(
          `INSERT INTO system_settings (setting_key, setting_value, updated_by, updated_at)
           VALUES ('voucher_pricing', ?, ?, NOW())
           ON DUPLICATE KEY UPDATE
             setting_value = VALUES(setting_value),
             updated_by = VALUES(updated_by),
             updated_at = NOW()`,
          [strVal, adminUser]
        );
      } catch {}
    }
  }
}

// In-Memory Mutex Lock untuk mencegah spam klik / race condition
const activeSpinLocks = new Set<number>();
const activeRedeemLocks = new Set<number>();


/**
 * Mendapatkan tanggal saat ini di zona waktu WIB (Asia/Jakarta)
 * Format: "YYYY-MM-DD"
 */
export function getTodayWIB(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now); // Contoh: "2026-10-11"
}

/**
 * Mencatat log keamanan & deteksi anomali (MySQL + SQLite)
 */
export async function logSecurityEvent(
  userId: number | null,
  ip: string,
  actionType: string,
  description: string,
  severity: 'info' | 'warning' | 'critical' = 'warning',
  userAgent?: string
): Promise<void> {
  const now = new Date().toISOString();
  const cleanIp = ip || 'unknown';
  const cleanAgent = (userAgent || '').substring(0, 250);

  // 1. Catat ke SQLite
  try {
    db.prepare(`
      INSERT INTO security_logs (user_id, ip_address, action_type, description, severity, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, cleanIp, actionType, description, severity, cleanAgent, now);
  } catch {}

  // 2. Catat ke MySQL (phpMyAdmin) jika terhubung
  const pool = getMySQLPool();
  if (pool) {
    try {
      await pool.execute(
        `INSERT INTO security_logs (user_id, ip_address, action_type, description, severity, user_agent, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [userId, cleanIp, actionType, description, severity, cleanAgent]
      );
    } catch {}
  }
}

/**
 * Mengundi segmen di server menggunakan CSPRNG (crypto.randomInt) dan bobot probabilitas yang ditentukan
 */
function pickRandomSpinSegment(): typeof SERVER_SPIN_SEGMENTS[0] {
  const totalWeight = SERVER_SPIN_SEGMENTS.reduce((acc, s) => acc + s.weight, 0);
  const precision = 1000000;
  const randomFactor = crypto.randomInt(0, precision) / precision;
  let randomVal = randomFactor * totalWeight;

  for (const seg of SERVER_SPIN_SEGMENTS) {
    if (randomVal < seg.weight) {
      return seg;
    }
    randomVal -= seg.weight;
  }
  return SERVER_SPIN_SEGMENTS[0];
}

/**
 * Eksekusi Putar Roda di Server dengan Validasi Penuh & Database Transaction
 */
export async function executeServerSpin(
  userId: number,
  ip: string,
  userAgent: string
): Promise<SpinResult> {
  // 1. Cek Mutex (Anti-Spam / Cegah 2 request bersamaan)
  if (activeSpinLocks.has(userId)) {
    await logSecurityEvent(
      userId,
      ip,
      'CONCURRENT_SPIN_BLOCKED',
      `Percobaan spin berulang dalam waktu bersamaan untuk user_id: ${userId}`,
      'warning',
      userAgent
    );
    throw new Error('Permintaan sedang diproses. Mohon jangan klik berulang kali.');
  }

  activeSpinLocks.add(userId);

  try {
    const todayWIB = getTodayWIB();
    const pool = getMySQLPool();

    // ==========================================
    // JALUR MYSQL (phpMyAdmin)
    // ==========================================
    if (pool) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        // Ambil data user dengan row-lock FOR UPDATE
        const [rows]: any = await conn.execute(
          `SELECT id, name, phone, coins_balance, last_spin_wib_date FROM customer_users WHERE id = ? FOR UPDATE`,
          [userId]
        );

        if (!rows || rows.length === 0) {
          await conn.rollback();
          throw new Error('Akun pengguna tidak ditemukan.');
        }

        const user = rows[0];

        // Validasi batasan 1x sehari (Reset 00:00 WIB)
        if (user.last_spin_wib_date === todayWIB) {
          await conn.rollback();
          await logSecurityEvent(
            userId,
            ip,
            'SPIN_LIMIT_REACHED',
            `User ${user.phone} (${user.name}) mencoba spin lebih dari 1x pada tanggal WIB ${todayWIB}`,
            'info',
            userAgent
          );
          throw new Error('Kamu sudah menggunakan jatah putaran hari ini. Reset setiap pukul 00:00 WIB!');
        }

        // Tentukan hasil di server
        const winningSegment = pickRandomSpinSegment();
        const coinsWon = winningSegment.coins;
        const newBalance = user.coins_balance + coinsWon;

        // 1. Update user balance & last_spin_wib_date
        await conn.execute(
          `UPDATE customer_users SET coins_balance = ?, last_spin_wib_date = ?, updated_at = NOW() WHERE id = ?`,
          [newBalance, todayWIB, userId]
        );

        // 2. Insert spin_history
        await conn.execute(
          `INSERT INTO spin_history (user_id, user_identifier, coins_won, segment_label, ip_address, user_agent, wib_date, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [userId, user.phone, coinsWon, winningSegment.label, ip, userAgent.substring(0, 250), todayWIB]
        );

        // 3. Insert coin_transactions (Buku Besar Mutasi Koin Masuk)
        await conn.execute(
          `INSERT INTO coin_transactions (user_id, type, amount, balance_before, balance_after, description, reference_id, ip_address, created_at)
           VALUES (?, 'spin_reward', ?, ?, ?, ?, ?, ?, NOW())`,
          [
            userId,
            coinsWon,
            user.coins_balance,
            newBalance,
            `Hadiah Harian Roda Keberuntungan: +${coinsWon} Koin`,
            `spin_${todayWIB}`,
            ip,
          ]
        );

        await conn.commit();

        // Sinkronkan juga ke SQLite lokal agar kedua database selalu up-to-date
        try {
          const nowIso = new Date().toISOString();
          db.prepare(`UPDATE customer_users SET coins_balance = ?, last_spin_wib_date = ?, updated_at = ? WHERE phone = ? OR id = ?`)
            .run(newBalance, todayWIB, nowIso, user.phone, userId);
          db.prepare(`
            INSERT OR IGNORE INTO spin_history (user_id, user_identifier, coins_won, segment_label, ip_address, user_agent, wib_date, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(userId, user.phone, coinsWon, winningSegment.label, ip, userAgent.substring(0, 250), todayWIB, nowIso);
          db.prepare(`
            INSERT INTO coin_transactions (user_id, type, amount, balance_before, balance_after, description, reference_id, ip_address, created_at)
            VALUES (?, 'spin_reward', ?, ?, ?, ?, ?, ?, ?)
          `).run(userId, coinsWon, user.coins_balance, newBalance, `Hadiah Harian Roda Keberuntungan: +${coinsWon} Koin`, `spin_${todayWIB}`, ip, nowIso);
        } catch {}

        return {
          success: true,
          segmentIndex: winningSegment.index,
          coinsWon,
          label: winningSegment.label,
          newBalance,
          message: `Selamat ${user.name}! Kamu mendapatkan ${winningSegment.label}!`,
          nextReset: 'Pukul 00:00 WIB besok',
        };
      } catch (err: any) {
        await conn.rollback();
        if (err.code === 'ER_DUP_ENTRY' || (err.message && err.message.includes('uq_spin_user_wib_date'))) {
          throw new Error('Kamu sudah menggunakan jatah putaran hari ini. Reset setiap pukul 00:00 WIB!');
        }
        throw err;
      } finally {
        conn.release();
      }
    }

    // ==========================================
    // JALUR FALLBACK SQLITE
    // ==========================================
    const user = db.prepare(`SELECT * FROM customer_users WHERE id = ?`).get(userId) as any;
    if (!user) {
      throw new Error('Akun pengguna tidak ditemukan.');
    }

    if (user.last_spin_wib_date === todayWIB) {
      await logSecurityEvent(
        userId,
        ip,
        'SPIN_LIMIT_REACHED',
        `User ${user.phone} (${user.name}) mencoba spin lebih dari 1x pada tanggal WIB ${todayWIB}`,
        'info',
        userAgent
      );
      throw new Error('Kamu sudah menggunakan jatah putaran hari ini. Reset setiap pukul 00:00 WIB!');
    }

    const winningSegment = pickRandomSpinSegment();
    const coinsWon = winningSegment.coins;
    const newBalance = (user.coins_balance || 0) + coinsWon;
    const nowIso = new Date().toISOString();

    const runTransaction = db.transaction(() => {
      db.prepare(`
        UPDATE customer_users
        SET coins_balance = ?, last_spin_wib_date = ?, updated_at = ?
        WHERE id = ?
      `).run(newBalance, todayWIB, nowIso, userId);

      db.prepare(`
        INSERT INTO spin_history (user_id, user_identifier, coins_won, segment_label, ip_address, user_agent, wib_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, user.phone, coinsWon, winningSegment.label, ip, userAgent.substring(0, 250), todayWIB, nowIso);

      db.prepare(`
        INSERT INTO coin_transactions (user_id, type, amount, balance_before, balance_after, description, reference_id, ip_address, created_at)
        VALUES (?, 'spin_reward', ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        coinsWon,
        user.coins_balance || 0,
        newBalance,
        `Hadiah Harian Roda Keberuntungan: +${coinsWon} Koin`,
        `spin_${todayWIB}`,
        ip,
        nowIso
      );
    });

    try {
      runTransaction();
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || (err.message && err.message.includes('UNIQUE constraint failed'))) {
        throw new Error('Kamu sudah menggunakan jatah putaran hari ini. Reset setiap pukul 00:00 WIB!');
      }
      throw err;
    }

    return {
      success: true,
      segmentIndex: winningSegment.index,
      coinsWon,
      label: winningSegment.label,
      newBalance,
      message: `Selamat ${user.name}! Kamu mendapatkan ${winningSegment.label}!`,
      nextReset: 'Pukul 00:00 WIB besok',
    };
  } finally {
    activeSpinLocks.delete(userId);
  }
}

/**
 * Eksekusi Penukaran Koin (Voucher Redeem) di Server dengan Database Transaction
 */
export async function executeServerRedeem(
  userId: number,
  rewardType: string,
  ip: string,
  userAgent?: string
): Promise<RedeemResult> {
  const itemConfig = VOUCHER_PRICING[rewardType];
  if (!itemConfig) {
    throw new Error('Jenis voucher tidak valid.');
  }

  // 1. Cek Mutex (Anti-Spam / Double Spending)
  if (activeRedeemLocks.has(userId)) {
    throw new Error('Permintaan penukaran sedang diproses. Mohon tunggu sejenak.');
  }

  activeRedeemLocks.add(userId);

  try {
    const pool = getMySQLPool();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    let prefix = 'JEBEW5K';
    if (rewardType === 'discount_5500') prefix = 'JEBEW55K';
    if (rewardType === 'free_mie_original') prefix = 'FREEJEBEW';

    const voucherId = `vch_${Date.now()}_${randomSuffix}`;
    const voucherCode = `${prefix}-${randomSuffix}`;

    // ==========================================
    // JALUR MYSQL (phpMyAdmin)
    // ==========================================
    if (pool) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        // Row-lock user
        const [rows]: any = await conn.execute(
          `SELECT id, name, phone, coins_balance FROM customer_users WHERE id = ? FOR UPDATE`,
          [userId]
        );

        if (!rows || rows.length === 0) {
          await conn.rollback();
          throw new Error('Akun pengguna tidak ditemukan.');
        }

        const user = rows[0];

        // Validasi Saldo Koin di Server
        if (user.coins_balance < itemConfig.cost) {
          await conn.rollback();
          await logSecurityEvent(
            userId,
            ip,
            'INSUFFICIENT_COINS_REDEEM',
            `User ${user.phone} (${user.name}) mencoba menukar ${itemConfig.title} dengan saldo tidak cukup: ${user.coins_balance}/${itemConfig.cost} koin`,
            'warning',
            userAgent
          );
          throw new Error(`Saldo koin tidak mencukupi (${user.coins_balance}/${itemConfig.cost} koin).`);
        }

        const newBalance = user.coins_balance - itemConfig.cost;

        // 1. Potong saldo koin
        await conn.execute(
          `UPDATE customer_users SET coins_balance = ?, updated_at = NOW() WHERE id = ?`,
          [newBalance, userId]
        );

        // 2. Simpan voucher ke tabel vouchers
        await conn.execute(
          `INSERT INTO vouchers (id, user_id, code, title, reward_type, discount_amount, cost_in_coins, user_identifier, is_used, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
          [
            voucherId,
            userId,
            voucherCode,
            itemConfig.title,
            rewardType,
            itemConfig.discount,
            itemConfig.cost,
            user.phone,
          ]
        );

        // 3. Catat ke coin_transactions (Buku Besar Mutasi Koin Keluar / Debit)
        await conn.execute(
          `INSERT INTO coin_transactions (user_id, type, amount, balance_before, balance_after, description, reference_id, ip_address, created_at)
           VALUES (?, 'voucher_redeem', ?, ?, ?, ?, ?, ?, NOW())`,
          [
            userId,
            -itemConfig.cost,
            user.coins_balance,
            newBalance,
            `Penukaran Voucher: ${itemConfig.title} (-${itemConfig.cost} Koin)`,
            voucherCode,
            ip,
          ]
        );

        await conn.commit();

        return {
          success: true,
          message: `Berhasil menukarkan ${itemConfig.cost} koin dengan ${itemConfig.title}!`,
          voucher: {
            id: voucherId,
            code: voucherCode,
            title: itemConfig.title,
            rewardType,
            discountAmount: itemConfig.discount,
            costInCoins: itemConfig.cost,
          },
          newBalance,
        };
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    }

    // ==========================================
    // JALUR FALLBACK SQLITE
    // ==========================================
    const user = db.prepare(`SELECT * FROM customer_users WHERE id = ?`).get(userId) as any;
    if (!user) {
      throw new Error('Akun pengguna tidak ditemukan.');
    }

    if ((user.coins_balance || 0) < itemConfig.cost) {
      await logSecurityEvent(
        userId,
        ip,
        'INSUFFICIENT_COINS_REDEEM',
        `User ${user.phone} (${user.name}) mencoba menukar ${itemConfig.title} dengan saldo tidak cukup: ${user.coins_balance || 0}/${itemConfig.cost} koin`,
        'warning',
        userAgent
      );
      throw new Error(`Saldo koin tidak mencukupi (${user.coins_balance || 0}/${itemConfig.cost} koin).`);
    }

    const newBalance = user.coins_balance - itemConfig.cost;
    const nowIso = new Date().toISOString();

    const runRedeemTx = db.transaction(() => {
      db.prepare(`
        UPDATE customer_users SET coins_balance = ?, updated_at = ? WHERE id = ?
      `).run(newBalance, nowIso, userId);

      db.prepare(`
        INSERT INTO vouchers (id, user_id, code, title, reward_type, discount_amount, cost_in_coins, user_identifier, is_used, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(
        voucherId,
        userId,
        voucherCode,
        itemConfig.title,
        rewardType,
        itemConfig.discount,
        itemConfig.cost,
        user.phone,
        nowIso
      );

      db.prepare(`
        INSERT INTO coin_transactions (user_id, type, amount, balance_before, balance_after, description, reference_id, ip_address, created_at)
        VALUES (?, 'voucher_redeem', ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        -itemConfig.cost,
        user.coins_balance,
        newBalance,
        `Penukaran Voucher: ${itemConfig.title} (-${itemConfig.cost} Koin)`,
        voucherCode,
        ip,
        nowIso
      );
    });

    runRedeemTx();

    return {
      success: true,
      message: `Berhasil menukarkan ${itemConfig.cost} koin dengan ${itemConfig.title}!`,
      voucher: {
        id: voucherId,
        code: voucherCode,
        title: itemConfig.title,
        rewardType,
        discountAmount: itemConfig.discount,
        costInCoins: itemConfig.cost,
      },
      newBalance,
    };
  } finally {
    activeRedeemLocks.delete(userId);
  }
}
