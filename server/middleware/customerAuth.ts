import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/database';
import { getMySQLPool } from '../db/mysql';
import { getTodayWIB } from '../services/rewardService';

export const CUSTOMER_JWT_SECRET = process.env.CUSTOMER_JWT_SECRET || 'mie_jebew_customer_secret_token_2026';

export interface CustomerUserPayload {
  id: number;
  phone: string;
  name: string;
}

export interface CustomerAuthenticatedRequest extends Request {
  customer?: {
    id: number;
    phone: string;
    name: string;
    coinsBalance: number;
    lastSpinWibDate: string | null;
    canSpinToday: boolean;
  };
}

export function generateCustomerToken(payload: CustomerUserPayload): string {
  return jwt.sign(payload, CUSTOMER_JWT_SECRET, { expiresIn: '30d' });
}

export async function verifyCustomerAuth(
  req: CustomerAuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Silakan login terlebih dahulu untuk mengakses fitur ini.',
      code: 'AUTH_REQUIRED',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, CUSTOMER_JWT_SECRET) as CustomerUserPayload;
    const pool = getMySQLPool();
    const todayWIB = getTodayWIB();

    let userData: any = null;

    if (pool) {
      try {
        const [rows]: any = await pool.execute(
          `SELECT id, phone, name, coins_balance, last_spin_wib_date FROM customer_users WHERE id = ?`,
          [decoded.id]
        );
        if (rows && rows.length > 0) {
          userData = rows[0];
        }
      } catch {}
    }

    if (!userData) {
      userData = db.prepare(
        `SELECT id, phone, name, coins_balance, last_spin_wib_date FROM customer_users WHERE id = ?`
      ).get(decoded.id) as any;
    }

    if (!userData) {
      return res.status(401).json({ error: 'Akun pelanggan tidak ditemukan.', code: 'USER_NOT_FOUND' });
    }

    const canSpinToday = userData.last_spin_wib_date !== todayWIB;

    req.customer = {
      id: userData.id,
      phone: userData.phone,
      name: userData.name,
      coinsBalance: userData.coins_balance || 0,
      lastSpinWibDate: userData.last_spin_wib_date || null,
      canSpinToday,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Sesi login telah kedaluwarsa. Silakan masuk kembali.',
      code: 'TOKEN_EXPIRED',
    });
  }
}

/**
 * Menghitung sisa waktu (milidetik, jam, menit, detik) menuju reset jam 00:00 WIB berikutnya
 */
export function getCountdownToMidnightWIB(): {
  msRemaining: number;
  hours: number;
  minutes: number;
  seconds: number;
  formattedText: string;
} {
  const now = new Date();
  const nowWIB = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const midnightWIB = new Date(nowWIB);
  midnightWIB.setHours(24, 0, 0, 0);

  const msRemaining = Math.max(0, midnightWIB.getTime() - nowWIB.getTime());
  const totalSeconds = Math.floor(msRemaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  const formattedText = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return {
    msRemaining,
    hours,
    minutes,
    seconds,
    formattedText,
  };
}
