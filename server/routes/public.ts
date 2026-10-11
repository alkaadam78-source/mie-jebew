import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { getMaintenanceConfig } from '../services/maintenanceService';

export const publicRouter = Router();

// GET /api/public/maintenance-status - Status pemeliharaan website publik
publicRouter.get('/maintenance-status', async (_req: Request, res: Response) => {
  try {
    const config = await getMaintenanceConfig();
    res.json({
      isEnabled: config.isEnabled,
      mode: config.mode,
      title: config.title,
      message: config.message,
      updatedAt: config.updatedAt,
    });
  } catch {
    res.json({
      isEnabled: false,
      mode: 'full',
      title: 'Website Sedang Dalam Pemeliharaan',
      message: 'Kami sedang melakukan pemeliharaan.',
      updatedAt: new Date().toISOString(),
    });
  }
});

// In-memory cache for public data to ensure instant response times
let cachedBootstrap: any = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL fallback (invalidated immediately on admin save)

export function invalidatePublicCache() {
  cachedBootstrap = null;
  lastCacheTime = 0;
}

// GET /api/public/bootstrap - Complete public website data
publicRouter.get('/bootstrap', (_req: Request, res: Response) => {
  const now = Date.now();
  if (cachedBootstrap && now - lastCacheTime < CACHE_TTL_MS) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cachedBootstrap);
  }

  const currentDate = new Date().toISOString().split('T')[0];

  const homepage = db.prepare('SELECT * FROM homepage_content WHERE id = ?').get('hero_content');
  const categories = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC').all();
  const menuItems = db.prepare('SELECT * FROM menu_items WHERE is_active = 1 ORDER BY sort_order ASC').all();
  const bottles = db.prepare('SELECT * FROM products_bottles WHERE is_active = 1 ORDER BY sort_order ASC').all();
  const customOptions = db.prepare('SELECT * FROM custom_order_options WHERE is_active = 1 ORDER BY sort_order ASC').all();
  const bundles = db.prepare('SELECT * FROM bundles WHERE is_active = 1 ORDER BY sort_order ASC').all().map((b: any) => ({
    ...b,
    items_included: typeof b.items_included === 'string' ? JSON.parse(b.items_included || '[]') : b.items_included,
  }));
  const promotions = db.prepare(`
    SELECT id, title, promo_code, description, discount_type, discount_value, min_purchase, start_date, end_date, image
    FROM promotions
    WHERE is_active = 1 AND start_date <= ? AND end_date >= ?
    ORDER BY sort_order ASC
  `).all(currentDate, currentDate);
  const whyChooseUs = db.prepare('SELECT * FROM why_choose_us WHERE is_active = 1 ORDER BY sort_order ASC').all();
  const behindKitchen = db.prepare('SELECT * FROM behind_the_kitchen WHERE is_active = 1 ORDER BY sort_order ASC').all();
  const vinas = db.prepare('SELECT * FROM vinas_section WHERE id = ? AND is_active = 1').get('vinas_main');
  const socialLinks = db.prepare('SELECT * FROM social_links WHERE is_active = 1 ORDER BY sort_order ASC').all();
  const contact = db.prepare('SELECT * FROM contact_information WHERE id = ?').get('main_contact');

  const payload = {
    homepage,
    categories,
    menu: menuItems,
    bottles,
    customOptions,
    bundles,
    promotions,
    whyChooseUs,
    behindKitchen,
    vinas,
    socialLinks,
    contact,
    timestamp: new Date().toISOString(),
  };

  cachedBootstrap = payload;
  lastCacheTime = now;

  res.setHeader('X-Cache', 'MISS');
  res.setHeader('Cache-Control', 'public, max-age=10, stale-while-revalidate=59');
  return res.json(payload);
});

// Server-side Promo Verification
publicRouter.post('/verify-promo', (req: Request, res: Response) => {
  const { code, subtotal } = req.body;

  if (!code || typeof subtotal !== 'number') {
    return res.status(400).json({ error: 'Kode promo dan subtotal diperlukan.' });
  }

  const currentDate = new Date().toISOString().split('T')[0];
  const promo = db.prepare(`
    SELECT * FROM promotions
    WHERE UPPER(promo_code) = UPPER(?) AND is_active = 1
  `).get(code.trim()) as any;

  if (!promo) {
    return res.status(404).json({ error: 'Kode promo tidak ditemukan atau tidak aktif.' });
  }

  if (promo.start_date > currentDate || promo.end_date < currentDate) {
    return res.status(400).json({ error: 'Masa berlaku kode promo ini sudah berakhir.' });
  }

  if (subtotal < promo.min_purchase) {
    return res.status(400).json({
      error: `Minimal pembelian untuk promo ini adalah Rp${promo.min_purchase.toLocaleString('id-ID')}.`,
    });
  }

  if (promo.usage_limit && promo.used_count >= promo.usage_limit) {
    return res.status(400).json({ error: 'Batas kuota penggunaan promo ini telah habis.' });
  }

  let discountAmount = 0;
  if (promo.discount_type === 'percentage') {
    discountAmount = Math.round((subtotal * promo.discount_value) / 100);
  } else {
    discountAmount = Math.min(subtotal, promo.discount_value);
  }

  return res.json({
    valid: true,
    promo: {
      code: promo.promo_code,
      title: promo.title,
      discountType: promo.discount_type,
      discountValue: promo.discount_value,
      discountAmount,
    },
    finalTotal: Math.max(0, subtotal - discountAmount),
  });
});
