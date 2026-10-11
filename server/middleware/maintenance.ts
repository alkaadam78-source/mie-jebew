import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getMaintenanceConfig } from '../services/maintenanceService';
import { JWT_SECRET, AuthUser } from './auth';

/**
 * Memeriksa apakah request berasal dari Admin yang terautentikasi
 */
function isAdminRequest(req: Request): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return Boolean(decoded && decoded.id && decoded.role);
  } catch {
    return false;
  }
}

/**
 * Middleware Emergency Maintenance Guard
 * Menjamin pembatasan ketat di sisi server (Backend Enforcement)
 */
export async function maintenanceGuard(req: Request, res: Response, next: NextFunction) {
  const fullPath = (req.originalUrl || req.path || '').split('?')[0];

  // 1. Non-API requests (file frontend, assets, images, favicon) selalu diizinkan agar halaman maintenance/frontend bisa dimuat
  if (!fullPath.startsWith('/api')) {
    return next();
  }

  // 2. Endpoint kritis admin & status publik selalu diizinkan
  if (
    fullPath.startsWith('/api/auth') || // Admin & Auth login
    fullPath.startsWith('/api/system') || // Admin system configuration
    fullPath === '/api/public/maintenance-status' || // Status check frontend
    fullPath === '/api/health'
  ) {
    return next();
  }

  // 3. Jika Admin sedang login, IZINKAN 100% bypass pemeliharaan (Admin tetap dapat mengelola dashboard)
  if (isAdminRequest(req)) {
    return next();
  }

  // 4. Cek Status Pemeliharaan dari Database / Cache
  const config = await getMaintenanceConfig();

  // Jika website normal / tidak maintenance -> Lanjutkan
  if (!config.isEnabled) {
    return next();
  }

  // 5. KONDISI FULL MAINTENANCE: Seluruh akses API transaksi & data publik ditolak
  if (config.mode === 'full') {
    return res.status(503).json({
      error: 'Website sedang dalam pemeliharaan (Emergency Maintenance Mode).',
      maintenance: true,
      mode: 'full',
      title: config.title,
      message: config.message,
      updatedAt: config.updatedAt,
    });
  }

  // 6. KONDISI READ-ONLY MODE: Pengguna bisa melihat katalog/menu, namun seluruh transaksi, checkout, spin, dan mutasi diblokir
  if (config.mode === 'read_only') {
    // Hanya izinkan GET untuk endpoint publik browsing katalog
    const isSafeReadRequest =
      req.method === 'GET' &&
      (fullPath.startsWith('/api/public') ||
        fullPath.startsWith('/api/menu') ||
        fullPath.startsWith('/api/bottles') ||
        fullPath.startsWith('/api/content') ||
        fullPath.startsWith('/api/media') ||
        fullPath.startsWith('/api/promotions'));

    if (isSafeReadRequest) {
      return next();
    }

    // Blokir mutasi (POST, PUT, DELETE, PATCH) serta endpoint transaksi khusus
    return res.status(503).json({
      error: 'Fitur transaksi, pemesanan, spin wheel, dan penukaran koin sedang dinonaktifkan sementara (Read-Only Maintenance).',
      maintenance: true,
      mode: 'read_only',
      title: config.title,
      message: config.message,
      updatedAt: config.updatedAt,
    });
  }

  next();
}
