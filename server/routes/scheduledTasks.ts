import { Router, Response } from 'express';
import { verifyAuth, AuthenticatedRequest, logActivity } from '../middleware/auth';
import {
  listScheduledTasks,
  triggerTaskManually,
  toggleTaskEnabled,
} from '../services/scheduledTaskService';

export const scheduledTasksRouter = Router();

// GET /api/admin/tasks/list
scheduledTasksRouter.get('/list', verifyAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const tasks = listScheduledTasks();
    res.json({ tasks });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memuat daftar tugas otomatis' });
  }
});

// POST /api/admin/tasks/trigger/:taskKey
scheduledTasksRouter.post('/trigger/:taskKey', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taskKey } = req.params;
    const adminUser = req.user?.username || 'admin';

    const result = await triggerTaskManually(taskKey, adminUser);
    logActivity(adminUser, 'TRIGGER_SCHEDULED_TASK', 'scheduled_tasks', taskKey, `Hasil: ${result.message}`);

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menjalankan tugas otomatis' });
  }
});

// POST /api/admin/tasks/toggle/:taskKey
scheduledTasksRouter.post('/toggle/:taskKey', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taskKey } = req.params;
    const { isEnabled } = req.body;
    const adminUser = req.user?.username || 'admin';

    await toggleTaskEnabled(taskKey, Boolean(isEnabled));
    logActivity(adminUser, 'TOGGLE_TASK_ENABLED', 'scheduled_tasks', taskKey, `Status baru: ${isEnabled ? 'aktif' : 'nonaktif'}`);

    res.json({ success: true, isEnabled: Boolean(isEnabled) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal mengubah status tugas' });
  }
});
