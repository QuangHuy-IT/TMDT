/**
 * crawl-list.js
 * Crawl trang danh sách sản phẩm: https://cellphones.com.vn/mobile.html
 * 
 * Thu thập:
 * - product name
 * - product url
 * - thumbnail image
 * - current price
 * - compare price
 * - brand (detect từ tên)
 * - sale percentage
 * 
 * Xử lý:
 * - Scroll đến cuối trang để load lazy-loading
 * - Random delay tránh bị block
 * - Retry khi fail
 */

const { log, randomDelay, withRetry, parseVNPrice, detectBrand, cleanText } = require('./utils');

const LISTING_URL = 'https://cellphones.com.vn/mobile.html';
const MAX_PRODUCTS = parseInt(process.env.MAX_PRODUCTS) || 30;

// =============================================
// MAIN CRAWL LIST FUNCTION
// =============================================

/**
 * Crawl danh sách sản phẩm từ trang listing
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Array} Danh sách product info cơ bản
 */
async function crawlProductList(page) {
  log.info(`Crawling product list from: ${LISTING_URL}`);
  log.info(`Max products to crawl: ${MAX_PRODUCTS}`);
  
  return await withRetry(async () => {
    // Navigate đến trang listing
    await page.goto(LISTING_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    
    log.info('Page loaded, waiting for products...');
    
    // Chờ product cards xuất hiện
    await page.waitForSelector('.product-list-filter .product-list-filter-item, .cps-product-item, [class*="product-item"]', {
      timeout: 30000,
    }).catch(() => {
      log.warn('Product selector timeout - trying to proceed anyway');
    });
    
    // Scroll để load lazy-loaded content
    await scrollToLoadMore(page);
    
    // Extract dữ liệu từ listing
    const products = await extractProductsFromListing(page);
    
    log.success(`Found ${products.length} products on listing page`);
    
    // Giới hạn số lượng crawl
    const limited = products.slice(0, MAX_PRODUCTS);
    log.info(`Processing ${limited.length} products (limit: ${MAX_PRODUCTS})`);
    
    return limited;
  }, 3, 'CrawlProductList');
}

// =============================================
// SCROLL TO LOAD MORE
// =============================================

/**
 * Scroll từ từ đến cuối trang để kích hoạt lazy loading
 * CellphoneS load sản phẩm khi user scroll xuống
 */
async function scrollToLoadMore(page) {
  log.info('Scrolling to load all products...');
  
  let previousHeight = 0;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    // Lấy chiều cao hiện tại
    const currentHeight = await page.evaluate(() => document.body.scrollHeight);
    
    // Đã đến cuối trang
    if (currentHeight === previousHeight) {
      log.debug('Reached bottom of page');
      break;
    }
    
    previousHeight = currentHeight;
    
    // Scroll dần từng bước để trigger lazy load
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      const total = document.body.scrollHeight;
      let current = window.scrollY;
      
      while (current < total) {
        window.scrollBy(0, step);
        current += step;
        await new Promise(r => setTimeout(r, 200));
      }
    });
    
    // Chờ content mới load
    await randomDelay(800, 1500);
    
    // Đếm số sản phẩm hiện tại
    const currentCount = await page.evaluate(() => {
      const selectors = [
        '.product-list-filter-item',
        '.cps-product-item', 
        '[class*="product-item"]',
        'li[class*="product"]',
      ];
      for (const sel of selectors) {
        const items = document.querySelectorAll(sel);
        if (items.length > 0) return items.length;
      }
      return 0;
    });
    
    log.debug(`Scrolled - products visible: ${currentCount}`);
    
    // Đủ số lượng cần crawl thì dừng
    if (currentCount >= MAX_PRODUCTS) {
      log.info(`Reached target count: ${currentCount} products`);
      break;
    }
    
    attempts++;
  }
  
  // Scroll lại đầu trang
  await page.evaluate(() => window.scrollTo(0, 0));
}

