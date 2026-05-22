// Full pipeline: upload → detect → extract → save → load → export PDF
// Usage: node scripts/run-full-twin.mjs SCHUUR

import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const BASE = 'http://localhost:3007';
const PHOTOS_DIR = 'C:/Users/migue/OneDrive/Documents/FOODBASE/WILLY_TIALGO/WILLY/MENU_PHOTOS';
const menuName = process.argv[2] || 'SCHUUR';

let cookie = '';
async function req(method, endpoint, body, isFormData) {
  const headers = { cookie };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  const opts = { method, headers };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);
  const res = await fetch(`${BASE}${endpoint}`, opts);
  for (const c of (res.headers.getSetCookie?.() || [])) {
    const part = c.split(';')[0];
    cookie = cookie ? `${cookie}; ${part}` : part;
  }
  if (!res.ok) throw new Error(`${method} ${endpoint} → ${res.status}: ${await res.text()}`);
  return res.json();
}

async function uploadImage(filePath) {
  const formData = new FormData();
  const buffer = fs.readFileSync(filePath);
  formData.append('image', new Blob([buffer], { type: 'image/jpeg' }), path.basename(filePath));
  return req('POST', '/api/scan/upload', formData, true);
}

async function main() {
  console.log(`=== ${menuName} Full Twin Pipeline ===\n`);

  // Find photos
  const files = fs.readdirSync(PHOTOS_DIR).filter(f => f.startsWith(menuName) && f.endsWith('.jpeg'));
  if (!files.length) { console.error('No photos found for', menuName); process.exit(1); }
  console.log(`Photos: ${files.join(', ')}`);

  // Login
  await req('POST', '/api/login', { email: 'heverlee@colruyt.be', password: 'Colruyt2026!' });
  console.log('Logged in\n');

  // Upload
  console.log('1. Uploading...');
  const uploads = [];
  for (const f of files) {
    const data = await uploadImage(path.join(PHOTOS_DIR, f));
    uploads.push({ ...data, fileName: f });
    console.log(`   ${f} → ${data.imageId}`);
  }

  // Detect columns per image
  console.log('\n2. Detecting columns...');
  const pages = [];
  for (let i = 0; i < uploads.length; i++) {
    const data = await req('POST', '/api/scan/detect-columns-vision', { imageUrl: uploads[i].imageUrl });
    pages.push({
      pageIndex: i,
      imageUrl: data.cropped_url || uploads[i].imageUrl,
      fileName: uploads[i].fileName,
      columns: data.columns || [],
      gutterDetails: data.gutter_details,
      imageSize: data.image_size,
      medianWordHeight: data.median_word_height,
      lineHeightRatio: data.line_height_ratio,
    });
    console.log(`   ${uploads[i].fileName}: ${(data.columns || []).length} cols, ${(data.gutter_details || []).length} gutters`);
  }

  // Infer fold
  console.log('\n3. Inferring fold...');
  const foldResult = await req('POST', '/api/scan/infer-fold', {
    pages: pages.map(p => ({
      fileName: p.fileName,
      columns: (p.columns || []).map(c => ({ column: c.column, x_start: c.x_start, x_end: c.x_end, type: c.type || 'content', priceCount: c.priceCount || 0, headerCount: c.headerCount || 0, wordCount: c.wordCount || 0 })),
      gutterDetails: p.gutterDetails,
    })),
  });
  const foldType = foldResult.foldType || 'a4-portrait';
  console.log(`   Fold: ${foldType}`);

  // Vision extract per page
  console.log('\n4. Vision extract...');
  const allPanels = [];
  let globalColIdx = 0;

  for (const page of pages) {
    console.log(`   ${page.fileName}...`);
    const data = await req('POST', '/api/scan/vision-extract', {
      imageUrl: page.imageUrl,
      splitLines: page.gutterDetails || [],
    });
    const pageCols = (data.panel?.columns || []).map(col => ({
      ...col, pageIndex: page.pageIndex, globalColumn: ++globalColIdx,
    }));
    allPanels.push({ ...data, panel: { ...data.panel, columns: pageCols } });
    const tbCount = pageCols.reduce((s, c) => s + c.textboxes.length, 0);
    const drCount = pageCols.reduce((s, c) => s + c.textboxes.reduce((s2, tb) => s2 + (tb.display_rows?.length || 0), 0), 0);
    const itemCount = pageCols.reduce((s, c) => s + c.textboxes.reduce((s2, tb) => s2 + tb.display_rows.reduce((s3, dr) => s3 + (dr.items?.length || 0), 0), 0), 0);
    console.log(`   → ${pageCols.length} cols, ${tbCount} textboxes, ${drCount} rows, ${itemCount} items`);
  }

  // Merge
  const mergedColumns = allPanels.flatMap(p => p.panel?.columns || []);
  const mergedStyling = allPanels[0]?.styling || {};
  const totalTb = mergedColumns.reduce((s, c) => s + c.textboxes.length, 0);
  const totalDr = mergedColumns.reduce((s, c) => s + c.textboxes.reduce((s2, tb) => s2 + (tb.display_rows?.length || 0), 0), 0);
  const totalItems = mergedColumns.reduce((s, c) => s + c.textboxes.reduce((s2, tb) => s2 + tb.display_rows.reduce((s3, dr) => s3 + (dr.items?.length || 0), 0), 0), 0);
  const rowTypeCounts = {};
  for (const c of mergedColumns) for (const tb of c.textboxes) for (const dr of (tb.display_rows || [])) rowTypeCounts[dr.row_type] = (rowTypeCounts[dr.row_type] || 0) + 1;

  const visionExtractResult = {
    panel: { columns: mergedColumns, column_count: mergedColumns.length },
    styling: mergedStyling, total_textboxes: totalTb, total_display_rows: totalDr, total_items: totalItems,
    row_type_counts: rowTypeCounts, fold_type: foldType,
  };
  console.log(`\n   TOTAL: ${mergedColumns.length} cols, ${totalTb} textboxes, ${totalDr} rows, ${totalItems} items`);
  console.log('   Row types:', rowTypeCounts);

  // Save twin
  console.log('\n5. Saving twin...');
  const placeId = `ChIJ_${menuName}_TEST`;
  const saveResult = await req('POST', '/api/scan/save-twin', {
    placeId, location: { name: menuName, formatted_address: 'Belgium' },
    visionExtractResult, styling: mergedStyling, foldType,
  });
  console.log(`   Saved: ${saveResult.totalSections} sections, ${saveResult.totalRows} rows, ${saveResult.totalItems} items`);

  // Load twin back
  console.log('\n6. Loading twin from DB...');
  const twin = await req('GET', `/api/scan/load-twin/${saveResult.assortmentId}`);
  console.log(`   Loaded: ${twin.total_items} items, ${twin.total_textboxes} sections`);
  console.log(`   Round-trip: ${twin.total_items === saveResult.totalItems ? 'PASS' : 'FAIL'}`);

  // Export PDF
  console.log('\n7. Exporting PDF...');
  const s = twin.styling || {};
  const columns = twin.panel?.columns || [];
  const colsPerPage = 2;
  const pageGroups = [];
  for (let i = 0; i < columns.length; i += colsPerPage) {
    pageGroups.push(columns.slice(i, i + colsPerPage));
  }

  function renderColumn(col) {
    let html = '';
    for (const tb of (col.textboxes || [])) {
      let rows = '';
      for (const dr of (tb.display_rows || [])) {
        if (dr.row_type === 'note') {
          const t = dr.text_content || dr.items?.[0]?.product_name || '';
          if (t) rows += `<div class="row note"><span class="name">${t}</span></div>`;
          continue;
        }
        if (dr.row_type === 'supplement') {
          for (const it of (dr.items || [])) {
            const p = it.product_price != null ? `€${(it.product_price/100).toFixed(2).replace('.',',')}` : '';
            rows += `<div class="row supplement"><span class="name">+ ${it.product_name||''}</span><span class="dots"></span><span class="price">${p}</span></div>`;
          }
          continue;
        }
        if (dr.row_type === 'price_variants') {
          const parts = (dr.items||[]).map(it => {
            const p = it.product_price != null ? `€${(it.product_price/100).toFixed(2).replace('.',',')}` : '';
            return `<span class="pv-item">${it.product_name||''} <b>${p}</b></span>`;
          });
          rows += `<div class="row price-variants">${parts.join('<span class="pv-sep"> · </span>')}</div>`;
          continue;
        }
        if (dr.row_type === 'brand_variants') {
          if (dr.brand_name) rows += `<div class="row brand-header"><span class="name">${dr.brand_name}</span></div>`;
          for (const it of (dr.items||[])) {
            const p = it.product_price != null ? `€${(it.product_price/100).toFixed(2).replace('.',',')}` : '';
            rows += `<div class="row brand-variant"><span class="name">${it.product_name||''}</span><span class="dots"></span><span class="price">${p}</span></div>`;
          }
          continue;
        }
        if (dr.row_type === 'multi_inline') {
          const parts = (dr.items||[]).map(it => {
            const p = it.product_price != null ? `€${(it.product_price/100).toFixed(2).replace('.',',')}` : '';
            return `${it.product_name||''} ${p}`;
          });
          rows += `<div class="row multi-inline"><span class="name">${parts.join(dr.separator||' — ')}</span></div>`;
          continue;
        }
        for (const it of (dr.items||[])) {
          const p = it.product_price != null ? `€${(it.product_price/100).toFixed(2).replace('.',',')}` : '';
          rows += `<div class="row single"><span class="name">${it.product_name||''}</span><span class="dots"></span><span class="price">${p}</span></div>`;
          if (dr.row_type === 'single_described' && dr.description) {
            rows += `<div class="row desc"><span class="name">${dr.description}</span></div>`;
          }
        }
      }
      html += `<div class="section">${tb.header ? `<div class="header">${tb.header}</div>` : ''}${rows}</div>`;
    }
    return html;
  }

  let pagesHtml = '';
  pageGroups.forEach((group, i) => {
    const label = pageGroups.length === 1 ? '' : (i === 0 ? 'FRONT' : 'BACK');
    const cols = group.map(c => `<div class="col">${renderColumn(c)}</div>`).join('');
    pagesHtml += `<div class="page"><div class="page-label">${label}</div><div class="page-grid" style="grid-template-columns: repeat(${group.length}, 1fr)">${cols}</div></div>`;
  });

  const exportHtml = `<!DOCTYPE html><html><head><style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter',sans-serif; background:#666; display:flex; flex-direction:column; align-items:center; gap:24px; padding:24px; }
    .page { background:${s.bg_color||'#faf8f4'}; color:${s.text_color||'#1a1a1a'}; width:595px; padding:28px 22px 22px; box-shadow:0 4px 20px rgba(0,0,0,0.4); position:relative; }
    .page-label { position:absolute; top:-20px; left:0; font-size:11px; color:#aaa; font-weight:600; }
    .page-grid { display:grid; gap:20px; }
    .section { margin-bottom:10px; }
    .header { font-size:10px; font-weight:700; text-transform:uppercase; color:${s.header_color||'#c4a96a'}; margin-bottom:2px; padding-bottom:1px; border-bottom:0.5px solid ${s.header_color||'#c4a96a'}40; letter-spacing:0.5px; }
    .row { display:flex; align-items:baseline; font-size:8px; line-height:1.55; gap:2px; }
    .row .name { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:200px; }
    .row .dots { flex:1; border-bottom:0.5px dotted ${s.text_color||'#1a1a1a'}30; min-width:6px; align-self:flex-end; margin-bottom:2px; }
    .row .price { white-space:nowrap; font-weight:600; }
    .row.note { font-style:italic; font-size:7.5px; color:${s.text_color||'#1a1a1a'}80; }
    .row.supplement .name { padding-left:8px; font-size:7.5px; }
    .row.desc .name { font-size:7px; font-style:italic; color:${s.text_color||'#1a1a1a'}70; padding-left:4px; }
    .row.brand-header .name { font-weight:600; font-size:8.5px; }
    .row.brand-variant .name { padding-left:8px; }
    .row.price-variants { flex-wrap:wrap; gap:4px; }
    .pv-item { white-space:nowrap; } .pv-item b { font-weight:600; }
    .pv-sep { color:${s.text_color||'#1a1a1a'}40; }
    .row.multi-inline .name { font-size:7.5px; white-space:normal; max-width:100%; }
  </style></head><body>${pagesHtml}</body></html>`;

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const pg = await browser.newPage();
  await pg.setViewport({ width: 700, height: 1000 });
  await pg.setContent(exportHtml, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  const bodyH = await pg.evaluate(() => document.body.scrollHeight);
  await pg.setViewport({ width: 700, height: bodyH + 50 });
  await new Promise(r => setTimeout(r, 500));

  const pngPath = `.test-cache/${menuName}_twin_from_db.png`;
  const pdfPath = `.test-cache/${menuName}_twin_from_db.pdf`;
  await pg.screenshot({ path: pngPath, fullPage: true });
  await pg.pdf({ path: pdfPath, width: '700px', height: `${bodyH + 50}px`, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  await browser.close();

  console.log(`   PNG: ${pngPath}`);
  console.log(`   PDF: ${pdfPath}`);
  console.log(`\n=== ${menuName} complete! ===`);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
