/**
 * crawl-detail.js
 * Crawl trang chi tiết sản phẩm trên CellphoneS
 * 
 * Thu thập:
 * - Mô tả ngắn, mô tả dài
 * - Thông số kỹ thuật đầy đủ
 * - Tất cả variants (RAM/ROM/màu + giá)
 * - Tất cả ảnh sản phẩm
 * - Thông tin bảo hành
 * 
 * Xử lý anti-bot:
 * - Random user-agent
 * - Random viewport
 * - Stealth mode behaviors
 */

const { log, randomDelay, withRetry, parseVNPrice, parseGB, cleanText } = require('./utils');

// =============================================
// MAIN CRAWL DETAIL FUNCTION
// =============================================

/**
 * Crawl chi tiết một sản phẩm
 * @param {import('playwright').Page} page - Playwright page instance
 * @param {string} productUrl - URL trang chi tiết
 * @param {Object} basicInfo - Thông tin cơ bản từ trang listing
 * @returns {Object} Đầy đủ thông tin sản phẩm
 */
async function crawlProductDetail(page, productUrl, basicInfo) {
  log.info(`Crawling detail: ${productUrl}`);
  
  return await withRetry(async () => {
    // Navigate đến trang chi tiết
    await page.goto(productUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    
    // Chờ nội dung chính load
    await page.waitForSelector('h1, .product-name, [class*="product-name"]', {
      timeout: 20000,
    }).catch(() => log.warn(`Product name selector timeout for: ${productUrl}`));
    
    // Scroll để load lazy-loaded images
    await scrollDetailPage(page);
    
    // Nhỏ delay để JS render xong
    await randomDelay(500, 1200);
    
    // Extract tất cả dữ liệu
    const [mainData, variants, images, specs] = await Promise.all([
      extractMainData(page, basicInfo),
      extractVariants(page, basicInfo),
      extractImages(page, basicInfo.thumbnail),
      extractSpecifications(page),
    ]);
    
    const detail = {
      ...basicInfo,
      ...mainData,
      variants,
      images,
      specifications: specs,
    };
    
    log.debug(`Detail crawled: ${detail.name} | ${variants.length} variants | ${images.length} images | ${specs.length} specs`);
    
    return detail;
  }, 3, `CrawlDetail:${productUrl}`);
}

// =============================================
// SCROLL DETAIL PAGE
// =============================================

async function scrollDetailPage(page) {
  await page.evaluate(async () => {
    // Scroll từ từ để trigger lazy loading ảnh
    const totalHeight = document.body.scrollHeight;
    const step = 600;
    let position = 0;
    
    while (position < totalHeight) {
      window.scrollBy(0, step);
      position += step;
      await new Promise(r => setTimeout(r, 150));
    }
    
    // Scroll lại đầu
    window.scrollTo(0, 0);
  });
  
  await randomDelay(300, 800);
}

// =============================================
// EXTRACT MAIN DATA
// =============================================

/**
 * Lấy thông tin chính: tên, mô tả, bảo hành
 */
async function extractMainData(page, basicInfo) {
  return await page.evaluate((basic) => {
    // Tên sản phẩm
    const nameSelectors = ['h1', '.product-name h1', '[class*="product-name"] h1', '.product__name'];
    let name = basic.name;
    for (const sel of nameSelectors) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) {
        name = el.textContent.trim();
        break;
      }
    }
    
    // Mô tả ngắn - thường là tagline hoặc highlight specs
    const shortDescSelectors = [
      '.product-desc p:first-child',
      '.product-short-desc',
      '[class*="short-desc"]',
      '.product-highlight li:first-child',
      'meta[name="description"]',
    ];
    let shortDescription = '';
    for (const sel of shortDescSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        shortDescription = el.getAttribute('content') || el.textContent?.trim() || '';
        if (shortDescription.length > 20) break;
      }
    }
    // Fallback: dùng meta description
    if (!shortDescription) {
      const metaDesc = document.querySelector('meta[name="description"]');
      shortDescription = metaDesc?.getAttribute('content') || '';
    }
    
    // Mô tả dài - nội dung chi tiết
    const longDescSelectors = [
      '.product-description',
      '[class*="product-description"]',
      '#product-description',
      '.product-content',
      '[class*="product-content"]',
    ];
    let detailDescription = '';
    for (const sel of longDescSelectors) {
      const el = document.querySelector(sel);
      if (el?.innerHTML?.trim()) {
        // Lấy HTML để giữ formatting, làm sạch script/style tags
        detailDescription = el.innerHTML
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .trim();
        if (detailDescription.length > 50) break;
      }
    }
    
    // Thông tin bảo hành
    const warrantySelectors = [
      '[class*="warranty"]',
      '[class*="bao-hanh"]',
      '.policy-item',
      'li:contains("bảo hành")',
    ];
    let warrantyMonths = 12; // Default 12 tháng
    
    // Tìm text chứa thông tin bảo hành
    const allText = document.body.innerText || '';
    const warrantyMatch = allText.match(/bảo hành[^0-9]*(\d+)\s*tháng/i);
    if (warrantyMatch) {
      warrantyMonths = parseInt(warrantyMatch[1]);
    }
    
    // is_featured: check nếu có badge "Nổi bật", "Hot", "Bán chạy"
    const featuredBadges = document.querySelectorAll('[class*="hot"], [class*="featured"], [class*="noi-bat"], [class*="ban-chay"]');
    const isFeatured = featuredBadges.length > 0;
    
    // Sale percentage từ badge
    const saleBadge = document.querySelector('[class*="percent"], [class*="discount-percent"], [class*="-sale"]');
    const saleText = saleBadge?.textContent?.trim() || basic.saleText || '';
    const saleMatch = saleText.match(/(\d+)\s*%/);
    const salePercent = saleMatch ? parseInt(saleMatch[1]) : 0;
    
    return {
      name: (name || '').replace(/\s+/g, ' ').trim(),
      shortDescription: (shortDescription || '').substring(0, 500),
      detailDescription,
      warrantyMonths,
      isFeatured,
      salePercent,
    };
  }, basicInfo);
}

