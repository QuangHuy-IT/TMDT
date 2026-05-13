/**
 * save-product.js
 * Lưu dữ liệu sản phẩm vào MySQL — khớp CHÍNH XÁC với schema thực tế.
 *
 * Schema notes (từ DDL thực tế):
 *  - products.brand_id / category_id : BIGINT NOT NULL (FK RESTRICT)
 *  - products.short_description       : VARCHAR(500) NOT NULL
 *  - products.detail_description      : TEXT NOT NULL
 *  - products.status                  : ENUM('DRAFT','ACTIVE','INACTIVE','DISCONTINUED')
 *  - products.created_by              : BIGINT NULL (FK users — bỏ qua khi crawl)
 *  - product_variants.color           : VARCHAR(80) NOT NULL  ← không có DEFAULT
 *  - product_variants.price           : DECIMAL(15,2) NOT NULL
 *  - product_images                   : KHÔNG có updated_at
 *  - product_specifications.sort_order: INT UNSIGNED NOT NULL DEFAULT 0
 *  - product_specifications           : KHÔNG có unique key → bỏ ON DUPLICATE KEY
 */

const {
  withTransaction,
  getBrandId,
  getCategoryId,
  getProductIdBySlug,
} = require('./db');

const {
  log,
  generateSlug,
  generateSku,
  detectBrand,
  calculateSalePercent,
  parseVNPrice,
  cleanText,
} = require('./utils');

// =============================================
// CONSTANTS
// =============================================

// Fallback khi crawl không lấy được color — đảm bảo NOT NULL constraint
const COLOR_UNKNOWN = 'Chưa xác định';

// Fallback khi trang không có nội dung mô tả — đảm bảo NOT NULL constraint
const DESC_FALLBACK = 'Đang cập nhật thông tin sản phẩm.';

// =============================================
// MAIN SAVE FUNCTION
// =============================================

/**
 * Lưu một sản phẩm đầy đủ vào database (upsert theo slug)
 * @param {Object} productData - Dữ liệu đầy đủ từ crawler
 * @returns {{ productId: BigInt, isNew: boolean }}
 */
async function saveProduct(productData) {
  if (!productData.name?.trim()) {
    throw new Error('Product name is empty');
  }

  const slug = generateSlug(productData.name);
  if (!slug) {
    throw new Error(`Cannot generate slug for: "${productData.name}"`);
  }

  // Resolve brand_id và category_id TRƯỚC transaction
  // getBrandId/getCategoryId có thể tự INSERT brand mới — không lồng trong transaction khác
  const brand = productData.brand || detectBrand(productData.name);
  const [brandId, categoryId] = await Promise.all([
    getBrandId(brand),
    getCategoryId('Điện thoại'),
  ]);

  // brand_id / category_id là NOT NULL RESTRICT trong schema — phải có giá trị
  if (!brandId)    throw new Error(`Could not resolve brand_id for brand: "${brand}"`);
  if (!categoryId) throw new Error('Could not resolve category_id for "Điện thoại"');

  log.debug(`Saving: "${productData.name}" | brand="${brand}"(${brandId}) | cat=${categoryId}`);

  return await withTransaction(async (conn) => {
    // 1. Upsert product
    const existingId = await getProductIdBySlug(slug);
    let productId;
    let isNew;

    if (existingId) {
      productId = await updateProduct(conn, existingId, productData, brandId, categoryId);
      isNew = false;

      // Xóa children cũ trước khi insert lại
      await conn.execute('DELETE FROM product_variants      WHERE product_id = ?', [productId]);
      await conn.execute('DELETE FROM product_images        WHERE product_id = ?', [productId]);
      await conn.execute('DELETE FROM product_specifications WHERE product_id = ?', [productId]);

      log.info(`Updated product id=${productId}: "${productData.name}"`);
    } else {
      productId = await insertProduct(conn, productData, slug, brandId, categoryId);
      isNew = true;
      log.info(`Inserted product id=${productId}: "${productData.name}"`);
    }

    // 2. Variants — nếu crawl không ra thì tạo 1 placeholder
    const variants = productData.variants?.length > 0
      ? productData.variants
      : [buildFallbackVariant(productData)];

    await insertVariants(conn, productId, variants, brand);

    // 3. Images
    if (productData.images?.length > 0) {
      await insertImages(conn, productId, productData.images);
    }

    // 4. Specifications
    if (productData.specifications?.length > 0) {
      await insertSpecifications(conn, productId, productData.specifications);
    }

    log.success(
      `Saved "${productData.name}" — ` +
      `${variants.length} variants | ` +
      `${productData.images?.length || 0} images | ` +
      `${productData.specifications?.length || 0} specs`
    );

    return { productId, isNew };
  });
}

// =============================================
// FALLBACK VARIANT
// =============================================

/**
 * Tạo 1 variant placeholder khi không crawl được options
 * Giá lấy từ listing, parse RAM/ROM từ tên nếu có thể
 */
function buildFallbackVariant(productData) {
  const price = parseVNPrice(productData.currentPriceStr) || 0;
  const compareAtPrice = parseVNPrice(productData.comparePriceStr) || null;

  // "Samsung Galaxy S26 Ultra 12GB 256GB" → ram=12, storage=256
  const ramMatch     = productData.name.match(/(\d+)\s*GB\s*(?:RAM\s*)?[\/\+\s]/i);
  const storageMatch = productData.name.match(/[\/\+\s](\d+)\s*GB(?!\s*RAM)/i);

  return {
    color:        null,
    ramGb:        ramMatch     ? parseInt(ramMatch[1])     : null,
    storageGb:    storageMatch ? parseInt(storageMatch[1]) : null,
    price,
    compareAtPrice,
  };
}

