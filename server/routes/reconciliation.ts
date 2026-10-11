import { Router, Response } from 'express';
import { verifyAuth, AuthenticatedRequest, logActivity } from '../middleware/auth';
import {
  runReconciliationAudit,
  getReconciliationSummary,
  resolveAnomaly,
} from '../services/reconciliationService';

export const reconciliationRouter = Router();

// GET /api/admin/reconciliation/status
reconciliationRouter.get('/status', verifyAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const summary = await getReconciliationSummary();
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memuat status rekonsiliasi' });
  }
});

// POST /api/admin/reconciliation/run
reconciliationRouter.post('/run', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const summary = await runReconciliationAudit();
    const adminUser = req.user?.username || 'admin';
    logActivity(adminUser, 'RUN_RECONCILIATION', 'reconciliation', 'all', `Audit rekonsiliasi manual dijalankan (${summary.totalAnomalies} anomali)`);
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menjalankan audit rekonsiliasi' });
  }
});

// POST /api/admin/reconciliation/resolve/:id
reconciliationRouter.post('/resolve/:id', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;
    const adminUser = req.user?.username || 'admin';

    const result = await resolveAnomaly(id, action || 'mark_resolved', notes || '', adminUser);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    logActivity(adminUser, 'RESOLVE_ANOMALY', 'reconciliation_anomalies', id, `Aksi: ${action}, Catatan: ${notes}`);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menyelesaikan anomali' });
  }
});
