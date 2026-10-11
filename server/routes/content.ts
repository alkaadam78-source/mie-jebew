import { Router, Response } from 'express';
import { db } from '../db/database';
import { verifyAuth, requireRole, logActivity, AuthenticatedRequest } from '../middleware/auth';
import { invalidatePublicCache } from './public';

export const contentRouter = Router();

// ======================== HOMEPAGE CONTENT ========================
contentRouter.get('/homepage', verifyAuth, (_req, res: Response) => {
  const content = db.prepare('SELECT * FROM homepage_content WHERE id = ?').get('hero_content');
  res.json({ content });
});

contentRouter.put('/homepage', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), (req: AuthenticatedRequest, res: Response) => {
  const {
    store_name,
    hero_headline,
    hero_subheadline,
    hero_description,
    hero_badge,
    cta_order_text,
    cta_menu_text,
    announcement_banner,
    is_announcement_active,
    video_banner_url,
    video_poster_url,
    qris_merchant_name,
    qris_nmid,
    qris_image_url,
  } = req.body;

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE homepage_content
    SET store_name = COALESCE(?, store_name),
        hero_headline = COALESCE(?, hero_headline),
        hero_subheadline = COALESCE(?, hero_subheadline),
        hero_description = COALESCE(?, hero_description),
        hero_badge = COALESCE(?, hero_badge),
        cta_order_text = COALESCE(?, cta_order_text),
        cta_menu_text = COALESCE(?, cta_menu_text),
        announcement_banner = COALESCE(?, announcement_banner),
        is_announcement_active = COALESCE(?, is_announcement_active),
        video_banner_url = COALESCE(?, video_banner_url),
        video_poster_url = COALESCE(?, video_poster_url),
        qris_merchant_name = COALESCE(?, qris_merchant_name),
        qris_nmid = COALESCE(?, qris_nmid),
        qris_image_url = COALESCE(?, qris_image_url),
        updated_at = ?
    WHERE id = 'hero_content'
  `).run(
    store_name,
    hero_headline,
    hero_subheadline,
    hero_description,
    hero_badge,
    cta_order_text,
    cta_menu_text,
    announcement_banner,
    is_announcement_active !== undefined ? (is_announcement_active ? 1 : 0) : null,
    video_banner_url,
    video_poster_url,
    qris_merchant_name,
    qris_nmid,
    qris_image_url,
    now
  );

  invalidatePublicCache();
  logActivity(req.user!.username, 'UPDATE', 'homepage_content', 'hero_content', 'Memperbarui konten Homepage & Hero Banner');

  res.json({ message: 'Konten homepage berhasil diperbarui.' });
});

// ======================== WHY CHOOSE US ========================
contentRouter.get('/why-choose-us', verifyAuth, (_req, res: Response) => {
  const items = db.prepare('SELECT * FROM why_choose_us ORDER BY sort_order ASC').all();
  res.json({ items });
});

contentRouter.post('/why-choose-us', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { title, description, icon, sort_order } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'Judul dan deskripsi wajib diisi.' });

  const id = `why-${Date.now().toString(36)}`;
  db.prepare(`
    INSERT INTO why_choose_us (id, title, description, icon, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `).run(id, title.trim(), description.trim(), icon || '✨', sort_order || 0);

  invalidatePublicCache();
  logActivity(req.user!.username, 'CREATE', 'why_choose_us', id, `Menambah Why Choose Us: ${title}`);

  res.status(201).json({ message: 'Item berhasil ditambahkan.', id });
});

contentRouter.put('/why-choose-us/:id', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, icon, sort_order, is_active } = req.body;

  db.prepare(`
    UPDATE why_choose_us
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        icon = COALESCE(?, icon),
        sort_order = COALESCE(?, sort_order),
        is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(title, description, icon, sort_order, is_active !== undefined ? (is_active ? 1 : 0) : null, id);

  invalidatePublicCache();
  logActivity(req.user!.username, 'UPDATE', 'why_choose_us', id, `Memperbarui Why Choose Us: ${title || id}`);

  res.json({ message: 'Item berhasil diperbarui.' });
});

