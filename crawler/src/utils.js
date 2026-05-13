/**
 * utils.js
 * Các hàm tiện ích dùng chung trong toàn bộ project:
 * - Logger có màu sắc theo level
 * - Slug generator
 * - SKU generator
 * - Random delay
 * - Retry wrapper
 * - Brand detector từ tên sản phẩm
 */

// =============================================
// LOGGER
// =============================================

const LOG_LEVELS = {
  INFO: '\x1b[36m[INFO]\x1b[0m',      // Cyan
  SUCCESS: '\x1b[32m[SUCCESS]\x1b[0m', // Green
  ERROR: '\x1b[31m[ERROR]\x1b[0m',     // Red
  WARN: '\x1b[33m[WARN]\x1b[0m',       // Yellow
  DEBUG: '\x1b[35m[DEBUG]\x1b[0m',     // Magenta
};

/**
 * Ghi log có timestamp và level
 */
const log = {
  info: (msg) => console.log(`${new Date().toISOString()} ${LOG_LEVELS.INFO} ${msg}`),
  success: (msg) => console.log(`${new Date().toISOString()} ${LOG_LEVELS.SUCCESS} ${msg}`),
  error: (msg, err) => {
    console.error(`${new Date().toISOString()} ${LOG_LEVELS.ERROR} ${msg}`);
    if (err && process.env.DEBUG) console.error(err);
  },
  warn: (msg) => console.warn(`${new Date().toISOString()} ${LOG_LEVELS.WARN} ${msg}`),
  debug: (msg) => {
    if (process.env.DEBUG) console.log(`${new Date().toISOString()} ${LOG_LEVELS.DEBUG} ${msg}`);
  },
};

// =============================================
// SLUG GENERATOR
// =============================================

/**
 * Chuyển tên sản phẩm thành URL-friendly slug
 * Ví dụ: "iPhone 15 Pro Max 256GB" -> "iphone-15-pro-max-256gb"
 */
function generateSlug(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .normalize('NFD')                     // Tách dấu tiếng Việt
    .replace(/[\u0300-\u036f]/g, '')      // Xóa dấu
    .replace(/đ/g, 'd')                   // Xử lý đặc biệt chữ đ
    .replace(/[^a-z0-9\s-]/g, '')        // Chỉ giữ chữ, số, khoảng trắng, gạch ngang
    .replace(/\s+/g, '-')                 // Thay khoảng trắng bằng gạch ngang
    .replace(/-+/g, '-')                  // Loại bỏ gạch ngang liên tiếp
    .replace(/^-|-$/g, '');              // Xóa gạch ngang đầu/cuối
}

// =============================================
// SKU GENERATOR
// =============================================

/**
 * Tạo SKU theo format: BRAND-RAM-ROM-COLOR-RANDOM
 * Ví dụ: IP15PM-8-256-BLACK-X92A
 */
function generateSku(brand, ramGb, storageGb, color) {
  const brandCode = getBrandCode(brand);
  const ram = ramGb ? `${ramGb}` : 'NA';
  const rom = storageGb ? `${storageGb}` : 'NA';
  const colorCode = normalizeColorCode(color);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `${brandCode}-${ram}-${rom}-${colorCode}-${random}`;
}

/**
 * Lấy mã viết tắt của brand
 */
function getBrandCode(brand) {
  const codes = {
    'Apple': 'IP',
    'Samsung': 'SS',
    'Xiaomi': 'XI',
    'OPPO': 'OP',
    'realme': 'RM',
    'vivo': 'VI',
    'Tecno': 'TC',
    'Nokia': 'NK',
    'Motorola': 'MT',
    'OnePlus': 'OP1',
    'ASUS': 'AS',
    'Sony': 'SN',
  };
  return codes[brand] || brand?.substring(0, 3).toUpperCase() || 'UNK';
}

/**
 * Chuẩn hóa màu sắc thành mã ngắn
 */
function normalizeColorCode(color) {
  if (!color) return 'NA';
  
  const colorMap = {
    'đen': 'BLACK', 'black': 'BLACK',
    'trắng': 'WHITE', 'white': 'WHITE',
    'xanh': 'BLUE', 'blue': 'BLUE',
    'đỏ': 'RED', 'red': 'RED',
    'vàng': 'GOLD', 'gold': 'GOLD',
    'hồng': 'PINK', 'pink': 'PINK',
    'tím': 'PURP', 'purple': 'PURP',
    'xám': 'GRAY', 'gray': 'GRAY', 'grey': 'GRAY',
    'bạc': 'SILV', 'silver': 'SILV', 'titanium': 'TITAN',
    'xanh lá': 'GREEN', 'green': 'GREEN',
    'cam': 'ORNG', 'orange': 'ORNG',
    'be': 'BEIG', 'beige': 'BEIG',
  };
  
  const lowerColor = color.toLowerCase();
  for (const [key, val] of Object.entries(colorMap)) {
    if (lowerColor.includes(key)) return val;
  }
  
  // Fallback: lấy 5 ký tự đầu viết hoa
  return color.replace(/\s+/g, '').substring(0, 5).toUpperCase();
}

