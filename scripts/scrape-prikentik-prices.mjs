// scripts/scrape-prikentik-prices.mjs
// Uses Tavily search API to find prik&tik prices for products, writes to Supabase.
//
// Usage:
//   node scripts/scrape-prikentik-prices.mjs            -- test: 20 products
//   node scripts/scrape-prikentik-prices.mjs --full     -- all products
//   node scripts/scrape-prikentik-prices.mjs --dry-run  -- no DB writes

import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import "dotenv/config";

const FULL    = process.argv.includes("--full");
const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT   = FULL ? Infinity : 30;
const DELAY_MS = 300;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } },
);

const SERPER_KEY = process.env.SERPER_API_KEY;
if (!SERPER_KEY) { console.error("Missing SERPER_API_KEY in .env"); process.exit(1); }

// ── Category-based fallback prices ────────────────────────────────────────────
const CATEGORY_FALLBACK = {
  COLA: 1.20, ICE_TEA: 1.20, LEMONADES: 1.30, GINGER_DRINKS: 1.50,
  TONICS: 1.80, JUICES_CONCENTRATE: 1.50, NFC: 2.00, VITAMIN_DRINKS: 1.80,
  KOMBUCHA: 2.50, SPORTDRINKS: 1.50, ENERGY_DRINKS: 1.80, WATER: 0.80,
  GRENADINE: 3.00, MILK_BASED: 1.50, MILKSHAKE: 2.50, YOGURT: 1.50,
  REFRESHING: 1.20, JELLY_DRINKS: 1.80,
  DARK_BROWN_MALT_SWEETNESS: 2.50, NORMAL_BLOND_AMBER: 1.80,
  BEERS_SPECIAL: 3.00, WHEAT_BEERS: 2.00, SOURS_SAISON_LAMBIC_GUEUZE: 3.50,
  BEERS_OTHER: 2.00, FRUIT_BEERS: 2.50, BLOND_BITTERS: 2.50, LAGERS: 1.50,
  DARK_BROWN_COFFEE_ROAST_BITTER: 2.50, RADLERS: 1.50, SMOOTHIE_SOUR: 3.00,
  TABLE_BEER: 1.00, SPIRIT_FLAVOURED_BEERS: 2.00,
  MEADS: 4.00, CIDERS: 2.50,
  MINCED: 4.50, BURGER: 5.00, SEAFOOD: 6.00, CRISPY_CHICKEN: 4.50,
  CHUNK_STICK: 4.00, RAGOUT_CROQUETTE: 3.50, CHEESE_CROQUETTE: 3.50,
  STUFFED_ROLLS: 4.00, SOFT_STICK: 3.50, BAMI_NASI: 4.50, OTHER: 4.00,
};

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ── Extract price from Tavily result content ───────────────────────────────────
function extractPrice(text) {
  if (!text) return null;
  const patterns = [
    /€\s*(\d+)[,\.](\d{2})\b/,
    /(\d+)[,\.](\d{2})\s*€/,
    /(\d+)[,\.](\d{2})\s*EUR/i,
    /EUR\s*(\d+)[,\.](\d{2})/i,
  ];
  const candidates = [];
  for (const re of patterns) {
    // Collect ALL price matches, not just the first
    for (const m of text.matchAll(new RegExp(re.source, re.flags + "g"))) {
      const val = parseFloat(`${m[1]}.${m[2]}`);
      // Plausible single-bottle price range: €0.50 – €25
      if (val >= 0.5 && val <= 25) candidates.push(val);
    }
  }
  if (candidates.length === 0) return null;
  // Return the most common price, or the lowest if all unique (avoids multipack prices)
  const freq = candidates.reduce((acc, v) => { acc[v] = (acc[v] || 0) + 1; return acc; }, {});
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  return parseFloat(sorted[0][0]);
}

