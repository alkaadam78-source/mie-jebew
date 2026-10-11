import { Router, Response } from 'express';
import { verifyAuth, AuthenticatedRequest, logActivity } from '../middleware/auth';
import {
  runDeploymentHealthCheck,
  createDeploymentSnapshot,
  getDeploymentHistory,
  rollbackDeployment,
} from '../services/deploymentService';

export const deploymentRouter = Router();

// GET /api/admin/deployment/health-check
deploymentRouter.get('/health-check', verifyAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const report = await runDeploymentHealthCheck();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menjalankan deployment health check' });
  }
});

// GET /api/admin/deployment/history
deploymentRouter.get('/history', verifyAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const history = getDeploymentHistory();
    res.json({ history });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memuat riwayat deployment' });
  }
});

// POST /api/admin/deployment/snapshot
deploymentRouter.post('/snapshot', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { version, notes } = req.body;
    const adminUser = req.user?.username || 'admin';

    if (!version || typeof version !== 'string') {
      return res.status(400).json({ error: 'Nomor versi rilis wajib diisi (contoh: v1.2.1).' });
    }

    const record = await createDeploymentSnapshot(version.trim(), notes || '', adminUser);
    logActivity(adminUser, 'CREATE_DEPLOY_SNAPSHOT', 'deployment_records', record.id, `Versi: ${version}`);

    res.json({ success: true, record });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal membuat snapshot deployment' });
  }
});

// POST /api/admin/deployment/rollback/:id
deploymentRouter.post('/rollback/:id', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const adminUser = req.user?.username || 'admin';

    const result = await rollbackDeployment(id, adminUser);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    logActivity(adminUser, 'ROLLBACK_DEPLOYMENT', 'deployment_records', id, result.message);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal melakukan rollback' });
  }
});
