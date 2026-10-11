import { Router, Response } from 'express';
import { verifyAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';
import {
  getFraudAlerts,
  updateFraudAlertStatus,
  auditAllCustomerBalances,
} from '../services/antiFraudService';

export const antiFraudRouter = Router();

// ==========================================
// GET /api/system/fraud/alerts
// Ambil daftar anomali & peringatan kecurangan
// ==========================================
antiFraudRouter.get('/alerts', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const statusFilter = req.query.status as 'open' | 'resolved' | 'dismissed' | undefined;
    const alerts = getFraudAlerts(statusFilter);
    res.json({
      success: true,
      alerts,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memuat fraud alerts: ' + err.message });
  }
});

// ==========================================
// POST /api/system/fraud/alerts/:id/status
// Ubah status anomali (Resolve / Dismiss)
// ==========================================
antiFraudRouter.post('/alerts/:id/status', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminUser = req.user!.username;

    if (!['resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Status harus bernilai "resolved" atau "dismissed".' });
    }

    await updateFraudAlertStatus(id, status, adminUser);
    res.json({
      success: true,
      message: `Status alert fraud berhasil diubah menjadi ${status.toUpperCase()}.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengubah status alert: ' + err.message });
  }
});

// ==========================================
// POST /api/system/fraud/audit-balance
// Audit Integritas Saldo Koin Pengguna vs Ledger Transaksi
// ==========================================
antiFraudRouter.post('/audit-balance', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await auditAllCustomerBalances();
    res.json({
      success: true,
      message:
        result.mismatches.length === 0
          ? `Audit Selesai: 100% Saldo dari ${result.totalAudited} pengguna valid & sesuai dengan ledger transaksi!`
          : `Audit Selesai: Ditemukan ${result.mismatches.length} ketidakcocokan saldo yang telah dipicu sebagai Critical Fraud Alert!`,
      audit: result,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal melakukan audit saldo koin: ' + err.message });
  }
});
