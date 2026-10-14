-- ========================================================
-- DATABASE SCHEMA: MIE JEBEW OFFICIAL (SHADOW OF SPICE)
-- Kompatibel dengan: phpMyAdmin, MySQL 5.7+, MySQL 8.0+, MariaDB 10+
-- Karakter Set: utf8mb4 / utf8mb4_unicode_ci (Mendukung Emoji 🍜, 🌶️, 🔥, 🪙)
-- Engine: InnoDB (Mendukung Relasi Antar Tabel & Foreign Keys)
-- ========================================================

CREATE DATABASE IF NOT EXISTS `mie_jebew_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `mie_jebew_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables jika ingin re-import ulang
DROP TABLE IF EXISTS `security_logs`;
DROP TABLE IF EXISTS `coin_transactions`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `vouchers`;
DROP TABLE IF EXISTS `spin_history`;
DROP TABLE IF EXISTS `user_coins`;
DROP TABLE IF EXISTS `customer_users`;
DROP TABLE IF EXISTS `food_reviews`;
DROP TABLE IF EXISTS `activity_logs`;
DROP TABLE IF EXISTS `media`;
DROP TABLE IF EXISTS `homepage_content`;
DROP TABLE IF EXISTS `contact_information`;
DROP TABLE IF EXISTS `social_links`;
DROP TABLE IF EXISTS `vinas_section`;
DROP TABLE IF EXISTS `behind_the_kitchen`;
DROP TABLE IF EXISTS `why_choose_us`;
DROP TABLE IF EXISTS `promotions`;
DROP TABLE IF EXISTS `bundles`;
DROP TABLE IF EXISTS `custom_order_options`;
DROP TABLE IF EXISTS `products_bottles`;
DROP TABLE IF EXISTS `menu_items`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `admin_users`;

SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------
-- 1. TABEL: admin_users (Pengguna Panel Admin)
-- --------------------------------------------------------
CREATE TABLE `admin_users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) UNIQUE NOT NULL,
  `email` VARCHAR(100) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('SUPER_ADMIN', 'ADMIN', 'EDITOR') NOT NULL DEFAULT 'ADMIN',
  `name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. TABEL: categories (Kategori Menu)
-- --------------------------------------------------------
CREATE TABLE `categories` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) UNIQUE NOT NULL,
  `icon` VARCHAR(50) DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. TABEL: menu_items (Daftar Menu Makanan & Minuman)
-- RELASI: Berelasi dengan categories.id
-- --------------------------------------------------------
CREATE TABLE `menu_items` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `category_id` VARCHAR(50) NOT NULL,
  `price` DECIMAL(12, 2) NOT NULL,
  `sale_price` DECIMAL(12, 2) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `image` VARCHAR(255) DEFAULT NULL,
  `badge` VARCHAR(50) DEFAULT NULL,
  `is_spicy_selectable` TINYINT(1) NOT NULL DEFAULT 1,
  `is_popular` TINYINT(1) NOT NULL DEFAULT 0,
  `is_best_seller` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `ingredients` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_menu_category` (`category_id`),
  CONSTRAINT `fk_menu_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. TABEL: products_bottles (Chili Oil & Sambal Botolan)
-- --------------------------------------------------------
CREATE TABLE `products_bottles` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `subtitle` VARCHAR(255) DEFAULT NULL,
  `price` DECIMAL(12, 2) NOT NULL,
  `volume_ml` INT NOT NULL DEFAULT 100,
  `description` TEXT DEFAULT NULL,
  `heat_level` INT NOT NULL DEFAULT 3,
  `image` VARCHAR(255) DEFAULT NULL,
  `badge` VARCHAR(50) DEFAULT NULL,
  `stock_status` ENUM('in_stock', 'low_stock', 'out_of_stock') NOT NULL DEFAULT 'in_stock',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 5. TABEL: custom_order_options (Level Pedas & Toppings)
