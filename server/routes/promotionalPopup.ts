import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { getMySQLPool } from '../db/mysql';
import { verifyAuth, AuthenticatedRequest, logActivity } from '../middleware/auth';
import { upload } from '../middleware/upload';

export const promotionalPopupRouter = Router();

// ==========================================
// 1. PUBLIC: GET ACTIVE PROMOTIONAL POPUP
// ==========================================
promotionalPopupRouter.get('/public/promo-popup', (_req: Request, res: Response) => {
  try {
    // 1. Prioritize active published popup (most recently updated)
    let popup = db.prepare(`
      SELECT * FROM promotional_popup 
      WHERE is_active = 1 AND status = 'published' 
      ORDER BY updated_at DESC 
      LIMIT 1
    `).get() as any;

    // 2. Fallback to main_popup if none marked active
    if (!popup) {
      popup = db.prepare(`SELECT * FROM promotional_popup WHERE id = 'main_popup'`).get() as any;
    }

    if (!popup) {
      return res.json({ active: false, popup: null });
    }

    // Check if enabled and published
    if (!popup.is_active || popup.status !== 'published') {
      return res.json({ active: false, popup: null });
    }

    // Check schedule window if defined
    const now = new Date();
    if (popup.start_date) {
      const startDate = new Date(popup.start_date);
      if (now < startDate) {
        return res.json({ active: false, popup: null, reason: 'scheduled_future' });
      }
    }

    if (popup.end_date) {
      const endDate = new Date(popup.end_date);
      if (now > endDate) {
        return res.json({ active: false, popup: null, reason: 'schedule_ended' });
      }
    }

    return res.json({
      active: true,
      popup: {
        ...popup,
        is_active: Boolean(popup.is_active),
      },
    });
  } catch (err: any) {
    console.error('[Popup Public] Error fetching active popup:', err);
    return res.status(500).json({ error: 'Gagal memuat popup promosi.' });
  }
});

// ==========================================
// 2. ADMIN: GET CONFIG & LIST OF ALL POPUPS
// ==========================================
promotionalPopupRouter.get('/admin/promo-popup', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestedId = req.query.id as string | undefined;

    let popups = db.prepare(`SELECT * FROM promotional_popup ORDER BY updated_at DESC`).all() as any[];

    if (!popups || popups.length === 0) {
      // Auto-fallback seed if missing
      const now = new Date().toISOString();
      db.prepare(`
        INSERT OR IGNORE INTO promotional_popup (
          id, title, headline, subtitle, description, cta_text, cta_link, secondary_text,
          image_url, badge_text, is_active, target_page, delay_seconds, frequency,
          start_date, end_date, status, updated_by, updated_at
        ) VALUES (
          'main_popup', 'MIE JEBEW', 'PEDASNYA BIKIN NAGIH!', 'Laper? Gas, bro! 🍜',
          'Mie pedas + topping favorit lo.', 'PESAN SEKARANG', '#order-original', 'Nanti aja',
          '/promo-popup-banner.jpg', 'PROMO SPESIAL 🔥', 1, 'all', 2, 'once_per_session',
          NULL, NULL, 'published', 'admin', ?
        )
      `).run(now);
      popups = db.prepare(`SELECT * FROM promotional_popup ORDER BY updated_at DESC`).all() as any[];
    }

    let popup = requestedId
      ? popups.find(p => p.id === requestedId) || popups[0]
      : (popups.find(p => p.is_active === 1 && p.status === 'published') || popups[0]);

    const history = db.prepare(`
      SELECT * FROM promotional_popup_history 
      WHERE popup_id = ? 
      ORDER BY saved_at DESC 
      LIMIT 15
    `).all(popup.id) as any[];

    return res.json({
      popup: {
        ...popup,
        is_active: Boolean(popup.is_active),
      },
      popups: popups.map(p => ({
        ...p,
        is_active: Boolean(p.is_active),
      })),
      history: history.map(h => ({
        ...h,
        is_active: Boolean(h.is_active),
      })),
    });
  } catch (err: any) {
    console.error('[Popup Admin] Error fetching popup config:', err);
    return res.status(500).json({ error: 'Gagal memuat konfigurasi popup admin.' });
  }
});

