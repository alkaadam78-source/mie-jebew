import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/database';

export const JWT_SECRET = process.env.JWT_SECRET || 'mie_jebew_super_secret_jwt_key_2026_production';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR';
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Akses ditolak. Token autentikasi tidak ditemukan.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    
    // Verify user is still active in database
    const user = db.prepare('SELECT id, username, email, role, name, is_active FROM admin_users WHERE id = ?').get(decoded.id) as any;
    if (!user || user.is_active !== 1) {
      return res.status(403).json({ error: 'Akun admin tidak aktif atau telah dinonaktifkan.' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sesi login telah kedaluwarsa atau token tidak valid.' });
  }
}

export function requireRole(allowedRoles: ('SUPER_ADMIN' | 'ADMIN' | 'EDITOR')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autentikasi diperlukan.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Akses ditolak. Peran '${req.user.role}' tidak memiliki izin untuk tindakan ini.`,
      });
    }
    next();
  };
}

import { getMySQLPool } from '../db/mysql';

export async function logActivity(
  username: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'TOGGLE',
  entity: string,
  entityId: string | null,
  details: string
) {
  const timestamp = new Date().toISOString();

  // 1. Catat ke MySQL / phpMyAdmin jika terhubung
  const pool = getMySQLPool();
  if (pool) {
    try {
      await pool.execute(
        `INSERT INTO activity_logs (admin_username, action, entity, entity_id, details, timestamp)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [username, action, entity, entityId || null, details]
      );
    } catch (mysqlErr: any) {
      console.warn('[Audit Log] MySQL record error:', mysqlErr.message);
    }
  }

  // 2. Catat ke SQLite sebagai persistensi lokal
  try {
    db.prepare(`
      INSERT INTO activity_logs (admin_username, action, entity, entity_id, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(username, action, entity, entityId || null, details, timestamp);
  } catch (err) {
    console.error('Failed to log admin activity in SQLite:', err);
  }
}

