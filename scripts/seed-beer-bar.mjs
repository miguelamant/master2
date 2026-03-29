// scripts/seed-beer-bar.mjs
// Creates a "Belgian Beer Bar" business + assortment with 50 curated beer products.
//
// Distribution:
//   40% (20) — Malt & Sweet (DARK_BROWN_MALT_SWEETNESS) — mostly Trappist, rest Abbey
//   40% (20) — Belgian Blond (NORMAL_BLOND_AMBER)        — mostly Trappist, rest Abbey
//   10%  (5) — Sour (Flemish reds, lambic, geuze)
//   10%  (5) — Pilsner
//
// Usage: node scripts/seed-beer-bar.mjs

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import "dotenv/config";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } },
);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Pick up to `n` random items from an array. */
function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

/** Query products by subcategory name, optional heritage filter, optional subsubcategory filter. */
async function queryProducts({ subcatName, heritage, subsubcatLike, limit = 100 }) {
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
    if (Array.isArray(heritage)) {
      q = q.in("heritage", heritage);
    } else {
      q = q.eq("heritage", heritage);
    }
  }

  if (subsubcatLike) {
    // Filter subsubcategory names using ilike patterns
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
  const email = "beerbar@demo.com";
  const password = "beerbar123";

  // 1. Find or create business
  let { data: biz } = await supabase
    .from("business_info")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (!biz) {
    const hashed = bcrypt.hashSync(password, 10);
    const { data, error: bizErr } = await supabase
      .from("business_info")
      .insert([{ horeca_name: "Belgian Beer Bar", email, password: hashed }])
      .select("id")
      .single();
    if (bizErr) throw new Error(`Business insert failed: ${bizErr.message}`);
    biz = data;
    console.log(`✓ Business created — id=${biz.id}`);
  } else {
    console.log(`✓ Business exists — id=${biz.id}`);
  }

  // 2. Find or create assortment
  let { data: assort } = await supabase
    .from("assortments")
    .select("id")
    .eq("business_id", biz.id)
    .order("sort_order")
    .limit(1)
    .maybeSingle();

  if (!assort) {
    const { data, error: assortErr } = await supabase
      .from("assortments")
      .insert([{
        business_id: biz.id,
        name: "Belgian Beer Bar",
        address: "Grote Markt 1, Brussels",
        lat: 50.8467,
        lng: 4.3525,
        manager_first_name: "Jan",
        manager_last_name: "De Bier",
        phone_number: "0471234567",
        sort_order: 0,
      }])
      .select("id")
      .single();
    if (assortErr) throw new Error(`Assortment insert failed: ${assortErr.message}`);
    assort = data;
    console.log(`✓ Assortment created — id=${assort.id}`);
  } else {
    // Ensure lat/lng are set
    await supabase.from("assortments").update({ lat: 50.8467, lng: 4.3525 }).eq("id", assort.id);
    console.log(`✓ Assortment exists — id=${assort.id} (lat/lng updated)`);
  }

  // 3. Query products for each bucket
  const allPicks = [];

  // ── Malt & Sweet: 15 Trappist + 5 Abbey ──
  const maltTrappist = await queryProducts({
    subcatName: "DARK_BROWN_MALT_SWEETNESS",
    heritage: ["TRAPPIST", "TRADITIONAL"],
  });
  const maltAbbey = await queryProducts({
    subcatName: "DARK_BROWN_MALT_SWEETNESS",
    heritage: "ABBEY",
  });
  console.log(`  Malt&Sweet pool: ${maltTrappist.length} trappist, ${maltAbbey.length} abbey`);

  let maltPicks = pickRandom(maltTrappist, 15);
  let maltAbbeyPicks = pickRandom(maltAbbey, 5);
  // Backfill if not enough in a bucket
  if (maltPicks.length < 15) {
    const extra = pickRandom(maltAbbey.filter((p) => !maltAbbeyPicks.some((a) => a.id_product === p.id_product)), 15 - maltPicks.length);
    maltPicks = [...maltPicks, ...extra];
  }
  if (maltPicks.length + maltAbbeyPicks.length < 20) {
    const allMalt = await queryProducts({ subcatName: "DARK_BROWN_MALT_SWEETNESS" });
    const usedIds = new Set([...maltPicks, ...maltAbbeyPicks].map((p) => p.id_product));
    const extra = pickRandom(allMalt.filter((p) => !usedIds.has(p.id_product)), 20 - maltPicks.length - maltAbbeyPicks.length);
    maltAbbeyPicks = [...maltAbbeyPicks, ...extra];
  }
  allPicks.push(...maltPicks, ...maltAbbeyPicks);

  // ── Belgian Blond: 15 Trappist + 5 Abbey ──
  const blondTrappist = await queryProducts({
    subcatName: "NORMAL_BLOND_AMBER",
    heritage: ["TRAPPIST", "TRADITIONAL"],
  });
  const blondAbbey = await queryProducts({
    subcatName: "NORMAL_BLOND_AMBER",
    heritage: "ABBEY",
  });
  console.log(`  Blond pool: ${blondTrappist.length} trappist, ${blondAbbey.length} abbey`);

  let blondPicks = pickRandom(blondTrappist, 15);
  let blondAbbeyPicks = pickRandom(blondAbbey, 5);
  if (blondPicks.length < 15) {
    const extra = pickRandom(blondAbbey.filter((p) => !blondAbbeyPicks.some((a) => a.id_product === p.id_product)), 15 - blondPicks.length);
    blondPicks = [...blondPicks, ...extra];
  }
  if (blondPicks.length + blondAbbeyPicks.length < 20) {
    const allBlond = await queryProducts({ subcatName: "NORMAL_BLOND_AMBER" });
    const usedIds = new Set([...blondPicks, ...blondAbbeyPicks].map((p) => p.id_product));
    const extra = pickRandom(allBlond.filter((p) => !usedIds.has(p.id_product)), 20 - blondPicks.length - blondAbbeyPicks.length);
    blondAbbeyPicks = [...blondAbbeyPicks, ...extra];
  }
  allPicks.push(...blondPicks, ...blondAbbeyPicks);

  // ── Sour: 5 — Flemish reds, lambic, geuze ──
  const sours = await queryProducts({
    subcatName: "SOURS_SAISON_LAMBIC_GUEUZE",
    subsubcatLike: ["FLANDERS", "LAMBIC", "GEUZE", "GUEUZE", "KRIEK"],
  });
  console.log(`  Sour pool: ${sours.length}`);
  let sourPicks = pickRandom(sours, 5);
  if (sourPicks.length < 5) {
    // Broaden to all sours
    const allSours = await queryProducts({ subcatName: "SOURS_SAISON_LAMBIC_GUEUZE" });
    const usedIds = new Set(sourPicks.map((p) => p.id_product));
    const extra = pickRandom(allSours.filter((p) => !usedIds.has(p.id_product)), 5 - sourPicks.length);
    sourPicks = [...sourPicks, ...extra];
  }
  allPicks.push(...sourPicks);

  // ── Pilsner: 5 ──
  const pils = await queryProducts({
    subcatName: "LAGERS",
    subsubcatLike: ["PILSNER", "PILS"],
  });
  console.log(`  Pilsner pool: ${pils.length}`);
  let pilsPicks = pickRandom(pils, 5);
  if (pilsPicks.length < 5) {
    const allLagers = await queryProducts({ subcatName: "LAGERS" });
    const usedIds = new Set(pilsPicks.map((p) => p.id_product));
    const extra = pickRandom(allLagers.filter((p) => !usedIds.has(p.id_product)), 5 - pilsPicks.length);
    pilsPicks = [...pilsPicks, ...extra];
  }
  allPicks.push(...pilsPicks);

  // 4. Deduplicate (shouldn't happen, but safety)
  const seen = new Set();
  const unique = allPicks.filter((p) => {
    if (seen.has(p.id_product)) return false;
    seen.add(p.id_product);
    return true;
  });

  console.log(`\n✓ Selected ${unique.length} unique products`);

  // 5. Find max id_menu_item so we can supply explicit IDs (sequence is out of sync)
  const { data: maxRow } = await supabase
    .from("menu_items")
    .select("id_menu_item")
    .order("id_menu_item", { ascending: false })
    .limit(1)
    .single();

  let nextId = (maxRow?.id_menu_item ?? 0) + 1;
  console.log(`  Starting id_menu_item at ${nextId}`);

  let inserted = 0;
  for (const p of unique) {
    const { error: miErr } = await supabase.from("menu_items").insert({
      id_menu_item: nextId,
      assortment_id: assort.id,
      product_id: p.id_product,
      price: p.price_retail || 4.5,
    });
    if (miErr) {
      console.warn(`  ⚠ Failed to insert product ${p.id_product} (${p.name}): ${miErr.message}`);
    } else {
      inserted++;
      nextId++;
    }
  }

  console.log(`✓ Inserted ${inserted}/${unique.length} menu items into assortment ${assort.id}`);

  // 6. Print summary
  console.log("\n── Summary ──");
  console.log(`  Business: id=${biz.id}, email=${email}, password=${password}`);
  console.log(`  Assortment: id=${assort.id}`);
  console.log(`  Malt & Sweet: ${maltPicks.length + maltAbbeyPicks.length} (${maltPicks.length} trappist, ${maltAbbeyPicks.length} abbey)`);
  console.log(`  Belgian Blond: ${blondPicks.length + blondAbbeyPicks.length} (${blondPicks.length} trappist, ${blondAbbeyPicks.length} abbey)`);
  console.log(`  Sour: ${sourPicks.length}`);
  console.log(`  Pilsner: ${pilsPicks.length}`);
  console.log(`  Total: ${inserted}`);
}

main().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
