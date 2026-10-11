import { Request, Response, NextFunction } from 'express';

interface AttemptRecord {
  count: number;
  resetAt: number;
}

const loginAttempts = new Map<string, AttemptRecord>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function loginRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (record) {
    if (now > record.resetAt) {
      loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
      return next();
    }

    if (record.count >= MAX_ATTEMPTS) {
      const waitMinutes = Math.ceil((record.resetAt - now) / 60000);
      return res.status(429).json({
        error: `Terlalu banyak percobaan login yang gagal. Silakan coba lagi dalam ${waitMinutes} menit.`,
      });
    }

    record.count += 1;
  } else {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  }

  next();
}

export function resetLoginAttempts(req: Request) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  loginAttempts.delete(ip);
}
