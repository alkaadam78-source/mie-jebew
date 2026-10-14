import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const isServerless = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isServerless ? '/tmp' : path.resolve(process.cwd(), 'data');
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Notice: data dir mkdir skipped in serverless', e);
}

const DB_PATH = path.join(DATA_DIR, 'database.sqlite');

if (isServerless && !fs.existsSync(DB_PATH)) {
  const seedCandidates = [
    path.resolve(process.cwd(), 'data', 'database.sqlite'),
    path.resolve(__dirname, '..', '..', 'data', 'database.sqlite'),
    path.resolve(__dirname, '..', 'data', 'database.sqlite'),
  ];
  for (const cand of seedCandidates) {
    if (fs.existsSync(cand)) {
      try {
        fs.copyFileSync(cand, DB_PATH);
        break;
      } catch (e) {
        console.warn('Failed to copy seed database:', e);
      }
    }
  }
}

export const db = new Database(DB_PATH);

// Enable WAL mode for high concurrency and performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'ADMIN', -- 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR'
      name TEXT NOT NULL,
      phone TEXT DEFAULT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category_id TEXT NOT NULL,
      price REAL NOT NULL,
      sale_price REAL,
      description TEXT,
      image TEXT,
      badge TEXT,
      is_spicy_selectable INTEGER NOT NULL DEFAULT 1,
      is_popular INTEGER NOT NULL DEFAULT 0,
      is_best_seller INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      ingredients TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products_bottles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subtitle TEXT,
      price REAL NOT NULL,
      volume_ml INTEGER NOT NULL DEFAULT 200,
      description TEXT,
      heat_level INTEGER NOT NULL DEFAULT 3,
      image TEXT,
      badge TEXT,
      stock_status TEXT NOT NULL DEFAULT 'in_stock', -- 'in_stock' | 'low_stock' | 'out_of_stock'
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS custom_order_options (
      id TEXT PRIMARY KEY,
      group_type TEXT NOT NULL, -- 'spice_level' | 'topping' | 'size' | 'addon'
      name TEXT NOT NULL,
      level_number INTEGER,
      badge TEXT,
      description TEXT,
      price_adjustment REAL NOT NULL DEFAULT 0,
      is_popular INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS bundles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      original_price REAL NOT NULL,
      savings_badge TEXT,
      items_included TEXT NOT NULL, -- JSON string array
      image TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS promotions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      promo_code TEXT UNIQUE NOT NULL,
      description TEXT,
      discount_type TEXT NOT NULL, -- 'percentage' | 'fixed'
      discount_value REAL NOT NULL,
      min_purchase REAL NOT NULL DEFAULT 0,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      usage_limit INTEGER,
      used_count INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS why_choose_us (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS behind_the_kitchen (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      image_url TEXT NOT NULL,
      tag TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS vinas_section (
      id TEXT PRIMARY KEY DEFAULT 'vinas_main',
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      quote TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT NOT NULL,
      cta_text TEXT NOT NULL DEFAULT 'Coba Resep Vina',
      cta_link TEXT NOT NULL DEFAULT '#menu',
      badge TEXT NOT NULL DEFAULT "Founder's Secret Recipe",
      is_active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS social_links (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      handle TEXT NOT NULL,
      url TEXT NOT NULL,
      icon TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS contact_information (
      id TEXT PRIMARY KEY DEFAULT 'main_contact',
      phone TEXT NOT NULL,
      whatsapp_number TEXT NOT NULL,
      whatsapp_display TEXT NOT NULL,
      email TEXT,
      address_note TEXT NOT NULL,
      address_description TEXT NOT NULL,
      opening_hours TEXT NOT NULL,
      google_maps_url TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS homepage_content (
      id TEXT PRIMARY KEY DEFAULT 'hero_content',
      store_name TEXT NOT NULL,
      hero_headline TEXT NOT NULL,
      hero_subheadline TEXT NOT NULL,
      hero_description TEXT NOT NULL,
      hero_badge TEXT NOT NULL,
      cta_order_text TEXT NOT NULL,
      cta_menu_text TEXT NOT NULL,
      announcement_banner TEXT,
      is_announcement_active INTEGER NOT NULL DEFAULT 1,
      video_banner_url TEXT,
      video_poster_url TEXT,
      qris_merchant_name TEXT,
      qris_nmid TEXT,
      qris_image_url TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      file_name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      url TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_username TEXT NOT NULL,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      order_type TEXT NOT NULL DEFAULT 'delivery',
      table_number TEXT,
      address TEXT,
      payment_method TEXT NOT NULL DEFAULT 'qris',
      payment_status TEXT NOT NULL DEFAULT 'pending',
      subtotal REAL NOT NULL,
      discount_amount REAL NOT NULL DEFAULT 0,
      voucher_code TEXT,
      total_amount REAL NOT NULL,
      additional_notes TEXT,
      order_status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      menu_item_id TEXT,
      item_name TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      spice_level INTEGER DEFAULT 0,
      toppings_summary TEXT,
      unit_price REAL NOT NULL,
      subtotal_item REAL NOT NULL,
      notes TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS customer_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      coins_balance INTEGER NOT NULL DEFAULT 0,
      last_spin_wib_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS coin_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      balance_before INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      description TEXT NOT NULL,
      reference_id TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES customer_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS spin_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_identifier TEXT NOT NULL,
      coins_won INTEGER NOT NULL,
      segment_label TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      wib_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES customer_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS vouchers (
      id TEXT PRIMARY KEY,
      user_id INTEGER,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      reward_type TEXT NOT NULL,
      discount_amount REAL NOT NULL,
      cost_in_coins INTEGER NOT NULL,
      user_identifier TEXT,
      is_used INTEGER NOT NULL DEFAULT 0,
      order_id TEXT,
      used_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES customer_users(id) ON DELETE SET NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS security_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      ip_address TEXT NOT NULL,
      action_type TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'warning',
      user_agent TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      setting_key TEXT PRIMARY KEY,
      setting_value TEXT NOT NULL,
      updated_by TEXT DEFAULT 'system',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_backups (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      backup_type TEXT NOT NULL DEFAULT 'manual', -- 'auto_daily' | 'manual'
      size_bytes INTEGER NOT NULL DEFAULT 0,
      tables_count INTEGER NOT NULL DEFAULT 0,
      records_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'success', -- 'success' | 'failed'
      checksum TEXT,
      notes TEXT,
      created_by TEXT NOT NULL DEFAULT 'system',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fraud_alerts (
      id TEXT PRIMARY KEY,
      alert_type TEXT NOT NULL, -- 'spin_spam' | 'rapid_redeem' | 'brute_force' | 'balance_tampering' | 'multi_account'
      severity TEXT NOT NULL DEFAULT 'medium', -- 'low' | 'medium' | 'high' | 'critical'
      target_user_id TEXT,
      target_user_name TEXT,
      ip_address TEXT,
      details TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open', -- 'open' | 'resolved' | 'dismissed'
      created_at TEXT NOT NULL,
      resolved_at TEXT,
      resolved_by TEXT
    );

    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY,
      item_type TEXT NOT NULL, -- 'product' | 'bottle' | 'physical_reward' | 'bundle'
      reference_id TEXT,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      current_stock INTEGER NOT NULL DEFAULT 50,
      min_stock_alert INTEGER NOT NULL DEFAULT 10,
      unit TEXT NOT NULL DEFAULT 'porsi',
      daily_avg_sales REAL NOT NULL DEFAULT 5.0,
      last_restocked_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inventory_id TEXT NOT NULL,
      change_type TEXT NOT NULL, -- 'order_deduction' | 'restock' | 'correction' | 'reward_claim' | 'waste'
      quantity_change INTEGER NOT NULL,
      stock_before INTEGER NOT NULL,
      stock_after INTEGER NOT NULL,
      notes TEXT,
      admin_username TEXT DEFAULT 'system',
      reference_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reconciliation_anomalies (
      id TEXT PRIMARY KEY,
      anomaly_type TEXT NOT NULL, -- 'paid_order_pending' | 'order_reward_missing' | 'voucher_multiple_use' | 'coin_balance_mismatch' | 'stock_mismatch'
      reference_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'medium', -- 'low' | 'medium' | 'high' | 'critical'
      data_payload TEXT,
      status TEXT NOT NULL DEFAULT 'unresolved', -- 'unresolved' | 'resolved' | 'ignored'
      resolution_notes TEXT,
      resolved_by TEXT,
      resolved_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS deployment_records (
      id TEXT PRIMARY KEY,
      version TEXT NOT NULL,
      git_commit TEXT,
      deploy_status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'staged' | 'rolled_back' | 'failed'
      notes TEXT,
      database_backup_id TEXT,
      deployed_by TEXT NOT NULL DEFAULT 'admin',
      deployed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scheduled_tasks (
      task_key TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      schedule_cron TEXT NOT NULL,
      description TEXT,
      last_run_at TEXT,
      next_run_at TEXT,
      last_status TEXT NOT NULL DEFAULT 'pending', -- 'success' | 'failed' | 'running' | 'pending'
      last_duration_ms INTEGER DEFAULT 0,
      last_error TEXT,
      is_enabled INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS promotional_popup (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      headline TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      description TEXT NOT NULL,
      cta_text TEXT NOT NULL,
      cta_link TEXT NOT NULL,
      secondary_text TEXT NOT NULL,
      image_url TEXT NOT NULL,
      badge_text TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      target_page TEXT NOT NULL DEFAULT 'all', -- 'all' | 'home' | 'menu'
      delay_seconds INTEGER NOT NULL DEFAULT 2,
      frequency TEXT NOT NULL DEFAULT 'once_per_session', -- 'once_per_session' | 'once_per_day' | 'always'
      start_date TEXT DEFAULT NULL,
      end_date TEXT DEFAULT NULL,
      status TEXT NOT NULL DEFAULT 'published', -- 'published' | 'draft'
      updated_by TEXT DEFAULT 'admin',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS promotional_popup_history (
      id TEXT PRIMARY KEY,
      popup_id TEXT NOT NULL,
      title TEXT NOT NULL,
      headline TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      description TEXT NOT NULL,
      cta_text TEXT NOT NULL,
      cta_link TEXT NOT NULL,
      secondary_text TEXT NOT NULL,
      image_url TEXT NOT NULL,
      badge_text TEXT,
      is_active INTEGER NOT NULL,
      target_page TEXT NOT NULL,
      delay_seconds INTEGER NOT NULL,
      frequency TEXT NOT NULL,
      start_date TEXT,
      end_date TEXT,
      status TEXT NOT NULL,
      saved_by TEXT NOT NULL,
      saved_at TEXT NOT NULL,
      change_summary TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_menu_category ON menu_items(category_id);
    CREATE INDEX IF NOT EXISTS idx_menu_active ON menu_items(is_active);
    CREATE INDEX IF NOT EXISTS idx_bottles_active ON products_bottles(is_active);
    CREATE INDEX IF NOT EXISTS idx_promo_active ON promotions(is_active);
    CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON activity_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_cust_phone ON customer_users(phone);
    CREATE INDEX IF NOT EXISTS idx_coin_tx_user ON coin_transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sec_ip ON security_logs(ip_address);
    CREATE INDEX IF NOT EXISTS idx_backup_created ON system_backups(created_at);
    CREATE INDEX IF NOT EXISTS idx_fraud_status ON fraud_alerts(status);
    CREATE INDEX IF NOT EXISTS idx_inv_sku ON inventory_items(sku);
    CREATE INDEX IF NOT EXISTS idx_inv_logs_item ON inventory_logs(inventory_id);
    CREATE INDEX IF NOT EXISTS idx_recon_status ON reconciliation_anomalies(status);
    CREATE UNIQUE INDEX IF NOT EXISTS uq_spin_user_wib_date ON spin_history(user_id, wib_date);
  `);

  seedInitialData();
  seedOperationsData();
}

function seedInitialData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number };
  if (userCount.count === 0) {
    console.log('Seeding initial admin user and store data...');
    const now = new Date().toISOString();
    const hash = bcrypt.hashSync(process.env.ADMIN_DEFAULT_PASS || 'admin123', 10);

    db.prepare(`
      INSERT INTO admin_users (username, email, password_hash, role, name, phone, is_active, created_at, updated_at)
      VALUES (?, ?, ?, 'SUPER_ADMIN', 'Adam', '085122014584', 1, ?, ?)
    `).run('admin', 'admin@miejebew.com', hash, now, now);

    // Categories
    const categories = [
      { id: 'all', name: 'Semua Menu', slug: 'all', icon: '✨', sort_order: 1 },
      { id: 'mie', name: 'Mie Jebew', slug: 'mie', icon: '🍜', sort_order: 2 },
      { id: 'paket', name: 'Paket Hemat', slug: 'paket', icon: '🔥', sort_order: 3 },
      { id: 'topping', name: 'Topping & Side', slug: 'topping', icon: '🥚', sort_order: 4 },
      { id: 'minuman', name: 'Minuman Segar', slug: 'minuman', icon: '🥤', sort_order: 5 },
    ];
    const insertCat = db.prepare(`
      INSERT INTO categories (id, name, slug, icon, sort_order, is_active)
      VALUES (@id, @name, @slug, @icon, @sort_order, 1)
    `);
    for (const c of categories) insertCat.run(c);

    // Initial Menu Items (SERBA 10 RIBU)
    const menuItems = [
      {
        id: 'mie-1',
        name: 'Mie Jebew Original',
        category_id: 'mie',
        price: 10000,
        sale_price: null,
        description: 'Mie kenyal pedas khas Jebew dengan bumbu rahasia gurih pedas nampol, taburan ayam melimpah, pangsit renyah, dan bakso lezat!',
        image: '/rasa-mie/Original.jpeg',
        badge: '🔥 SERBA 10K',
        is_spicy_selectable: 1,
        is_popular: 1,
        is_best_seller: 1,
        sort_order: 1,
        ingredients: 'Mie kenyal, chili oil khas Jebew, ayam cincang gurih, pangsit goreng, daun bawang',
      },
      {
        id: 'mie-2',
        name: '???',
        category_id: 'mie',
        price: 0,
        description: 'Menu rahasia dalam pengembangan resep! Nantikan sensasi pedas spesial segera.',
        image: '',
        badge: '❓ SEGERA HADIR',
        is_spicy_selectable: 0,
        is_popular: 0,
        is_best_seller: 0,
        sort_order: 2,
        ingredients: '',
      },
      {
        id: 'mie-3',
        name: '???',
        category_id: 'mie',
        price: 0,
        description: 'Menu rahasia dalam pengembangan resep! Racikan spesial bumbu gurih khas nusantara.',
        image: '',
        badge: '❓ SEGERA HADIR',
        is_spicy_selectable: 0,
        is_popular: 0,
        is_best_seller: 0,
        sort_order: 3,
        ingredients: '',
      },
      {
        id: 'mie-4',
        name: '???',
        category_id: 'mie',
        price: 0,
        description: 'Menu rahasia dalam pengembangan resep! Sensasi pedas jebew berpadu lelehan spesial.',
        image: '',
        badge: '❓ SEGERA HADIR',
        is_spicy_selectable: 0,
        is_popular: 0,
        is_best_seller: 0,
        sort_order: 4,
        ingredients: '',
      },
      {
        id: 'paket-1',
        name: '???',
        category_id: 'paket',
        price: 0,
        description: 'Menu paket rahasia dalam persiapan dapur Crave Corner.',
        image: '',
        badge: '❓ SEGERA HADIR',
        is_spicy_selectable: 0,
        is_popular: 0,
        is_best_seller: 0,
        sort_order: 5,
        ingredients: '',
      },
      {
        id: 'topping-1',
        name: '???',
        category_id: 'topping',
        price: 0,
        description: 'Topping rahasia dalam persiapan dapur Crave Corner.',
        image: '',
        badge: '❓ SEGERA HADIR',
        is_spicy_selectable: 0,
        is_popular: 0,
        is_best_seller: 0,
        sort_order: 6,
        ingredients: '',
      },
      {
        id: 'minuman-1',
        name: '???',
        category_id: 'minuman',
        price: 0,
        description: 'Minuman segar rahasia dalam persiapan.',
        image: '',
        badge: '❓ SEGERA HADIR',
        is_spicy_selectable: 0,
        is_popular: 0,
        is_best_seller: 0,
        sort_order: 7,
        ingredients: '',
      },
    ];

    const insertMenu = db.prepare(`
      INSERT INTO menu_items (
        id, name, category_id, price, sale_price, description, image, badge,
        is_spicy_selectable, is_popular, is_best_seller, is_active, sort_order, ingredients, created_at, updated_at
      ) VALUES (
        @id, @name, @category_id, @price, @sale_price, @description, @image, @badge,
        @is_spicy_selectable, @is_popular, @is_best_seller, 1, @sort_order, @ingredients, '${now}', '${now}'
      )
    `);
    for (const m of menuItems) {
      insertMenu.run({ sale_price: null, ...m });
    }

    // Initial Bottles / Products (SERBA 10 RIBU)
    const bottles = [
      {
        id: 'bot-1',
        name: 'Chili Oil Jebew Mini Jar (100ml)',
        subtitle: 'Bumbu Minyak Cabai Pedas Gurih Siap Saji',
        price: 10000,
        volume_ml: 100,
        description: 'Chili oil racikan rahasia khas Mie Jebew dengan cabai rawit merah segar, bawang putih goreng, dan rempah aromatik pilihan.',
        heat_level: 4,
        image: '/rasa-mie/Original.jpeg',
        badge: '🔥 SERBA 10K',
        stock_status: 'in_stock',
        sort_order: 1,
      },
      {
        id: 'bot-2',
        name: 'Sambal Jebew Extra Hot Cup (100ml)',
        subtitle: 'Pedas Nampol Menggelegar untuk Segala Makanan',
        price: 10000,
        volume_ml: 100,
        description: 'Sambal ulek khas jebew dengan tingkat kepedasan maksimal. Cocok untuk cocolan gorengan, nasi hangat, mie instan, dan lauk!',
        heat_level: 5,
        image: '/rasa-mie/Original.jpeg',
        badge: '☠️ SERBA 10K',
        stock_status: 'in_stock',
        sort_order: 2,
      },
      {
        id: 'bot-3',
        name: 'Bumbu Mie Jebew Sachet Praktis',
        subtitle: 'Bikin Mie Jebew Sendiri di Rumah',
        price: 8000,
        volume_ml: 80,
        description: 'Paket bumbu sachet komplit khas jebew, cukup aduk dengan mie rebus instan favoritmu dan rasakan sensasi jebew asli!',
        heat_level: 3,
        image: '/rasa-mie/Original.jpeg',
        badge: '✨ HEMAT 8K',
        stock_status: 'in_stock',
        sort_order: 3,
      },
    ];

    const insertBottle = db.prepare(`
      INSERT INTO products_bottles (
        id, name, subtitle, price, volume_ml, description, heat_level, image, badge, stock_status, is_active, sort_order, created_at, updated_at
      ) VALUES (
        @id, @name, @subtitle, @price, @volume_ml, @description, @heat_level, @image, @badge, @stock_status, 1, @sort_order, '${now}', '${now}'
      )
    `);
    for (const b of bottles) insertBottle.run(b);

    // Custom Order Options (Spice levels free & toppings <= 3000)
    const customOptions = [
      { id: 'sp-0', group_type: 'spice_level', name: 'Level 0 — Gak Pedas', level_number: 0, badge: '👶 Safe Mode', description: 'Gurih manis gurih tanpa cabe', price_adjustment: 0, is_popular: 0, sort_order: 1 },
      { id: 'sp-1', group_type: 'spice_level', name: 'Level 1 — Sedang', level_number: 1, badge: '🌶️ Anget Manja', description: 'Pedas tipis-tipis menggugah selera', price_adjustment: 0, is_popular: 0, sort_order: 2 },
      { id: 'sp-2', group_type: 'spice_level', name: 'Level 2 — Pedas', level_number: 2, badge: '🌶️🌶️ Mulai Nendang', description: 'Pedas mantap yang bikin keringat bercucuran', price_adjustment: 0, is_popular: 1, sort_order: 3 },
      { id: 'sp-3', group_type: 'spice_level', name: 'Level 3 — Super Pedas', level_number: 3, badge: '🔥 Best Seller', description: 'Level paling favorit nagih abis!', price_adjustment: 0, is_popular: 1, sort_order: 4 },
      { id: 'sp-4', group_type: 'spice_level', name: 'Level 4 — Ekstra Pedas', level_number: 4, badge: '🔥🔥 Keringat Dingin', description: 'Cabe melimpah ruah lidah terbakar', price_adjustment: 0, is_popular: 0, sort_order: 5 },
      { id: 'sp-5', group_type: 'spice_level', name: 'Level 5 — Jebew Maksimal', level_number: 5, badge: '☠️ Neraka Jebew', description: 'Sensasi bibir jebew bergetar!', price_adjustment: 0, is_popular: 1, sort_order: 6 },
      // Toppings
      { id: 'top-1', group_type: 'topping', name: 'Pangsit Goreng Renyah (2 pcs)', level_number: null, badge: '🥟 Ekstra Kriuk', description: 'Pangsit renyah gurih', price_adjustment: 2000, is_popular: 1, sort_order: 7 },
      { id: 'top-2', group_type: 'topping', name: 'Bakso Sapi Kenyal (2 pcs)', level_number: null, badge: '🥩 Daging Asli', description: 'Bakso sapi lezat', price_adjustment: 3000, is_popular: 1, sort_order: 8 },
      { id: 'top-3', group_type: 'topping', name: 'Telur Mata Sapi / Ceplok', level_number: null, badge: '🍳 Tambah Gurih', description: 'Telur ayam segar matang/setengah matang', price_adjustment: 3000, is_popular: 0, sort_order: 9 },
      { id: 'top-4', group_type: 'topping', name: 'Ayam Tabur Melimpah', level_number: null, badge: '🍗 Ekstra Daging', description: 'Porsi daging ayam gurih dobel', price_adjustment: 3000, is_popular: 1, sort_order: 10 },
      { id: 'top-5', group_type: 'topping', name: 'Keju Mozarella Melt', level_number: null, badge: '🧀 Lumer Mewah', description: 'Keju leleh hangat', price_adjustment: 3000, is_popular: 1, sort_order: 11 },
    ];

    const insertOpt = db.prepare(`
      INSERT INTO custom_order_options (
        id, group_type, name, level_number, badge, description, price_adjustment, is_popular, is_active, sort_order
      ) VALUES (
        @id, @group_type, @name, @level_number, @badge, @description, @price_adjustment, @is_popular, 1, @sort_order
      )
    `);
    for (const opt of customOptions) insertOpt.run(opt);

    // Bundles (SERBA 10 RIBU)
    const bundles = [
      {
        id: 'bun-1',
        name: 'Paket Combo Serba 10K',
        description: '1 Porsi Mie Jebew Level Bebas + 1 Es Teh Manis Jumbo + 1 Porsi Pangsit Renyah!',
        price: 10000,
        original_price: 14000,
        savings_badge: 'HEMAT Rp4.000',
        items_included: JSON.stringify(['1x Mie Jebew', '1x Es Teh Jumbo', '1x Pangsit Renyah']),
        image: '/rasa-mie/Original.jpeg',
        sort_order: 1,
      },
      {
        id: 'bun-2',
        name: 'Paket Puas Dobel Topping 10K',
        description: '1 Porsi Mie Jebew Pedas Gurih + Pangsit Renyah + Bakso Sapi!',
        price: 10000,
        original_price: 13000,
        savings_badge: 'SERBA 10K',
        items_included: JSON.stringify(['1x Mie Jebew', '1x Pangsit Renyah', '1x Bakso Sapi']),
        image: '/rasa-mie/Original.jpeg',
        sort_order: 2,
      },
    ];
    const insertBundle = db.prepare(`
      INSERT INTO bundles (
        id, name, description, price, original_price, savings_badge, items_included, image, is_active, sort_order, created_at
      ) VALUES (
        @id, @name, @description, @price, @original_price, @savings_badge, @items_included, @image, 1, @sort_order, '${now}'
      )
    `);
    for (const b of bundles) insertBundle.run(b);

    // Promotions
    const promotions = [
      {
        id: 'pro-1',
        title: 'Promo Diskon Pengguna Baru',
        promo_code: 'JEBEWBARU',
        description: 'Dapatkan potongan 15% untuk pemesanan pertamamu via WhatsApp!',
        discount_type: 'percentage',
        discount_value: 15,
        min_purchase: 25000,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        usage_limit: 1000,
        image: '/rasa-mie/Original.jpeg',
        sort_order: 1,
      },
      {
        id: 'pro-2',
        title: 'Potongan Langsung Rp5.000',
        promo_code: 'HEMAT5RB',
        description: 'Potongan Rp5.000 untuk minimal belanja Rp30.000',
        discount_type: 'fixed',
        discount_value: 5000,
        min_purchase: 30000,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        usage_limit: 500,
        image: '/rasa-mie/Original.jpeg',
        sort_order: 2,
      },
    ];
    const insertPromo = db.prepare(`
      INSERT INTO promotions (
        id, title, promo_code, description, discount_type, discount_value, min_purchase,
        start_date, end_date, usage_limit, used_count, image, is_active, sort_order, created_at
      ) VALUES (
        @id, @title, @promo_code, @description, @discount_type, @discount_value, @min_purchase,
        @start_date, @end_date, @usage_limit, 0, @image, 1, @sort_order, '${now}'
      )
    `);
    for (const p of promotions) insertPromo.run(p);

    // Why Choose Us
    const whyUs = [
      {
        id: 'w-1',
        title: '100% Cabai Asli Pilihan',
        description: 'Kami hanya menggunakan cabai rawit segar langsung dari petani, tanpa bubuk cabai buatan atau pengawet berbahaya.',
        icon: '🌶️',
        sort_order: 1,
      },
      {
        id: 'w-2',
        title: 'Bumbu Chili Oil Racikan Rahasia',
        description: 'Minyak cabai dimasak perlahan (slow-cooked) selama 4 jam dengan rempah aromatik agar cita rasa gurih dan wanginya meresap sempurna.',
        icon: '🔥',
        sort_order: 2,
      },
      {
        id: 'w-3',
        title: 'Higienis & Selalu Dibuat Fresh',
        description: 'Setiap pesanan direbus dan diracik dadakan saat dipesan sehingga mie tetap kenyal dan disajikan hangat panas.',
        icon: '✨',
        sort_order: 3,
      },
      {
        id: 'w-4',
        title: 'Pesan Kilat Tanpa Antre',
        description: 'Pesan praktis langsung via WhatsApp smartphone, tanpa repot daftar akun panjang atau install aplikasi tambahan.',
        icon: '⚡',
        sort_order: 4,
      },
    ];
    const insertWhy = db.prepare(`
      INSERT INTO why_choose_us (id, title, description, icon, sort_order, is_active)
      VALUES (@id, @title, @description, @icon, @sort_order, 1)
    `);
    for (const w of whyUs) insertWhy.run(w);

    // Behind The Kitchen
    const kitchen = [
      {
        id: 'k-1',
        title: 'Proses Perebusan & Racikan Cabai Segar',
        description: 'Setiap helai mie direbus dengan ketepatan suhu air agar mendapatkan tekstur kenyal sempurna khas Jebew.',
        image_url: '/team-cravecorner.jpg',
        tag: 'Dapur Jebew',
        sort_order: 1,
      },
      {
        id: 'k-2',
        title: 'Penyajian Topping Ayam & Pangsit Renyah',
        description: 'Daging ayam cincang gurih ditaburkan dengan royal di atas setiap mangkok mie jebew panas.',
        image_url: '/team-slide-faces.jpg',
        tag: 'Kualitas Bahan',
        sort_order: 2,
      },
      {
        id: 'k-3',
        title: 'Tim Crave Corner yang Penuh Semangat',
        description: 'Dedikasi tinggi dari seluruh tim untuk menghadirkan kuliner pedas legendaris yang memuaskan lidah pecinta kuliner.',
        image_url: '/team-slide-dome.jpg',
        tag: 'Tim Kuliner',
        sort_order: 3,
      },
    ];
    const insertKitchen = db.prepare(`
      INSERT INTO behind_the_kitchen (id, title, description, image_url, tag, sort_order, is_active)
      VALUES (@id, @title, @description, @image_url, @tag, @sort_order, 1)
    `);
    for (const k of kitchen) insertKitchen.run(k);

    // Vina's Section
    db.prepare(`
      INSERT INTO vinas_section (
        id, title, subtitle, quote, description, image_url, cta_text, cta_link, badge, is_active, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      'vinas_main',
      "Vina's Signature Recipe",
      'Kisah Rasa di Balik Kelezatan Pedas Mie Jebew',
      'Pedas itu bukan sekadar membakar lidah, tetapi sebuah harmoni antara gurihnya rempah nusantara dan kehangatan rasa yang membekas di hati.',
      'Resep Mie Jebew lahir dari eksperimen dapur rumah oleh Vina, memadukan tradisi mie nusantara dengan sambal chili oil aromatik yang kaya rasa. Setiap bumbu dan racikan minyak diracik secara personal untuk memastikan kenikmatan rasa yang otentik dan tak terlupakan.',
      '/team-cravecorner.jpg',
      'Coba Resep Vina',
      '#menu',
      "Founder's Signature",
      now
    );

    // Social Links
    const socials = [
      {
        id: 'soc-1',
        platform: 'Instagram',
        handle: '@cravecorner0',
        url: 'https://www.instagram.com/cravecorner0?stkn=MTJ2OXpnMnAwZDNxNQ==',
        icon: 'InstagramIcon',
        sort_order: 1,
      },
      {
        id: 'soc-2',
        platform: 'WhatsApp',
        handle: '+62 851-2201-4573',
        url: 'https://wa.me/6285122014573',
        icon: 'Phone',
        sort_order: 2,
      },
      {
        id: 'soc-3',
        platform: 'TikTok',
        handle: '@miejebew_official',
        url: 'https://tiktok.com/@miejebew_official',
        icon: 'Sparkles',
        sort_order: 3,
      },
    ];
    const insertSoc = db.prepare(`
      INSERT INTO social_links (id, platform, handle, url, icon, is_active, sort_order)
      VALUES (@id, @platform, @handle, @url, @icon, 1, @sort_order)
    `);
    for (const s of socials) insertSoc.run(s);

    // Contact Information
    db.prepare(`
      INSERT INTO contact_information (
        id, phone, whatsapp_number, whatsapp_display, email, address_note, address_description, opening_hours, google_maps_url, updated_at
      ) VALUES (
        'main_contact',
        '+62 851-2201-4573',
        '6285122014573',
        '+62 851-2201-4573',
        'kontak@miejebew.com',
        'Pemesanan Online / Delivery & Outlet',
        'Pesanan diantar langsung ke alamat tujuanmu via konfirmasi WhatsApp atau ambil di outlet.',
        'Setiap Hari (Senin - Minggu) 10:00 - 22:00 WIB',
        'https://maps.google.com',
        '${now}'
      )
    `).run();

    // Homepage Content
    db.prepare(`
      INSERT INTO homepage_content (
        id, store_name, hero_headline, hero_subheadline, hero_description, hero_badge,
        cta_order_text, cta_menu_text, announcement_banner, is_announcement_active,
        video_banner_url, video_poster_url, qris_merchant_name, qris_nmid, qris_image_url, updated_at
      ) VALUES (
        'hero_content',
        'Mie Jebew Official',
        'MIE JEBEW',
        'PEDASNYA BIKIN JEBEW! 🌶️',
        'Sensasi mie kenyal bertabur ayam cincang gurih dengan siraman chili oil pedas nampol level 0 sampai 5! Tanpa ribet login, pesan langsung lewat WhatsApp dalam hitungan detik.',
        'BEST SELLER — 100% CABAI ASLI',
        '🔥 PESAN SEKARANG',
        'LIHAT MENU',
        '🎉 Diskon 15% untuk Pemesanan Pertama! Gunakan kode: JEBEWBARU',
        1,
        '/vedio baner/zajiZMil.mp4',
        '/video-poster.jpg',
        'CRAVE CORNER',
        'ID1026566705020',
        '/qris/Qris.jpeg',
        '${now}'
      )
    `).run();

    console.log('Database initialized and seeded successfully.');
  }
}

function seedOperationsData() {
  const now = new Date().toISOString();

  // 1. Seed Scheduled Tasks
  const taskCount = db.prepare('SELECT COUNT(*) as count FROM scheduled_tasks').get() as { count: number };
  if (taskCount.count === 0) {
    const tasks = [
      {
        task_key: 'daily_spin_reset',
        name: 'Reset Kuota Spin Harian (00:00 WIB)',
        schedule_cron: '0 17 * * *',
        description: 'Mereset kuota spin roda keberuntungan untuk seluruh pelanggan setiap pergantian hari WIB.',
        last_status: 'success',
        last_duration_ms: 120,
      },
      {
        task_key: 'auto_daily_backup',
        name: 'Pencadangan Database Otomatis Harian',
        schedule_cron: '0 19 * * *',
        description: 'Membuat snapshot cadangan database dan struktur file setiap hari pukul 02:00 WIB.',
        last_status: 'success',
        last_duration_ms: 450,
      },
      {
        task_key: 'reconciliation_audit',
        name: 'Audit Rekonsiliasi Transaksi & Saldo',
        schedule_cron: '0 */3 * * *',
        description: 'Memeriksa kesesuaian pembayaran, pesanan, saldo koin, dan pemakaian voucher.',
        last_status: 'success',
        last_duration_ms: 310,
      },
      {
        task_key: 'inventory_alert_check',
        name: 'Audit Stok Rendah & Notifikasi Admin',
        schedule_cron: '0 */6 * * *',
        description: 'Memeriksa batas minimum stok produk, sambal kemasan, dan hadiah fisik.',
        last_status: 'success',
        last_duration_ms: 95,
      },
      {
        task_key: 'voucher_expiry_check',
        name: 'Pemeriksaan Kedaluwarsa Voucher',
        schedule_cron: '0 * * * *',
        description: 'Memvalidasi masa berlaku voucher aktif dan memperbarui status kupon kedaluwarsa.',
        last_status: 'success',
        last_duration_ms: 140,
      },
      {
        task_key: 'temp_cleanup',
        name: 'Pembersihan File Sementara & Log Usang',
        schedule_cron: '0 20 * * *',
        description: 'Menghapus session token kedaluwarsa dan membersihkan cache sistem.',
        last_status: 'success',
        last_duration_ms: 220,
      },
    ];

    const insertTask = db.prepare(`
      INSERT OR IGNORE INTO scheduled_tasks (task_key, name, schedule_cron, description, last_run_at, next_run_at, last_status, last_duration_ms, is_enabled, updated_at)
      VALUES (@task_key, @name, @schedule_cron, @description, ?, ?, @last_status, @last_duration_ms, 1, ?)
    `);

    for (const t of tasks) {
      insertTask.run(now, now, now, t);
    }
  }

  // 2. Seed Inventory Items
  const invCount = db.prepare('SELECT COUNT(*) as count FROM inventory_items').get() as { count: number };
  if (invCount.count === 0) {
    const items = [
      {
        id: 'inv-mie-orig',
        item_type: 'product',
        reference_id: 'mie-1',
        name: 'Mie Jebew Original (Bahan Porsi)',
        sku: 'SKU-MIE-ORIG',
        current_stock: 120,
        min_stock_alert: 25,
        unit: 'porsi',
        daily_avg_sales: 18.5,
      },
      {
        id: 'inv-mie-kuah',
        item_type: 'product',
        reference_id: 'mie-2',
        name: 'Mie Jebew Kuah Pedas (Bahan Porsi)',
        sku: 'SKU-MIE-KUAH',
        current_stock: 85,
        min_stock_alert: 20,
        unit: 'porsi',
        daily_avg_sales: 12.0,
      },
      {
        id: 'inv-mie-manis',
        item_type: 'product',
        reference_id: 'mie-3',
        name: 'Mie Jebew Manis Gurih (Bahan Porsi)',
        sku: 'SKU-MIE-MANIS',
        current_stock: 75,
        min_stock_alert: 15,
        unit: 'porsi',
        daily_avg_sales: 10.5,
      },
      {
        id: 'inv-mie-keju',
        item_type: 'product',
        reference_id: 'mie-4',
        name: 'Mie Jebew Spesial Keju (Bahan Porsi)',
        sku: 'SKU-MIE-KEJU',
        current_stock: 50,
        min_stock_alert: 15,
        unit: 'porsi',
        daily_avg_sales: 8.0,
      },
      {
        id: 'inv-bot-orig',
        item_type: 'bottle',
        reference_id: 'bot-1',
        name: 'Sambal Botol Jebew Original 200ml',
        sku: 'SKU-BOT-ORIG',
        current_stock: 45,
        min_stock_alert: 10,
        unit: 'botol',
        daily_avg_sales: 4.2,
      },
      {
        id: 'inv-bot-xtra',
        item_type: 'bottle',
        reference_id: 'bot-2',
        name: 'Sambal Botol Jebew Ekstra Pedas 200ml',
        sku: 'SKU-BOT-XTRA',
        current_stock: 32,
        min_stock_alert: 10,
        unit: 'botol',
        daily_avg_sales: 3.5,
      },
      {
        id: 'inv-rwd-mie',
        item_type: 'physical_reward',
        reference_id: 'free_mie_original',
        name: 'Hadiah Fisik: Free 1 Porsi Mie Jebew Original (Reward 2.500 Koin)',
        sku: 'SKU-RWD-MIE-FREE',
        current_stock: 40,
        min_stock_alert: 10,
        unit: 'porsi',
        daily_avg_sales: 2.0,
      },
      {
        id: 'inv-top-pangsit',
        item_type: 'product',
        reference_id: 'top-1',
        name: 'Pangsit Goreng Renyah (Stok pcs)',
        sku: 'SKU-TOP-PANGSIT',
        current_stock: 200,
        min_stock_alert: 40,
        unit: 'pcs',
        daily_avg_sales: 35.0,
      },
      {
        id: 'inv-top-bakso',
        item_type: 'product',
        reference_id: 'top-2',
        name: 'Bakso Sapi Kenyal (Stok pcs)',
        sku: 'SKU-TOP-BAKSO',
        current_stock: 160,
        min_stock_alert: 30,
        unit: 'pcs',
        daily_avg_sales: 28.0,
      },
    ];

    const insertInv = db.prepare(`
      INSERT OR IGNORE INTO inventory_items (
        id, item_type, reference_id, name, sku, current_stock, min_stock_alert, unit, daily_avg_sales, last_restocked_at, created_at, updated_at
      ) VALUES (
        @id, @item_type, @reference_id, @name, @sku, @current_stock, @min_stock_alert, @unit, @daily_avg_sales, ?, ?, ?
      )
    `);

    for (const item of items) {
      insertInv.run(now, now, now, item);
    }
  }

  // 3. Seed Default Feature Flags in system_settings
  const defaultSettings = [
    { key: 'feature_spin_wheel_enabled', val: 'true' },
    { key: 'feature_rewards_coins_enabled', val: 'true' },
    { key: 'feature_voucher_redeem_enabled', val: 'true' },
    { key: 'feature_online_ordering_enabled', val: 'true' },
    { key: 'feature_entrance_gate_mandatory', val: 'true' },
    { key: 'maintenance_mode', val: 'off' },
  ];

  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO system_settings (setting_key, setting_value, updated_by, updated_at)
    VALUES (?, ?, 'system', ?)
  `);

  for (const s of defaultSettings) {
    insertSetting.run(s.key, s.val, now);
  }

  // 4. Seed Initial Deployment Record
  const depCount = db.prepare('SELECT COUNT(*) as count FROM deployment_records').get() as { count: number };
  if (depCount.count === 0) {
    db.prepare(`
      INSERT INTO deployment_records (id, version, git_commit, deploy_status, notes, deployed_by, deployed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'dep-init-2026',
      'v1.2.0-rc1',
      'f8e31a9',
      'active',
      'Rilis awal sistem kontrol operasional Mie Jebew, spin wheel harian, dan pemantauan sistem.',
      'Adam / Super Admin',
      now
    );
  }


  // Secret Menu & Image Cleanup:
  // Pastikan HANYA 'mie-1' (Mie Jebew Original) yang memiliki foto.
  // Semua menu lainnya (mie-2, mie-3, mie-4, paket-1, dll) adalah menu rahasia '???' tanpa foto (ikon '?').
  try {
    db.prepare(`
      UPDATE menu_items
      SET name = '???',
          price = 0,
          image = '',
          badge = '❓ SEGERA HADIR',
          is_spicy_selectable = 0,
          is_popular = 0,
          is_best_seller = 0,
          description = '???'
      WHERE id != 'mie-1'
    `).run();
  } catch (err: any) {
    console.warn('[DB Migration] Secret menu normalization notice:', err.message);
  }

  // 5. Seed Promotional Popup Configuration
  const popupCount = db.prepare('SELECT COUNT(*) as count FROM promotional_popup').get() as { count: number };
  if (popupCount.count === 0) {
    db.prepare(`
      INSERT INTO promotional_popup (
        id, title, headline, subtitle, description, cta_text, cta_link, secondary_text,
        image_url, badge_text, is_active, target_page, delay_seconds, frequency,
        start_date, end_date, status, updated_by, updated_at
      ) VALUES (
        'main_popup', 'MIE JEBEW', 'PEDASNYA BIKIN NAGIH!', 'Laper? Gas, bro! 🍜',
        'Mie pedas + topping favorit lo.', 'PESAN SEKARANG', '#menu', 'Nanti aja',
        '/promo-popup-banner.jpg', 'PROMO SPESIAL 🔥', 1, 'all', 2, 'once_per_session',
        NULL, NULL, 'published', 'admin', ?
      )
    `).run(now);

    db.prepare(`
      INSERT INTO promotional_popup_history (
        id, popup_id, title, headline, subtitle, description, cta_text, cta_link, secondary_text,
        image_url, badge_text, is_active, target_page, delay_seconds, frequency,
        start_date, end_date, status, saved_by, saved_at, change_summary
      ) VALUES (
        'pop-hist-initial', 'main_popup', 'MIE JEBEW', 'PEDASNYA BIKIN NAGIH!', 'Laper? Gas, bro! 🍜',
        'Mie pedas + topping favorit lo.', 'PESAN SEKARANG', '#menu', 'Nanti aja',
        '/promo-popup-banner.jpg', 'PROMO SPESIAL 🔥', 1, 'all', 2, 'once_per_session',
        NULL, NULL, 'published', 'admin', ?, 'Konfigurasi awal popup promosi Neo-Brutalism'
      )
    `).run(now);
  }
}

