// Test script: full pipeline for Lovanium menu → save-twin → load-twin
// Usage: node scripts/test-save-twin.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:3007';
const PHOTOS_DIR = 'C:/Users/migue/OneDrive/Documents/FOODBASE/WILLY_TIALGO/WILLY/MENU_PHOTOS';

// We need a session cookie — login first
let cookie = '';

async function req(method, endpoint, body, isFormData) {
  const url = `${BASE}${endpoint}`;
  const headers = { cookie };
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const opts = { method, headers };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);

  const res = await fetch(url, opts);

  // Capture set-cookie from login
  const setCookie = res.headers.getSetCookie?.() || [];
  for (const c of setCookie) {
    const part = c.split(';')[0];
    cookie = cookie ? `${cookie}; ${part}` : part;
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${endpoint} → ${res.status}: ${text}`);
  }
  return res.json();
}

async function uploadImage(filePath) {
  const formData = new FormData();
  const buffer = fs.readFileSync(filePath);
  const blob = new Blob([buffer], { type: 'image/jpeg' });
  formData.append('image', blob, path.basename(filePath));
  return req('POST', '/api/scan/upload', formData, true);
}

async function main() {
  console.log('=== Lovanium Twin Save/Load Test ===\n');

  // 1. Login
  console.log('1. Logging in...');
  await req('POST', '/api/login', { email: 'heverlee@colruyt.be', password: 'Colruyt2026!' });
  console.log('   Logged in');

  // Verify auth
  try {
    const user = await req('GET', '/api/user');
    console.log('   Session OK:', user.email || user.name || 'authenticated');
  } catch (e) {
    console.error('   Auth check failed:', e.message);
    process.exit(1);
  }

  // 2. Upload both photos
  console.log('\n2. Uploading photos...');
  const photoX = path.join(PHOTOS_DIR, 'LOVANIUM_X.jpeg');
  const photoY = path.join(PHOTOS_DIR, 'LOVANIUM_Y.jpeg');

  if (!fs.existsSync(photoX) || !fs.existsSync(photoY)) {
    console.error('   Photos not found at', PHOTOS_DIR);
    process.exit(1);
  }

  const uploadX = await uploadImage(photoX);
  console.log('   Uploaded X:', uploadX.imageId);
  const uploadY = await uploadImage(photoY);
  console.log('   Uploaded Y:', uploadY.imageId);

  // 3. Detect columns per image (Google Vision)
  console.log('\n3. Detecting columns...');
  const pages = [];

  for (let idx = 0; idx < 2; idx++) {
    const upload = idx === 0 ? uploadX : uploadY;
    const fileName = idx === 0 ? 'LOVANIUM_X.jpeg' : 'LOVANIUM_Y.jpeg';
    console.log(`   Detecting columns for ${fileName}...`);

    const data = await req('POST', '/api/scan/detect-columns-vision', {
      imageUrl: upload.imageUrl,
    });

    pages.push({
      pageIndex: idx,
      imageUrl: data.cropped_url || upload.imageUrl,
      fileName,
      columns: data.columns || [],
      gutterDetails: data.gutter_details,
      imageSize: data.image_size,
      medianWordHeight: data.median_word_height,
      lineHeightRatio: data.line_height_ratio,
    });

    console.log(`   ${fileName}: ${(data.columns || []).length} columns, ${(data.gutter_details || []).length} gutters`);
  }

  // 4. Infer fold
  console.log('\n4. Inferring fold...');
  const foldResult = await req('POST', '/api/scan/infer-fold', {
    pages: pages.map(p => ({
      fileName: p.fileName,
      columns: (p.columns || []).map(c => ({
        column: c.column,
        x_start: c.x_start,
        x_end: c.x_end,
        type: c.type || 'content',
        priceCount: c.priceCount || 0,
        headerCount: c.headerCount || 0,
        wordCount: c.wordCount || 0,
      })),
      gutterDetails: p.gutterDetails,
    })),
  });
  console.log('   Fold type:', foldResult.foldType);

  // 5. Vision extract per page
  console.log('\n5. Running vision extract per page...');
  const allPanels = [];
  const allItems = [];
  let globalColIdx = 0;
  let counter = 1;

  for (const page of pages) {
    console.log(`   Extracting page ${page.pageIndex} (${page.fileName})...`);
    const extractResult = await req('POST', '/api/scan/vision-extract', {
      imageUrl: page.imageUrl,
      splitLines: page.gutterDetails || [],
    });

    const pageColumns = (extractResult.panel?.columns || []).map(col => ({
      ...col,
      pageIndex: page.pageIndex,
      globalColumn: ++globalColIdx,
    }));
    allPanels.push({ ...extractResult, panel: { ...extractResult.panel, columns: pageColumns }, pageIndex: page.pageIndex });

    for (const col of pageColumns) {
      for (const tb of (col.textboxes || [])) {
        for (const dr of (tb.display_rows || [])) {
          for (const item of (dr.items || [])) {
            allItems.push({
              ...item,
              item_count: counter++,
              category_name: tb.header || 'Unknown',
              column: col.globalColumn,
              page: page.pageIndex + 1,
              row_type: dr.row_type,
            });
          }
        }
      }
    }

    const tbCount = pageColumns.reduce((s, c) => s + c.textboxes.length, 0);
    const drCount = pageColumns.reduce((s, c) => s + c.textboxes.reduce((s2, tb) => s2 + (tb.display_rows?.length || 0), 0), 0);
    console.log(`   Page ${page.pageIndex}: ${pageColumns.length} columns, ${tbCount} textboxes, ${drCount} display rows`);
  }

  // Merge into visionExtractResult
  const mergedColumns = allPanels.flatMap(p => p.panel?.columns || []);
  const mergedStyling = allPanels[0]?.styling || {};
  const totalTextboxes = mergedColumns.reduce((s, c) => s + c.textboxes.length, 0);
  const totalRows = mergedColumns.reduce((s, c) => s + c.textboxes.reduce((s2, tb) => s2 + (tb.display_rows?.length || 0), 0), 0);

  const rowTypeCounts = {};
  for (const col of mergedColumns) {
    for (const tb of col.textboxes) {
      for (const dr of (tb.display_rows || [])) {
        rowTypeCounts[dr.row_type] = (rowTypeCounts[dr.row_type] || 0) + 1;
      }
    }
  }

  const visionExtractResult = {
    panel: { columns: mergedColumns, column_count: mergedColumns.length },
    styling: mergedStyling,
    total_textboxes: totalTextboxes,
    total_display_rows: totalRows,
    total_items: allItems.length,
    row_type_counts: rowTypeCounts,
    fold_type: foldResult.foldType || 'a4-portrait',
  };

  console.log(`\n   MERGED: ${mergedColumns.length} columns, ${totalTextboxes} textboxes, ${totalRows} display rows, ${allItems.length} items`);
  console.log('   Row types:', rowTypeCounts);

  // 6. Save twin
  console.log('\n6. Saving twin...');
  const saveTwinResult = await req('POST', '/api/scan/save-twin', {
    placeId: 'ChIJ_LOVANIUM_TEST',
    location: { name: 'Lovanium', formatted_address: 'Leuven, Belgium' },
    visionExtractResult,
    styling: mergedStyling,
    foldType: visionExtractResult.fold_type,
  });
  console.log('   Save result:', saveTwinResult);

  // 7. Load twin back
  console.log('\n7. Loading twin from DB...');
  const assortmentId = saveTwinResult.assortmentId;
  if (assortmentId) {
    const loadResult = await req('GET', `/api/scan/load-twin/${assortmentId}`);
    console.log('   Loaded twin:');
    console.log(`   Columns: ${loadResult.panel?.column_count}`);
    console.log(`   Textboxes: ${loadResult.total_textboxes}`);
    console.log(`   Display rows: ${loadResult.total_display_rows}`);
    console.log(`   Items: ${loadResult.total_items}`);
    console.log(`   Fold type: ${loadResult.fold_type}`);
    console.log(`   Styling bg_color: ${loadResult.styling?.bg_color}`);

    // Verify round-trip
    const match = loadResult.total_items === saveTwinResult.totalItems;
    console.log(`\n   Round-trip check: ${match ? 'PASS' : 'FAIL'} (saved ${saveTwinResult.totalItems}, loaded ${loadResult.total_items})`);

    // Show first textbox detail
    const firstCol = loadResult.panel?.columns?.[0];
    const firstTb = firstCol?.textboxes?.[0];
    if (firstTb) {
      console.log(`\n   Sample: first textbox header = "${firstTb.header}", ${firstTb.display_rows?.length} rows`);
      const firstRow = firstTb.display_rows?.[0];
      if (firstRow) {
        console.log(`   First row type: ${firstRow.row_type}, items: ${firstRow.items?.length}`);
        if (firstRow.items?.[0]) {
          const it = firstRow.items[0];
          console.log(`   First item: "${it.product_name}" @ ${it.product_price ? (it.product_price / 100).toFixed(2) + '€' : 'no price'}`);
        }
      }
    }
  } else {
    console.log('   No assortmentId returned from save-twin');
  }

  console.log('\n=== Test complete! ===');
  console.log(`Sections: ${saveTwinResult.totalSections}`);
  console.log(`Display rows: ${saveTwinResult.totalRows}`);
  console.log(`Items: ${saveTwinResult.totalItems}`);
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
