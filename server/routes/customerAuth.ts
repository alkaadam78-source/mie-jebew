import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { getMySQLPool } from '../db/mysql';
import {
  generateCustomerToken,
  verifyCustomerAuth,
  CustomerAuthenticatedRequest,
  getCountdownToMidnightWIB,
} from '../middleware/customerAuth';
import { getTodayWIB, logSecurityEvent } from '../services/rewardService';

export const customerAuthRouter = Router();

/**
 * Normalisasi nomor telepon Indonesia (misal: 08123... -> 628123...)
 */
function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    return '62' + cleaned.substring(1);
  }
  if (cleaned.startsWith('8')) {
    return '62' + cleaned;
  }
  return cleaned;
}

// ==========================================
// POST /api/customer/auth/login-or-register
// Masuk atau Daftar Akun Customer secara Cepat
// ==========================================
customerAuthRouter.post('/login-or-register', async (req: Request, res: Response) => {
  try {
    const { phone, name } = req.body;
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'Nomor WhatsApp / HP wajib diisi.' });
    }

    const cleanPhone = normalizePhoneNumber(phone);
    if (cleanPhone.length < 10 || cleanPhone.length > 15 || !cleanPhone.startsWith('628')) {
      return res.status(400).json({ error: 'Nomor WhatsApp tidak valid. Masukkan nomor WhatsApp Indonesia aktif (contoh: 081234567890).' });
    }

    const hasName = Boolean(name && typeof name === 'string' && name.trim().length > 0);
    const cleanName = hasName ? (name as string).trim() : '';

    const todayWIB = getTodayWIB();
    const nowIso = new Date().toISOString();
    const pool = getMySQLPool();

    let user: any = null;

    // 1. Cek di MySQL jika tersedia
    if (pool) {
      try {
        const [rows]: any = await pool.execute(
          `SELECT id, phone, name, coins_balance, last_spin_wib_date FROM customer_users WHERE phone = ?`,
          [cleanPhone]
        );

        if (rows && rows.length > 0) {
          user = rows[0];
          // Update nama jika user mengisi nama baru
          if (cleanName && user.name !== cleanName) {
            await pool.execute(
              `UPDATE customer_users SET name = ?, updated_at = NOW() WHERE id = ?`,
              [cleanName, user.id]
            );
            user.name = cleanName;
          }
        }
      } catch (err: any) {
        console.warn('[CustomerAuth] MySQL query fallback to SQLite:', err.message);
      }
    }

    // 2. Cek di SQLite jika belum ditemukan di MySQL
    if (!user) {
      try {
        const sqliteUser = db.prepare(`SELECT * FROM customer_users WHERE phone = ?`).get(cleanPhone) as any;
        if (sqliteUser) {
          user = sqliteUser;
          if (cleanName && sqliteUser.name !== cleanName) {
            try {
              db.prepare(`UPDATE customer_users SET name = ?, updated_at = ? WHERE id = ?`).run(cleanName, nowIso, sqliteUser.id);
              user.name = cleanName;
            } catch {}
          }
        }
      } catch (sqliteErr: any) {
        console.warn('[CustomerAuth] SQLite query warning:', sqliteErr.message);
      }
    }

    // 3. Jika nomor BELUM TERDAFTAR dan user BELUM memasukkan nama (sedang di mode Login biasa):
    // Beri tahu frontend agar beralih ke form pendaftaran dengan ramah
    if (!user && !hasName) {
      return res.json({
        success: false,
        notRegistered: true,
        error: 'Nomor WhatsApp belum terdaftar. Silakan lengkapi nama Anda untuk membuat akun baru.',
      });
    }

    // 4. Jika nomor BELUM TERDAFTAR dan user SUDAH memasukkan nama (Daftar Akun Baru):
    if (!user && hasName) {
      if (cleanName.length < 3) {
        return res.status(400).json({ error: 'Nama asli wajib diisi (minimal 3 karakter).' });
      }

      const lettersCount = (cleanName.match(/[a-zA-Z]/g) || []).length;
      if (lettersCount < 3) {
        return res.status(400).json({ error: 'Nama asli harus mengandung minimal 3 huruf yang valid (contoh: Budi Santoso).' });
      }

      // Simpan ke MySQL jika ada
      if (pool) {
        try {
          const [insertRes]: any = await pool.execute(
            `INSERT INTO customer_users (phone, name, coins_balance, created_at, updated_at)
             VALUES (?, ?, 0, NOW(), NOW())`,
            [cleanPhone, cleanName]
          );
          user = {
            id: insertRes.insertId,
            phone: cleanPhone,
            name: cleanName,
            coins_balance: 0,
            last_spin_wib_date: null,
          };
        } catch (err: any) {
          console.warn('[CustomerAuth] MySQL insert fallback:', err.message);
        }
      }

      // Simpan ke SQLite
      if (!user) {
        try {
          const insertStmt = db.prepare(`
            INSERT INTO customer_users (phone, name, coins_balance, created_at, updated_at)
            VALUES (?, ?, 0, ?, ?)
          `).run(cleanPhone, cleanName, nowIso, nowIso);

          user = {
            id: insertStmt.lastInsertRowid,
            phone: cleanPhone,
            name: cleanName,
            coins_balance: 0,
            last_spin_wib_date: null,
          };
        } catch (sqliteErr: any) {
          console.warn('[CustomerAuth] SQLite insert fallback:', sqliteErr.message);
        }
      }

      // Fallback stateless serverless (Netlify cloud mode tanpa DB eksternal)
      if (!user) {
        user = {
          id: Date.now(),
          phone: cleanPhone,
          name: cleanName,
          coins_balance: 0,
          last_spin_wib_date: null,
        };
      }

      await logSecurityEvent(
        user.id,
        clientIp,
        'NEW_CUSTOMER_REGISTERED',
        `Pendaftaran pelanggan baru via WhatsApp: ${cleanPhone} (${cleanName})`,
        'info',
        userAgent
      );
    }

    // Safety fallback jika user masih null
    if (!user) {
      user = {
        id: Date.now(),
        phone: cleanPhone,
        name: cleanName || ('Pelanggan ' + cleanPhone.slice(-4)),
        coins_balance: 0,
        last_spin_wib_date: null,
      };
    }

    const token = generateCustomerToken({
      id: user.id,
      phone: user.phone,
      name: user.name,
    });

    const canSpinToday = user.last_spin_wib_date !== todayWIB;
    const countdown = getCountdownToMidnightWIB();

    res.json({
      success: true,
      message: 'Login berhasil!',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        coinsBalance: user.coins_balance || 0,
        lastSpinWibDate: user.last_spin_wib_date,
        canSpinToday,
      },
      countdown,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memproses login: ' + err.message });
  }
});

