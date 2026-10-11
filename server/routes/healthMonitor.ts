import { Router, Response } from 'express';
import { verifyAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';
import {
  getSystemHealthSnapshot,
  getHealthAlertConfig,
  updateHealthAlertConfig,
} from '../services/healthMonitorService';

export const healthMonitorRouter = Router();

// ==========================================
// GET /api/system/health/metrics
// Ambil seluruh metrik kesehatan sistem
// ==========================================
healthMonitorRouter.get('/metrics', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = await getSystemHealthSnapshot();
    res.json({
      success: true,
      health: snapshot,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memuat metrik kesehatan sistem: ' + err.message });
  }
});

// ==========================================
// GET /api/system/health/config
// Ambil konfigurasi kanal alert
// ==========================================
healthMonitorRouter.get('/config', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (_req: AuthenticatedRequest, res: Response) => {
  try {
    const config = getHealthAlertConfig();
    res.json({
      success: true,
      config,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memuat konfigurasi alert: ' + err.message });
  }
});

// ==========================================
// POST /api/system/health/config
// Perbarui konfigurasi kanal alert
// ==========================================
healthMonitorRouter.post('/config', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { enabled, webhookUrl, whatsappAlertNumber, emailAlert, diskThresholdPercent, errorThresholdPercent, notifyOnDbFailure } = req.body;
    const adminUser = req.user!.username;

    const updated = updateHealthAlertConfig(
      {
        enabled: typeof enabled === 'boolean' ? enabled : undefined,
        webhookUrl: typeof webhookUrl === 'string' ? webhookUrl.trim() : undefined,
        whatsappAlertNumber: typeof whatsappAlertNumber === 'string' ? whatsappAlertNumber.trim() : undefined,
        emailAlert: typeof emailAlert === 'string' ? emailAlert.trim() : undefined,
        diskThresholdPercent: typeof diskThresholdPercent === 'number' ? diskThresholdPercent : undefined,
        errorThresholdPercent: typeof errorThresholdPercent === 'number' ? errorThresholdPercent : undefined,
        notifyOnDbFailure: typeof notifyOnDbFailure === 'boolean' ? notifyOnDbFailure : undefined,
      },
      adminUser
    );

    res.json({
      success: true,
      message: 'Konfigurasi kanal notifikasi peringatan berhasil disimpan.',
      config: updated,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memperbarui konfigurasi alert: ' + err.message });
  }
});