// =============================================
// EXTRACT PRODUCTS FROM LISTING
// =============================================

/**
 * Extract thông tin cơ bản của từng sản phẩm từ trang listing
 * Thử nhiều selector khác nhau vì CellphoneS có thể thay đổi HTML
 */
async function extractProductsFromListing(page) {
  return await page.evaluate(() => {
    const products = [];
    
    // Thử nhiều selector phổ biến của CellphoneS
    const containerSelectors = [
      '.product-list-filter .product-list-filter-item',
      '.cps-product-item',
      '.product-item',
      'li.item[class*="product"]',
      '[data-product-id]',
      '.box-product',
    ];
    
    let productNodes = [];
    
    for (const selector of containerSelectors) {
      productNodes = document.querySelectorAll(selector);
      if (productNodes.length > 0) {
        console.log(`Using selector: ${selector}, found: ${productNodes.length}`);
        break;
      }
    }
    
    if (productNodes.length === 0) {
      // Fallback: tìm bất kỳ link nào dẫn đến trang điện thoại
      const links = document.querySelectorAll('a[href*="/dien-thoai/"], a[href*="/mobile/"]');
      console.warn(`Fallback to links: found ${links.length}`);
      // Xử lý link fallback...
    }
    
    productNodes.forEach((node) => {
      try {
        // Lấy link sản phẩm
        const linkEl = node.querySelector('a[href]') || node.closest('a[href]') || node;
        const url = linkEl?.href || linkEl?.getAttribute('href') || '';
        
        if (!url || url.includes('javascript:') || !url.includes('cellphones')) return;
        
        // Lấy tên sản phẩm
        const nameSelectors = [
          '.product-name', 
          '.item-title',
          'h3', 'h2',
          '[class*="product-name"]',
          '[class*="item-name"]',
          'p.box-text__name',
        ];
        let name = '';
        for (const sel of nameSelectors) {
          const el = node.querySelector(sel);
          if (el?.textContent?.trim()) {
            name = el.textContent.trim();
            break;
          }
        }
        
        // Lấy giá hiện tại
        const priceSelectors = [
          '.product__price--show',
          '.box-info__box-price span',
          '[class*="price-current"]',
          '[class*="price-show"]',
          '.price',
          'p.box-text__price strong',
        ];
        let currentPrice = '';
        for (const sel of priceSelectors) {
          const el = node.querySelector(sel);
          if (el?.textContent?.trim()) {
            currentPrice = el.textContent.trim();
            break;
          }
        }
        
        // Lấy giá gốc (compare price)
        const compareSelectors = [
          '.product__price--through',
          '[class*="price-old"]',
          '[class*="price-through"]',
          'del',
          's',
          '.price-old',
        ];
        let comparePrice = '';
        for (const sel of compareSelectors) {
          const el = node.querySelector(sel);
          if (el?.textContent?.trim()) {
            comparePrice = el.textContent.trim();
            break;
          }
        }
        
        // Lấy thumbnail
        const imgEl = node.querySelector('img[src], img[data-src], img[data-lazy-src]');
        const thumbnail = imgEl?.getAttribute('data-src') 
          || imgEl?.getAttribute('data-lazy-src')
          || imgEl?.src 
          || '';
        
        // Lấy % giảm giá nếu có tag
        const saleTag = node.querySelector('[class*="percent"], [class*="discount"], [class*="sale"]');
        const saleText = saleTag?.textContent?.trim() || '';
        
        if (name && url) {
          products.push({
            name: name.replace(/\s+/g, ' ').trim(),
            url: url.startsWith('http') ? url : `https://cellphones.com.vn${url}`,
            thumbnail: thumbnail.startsWith('//') ? `https:${thumbnail}` : thumbnail,
            currentPriceStr: currentPrice,
            comparePriceStr: comparePrice,
            saleText,
          });
        }
      } catch (e) {
        console.error('Error parsing product node:', e);
      }
    });
    
    return products;
  });
}

module.exports = { crawlProductList };
