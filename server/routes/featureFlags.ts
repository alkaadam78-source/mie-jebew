import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { getMySQLPool } from '../db/mysql';
import { verifyAuth, AuthenticatedRequest, logActivity } from '../middleware/auth';

export const featureFlagsRouter = Router();

// GET /api/public/features (Akses publik tanpa token)
featureFlagsRouter.get('/public', (_req: Request, res: Response) => {
  try {
    const settings = db.prepare(`SELECT setting_key, setting_value FROM system_settings`).all() as any[];
    const flags: Record<string, any> = {
      spinWheelEnabled: true,
      coinsRewardEnabled: true,
      voucherRedeemEnabled: true,
      onlineOrderingEnabled: true,
      entranceGateMandatory: true,
      maintenanceMode: 'off',
    };

    for (const s of settings) {
      if (s.setting_key === 'feature_spin_wheel_enabled') flags.spinWheelEnabled = s.setting_value === 'true';
      if (s.setting_key === 'feature_rewards_coins_enabled') flags.coinsRewardEnabled = s.setting_value === 'true';
      if (s.setting_key === 'feature_voucher_redeem_enabled') flags.voucherRedeemEnabled = s.setting_value === 'true';
      if (s.setting_key === 'feature_online_ordering_enabled') flags.onlineOrderingEnabled = s.setting_value === 'true';
      if (s.setting_key === 'feature_entrance_gate_mandatory') flags.entranceGateMandatory = s.setting_value === 'true';
      if (s.setting_key === 'maintenance_mode') flags.maintenanceMode = s.setting_value;
    }

    res.json(flags);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memuat feature flags' });
  }
});

// GET /api/admin/features (Admin)
featureFlagsRouter.get('/admin', verifyAuth, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const rows = db.prepare(`SELECT * FROM system_settings WHERE setting_key LIKE 'feature_%' OR setting_key LIKE 'maintenance_%'`).all() as any[];
    res.json({ settings: rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memuat pengaturan sistem' });
  }
});

// POST /api/admin/features/update (Admin)
featureFlagsRouter.post('/admin/update', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { key, value } = req.body;
    const adminUser = req.user?.username || 'admin';

    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Kunci (key) dan nilai (value) wajib diisi.' });
    }

    const now = new Date().toISOString();
    const strVal = String(value);

    db.prepare(`
      INSERT INTO system_settings (setting_key, setting_value, updated_by, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(setting_key) DO UPDATE SET
        setting_value = excluded.setting_value,
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at
    `).run(key, strVal, adminUser, now);

    const pool = getMySQLPool();
    if (pool) {
      try {
        await pool.execute(
          `INSERT INTO system_settings (setting_key, setting_value, updated_by, updated_at)
           VALUES (?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE
             setting_value = VALUES(setting_value),
             updated_by = VALUES(updated_by),
             updated_at = NOW()`,
          [key, strVal, adminUser]
        );
      } catch {}
    }

    logActivity(adminUser, 'UPDATE_FEATURE_FLAG', 'system_settings', key, `Nilai baru: ${strVal}`);

    res.json({ success: true, key, value: strVal });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memperbarui feature flag' });
  }
});