-- --------------------------------------------------------
CREATE TABLE `custom_order_options` (
  `id` VARCHAR(50) PRIMARY KEY,
  `group_type` ENUM('spice_level', 'topping', 'size', 'addon') NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `level_number` INT DEFAULT NULL,
  `badge` VARCHAR(50) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `price_adjustment` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `is_popular` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 6. TABEL: bundles (Paket Komplit & Promo Bundling)
-- --------------------------------------------------------
CREATE TABLE `bundles` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `price` DECIMAL(12, 2) NOT NULL,
  `original_price` DECIMAL(12, 2) NOT NULL,
  `savings_badge` VARCHAR(50) DEFAULT NULL,
  `items_included` TEXT NOT NULL,
  `image` VARCHAR(255) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 7. TABEL: promotions (Voucher Kode Promo Toko)
-- --------------------------------------------------------
CREATE TABLE `promotions` (
  `id` VARCHAR(50) PRIMARY KEY,
  `title` VARCHAR(150) NOT NULL,
  `promo_code` VARCHAR(50) UNIQUE NOT NULL,
  `description` TEXT DEFAULT NULL,
  `discount_type` ENUM('percentage', 'fixed') NOT NULL,
  `discount_value` DECIMAL(12, 2) NOT NULL,
  `min_purchase` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `start_date` DATETIME NOT NULL,
  `end_date` DATETIME NOT NULL,
  `usage_limit` INT DEFAULT NULL,
  `used_count` INT NOT NULL DEFAULT 0,
  `image` VARCHAR(255) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 8. TABEL: orders (Pencatatan Otomatis Setiap Pemesanan Web)
-- --------------------------------------------------------
CREATE TABLE `orders` (
  `id` VARCHAR(64) PRIMARY KEY,
  `customer_name` VARCHAR(150) NOT NULL,
  `customer_phone` VARCHAR(50) NOT NULL,
  `order_type` ENUM('delivery', 'takeaway', 'dine_in') NOT NULL DEFAULT 'delivery',
  `table_number` VARCHAR(50) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `payment_method` ENUM('qris', 'cash') NOT NULL DEFAULT 'qris',
  `payment_status` ENUM('pending', 'paid', 'verified', 'cancelled') NOT NULL DEFAULT 'pending',
  `subtotal` DECIMAL(12, 2) NOT NULL,
  `discount_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `voucher_code` VARCHAR(50) DEFAULT NULL,
  `total_amount` DECIMAL(12, 2) NOT NULL,
  `additional_notes` TEXT DEFAULT NULL,
  `order_status` ENUM('pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_orders_created` (`created_at`),
  INDEX `idx_orders_phone` (`customer_phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 9. TABEL: order_items (Rincian Menu Dalam Pesanan)
-- RELASI: Berelasi ke orders.id (CASCADE) & menu_items.id
-- --------------------------------------------------------
CREATE TABLE `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` VARCHAR(64) NOT NULL,
  `menu_item_id` VARCHAR(50) DEFAULT NULL,
  `item_name` VARCHAR(150) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `spice_level` INT DEFAULT 0,
  `toppings_summary` VARCHAR(255) DEFAULT NULL,
  `unit_price` DECIMAL(12, 2) NOT NULL,
  `subtotal_item` DECIMAL(12, 2) NOT NULL,
  `notes` TEXT DEFAULT NULL,
  INDEX `idx_order_items_order` (`order_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_order_items_menu` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 10. TABEL: customer_users (Akun Pengunjung / Pelanggan)
-- RELASI: Digunakan untuk autentikasi spin wheel & reward koin
-- --------------------------------------------------------
CREATE TABLE `customer_users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `phone` VARCHAR(30) UNIQUE NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `coins_balance` INT NOT NULL DEFAULT 0,
  `last_spin_wib_date` VARCHAR(20) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_customer_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 11. TABEL: user_coins (Tabel Kompatibilitas Saldo Koin)
-- --------------------------------------------------------
CREATE TABLE `user_coins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_identifier` VARCHAR(100) UNIQUE NOT NULL,
  `coins_balance` INT NOT NULL DEFAULT 0,
  `last_spin_date` DATE DEFAULT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 12. TABEL: coin_transactions (Buku Besar / Ledger Koin Masuk & Keluar)
-- RELASI: Berelasi ke customer_users.id (CASCADE)
-- --------------------------------------------------------
CREATE TABLE `coin_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `type` ENUM('spin_reward', 'voucher_redeem', 'bonus', 'adjustment') NOT NULL,
  `amount` INT NOT NULL,
  `balance_before` INT NOT NULL,
  `balance_after` INT NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `reference_id` VARCHAR(100) DEFAULT NULL,
  `ip_address` VARCHAR(50) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_coin_tx_user` (`user_id`),
  CONSTRAINT `fk_coin_tx_user` FOREIGN KEY (`user_id`) REFERENCES `customer_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 13. TABEL: spin_history (Riwayat Putaran Roda Keberuntungan Harian)
-- RELASI: Terhubung ke customer_users.id (CASCADE)
-- --------------------------------------------------------
CREATE TABLE `spin_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `user_identifier` VARCHAR(100) NOT NULL,
  `coins_won` INT NOT NULL,
  `segment_label` VARCHAR(50) NOT NULL,
  `ip_address` VARCHAR(50) DEFAULT NULL,
  `user_agent` VARCHAR(255) DEFAULT NULL,
  `wib_date` VARCHAR(20) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_spin_user` (`user_id`),
  INDEX `idx_spin_wib_date` (`wib_date`),
  UNIQUE KEY `uq_spin_user_wib_date` (`user_id`, `wib_date`),
  CONSTRAINT `fk_spin_user` FOREIGN KEY (`user_id`) REFERENCES `customer_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 14. TABEL: vouchers (Voucher Hasil Penukaran Koin)
-- RELASI: Terhubung ke orders.id saat voucher digunakan & customer_users.id
-- --------------------------------------------------------
CREATE TABLE `vouchers` (
  `id` VARCHAR(64) PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `code` VARCHAR(50) UNIQUE NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `reward_type` VARCHAR(50) NOT NULL,
  `discount_amount` DECIMAL(12, 2) NOT NULL,
  `cost_in_coins` INT NOT NULL,
  `user_identifier` VARCHAR(100) DEFAULT NULL,
  `is_used` TINYINT(1) NOT NULL DEFAULT 0,
  `order_id` VARCHAR(64) DEFAULT NULL,
  `used_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_vouchers_user` (`user_id`),
  CONSTRAINT `fk_vouchers_user` FOREIGN KEY (`user_id`) REFERENCES `customer_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_vouchers_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 15. TABEL: security_logs (Log Keamanan, Anti-Spam & Deteksi Anomali)
-- --------------------------------------------------------
CREATE TABLE `security_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `ip_address` VARCHAR(50) NOT NULL,
  `action_type` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `severity` ENUM('info', 'warning', 'critical') NOT NULL DEFAULT 'warning',
  `user_agent` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sec_ip` (`ip_address`),
  INDEX `idx_sec_user` (`user_id`),
  INDEX `idx_sec_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 13. TABEL: food_reviews (Rating & Review Menu)
-- RELASI: Berelasi ke menu_items.id
-- --------------------------------------------------------
CREATE TABLE `food_reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `menu_item_id` VARCHAR(50) NOT NULL,
  `reviewer_name` VARCHAR(100) NOT NULL,
  `rating` INT NOT NULL,
  `comment` TEXT DEFAULT NULL,
  `is_approved` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_reviews_menu` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 14. TABEL: homepage_content (Konten Hero Banner & QRIS)
-- --------------------------------------------------------
CREATE TABLE `homepage_content` (
  `id` VARCHAR(50) PRIMARY KEY DEFAULT 'hero_content',
  `store_name` VARCHAR(100) NOT NULL,
  `hero_headline` VARCHAR(150) NOT NULL,
  `hero_subheadline` VARCHAR(150) NOT NULL,
  `hero_description` TEXT NOT NULL,
  `hero_badge` VARCHAR(100) NOT NULL,
  `cta_order_text` VARCHAR(50) NOT NULL,
  `cta_menu_text` VARCHAR(50) NOT NULL,
  `announcement_banner` VARCHAR(255) DEFAULT NULL,
  `is_announcement_active` TINYINT(1) NOT NULL DEFAULT 1,
  `video_banner_url` VARCHAR(255) DEFAULT NULL,
  `video_poster_url` VARCHAR(255) DEFAULT NULL,
  `qris_merchant_name` VARCHAR(100) DEFAULT NULL,
  `qris_nmid` VARCHAR(50) DEFAULT NULL,
  `qris_image_url` VARCHAR(255) DEFAULT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 15. TABEL: contact_information (Alamat & Kontak Outlet)
-- --------------------------------------------------------
CREATE TABLE `contact_information` (
  `id` VARCHAR(50) PRIMARY KEY DEFAULT 'main_contact',
  `phone` VARCHAR(50) NOT NULL,
  `whatsapp_number` VARCHAR(50) NOT NULL,
  `whatsapp_display` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `address_note` VARCHAR(150) NOT NULL,
  `address_description` TEXT NOT NULL,
  `opening_hours` VARCHAR(150) NOT NULL,
  `google_maps_url` VARCHAR(255) DEFAULT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 16. TABEL: why_choose_us (Keunggulan Kami)
-- --------------------------------------------------------
CREATE TABLE `why_choose_us` (
  `id` VARCHAR(50) PRIMARY KEY,
  `title` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `icon` VARCHAR(50) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 17. TABEL: behind_the_kitchen (Galeri Dapur)
-- --------------------------------------------------------
CREATE TABLE `behind_the_kitchen` (
  `id` VARCHAR(50) PRIMARY KEY,
  `title` VARCHAR(150) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `image_url` VARCHAR(255) NOT NULL,
  `tag` VARCHAR(50) DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 18. TABEL: vinas_section (Cerita Founder)
-- --------------------------------------------------------
CREATE TABLE `vinas_section` (
  `id` VARCHAR(50) PRIMARY KEY DEFAULT 'vinas_main',
  `title` VARCHAR(150) NOT NULL,
  `subtitle` VARCHAR(150) NOT NULL,
  `quote` TEXT NOT NULL,
  `description` TEXT NOT NULL,
  `image_url` VARCHAR(255) NOT NULL,
  `cta_text` VARCHAR(50) NOT NULL DEFAULT 'Coba Resep Vina',
  `cta_link` VARCHAR(100) NOT NULL DEFAULT '#menu',
  `badge` VARCHAR(100) NOT NULL DEFAULT "Founder's Secret Recipe",
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 19. TABEL: social_links (Media Sosial Toko)
-- --------------------------------------------------------
CREATE TABLE `social_links` (
  `id` VARCHAR(50) PRIMARY KEY,
  `platform` VARCHAR(50) NOT NULL,
  `handle` VARCHAR(100) NOT NULL,
  `url` VARCHAR(255) NOT NULL,
  `icon` VARCHAR(50) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 20. TABEL: media (Manajemen File Upload)
-- --------------------------------------------------------
CREATE TABLE `media` (
  `id` VARCHAR(50) PRIMARY KEY,
  `file_name` VARCHAR(255) NOT NULL,
  `original_name` VARCHAR(255) NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `file_size` INT NOT NULL,
  `url` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 21. TABEL: activity_logs (Riwayat Aktivitas Admin)
-- --------------------------------------------------------
CREATE TABLE `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `admin_username` VARCHAR(50) NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `entity` VARCHAR(50) NOT NULL,
  `entity_id` VARCHAR(50) DEFAULT NULL,
  `details` TEXT DEFAULT NULL,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_logs_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 22. TABEL: system_backups (Pencadangan Otomatis & Manual)
-- --------------------------------------------------------
CREATE TABLE `system_backups` (
  `id` VARCHAR(64) PRIMARY KEY,
  `filename` VARCHAR(255) NOT NULL,
  `backup_type` VARCHAR(30) NOT NULL DEFAULT 'manual',
  `size_bytes` BIGINT NOT NULL DEFAULT 0,
  `tables_count` INT NOT NULL DEFAULT 0,
  `records_count` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(20) NOT NULL DEFAULT 'success',
  `checksum` VARCHAR(64) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_by` VARCHAR(50) NOT NULL DEFAULT 'system',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_backup_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 23. TABEL: fraud_alerts (Deteksi Anomali & Anti-Kecurangan)
-- --------------------------------------------------------
CREATE TABLE `fraud_alerts` (
  `id` VARCHAR(64) PRIMARY KEY,
  `alert_type` VARCHAR(50) NOT NULL,
  `severity` VARCHAR(20) NOT NULL DEFAULT 'medium',
  `target_user_id` VARCHAR(50) DEFAULT NULL,
  `target_user_name` VARCHAR(100) DEFAULT NULL,
  `ip_address` VARCHAR(50) DEFAULT NULL,
  `details` TEXT NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'open',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` DATETIME DEFAULT NULL,
  `resolved_by` VARCHAR(50) DEFAULT NULL,
  INDEX `idx_fraud_status` (`status`),
  INDEX `idx_fraud_type` (`alert_type`),
  INDEX `idx_fraud_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- DATA AWAL (SEED DATA LENGKAP)
-- ========================================================

-- Admin User (Password default: admin123)
INSERT INTO `admin_users` (`id`, `username`, `email`, `password_hash`, `role`, `name`, `phone`, `is_active`, `created_at`, `updated_at`)
VALUES (1, 'admin', 'admin@miejebew.com', '$2b$10$9c3w1W1kZ4wQ7M5hWzL8zO4u7r7B2r8zV7t8y7x6w5v4u3t2s1r0q', 'SUPER_ADMIN', 'Adam', '085122014584', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `username`=`username`, `name`='Adam', `phone`='085122014584';

-- Categories
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `sort_order`, `is_active`) VALUES
('all', 'Semua Menu', 'all', '✨', 1, 1),
('mie', 'Mie Jebew', 'mie', '🍜', 2, 1),
('paket', 'Paket Hemat', 'paket', '🔥', 3, 1),
('topping', 'Topping & Side', 'topping', '🥚', 4, 1),
('minuman', 'Minuman Segar', 'minuman', '🥤', 5, 1)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Menu Items (SERBA 10 RIBU)
INSERT INTO `menu_items` (`id`, `name`, `category_id`, `price`, `sale_price`, `description`, `image`, `badge`, `is_spicy_selectable`, `is_popular`, `is_best_seller`, `is_active`, `sort_order`, `ingredients`) VALUES
('mie-1', 'Mie Jebew Original', 'mie', 10000.00, NULL, 'Mie kenyal pedas khas Jebew dengan bumbu rahasia gurih pedas nampol, taburan ayam melimpah, pangsit renyah, dan bakso lezat!', '/rasa-mie/Original.jpeg', '🔥 SERBA 10K', 1, 1, 1, 1, 1, 'Mie kenyal, chili oil khas Jebew, ayam cincang gurih, pangsit goreng, daun bawang'),
('mie-2', 'Mie Jebew Kuah Pedas', 'mie', 10000.00, NULL, 'Menu mie kuah kaldu pedas berempah yang bikin segar dan keringat bercucuran!', '/rasa-mie/Original.jpeg', '🌶️ KUAH 10K', 1, 1, 0, 1, 2, 'Mie telur, kaldu ayam gurih, bumbu jebew pedas, bakso, sayuran segar'),
('mie-3', 'Mie Jebew Manis Gurih', 'mie', 10000.00, NULL, 'Kombinasi bumbu kecap manis istimewa berpadu dengan chili oil jebew nendang!', '/rasa-mie/Original.jpeg', '🍯 MANIS GURIH 10K', 1, 0, 0, 1, 3, 'Mie, kecap manis racikan, cabai rawit pedas, ayam cincang, pangsit'),
('mie-4', 'Mie Jebew Spesial Keju', 'mie', 10000.00, NULL, 'Sensasi pedas jebew lumer berpadu gurihnya saus keju spesial yang creamy!', '/rasa-mie/Original.jpeg', '🧀 CHEESE 10K', 1, 1, 0, 1, 4, 'Mie jebew, lelehan keju mozarella & keju cheddar gurih, taburan ayam'),
('paket-1', 'Paket Hemat Pelajar 10K', 'paket', 10000.00, NULL, 'Mie Jebew Original Level Bebas + Es Teh Manis Segar Jumbo!', '/rasa-mie/Original.jpeg', '⭐ COMBO 10K', 1, 1, 1, 1, 5, '1 Porsi Mie Jebew, 1 Es Teh Jumbo'),
('topping-1', 'Pangsit Goreng Renyah (3 pcs)', 'topping', 4000.00, NULL, 'Pangsit goreng isi ayam gurih super kriuk, teman setia mie jebew!', '', '🥟 RENYAH', 0, 1, 0, 1, 6, 'Kulit pangsit renyah, daging ayam cincang olahan'),
('minuman-1', 'Es Teh Manis Jumbo', 'minuman', 4000.00, NULL, 'Es teh manis segar ukuran jumbo penyelamat lidah terbakar dari pedasnya jebew!', '', '🧊 SEGAR JUMBO', 0, 1, 0, 1, 7, 'Teh melati seduh, gula murni, es batu higienis')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Products Bottles
INSERT INTO `products_bottles` (`id`, `name`, `subtitle`, `price`, `volume_ml`, `description`, `heat_level`, `image`, `badge`, `stock_status`, `is_active`, `sort_order`) VALUES
('bot-1', 'Chili Oil Jebew Mini Jar (100ml)', 'Bumbu Minyak Cabai Pedas Gurih Siap Saji', 10000.00, 100, 'Chili oil racikan rahasia khas Mie Jebew dengan cabai rawit merah segar, bawang putih goreng, dan rempah aromatik pilihan.', 4, '/rasa-mie/Original.jpeg', '🔥 SERBA 10K', 'in_stock', 1, 1),
('bot-2', 'Sambal Jebew Extra Hot Cup (100ml)', 'Pedas Nampol Menggelegar untuk Segala Makanan', 10000.00, 100, 'Sambal ulek khas jebew dengan tingkat kepedasan maksimal. Cocok untuk cocolan gorengan, nasi hangat, mie instan, dan lauk!', 5, '/rasa-mie/Original.jpeg', '☠️ SERBA 10K', 'in_stock', 1, 2),
('bot-3', 'Bumbu Mie Jebew Sachet Praktis', 'Bikin Mie Jebew Sendiri di Rumah', 8000.00, 80, 'Paket bumbu sachet komplit khas jebew, cukup aduk dengan mie rebus instan favoritmu dan rasakan sensasi jebew asli!', 3, '/rasa-mie/Original.jpeg', '✨ HEMAT 8K', 'in_stock', 1, 3)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Custom Order Options
INSERT INTO `custom_order_options` (`id`, `group_type`, `name`, `level_number`, `badge`, `description`, `price_adjustment`, `is_popular`, `is_active`, `sort_order`) VALUES
('sp-0', 'spice_level', 'Level 0 — Gak Pedas', 0, '👶 Safe Mode', 'Gurih manis gurih tanpa cabe', 0.00, 0, 1, 1),
('sp-1', 'spice_level', 'Level 1 — Sedang', 1, '🌶️ Anget Manja', 'Pedas tipis-tipis menggugah selera', 0.00, 0, 1, 2),
('sp-2', 'spice_level', 'Level 2 — Pedas', 2, '🌶️🌶️ Mulai Nendang', 'Pedas mantap yang bikin keringat bercucuran', 0.00, 1, 1, 3),
('sp-3', 'spice_level', 'Level 3 — Super Pedas', 3, '🔥 Best Seller', 'Level paling favorit nagih abis!', 0.00, 1, 1, 4),
('sp-4', 'spice_level', 'Level 4 — Ekstra Pedas', 4, '🔥🔥 Keringat Dingin', 'Cabe melimpah ruah lidah terbakar', 0.00, 0, 1, 5),
('sp-5', 'spice_level', 'Level 5 — Jebew Maksimal', 5, '☠️ Neraka Jebew', 'Sensasi bibir jebew bergetar!', 0.00, 1, 1, 6),
('top-1', 'topping', 'Pangsit Goreng Renyah (2 pcs)', NULL, '🥟 Ekstra Kriuk', 'Pangsit renyah gurih', 2000.00, 1, 1, 7),
('top-2', 'topping', 'Bakso Sapi Kenyal (2 pcs)', NULL, '🥩 Daging Asli', 'Bakso sapi lezat', 3000.00, 1, 1, 8),
('top-3', 'topping', 'Telur Mata Sapi / Ceplok', NULL, '🍳 Tambah Gurih', 'Telur ayam segar matang/setengah matang', 3000.00, 0, 1, 9),
('top-4', 'topping', 'Ayam Tabur Melimpah', NULL, '🍗 Ekstra Daging', 'Porsi daging ayam gurih dobel', 3000.00, 1, 1, 10),
('top-5', 'topping', 'Keju Mozarella Melt', NULL, '🧀 Lumer Mewah', 'Keju leleh hangat', 3000.00, 1, 1, 11)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Bundles
INSERT INTO `bundles` (`id`, `name`, `description`, `price`, `original_price`, `savings_badge`, `items_included`, `image`, `is_active`, `sort_order`) VALUES
('bun-1', 'Paket Puas Jebew 10K', '1 Mie Jebew Original Pedas + 1 Es Teh Jumbo Segar', 10000.00, 14000.00, 'HEMAT 4K', '["1x Mie Jebew Original", "1x Es Teh Manis Jumbo"]', '/rasa-mie/Original.jpeg', 1, 1),
('bun-2', 'Paket Dobel Jebew Kenyang', '2 Porsi Mie Jebew Bebas Level + 2 Minuman Segar', 20000.00, 28000.00, 'HEMAT 8K', '["2x Mie Jebew Bebas Level", "2x Es Teh Manis Jumbo"]', '/rasa-mie/Original.jpeg', 1, 2)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Promotions
INSERT INTO `promotions` (`id`, `title`, `promo_code`, `description`, `discount_type`, `discount_value`, `min_purchase`, `start_date`, `end_date`, `usage_limit`, `used_count`, `image`, `is_active`, `sort_order`) VALUES
('pro-1', 'Diskon Spesial Pengunjung Baru', 'JEBEWBARU', 'Diskon Rp 2.000 untuk pembelian pertama semua menu mie.', 'fixed', 2000.00, 10000.00, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 500, 12, '/rasa-mie/Original.jpeg', 1, 1),
('pro-2', 'Jumat Berkah Hemat', 'BERKAH10', 'Potongan 10% setiap hari Jumat tanpa minimal order.', 'percentage', 10.00, 0.00, '2026-01-01 00:00:00', '2026-12-31 23:59:59', NULL, 34, '/rasa-mie/Original.jpeg', 1, 2)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- Contact Information (Sesuai Alamat SMK Infokom Kota Bogor)
INSERT INTO `contact_information` (`id`, `phone`, `whatsapp_number`, `whatsapp_display`, `email`, `address_note`, `address_description`, `opening_hours`, `google_maps_url`, `updated_at`) VALUES
('main_contact', '+62 851-2201-4573', '6285122014573', '+62 851-2201-4573', 'kontak@miejebew.com', 'SMK Infokom Kota Bogor', 'Jl. Letjen Ibrahim Adjie No.178, RT.03/RW.08, Sindangbarang, Kec. Bogor Barat, Kota Bogor, Jawa Barat 16117', 'Setiap Hari (Senin - Minggu) 10:00 - 22:00 WIB', 'https://maps.app.goo.gl/3Ze1SW4Cxpohb1wbA', NOW())
ON DUPLICATE KEY UPDATE `address_description`=VALUES(`address_description`);

-- Homepage Content
INSERT INTO `homepage_content` (`id`, `store_name`, `hero_headline`, `hero_subheadline`, `hero_description`, `hero_badge`, `cta_order_text`, `cta_menu_text`, `announcement_banner`, `is_announcement_active`, `video_banner_url`, `video_poster_url`, `qris_merchant_name`, `qris_nmid`, `qris_image_url`, `updated_at`) VALUES
('hero_content', 'Mie Jebew Official', 'MIE JEBEW', 'PEDASNYA BIKIN JEBEW! 🌶️', 'Sensasi mie kenyal bertabur ayam cincang gurih dengan siraman chili oil pedas nampol level 0 sampai 5! Tanpa ribet login, pesan langsung lewat WhatsApp dalam hitungan detik.', 'BEST SELLER — 100% CABAI ASLI', '🔥 PESAN SEKARANG', 'LIHAT MENU', '🎉 Diskon 15% untuk Pemesanan Pertama! Gunakan kode: JEBEWBARU', 1, '/vedio baner/zajiZMil.mp4', '/video-poster.jpg', 'CRAVE CORNER', 'ID1026566705020', '/qris/Qris.jpeg', NOW())
ON DUPLICATE KEY UPDATE `store_name`=VALUES(`store_name`);

-- Why Choose Us
INSERT INTO `why_choose_us` (`id`, `title`, `description`, `icon`, `sort_order`, `is_active`) VALUES
('wcu-1', '100% Cabai Asli Pilihan', 'Diracik dari cabai rawit merah segar berkualitas tinggi tanpa pengawet atau pewarna buatan.', 'Flame', 1, 1),
('wcu-2', 'Harga Terjangkau Serba 10K', 'Porsi kenyang, rasa istimewa dengan harga ramah kantong pelajar dan keluarga.', 'Tag', 2, 1),
('wcu-3', 'Level Pedas Bebas Pilih', 'Dari level 0 ramah anak sampai level 5 ekstra menantang untuk pecinta pedas sejati.', 'Sparkles', 3, 1),
('wcu-4', 'Respon Cepat & Mudah', 'Pesan langsung via WhatsApp, bayar praktis dengan scan barcode QRIS resmi.', 'Clock', 4, 1)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- Vinas Section
INSERT INTO `vinas_section` (`id`, `title`, `subtitle`, `quote`, `description`, `image_url`, `cta_text`, `cta_link`, `badge`, `is_active`, `updated_at`) VALUES
('vinas_main', "Vina's Signature Recipe", 'Kisah Rasa di Balik Kelezatan Pedas Mie Jebew', 'Pedas itu bukan sekadar membakar lidah, tetapi sebuah harmoni antara gurihnya rempah nusantara dan kehangatan rasa yang membekas di hati.', 'Resep Mie Jebew lahir dari eksperimen dapur rumah oleh Vina, memadukan tradisi mie nusantara dengan sambal chili oil aromatik yang kaya rasa. Setiap bumbu dan racikan minyak diracik secara personal untuk memastikan kenikmatan rasa yang otentik dan tak terlupakan.', '/team-cravecorner.jpg', 'Coba Resep Vina', '#menu', "Founder's Signature", 1, NOW())
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- Social Links
INSERT INTO `social_links` (`id`, `platform`, `handle`, `url`, `icon`, `is_active`, `sort_order`) VALUES
('soc-1', 'Instagram', '@cravecorner0', 'https://www.instagram.com/cravecorner0?stkn=MTJ2OXpnMnAwZDNxNQ==', 'InstagramIcon', 1, 1),
('soc-2', 'WhatsApp', '+62 851-2201-4573', 'https://wa.me/6285122014573', 'Phone', 1, 2),
('soc-3', 'TikTok', '@miejebew_official', 'https://tiktok.com/@miejebew_official', 'Sparkles', 1, 3)
ON DUPLICATE KEY UPDATE `handle`=VALUES(`handle`);

-- --------------------------------------------------------
-- 23. TABEL: inventory_items (Inventaris Produk & Hadiah Fisik)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory_items` (
  `id` VARCHAR(50) PRIMARY KEY,
  `item_type` ENUM('product', 'bottle', 'physical_reward', 'bundle') NOT NULL DEFAULT 'product',
  `reference_id` VARCHAR(50) DEFAULT NULL,
  `name` VARCHAR(150) NOT NULL,
  `sku` VARCHAR(50) UNIQUE NOT NULL,
  `current_stock` INT NOT NULL DEFAULT 50,
  `min_stock_alert` INT NOT NULL DEFAULT 10,
  `unit` VARCHAR(20) NOT NULL DEFAULT 'porsi',
  `daily_avg_sales` DECIMAL(8, 2) NOT NULL DEFAULT 5.00,
  `last_restocked_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_inv_sku` (`sku`),
  INDEX `idx_inv_type` (`item_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 24. TABEL: inventory_logs (Riwayat Perubahan & Audit Stok)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `inventory_id` VARCHAR(50) NOT NULL,
  `change_type` ENUM('order_deduction', 'restock', 'correction', 'reward_claim', 'waste') NOT NULL,
  `quantity_change` INT NOT NULL,
  `stock_before` INT NOT NULL,
  `stock_after` INT NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `admin_username` VARCHAR(50) DEFAULT 'system',
  `reference_id` VARCHAR(64) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_inv_logs_item` (`inventory_id`),
  CONSTRAINT `fk_inv_logs_item` FOREIGN KEY (`inventory_id`) REFERENCES `inventory_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 25. TABEL: reconciliation_anomalies (Rekonsiliasi Transaksi & Anomali)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reconciliation_anomalies` (
  `id` VARCHAR(64) PRIMARY KEY,
  `anomaly_type` VARCHAR(50) NOT NULL,
  `reference_id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `severity` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  `data_payload` TEXT DEFAULT NULL,
  `status` ENUM('unresolved', 'resolved', 'ignored') NOT NULL DEFAULT 'unresolved',
  `resolution_notes` TEXT DEFAULT NULL,
  `resolved_by` VARCHAR(50) DEFAULT NULL,
  `resolved_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_recon_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 26. TABEL: deployment_records (Riwayat & Snapshot Deployment)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `deployment_records` (
  `id` VARCHAR(64) PRIMARY KEY,
  `version` VARCHAR(50) NOT NULL,
  `git_commit` VARCHAR(50) DEFAULT NULL,
  `deploy_status` ENUM('active', 'staged', 'rolled_back', 'failed') NOT NULL DEFAULT 'active',
  `notes` TEXT DEFAULT NULL,
  `database_backup_id` VARCHAR(64) DEFAULT NULL,
  `deployed_by` VARCHAR(50) NOT NULL DEFAULT 'admin',
  `deployed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 27. TABEL: scheduled_tasks (Monitor Tugas Terjadwal & Cron)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `scheduled_tasks` (
  `task_key` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `schedule_cron` VARCHAR(50) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `last_run_at` DATETIME DEFAULT NULL,
  `next_run_at` DATETIME DEFAULT NULL,
  `last_status` ENUM('success', 'failed', 'running', 'pending') NOT NULL DEFAULT 'pending',
  `last_duration_ms` INT DEFAULT 0,
  `last_error` TEXT DEFAULT NULL,
  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 28. TABEL: promotional_popup (Konfigurasi Popup Promosi)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `promotional_popup` (
  `id` VARCHAR(50) PRIMARY KEY,
  `title` VARCHAR(100) NOT NULL,
  `headline` VARCHAR(150) NOT NULL,
  `subtitle` VARCHAR(150) NOT NULL,
  `description` TEXT NOT NULL,
  `cta_text` VARCHAR(50) NOT NULL,
  `cta_link` VARCHAR(255) NOT NULL,
  `secondary_text` VARCHAR(50) NOT NULL,
  `image_url` VARCHAR(255) NOT NULL,
  `badge_text` VARCHAR(50) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `target_page` ENUM('all', 'home', 'menu') NOT NULL DEFAULT 'all',
  `delay_seconds` INT NOT NULL DEFAULT 2,
  `frequency` ENUM('once_per_session', 'once_per_day', 'always') NOT NULL DEFAULT 'once_per_session',
  `start_date` DATETIME DEFAULT NULL,
  `end_date` DATETIME DEFAULT NULL,
  `status` ENUM('published', 'draft') NOT NULL DEFAULT 'published',
  `updated_by` VARCHAR(50) DEFAULT 'admin',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 29. TABEL: promotional_popup_history (Riwayat & Rollback Popup)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `promotional_popup_history` (
  `id` VARCHAR(64) PRIMARY KEY,
  `popup_id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(100) NOT NULL,
  `headline` VARCHAR(150) NOT NULL,
  `subtitle` VARCHAR(150) NOT NULL,
  `description` TEXT NOT NULL,
  `cta_text` VARCHAR(50) NOT NULL,
  `cta_link` VARCHAR(255) NOT NULL,
  `secondary_text` VARCHAR(50) NOT NULL,
  `image_url` VARCHAR(255) NOT NULL,
  `badge_text` VARCHAR(50) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL,
  `target_page` VARCHAR(20) NOT NULL,
  `delay_seconds` INT NOT NULL,
  `frequency` VARCHAR(30) NOT NULL,
  `start_date` DATETIME DEFAULT NULL,
  `end_date` DATETIME DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL,
  `saved_by` VARCHAR(50) NOT NULL,
  `saved_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `change_summary` TEXT DEFAULT NULL,
  INDEX `idx_pop_hist_popup` (`popup_id`),
  INDEX `idx_pop_hist_saved` (`saved_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SEED POPUP AWAL
INSERT IGNORE INTO `promotional_popup` (
  `id`, `title`, `headline`, `subtitle`, `description`, `cta_text`, `cta_link`, `secondary_text`,
  `image_url`, `badge_text`, `is_active`, `target_page`, `delay_seconds`, `frequency`, `status`, `updated_by`, `updated_at`
) VALUES (
  'main_popup', 'MIE JEBEW', 'PEDASNYA BIKIN NAGIH!', 'Laper? Gas, bro! 🍜',
  'Mie pedas + topping favorit lo.', 'PESAN SEKARANG', '#menu', 'Nanti aja',
  '/promo-popup-banner.jpg', 'PROMO SPESIAL 🔥', 1, 'all', 2, 'once_per_session', 'published', 'admin', NOW()
);


