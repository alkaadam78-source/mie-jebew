import { db } from '../db/database';
import { getMySQLPool } from '../db/mysql';

export interface InventoryItem {
  id: string;
  item_type: 'product' | 'bottle' | 'physical_reward' | 'bundle';
  reference_id?: string;
  name: string;
  sku: string;
  current_stock: number;
  min_stock_alert: number;
  unit: string;
  daily_avg_sales: number;
  estimated_days_left: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  last_restocked_at?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryLog {
  id: number;
  inventory_id: string;
  item_name?: string;
  change_type: 'order_deduction' | 'restock' | 'correction' | 'reward_claim' | 'waste';
  quantity_change: number;
  stock_before: number;
  stock_after: number;
  notes?: string;
  admin_username: string;
  reference_id?: string;
  created_at: string;
}

export interface InventoryOverview {
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  items: InventoryItem[];
  recentLogs: InventoryLog[];
}

/**
 * Mengambil ringkasan data inventaris dan proyeksi run-rate stok
 */
export async function getInventoryOverview(): Promise<InventoryOverview> {
  const rawItems = db.prepare(`SELECT * FROM inventory_items ORDER BY current_stock ASC`).all() as any[];

  const items: InventoryItem[] = rawItems.map((item) => {
    const avgDaily = item.daily_avg_sales > 0 ? item.daily_avg_sales : 1;
    const daysLeft = item.current_stock > 0 ? Math.round((item.current_stock / avgDaily) * 10) / 10 : 0;

    let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
    if (item.current_stock <= 0) {
      status = 'out_of_stock';
    } else if (item.current_stock <= item.min_stock_alert) {
      status = 'low_stock';
    }

    return {
      ...item,
      estimated_days_left: daysLeft,
      stock_status: status,
    };
  });

  const rawLogs = db.prepare(`
    SELECT il.*, ii.name as item_name
    FROM inventory_logs il
    LEFT JOIN inventory_items ii ON il.inventory_id = ii.id
    ORDER BY il.id DESC
    LIMIT 50
  `).all() as any[];

  const lowStockCount = items.filter((i) => i.stock_status === 'low_stock').length;
  const outOfStockCount = items.filter((i) => i.stock_status === 'out_of_stock').length;

  return {
    totalItems: items.length,
    lowStockCount,
    outOfStockCount,
    items,
    recentLogs: rawLogs,
  };
}

/**
 * Menyesuaikan stok barang (Restock / Koreksi / Pengurangan)
 */
export async function adjustStock(
  itemId: string,
  changeType: 'order_deduction' | 'restock' | 'correction' | 'reward_claim' | 'waste',
  quantityChange: number,
  notes: string,
  adminUsername: string = 'system',
  referenceId?: string
): Promise<{ success: boolean; newStock: number; message: string }> {
  const item = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(itemId) as any;
  if (!item) {
    return { success: false, newStock: 0, message: 'Barang inventaris tidak ditemukan.' };
  }

  const stockBefore = item.current_stock;
  const stockAfter = Math.max(0, stockBefore + quantityChange);
  const now = new Date().toISOString();
  const pool = getMySQLPool();

  // Update di SQLite
  db.prepare(`
    UPDATE inventory_items
    SET current_stock = ?,
        last_restocked_at = CASE WHEN ? > 0 THEN ? ELSE last_restocked_at END,
        updated_at = ?
    WHERE id = ?
  `).run(stockAfter, quantityChange, now, now, itemId);

  // Catat log
  db.prepare(`
    INSERT INTO inventory_logs (
      inventory_id, change_type, quantity_change, stock_before, stock_after, notes, admin_username, reference_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(itemId, changeType, quantityChange, stockBefore, stockAfter, notes, adminUsername, referenceId || null, now);

  // Sinkronkan ke MySQL
  if (pool) {
    try {
      await pool.execute(
        `UPDATE inventory_items
         SET current_stock = ?,
             last_restocked_at = CASE WHEN ? > 0 THEN NOW() ELSE last_restocked_at END,
             updated_at = NOW()
         WHERE id = ?`,
        [stockAfter, quantityChange, itemId]
      );

      await pool.execute(
        `INSERT INTO inventory_logs (
          inventory_id, change_type, quantity_change, stock_before, stock_after, notes, admin_username, reference_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [itemId, changeType, quantityChange, stockBefore, stockAfter, notes, adminUsername, referenceId || null]
      );
    } catch (mysqlErr: any) {
      console.warn('[Inventory] MySQL update warning:', mysqlErr.message);
    }
  }

  return {
    success: true,
    newStock: stockAfter,
    message: `Stok ${item.name} berhasil disesuaikan dari ${stockBefore} menjadi ${stockAfter} ${item.unit}.`,
  };
}

/**
 * Pengurangan stok otomatis saat pesanan masuk/selesai
 */
export async function deductOrderStock(orderId: string, items: Array<{ menuItemId?: string; quantity: number }>): Promise<void> {
  for (const it of items) {
    if (!it.menuItemId) continue;
    // Cari inventory item yang memiliki reference_id sesuai menuItemId
    const inv = db.prepare('SELECT id FROM inventory_items WHERE reference_id = ?').get(it.menuItemId) as any;
    if (inv) {
      await adjustStock(
        inv.id,
        'order_deduction',
        -Math.abs(it.quantity),
        `Pengurangan otomatis pesanan #${orderId}`,
        'system',
        orderId
      );
    }
  }
}
