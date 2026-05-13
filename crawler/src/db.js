/**
 * db.js
 * Quản lý kết nối MySQL và các helper function:
 * - Connection pool với mysql2/promise
 * - Query helper
 * - Transaction helper
 * - Lookup functions cho brand_id, category_id
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const { log } = require('./utils');

// =============================================
// CONNECTION POOL
// =============================================

let pool = null;

/**
 * Khởi tạo connection pool (gọi 1 lần khi start)
 * Dùng pool thay vì single connection để tái sử dụng
 */
async function initPool() {
  if (pool) return pool;

  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ecommerce_phone',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
  });

  // Test kết nối
  try {
    const conn = await pool.getConnection();
    log.success(`Database connected: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    conn.release();
  } catch (err) {
    log.error('Database connection failed', err);
    throw err;
  }

  return pool;
}

/**
 * Lấy pool hiện tại (cần gọi initPool() trước)
 */
function getPool() {
  if (!pool) throw new Error('Database pool not initialized. Call initPool() first.');
  return pool;
}

/**
 * Đóng pool khi kết thúc
 */
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    log.info('Database pool closed');
  }
}

// =============================================
// TRANSACTION HELPER
// =============================================

/**
 * Chạy một callback trong transaction
 * Tự động COMMIT nếu thành công, ROLLBACK nếu có lỗi
 * 
 * @param {Function} callback - async (connection) => { ... }
 * @returns Result của callback
 */
async function withTransaction(callback) {
  const conn = await getPool().getConnection();
  
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    log.error(`Transaction rolled back: ${err.message}`, err);
    throw err;
  } finally {
    conn.release();
  }
}

// =============================================
// LOOKUP HELPERS
// =============================================

// Cache để tránh query DB nhiều lần
const brandCache = {};
const categoryCache = {};

/**
 * Lấy brand_id từ tên brand
 * Tự động INSERT nếu brand chưa tồn tại — kể cả brand lạ/mới
 * KHÔNG trả về null để tránh FK constraint lỗi khi products.brand_id NOT NULL
 */
async function getBrandId(brandName) {
  // Fallback tên nếu không detect được — dùng 'Other' thay vì null
  const name = (!brandName || brandName === 'Unknown') ? 'Other' : brandName;

  // Kiểm tra cache
  if (brandCache[name]) return brandCache[name];

  const pool = getPool();

  // Tìm trong DB
  const [rows] = await pool.execute(
    'SELECT id FROM brands WHERE name = ? LIMIT 1',
    [name]
  );

  if (rows.length > 0) {
    brandCache[name] = rows[0].id;
    return rows[0].id;
  }

  // Insert brand mới (kể cả brand lạ — tự tạo slug từ tên)
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const [result] = await pool.execute(
    `INSERT INTO brands (name, slug, is_active, created_at, updated_at)
     VALUES (?, ?, 1, NOW(), NOW())
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
    [name, slug]
  );

  brandCache[name] = result.insertId;
  log.info(`Brand "${name}" auto-created with id: ${result.insertId}`);

  return result.insertId;
}

/**
 * Lấy category_id cho "Điện thoại"
 * Tự động INSERT nếu chưa tồn tại
 */
async function getCategoryId(categoryName = 'Điện thoại') {
  if (categoryCache[categoryName]) return categoryCache[categoryName];
  
  const pool = getPool();
  
  const [rows] = await pool.execute(
    'SELECT id FROM categories WHERE name = ? LIMIT 1',
    [categoryName]
  );
  
  if (rows.length > 0) {
    categoryCache[categoryName] = rows[0].id;
    return rows[0].id;
  }
  
  // Insert category mới
  const slug = 'dien-thoai';
  const [result] = await pool.execute(
    `INSERT INTO categories (name, slug, is_active, created_at, updated_at)
     VALUES (?, ?, 1, NOW(), NOW())
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
    [categoryName, slug]
  );
  
  categoryCache[categoryName] = result.insertId;
  log.info(`Category "${categoryName}" created with id: ${result.insertId}`);
  
  return result.insertId;
}

/**
 * Kiểm tra product đã tồn tại theo slug
 * Trả về product_id nếu tồn tại, null nếu không
 */
async function getProductIdBySlug(slug) {
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT id FROM products WHERE slug = ? LIMIT 1',
    [slug]
  );
  return rows.length > 0 ? rows[0].id : null;
}

module.exports = {
  initPool,
  getPool,
  closePool,
  withTransaction,
  getBrandId,
  getCategoryId,
  getProductIdBySlug,
};