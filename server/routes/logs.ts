import { Router, Response } from 'express';
import { db } from '../db/database';
import { verifyAuth, AuthenticatedRequest } from '../middleware/auth';

export const logsRouter = Router();

logsRouter.get('/', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  const { limit = '50', action } = req.query;
  let query = 'SELECT * FROM activity_logs WHERE 1=1';
  const params: any[] = [];

  if (action) {
    query += ' AND action = ?';
    params.push(action);
  }

  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50)));

  const logs = db.prepare(query).all(...params);
  res.json({ logs });
});

logsRouter.get('/stats', verifyAuth, (_req, res: Response) => {
  const menuCount = db.prepare('SELECT COUNT(*) as c FROM menu_items WHERE is_active = 1').get() as any;
  const bottlesCount = db.prepare('SELECT COUNT(*) as c FROM products_bottles WHERE is_active = 1').get() as any;
  const promoCount = db.prepare('SELECT COUNT(*) as c FROM promotions WHERE is_active = 1').get() as any;
  const bundlesCount = db.prepare('SELECT COUNT(*) as c FROM bundles WHERE is_active = 1').get() as any;
  const mediaCount = db.prepare('SELECT COUNT(*) as c FROM media').get() as any;
  const usersCount = db.prepare('SELECT COUNT(*) as c FROM admin_users WHERE is_active = 1').get() as any;

  res.json({
    stats: {
      activeMenuItems: menuCount.c,
      activeBottles: bottlesCount.c,
      activePromos: promoCount.c,
      activeBundles: bundlesCount.c,
      totalMedia: mediaCount.c,
      activeAdmins: usersCount.c,
    },
  });
});
