// Render the saved twin data as a visual preview and screenshot it
import puppeteer from 'puppeteer';

async function main() {
  // 1. Fetch twin data via API
  console.log('1. Fetching twin data from API...');
  let cookie = '';
  let r = await fetch('http://localhost:3007/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'heverlee@colruyt.be', password: 'Colruyt2026!' }),
  });
  const sc = r.headers.getSetCookie?.() || [];
  for (const c of sc) cookie = cookie ? cookie + '; ' + c.split(';')[0] : c.split(';')[0];

  r = await fetch('http://localhost:3007/api/scan/load-twin/6712', { headers: { cookie } });
  const twin = await r.json();
  console.log(`   Loaded: ${twin.total_items} items, ${twin.total_textboxes} sections, fold: ${twin.fold_type}`);

  // 2. Build an HTML page that renders the twin
  const s = twin.styling || {};
  let sectionsHtml = '';

  for (const col of (twin.panel?.columns || [])) {
    let colHtml = '';
    for (const tb of (col.textboxes || [])) {
      let rowsHtml = '';
      for (const dr of (tb.display_rows || [])) {
        if (dr.row_type === 'note' && dr.text_content) {
          rowsHtml += `<div class="row note">${dr.text_content}</div>`;
          continue;
        }
        for (const item of (dr.items || [])) {
          const price = item.product_price != null ? `€${(item.product_price / 100).toFixed(2)}` : '';
          const name = item.product_name || '???';
          rowsHtml += `<div class="row ${dr.row_type}">
            <span class="name">${name}</span>
            <span class="dots"></span>
            <span class="price">${price}</span>
          </div>`;
        }
      }
      colHtml += `
        <div class="section">
          ${tb.header ? `<div class="header">${tb.header}</div>` : ''}
          ${rowsHtml}
        </div>`;
    }
    sectionsHtml += `<div class="column">${colHtml}</div>`;
  }

  const html = `<!DOCTYPE html>
<html>
<head>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: '${s.font_family || 'Inter'}', sans-serif; background: #888; display: flex; justify-content: center; padding: 20px; }
  .menu {
    background: ${s.bg_color || '#faf8f4'};
    color: ${s.text_color || '#14213d'};
    width: 800px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0;
    padding: 32px 24px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.3);
  }
  .page { display: grid; grid-template-columns: 1fr 1fr; gap: 0; width: 100%; }
  .page + .page { border-top: 2px dashed #ccc; padding-top: 24px; margin-top: 24px; }
  .column { padding: 0 16px; }
  .section { margin-bottom: 14px; }
  .header {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    color: ${s.header_color || '#c4a96a'};
    margin-bottom: 4px;
    padding-bottom: 2px;
    border-bottom: 1px solid ${s.header_color || '#c4a96a'}30;
  }
  .row {
    display: flex;
    align-items: baseline;
    font-size: 10.5px;
    line-height: 1.6;
    gap: 4px;
  }
  .row .name { white-space: nowrap; }
  .row .dots { flex: 1; border-bottom: 1px dotted ${s.text_color || '#14213d'}40; margin: 0 2px; min-width: 10px; align-self: flex-end; margin-bottom: 3px; }
  .row .price { white-space: nowrap; font-weight: 600; }
  .row.note { font-style: italic; font-size: 9.5px; color: ${s.text_color || '#14213d'}90; }
  .row.supplement .name { padding-left: 10px; font-size: 9.5px; }
  .title { grid-column: 1 / -1; text-align: center; font-size: 22px; font-weight: 700; color: ${s.header_color || '#c4a96a'}; margin-bottom: 16px; letter-spacing: 2px; }
</style>
</head>
<body>
  <div class="menu">
    <div class="title">LOVANIUM — Digital Twin (from DB)</div>
    ${sectionsHtml}
  </div>
</body>
</html>`;

  // 3. Render with Puppeteer
  console.log('2. Rendering...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 1200 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // Get full height
  const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewport({ width: 900, height: bodyHeight + 40 });
  await new Promise(r => setTimeout(r, 500));

  await page.screenshot({ path: '.test-cache/twin_from_db.png', fullPage: true });
  console.log('   Saved: .test-cache/twin_from_db.png');
  console.log(`   ${twin.total_items} items across ${twin.total_textboxes} sections`);

  await browser.close();
  console.log('\nDone!');
}

main().catch(e => { console.error(e); process.exit(1); });
