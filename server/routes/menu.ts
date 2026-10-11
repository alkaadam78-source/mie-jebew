import { Router, Response } from 'express';
import { db } from '../db/database';
import { verifyAuth, requireRole, logActivity, AuthenticatedRequest } from '../middleware/auth';
import { invalidatePublicCache } from './public';

export const menuRouter = Router();

// ======================== CATEGORIES ========================
menuRouter.get('/categories', verifyAuth, (_req, res: Response) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
  res.json({ categories });
});

menuRouter.post('/categories', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { name, icon, sort_order } = req.body;
  if (!name) return res.status(400).json({ error: 'Nama kategori wajib diisi.' });

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const id = `cat-${Date.now().toString(36)}`;

  db.prepare(`
    INSERT INTO categories (id, name, slug, icon, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `).run(id, name.trim(), slug, icon || '🍽️', sort_order || 0);

  invalidatePublicCache();
  logActivity(req.user!.username, 'CREATE', 'categories', id, `Menambah kategori: ${name}`);

  res.status(201).json({ message: 'Kategori berhasil ditambahkan.', id });
});

menuRouter.put('/categories/:id', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, icon, sort_order, is_active } = req.body;

  db.prepare(`
    UPDATE categories
    SET name = COALESCE(?, name),
        icon = COALESCE(?, icon),
        sort_order = COALESCE(?, sort_order),
        is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(name, icon, sort_order, is_active !== undefined ? (is_active ? 1 : 0) : null, id);

  invalidatePublicCache();
  logActivity(req.user!.username, 'UPDATE', 'categories', id, `Memperbarui kategori: ${name || id}`);

  res.json({ message: 'Kategori berhasil diperbarui.' });
});

menuRouter.delete('/categories/:id', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  // Check if category is used by items
  const count = db.prepare('SELECT COUNT(*) as c FROM menu_items WHERE category_id = ?').get(id) as any;
  if (count && count.c > 0) {
    return res.status(400).json({
      error: `Tidak dapat menghapus kategori karena masih ada ${count.c} menu yang terhubung.`,
    });
  }

  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  invalidatePublicCache();
  logActivity(req.user!.username, 'DELETE', 'categories', id, `Menghapus kategori ID: ${id}`);

  res.json({ message: 'Kategori berhasil dihapus.' });
});

// ======================== MENU ITEMS ========================
menuRouter.get('/items', verifyAuth, (req, res: Response) => {
  const { search, category, status } = req.query;
  let query = 'SELECT m.*, c.name as category_name FROM menu_items m LEFT JOIN categories c ON m.category_id = c.id WHERE 1=1';
  const params: any[] = [];

  if (search) {
    query += ' AND (m.name LIKE ? OR m.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category && category !== 'all') {
    query += ' AND m.category_id = ?';
    params.push(category);
  }
  if (status === 'active') {
    query += ' AND m.is_active = 1';
  } else if (status === 'inactive') {
    query += ' AND m.is_active = 0';
  }

  query += ' ORDER BY m.sort_order ASC, m.id ASC';
  const items = db.prepare(query).all(...params);
  res.json({ items });
});

menuRouter.post('/items', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    category_id,
    price,
    sale_price,
    description,
    image,
    badge,
    is_spicy_selectable,
    is_popular,
    is_best_seller,
    ingredients,
    sort_order,
  } = req.body;

  if (!name || price === undefined || price < 0 || !category_id) {
    return res.status(400).json({ error: 'Nama, kategori, dan harga valid (>= 0) wajib diisi.' });
  }

  const id = `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO menu_items (
      id, name, category_id, price, sale_price, description, image, badge,
      is_spicy_selectable, is_popular, is_best_seller, is_active, sort_order, ingredients, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, 1, ?, ?, ?, ?
    )
  `).run(
    id,
    name.trim(),
    category_id,
    Number(price),
    sale_price ? Number(sale_price) : null,
    description ? description.trim() : '',
    image || '',
    badge || '',
    is_spicy_selectable ? 1 : 0,
    is_popular ? 1 : 0,
    is_best_seller ? 1 : 0,
    sort_order ? Number(sort_order) : 0,
    ingredients ? ingredients.trim() : '',
    now,
    now
  );

  invalidatePublicCache();
  logActivity(req.user!.username, 'CREATE', 'menu_items', id, `Menambah menu: ${name} (Rp${Number(price).toLocaleString('id-ID')})`);

  res.status(201).json({ message: 'Menu berhasil ditambahkan.', id });
});

menuRouter.put('/items/:id', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Menu tidak ditemukan.' });
  }

  const {
    name,
    category_id,
    price,
    sale_price,
    description,
    image,
    badge,
    is_spicy_selectable,
    is_popular,
    is_best_seller,
    is_active,
    ingredients,
    sort_order,
  } = req.body;

  if (price !== undefined && Number(price) < 0) {
    return res.status(400).json({ error: 'Harga tidak boleh negatif.' });
  }

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE menu_items
    SET name = COALESCE(?, name),
        category_id = COALESCE(?, category_id),
        price = COALESCE(?, price),
        sale_price = ?,
        description = COALESCE(?, description),
        image = COALESCE(?, image),
        badge = COALESCE(?, badge),
        is_spicy_selectable = COALESCE(?, is_spicy_selectable),
        is_popular = COALESCE(?, is_popular),
        is_best_seller = COALESCE(?, is_best_seller),
        is_active = COALESCE(?, is_active),
        sort_order = COALESCE(?, sort_order),
        ingredients = COALESCE(?, ingredients),
        updated_at = ?
    WHERE id = ?
  `).run(
    name !== undefined ? name.trim() : null,
    category_id,
    price !== undefined ? Number(price) : null,
    sale_price !== undefined ? (sale_price ? Number(sale_price) : null) : existing.sale_price,
    description !== undefined ? description.trim() : null,
    image,
    badge,
    is_spicy_selectable !== undefined ? (is_spicy_selectable ? 1 : 0) : null,
    is_popular !== undefined ? (is_popular ? 1 : 0) : null,
    is_best_seller !== undefined ? (is_best_seller ? 1 : 0) : null,
    is_active !== undefined ? (is_active ? 1 : 0) : null,
    sort_order !== undefined ? Number(sort_order) : null,
    ingredients !== undefined ? ingredients.trim() : null,
    now,
    id
  );

  invalidatePublicCache();
  logActivity(
    req.user!.username,
    'UPDATE',
    'menu_items',
    id,
    `Memperbarui menu ${name || existing.name}${price !== undefined ? ` (Harga: Rp${Number(price).toLocaleString('id-ID')})` : ''}`
  );

  res.json({ message: 'Menu berhasil diperbarui.' });
});

menuRouter.delete('/items/:id', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT name FROM menu_items WHERE id = ?').get(id) as any;
  if (!existing) return res.status(404).json({ error: 'Menu tidak ditemukan.' });

  db.prepare('DELETE FROM menu_items WHERE id = ?').run(id);

  invalidatePublicCache();
  logActivity(req.user!.username, 'DELETE', 'menu_items', id, `Menghapus menu: ${existing.name}`);

  res.json({ message: 'Menu berhasil dihapus.' });
});
