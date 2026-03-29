// scripts/seed-progressive-extra.mjs
// Adds more progressive craft beers to assortment 6706 (Progressive Craft).
//
// Extra picks:
//   8 — Pastry stouts (imperial, pastry, coffee, milk stouts)
//   8 — Fruited sours / pastry sours (berliner weisse, catharina, fruited gose)
//   5 — Saisons / farmhouse ales
//   4 — Sour IPAs / Brett beers
//   3 — Witbiers / wheat beers
//   2 — Hard seltzer / kombucha
//
// Usage: node scripts/seed-progressive-extra.mjs

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } },
);

const ASSORTMENT_ID = 6706;

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

async function main() {
  // Get existing product_ids on this assortment to avoid duplicates
  const { data: existing } = await supabase
    .from("menu_items")
    .select("product_id")
    .eq("assortment_id", ASSORTMENT_ID);

  const usedIds = new Set((existing || []).map((r) => r.product_id));
  console.log(`  Existing menu items: ${usedIds.size}`);

  const allPicks = [];

  function pickUnique(pool, n, label) {
    const available = pool.filter((p) => !usedIds.has(p.id_product));
    const picks = pickRandom(available, n);
    picks.forEach((p) => usedIds.add(p.id_product));
    console.log(`  ${label}: pool=${pool.length}, available=${available.length}, picked=${picks.length}`);
    return picks;
  }

  // ── Pastry stouts: 8 ──
  const stoutPool = await queryProducts({
    subcatName: "DARK_BROWN_COFFEE_ROAST_BITTER",
    subsubcatLike: ["PASTRY", "IMPERIAL", "MILK", "COFFEE", "OATMEAL"],
  });
  allPicks.push(...pickUnique(stoutPool, 8, "Pastry stouts"));

  // ── Fruited sours / pastry sours: 8 ──
  const fruitedSourPool = await queryProducts({
    subcatName: "SOURS_SAISON_LAMBIC_GUEUZE",
    subsubcatLike: ["FRUITED", "BERLINER", "CATHARINA", "GOSE", "PASTRY"],
  });
  allPicks.push(...pickUnique(fruitedSourPool, 8, "Fruited/pastry sours"));

  // ── Saisons / farmhouse: 5 ──
  const saisonPool = await queryProducts({
    subcatName: "SOURS_SAISON_LAMBIC_GUEUZE",
    subsubcatLike: ["SAISON", "FARMHOUSE", "BIERE_DE_GARDE", "BRETT", "WILD"],
  });
  allPicks.push(...pickUnique(saisonPool, 5, "Saisons/farmhouse"));

  // ── Sour IPAs: 4 ──
  const sourIpaPool = await queryProducts({
    subcatName: "SOURS_SAISON_LAMBIC_GUEUZE",
    subsubcatLike: ["IPA_SOUR", "WILD", "BRETT"],
  });
  let sourIpaPicks = pickUnique(sourIpaPool, 4, "Sour IPAs/brett");
  // Backfill from BLOND_BITTERS sour-adjacent if needed
  if (sourIpaPicks.length < 4) {
    const brettIpa = await queryProducts({
      subcatName: "BLOND_BITTERS",
      subsubcatLike: ["BRETT", "SOUR", "FARMHOUSE"],
    });
    const extra = pickUnique(brettIpa, 4 - sourIpaPicks.length, "Sour IPA backfill");
    sourIpaPicks = [...sourIpaPicks, ...extra];
  }
  allPicks.push(...sourIpaPicks);

  // ── Witbiers / wheat: 3 ──
  const wheatPool = await queryProducts({
    subcatName: "WHEAT_BEERS",
    subsubcatLike: ["WITBIER", "BLANCHE", "HEFEWEIZEN", "WHEAT_CLASSIC"],
  });
  allPicks.push(...pickUnique(wheatPool, 3, "Witbiers/wheat"));

  // ── Hard seltzer / kombucha: 2 ──
  const selzerPool = await queryProducts({
    subcatName: "SPIRIT_FLAVOURED_BEERS",
    subsubcatLike: ["SELTZER", "KOMBUCHA", "GINGER"],
  });
  allPicks.push(...pickUnique(selzerPool, 2, "Hard seltzer/kombucha"));

  console.log(`\n✓ Selected ${allPicks.length} extra products`);

  // ── Insert ──
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
      assortment_id: ASSORTMENT_ID,
      product_id: p.id_product,
      price: p.price_retail || 5.5,
    });
    if (miErr) {
      console.warn(`  ⚠ Failed: ${p.id_product} (${p.name}): ${miErr.message}`);
    } else {
      inserted++;
      nextId++;
    }
  }

  console.log(`✓ Inserted ${inserted}/${allPicks.length} into assortment ${ASSORTMENT_ID}`);
  console.log(`  Total items now: ${usedIds.size}`);
}

main().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