// ==========================================
// GET /api/customer/auth/me
// Cek Profil & Saldo Koin Customer Real-Time
// ==========================================
customerAuthRouter.get('/me', verifyCustomerAuth, (req: CustomerAuthenticatedRequest, res: Response) => {
  const countdown = getCountdownToMidnightWIB();
  res.json({
    success: true,
    user: req.customer,
    countdown,
  });
});

// ==========================================
// GET /api/customer/coins/history
// Riwayat Lengkap Mutasi Koin (Masuk & Keluar)
// ==========================================
customerAuthRouter.get('/coins/history', verifyCustomerAuth, async (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const userId = req.customer!.id;
    const pool = getMySQLPool();
    let history: any[] = [];

    if (pool) {
      try {
        const [rows]: any = await pool.execute(
          `SELECT id, type, amount, balance_before, balance_after, description, reference_id, created_at
           FROM coin_transactions
           WHERE user_id = ?
           ORDER BY id DESC
           LIMIT 50`,
          [userId]
        );
        history = rows || [];
      } catch {}
    }

    if (history.length === 0) {
      history = db.prepare(`
        SELECT id, type, amount, balance_before, balance_after, description, reference_id, created_at
        FROM coin_transactions
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT 50
      `).all(userId) as any[];
    }

    res.json({
      success: true,
      currentBalance: req.customer!.coinsBalance,
      history,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengambil riwayat koin: ' + err.message });
  }
});