// =============================================
// INSERT PRODUCT
// =============================================

async function insertProduct(conn, data, slug, brandId, categoryId) {
  // short_description / detail_description là NOT NULL — không được rỗng
  const shortDesc  = (cleanText(data.shortDescription) || DESC_FALLBACK).substring(0, 500);
  const detailDesc = data.detailDescription?.trim() || DESC_FALLBACK;
  const sale       = resolveSalePercent(data);

  const [result] = await conn.execute(`
    INSERT INTO products (
      brand_id, category_id,
      name, slug,
      short_description, detail_description,
      sale, warranty_months,
      status, is_featured
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
  `, [
    brandId,
    categoryId,
    data.name.trim(),
    slug,
    shortDesc,
    detailDesc,
    sale,
    data.warrantyMonths || 12,
    data.isFeatured ? 1 : 0,
  ]);

  return result.insertId;
}

// =============================================
// UPDATE PRODUCT
// =============================================

async function updateProduct(conn, productId, data, brandId, categoryId) {
  const shortDesc  = (cleanText(data.shortDescription) || DESC_FALLBACK).substring(0, 500);
  const detailDesc = data.detailDescription?.trim() || DESC_FALLBACK;
  const sale       = resolveSalePercent(data);

  await conn.execute(`
    UPDATE products SET
      brand_id           = ?,
      category_id        = ?,
      name               = ?,
      short_description  = ?,
      detail_description = ?,
      sale               = ?,
      warranty_months    = ?,
      is_featured        = ?,
      status             = 'ACTIVE'
    WHERE id = ?
  `, [
    brandId,
    categoryId,
    data.name.trim(),
    shortDesc,
    detailDesc,
    sale,
    data.warrantyMonths || 12,
    data.isFeatured ? 1 : 0,
    productId,
  ]);

  return productId;
}

// =============================================
// INSERT VARIANTS
// =============================================

/**
 * product_variants.color VARCHAR(80) NOT NULL — không có DEFAULT
 * Luôn cung cấp giá trị thực, fallback về COLOR_UNKNOWN
 */
async function insertVariants(conn, productId, variants, brand) {
  let inserted = 0;

  for (const variant of variants) {
    // color: NOT NULL, VARCHAR(80) — cắt nếu quá dài
    const color = (variant.color?.trim() || COLOR_UNKNOWN).substring(0, 80);

    // price: DECIMAL(15,2) NOT NULL
    const price = Number(variant.price) || 0;

    // compare_at_price: DECIMAL(15,2) NULL — chỉ set khi > 0
    const compareAtPrice = Number(variant.compareAtPrice) > 0
      ? Number(variant.compareAtPrice)
      : null;

    const sku = generateSku(brand, variant.ramGb, variant.storageGb, variant.color);

    await conn.execute(`
      INSERT INTO product_variants (
        product_id, sku, color,
        ram_gb, storage_gb,
        price, compare_at_price,
        is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
    `, [
      productId,
      sku,
      color,
      variant.ramGb    || null,
      variant.storageGb || null,
      price,
      compareAtPrice,
    ]);

    inserted++;
  }

  log.debug(`Inserted ${inserted} variant(s) for product_id=${productId}`);
}

// =============================================
// INSERT IMAGES
// =============================================

/**
 * product_images schema: product_id, variant_id(NULL), image_url,
 *   is_primary, sort_order, created_at(auto)
 * KHÔNG có updated_at — không insert cột đó
 */
async function insertImages(conn, productId, images) {
  let inserted = 0;

  for (const img of images) {
    // Bỏ qua URL rỗng hoặc không phải http
    if (!img.imageUrl?.startsWith('http')) continue;

    await conn.execute(`
      INSERT INTO product_images (
        product_id, image_url, is_primary, sort_order
      ) VALUES (?, ?, ?, ?)
    `, [
      productId,
      img.imageUrl,
      img.isPrimary ? 1 : 0,
      img.sortOrder ?? 0,
    ]);

    inserted++;
  }

  log.debug(`Inserted ${inserted} image(s) for product_id=${productId}`);
}

// =============================================
// INSERT SPECIFICATIONS
// =============================================

/**
 * product_specifications: không có unique key → INSERT thẳng (không ON DUPLICATE KEY)
 * Có sort_order INT UNSIGNED NOT NULL DEFAULT 0 → dùng index của vòng lặp
 */
async function insertSpecifications(conn, productId, specifications) {
  let inserted = 0;

  for (let i = 0; i < specifications.length; i++) {
    const { specKey, specValue } = specifications[i];
    if (!specKey?.trim() || !specValue?.trim()) continue;

    await conn.execute(`
      INSERT INTO product_specifications (
        product_id, spec_key, spec_value, sort_order
      ) VALUES (?, ?, ?, ?)
    `, [
      productId,
      specKey.trim().substring(0, 120),   // spec_key VARCHAR(120)
      specValue.trim().substring(0, 500), // spec_value VARCHAR(500)
      i,
    ]);

    inserted++;
  }

  log.debug(`Inserted ${inserted} spec(s) for product_id=${productId}`);
}

// =============================================
// HELPER: resolve sale %
// =============================================

function resolveSalePercent(data) {
  if (data.salePercent > 0) return data.salePercent;
  const current = parseVNPrice(data.currentPriceStr) || data.variants?.[0]?.price || 0;
  const compare = parseVNPrice(data.comparePriceStr)  || data.variants?.[0]?.compareAtPrice || 0;
  return calculateSalePercent(compare, current);
}

module.exports = { saveProduct };