// =============================================
// EXTRACT VARIANTS
// =============================================

/**
 * Lấy tất cả variants (RAM/ROM/màu sắc + giá)
 * CellphoneS thường có options chọn bộ nhớ và màu
 */
async function extractVariants(page, basicInfo) {
  const variants = await page.evaluate((basic) => {
    const variants = [];
    
    // --- Lấy tất cả options bộ nhớ (RAM/ROM) ---
    const storageOptions = [];
    const storageSelectors = [
      '.storage-btn',
      '[class*="memory"]',
      '[class*="storage"]',
      '[class*="capacity"]',
      'ul[class*="config"] li',
      '.product-options [class*="option"]',
      'button[class*="config"]',
    ];
    
    for (const sel of storageSelectors) {
      const els = document.querySelectorAll(sel);
      if (els.length > 0) {
        els.forEach(el => {
          const text = el.textContent?.trim();
          if (text && (text.includes('GB') || text.includes('TB'))) {
            // Parse giá từ sub-element hoặc data attribute
            const priceEl = el.querySelector('[class*="price"]');
            const price = el.getAttribute('data-price') || priceEl?.textContent?.trim() || '';
            storageOptions.push({ label: text, price, element: el.tagName });
          }
        });
        if (storageOptions.length > 0) break;
      }
    }
    
    // --- Lấy tất cả màu sắc ---
    const colorOptions = [];
    const colorSelectors = [
      '[class*="color-item"]',
      '[class*="color-option"]',
      '.product-color li',
      'ul[class*="color"] li',
      'button[class*="color"]',
      '[data-color]',
    ];
    
    for (const sel of colorSelectors) {
      const els = document.querySelectorAll(sel);
      if (els.length > 0) {
        els.forEach(el => {
          const colorName = el.getAttribute('data-color')
            || el.getAttribute('title')
            || el.getAttribute('aria-label')
            || el.textContent?.trim()
            || '';
          
          if (colorName) {
            const imgEl = el.querySelector('img');
            const colorImg = imgEl?.getAttribute('data-src') || imgEl?.src || '';
            colorOptions.push({ name: colorName, image: colorImg });
          }
        });
        if (colorOptions.length > 0) break;
      }
    }
    
    // --- Lấy giá hiện tại ---
    const priceEl = document.querySelector(
      '.product__price--show, [class*="price-current"], [class*="price-show"], .price strong, p.product-price'
    );
    const currentPriceStr = priceEl?.textContent?.trim() || basic.currentPriceStr || '0';
    const currentPrice = parseInt(currentPriceStr.replace(/[^\d]/g, '')) || 0;
    
    const comparePriceEl = document.querySelector(
      '.product__price--through, [class*="price-old"], [class*="price-through"], del, s.old-price'
    );
    const comparePriceStr = comparePriceEl?.textContent?.trim() || basic.comparePriceStr || '';
    const comparePrice = parseInt(comparePriceStr.replace(/[^\d]/g, '')) || 0;
    
    // --- Tạo variants từ combinations ---
    if (storageOptions.length > 0 || colorOptions.length > 0) {
      const storages = storageOptions.length > 0 ? storageOptions : [{ label: '', price: '' }];
      const colors = colorOptions.length > 0 ? colorOptions : [{ name: '', image: '' }];
      
      storages.forEach(storage => {
        colors.forEach(color => {
          // Parse RAM/ROM từ storage label
          // Ví dụ: "8GB/256GB", "256GB", "12GB+512GB"
          const ramMatch = storage.label.match(/(\d+)\s*GB[^\/]*\//i);
          const romMatch = storage.label.match(/[\/+]?\s*(\d+)\s*(?:GB|TB)/i);
          const singleMatch = !storage.label.includes('/') && !storage.label.includes('+')
            ? storage.label.match(/(\d+)\s*(?:GB|TB)/i)
            : null;
          
          const ramGb = ramMatch ? parseInt(ramMatch[1]) : null;
          const romFromLabel = romMatch ? parseInt(romMatch[1]) : null;
          const romFromSingle = singleMatch ? parseInt(singleMatch[1]) : null;
          // TB -> GB
          const isRomTB = storage.label.match(/TB/i) && romFromLabel;
          const storageGb = isRomTB ? romFromLabel * 1024 
            : romFromLabel || romFromSingle || null;
          
          // Giá variant (override nếu storage có giá riêng)
          const variantPriceStr = storage.price || currentPriceStr;
          const variantPrice = parseInt(variantPriceStr.replace(/[^\d]/g, '')) || currentPrice;
          
          variants.push({
            color: color.name || null,
            colorImage: color.image || null,
            ramGb,
            storageGb,
            price: variantPrice,
            compareAtPrice: comparePrice || null,
            storageLabel: storage.label,
          });
        });
      });
    } else {
      // Không có options -> tạo 1 variant mặc định từ giá trên listing
      variants.push({
        color: null,
        colorImage: null,
        ramGb: null,
        storageGb: null,
        price: currentPrice,
        compareAtPrice: comparePrice || null,
        storageLabel: '',
      });
    }
    
    return variants;
  }, basicInfo);
  
  return variants;
}

// =============================================
// EXTRACT IMAGES
// =============================================

/**
 * Lấy tất cả ảnh sản phẩm
 */
async function extractImages(page, thumbnailUrl) {
  const images = await page.evaluate((thumbnail) => {
    const imageSet = new Set();
    const imageList = [];
    
    // Ảnh chính (carousel/gallery)
    const gallerySelectors = [
      '.product-slider img',
      '.product-gallery img',
      '[class*="gallery"] img',
      '[class*="slider"] img',
      '.product-img img',
      '.product__images img',
      '[class*="product-image"] img',
    ];
    
    for (const sel of gallerySelectors) {
      document.querySelectorAll(sel).forEach(img => {
        const src = img.getAttribute('data-src') 
          || img.getAttribute('data-lazy-src')
          || img.getAttribute('data-zoom-image')
          || img.src
          || '';
        
        if (src && src.startsWith('http') && !src.includes('placeholder') && !imageSet.has(src)) {
          imageSet.add(src);
          imageList.push(src);
        }
      });
      if (imageList.length > 0) break;
    }
    
    // Nếu không tìm thấy gallery, lấy ảnh lớn nhất trên trang
    if (imageList.length === 0) {
      document.querySelectorAll('img[src]').forEach(img => {
        const src = img.src || '';
        if (src && src.startsWith('http') && !src.includes('placeholder') 
            && !src.includes('icon') && !src.includes('logo')
            && (img.naturalWidth > 100 || img.width > 100)
            && !imageSet.has(src)) {
          imageSet.add(src);
          imageList.push(src);
        }
      });
    }
    
    // Thêm thumbnail từ listing nếu chưa có
    if (thumbnail && !imageSet.has(thumbnail)) {
      imageList.unshift(thumbnail);
    }
    
    return imageList.slice(0, 20); // Tối đa 20 ảnh
  }, thumbnailUrl);
  
  // Format thành object với metadata
  return images.map((url, index) => ({
    imageUrl: url,
    isPrimary: index === 0,
    sortOrder: index,
    altText: null,
  }));
}

// =============================================
// EXTRACT SPECIFICATIONS
// =============================================

/**
 * Lấy toàn bộ thông số kỹ thuật
 * CellphoneS thường có bảng specs dạng key-value
 */
async function extractSpecifications(page) {
  return await page.evaluate(() => {
    const specs = [];
    const seenKeys = new Set();
    
    // Thử các selector cho bảng thông số
    const tableSelectors = [
      '.technical-content tr',
      '.product-specs tr',
      '[class*="technical"] tr',
      '[class*="specification"] tr',
      '.table-info tr',
      'table[class*="spec"] tr',
      '.specs-list li',
    ];
    
    for (const selector of tableSelectors) {
      const rows = document.querySelectorAll(selector);
      
      if (rows.length > 0) {
        rows.forEach(row => {
          // Xử lý dạng bảng (td)
          const cells = row.querySelectorAll('td');
          if (cells.length >= 2) {
            const key = cells[0].textContent?.trim();
            const value = cells[1].textContent?.trim();
            
            if (key && value && !seenKeys.has(key)) {
              seenKeys.add(key);
              specs.push({ specKey: key, specValue: value });
            }
          }
          
          // Xử lý dạng th/td
          const header = row.querySelector('th');
          const data = row.querySelector('td');
          if (header && data) {
            const key = header.textContent?.trim();
            const value = data.textContent?.trim();
            if (key && value && !seenKeys.has(key)) {
              seenKeys.add(key);
              specs.push({ specKey: key, specValue: value });
            }
          }
        });
        
        if (specs.length > 0) break;
      }
    }
    
    // Fallback: tìm dạng definition list (dl/dt/dd)
    if (specs.length === 0) {
      const dtList = document.querySelectorAll('dl dt, [class*="spec-name"]');
      dtList.forEach(dt => {
        const dd = dt.nextElementSibling;
        if (dd) {
          const key = dt.textContent?.trim();
          const value = dd.textContent?.trim();
          if (key && value && !seenKeys.has(key)) {
            seenKeys.add(key);
            specs.push({ specKey: key, specValue: value });
          }
        }
      });
    }
    
    // Fallback: tìm dạng label:value trong divs
    if (specs.length === 0) {
      const specItems = document.querySelectorAll(
        '[class*="spec-item"], [class*="info-item"], [class*="tech-item"]'
      );
      
      specItems.forEach(item => {
        const labelEl = item.querySelector('[class*="label"], [class*="name"], strong, b');
        const valueEl = item.querySelector('[class*="value"], [class*="content"], span:last-child');
        
        if (labelEl && valueEl) {
          const key = labelEl.textContent?.trim();
          const value = valueEl.textContent?.trim();
          if (key && value && key !== value && !seenKeys.has(key)) {
            seenKeys.add(key);
            specs.push({ specKey: key, specValue: value });
          }
        }
      });
    }
    
    // Chuẩn hóa spec keys (map sang tiếng Anh)
    const keyMap = {
      'màn hình': 'screen_size',
      'kích thước màn hình': 'screen_size',
      'tần số quét': 'refresh_rate',
      'chip': 'cpu',
      'cpu': 'cpu',
      'vi xử lý': 'cpu',
      'gpu': 'gpu',
      'card đồ họa': 'gpu',
      'pin': 'battery',
      'dung lượng pin': 'battery',
      'camera sau': 'rear_camera',
      'camera trước': 'front_camera',
      'camera': 'camera',
      'hệ điều hành': 'operating_system',
      'os': 'operating_system',
      'độ phân giải': 'resolution',
      'kích thước': 'dimensions',
      'trọng lượng': 'weight',
      'ram': 'ram',
      'bộ nhớ ram': 'ram',
      'rom': 'storage',
      'bộ nhớ trong': 'storage',
      'sim': 'sim',
      'khe sim': 'sim',
      'kết nối': 'connectivity',
      'wifi': 'wifi',
      'bluetooth': 'bluetooth',
      '4g': '4g_lte',
      '5g': '5g',
      'usb': 'usb_port',
      'cổng sạc': 'charging_port',
      'sạc nhanh': 'fast_charging',
    };
    
    return specs.map(spec => {
      const lowerKey = spec.specKey.toLowerCase();
      const mappedKey = Object.entries(keyMap).find(([k]) => lowerKey.includes(k))?.[1] || spec.specKey;
      return {
        specKey: mappedKey,
        specValue: spec.specValue.replace(/\s+/g, ' ').trim(),
      };
    }).filter(s => s.specKey && s.specValue && s.specValue.length < 500);
  });
}

module.exports = { crawlProductDetail };
