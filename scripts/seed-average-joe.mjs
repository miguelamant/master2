// scripts/seed-average-joe.mjs
// Creates an "Average Joe" assortment — mainstream, accessible beers.
// Pilsners, basic blondes, a few wheat beers, standard IPAs, a couple fruit beers.
//
// Distribution (50 products):
//   30% (15) — Pilsner / lager (mainstream)
//   30% (15) — Belgian blond / amber (commercial brands, heritage=NORMAL or MODERN)
//   15%  (8) — Wheat / wit
//   15%  (7) — Accessible IPAs (session, classic)
//   10%  (5) — Fruit beers / radlers
//
// Usage: node scripts/seed-average-joe.mjs

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } },
);

const BUSINESS_ID = 374;

function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

async function queryProducts({ subcatName, heritage, subsubcatLike, limit = 200 }) {
  let q = supabase
    .from("products")
    .select(`
      id_product, name, brand, heritage, price_retail,
      subcategories!inner ( subcat_name ),
      subsubcategories!left ( subsubcat_name )
    `)
    .eq("subcategories.subcat_name", subcatName)
    .limit(limit);

  if (heritage) {
    q = Array.isArray(heritage) ? q.in("heritage", heritage) : q.eq("heritage", heritage);
  }
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

async function main() {
  // 1. Create assortment
  const { data: assort, error: assortErr } = await supabase
    .from("assortments")
    .insert([{
      business_id: BUSINESS_ID,
      name: "Average Joe",
      address: "Steenweg 12, Leuven",
      lat: 50.8798,
      lng: 4.7005,
      manager_first_name: "Jan",
      manager_last_name: "De Bier",
      phone_number: "0471234567",
      sort_order: 2,
    }])
    .select("id")
    .single();

  if (assortErr) throw new Error(`Assortment insert failed: ${assortErr.message}`);
  console.log(`✓ Assortment created — id=${assort.id}`);

  const usedIds = new Set();
  const allPicks = [];

  function pickUnique(pool, n, label) {
    const available = pool.filter((p) => !usedIds.has(p.id_product));
    const picks = pickRandom(available, n);
    picks.forEach((p) => usedIds.add(p.id_product));
    console.log(`  ${label}: pool=${pool.length}, available=${available.length}, picked=${picks.length}`);
    return picks;
  }

  // ── Pilsner / lager: 15 (mainstream, NORMAL/MODERN heritage) ──
  const pilsPool = await queryProducts({
    subcatName: "LAGERS",
    heritage: ["NORMAL", "MODERN"],
    subsubcatLike: ["PILSNER", "PILS", "LAGER_CORE", "LAGER_PALE", "HELLES"],
  });
  allPicks.push(...pickUnique(pilsPool, 15, "Pilsner/lager"));

  // ── Belgian blond / amber: 15 (commercial, NORMAL/MODERN) ──
  const blondPool = await queryProducts({
    subcatName: "NORMAL_BLOND_AMBER",
    heritage: ["NORMAL", "MODERN"],
  });
  allPicks.push(...pickUnique(blondPool, 15, "Blond/amber"));

  // ── Wheat / wit: 8 ──
  const wheatPool = await queryProducts({
    subcatName: "WHEAT_BEERS",
    subsubcatLike: ["WITBIER", "BLANCHE", "HEFEWEIZEN", "WHEAT_CLASSIC"],
  });
  allPicks.push(...pickUnique(wheatPool, 8, "Wheat/wit"));

  // ── Accessible IPAs: 7 (session, classic) ──
  const ipaPool = await queryProducts({
    subcatName: "BLOND_BITTERS",
    subsubcatLike: ["IPA_SESSION", "IPA_AMERICAN", "IPA_CLASSIC", "SESSION_IPA", "PALE_ALE_SESSION"],
  });
  allPicks.push(...pickUnique(ipaPool, 7, "Accessible IPAs"));

  // ── Fruit beers / radlers: 5 ──
  const fruitPool = await queryProducts({ subcatName: "FRUIT_BEERS" });
  const radlerPool = await queryProducts({ subcatName: "RADLERS" });
  const fruitAll = [...fruitPool, ...radlerPool];
  allPicks.push(...pickUnique(fruitAll, 5, "Fruit/radlers"));

  console.log(`\n✓ Selected ${allPicks.length} unique products`);

  // ── Insert menu_items ──
  const { data: maxRow } = await supabase
    .from("menu_items")
    .select("id_menu_item")
    .order("id_menu_item", { ascending: false })
    .limit(1)
    .single();

  let nextId = (maxRow?.id_menu_item ?? 0) + 1;
  let inserted = 0;

  for (const p of allPicks) {
    const { error: miErr } = await supabase.from("menu_items").insert({
      id_menu_item: nextId,
      assortment_id: assort.id,
      product_id: p.id_product,
      price: p.price_retail || 3.5,
    });
    if (miErr) {
      console.warn(`  ⚠ Failed: ${p.id_product} (${p.name}): ${miErr.message}`);
    } else {
      inserted++;
      nextId++;
    }
  }

  console.log(`✓ Inserted ${inserted}/${allPicks.length} menu items into assortment ${assort.id}`);

  // ── Register as "Normal" stereotype ──
  const { error: paErr } = await supabase.from("persona_assortments").insert({
    stereotype: "Normal", assortment_id: assort.id, weight: 1,
  });
  if (paErr) console.warn(`  ⚠ persona_assortments: ${paErr.message}`);
  else console.log(`✓ Registered as "Normal" stereotype`);

  console.log("\n── Summary ──");
  console.log(`  Business: id=${BUSINESS_ID}`);
  console.log(`  Assortment: id=${assort.id}, name="Average Joe"`);
  console.log(`  Total: ${inserted}`);
}

main().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
