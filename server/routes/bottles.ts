import { Router, Response } from 'express';
import { db } from '../db/database';
import { verifyAuth, requireRole, logActivity, AuthenticatedRequest } from '../middleware/auth';
import { invalidatePublicCache } from './public';

export const bottlesRouter = Router();

bottlesRouter.get('/', verifyAuth, (req, res: Response) => {
  const { search, status } = req.query;
  let query = 'SELECT * FROM products_bottles WHERE 1=1';
  const params: any[] = [];

  if (search) {
    query += ' AND (name LIKE ? OR subtitle LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status === 'active') {
    query += ' AND is_active = 1';
  } else if (status === 'inactive') {
    query += ' AND is_active = 0';
  }

  query += ' ORDER BY sort_order ASC, id ASC';
  const bottles = db.prepare(query).all(...params);
  res.json({ bottles });
});

bottlesRouter.post('/', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    subtitle,
    price,
    volume_ml,
    description,
    heat_level,
    image,
    badge,
    stock_status,
    sort_order,
  } = req.body;

  if (!name || price === undefined || Number(price) < 0) {
    return res.status(400).json({ error: 'Nama dan harga valid (>= 0) wajib diisi.' });
  }

  const id = `bot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO products_bottles (
      id, name, subtitle, price, volume_ml, description, heat_level,
      image, badge, stock_status, is_active, sort_order, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, 1, ?, ?, ?
    )
  `).run(
    id,
    name.trim(),
    subtitle ? subtitle.trim() : '',
    Number(price),
    volume_ml ? Number(volume_ml) : 200,
    description ? description.trim() : '',
    heat_level ? Number(heat_level) : 3,
    image || '',
    badge || '',
    stock_status || 'in_stock',
    sort_order ? Number(sort_order) : 0,
    now,
    now
  );

  invalidatePublicCache();
  logActivity(req.user!.username, 'CREATE', 'products_bottles', id, `Menambah produk botol: ${name} (Rp${Number(price).toLocaleString('id-ID')})`);

  res.status(201).json({ message: 'Produk botol berhasil ditambahkan.', id });
});

bottlesRouter.put('/:id', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM products_bottles WHERE id = ?').get(id) as any;
  if (!existing) return res.status(404).json({ error: 'Produk tidak ditemukan.' });

  const {
    name,
    subtitle,
    price,
    volume_ml,
    description,
    heat_level,
    image,
    badge,
    stock_status,
    is_active,
    sort_order,
  } = req.body;

  if (price !== undefined && Number(price) < 0) {
    return res.status(400).json({ error: 'Harga tidak boleh negatif.' });
  }

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE products_bottles
    SET name = COALESCE(?, name),
        subtitle = COALESCE(?, subtitle),
        price = COALESCE(?, price),
        volume_ml = COALESCE(?, volume_ml),
        description = COALESCE(?, description),
        heat_level = COALESCE(?, heat_level),
        image = COALESCE(?, image),
        badge = COALESCE(?, badge),
        stock_status = COALESCE(?, stock_status),
        is_active = COALESCE(?, is_active),
        sort_order = COALESCE(?, sort_order),
        updated_at = ?
    WHERE id = ?
  `).run(
    name !== undefined ? name.trim() : null,
    subtitle !== undefined ? subtitle.trim() : null,
    price !== undefined ? Number(price) : null,
    volume_ml !== undefined ? Number(volume_ml) : null,
    description !== undefined ? description.trim() : null,
    heat_level !== undefined ? Number(heat_level) : null,
    image,
    badge,
    stock_status,
    is_active !== undefined ? (is_active ? 1 : 0) : null,
    sort_order !== undefined ? Number(sort_order) : null,
    now,
    id
  );

  invalidatePublicCache();
  logActivity(
    req.user!.username,
    'UPDATE',
    'products_bottles',
    id,
    `Memperbarui produk botol: ${name || existing.name}${price !== undefined ? ` (Harga: Rp${Number(price).toLocaleString('id-ID')})` : ''}`
  );

  res.json({ message: 'Produk botol berhasil diperbarui.' });
});

bottlesRouter.delete('/:id', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT name FROM products_bottles WHERE id = ?').get(id) as any;
  if (!existing) return res.status(404).json({ error: 'Produk tidak ditemukan.' });

  db.prepare('DELETE FROM products_bottles WHERE id = ?').run(id);

  invalidatePublicCache();
  logActivity(req.user!.username, 'DELETE', 'products_bottles', id, `Menghapus produk botol: ${existing.name}`);

  res.json({ message: 'Produk botol berhasil dihapus.' });
});