contentRouter.delete('/why-choose-us/:id', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  db.prepare('DELETE FROM why_choose_us WHERE id = ?').run(id);

  invalidatePublicCache();
  logActivity(req.user!.username, 'DELETE', 'why_choose_us', id, `Menghapus Why Choose Us ID: ${id}`);

  res.json({ message: 'Item berhasil dihapus.' });
});

// ======================== BEHIND THE KITCHEN ========================
contentRouter.get('/behind-the-kitchen', verifyAuth, (_req, res: Response) => {
  const items = db.prepare('SELECT * FROM behind_the_kitchen ORDER BY sort_order ASC').all();
  res.json({ items });
});

contentRouter.post('/behind-the-kitchen', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { title, description, image_url, tag, sort_order } = req.body;
  if (!title || !image_url) return res.status(400).json({ error: 'Judul dan URL gambar wajib diisi.' });

  const id = `kit-${Date.now().toString(36)}`;
  db.prepare(`
    INSERT INTO behind_the_kitchen (id, title, description, image_url, tag, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(id, title.trim(), description ? description.trim() : '', image_url, tag || 'Dapur Jebew', sort_order || 0);

  invalidatePublicCache();
  logActivity(req.user!.username, 'CREATE', 'behind_the_kitchen', id, `Menambah Behind the Kitchen: ${title}`);

  res.status(201).json({ message: 'Item berhasil ditambahkan.', id });
});

contentRouter.put('/behind-the-kitchen/:id', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, image_url, tag, sort_order, is_active } = req.body;

  db.prepare(`
    UPDATE behind_the_kitchen
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        image_url = COALESCE(?, image_url),
        tag = COALESCE(?, tag),
        sort_order = COALESCE(?, sort_order),
        is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(title, description, image_url, tag, sort_order, is_active !== undefined ? (is_active ? 1 : 0) : null, id);

  invalidatePublicCache();
  logActivity(req.user!.username, 'UPDATE', 'behind_the_kitchen', id, `Memperbarui Behind the Kitchen: ${title || id}`);

  res.json({ message: 'Item berhasil diperbarui.' });
});

contentRouter.delete('/behind-the-kitchen/:id', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  db.prepare('DELETE FROM behind_the_kitchen WHERE id = ?').run(id);

  invalidatePublicCache();
  logActivity(req.user!.username, 'DELETE', 'behind_the_kitchen', id, `Menghapus Behind the Kitchen ID: ${id}`);

  res.json({ message: 'Item berhasil dihapus.' });
});

// ======================== VINA'S SECTION ========================
contentRouter.get('/vinas', verifyAuth, (_req, res: Response) => {
  const vinas = db.prepare('SELECT * FROM vinas_section WHERE id = ?').get('vinas_main');
  res.json({ vinas });
});