// ==========================================
// 3. ADMIN: CREATE NEW PROMOTIONAL POPUP
// ==========================================
promotionalPopupRouter.post('/admin/promo-popup/create', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminUser = req.user?.username || 'admin';
    const {
      title,
      headline,
      subtitle,
      description,
      cta_text,
      cta_link,
      secondary_text,
      image_url,
      badge_text,
      is_active,
      target_page,
      delay_seconds,
      frequency,
      start_date,
      end_date,
      status,
    } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Judul popup (Tag/Brand) wajib diisi.' });
    }
    if (!headline || typeof headline !== 'string' || headline.trim().length === 0) {
      return res.status(400).json({ error: 'Headline promosi wajib diisi.' });
    }
    if (!cta_text || typeof cta_text !== 'string' || cta_text.trim().length === 0) {
      return res.status(400).json({ error: 'Teks tombol utama (CTA) wajib diisi.' });
    }

    const newId = `popup-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const cleanIsActive = is_active ? 1 : 0;
    const cleanStatus = status === 'draft' ? 'draft' : 'published';
    const cleanDelay = Math.max(0, Math.min(60, parseInt(String(delay_seconds ?? 2), 10) || 0));
    const cleanTargetPage = ['all', 'home', 'menu'].includes(target_page) ? target_page : 'all';
    const cleanFrequency = ['once_per_session', 'once_per_day', 'always'].includes(frequency)
      ? frequency
      : 'once_per_session';
    const now = new Date().toISOString();

    // If newly created popup is active, set all others to inactive
    if (cleanIsActive === 1) {
      db.prepare(`UPDATE promotional_popup SET is_active = 0`).run();
    }

    const newPopupData = {
      id: newId,
      title: title.trim().slice(0, 100),
      headline: headline.trim().slice(0, 150),
      subtitle: (subtitle || '').trim().slice(0, 150),
      description: (description || '').trim(),
      cta_text: cta_text.trim().slice(0, 50),
      cta_link: (cta_link || '#order-original').trim().slice(0, 255),
      secondary_text: (secondary_text || 'Nanti aja').trim().slice(0, 50),
      image_url: (image_url || '/promo-popup-banner.jpg').trim(),
      badge_text: (badge_text || 'PROMO SPESIAL 🔥').trim().slice(0, 50),
      is_active: cleanIsActive,
      target_page: cleanTargetPage,
      delay_seconds: cleanDelay,
      frequency: cleanFrequency,
      start_date: start_date ? new Date(start_date).toISOString() : null,
      end_date: end_date ? new Date(end_date).toISOString() : null,
      status: cleanStatus,
      updated_by: adminUser,
      updated_at: now,
    };

    db.prepare(`
      INSERT INTO promotional_popup (
        id, title, headline, subtitle, description, cta_text, cta_link, secondary_text,
        image_url, badge_text, is_active, target_page, delay_seconds, frequency,
        start_date, end_date, status, updated_by, updated_at
      ) VALUES (
        @id, @title, @headline, @subtitle, @description, @cta_text, @cta_link, @secondary_text,
        @image_url, @badge_text, @is_active, @target_page, @delay_seconds, @frequency,
        @start_date, @end_date, @status, @updated_by, @updated_at
      )
    `).run(newPopupData);

    logActivity(
      adminUser,
      'CREATE_PROMO_POPUP',
      'promotional_popup',
      newId,
      `Menambahkan banner promosi baru: "${newPopupData.headline}" (Aksi: ${newPopupData.cta_link})`
    );

    return res.status(201).json({
      success: true,
      message: 'Banner promosi baru berhasil dibuat dan disimpan!',
      popup: {
        ...newPopupData,
        is_active: Boolean(newPopupData.is_active),
      },
    });
  } catch (err: any) {
    console.error('[Popup Admin] Error creating popup:', err);
    return res.status(500).json({ error: 'Gagal membuat banner promosi baru.' });
  }
});

// ==========================================
// 4. ADMIN: UPDATE PROMOTIONAL POPUP
// ==========================================
promotionalPopupRouter.put('/admin/promo-popup', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminUser = req.user?.username || 'admin';
    const {
      id,
      title,
      headline,
      subtitle,
      description,
      cta_text,
      cta_link,
      secondary_text,
      image_url,
      badge_text,
      is_active,
      target_page,
      delay_seconds,
      frequency,
      start_date,
      end_date,
      status,
      change_summary,
    } = req.body;

    const targetId = (id && typeof id === 'string' && id.trim()) ? id.trim() : 'main_popup';

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Judul popup (Tag/Brand) wajib diisi.' });
    }
    if (!headline || typeof headline !== 'string' || headline.trim().length === 0) {
      return res.status(400).json({ error: 'Headline promosi wajib diisi.' });
    }
    if (!cta_text || typeof cta_text !== 'string' || cta_text.trim().length === 0) {
      return res.status(400).json({ error: 'Teks tombol utama (CTA) wajib diisi.' });
    }

    const cleanDelay = Math.max(0, Math.min(60, parseInt(String(delay_seconds ?? 2), 10) || 0));
    const cleanTargetPage = ['all', 'home', 'menu'].includes(target_page) ? target_page : 'all';
    const cleanFrequency = ['once_per_session', 'once_per_day', 'always'].includes(frequency)
      ? frequency
      : 'once_per_session';
    const cleanStatus = status === 'draft' ? 'draft' : 'published';
    const cleanIsActive = is_active ? 1 : 0;
    const now = new Date().toISOString();

    let cleanStartDate: string | null = null;
    let cleanEndDate: string | null = null;

    if (start_date && !isNaN(new Date(start_date).getTime())) {
      cleanStartDate = new Date(start_date).toISOString();
    }
    if (end_date && !isNaN(new Date(end_date).getTime())) {
      cleanEndDate = new Date(end_date).toISOString();
      if (cleanStartDate && new Date(cleanEndDate) <= new Date(cleanStartDate)) {
        return res.status(400).json({ error: 'Waktu berakhir harus setelah waktu mulai promosi.' });
      }
    }

    // If activating this popup, deactivate others so only 1 is live
    if (cleanIsActive === 1 && cleanStatus === 'published') {
      db.prepare(`UPDATE promotional_popup SET is_active = 0 WHERE id != ?`).run(targetId);
    }

    const updatedData = {
      id: targetId,
      title: title.trim().slice(0, 100),
      headline: headline.trim().slice(0, 150),
      subtitle: (subtitle || '').trim().slice(0, 150),
      description: (description || '').trim(),
      cta_text: cta_text.trim().slice(0, 50),
      cta_link: (cta_link || '#order-original').trim().slice(0, 255),
      secondary_text: (secondary_text || 'Nanti aja').trim().slice(0, 50),
      image_url: (image_url || '/promo-popup-banner.jpg').trim(),
      badge_text: (badge_text || '').trim().slice(0, 50),
      is_active: cleanIsActive,
      target_page: cleanTargetPage,
      delay_seconds: cleanDelay,
      frequency: cleanFrequency,
      start_date: cleanStartDate,
      end_date: cleanEndDate,
      status: cleanStatus,
      updated_by: adminUser,
      updated_at: now,
    };

    // 1. Update SQLite
    db.prepare(`
      INSERT INTO promotional_popup (
        id, title, headline, subtitle, description, cta_text, cta_link, secondary_text,
        image_url, badge_text, is_active, target_page, delay_seconds, frequency,
        start_date, end_date, status, updated_by, updated_at
      ) VALUES (
        @id, @title, @headline, @subtitle, @description, @cta_text, @cta_link, @secondary_text,
        @image_url, @badge_text, @is_active, @target_page, @delay_seconds, @frequency,
        @start_date, @end_date, @status, @updated_by, @updated_at
      )
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        headline = excluded.headline,
        subtitle = excluded.subtitle,
        description = excluded.description,
        cta_text = excluded.cta_text,
        cta_link = excluded.cta_link,
        secondary_text = excluded.secondary_text,
        image_url = excluded.image_url,
        badge_text = excluded.badge_text,
        is_active = excluded.is_active,
        target_page = excluded.target_page,
        delay_seconds = excluded.delay_seconds,
        frequency = excluded.frequency,
        start_date = excluded.start_date,
        end_date = excluded.end_date,
        status = excluded.status,
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at
    `).run(updatedData);

    // 2. Insert Revision into History Table
    const historyId = `hist-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const historySummary = change_summary || (cleanStatus === 'draft' ? 'Simpan draft konfigurasi popup' : 'Pembaruan & publikasi popup promosi');

    db.prepare(`
      INSERT INTO promotional_popup_history (
        id, popup_id, title, headline, subtitle, description, cta_text, cta_link, secondary_text,
        image_url, badge_text, is_active, target_page, delay_seconds, frequency,
        start_date, end_date, status, saved_by, saved_at, change_summary
      ) VALUES (
        @id, @popup_id, @title, @headline, @subtitle, @description, @cta_text, @cta_link, @secondary_text,
        @image_url, @badge_text, @is_active, @target_page, @delay_seconds, @frequency,
        @start_date, @end_date, @status, @saved_by, @saved_at, @change_summary
      )
    `).run({
      id: historyId,
      popup_id: targetId,
      ...updatedData,
      saved_by: adminUser,
      saved_at: now,
      change_summary: historySummary,
    });

    logActivity(
      adminUser,
      'UPDATE_PROMO_POPUP',
      'promotional_popup',
      targetId,
      `Popup "${updatedData.headline}" status: ${cleanStatus}, aktif: ${cleanIsActive === 1 ? 'YA' : 'TIDAK'} (Arah: ${updatedData.cta_link})`
    );

    return res.json({
      success: true,
      message: cleanStatus === 'draft' ? 'Draft popup berhasil disimpan.' : 'Konfigurasi popup berhasil diterbitkan!',
      popup: {
        ...updatedData,
        is_active: Boolean(updatedData.is_active),
      },
    });
  } catch (err: any) {
    console.error('[Popup Admin] Error updating popup:', err);
    return res.status(500).json({ error: 'Gagal menyimpan perubahan popup promosi.' });
  }
});

