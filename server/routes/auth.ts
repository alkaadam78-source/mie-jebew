import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database';
import { generateToken, verifyAuth, requireRole, logActivity, AuthenticatedRequest } from '../middleware/auth';
import { loginRateLimiter, resetLoginAttempts } from '../middleware/rateLimiter';

import { recordFailedLoginAttempt } from '../services/antiFraudService';

export const authRouter = Router();

// Login
authRouter.post('/login', loginRateLimiter, (req: Request, res: Response) => {
  const { username, password } = req.body;
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi.' });
  }

  const user = db.prepare(`
    SELECT * FROM admin_users WHERE username = ? OR email = ?
  `).get(username.trim(), username.trim()) as any;

  if (!user || user.is_active !== 1) {
    recordFailedLoginAttempt(ip, username.trim()).catch(() => {});
    return res.status(401).json({ error: 'Username atau password tidak valid.' });
  }

  const isValidPass = bcrypt.compareSync(password, user.password_hash);
  if (!isValidPass) {
    recordFailedLoginAttempt(ip, username.trim()).catch(() => {});
    return res.status(401).json({ error: 'Username atau password tidak valid.' });
  }

  resetLoginAttempts(req);

  const authUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    name: user.name,
    phone: user.phone || '085122014584',
  };

  const token = generateToken(authUser);
  logActivity(user.username, 'LOGIN', 'auth', String(user.id), 'Admin berhasil login ke dashboard.');

  return res.json({
    message: 'Login berhasil.',
    token,
    user: authUser,
  });
});

// Get Current User Profile
authRouter.get('/me', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// Admin Users Management (SUPER_ADMIN only)
authRouter.get('/users', verifyAuth, requireRole(['SUPER_ADMIN']), (_req: Request, res: Response) => {
  const users = db.prepare(`
    SELECT id, username, email, role, name, phone, is_active, created_at, updated_at
    FROM admin_users ORDER BY id ASC
  `).all();
  res.json({ users });
});

authRouter.post('/users', verifyAuth, requireRole(['SUPER_ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { username, email, password, role, name } = req.body;

  if (!username || !email || !password || !name) {
    return res.status(400).json({ error: 'Semua field wajib diisi.' });
  }

  const validRoles = ['SUPER_ADMIN', 'ADMIN', 'EDITOR'];
  const userRole = validRoles.includes(role) ? role : 'ADMIN';

  // Check unique username and email
  const existing = db.prepare('SELECT id FROM admin_users WHERE username = ? OR email = ?').get(username, email);
  if (existing) {
    return res.status(400).json({ error: 'Username atau email sudah digunakan.' });
  }

  const now = new Date().toISOString();
  const passwordHash = bcrypt.hashSync(password, 10);

  const result = db.prepare(`
    INSERT INTO admin_users (username, email, password_hash, role, name, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `).run(username.trim(), email.trim(), passwordHash, userRole, name.trim(), now, now);

  logActivity(req.user!.username, 'CREATE', 'admin_users', String(result.lastInsertRowid), `Menambahkan admin user baru: ${username} (${userRole})`);

  res.status(201).json({
    message: 'Admin user baru berhasil dibuat.',
    id: result.lastInsertRowid,
  });
});

authRouter.put('/users/:id', verifyAuth, requireRole(['SUPER_ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const { name, email, role, is_active, password } = req.body;

  const target = db.prepare('SELECT id, username FROM admin_users WHERE id = ?').get(id) as any;
  if (!target) {
    return res.status(404).json({ error: 'User tidak ditemukan.' });
  }

  const now = new Date().toISOString();

  if (password && password.trim().length >= 6) {
    const passwordHash = bcrypt.hashSync(password.trim(), 10);
    db.prepare(`
      UPDATE admin_users
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          role = COALESCE(?, role),
          is_active = COALESCE(?, is_active),
          password_hash = ?,
          updated_at = ?
      WHERE id = ?
    `).run(name, email, role, is_active !== undefined ? (is_active ? 1 : 0) : null, passwordHash, now, id);
  } else {
    db.prepare(`
      UPDATE admin_users
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          role = COALESCE(?, role),
          is_active = COALESCE(?, is_active),
          updated_at = ?
      WHERE id = ?
    `).run(name, email, role, is_active !== undefined ? (is_active ? 1 : 0) : null, now, id);
  }

  logActivity(req.user!.username, 'UPDATE', 'admin_users', String(id), `Memperbarui data admin user: ${target.username}`);

  res.json({ message: 'User berhasil diperbarui.' });
});

authRouter.delete('/users/:id', verifyAuth, requireRole(['SUPER_ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);

  if (req.user?.id === id) {
    return res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri.' });
  }

  const target = db.prepare('SELECT username FROM admin_users WHERE id = ?').get(id) as any;
  if (!target) {
    return res.status(404).json({ error: 'User tidak ditemukan.' });
  }

  db.prepare('DELETE FROM admin_users WHERE id = ?').run(id);
  logActivity(req.user!.username, 'DELETE', 'admin_users', String(id), `Menghapus admin user: ${target.username}`);

  res.json({ message: 'User berhasil dihapus.' });
});
