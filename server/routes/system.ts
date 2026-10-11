import { Router, Request, Response } from 'express';
import {
  getMaintenanceConfig,
  updateMaintenanceConfig,
} from '../services/maintenanceService';
import { verifyAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';

export const systemRouter = Router();

// ==========================================
// GET /api/system/maintenance-status (Publik)
// Digunakan untuk mengecek apakah maintenance aktif
// ==========================================
systemRouter.get(['/maintenance-status', '/public/maintenance-status'], async (_req: Request, res: Response) => {
  try {
    const config = await getMaintenanceConfig();
    res.json({
      isEnabled: config.isEnabled,
      mode: config.mode,
      title: config.title,
      message: config.message,
      updatedAt: config.updatedAt,
    });
  } catch (err) {
    res.json({
      isEnabled: false,
      mode: 'full',
      title: 'Website Sedang Dalam Pemeliharaan',
      message: 'Kami sedang melakukan pemeliharaan.',
      updatedAt: new Date().toISOString(),
    });
  }
});

// ==========================================
// GET /api/system/maintenance (Admin Protected)
// Detail status maintenance untuk Admin Dashboard
// ==========================================
systemRouter.get('/maintenance', verifyAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const config = await getMaintenanceConfig();
    res.json({
      success: true,
      config,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memuat status pemeliharaan.' });
  }
});

// ==========================================
// POST /api/system/maintenance/toggle (Admin Protected)
// Mengubah status emergency maintenance dengan Audit Trail
// ==========================================
systemRouter.post(
  '/maintenance/toggle',
  verifyAuth,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { isEnabled, mode, title, message } = req.body;

      if (typeof isEnabled !== 'boolean') {
        return res.status(400).json({ error: 'Status isEnabled (true/false) wajib ditentukan.' });
      }

      const updated = await updateMaintenanceConfig(
        {
          isEnabled,
          mode: mode === 'read_only' ? 'read_only' : 'full',
          title: title || undefined,
          message: message || undefined,
        },
        req.user!.username
      );

      res.json({
        success: true,
        message: updated.isEnabled
          ? `Emergency Maintenance Mode (${updated.mode.toUpperCase()}) BERHASIL DIAKTIFKAN.`
          : 'Website telah BERHASIL DIAKTIFKAN KEMBALI (ONLINE).',
        config: updated,
      });
    } catch (err: any) {
      console.error('[Maintenance Toggle] Error:', err);
      res.status(500).json({ error: 'Gagal mengubah status pemeliharaan.' });
    }
  }
);
