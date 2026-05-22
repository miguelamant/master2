// Export the saved Lovanium twin from DB as a PDF
// Usage: node scripts/export-twin-pdf.mjs

import puppeteer from 'puppeteer';

async function main() {
  // 1. Fetch twin data
  console.log('Fetching twin data...');
  let cookie = '';
  let r = await fetch('http://localhost:3007/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'heverlee@colruyt.be', password: 'Colruyt2026!' }),
  });
  for (const c of (r.headers.getSetCookie?.() || [])) {
    cookie = cookie ? cookie + '; ' + c.split(';')[0] : c.split(';')[0];
  }

  r = await fetch('http://localhost:3007/api/scan/load-twin/6712', { headers: { cookie } });
  const twin = await r.json();
  const s = twin.styling || {};
  console.log(`Loaded: ${twin.total_items} items, ${twin.total_textboxes} sections`);

  // 2. Build HTML — two A5 pages side by side (front and back of an a5-portrait menu)
  // Group columns into pages: columns 0-1 = page 1 (front), columns 2-3 = page 2 (back)
  const columns = twin.panel?.columns || [];
  const page1Cols = columns.slice(0, 2);
  const page2Cols = columns.slice(2, 4);

  function renderColumn(col) {
    let html = '';
    for (const tb of (col.textboxes || [])) {
      let rowsHtml = '';
      for (const dr of (tb.display_rows || [])) {
        if (dr.row_type === 'note') {
          const text = dr.text_content || dr.items?.[0]?.product_name || '';
          if (text) rowsHtml += `<div class="row note"><span class="name">${text}</span></div>`;
          continue;
        }
        if (dr.row_type === 'supplement') {
          for (const item of (dr.items || [])) {
            const price = item.product_price != null ? `€${(item.product_price / 100).toFixed(2).replace('.', ',')}` : '';
            rowsHtml += `<div class="row supplement"><span class="name">+ ${item.product_name || ''}</span><span class="dots"></span><span class="price">${price}</span></div>`;
          }
          continue;
        }
        if (dr.row_type === 'price_variants') {
          // Show items inline with their volumes
          const parts = (dr.items || []).map(item => {
            const price = item.product_price != null ? `€${(item.product_price / 100).toFixed(2).replace('.', ',')}` : '';
            const name = item.product_name || '';
            return `<span class="pv-item">${name} <b>${price}</b></span>`;
          });
          rowsHtml += `<div class="row price-variants">${parts.join('<span class="pv-sep"> · </span>')}</div>`;
          continue;
        }
        if (dr.row_type === 'brand_variants') {
          if (dr.brand_name) {
            rowsHtml += `<div class="row brand-header"><span class="name">${dr.brand_name}</span></div>`;
          }
          for (const item of (dr.items || [])) {
            const price = item.product_price != null ? `€${(item.product_price / 100).toFixed(2).replace('.', ',')}` : '';
            rowsHtml += `<div class="row brand-variant"><span class="name">${item.product_name || ''}</span><span class="dots"></span><span class="price">${price}</span></div>`;
          }
          continue;
        }
        if (dr.row_type === 'multi_inline') {
          const parts = (dr.items || []).map(item => {
            const price = item.product_price != null ? `€${(item.product_price / 100).toFixed(2).replace('.', ',')}` : '';
            return `${item.product_name || ''} ${price}`;
          });
          rowsHtml += `<div class="row multi-inline"><span class="name">${parts.join(dr.separator || ' — ')}</span></div>`;
          continue;
        }
        // single / single_described
        for (const item of (dr.items || [])) {
          const price = item.product_price != null ? `€${(item.product_price / 100).toFixed(2).replace('.', ',')}` : '';
          const name = item.product_name || '';
          rowsHtml += `<div class="row single"><span class="name">${name}</span><span class="dots"></span><span class="price">${price}</span></div>`;
          if (dr.row_type === 'single_described' && dr.description) {
            rowsHtml += `<div class="row desc"><span class="name">${dr.description}</span></div>`;
          }
        }
      }
      html += `<div class="section">
        ${tb.header ? `<div class="header">${tb.header}</div>` : ''}
        ${rowsHtml}
      </div>`;
    }
    return html;
  }

  function renderPage(cols, pageLabel) {
    const left = cols[0] ? renderColumn(cols[0]) : '';
    const right = cols[1] ? renderColumn(cols[1]) : '';
    return `<div class="page">
      <div class="page-label">${pageLabel}</div>
      <div class="page-grid">
        <div class="col">${left}</div>
        <div class="col">${right}</div>
      </div>
    </div>`;
  }

  const html = `<!DOCTYPE html>
<html>
<head>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', sans-serif;
    background: #666;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    padding: 24px;
  }
  .page {
    background: ${s.bg_color || '#faf8f4'};
    color: ${s.text_color || '#1a1a1a'};
    width: 595px; /* A5 landscape ≈ A4/2 */
    min-height: 421px;
    padding: 28px 22px 22px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    position: relative;
  }
  .page-label {
    position: absolute;
    top: -20px;
    left: 0;
    font-size: 11px;
    color: #aaa;
    font-weight: 600;
  }
  .page-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .col { }
  .section { margin-bottom: 10px; }
  .header {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    color: ${s.header_color || '#0052a3'};
    margin-bottom: 2px;
    padding-bottom: 1px;
    border-bottom: 0.5px solid ${s.header_color || '#0052a3'}40;
    letter-spacing: 0.5px;
  }
  .row {
    display: flex;
    align-items: baseline;
    font-size: 8px;
    line-height: 1.55;
    gap: 2px;
  }
  .row .name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
  .row .dots { flex: 1; border-bottom: 0.5px dotted ${s.text_color || '#1a1a1a'}30; min-width: 6px; align-self: flex-end; margin-bottom: 2px; }
  .row .price { white-space: nowrap; font-weight: 600; }
  .row.note { font-style: italic; font-size: 7.5px; color: ${s.text_color || '#1a1a1a'}80; }
  .row.supplement .name { padding-left: 8px; font-size: 7.5px; color: ${s.text_color || '#1a1a1a'}90; }
  .row.desc .name { font-size: 7px; font-style: italic; color: ${s.text_color || '#1a1a1a'}70; padding-left: 4px; }
  .row.brand-header .name { font-weight: 600; font-size: 8.5px; }
  .row.brand-variant .name { padding-left: 8px; }
  .row.price-variants { flex-wrap: wrap; gap: 4px; }
  .pv-item { white-space: nowrap; }
  .pv-item b { font-weight: 600; }
  .pv-sep { color: ${s.text_color || '#1a1a1a'}40; }
  .row.multi-inline .name { font-size: 7.5px; white-space: normal; max-width: 100%; }
</style>
</head>
<body>
  ${renderPage(page1Cols, 'FRONT')}
  ${renderPage(page2Cols, 'BACK')}
</body>
</html>`;

  // 3. Render with Puppeteer and export PDF
  console.log('Rendering...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const pg = await browser.newPage();
  await pg.setViewport({ width: 700, height: 1000 });
  await pg.setContent(html, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  // Screenshot (PNG)
  const bodyH = await pg.evaluate(() => document.body.scrollHeight);
  await pg.setViewport({ width: 700, height: bodyH + 50 });
  await new Promise(r => setTimeout(r, 500));
  await pg.screenshot({ path: '.test-cache/LOVANIUM_twin_from_db.png', fullPage: true });
  console.log('Saved PNG: .test-cache/LOVANIUM_twin_from_db.png');

  // PDF
  await pg.pdf({
    path: '.test-cache/LOVANIUM_twin_from_db.pdf',
    width: '700px',
    height: `${bodyH + 50}px`,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  console.log('Saved PDF: .test-cache/LOVANIUM_twin_from_db.pdf');

  await browser.close();
  console.log('Done!');
}

main().catch(e => { console.error(e); process.exit(1); });
