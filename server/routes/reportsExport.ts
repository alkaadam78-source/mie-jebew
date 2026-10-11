import { Router, Response } from 'express';
import { db } from '../db/database';
import { verifyAuth, AuthenticatedRequest, logActivity } from '../middleware/auth';

export const reportsExportRouter = Router();

function convertToCSV(headers: string[], rows: any[][]): string {
  const escapeCell = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const rowLines = rows.map((r) => r.map(escapeCell).join(',')).join('\n');
  return `${headerLine}\n${rowLines}`;
}

// GET /api/admin/export/orders
reportsExportRouter.get('/orders', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = db.prepare(`SELECT * FROM orders ORDER BY created_at DESC`).all() as any[];
    const headers = ['ID Pesanan', 'Nama Pelanggan', 'No WhatsApp', 'Tipe', 'Meja', 'Alamat', 'Metode Bayar', 'Status Bayar', 'Subtotal', 'Diskon', 'Total Bayar', 'Status Pesanan', 'Tanggal Pesanan'];
    const rows = orders.map((o) => [
      o.id,
      o.customer_name,
      o.customer_phone,
      o.order_type,
      o.table_number || '-',
      o.address || '-',
      o.payment_method,
      o.payment_status,
      o.subtotal,
      o.discount_amount,
      o.total_amount,
      o.order_status,
      o.created_at,
    ]);

    const csv = convertToCSV(headers, rows);
    const adminUser = req.user?.username || 'admin';
    logActivity(adminUser, 'EXPORT_REPORT', 'orders', 'all', `Export ${orders.length} data pesanan ke CSV`);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="laporan-pesanan-mie-jebew-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal mengekspor laporan pesanan' });
  }
});

// GET /api/admin/export/coins
reportsExportRouter.get('/coins', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const txs = db.prepare(`
      SELECT ct.*, cu.name as customer_name, cu.phone as customer_phone
      FROM coin_transactions ct
      LEFT JOIN customer_users cu ON ct.user_id = cu.id
      ORDER BY ct.id DESC
    `).all() as any[];

    const headers = ['ID Mutasi', 'ID Pelanggan', 'Nama Pelanggan', 'WhatsApp', 'Tipe Mutasi', 'Jumlah Koin', 'Saldo Sebelum', 'Saldo Sesudah', 'Keterangan', 'Waktu'];
    const rows = txs.map((t) => [
      t.id,
      t.user_id,
      t.customer_name || '-',
      t.customer_phone || '-',
      t.type,
      t.amount,
      t.balance_before,
      t.balance_after,
      t.description,
      t.created_at,
    ]);

    const csv = convertToCSV(headers, rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="buku-besar-koin-mie-jebew-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal mengekspor buku besar koin' });
  }
});

// GET /api/admin/export/inventory
reportsExportRouter.get('/inventory', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const items = db.prepare(`SELECT * FROM inventory_items ORDER BY current_stock ASC`).all() as any[];
    const headers = ['ID Inventaris', 'Nama Barang', 'Tipe', 'SKU', 'Stok Saat Ini', 'Batas Peringatan', 'Satuan', 'Rata-rata Penjualan/Hari', 'Terakhir Restock', 'Terakhir Update'];
    const rows = items.map((i) => [
      i.id,
      i.name,
      i.item_type,
      i.sku,
      i.current_stock,
      i.min_stock_alert,
      i.unit,
      i.daily_avg_sales,
      i.last_restocked_at || '-',
      i.updated_at,
    ]);

    const csv = convertToCSV(headers, rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="laporan-stok-inventaris-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal mengekspor laporan stok' });
  }
});

// GET /api/admin/export/audit-logs
reportsExportRouter.get('/audit-logs', verifyAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = db.prepare(`SELECT * FROM activity_logs ORDER BY id DESC LIMIT 500`).all() as any[];
    const headers = ['ID Log', 'Username Admin', 'Aksi', 'Entitas', 'ID Entitas', 'Detail', 'Waktu'];
    const rows = logs.map((l) => [
      l.id,
      l.admin_username,
      l.action,
      l.entity,
      l.entity_id || '-',
      l.details || '-',
      l.timestamp,
    ]);

    const csv = convertToCSV(headers, rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-admin-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal mengekspor audit logs' });
  }
});