// ==========================================
// 5. ADMIN: 1-CLICK ACTIVATE POPUP
// ==========================================
promotionalPopupRouter.post('/admin/promo-popup/activate/:id', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminUser = req.user?.username || 'admin';
    const { id } = req.params;

    const existing = db.prepare(`SELECT * FROM promotional_popup WHERE id = ?`).get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Banner promosi tidak ditemukan.' });
    }

    const now = new Date().toISOString();
    // Deactivate all others
    db.prepare(`UPDATE promotional_popup SET is_active = 0`).run();
    // Activate selected
    db.prepare(`UPDATE promotional_popup SET is_active = 1, status = 'published', updated_at = ? WHERE id = ?`).run(now, id);

    logActivity(
      adminUser,
      'ACTIVATE_PROMO_POPUP',
      'promotional_popup',
      id,
      `Mengaktifkan banner promosi "${existing.headline}" sebagai banner live utama`
    );

    const updated = db.prepare(`SELECT * FROM promotional_popup WHERE id = ?`).get(id) as any;

    return res.json({
      success: true,
      message: `Banner '${existing.headline}' berhasil diaktifkan dan langsung live di website publik!`,
      popup: {
        ...updated,
        is_active: true,
      },
    });
  } catch (err: any) {
    console.error('[Popup Activate] Error:', err);
    return res.status(500).json({ error: 'Gagal mengaktifkan banner promosi.' });
  }
});

