import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { verifyAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';
import {
  createBackup,
  getBackupList,
  testRestoreBackup,
  restoreBackup,
  BACKUP_DIR,
} from '../services/backupService';

export const backupRouter = Router();

// ==========================================
// GET /api/system/backup/list
// Daftar seluruh versi backup database
// ==========================================
backupRouter.get('/list', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (_req: AuthenticatedRequest, res: Response) => {
  try {
    const list = getBackupList();
    res.json({
      success: true,
      backups: list,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memuat daftar backup: ' + err.message });
  }
});

// ==========================================
// POST /api/system/backup/create
// Buat cadangan baru secara manual
// ==========================================
backupRouter.post('/create', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { notes } = req.body;
    const adminUser = req.user!.username;

    const record = await createBackup('manual', adminUser, notes);
    res.json({
      success: true,
      message: `Cadangan database berhasil dibuat (${(record.size_bytes / 1024).toFixed(1)} KB, ${record.records_count} data).`,
      backup: record,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal membuat cadangan: ' + err.message });
  }
});

// ==========================================
// POST /api/system/backup/test-restore/:id
// Uji pemulihan (Test Restore Dry-Run)
// ==========================================
backupRouter.post('/test-restore/:id', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await testRestoreBackup(id);
    res.json({
      success: true,
      result,
    });
  } catch (err: any) {
    res.status(400).json({ error: 'Uji pemulihan gagal: ' + err.message });
  }
});

// ==========================================
// POST /api/system/backup/restore/:id
// Pulihkan database ke versi cadangan yang dipilih
// ==========================================
backupRouter.post('/restore/:id', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const adminUser = req.user!.username;

    const result = await restoreBackup(id, adminUser);
    res.json({
      success: true,
      message: result.message,
      restoredTables: result.restoredTables,
      restoredRecords: result.restoredRecords,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memulihkan database: ' + err.message });
  }
});

// ==========================================
// GET /api/system/backup/download/:id
// Unduh file JSON cadangan
// ==========================================
backupRouter.get('/download/:id', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const list = getBackupList();
    const target = list.find((b) => b.id === id);

    if (!target) {
      return res.status(404).json({ error: 'Cadangan tidak ditemukan.' });
    }

    const filePath = path.join(BACKUP_DIR, target.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File fisik cadangan tidak ditemukan di server.' });
    }

    res.download(filePath, target.filename);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengunduh file cadangan: ' + err.message });
  }
});
