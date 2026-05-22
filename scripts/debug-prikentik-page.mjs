// scripts/debug-prikentik-page.mjs
// Dumps the rendered HTML and __NEXT_DATA__ of one prik&tik product page.
// Usage: node scripts/debug-prikentik-page.mjs

import puppeteer from "puppeteer";
import fs from "fs";

const URL = "https://www.prikentik.be/bersalis-tripel-fles-33cl";

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36");

console.log(`Fetching ${URL} with networkidle2...`);
await page.goto(URL, { waitUntil: "networkidle2", timeout: 30000 });

// Dump all text that contains a price-like pattern
const priceHints = await page.evaluate(() => {
  const results = [];
  const allEls = document.querySelectorAll("*");
  for (const el of allEls) {
    const text = el.childNodes.length === 1 && el.childNodes[0].nodeType === 3
      ? el.textContent.trim()
      : "";
    if (/€\s?\d|^\d+[,\.]\d{2}$/.test(text)) {
      results.push({ tag: el.tagName, class: el.className, id: el.id, text });
    }
  }
  return results;
});

console.log("\n=== Elements containing prices ===");
console.log(JSON.stringify(priceHints, null, 2));

// Dump __NEXT_DATA__ if present
const nextData = await page.evaluate(() => {
  const el = document.getElementById("__NEXT_DATA__");
  return el ? el.textContent : null;
});

if (nextData) {
  console.log("\n=== __NEXT_DATA__ found, saving to debug-next-data.json ===");
  fs.writeFileSync("debug-next-data.json", nextData);
  // Print top-level keys
  const parsed = JSON.parse(nextData);
  console.log("Top-level keys:", Object.keys(parsed));
  const pageProps = parsed?.props?.pageProps;
  if (pageProps) console.log("pageProps keys:", Object.keys(pageProps));
} else {
  console.log("\nNo __NEXT_DATA__ found.");
}

// Also dump JSON-LD
const jsonLds = await page.evaluate(() => {
  return [...document.querySelectorAll('script[type="application/ld+json"]')]
    .map(s => s.textContent);
});
console.log("\n=== JSON-LD scripts ===");
jsonLds.forEach((s, i) => console.log(`[${i}]`, s.substring(0, 500)));

await browser.close();