// =============================================
// BRAND DETECTOR
// =============================================

/**
 * Mapping brand từ tên sản phẩm
 * Trả về brand name chuẩn để query DB
 */
function detectBrand(productName) {
  if (!productName) return 'Unknown';

  const brandPatterns = [
    { pattern: /iphone|ipad|macbook|apple watch/i, brand: 'Apple' },
    { pattern: /samsung|galaxy/i, brand: 'Samsung' },
    { pattern: /xiaomi|redmi|poco/i, brand: 'Xiaomi' },
    { pattern: /\boppo\b/i, brand: 'OPPO' },
    { pattern: /realme/i, brand: 'realme' },
    { pattern: /\bvivo\b/i, brand: 'vivo' },
    { pattern: /tecno/i, brand: 'Tecno' },
    { pattern: /nokia/i, brand: 'Nokia' },
    { pattern: /motorola|moto\s/i, brand: 'Motorola' },
    { pattern: /oneplus/i, brand: 'OnePlus' },
    { pattern: /\basus\b|zenfone/i, brand: 'ASUS' },
    { pattern: /\bsony\b|xperia/i, brand: 'Sony' },
    { pattern: /\bitel\b/i, brand: 'Itel' },
    { pattern: /\bnubia\b/i, brand: 'Nubia' },
    { pattern: /\binfinix\b/i, brand: 'Infinix' },
    { pattern: /\bhuawei\b/i, brand: 'Huawei' },
    { pattern: /\blg\b/i, brand: 'LG' },
    { pattern: /\bhtc\b/i, brand: 'HTC' },
    { pattern: /\bblackberry\b/i, brand: 'BlackBerry' },
    { pattern: /\bnothing\b/i, brand: 'Nothing' },
    { pattern: /\bgoogle\b|pixel\s\d/i, brand: 'Google' },
  ];

  for (const { pattern, brand } of brandPatterns) {
    if (pattern.test(productName)) return brand;
  }

  // Fallback: lấy từ đầu tiên trong tên sản phẩm (thường là brand)
  // Ví dụ: "Điện thoại Itel P55 Plus" -> bỏ prefix "Điện thoại"
  const cleaned = productName
    .replace(/^điện thoại\s+/i, '')
    .replace(/^máy\s+/i, '')
    .trim();
  const firstWord = cleaned.split(/\s+/)[0];

  // Chỉ dùng firstWord nếu có vẻ là brand (viết hoa, không phải số)
  if (firstWord && /^[A-Z]/.test(firstWord) && firstWord.length > 1) {
    return firstWord;
  }

  return 'Unknown';
}

// =============================================
// RANDOM DELAY
// =============================================

/**
 * Dừng thực thi trong khoảng thời gian ngẫu nhiên
 * Tránh bị phát hiện là bot
 */
function randomDelay(minMs, maxMs) {
  const min = minMs || parseInt(process.env.MIN_DELAY) || 1500;
  const max = maxMs || parseInt(process.env.MAX_DELAY) || 3500;
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  
  log.debug(`Waiting ${delay}ms...`);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

// =============================================
// RETRY WRAPPER
// =============================================

/**
 * Wrapper để retry một async function khi gặp lỗi
 * @param {Function} fn - Async function cần retry
 * @param {number} maxRetries - Số lần retry tối đa
 * @param {string} label - Tên để log
 */
async function withRetry(fn, maxRetries, label) {
  const retries = maxRetries || parseInt(process.env.MAX_RETRIES) || 3;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) {
        log.error(`${label || 'Operation'} failed after ${retries} attempts: ${err.message}`, err);
        throw err;
      }
      
      log.warn(`${label || 'Operation'} attempt ${attempt}/${retries} failed. Retrying... (${err.message})`);
      await randomDelay(2000, 5000);
    }
  }
}

// =============================================
// TEXT HELPERS
// =============================================

/**
 * Parse số từ string có format tiền tệ VN
 * Ví dụ: "15.990.000₫" -> 15990000
 */
function parseVNPrice(priceStr) {
  if (!priceStr) return null;
  return parseInt(priceStr.replace(/[^\d]/g, '')) || null;
}

/**
 * Parse số GB từ string
 * Ví dụ: "256GB" -> 256, "8GB RAM" -> 8
 */
function parseGB(str) {
  if (!str) return null;
  const match = str.match(/(\d+)\s*(?:GB|gb|Gb)/i);
  return match ? parseInt(match[1]) : null;
}

/**
 * Làm sạch text: xóa whitespace thừa
 */
function cleanText(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Lấy sale percentage từ giá gốc và giá hiện tại
 */
function calculateSalePercent(comparePrice, currentPrice) {
  if (!comparePrice || !currentPrice || comparePrice <= currentPrice) return 0;
  return Math.round(((comparePrice - currentPrice) / comparePrice) * 100);
}

module.exports = {
  log,
  generateSlug,
  generateSku,
  detectBrand,
  randomDelay,
  withRetry,
  parseVNPrice,
  parseGB,
  cleanText,
  calculateSalePercent,
  normalizeColorCode,
};