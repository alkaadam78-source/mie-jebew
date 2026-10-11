import { Router, Response } from 'express';
import { db } from '../db/database';
import { getMySQLPool } from '../db/mysql';
import { verifyAuth, AuthenticatedRequest, logActivity } from '../middleware/auth';

export const customersAdminRouter = Router();

// GET /api/admin/customers
customersAdminRouter.get('/', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const search = req.query.search ? String(req.query.search).trim() : '';
    const pool = getMySQLPool();

    if (pool) {
      try {
        let mysqlQuery = `
          SELECT cu.*,
                 COUNT(DISTINCT o.id) as total_orders,
                 COALESCE(SUM(o.total_amount), 0) as total_spent
          FROM customer_users cu
          LEFT JOIN orders o ON cu.phone = o.customer_phone
        `;
        const mysqlParams: any[] = [];
        if (search) {
          mysqlQuery += ` WHERE cu.name LIKE ? OR cu.phone LIKE ?`;
          mysqlParams.push(`%${search}%`, `%${search}%`);
        }
        mysqlQuery += ` GROUP BY cu.id ORDER BY cu.id DESC LIMIT 100`;

        const [rows]: any = await pool.query(mysqlQuery, mysqlParams);
        return res.json({ customers: rows, source: 'mysql' });
      } catch (err: any) {
        console.warn('[Customers Admin] MySQL query fallback to SQLite:', err.message);
      }
    }

    let query = `
      SELECT cu.*,
             COUNT(DISTINCT o.id) as total_orders,
             COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM customer_users cu
      LEFT JOIN orders o ON cu.phone = o.customer_phone
    `;
    const params: any[] = [];

    if (search) {
      query += ` WHERE cu.name LIKE ? OR cu.phone LIKE ?`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY cu.id ORDER BY cu.id DESC LIMIT 100`;

    const customers = db.prepare(query).all(...params) as any[];
    res.json({ customers, source: 'sqlite' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memuat data pelanggan' });
  }
});

// GET /api/admin/customers/:id
customersAdminRouter.get('/:id', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const pool = getMySQLPool();

    if (pool) {
      try {
        const [userRows]: any = await pool.query('SELECT * FROM customer_users WHERE id = ?', [id]);
        if (userRows && userRows.length > 0) {
          const customer = userRows[0];
          const [coinHistory]: any = await pool.query(
            'SELECT * FROM coin_transactions WHERE user_id = ? ORDER BY id DESC LIMIT 50',
            [id]
          );
          const [spinHistory]: any = await pool.query(
            'SELECT * FROM spin_history WHERE user_id = ? ORDER BY id DESC LIMIT 30',
            [id]
          );
          const [orders]: any = await pool.query(
            'SELECT * FROM orders WHERE customer_phone = ? ORDER BY created_at DESC LIMIT 30',
            [customer.phone]
          );

          return res.json({
            customer,
            coinHistory: coinHistory || [],
            spinHistory: spinHistory || [],
            orders: orders || [],
            source: 'mysql',
          });
        }
      } catch (err: any) {
        console.warn('[Customers Admin Detail] MySQL query fallback to SQLite:', err.message);
      }
    }

    const customer = db.prepare('SELECT * FROM customer_users WHERE id = ?').get(id) as any;
    if (!customer) {
      return res.status(404).json({ error: 'Pelanggan tidak ditemukan' });
    }

    const coinHistory = db.prepare(`
      SELECT * FROM coin_transactions WHERE user_id = ? ORDER BY id DESC LIMIT 50
    `).all(id);

    const spinHistory = db.prepare(`
      SELECT * FROM spin_history WHERE user_id = ? ORDER BY id DESC LIMIT 30
    `).all(id);

    const orders = db.prepare(`
      SELECT * FROM orders WHERE customer_phone = ? ORDER BY created_at DESC LIMIT 30
    `).all(customer.phone);

    res.json({
      customer,
      coinHistory,
      spinHistory,
      orders,
      source: 'sqlite',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memuat detail pelanggan' });
  }
});

// POST /api/admin/customers/:id/adjust-coins
customersAdminRouter.post('/:id/adjust-coins', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;
    const adminUser = req.user?.username || 'admin';

    if (!amount || typeof amount !== 'number' || !reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({ error: 'Jumlah koin dan alasan penyesuaian wajib diisi.' });
    }

    const customer = db.prepare('SELECT * FROM customer_users WHERE id = ?').get(id) as any;
    if (!customer) {
      return res.status(404).json({ error: 'Pelanggan tidak ditemukan' });
    }

    const balanceBefore = customer.coins_balance;
    const balanceAfter = Math.max(0, balanceBefore + amount);
    const now = new Date().toISOString();
    const pool = getMySQLPool();

    // 1. Update customer_users di SQLite
    db.prepare(`UPDATE customer_users SET coins_balance = ?, updated_at = ? WHERE id = ?`).run(balanceAfter, now, id);

    // 2. Catat ke coin_transactions (Buku Besar)
    db.prepare(`
      INSERT INTO coin_transactions (
        user_id, type, amount, balance_before, balance_after, description, reference_id, created_at
      ) VALUES (?, 'adjustment', ?, ?, ?, ?, ?, ?)
    `).run(id, amount, balanceBefore, balanceAfter, `Penyesuaian Admin (${adminUser}): ${reason.trim()}`, `manual-admin-${adminUser}`, now);

    // 3. Sinkronkan ke MySQL
    if (pool) {
      try {
        await pool.execute(`UPDATE customer_users SET coins_balance = ?, updated_at = NOW() WHERE id = ?`, [balanceAfter, id]);
        await pool.execute(
          `INSERT INTO coin_transactions (
            user_id, type, amount, balance_before, balance_after, description, reference_id, created_at
          ) VALUES (?, 'adjustment', ?, ?, ?, ?, ?, NOW())`,
          [id, amount, balanceBefore, balanceAfter, `Penyesuaian Admin (${adminUser}): ${reason.trim()}`, `manual-admin-${adminUser}`]
        );
      } catch (mysqlErr: any) {
        console.warn('[CustomerAdmin] MySQL adjust sync warning:', mysqlErr.message);
      }
    }

    logActivity(adminUser, 'ADJUST_CUSTOMER_COINS', 'customer_users', id, `Perubahan: ${amount > 0 ? '+' : ''}${amount}, Saldo Baru: ${balanceAfter}. Alasan: ${reason}`);

    res.json({
      success: true,
      balanceBefore,
      balanceAfter,
      message: `Saldo ${customer.name} berhasil disesuaikan dari ${balanceBefore} menjadi ${balanceAfter} koin.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menyesuaikan saldo koin pelanggan' });
  }
});