// ── Serper shopping search for a product ──────────────────────────────────────
async function searchPrikentikPrice(slug, slugName) {
  const res = await axios.post(
    "https://google.serper.dev/shopping",
    { q: `${slugName} prikentik`, num: 5, gl: "be", hl: "nl" },
    {
      headers: { "X-API-KEY": SERPER_KEY, "Content-Type": "application/json" },
      timeout: 15000,
    },
  );

  const items = res.data?.shopping ?? [];

  // Prefer prik&tik results first, fall back to any Belgian retailer
  const prikentikItems = items.filter((r) => r.source?.toLowerCase().includes("prik") || r.link?.includes("prikentik"));
  const candidates = prikentikItems.length > 0 ? prikentikItems : items.slice(0, 3);

  for (const item of candidates) {
    // Price comes as a string like "€ 1,94" or "€1.94"
    const price = extractPrice(item.price ?? "") ?? extractPrice(`${item.price}`);
    if (price) return { price, source: item.source ?? "shopping" };
  }

  return null;
}

// ── Fetch sitemap product URLs ─────────────────────────────────────────────────
async function fetchSitemapUrls() {
  console.log("Fetching prik&tik sitemap...");
  const res = await axios.get("https://www.prikentik.be/sitemap.xml", {
    headers: { "User-Agent": "Mozilla/5.0" },
    timeout: 15000,
  });
  const urls = [...res.data.matchAll(/<loc>(https:\/\/www\.prikentik\.be\/[^<]+)<\/loc>/g)]
    .map((m) => m[1])
    .filter((u) => {
      const path = new URL(u).pathname.replace(/^\//, "");
      return (
        !path.includes("/") &&
        /-(fles|blik|brik|pak|can|bottle|keg|bib|bokaal|\d+cl|\d+ml|\d+l|liter)/.test(path)
      );
    });
  console.log(`Found ${urls.length} product URLs in sitemap`);
  return urls;
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Mode: ${FULL ? "FULL" : `TEST (${LIMIT})`} | Dry run: ${DRY_RUN}\n`);

  const dbProducts = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select("id_product, name, brand, id_subcategory")
      .range(from, from + 999);
    if (error) throw error;
    dbProducts.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  console.log(`Loaded ${dbProducts.length} products from DB`);

  const { data: subcats } = await supabase.from("subcategories").select("id_subcat, subcat_name");
  const subcatMap = Object.fromEntries(subcats.map((s) => [s.id_subcat, s.subcat_name]));

  // Build a normalised name index for fast matching
  const normalize = (s) => (s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

  const slugToName = (slug) =>
    slug
      .replace(/-(clip|fles|blik|brik|pak|can|bottle|keg|bib|bokaal).*$/i, "")
      .replace(/-\d+(\.\d+)?(cl|ml|l|liter|kg).*$/i, "")
      .replace(/-/g, " ").trim();

  // Extract quantity multiplier and per-unit volume from slug
  // e.g. "hapkin-4-x-33cl" → { qty: 4, volumeCl: 33 }
  // e.g. "coca-cola-pet-6-x-1-5l" → { qty: 6, volumeCl: 150 }
  // e.g. "duvel-fles-33cl" → { qty: 1, volumeCl: 33 }
  const slugToPackInfo = (slug) => {
    // Multipack: "4-x-33cl" or "6-x-1-5l" (prik&tik uses hyphens instead of dots)
    const multi = slug.match(/-(\d+)-x-(\d+(?:-\d+)?)(cl|ml|l)\b/i);
    if (multi) {
      const qty = parseInt(multi[1]);
      const rawVol = parseFloat(multi[2].replace("-", "."));
      const unit = multi[3].toLowerCase();
      const volumeCl = unit === "ml" ? rawVol / 10 : unit === "l" ? rawVol * 100 : rawVol;
      return { qty, volumeCl };
    }
    // Single: "fles-33cl" or "fles-1l"
    const single = slug.match(/-(\d+(?:-\d+)?)(cl|ml|l)\b/i);
    if (single) {
      const rawVol = parseFloat(single[1].replace("-", "."));
      const unit = single[2].toLowerCase();
      const volumeCl = unit === "ml" ? rawVol / 10 : unit === "l" ? rawVol * 100 : rawVol;
      return { qty: 1, volumeCl };
    }
    return { qty: 1, volumeCl: null };
  };

  function bestMatch(slugName) {
    const words = new Set(normalize(slugName).split(" ").filter((w) => w.length > 2));
    if (words.size === 0) return null;
    let best = null, bestScore = 0;
    for (const p of dbProducts) {
      const pWords = new Set(normalize(p.name).split(" ").filter((w) => w.length > 2));
      const shared = [...words].filter((w) => pWords.has(w)).length;
      const score = shared / Math.max(words.size, pWords.size);
      if (score > bestScore) { bestScore = score; best = p; }
    }
    return bestScore >= 0.6 ? { product: best, score: bestScore } : null;
  }

  const allUrls = await fetchSitemapUrls();
  // Shuffle so test mode samples across all categories, not just spirits at the top
  const shuffled = FULL ? allUrls : [...allUrls].sort(() => Math.random() - 0.5);
  const urls = shuffled.slice(0, LIMIT === Infinity ? allUrls.length : LIMIT);
  console.log(`Extracting prices for ${urls.length} URLs...\n`);

  const stats = { found: 0, noPrice: 0, noMatch: 0, error: 0 };
  const updates = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const slug = new URL(url).pathname.replace(/^\//, "");
    const slugName = slugToName(slug);
    const { qty, volumeCl } = slugToPackInfo(slug);
    process.stdout.write(`[${String(i + 1).padStart(4)}/${urls.length}] ${slug.substring(0, 48).padEnd(48)}`);

    try {
      const result = await searchPrikentikPrice(slug, slugName);
      await sleep(DELAY_MS);

      if (!result) {
        process.stdout.write(`no price\n`);
        stats.noPrice++;
        continue;
      }

      const unitPrice = qty > 1 ? result.price / qty : result.price;
      const confidence = result.source?.includes("prik") ? "high" : "medium";
      const match = bestMatch(slugName);
      if (!match) {
        const packLabel = qty > 1 ? ` (÷${qty} → €${unitPrice.toFixed(2)})` : "";
        process.stdout.write(`€${result.price.toFixed(2)}${packLabel} [${result.source}] — no DB match for "${slugName}"\n`);
        stats.noMatch++;
        continue;
      }

      const volLabel = volumeCl ? ` ${volumeCl}cl` : "";
      const packLabel = qty > 1 ? ` ÷${qty}` : "";
      process.stdout.write(`€${unitPrice.toFixed(2)}${volLabel}${packLabel} [${result.source}] → "${match.product.name}" (${match.score.toFixed(2)})\n`);
      stats.found++;
      updates.push({ id: match.product.id_product, price: unitPrice, volumeCl, confidence });
    } catch (err) {
      process.stdout.write(`ERROR: ${err.message}\n`);
      stats.error++;
      await sleep(2000);
    }
  }

  console.log(`\nStats: ${JSON.stringify(stats)}`);
  console.log(`Updates ready: ${updates.length}`);

  if (!DRY_RUN && updates.length > 0) {
    console.log("\nWriting to Supabase...");
    let written = 0;
    for (const u of updates) {
      const update = { price_retail: u.price, price_foodservice: u.price, price_confidence: u.confidence };
      if (u.volumeCl) { update.volume_retail = u.volumeCl; update.volume_foodservice = u.volumeCl; }
      const { error } = await supabase
        .from("products")
        .update(update)
        .eq("id_product", u.id);
      if (!error) written++;
    }
    console.log(`Written: ${written}/${updates.length}`);
  }

  if (!DRY_RUN) {
    console.log("\nApplying category fallback for remaining products...");
    const { data: unpriced } = await supabase
      .from("products")
      .select("id_product, id_subcategory")
      .is("price_confidence", null);
    let fallbackCount = 0;
    for (const p of unpriced ?? []) {
      const subcatName = subcatMap[p.id_subcategory] ?? "OTHER";
      const fallbackPrice = CATEGORY_FALLBACK[subcatName] ?? 2.00;
      await supabase
        .from("products")
        .update({ price_retail: fallbackPrice, price_foodservice: fallbackPrice, price_confidence: "low" })
        .eq("id_product", p.id_product);
      fallbackCount++;
    }
    console.log(`Fallback applied to ${fallbackCount} products`);
  }

  console.log("\nDone.");
}

main().catch((err) => { console.error(err); process.exit(1); });
