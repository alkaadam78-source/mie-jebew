import { Router, Response } from 'express';
import { db } from '../db/database';
import { verifyAuth, requireRole, logActivity, AuthenticatedRequest } from '../middleware/auth';
import { invalidatePublicCache } from './public';

export const customOrderRouter = Router();

// ======================== CUSTOM OPTIONS (Levels, Toppings, etc) ========================
customOrderRouter.get('/options', verifyAuth, (req, res: Response) => {
  const { group } = req.query;
  let query = 'SELECT * FROM custom_order_options WHERE 1=1';
  const params: any[] = [];

  if (group) {
    query += ' AND group_type = ?';
    params.push(group);
  }

  query += ' ORDER BY sort_order ASC, id ASC';
  const options = db.prepare(query).all(...params);
  res.json({ options });
});

customOrderRouter.post('/options', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const {
    group_type,
    name,
    level_number,
    badge,
    description,
    price_adjustment,
    is_popular,
    sort_order,
  } = req.body;

  if (!group_type || !name) {
    return res.status(400).json({ error: 'Tipe opsi dan nama wajib diisi.' });
  }

  const id = `opt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  db.prepare(`
    INSERT INTO custom_order_options (
      id, group_type, name, level_number, badge, description, price_adjustment, is_popular, is_active, sort_order
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, 1, ?
    )
  `).run(
    id,
    group_type,
    name.trim(),
    level_number !== undefined && level_number !== null ? Number(level_number) : null,
    badge ? badge.trim() : '',
    description ? description.trim() : '',
    price_adjustment ? Number(price_adjustment) : 0,
    is_popular ? 1 : 0,
    sort_order ? Number(sort_order) : 0
  );

  invalidatePublicCache();
  logActivity(req.user!.username, 'CREATE', 'custom_order_options', id, `Menambah opsi kustom: ${name} (${group_type})`);

  res.status(201).json({ message: 'Opsi kustom berhasil dibuat.', id });
});

customOrderRouter.put('/options/:id', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM custom_order_options WHERE id = ?').get(id) as any;
  if (!existing) return res.status(404).json({ error: 'Opsi tidak ditemukan.' });

  const {
    group_type,
    name,
    level_number,
    badge,
    description,
    price_adjustment,
    is_popular,
    is_active,
    sort_order,
  } = req.body;

  db.prepare(`
    UPDATE custom_order_options
    SET group_type = COALESCE(?, group_type),
        name = COALESCE(?, name),
        level_number = ?,
        badge = COALESCE(?, badge),
        description = COALESCE(?, description),
        price_adjustment = COALESCE(?, price_adjustment),
        is_popular = COALESCE(?, is_popular),
        is_active = COALESCE(?, is_active),
        sort_order = COALESCE(?, sort_order)
    WHERE id = ?
  `).run(
    group_type,
    name !== undefined ? name.trim() : null,
    level_number !== undefined ? (level_number !== null ? Number(level_number) : null) : existing.level_number,
    badge,
    description,
    price_adjustment !== undefined ? Number(price_adjustment) : null,
    is_popular !== undefined ? (is_popular ? 1 : 0) : null,
    is_active !== undefined ? (is_active ? 1 : 0) : null,
    sort_order !== undefined ? Number(sort_order) : null,
    id
  );

  invalidatePublicCache();
  logActivity(req.user!.username, 'UPDATE', 'custom_order_options', id, `Memperbarui opsi kustom: ${name || existing.name}`);

  res.json({ message: 'Opsi kustom berhasil diperbarui.' });
});

customOrderRouter.delete('/options/:id', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  db.prepare('DELETE FROM custom_order_options WHERE id = ?').run(id);

  invalidatePublicCache();
  logActivity(req.user!.username, 'DELETE', 'custom_order_options', id, `Menghapus opsi kustom ID: ${id}`);

  res.json({ message: 'Opsi kustom berhasil dihapus.' });
});

// ======================== BUNDLES ========================
customOrderRouter.get('/bundles', verifyAuth, (_req, res: Response) => {
  const bundles = db.prepare('SELECT * FROM bundles ORDER BY sort_order ASC').all().map((b: any) => ({
    ...b,
    items_included: typeof b.items_included === 'string' ? JSON.parse(b.items_included || '[]') : b.items_included,
  }));
  res.json({ bundles });
});

customOrderRouter.post('/bundles', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    description,
    price,
    original_price,
    savings_badge,
    items_included,
    image,
    sort_order,
  } = req.body;

  if (!name || price === undefined || original_price === undefined) {
    return res.status(400).json({ error: 'Nama, harga paket, dan harga asli wajib diisi.' });
  }

  const id = `bun-${Date.now().toString(36)}`;
  const now = new Date().toISOString();
  const itemsStr = Array.isArray(items_included) ? JSON.stringify(items_included) : JSON.stringify([]);

  db.prepare(`
    INSERT INTO bundles (
      id, name, description, price, original_price, savings_badge, items_included, image, is_active, sort_order, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?
    )
  `).run(
    id,
    name.trim(),
    description ? description.trim() : '',
    Number(price),
    Number(original_price),
    savings_badge ? savings_badge.trim() : '',
    itemsStr,
    image || '',
    sort_order ? Number(sort_order) : 0,
    now
  );

  invalidatePublicCache();
  logActivity(req.user!.username, 'CREATE', 'bundles', id, `Menambah paket bundle: ${name} (Rp${Number(price).toLocaleString('id-ID')})`);

  res.status(201).json({ message: 'Paket bundle berhasil dibuat.', id });
});

customOrderRouter.put('/bundles/:id', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM bundles WHERE id = ?').get(id) as any;
  if (!existing) return res.status(404).json({ error: 'Paket bundle tidak ditemukan.' });

  const {
    name,
    description,
    price,
    original_price,
    savings_badge,
    items_included,
    image,
    is_active,
    sort_order,
  } = req.body;

  const itemsStr = items_included !== undefined
    ? (Array.isArray(items_included) ? JSON.stringify(items_included) : JSON.stringify([]))
    : existing.items_included;

  db.prepare(`
    UPDATE bundles
    SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        original_price = COALESCE(?, original_price),
        savings_badge = COALESCE(?, savings_badge),
        items_included = ?,
        image = COALESCE(?, image),
        is_active = COALESCE(?, is_active),
        sort_order = COALESCE(?, sort_order)
    WHERE id = ?
  `).run(
    name !== undefined ? name.trim() : null,
    description !== undefined ? description.trim() : null,
    price !== undefined ? Number(price) : null,
    original_price !== undefined ? Number(original_price) : null,
    savings_badge !== undefined ? savings_badge.trim() : null,
    itemsStr,
    image,
    is_active !== undefined ? (is_active ? 1 : 0) : null,
    sort_order !== undefined ? Number(sort_order) : null,
    id
  );

  invalidatePublicCache();
  logActivity(req.user!.username, 'UPDATE', 'bundles', id, `Memperbarui paket bundle: ${name || existing.name}`);

  res.json({ message: 'Paket bundle berhasil diperbarui.' });
});

customOrderRouter.delete('/bundles/:id', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  db.prepare('DELETE FROM bundles WHERE id = ?').run(id);

  invalidatePublicCache();
  logActivity(req.user!.username, 'DELETE', 'bundles', id, `Menghapus paket bundle ID: ${id}`);

  res.json({ message: 'Paket bundle berhasil dihapus.' });
});
