// scripts/import-colruyt-stores.mjs
// Fetches all Colruyt supermarket locations from OpenStreetMap and inserts
// them into the Supabase `assortments` table under business_id 351.
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// ── Config ──────────────────────────────────────────────────────────────────
const BUSINESS_ID = 351;
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const OVERPASS_QUERY = `
[out:json][timeout:60];
(
  node["shop"="supermarket"]["name"~"Colruyt",i](49.4,2.3,51.6,6.5);
  way["shop"="supermarket"]["name"~"Colruyt",i](49.4,2.3,51.6,6.5);
);
out center body;
`;

// Template values cloned from assortment id=3 ("Collie")
const TEMPLATE = {
  party: 53, budget: 2, trendy: 28, eco: 75, sport: 96,
  local: 1, luxury: 66, traditional: 25, healthy: 99, average: 83,
  manager_first_name: "X", manager_last_name: "Y", phone_number: "8835588",
};

// ── Supabase client ─────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } },
);

// ── Haversine distance (km) ─────────────────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Distance to nearest point on each country border ────────────────────────
// Simplified border lines as arrays of [lat, lng] segments.
// Only the Belgian side of each border is approximated.
const BORDERS = {
  dutch: [
    // NL border runs roughly west-to-east across the north
    [51.38, 3.36], [51.45, 3.90], [51.47, 4.30], [51.44, 4.80],
    [51.42, 5.10], [51.39, 5.50], [51.25, 5.75], [51.10, 5.85],
  ],
  french: [
    // FR border runs along the south/south-west
    [51.09, 2.55], [50.84, 2.60], [50.50, 2.90], [50.10, 3.40],
    [49.95, 3.80], [49.85, 4.15], [49.70, 4.45], [49.58, 4.85],
    [49.50, 5.10], [49.50, 5.48],
  ],
  german: [
    // DE border runs along the east
    [50.76, 6.02], [50.63, 6.10], [50.50, 6.20], [50.37, 6.15],
    [50.30, 6.10], [50.17, 6.00], [50.08, 5.88],
  ],
};

function distToBorderKm(lat, lng, borderPoints) {
  let min = Infinity;
  for (const [bLat, bLng] of borderPoints) {
    const d = haversineKm(lat, lng, bLat, bLng);
    if (d < min) min = d;
  }
  return min;
}

// ── Persona weight calculation ──────────────────────────────────────────────
// Only stores within ~30 km of a border get meaningful non-Belgian weight.
// Central stores are 100% Belgian.
function calcPersonaWeights(lat, lng) {
  const THRESHOLD_KM = 30; // beyond this distance, persona weight → 0

  const distNL = distToBorderKm(lat, lng, BORDERS.dutch);
  const distFR = distToBorderKm(lat, lng, BORDERS.french);
  const distDE = distToBorderKm(lat, lng, BORDERS.german);

  // Linear falloff: full weight at 0 km, zero weight at THRESHOLD_KM
  const rawNL = Math.max(0, 1 - distNL / THRESHOLD_KM);
  const rawFR = Math.max(0, 1 - distFR / THRESHOLD_KM);
  const rawDE = Math.max(0, 1 - distDE / THRESHOLD_KM);

  const totalForeign = rawNL + rawFR + rawDE;

  if (totalForeign === 0) {
    // Central Belgium — 100% belgian
    return { belgian: 100, french: 0, german: 0, dutch: 0 };
  }

  // Foreign personas share up to 50% of the total (belgian floor = 50%)
  const maxForeignPct = 50;
  // Scale: if very close to one border, that border gets up to ~50%
  // Cap total foreign influence at maxForeignPct
  const foreignScale = Math.min(totalForeign, 1) * maxForeignPct;

  const dutchPct = Math.round((rawNL / totalForeign) * foreignScale);
  const frenchPct = Math.round((rawFR / totalForeign) * foreignScale);
  const germanPct = Math.round((rawDE / totalForeign) * foreignScale);

  const belgianPct = 100 - dutchPct - frenchPct - germanPct;

  return {
    belgian: Math.max(50, belgianPct),
    french: frenchPct,
    german: germanPct,
    dutch: dutchPct,
  };
}

// ── Address composition ─────────────────────────────────────────────────────
function composeAddress(tags) {
  const parts = [];
  if (tags["addr:street"]) {
    parts.push(
      tags["addr:housenumber"]
        ? `${tags["addr:street"]} ${tags["addr:housenumber"]}`
        : tags["addr:street"],
    );
  }
  if (tags["addr:postcode"] || tags["addr:city"]) {
    parts.push(
      [tags["addr:postcode"], tags["addr:city"]].filter(Boolean).join(" "),
    );
  }
  return parts.join(", ") || null;
}

// ── Parse OSM element → assortment row ──────────────────────────────────────
function parseElement(el, sortOrder) {
  const tags = el.tags || {};
  const lat = el.type === "way" ? el.center?.lat : el.lat;
  const lng = el.type === "way" ? el.center?.lon : el.lon;
  if (!lat || !lng) return null;

  const city = tags["addr:city"] || null;
  const storeName = city ? `Colruyt ${city}` : (tags.name || "Colruyt");
  const address = composeAddress(tags);
  const persona = calcPersonaWeights(lat, lng);

  return {
    business_id: BUSINESS_ID,
    name: storeName,
    address,
    lat,
    lng,
    ...persona,
    ...TEMPLATE,
    sort_order: sortOrder,
  };
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("Fetching Colruyt stores from Overpass API...");

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
  });

  if (!res.ok)
    throw new Error(`Overpass API error: ${res.status} ${res.statusText}`);
  const json = await res.json();

  console.log(`Overpass returned ${json.elements.length} elements`);

  const stores = json.elements
    .map((el, i) => parseElement(el, i + 1))
    .filter(Boolean);

  console.log(`Parsed ${stores.length} valid stores`);

  // Log a few examples with persona weights
  for (const s of stores.slice(0, 5)) {
    console.log(
      `  ${s.name} (${s.lat.toFixed(3)}, ${s.lng.toFixed(3)}) → BE=${s.belgian} FR=${s.french} DE=${s.german} NL=${s.dutch}`,
    );
  }

  // Insert in batches of 50
  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < stores.length; i += BATCH) {
    const batch = stores.slice(i, i + BATCH);
    const { error } = await supabase
      .from("assortments")
      .upsert(batch, { onConflict: "business_id,lat,lng" });
    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH) + 1} error:`, error.message);
    } else {
      inserted += batch.length;
      console.log(
        `  Inserted batch ${Math.floor(i / BATCH) + 1} (${inserted}/${stores.length})`,
      );
    }
  }

  console.log(`\nDone. Inserted ${inserted} stores into assortments.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
