import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { db } from '../db/database';
import { verifyAuth, requireRole, logActivity, AuthenticatedRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';

export const mediaRouter = Router();

mediaRouter.get('/', verifyAuth, (_req, res: Response) => {
  const files = db.prepare('SELECT * FROM media ORDER BY created_at DESC').all();
  res.json({ files });
});

mediaRouter.post(
  '/upload',
  verifyAuth,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR']),
  upload.single('file'),
  (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada file yang diunggah.' });
    }

    const id = `med-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const url = `/uploads/${req.file.filename}`;

    db.prepare(`
      INSERT INTO media (id, file_name, original_name, mime_type, file_size, url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, url, now);

    logActivity(
      req.user!.username,
      'CREATE',
      'media',
      id,
      `Mengunggah gambar: ${req.file.originalname} (${Math.round(req.file.size / 1024)} KB)`
    );

    return res.status(201).json({
      message: 'File berhasil diunggah.',
      file: {
        id,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        url,
        size: req.file.size,
        mimeType: req.file.mimetype,
      },
    });
  }
);

mediaRouter.delete('/:id', verifyAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const file = db.prepare('SELECT * FROM media WHERE id = ?').get(id) as any;
  if (!file) return res.status(404).json({ error: 'File tidak ditemukan.' });

  // Delete from disk
  const filePath = path.resolve(process.cwd(), 'public', 'uploads', file.file_name);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error('Error deleting file from disk:', e);
    }
  }

  db.prepare('DELETE FROM media WHERE id = ?').run(id);
  logActivity(req.user!.username, 'DELETE', 'media', id, `Menghapus file media: ${file.original_name}`);

  res.json({ message: 'File berhasil dihapus.' });
});
