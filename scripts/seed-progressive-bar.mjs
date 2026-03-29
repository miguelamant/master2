// scripts/seed-progressive-bar.mjs
// Creates a "Progressive Craft" assortment under the existing Belgian Beer Bar business (id=374)
// with 50 craft-forward beers.
//
// Distribution:
//   40% (20) — Hazy IPA / NEIPA
//   20% (10) — Smoothie sour
//   20% (10) — Pale ales (session, APA, hazy pale)
//   20% (10) — Other craft IPAs (classic, session, Belgian IPA)
//
// Usage: node scripts/seed-progressive-bar.mjs

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } },
);

const BUSINESS_ID = 374;

// ── Helpers ───────────────────────────────────────────────────────────────────

function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

async function queryProducts({ subcatName, subsubcatLike, limit = 200 }) {
  let q = supabase
    .from("products")
    .select(`
      id_product, name, brand, heritage, price_retail,
      subcategories!inner ( subcat_name ),
      subsubcategories!left ( subsubcat_name )
    `)
    .eq("subcategories.subcat_name", subcatName)
    .limit(limit);

  if (subsubcatLike) {
    q = q.or(
      subsubcatLike.map((p) => `subsubcat_name.ilike.%${p}%`).join(","),
      { foreignTable: "subsubcategories" },
    );
  }

  const { data, error } = await q;
  if (error) throw new Error(`Query failed (${subcatName}): ${error.message}`);
  return data || [];
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Create new assortment under existing business
  const { data: assort, error: assortErr } = await supabase
    .from("assortments")
    .insert([{
      business_id: BUSINESS_ID,
      name: "Progressive Craft",
      address: "Dansaertstraat 50, Brussels",
      lat: 50.8512,
      lng: 4.3448,
      manager_first_name: "Jan",
      manager_last_name: "De Bier",
      phone_number: "0471234567",
      sort_order: 1,
    }])
    .select("id")
    .single();

  if (assortErr) throw new Error(`Assortment insert failed: ${assortErr.message}`);
  console.log(`✓ Assortment created — id=${assort.id}`);

  const allPicks = [];
  const usedIds = new Set();

  function pickUnique(pool, n) {
    const available = pool.filter((p) => !usedIds.has(p.id_product));
    const picks = pickRandom(available, n);
    picks.forEach((p) => usedIds.add(p.id_product));
    return picks;
  }

  // ── Hazy IPA / NEIPA: 20 ──
  const hazyPool = await queryProducts({
    subcatName: "BLOND_BITTERS",
    subsubcatLike: ["NEW_ENGLAND", "HAZY", "NEIPA"],
  });
  console.log(`  Hazy IPA pool: ${hazyPool.length}`);
  const hazyPicks = pickUnique(hazyPool, 20);
  allPicks.push(...hazyPicks);

  // ── Smoothie sour: 10 ──
  const smoothiePool = await queryProducts({
    subcatName: "SMOOTHIE_SOUR",
  });
  console.log(`  Smoothie sour pool: ${smoothiePool.length}`);
  let smoothiePicks = pickUnique(smoothiePool, 10);
  // Backfill from fruited sours if needed
  if (smoothiePicks.length < 10) {
    const fruitedSours = await queryProducts({
      subcatName: "SOURS_SAISON_LAMBIC_GUEUZE",
      subsubcatLike: ["FRUITED", "SMOOTHIE", "PASTRY", "CATHARINA"],
    });
    const extra = pickUnique(fruitedSours, 10 - smoothiePicks.length);
    smoothiePicks = [...smoothiePicks, ...extra];
  }
  allPicks.push(...smoothiePicks);

  // ── Pale ales: 10 ──
  const palePool = await queryProducts({
    subcatName: "BLOND_BITTERS",
    subsubcatLike: ["PALE_ALE", "SESSION_PALE", "APA", "XPA"],
  });
  console.log(`  Pale ale pool: ${palePool.length}`);
  const palePicks = pickUnique(palePool, 10);
  allPicks.push(...palePicks);

  // ── Other craft IPAs: 10 (classic, session, Belgian) ──
  const ipaPool = await queryProducts({
    subcatName: "BLOND_BITTERS",
    subsubcatLike: ["IPA_AMERICAN", "IPA_SESSION", "IPA_BELGIAN", "IPA_CLASSIC", "IPA_BRUT", "IPA_FRUITED"],
  });
  console.log(`  Other IPA pool: ${ipaPool.length}`);
  const ipaPicks = pickUnique(ipaPool, 10);
  allPicks.push(...ipaPicks);

  console.log(`\n✓ Selected ${allPicks.length} unique products`);

  // ── Insert menu_items ──
  const { data: maxRow } = await supabase
    .from("menu_items")
    .select("id_menu_item")
    .order("id_menu_item", { ascending: false })
    .limit(1)
    .single();

  let nextId = (maxRow?.id_menu_item ?? 0) + 1;
  console.log(`  Starting id_menu_item at ${nextId}`);

  let inserted = 0;
  for (const p of allPicks) {
    const { error: miErr } = await supabase.from("menu_items").insert({
      id_menu_item: nextId,
      assortment_id: assort.id,
      product_id: p.id_product,
      price: p.price_retail || 5.0,
    });
    if (miErr) {
      console.warn(`  ⚠ Failed: ${p.id_product} (${p.name}): ${miErr.message}`);
    } else {
      inserted++;
      nextId++;
    }
  }

  console.log(`✓ Inserted ${inserted}/${allPicks.length} menu items into assortment ${assort.id}`);

  console.log("\n── Summary ──");
  console.log(`  Business: id=${BUSINESS_ID}`);
  console.log(`  Assortment: id=${assort.id}, name="Progressive Craft"`);
  console.log(`  Hazy IPA/NEIPA: ${hazyPicks.length}`);
  console.log(`  Smoothie sour: ${smoothiePicks.length}`);
  console.log(`  Pale ales: ${palePicks.length}`);
  console.log(`  Other IPAs: ${ipaPicks.length}`);
  console.log(`  Total: ${inserted}`);
}

main().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
