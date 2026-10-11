import { Router, Response } from 'express';
import { db } from '../db/database';
import { getMySQLPool } from '../db/mysql';
import { verifyAuth, AuthenticatedRequest } from '../middleware/auth';

export const notificationsRouter = Router();

export interface AdminNotification {
  id: string;
  type: 'order' | 'stock' | 'redeem' | 'voucher_used';
  title: string;
  message: string;
  timestamp: string;
  targetTab: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  read?: boolean;
}

// ==========================================
// GET /api/notifications - Live Feed Notifikasi Otomatis
// ==========================================
notificationsRouter.get('/', verifyAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const notifications: AdminNotification[] = [];
    const pool = getMySQLPool();

    // 1. NOTIFIKASI PESANAN BARU (Status 'pending' atau 'paid')
    if (pool) {
      try {
        const [orders]: any = await pool.query(`
          SELECT id, customer_name, total_amount, order_status, payment_status, created_at
          FROM orders
          WHERE order_status IN ('pending', 'paid', 'processing')
          ORDER BY created_at DESC
          LIMIT 10
        `);

        for (const ord of (orders || [])) {
          const isPending = ord.order_status === 'pending';
          notifications.push({
            id: `ord_${ord.id}`,
            type: 'order',
            title: isPending ? '⏳ Pesanan Menunggu Pembayaran' : '💰 Pesanan Baru Diterima & Dibayar',
            message: `${ord.customer_name} memesan senilai Rp${Number(ord.total_amount).toLocaleString('id-ID')} (#${ord.id})`,
            timestamp: ord.created_at,
            targetTab: 'orders',
            severity: isPending ? 'warning' : 'success',
          });
        }
      } catch (err: any) {
        console.warn('[Notifications] MySQL orders warning:', err.message);
      }
    } else {
      const orders = db.prepare(`
        SELECT id, customer_name, total_amount, order_status, payment_status, created_at
        FROM orders
        WHERE order_status IN ('pending', 'paid', 'processing')
        ORDER BY created_at DESC
        LIMIT 10
      `).all() as any[];

      for (const ord of orders) {
        const isPending = ord.order_status === 'pending';
        notifications.push({
          id: `ord_${ord.id}`,
          type: 'order',
          title: isPending ? '⏳ Pesanan Menunggu Pembayaran' : '💰 Pesanan Baru Diterima & Dibayar',
          message: `${ord.customer_name} memesan senilai Rp${Number(ord.total_amount).toLocaleString('id-ID')} (#${ord.id})`,
          timestamp: ord.created_at,
          targetTab: 'orders',
          severity: isPending ? 'warning' : 'success',
        });
      }
    }

    // 2. NOTIFIKASI PERINGATAN STOK MENIPIS / HABIS (Bottles & Sambal)
    if (pool) {
      try {
        const [lowStock]: any = await pool.query(`
          SELECT id, name, stock_status, updated_at, created_at
          FROM products_bottles
          WHERE stock_status IN ('low_stock', 'out_of_stock') AND is_active = 1
          LIMIT 5
        `);

        for (const item of (lowStock || [])) {
          const isOut = item.stock_status === 'out_of_stock';
          notifications.push({
            id: `stock_${item.id}`,
            type: 'stock',
            title: isOut ? '🚨 STOK HABIS!' : '⚠️ Stok Sambal/Botol Menipis',
            message: `Produk "${item.name}" saat ini berstatus ${isOut ? 'HABIS TOTAL' : 'Hampir Habis'}. Segera produksi/restock!`,
            timestamp: item.updated_at || item.created_at,
            targetTab: 'bottles',
            severity: isOut ? 'critical' : 'warning',
          });
        }
      } catch (err: any) {
        console.warn('[Notifications] MySQL stock warning:', err.message);
      }
    } else {
      const lowStock = db.prepare(`
        SELECT id, name, stock_status, updated_at, created_at
        FROM products_bottles
        WHERE stock_status IN ('low_stock', 'out_of_stock') AND is_active = 1
        LIMIT 5
      `).all() as any[];

      for (const item of lowStock) {
        const isOut = item.stock_status === 'out_of_stock';
        notifications.push({
          id: `stock_${item.id}`,
          type: 'stock',
          title: isOut ? '🚨 STOK HABIS!' : '⚠️ Stok Sambal/Botol Menipis',
          message: `Produk "${item.name}" saat ini berstatus ${isOut ? 'HABIS TOTAL' : 'Hampir Habis'}. Segera produksi/restock!`,
          timestamp: item.updated_at || item.created_at,
          targetTab: 'bottles',
          severity: isOut ? 'critical' : 'warning',
        });
      }
    }

    // 3. NOTIFIKASI PENUKARAN KOIN MASUK (Klaim Voucher)
    if (pool) {
      try {
        const [redemptions]: any = await pool.query(`
          SELECT v.id, v.code, v.title, v.cost_in_coins, v.created_at, cu.name as customer_name
          FROM vouchers v
          LEFT JOIN customer_users cu ON v.user_id = cu.id
          ORDER BY v.created_at DESC
          LIMIT 8
        `);

        for (const v of (redemptions || [])) {
          notifications.push({
            id: `redeem_${v.id}`,
            type: 'redeem',
            title: '🪙 Penukaran Koin Customer Masuk',
            message: `${v.customer_name || 'Pelanggan'} menukarkan ${v.cost_in_coins} koin untuk "${v.title}" (KODE: ${v.code})`,
            timestamp: v.created_at,
            targetTab: 'rewards',
            severity: 'info',
          });
        }
      } catch (err: any) {
        console.warn('[Notifications] MySQL vouchers warning:', err.message);
      }
    } else {
      const redemptions = db.prepare(`
        SELECT v.id, v.code, v.title, v.cost_in_coins, v.created_at, cu.name as customer_name
        FROM vouchers v
        LEFT JOIN customer_users cu ON v.user_id = cu.id
        ORDER BY v.created_at DESC
        LIMIT 8
      `).all() as any[];

      for (const v of redemptions) {
        notifications.push({
          id: `redeem_${v.id}`,
          type: 'redeem',
          title: '🪙 Penukaran Koin Customer Masuk',
          message: `${v.customer_name || 'Pelanggan'} menukarkan ${v.cost_in_coins} koin untuk "${v.title}" (KODE: ${v.code})`,
          timestamp: v.created_at,
          targetTab: 'rewards',
          severity: 'info',
        });
      }
    }

    // 4. NOTIFIKASI VOUCHER DIGUNAKAN
    if (pool) {
      try {
        const [usedVouchers]: any = await pool.query(`
          SELECT v.id, v.code, v.title, v.discount_amount, v.used_at, cu.name as customer_name
          FROM vouchers v
          LEFT JOIN customer_users cu ON v.user_id = cu.id
          WHERE v.is_used = 1
          ORDER BY v.used_at DESC
          LIMIT 5
        `);

        for (const uv of (usedVouchers || [])) {
          notifications.push({
            id: `used_${uv.id}`,
            type: 'voucher_used',
            title: '🎟️ Voucher Telah Digunakan',
            message: `Voucher ${uv.code} (${uv.title}) senilai Rp${Number(uv.discount_amount).toLocaleString('id-ID')} telah sukses diklaim dalam pesanan`,
            timestamp: uv.used_at || new Date().toISOString(),
            targetTab: 'orders',
            severity: 'success',
          });
        }
      } catch (err: any) {
        console.warn('[Notifications] MySQL used vouchers warning:', err.message);
      }
    } else {
      const usedVouchers = db.prepare(`
        SELECT v.id, v.code, v.title, v.discount_amount, v.used_at, cu.name as customer_name
        FROM vouchers v
        LEFT JOIN customer_users cu ON v.user_id = cu.id
        WHERE v.is_used = 1
        ORDER BY v.used_at DESC
        LIMIT 5
      `).all() as any[];

      for (const uv of usedVouchers) {
        notifications.push({
          id: `used_${uv.id}`,
          type: 'voucher_used',
          title: '🎟️ Voucher Telah Digunakan',
          message: `Voucher ${uv.code} (${uv.title}) senilai Rp${Number(uv.discount_amount).toLocaleString('id-ID')} telah sukses diklaim dalam pesanan`,
          timestamp: uv.used_at || new Date().toISOString(),
          targetTab: 'orders',
          severity: 'success',
        });
      }
    }

    // Urutkan semua notifikasi berdasarkan timestamp terbaru
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({
      success: true,
      unreadCount: notifications.length,
      notifications: notifications.slice(0, 20),
    });
  } catch (err: any) {
    console.error('[Notifications] Error fetching notifications:', err);
    res.status(500).json({ error: 'Gagal memuat notifikasi.' });
  }
});
