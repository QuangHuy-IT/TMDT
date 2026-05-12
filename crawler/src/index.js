/**
 * index.js
 * Entry point - Orchestrator chính của crawler
 * 
 * Luồng xử lý:
 * 1. Khởi tạo Playwright browser với anti-bot settings
 * 2. Crawl danh sách sản phẩm từ listing page
 * 3. Với mỗi sản phẩm: crawl detail, save to DB
 * 4. Export products.json
 * 5. In summary report
 */

require('dotenv').config();

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

const { initPool, closePool } = require('./db');
const { crawlProductList } = require('./crawl-list');
const { crawlProductDetail } = require('./crawl-detail');
const { saveProduct } = require('./save-product');
const { log, randomDelay, detectBrand, parseVNPrice, calculateSalePercent } = require('./utils');

// =============================================
// BROWSER CONFIGURATION (Anti-Bot)
// =============================================

// Danh sách user-agents thực tế để rotate
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
];

// Viewport sizes ngẫu nhiên (tránh fingerprinting)
const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1280, height: 800 },
];

/**
 * Khởi tạo Playwright browser với stealth settings
 */
async function createBrowser() {
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const viewport = VIEWPORTS[Math.floor(Math.random() * VIEWPORTS.length)];
  
  log.info(`Browser UA: ${userAgent.substring(0, 50)}...`);
  log.info(`Viewport: ${viewport.width}x${viewport.height}`);
  
  const browser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--lang=vi-VN,vi',
      '--disable-blink-features=AutomationControlled', // Ẩn dấu hiệu automation
    ],
  });
  
  const context = await browser.newContext({
    userAgent,
    viewport,
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    // Giả lập headers của browser thực
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    },
  });
  
  // Inject stealth scripts - ẩn navigator.webdriver
  await context.addInitScript(() => {
    // Xóa webdriver flag
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    
    // Fake plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
        { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
        { name: 'Native Client', filename: 'internal-nacl-plugin' },
      ],
    });
    
    // Fake languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['vi-VN', 'vi', 'en-US', 'en'],
    });
    
    // Fake permissions
    const originalQuery = window.navigator.permissions?.query;
    if (originalQuery) {
      window.navigator.permissions.query = (params) =>
        params.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission })
          : originalQuery(params);
    }
  });
  
  const page = await context.newPage();
  
  // Chặn resources không cần thiết để tăng tốc
  await page.route('**/*.{png,jpg,jpeg,gif,svg,ico,woff,woff2,ttf,eot}', async (route) => {
    const resourceType = route.request().resourceType();
    // Cho phép ảnh product nhưng chặn fonts, icons nhỏ
    if (['font', 'other'].includes(resourceType)) {
      await route.abort();
    } else {
      await route.continue();
    }
  });
  
  // Chặn tracking scripts để giảm tải
  await page.route('**/{analytics,gtm,facebook,hotjar,tawk}**', (route) => route.abort());
  
  return { browser, context, page };
}

// =============================================
// MAIN CRAWLER FUNCTION
// =============================================

async function main() {
  const startTime = Date.now();
  let browser, page;
  
  const stats = {
    total: 0,
    success: 0,
    updated: 0,
    errors: 0,
    errorList: [],
  };
  
  const allProducts = [];
  
  console.log('\n' + '='.repeat(60));
  console.log('  CellphoneS Product Crawler');
  console.log('  Target: https://cellphones.com.vn/mobile.html');
  console.log('='.repeat(60) + '\n');
  
  try {
    // 1. Khởi tạo Database
    log.info('Initializing database connection...');
    await initPool();
    
    // 2. Khởi tạo Browser
    log.info('Launching browser...');
    const result = await createBrowser();
    browser = result.browser;
    page = result.page;
    
    // 3. Crawl danh sách sản phẩm
    log.info('Starting product list crawl...');
    const productList = await crawlProductList(page);
    stats.total = productList.length;
    
    log.success(`Product list crawled: ${productList.length} products found`);
    
    // 4. Crawl chi tiết từng sản phẩm
    for (let i = 0; i < productList.length; i++) {
      const basicInfo = productList[i];
      const progress = `[${i + 1}/${productList.length}]`;
      
      log.info(`${progress} Processing: ${basicInfo.name}`);
      
      try {
        // Random delay giữa các requests
        if (i > 0) {
          await randomDelay();
        }
        
        // Detect brand từ tên
        basicInfo.brand = detectBrand(basicInfo.name);
        
        // Crawl chi tiết sản phẩm
        const detailData = await crawlProductDetail(page, basicInfo.url, basicInfo);
        
        // Lưu vào database
        const { productId, isNew } = await saveProduct(detailData);
        
        if (isNew) {
          stats.success++;
        } else {
          stats.updated++;
        }
        
        // Collect cho JSON export
        allProducts.push({
          id: productId,
          name: detailData.name,
          url: detailData.url,
          brand: detailData.brand,
          currentPrice: parseVNPrice(detailData.currentPriceStr),
          comparePrice: parseVNPrice(detailData.comparePriceStr),
          thumbnail: detailData.thumbnail,
          variantCount: detailData.variants?.length || 0,
          imageCount: detailData.images?.length || 0,
          specCount: detailData.specifications?.length || 0,
          isNew,
        });
        
        log.success(`${progress} ✓ ${detailData.name} (${isNew ? 'NEW' : 'UPDATED'})`);
        
      } catch (err) {
        stats.errors++;
        const errorInfo = {
          product: basicInfo.name,
          url: basicInfo.url,
          error: err.message,
        };
        stats.errorList.push(errorInfo);
        log.error(`${progress} ✗ Failed: ${basicInfo.name} - ${err.message}`, err);
        
        // Tiếp tục với sản phẩm tiếp theo thay vì dừng
        await randomDelay(2000, 4000);
      }
    }
    
    // 5. Export products.json
    await exportProductsJson(allProducts);
    
  } catch (err) {
    log.error(`Critical error in main crawler: ${err.message}`, err);
    process.exit(1);
  } finally {
    // Cleanup
    if (browser) {
      await browser.close();
      log.info('Browser closed');
    }
    await closePool();
  }
  
  // 6. Print summary report
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('\n' + '='.repeat(60));
  console.log('  CRAWL COMPLETE - SUMMARY REPORT');
  console.log('='.repeat(60));
  console.log(`  Total products found : ${stats.total}`);
  console.log(`  Newly inserted       : ${stats.success}`);
  console.log(`  Updated              : ${stats.updated}`);
  console.log(`  Errors               : ${stats.errors}`);
  console.log(`  Duration             : ${duration}s`);
  console.log(`  Output               : ./output/products.json`);
  
  if (stats.errorList.length > 0) {
    console.log('\n  ERRORS:');
    stats.errorList.forEach((e, i) => {
      console.log(`  ${i + 1}. ${e.product}`);
      console.log(`     ${e.error}`);
    });
  }
  
  console.log('='.repeat(60) + '\n');
}

// =============================================
// EXPORT JSON
// =============================================

async function exportProductsJson(products) {
  try {
    const outputDir = process.env.OUTPUT_DIR || './output';
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, 'products.json');
    await fs.writeFile(outputPath, JSON.stringify(products, null, 2), 'utf-8');
    
    log.success(`Exported ${products.length} products to ${outputPath}`);
  } catch (err) {
    log.error(`Failed to export JSON: ${err.message}`, err);
  }
}

// Run
main().catch((err) => {
  log.error('Unhandled error:', err);
  process.exit(1);
});
