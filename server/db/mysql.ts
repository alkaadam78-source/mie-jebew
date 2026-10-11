import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

export interface MySQLConfig {
  host?: string;
  user?: string;
  password?: string;
  database?: string;
  port?: number;
}

const dbHost = process.env.DB_HOST || process.env.MYSQL_HOST;
const dbUser = process.env.DB_USER || process.env.MYSQL_USER;
const dbPassword = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '';
const dbName = process.env.DB_NAME || process.env.MYSQL_DATABASE || 'mie_jebew_db';
const dbPort = parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306', 10);
let pool: mysql.Pool | null = null;
let isConnected = false;

export function isMySQLConfigured(): boolean {
  return Boolean(dbHost && dbUser);
}

export function getMySQLPool(): mysql.Pool | null {
  if (pool) return pool;

  if (!isMySQLConfigured()) {
    return null;
  }

  try {
    const useSSL = process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true';
    const poolConfig: any = {
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      port: dbPort,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      charset: 'utf8mb4_unicode_ci',
      multipleStatements: true,
    };

    if (useSSL) {
      poolConfig.ssl = {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
      };
    }

    pool = mysql.createPool(poolConfig);
    console.log(`[MySQL] Connection pool initialized for database '${dbName}' on ${dbHost}:${dbPort} (SSL: ${useSSL ? 'Enabled' : 'Disabled'})`);
    return pool;
  } catch (error) {
    console.error('[MySQL] Failed to create connection pool:', error);
    return null;
  }
}

export async function testMySQLConnection(): Promise<boolean> {
  const currentPool = getMySQLPool();
  if (!currentPool) return false;

  try {
    const connection = await currentPool.getConnection();
    await connection.ping();
    connection.release();
    isConnected = true;
    console.log(`[MySQL / phpMyAdmin] Successfully connected to '${dbName}' at ${dbHost}:${dbPort}`);
    return true;
  } catch (err: any) {
    console.warn(`[MySQL] Note: Could not connect to MySQL server (${err.message}). Falling back safely to local database.`);
    isConnected = false;
    return false;
  }
}

export async function initMySQLSchema(): Promise<void> {
  if (!isMySQLConfigured()) return;

  const connected = await testMySQLConnection();
  if (!connected || !pool) return;

  try {
    // Check if tables already exist
    const [rows]: any = await pool.query(`SHOW TABLES LIKE 'orders'`);
    if (rows && rows.length > 0) {
      console.log('[MySQL] Tables already exist in phpMyAdmin / MySQL.');
      return;
    }

    console.log('[MySQL] Initializing tables in phpMyAdmin / MySQL from database.sql...');
    const sqlPath = path.resolve(process.cwd(), 'database.sql');
    if (fs.existsSync(sqlPath)) {
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      await pool.query(sqlContent);
      console.log('[MySQL] Database tables and seed data created successfully in phpMyAdmin!');
    }
  } catch (err: any) {
    console.error('[MySQL] Error initializing schema:', err.message);
  }
}

// ==========================================
// ORDER RECORDER (Saves Order to phpMyAdmin)
// ==========================================
export interface OrderRecordData {
  id: string;
  customerName: string;
  customerPhone: string;
  orderType: string;
  tableNumber?: string;
  address?: string;
  paymentMethod: string;
  paymentStatus?: string;
  subtotal: number;
  discountAmount?: number;
  voucherCode?: string;
  totalAmount: number;
  additionalNotes?: string;
  items: Array<{
    menuItemId?: string;
    itemName: string;
    quantity: number;
    spiceLevel?: number;
    toppingsSummary?: string;
    unitPrice: number;
    subtotalItem: number;
    notes?: string;
  }>;
}