contentRouter.put('/vinas', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), (req: AuthenticatedRequest, res: Response) => {
  const { title, subtitle, quote, description, image_url, cta_text, cta_link, badge, is_active } = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE vinas_section
    SET title = COALESCE(?, title),
        subtitle = COALESCE(?, subtitle),
        quote = COALESCE(?, quote),
        description = COALESCE(?, description),
        image_url = COALESCE(?, image_url),
        cta_text = COALESCE(?, cta_text),
        cta_link = COALESCE(?, cta_link),
        badge = COALESCE(?, badge),
        is_active = COALESCE(?, is_active),
        updated_at = ?
    WHERE id = 'vinas_main'
  `).run(
    title,
    subtitle,
    quote,
    description,
    image_url,
    cta_text,
    cta_link,
    badge,
    is_active !== undefined ? (is_active ? 1 : 0) : null,
    now
  );

  invalidatePublicCache();
  logActivity(req.user!.username, 'UPDATE', 'vinas_section', 'vinas_main', "Memperbarui konten Vina's Section");

  res.json({ message: "Konten Vina's berhasil diperbarui." });
});

// ======================== CONTACT INFORMATION ========================
contentRouter.get('/contact', verifyAuth, (_req, res: Response) => {
  const contact = db.prepare('SELECT * FROM contact_information WHERE id = ?').get('main_contact');
  res.json({ contact });
});

contentRouter.put('/contact', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const {
    phone,
    whatsapp_number,
    whatsapp_display,
    email,
    address_note,
    address_description,
    opening_hours,
    google_maps_url,
  } = req.body;

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE contact_information
    SET phone = COALESCE(?, phone),
        whatsapp_number = COALESCE(?, whatsapp_number),
        whatsapp_display = COALESCE(?, whatsapp_display),
        email = COALESCE(?, email),
        address_note = COALESCE(?, address_note),
        address_description = COALESCE(?, address_description),
        opening_hours = COALESCE(?, opening_hours),
        google_maps_url = COALESCE(?, google_maps_url),
        updated_at = ?
    WHERE id = 'main_contact'
  `).run(
    phone,
    whatsapp_number,
    whatsapp_display,
    email,
    address_note,
    address_description,
    opening_hours,
    google_maps_url,
    now
  );

  invalidatePublicCache();
  logActivity(req.user!.username, 'UPDATE', 'contact_information', 'main_contact', 'Memperbarui informasi kontak & jam operasional');

  res.json({ message: 'Informasi kontak berhasil diperbarui.' });
});

// ======================== SOCIAL MEDIA LINKS ========================
contentRouter.get('/social-links', verifyAuth, (_req, res: Response) => {
  const links = db.prepare('SELECT * FROM social_links ORDER BY sort_order ASC').all();
  res.json({ links });
});

contentRouter.post('/social-links', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { platform, handle, url, icon, sort_order } = req.body;
  if (!platform || !url) return res.status(400).json({ error: 'Platform dan URL wajib diisi.' });

  const id = `soc-${Date.now().toString(36)}`;
  db.prepare(`
    INSERT INTO social_links (id, platform, handle, url, icon, is_active, sort_order)
    VALUES (?, ?, ?, ?, ?, 1, ?)
  `).run(id, platform.trim(), handle ? handle.trim() : '', url.trim(), icon || 'ExternalLink', sort_order || 0);

  invalidatePublicCache();
  logActivity(req.user!.username, 'CREATE', 'social_links', id, `Menambah tautan sosial: ${platform}`);

  res.status(201).json({ message: 'Tautan sosial berhasil ditambahkan.', id });
});

contentRouter.put('/social-links/:id', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { platform, handle, url, icon, is_active, sort_order } = req.body;

  db.prepare(`
    UPDATE social_links
    SET platform = COALESCE(?, platform),
        handle = COALESCE(?, handle),
        url = COALESCE(?, url),
        icon = COALESCE(?, icon),
        is_active = COALESCE(?, is_active),
        sort_order = COALESCE(?, sort_order)
    WHERE id = ?
  `).run(platform, handle, url, icon, is_active !== undefined ? (is_active ? 1 : 0) : null, sort_order, id);

  invalidatePublicCache();
  logActivity(req.user!.username, 'UPDATE', 'social_links', id, `Memperbarui tautan sosial: ${platform || id}`);

  res.json({ message: 'Tautan sosial berhasil diperbarui.' });
});

contentRouter.delete('/social-links/:id', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  db.prepare('DELETE FROM social_links WHERE id = ?').run(id);

  invalidatePublicCache();
  logActivity(req.user!.username, 'DELETE', 'social_links', id, `Menghapus tautan sosial ID: ${id}`);

  res.json({ message: 'Tautan sosial berhasil dihapus.' });
});
