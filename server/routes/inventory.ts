import { Router, Response } from 'express';
import { verifyAuth, AuthenticatedRequest, logActivity } from '../middleware/auth';
import {
  getInventoryOverview,
  adjustStock,
} from '../services/inventoryService';

export const inventoryRouter = Router();

// GET /api/admin/inventory/list
inventoryRouter.get('/list', verifyAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const overview = await getInventoryOverview();
    res.json(overview);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memuat inventaris' });
  }
});

// POST /api/admin/inventory/adjust
inventoryRouter.post('/adjust', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId, changeType, quantityChange, notes } = req.body;
    const adminUser = req.user?.username || 'admin';

    if (!itemId || typeof quantityChange !== 'number') {
      return res.status(400).json({ error: 'Data penyesuaian stok tidak lengkap.' });
    }

    const result = await adjustStock(
      itemId,
      changeType || 'correction',
      quantityChange,
      notes || 'Penyesuaian manual melalui admin',
      adminUser
    );

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    logActivity(
      adminUser,
      'ADJUST_STOCK',
      'inventory_items',
      itemId,
      `Perubahan: ${quantityChange > 0 ? '+' : ''}${quantityChange}, Stok Baru: ${result.newStock}`
    );

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menyesuaikan stok' });
  }
});