export async function recordOrderToMySQL(order: OrderRecordData): Promise<boolean> {
  const currentPool = getMySQLPool();
  if (!currentPool) return false;

  const conn = await currentPool.getConnection();
  try {
    await conn.beginTransaction();

    const initialOrderStatus = (order as any).orderStatus || 
      (order.paymentStatus === 'paid' ? 'paid' : 'pending');

    const insertOrderSql = `
      INSERT INTO orders (
        id, customer_name, customer_phone, order_type, table_number,
        address, payment_method, payment_status, subtotal, discount_amount,
        voucher_code, total_amount, additional_notes, order_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    await conn.execute(insertOrderSql, [
      order.id,
      order.customerName,
      order.customerPhone,
      order.orderType,
      order.tableNumber || null,
      order.address || null,
      order.paymentMethod,
      order.paymentStatus || (order.paymentMethod === 'cash' ? 'pending' : 'paid'),
      order.subtotal,
      order.discountAmount || 0,
      order.voucherCode || null,
      order.totalAmount,
      order.additionalNotes || null,
      initialOrderStatus,
    ]);

    // Insert order items
    const insertItemSql = `
      INSERT INTO order_items (
        order_id, menu_item_id, item_name, quantity, spice_level,
        toppings_summary, unit_price, subtotal_item, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const item of order.items) {
      await conn.execute(insertItemSql, [
        order.id,
        item.menuItemId || null,
        item.itemName,
        item.quantity,
        item.spiceLevel ?? 0,
        item.toppingsSummary || null,
        item.unitPrice,
        item.subtotalItem,
        item.notes || null,
      ]);
    }

    // If voucher used, update voucher status
    if (order.voucherCode) {
      await conn.execute(
        `UPDATE vouchers SET is_used = 1, order_id = ?, used_at = NOW() WHERE code = ?`,
        [order.id, order.voucherCode]
      );
    }

    await conn.commit();
    console.log(`[MySQL] Successfully recorded order ${order.id} with ${order.items.length} items into phpMyAdmin.`);
    return true;
  } catch (err: any) {
    await conn.rollback();
    console.error(`[MySQL] Failed to record order ${order.id}:`, err.message);
    return false;
  } finally {
    conn.release();
  }
}

// ==========================================
// REWARDS & COINS RECORDER
// ==========================================
export async function recordSpinToMySQL(userIdentifier: string, coinsWon: number, segmentLabel: string): Promise<boolean> {
  const currentPool = getMySQLPool();
  if (!currentPool) return false;

  try {
    await currentPool.execute(
      `INSERT INTO spin_history (user_identifier, coins_won, segment_label, created_at) VALUES (?, ?, ?, NOW())`,
      [userIdentifier, coinsWon, segmentLabel]
    );

    await currentPool.execute(
      `INSERT INTO user_coins (user_identifier, coins_balance, last_spin_date, updated_at)
       VALUES (?, ?, CURDATE(), NOW())
       ON DUPLICATE KEY UPDATE coins_balance = coins_balance + VALUES(coins_balance), last_spin_date = CURDATE(), updated_at = NOW()`,
      [userIdentifier, coinsWon]
    );

    return true;
  } catch (err: any) {
    console.error('[MySQL] Failed to record spin:', err.message);
    return false;
  }
}

export async function saveVoucherToMySQL(voucher: {
  id: string;
  code: string;
  title: string;
  rewardType: string;
  discountAmount: number;
  costInCoins: number;
  userIdentifier?: string;
}): Promise<boolean> {
  const currentPool = getMySQLPool();
  if (!currentPool) return false;

  try {
    await currentPool.execute(
      `INSERT INTO vouchers (id, code, title, reward_type, discount_amount, cost_in_coins, user_identifier, is_used, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
      [
        voucher.id,
        voucher.code,
        voucher.title,
        voucher.rewardType,
        voucher.discountAmount,
        voucher.costInCoins,
        voucher.userIdentifier || null,
      ]
    );
    return true;
  } catch (err: any) {
    console.error('[MySQL] Failed to save voucher:', err.message);
    return false;
  }
}