// ==========================================
// 6. ADMIN: DELETE POPUP
// ==========================================
promotionalPopupRouter.delete('/admin/promo-popup/:id', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminUser = req.user?.username || 'admin';
    const { id } = req.params;

    const count = (db.prepare(`SELECT COUNT(*) as cnt FROM promotional_popup`).get() as any).cnt;
    if (count <= 1) {
      return res.status(400).json({ error: 'Tidak dapat menghapus banner terakhir. Minimal harus ada 1 banner di sistem.' });
    }

    const existing = db.prepare(`SELECT * FROM promotional_popup WHERE id = ?`).get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Banner tidak ditemukan.' });
    }

    db.prepare(`DELETE FROM promotional_popup WHERE id = ?`).run(id);
    db.prepare(`DELETE FROM promotional_popup_history WHERE popup_id = ?`).run(id);

    // If deleted banner was active, activate another banner
    if (existing.is_active === 1) {
      const remaining = db.prepare(`SELECT id FROM promotional_popup ORDER BY updated_at DESC LIMIT 1`).get() as any;
      if (remaining) {
        db.prepare(`UPDATE promotional_popup SET is_active = 1, status = 'published' WHERE id = ?`).run(remaining.id);
      }
    }

    logActivity(
      adminUser,
      'DELETE_PROMO_POPUP',
      'promotional_popup',
      id,
      `Menghapus banner promosi: "${existing.headline}"`
    );

    return res.json({
      success: true,
      message: 'Banner promosi berhasil dihapus.',
    });
  } catch (err: any) {
    console.error('[Popup Delete] Error:', err);
    return res.status(500).json({ error: 'Gagal menghapus banner promosi.' });
  }
});

