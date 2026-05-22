/**
 * test-twin.mjs — Puppeteer-based test script for the scan → digital twin pipeline.
 *
 * Usage:
 *   node scripts/test-twin.mjs [menu_name]
 *
 * Examples:
 *   node scripts/test-twin.mjs COMMERCE     # processes COMMERCE_1 + COMMERCE_2
 *   node scripts/test-twin.mjs FARAO        # processes FARAO_X + FARAO_Y
 *   node scripts/test-twin.mjs              # processes all menus
 *
 * Requires: npm run dev running on localhost:3000
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHOTOS_DIR = 'C:\\Users\\migue\\OneDrive\\Documents\\FOODBASE\\WILLY_TIALGO\\WILLY\\MENU_PHOTOS';
const CACHE_DIR = path.join(__dirname, '..', '.test-cache');
const BASE_URL = 'http://localhost:3000';

// Menu definitions: name → photo files (order matters: front first, then back)
const MENUS = {
  COMMERCE:  ['COMMERCE_1.jpeg', 'COMMERCE_2.jpeg'],
  FARAO:     ['FARAO_X.jpeg', 'FARAO_Y.jpeg'],
  OPEK:      ['OPEK_1.jpeg', 'OPEK_2.jpeg'],
  STRAND:    ['STRAND_X.jpeg', 'STRAND_Y.jpeg'],
  WEERELT:   ['WEERELT_1.jpeg', 'WEERELT_2.jpeg'],
  SCHUUR:    ['SCHUUR_X.jpeg', 'SCHUUR_Y.jpeg'],
  LOVANIUM:  ['LOVANIUM_X.jpeg', 'LOVANIUM_Y.jpeg'],
  HAL_5:     ['HAL_5_1.jpeg', 'HAL_5_2.jpeg'],
};

// Expected results for validation
const EXPECTED = {
  COMMERCE:  { fold: 'bifold' },
  FARAO:     { fold: 'bifold' },
  OPEK:      { fold: 'four-panel' },
  STRAND:    { fold: 'bifold' },
  WEERELT:   { fold: 'a5-portrait' },
  SCHUUR:    { fold: 'a4-portrait' },
  LOVANIUM:  { fold: 'a4-portrait' },
  HAL_5:     { fold: 'a4-landscape' },
};

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function loginIfNeeded(page) {
  // First try going to scan directly
  await page.goto(`${BASE_URL}/scan`, { waitUntil: 'networkidle2', timeout: 15000 });
  await sleep(1000);
  const url = page.url();

  if (url.includes('/scan') && !url.includes('/claim')) {
    console.log('  Already authenticated ✓');
    return;
  }

  // Navigate to landing page with auto-login query params
  console.log('  Not logged in, attempting auto-login via landing page...');
  await page.goto(`${BASE_URL}/?email=heverlee@colruyt.be&password=Colruyt2026!`, { waitUntil: 'networkidle2', timeout: 15000 });
  await sleep(3000);

  // Now try scan again
  await page.goto(`${BASE_URL}/scan`, { waitUntil: 'networkidle2', timeout: 15000 });
  await sleep(1000);
  const newUrl = page.url();
  if (newUrl.includes('/claim') || !newUrl.includes('/scan')) {
    throw new Error('Could not auto-login. Check credentials or log in manually first.');
  }
  console.log('  Authenticated ✓');
}

async function uploadPhotos(page, photos) {
  // Find the file input
  const fileInput = await page.$('input[type="file"][accept="image/*"]');
  if (!fileInput) throw new Error('File input not found');

  const filePaths = photos.map(f => path.join(PHOTOS_DIR, f));
  for (const fp of filePaths) {
    if (!fs.existsSync(fp)) throw new Error(`Photo not found: ${fp}`);
  }

  await fileInput.uploadFile(...filePaths);
  console.log(`  Uploaded ${photos.length} photos`);

  // Wait for uploads to complete (thumbnails appear)
  await sleep(3000);
}

async function clickButtonAndWait(page, buttonText, timeout = 120000) {
  // Wait for the button to appear (it may be conditionally rendered)
  const startWait = Date.now();
  let button = null;
  while (Date.now() - startWait < 30000) {
    button = await page.evaluateHandle((text) => {
      const buttons = [...document.querySelectorAll('button')];
      return buttons.find(b => b.textContent.includes(text) && !b.disabled);
    }, buttonText);
    if (button && (await button.asElement())) break;
    button = null;
    await sleep(500);
  }

  if (!button || !(await button.asElement())) {
    throw new Error(`Button "${buttonText}" not found or still disabled after 30s`);
  }

  await button.asElement().click();
  console.log(`  Clicked "${buttonText}"...`);

  // Wait for processing to complete (button re-enables)
  await sleep(2000);
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const state = await page.evaluate((text) => {
      const buttons = [...document.querySelectorAll('button')];
      const btn = buttons.find(b => b.textContent.includes(text));
      if (!btn) return 'gone'; // button might disappear and reappear
      return btn.disabled ? 'disabled' : 'enabled';
    }, buttonText);
    if (state === 'enabled') break;
    await sleep(1000);
  }
}

async function readDOMMetrics(page) {
  return page.evaluate(() => {
    const metrics = { pages: [], foldInfo: null, errors: [] };

    // Read fold result from the info display
    const foldEl = document.querySelector('.st-preview');
    if (!foldEl) {
      metrics.errors.push('No .st-preview found — digital twin not rendered');
      return metrics;
    }

    // Read each page's menu container
    const menuEls = foldEl.querySelectorAll('.st-preview__menu');
    menuEls.forEach((menuEl, idx) => {
      const rect = menuEl.getBoundingClientRect();
      const columns = menuEl.querySelectorAll('.st-column');
      const pageMetrics = {
        index: idx,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        scrollHeight: menuEl.scrollHeight,
        overflows: menuEl.scrollHeight > rect.height + 5,
        overflowAmount: Math.max(0, menuEl.scrollHeight - rect.height),
        computedFontSize: getComputedStyle(menuEl).fontSize,
        columnCount: columns.length,
        columns: [],
      };

      columns.forEach((colEl, ci) => {
        const colRect = colEl.getBoundingClientRect();
        const textboxes = colEl.querySelectorAll('.st-textbox');
        const rows = colEl.querySelectorAll('.st-row');
        const headers = colEl.querySelectorAll('.st-textbox__header');

        pageMetrics.columns.push({
          index: ci,
          width: Math.round(colRect.width),
          height: Math.round(colRect.height),
          textboxCount: textboxes.length,
          rowCount: rows.length,
          headerCount: headers.length,
          headers: [...headers].map(h => h.textContent.trim()),
        });
      });

      metrics.pages.push(pageMetrics);
    });

    return metrics;
  });
}

async function readFoldResult(page) {
  return page.evaluate(() => {
    // Try to read from the fold info display
    const infoEl = document.querySelector('[style*="color: rgb(124, 58, 237)"]');
    return infoEl ? infoEl.textContent : null;
  });
}

// ── Clean vector PDF export (for Canva import) ─────────────────────────────
// Extracts each menu page's HTML + CSS, renders in a blank page at exact
// paper dimensions, and prints to PDF → real selectable/editable text.

// Always A4 for portrait — A5 is same ratio, just scales on export
const PAPER_SIZES = {
  'a4-portrait':  { w: 210, h: 297 },
  'a4-landscape': { w: 297, h: 210 },
  'bifold':       { w: 297, h: 210 },
  'trifold':      { w: 297, h: 210 },
  'zfold':        { w: 297, h: 210 },
  'four-panel':   { w: 420, h: 297 },
  'booklet':      { w: 210, h: 297 },
};

function normalizeFoldType(ft) {
  if (!ft) return 'a4-portrait';
  if (ft === 'a5-portrait') return 'a4-portrait';
  if (ft === 'a5-booklet' || ft === 'a4-booklet') return 'booklet';
  if (PAPER_SIZES[ft]) return ft;
  return 'a4-portrait';
}

async function exportCleanPDF(browser, page, menuName, ts) {
  // Print the ACTUAL rendered page — no reconstruction.
  // For each .st-preview__menu, isolate it in the DOM, print, restore.

  const menuCount = await page.evaluate(() =>
    document.querySelectorAll('.st-preview__menu').length
  );

  if (!menuCount) {
    console.log('  Clean PDF: no menu pages found, skipping');
    return;
  }

  // Read fold type from the info display
  const foldType = await page.evaluate(() => {
    const infoEl = document.querySelector('[style*="color: rgb(124, 58, 237)"]');
    const text = infoEl?.textContent || '';
    const match = text.match(/^([\w-]+)\s*·/);
    return match ? match[1] : 'a4-portrait';
  });
  const paperDims = PAPER_SIZES[normalizeFoldType(foldType)] || PAPER_SIZES['a4-portrait'];

  for (let i = 0; i < menuCount; i++) {
    const label = i === 0 ? 'front' : i === 1 ? 'back' : `page${i + 1}`;
    const pdfPath = path.join(CACHE_DIR, `${menuName}_clean_${label}_${ts}.pdf`);

    // Read the menu's actual rendered size (includes zoom)
    const menuSize = await page.evaluate((idx) => {
      const menu = document.querySelectorAll('.st-preview__menu')[idx];
      if (!menu) return null;
      const rect = menu.getBoundingClientRect();
      return { width: Math.round(rect.width), height: Math.round(rect.height) };
    }, i);

    if (!menuSize) continue;

    // Isolate this menu page: hide everything else
    await page.evaluate((idx) => {
      const menu = document.querySelectorAll('.st-preview__menu')[idx];
      if (!menu) return;

      // Store original state to restore later
      window.__cleanPdfBackup = {
        bodyHTML: document.body.innerHTML,
        bodyStyle: document.body.getAttribute('style') || '',
        htmlStyle: document.documentElement.getAttribute('style') || '',
      };

      // Move the menu to be the sole child of body
      const clone = menu.cloneNode(true);
      document.body.innerHTML = '';
      document.body.appendChild(clone);

      // Read the menu's background color to fill the whole page
      const bgColor = getComputedStyle(menu).backgroundColor || '#faf8f4';

      // Style body for clean print — match background to avoid black gaps
      document.body.style.cssText = `margin:0; padding:0; overflow:hidden; background:${bgColor};`;
      document.documentElement.style.cssText = `margin:0; padding:0; background:${bgColor};`;

      // Make the clone fill the entire viewport
      clone.style.width = '100vw';
      clone.style.height = '100vh';
      clone.style.maxWidth = 'none';
      clone.style.border = 'none';
      clone.style.borderRadius = '0';
      clone.style.boxShadow = 'none';
      clone.style.overflow = 'hidden';
      clone.style.flexShrink = '0';

      // Hide interactive elements (toggle icons, hover indicators)
      clone.querySelectorAll('.st-row__pv-toggle').forEach(el => el.style.display = 'none');
    }, i);

    await sleep(300);

    // Set viewport to the EXACT size the menu was rendered at —
    // this way the content stays pixel-identical to the browser
    await page.setViewport({ width: menuSize.width, height: menuSize.height });
    await sleep(300);

    // Print at A4 dimensions — Puppeteer maps viewport pixels to page mm
    await page.pdf({
      path: pdfPath,
      printBackground: true,
      preferCSSPageSize: false,
      width: `${paperDims.w}mm`,
      height: `${paperDims.h}mm`,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    console.log(`  Clean PDF (${label}) → ${pdfPath}`);

    // Restore the page
    await page.evaluate(() => {
      if (!window.__cleanPdfBackup) return;
      document.body.innerHTML = window.__cleanPdfBackup.bodyHTML;
      document.body.setAttribute('style', window.__cleanPdfBackup.bodyStyle);
      document.documentElement.setAttribute('style', window.__cleanPdfBackup.htmlStyle);
      delete window.__cleanPdfBackup;
    });

    // Restore viewport
    await page.setViewport({ width: 1280, height: 900 });
    await sleep(500);
  }
}

async function processMenu(browser, menuName, photos) {
  console.log(`\n========== ${menuName} ==========`);
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  try {
    await loginIfNeeded(page);
    await uploadPhotos(page, photos);

    // Step 1: Detect columns
    await clickButtonAndWait(page, 'Detect columns');
    await sleep(5000);

    // Step 2: Infer structure
    await clickButtonAndWait(page, 'Infer structure');
    await sleep(3000);

    // Read fold result
    const foldInfo = await readFoldResult(page);
    console.log(`  Fold: ${foldInfo}`);

    // Check against expected
    const expected = EXPECTED[menuName];
    if (expected?.fold) {
      const foldMatch = foldInfo?.toLowerCase().includes(expected.fold);
      console.log(`  Expected fold: ${expected.fold} → ${foldMatch ? '✓ PASS' : '✗ FAIL'}`);
    }

    // Step 3: Extract items
    await clickButtonAndWait(page, 'Extract items', 180000);
    await sleep(3000);

    // Read DOM metrics of the digital twin
    const metrics = await readDOMMetrics(page);

    // Report
    console.log(`  Twin rendered: ${metrics.pages.length} page(s)`);
    for (const pg of metrics.pages) {
      const status = pg.overflows ? `✗ OVERFLOWS by ${pg.overflowAmount}px` : '✓ fits';
      console.log(`    Page ${pg.index}: ${pg.width}×${pg.height}px, font: ${pg.computedFontSize}, ${pg.columnCount} cols, ${status}`);
      for (const col of pg.columns) {
        console.log(`      Col ${col.index}: ${col.width}×${col.height}px, ${col.rowCount} rows, ${col.textboxCount} textboxes [${col.headers.join(', ')}]`);
      }
    }

    if (metrics.errors.length > 0) {
      console.log(`  Errors: ${metrics.errors.join(', ')}`);
    }

    // Timestamp for file names
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    // Take screenshot of the digital twin
    const screenshotPath = path.join(CACHE_DIR, `${menuName}_twin_${ts}.png`);
    const twinEl = await page.$('.st-preview');
    if (twinEl) {
      await twinEl.screenshot({ path: screenshotPath });
      console.log(`  Screenshot → ${screenshotPath}`);
    }

    // Full page PDF
    const pdfPath = path.join(CACHE_DIR, `${menuName}_page_${ts}.pdf`);
    await page.pdf({
      path: pdfPath,
      printBackground: true,
      preferCSSPageSize: true,
      format: 'A4',
    });
    console.log(`  Full PDF → ${pdfPath}`);

    // Twin-only PDF: hide everything except the twin preview, then export
    const twinPdfPath = path.join(CACHE_DIR, `${menuName}_twin_${ts}.pdf`);
    await page.evaluate(() => {
      // Hide all sections except the twin
      document.querySelectorAll('.scan-section, .scan-header').forEach(el => {
        if (!el.querySelector('.st-preview')) el.style.display = 'none';
      });
      // Also hide the config bar and fold info for clean export
      const configBar = document.querySelector('.twin-config');
      if (configBar) configBar.style.display = 'none';
    });
    await sleep(500);
    await page.pdf({
      path: twinPdfPath,
      printBackground: true,
      preferCSSPageSize: true,
      format: 'A4',
    });
    // Restore visibility
    await page.evaluate(() => {
      document.querySelectorAll('.scan-section, .scan-header').forEach(el => el.style.display = '');
      const configBar = document.querySelector('.twin-config');
      if (configBar) configBar.style.display = '';
    });
    console.log(`  Twin PDF → ${twinPdfPath}`);

    // Clean vector PDF (for Canva import)
    await exportCleanPDF(browser, page, menuName, ts);

    // Cache results
    const cacheFile = path.join(CACHE_DIR, `${menuName}.json`);
    fs.writeFileSync(cacheFile, JSON.stringify({ menuName, photos, foldInfo, metrics, timestamp: new Date().toISOString() }, null, 2));
    console.log(`  Cached → ${cacheFile}`);

    return { menuName, foldInfo, metrics };
  } catch (err) {
    console.error(`  ERROR: ${err.message}`);
    return { menuName, error: err.message };
  } finally {
    await page.close();
  }
}

async function main() {
  // Ensure cache dir exists
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

  const args = process.argv.slice(2);
  const fresh = args.includes('--fresh');
  const renderOnly = args.includes('--render'); // re-render from cache without re-extracting
  const menuFilter = args.find(a => !a.startsWith('--'))?.toUpperCase();

  const menusToProcess = menuFilter
    ? { [menuFilter]: MENUS[menuFilter] }
    : MENUS;

  if (menuFilter && !MENUS[menuFilter]) {
    console.error(`Unknown menu: ${menuFilter}. Available: ${Object.keys(MENUS).join(', ')}`);
    process.exit(1);
  }

  console.log(`Processing ${Object.keys(menusToProcess).length} menu(s)... ${fresh ? '(fresh — ignoring cache)' : '(using cache if available)'}`);
  console.log(`Photos dir: ${PHOTOS_DIR}`);
  console.log(`App: ${BASE_URL}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const results = [];
  for (const [name, photos] of Object.entries(menusToProcess)) {
    const cacheFile = path.join(CACHE_DIR, `${name}.json`);

    // Check cache
    if (!fresh && fs.existsSync(cacheFile)) {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
      console.log(`\n========== ${name} (CACHED from ${cached.timestamp}) ==========`);
      console.log(`  Fold: ${cached.foldInfo}`);
      const expected = EXPECTED[name];
      if (expected?.fold) {
        const foldMatch = cached.foldInfo?.toLowerCase().includes(expected.fold);
        console.log(`  Expected fold: ${expected.fold} → ${foldMatch ? '✓ PASS' : '✗ FAIL'}`);
      }
      if (cached.metrics?.pages) {
        console.log(`  Twin rendered: ${cached.metrics.pages.length} page(s)`);
        for (const pg of cached.metrics.pages) {
          const status = pg.overflows ? `✗ OVERFLOWS by ${pg.overflowAmount}px` : '✓ fits';
          console.log(`    Page ${pg.index}: ${pg.width}×${pg.height}px, font: ${pg.computedFontSize}, ${pg.columnCount} cols, ${status}`);
        }
      }
      results.push(cached);
      continue;
    }

    const result = await processMenu(browser, name, photos);
    results.push(result);
  }

  await browser.close();

  // Summary
  console.log('\n========== SUMMARY ==========');
  for (const r of results) {
    if (r.error) {
      console.log(`  ${r.menuName}: ERROR — ${r.error}`);
    } else {
      const overflows = r.metrics?.pages?.some(p => p.overflows);
      const pageCount = r.metrics?.pages?.length || 0;
      console.log(`  ${r.menuName}: ${r.foldInfo?.split('·')[0]?.trim() || '?'} — ${pageCount} pages — ${overflows ? '✗ OVERFLOWS' : '✓ fits'}`);
    }
  }
}

main().catch(console.error);
