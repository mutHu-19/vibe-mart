-- ============================================================
-- ShopLK v3 — Full E-Commerce + POS System
-- MySQL Database Schema (Updated with cost_price & delivery_charge)
-- ============================================================

CREATE DATABASE IF NOT EXISTS shoplk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shoplk;

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url VARCHAR(500),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products (cost_price added for profit/loss tracking)
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_price DECIMAL(10,2),
  cost_price DECIMAL(10,2) COMMENT 'Your buying/cost price for P&L calculations',
  sku VARCHAR(100),
  images JSON,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Product Variants (size, colour combinations)
CREATE TABLE IF NOT EXISTS product_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  size VARCHAR(50),
  colour VARCHAR(50),
  colour_hex VARCHAR(7),
  stock_qty INT DEFAULT 0,
  extra_price DECIMAL(10,2) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders / Invoices (delivery_charge column added)
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_no VARCHAR(20) NOT NULL UNIQUE,
  customer_id INT,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_address TEXT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_charge DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_method ENUM('bank_deposit','cash_on_delivery') NOT NULL,
  status ENUM('pending','confirmed','processing','shipped','delivered','cancelled') DEFAULT 'pending',
  stock_deducted TINYINT(1) DEFAULT 0 COMMENT 'Whether stock has been deducted for this order',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT,
  product_name VARCHAR(255) NOT NULL,
  variant_id INT,
  size VARCHAR(50),
  colour VARCHAR(50),
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

-- Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('super_admin','admin','staff') DEFAULT 'staff',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Migration for existing databases
-- (Run these if upgrading from v2)
-- ============================================================
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) COMMENT 'Buying cost for P&L';
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_charge DECIMAL(10,2) DEFAULT 0;
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_deducted TINYINT(1) DEFAULT 0;

-- ============================================================
-- Seed Data
-- ============================================================
INSERT IGNORE INTO categories (name, slug, description) VALUES
('Kitchen Items', 'kitchen-items', 'Cookware, utensils and kitchen accessories'),
('Bags & Purses', 'bags-purses', 'Handbags, backpacks, wallets and luggage'),
('Toys & Games', 'toys-games', 'Kids toys, educational games and outdoor play'),
('Home Decor', 'home-decor', 'Decorative items and home accessories'),
('Electronics', 'electronics', 'Gadgets, accessories and tech items');

INSERT IGNORE INTO products (category_id, name, slug, description, price, compare_price, cost_price, sku, images) VALUES
(1, 'Premium Non-Stick Frying Pan', 'premium-non-stick-frying-pan',
 'High-quality non-stick frying pan perfect for everyday cooking. Suitable for all stovetops.',
 2499.00, 3200.00, 1500.00, 'KIT-001',
 '["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600"]'),

(1, 'Stainless Steel Mixing Bowls Set', 'stainless-steel-mixing-bowls',
 'Set of 3 stainless steel mixing bowls with lids. Durable and dishwasher safe.',
 1850.00, NULL, 1100.00, 'KIT-002',
 '["https://images.unsplash.com/photo-1585515320310-259814833e62?w=600"]'),

(2, 'Leather Tote Handbag', 'leather-tote-handbag',
 'Genuine leather tote bag with spacious compartments. Perfect for office and casual use.',
 5500.00, 7000.00, 3200.00, 'BAG-001',
 '["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600"]'),

(2, 'Canvas Backpack', 'canvas-backpack',
 'Durable canvas backpack with laptop sleeve and multiple pockets.',
 3200.00, NULL, 1800.00, 'BAG-002',
 '["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600"]'),

(3, 'LEGO Classic Bricks Set', 'lego-classic-bricks-set',
 'Classic building bricks set with 500+ pieces. Perfect for ages 4 and up.',
 3800.00, 4500.00, 2200.00, 'TOY-001',
 '["https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600"]'),

(3, 'Remote Control Car', 'remote-control-car',
 'High-speed remote control car with rechargeable battery. Great for kids and adults.',
 4200.00, 5000.00, 2500.00, 'TOY-002',
 '["https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600"]'),

(4, 'Ceramic Vase Set', 'ceramic-vase-set',
 'Beautiful ceramic vases in modern designs. Set of 2 different sizes.',
 1600.00, NULL, 900.00, 'DEC-001',
 '["https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=600"]'),

(5, 'Wireless Bluetooth Earbuds', 'wireless-bluetooth-earbuds',
 'True wireless earbuds with noise cancellation and 24-hour battery life.',
 6500.00, 8000.00, 3800.00, 'ELE-001',
 '["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600"]');

-- Variants
INSERT IGNORE INTO product_variants (product_id, size, colour, colour_hex, stock_qty) VALUES
(3, NULL, 'Black', '#1a1a1a', 15),
(3, NULL, 'Brown', '#8B4513', 12),
(3, NULL, 'Tan', '#D2B48C', 8),
(3, NULL, 'Red', '#DC143C', 5),
(4, NULL, 'Navy Blue', '#1a237e', 20),
(4, NULL, 'Black', '#1a1a1a', 18),
(4, NULL, 'Olive Green', '#556B2F', 10),
(4, NULL, 'Grey', '#808080', 14),
(1, '20cm', 'Black', '#1a1a1a', 25),
(1, '24cm', 'Black', '#1a1a1a', 20),
(1, '28cm', 'Black', '#1a1a1a', 15),
(1, '32cm', 'Black', '#1a1a1a', 10),
(6, NULL, 'Red', '#DC143C', 10),
(6, NULL, 'Blue', '#1565C0', 10),
(6, NULL, 'Yellow', '#FDD835', 8);

INSERT IGNORE INTO product_variants (product_id, stock_qty) VALUES (2, 30), (5, 20), (7, 25), (8, 12);

-- Default admin user (password: admin123)
INSERT IGNORE INTO admin_users (name, email, password_hash, role) VALUES
('Admin', 'admin@shoplk.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin');