// ==========================================
// 7. ADMIN: ROLLBACK TO PREVIOUS REVISION
// ==========================================
promotionalPopupRouter.post('/admin/promo-popup/rollback/:historyId', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminUser = req.user?.username || 'admin';
    const { historyId } = req.params;

    const historyRecord = db.prepare(`SELECT * FROM promotional_popup_history WHERE id = ?`).get(historyId) as any;
    if (!historyRecord) {
      return res.status(404).json({ error: 'Riwayat revisi popup tidak ditemukan.' });
    }

    const now = new Date().toISOString();
    const rollbackData = {
      id: historyRecord.popup_id || 'main_popup',
      title: historyRecord.title,
      headline: historyRecord.headline,
      subtitle: historyRecord.subtitle,
      description: historyRecord.description,
      cta_text: historyRecord.cta_text,
      cta_link: historyRecord.cta_link,
      secondary_text: historyRecord.secondary_text,
      image_url: historyRecord.image_url,
      badge_text: historyRecord.badge_text,
      is_active: historyRecord.is_active,
      target_page: historyRecord.target_page,
      delay_seconds: historyRecord.delay_seconds,
      frequency: historyRecord.frequency,
      start_date: historyRecord.start_date,
      end_date: historyRecord.end_date,
      status: historyRecord.status,
      updated_by: adminUser,
      updated_at: now,
    };

    // Update active
    db.prepare(`
      UPDATE promotional_popup SET
        title = @title,
        headline = @headline,
        subtitle = @subtitle,
        description = @description,
        cta_text = @cta_text,
        cta_link = @cta_link,
        secondary_text = @secondary_text,
        image_url = @image_url,
        badge_text = @badge_text,
        is_active = @is_active,
        target_page = @target_page,
        delay_seconds = @delay_seconds,
        frequency = @frequency,
        start_date = @start_date,
        end_date = @end_date,
        status = @status,
        updated_by = @updated_by,
        updated_at = @updated_at
      WHERE id = @id
    `).run(rollbackData);

    logActivity(
      adminUser,
      'ROLLBACK_PROMO_POPUP',
      'promotional_popup',
      rollbackData.id,
      `Memulihkan konfigurasi popup dari versi ID: ${historyId}`
    );

    return res.json({
      success: true,
      message: `Konfigurasi popup berhasil dipulihkan ke versi revisi sebelumnya!`,
      popup: {
        ...rollbackData,
        is_active: Boolean(rollbackData.is_active),
      },
    });
  } catch (err: any) {
    console.error('[Popup Rollback] Error:', err);
    return res.status(500).json({ error: 'Gagal melakukan pemulihan konfigurasi.' });
  }
});

// ==========================================
// 8. ADMIN: UPLOAD PROMOTIONAL BANNER IMAGE
// ==========================================
promotionalPopupRouter.post(
  '/admin/promo-popup/upload-image',
  verifyAuth,
  upload.single('image'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Tidak ada file gambar yang diunggah.' });
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      return res.json({
        success: true,
        message: 'Gambar promosi berhasil diunggah.',
        imageUrl,
      });
    } catch (err: any) {
      console.error('[Popup Upload] Error:', err);
      return res.status(500).json({ error: err.message || 'Gagal mengunggah gambar promosi.' });
    }
  }
);
