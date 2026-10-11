import { Router, Response } from 'express';
import { db } from '../db/database';
import { verifyAuth, requireRole, logActivity, AuthenticatedRequest } from '../middleware/auth';
import { invalidatePublicCache } from './public';

export const promotionsRouter = Router();

promotionsRouter.get('/', verifyAuth, (_req, res: Response) => {
  const promotions = db.prepare('SELECT * FROM promotions ORDER BY sort_order ASC, created_at DESC').all();
  res.json({ promotions });
});

promotionsRouter.post('/', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const {
    title,
    promo_code,
    description,
    discount_type,
    discount_value,
    min_purchase,
    start_date,
    end_date,
    usage_limit,
    image,
    sort_order,
  } = req.body;

  if (!title || !promo_code || !discount_type || discount_value === undefined || !start_date || !end_date) {
    return res.status(400).json({ error: 'Judul, kode promo, tipe diskon, nilai diskon, dan periode tanggal wajib diisi.' });
  }

  const cleanCode = promo_code.trim().toUpperCase();
  const existing = db.prepare('SELECT id FROM promotions WHERE UPPER(promo_code) = ?').get(cleanCode);
  if (existing) {
    return res.status(400).json({ error: `Kode promo '${cleanCode}' sudah digunakan.` });
  }

  if (discount_type === 'percentage' && (discount_value <= 0 || discount_value > 100)) {
    return res.status(400).json({ error: 'Diskon persentase harus antara 1% sampai 100%.' });
  }
  if (discount_type === 'fixed' && discount_value <= 0) {
    return res.status(400).json({ error: 'Nilai diskon nominal harus lebih besar dari 0.' });
  }

  const id = `pro-${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO promotions (
      id, title, promo_code, description, discount_type, discount_value, min_purchase,
      start_date, end_date, usage_limit, used_count, image, is_active, sort_order, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, 0, ?, 1, ?, ?
    )
  `).run(
    id,
    title.trim(),
    cleanCode,
    description ? description.trim() : '',
    discount_type,
    Number(discount_value),
    min_purchase ? Number(min_purchase) : 0,
    start_date,
    end_date,
    usage_limit ? Number(usage_limit) : null,
    image || '',
    sort_order ? Number(sort_order) : 0,
    now
  );

  invalidatePublicCache();
  logActivity(req.user!.username, 'CREATE', 'promotions', id, `Menambah promo: ${title} (${cleanCode})`);

  res.status(201).json({ message: 'Promo berhasil dibuat.', id });
});

promotionsRouter.put('/:id', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM promotions WHERE id = ?').get(id) as any;
  if (!existing) return res.status(404).json({ error: 'Promo tidak ditemukan.' });

  const {
    title,
    promo_code,
    description,
    discount_type,
    discount_value,
    min_purchase,
    start_date,
    end_date,
    usage_limit,
    image,
    is_active,
    sort_order,
  } = req.body;

  let cleanCode = existing.promo_code;
  if (promo_code) {
    cleanCode = promo_code.trim().toUpperCase();
    const duplicate = db.prepare('SELECT id FROM promotions WHERE UPPER(promo_code) = ? AND id != ?').get(cleanCode, id);
    if (duplicate) {
      return res.status(400).json({ error: `Kode promo '${cleanCode}' sudah digunakan di promo lain.` });
    }
  }

  db.prepare(`
    UPDATE promotions
    SET title = COALESCE(?, title),
        promo_code = ?,
        description = COALESCE(?, description),
        discount_type = COALESCE(?, discount_type),
        discount_value = COALESCE(?, discount_value),
        min_purchase = COALESCE(?, min_purchase),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        usage_limit = ?,
        image = COALESCE(?, image),
        is_active = COALESCE(?, is_active),
        sort_order = COALESCE(?, sort_order)
    WHERE id = ?
  `).run(
    title !== undefined ? title.trim() : null,
    cleanCode,
    description !== undefined ? description.trim() : null,
    discount_type,
    discount_value !== undefined ? Number(discount_value) : null,
    min_purchase !== undefined ? Number(min_purchase) : null,
    start_date,
    end_date,
    usage_limit !== undefined ? (usage_limit ? Number(usage_limit) : null) : existing.usage_limit,
    image,
    is_active !== undefined ? (is_active ? 1 : 0) : null,
    sort_order !== undefined ? Number(sort_order) : null,
    id
  );

  invalidatePublicCache();
  logActivity(req.user!.username, 'UPDATE', 'promotions', id, `Memperbarui promo: ${title || existing.title} (${cleanCode})`);

  res.json({ message: 'Promo berhasil diperbarui.' });
});

promotionsRouter.delete('/:id', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT title, promo_code FROM promotions WHERE id = ?').get(id) as any;
  if (!existing) return res.status(404).json({ error: 'Promo tidak ditemukan.' });

  db.prepare('DELETE FROM promotions WHERE id = ?').run(id);

  invalidatePublicCache();
  logActivity(req.user!.username, 'DELETE', 'promotions', id, `Menghapus promo: ${existing.title} (${existing.promo_code})`);

  res.json({ message: 'Promo berhasil dihapus.' });
});
