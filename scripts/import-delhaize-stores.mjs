// scripts/import-delhaize-stores.mjs
// Fetches all Delhaize supermarket locations (excluding Louis Delhaize) from
// OpenStreetMap and inserts them into the Supabase `assortments` table under
// business_id 352.
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// ── Config ──────────────────────────────────────────────────────────────────
const BUSINESS_ID = 352;
const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];
const OVERPASS_QUERY = `
[out:json][timeout:120];
(
  node["shop"="supermarket"]["name"~"Delhaize",i](49.4,2.3,53.6,7.2);
  way["shop"="supermarket"]["name"~"Delhaize",i](49.4,2.3,53.6,7.2);
);
out center body;
`;

// Template values (same defaults as Colruyt)
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

// ── Border reference points ─────────────────────────────────────────────────
// NL/BE border
const BORDER_NL_BE = [
  [51.38, 3.36], [51.45, 3.90], [51.47, 4.30], [51.44, 4.80],
  [51.42, 5.10], [51.39, 5.50], [51.25, 5.75], [51.10, 5.85],
];

// NL/DE border — eastern Netherlands from Limburg up to Groningen
const BORDER_NL_DE = [
  [51.10, 5.85], [51.25, 6.00], [51.45, 6.08],
  [51.85, 6.70], [52.15, 6.85], [52.35, 7.05],
  [52.60, 7.08], [52.85, 7.05], [53.10, 7.00],
  [53.35, 7.20],
];

// FR/BE border — accurate trace from coast to Luxembourg
const BORDER_FR = [
  [51.09, 2.54],  // coast near De Panne
  [50.82, 2.60],  // south of Veurne
  [50.75, 2.88],  // Comines-Warneton
  [50.74, 3.10],  // Mouscron — right on the border
  [50.74, 3.22],  // Mouscron east
  [50.60, 3.35],  // near Tournai
  [50.48, 3.55],  // south of Tournai toward Mons
  [50.40, 3.70],  // Quiévrain area
  [50.35, 3.85],  // south of Mons
  [50.30, 4.05],  // Erquelinnes
  [50.25, 4.20],  // Beaumont
  [50.10, 4.35],  // Chimay
  [50.05, 4.50],  // Couvin
  [49.95, 4.80],  // Fumay area
  [49.85, 5.00],  // Rocroi
  [49.65, 5.25],  // Montmédy area
  [49.55, 5.50],  // Virton area
  [49.50, 5.82],  // Arlon south
];

// DE/BE border — eastern Belgium
const BORDER_DE_BE = [
  [50.76, 6.02], [50.63, 6.10], [50.50, 6.20], [50.37, 6.15],
  [50.30, 6.10], [50.17, 6.00], [50.08, 5.88],
];

function distToBorderKm(lat, lng, borderPoints) {
  let min = Infinity;
  for (const [bLat, bLng] of borderPoints) {
    const d = haversineKm(lat, lng, bLat, bLng);
    if (d < min) min = d;
  }
  return min;
}

// ── Country detection ───────────────────────────────────────────────────────
const NL_POLYGON = [
  [53.6, 3.0], [53.6, 7.3], [53.35, 7.20],
  [52.85, 7.10], [52.60, 7.10], [52.35, 7.10],
  [52.15, 6.90], [51.85, 6.75],
  [51.55, 6.25], [51.35, 6.23], [51.20, 6.22],
  [51.10, 6.10], [50.95, 6.05], [50.76, 6.02],
  [50.75, 5.93], [50.75, 5.63], [50.78, 5.57],
  [50.90, 5.60], [51.00, 5.70], [51.10, 5.85],
  [51.25, 5.75], [51.39, 5.50], [51.42, 5.10],
  [51.44, 4.80], [51.47, 4.30], [51.45, 3.90],
  [51.38, 3.36], [51.38, 3.0], [53.6, 3.0],
];

function isNetherlands(lat, lng) {
  let inside = false;
  for (let i = 0, j = NL_POLYGON.length - 1; i < NL_POLYGON.length; j = i++) {
    const [yi, xi] = NL_POLYGON[i];
    const [yj, xj] = NL_POLYGON[j];
    if ((yi > lat) !== (yj > lat) &&
        lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// ── Persona weight calculation ──────────────────────────────────────────────
function calcPersonaWeights(lat, lng) {
  const THRESHOLD_KM = 30;

  if (isNetherlands(lat, lng)) {
    const distBE = distToBorderKm(lat, lng, BORDER_NL_BE);
    const distDE = distToBorderKm(lat, lng, BORDER_NL_DE);
    const rawBE = Math.max(0, 1 - distBE / THRESHOLD_KM);
    const rawDE = Math.max(0, 1 - distDE / THRESHOLD_KM);
    const totalForeign = rawBE + rawDE;

    if (totalForeign === 0) return { belgian: 0, french: 0, german: 0, dutch: 100 };

    const foreignScale = Math.min(totalForeign, 1) * 50;
    const belgianPct = Math.round((rawBE / totalForeign) * foreignScale);
    const germanPct = Math.round((rawDE / totalForeign) * foreignScale);
    return { belgian: belgianPct, french: 0, german: germanPct, dutch: Math.max(50, 100 - belgianPct - germanPct) };
  } else {
    const distNL = distToBorderKm(lat, lng, BORDER_NL_BE);
    const distFR = distToBorderKm(lat, lng, BORDER_FR);
    const distDE = distToBorderKm(lat, lng, BORDER_DE_BE);

    const rawNL = Math.max(0, 1 - distNL / THRESHOLD_KM);
    const rawFR = Math.max(0, 1 - distFR / THRESHOLD_KM);
    const rawDE = Math.max(0, 1 - distDE / THRESHOLD_KM);
    const totalForeign = rawNL + rawFR + rawDE;

    if (totalForeign === 0) return { belgian: 100, french: 0, german: 0, dutch: 0 };

    const foreignScale = Math.min(totalForeign, 1) * 50;
    const dutchPct = Math.round((rawNL / totalForeign) * foreignScale);
    const frenchPct = Math.round((rawFR / totalForeign) * foreignScale);
    const germanPct = Math.round((rawDE / totalForeign) * foreignScale);
    return { belgian: Math.max(50, 100 - dutchPct - frenchPct - germanPct), french: frenchPct, german: germanPct, dutch: dutchPct };
  }
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

  // Exclude "Louis Delhaize"
  const name = tags.name || "";
  if (/louis\s+delhaize/i.test(name)) return null;

  const city = tags["addr:city"] || null;
  const storeName = city ? `Delhaize ${city}` : (name || "Delhaize");
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
  let json;
  for (const url of OVERPASS_URLS) {
    console.log(`Fetching Delhaize stores from ${url}...`);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
      });
      if (!res.ok) {
        console.warn(`  ${url} returned ${res.status}, trying next...`);
        continue;
      }
      const text = await res.text();
      if (text.includes("<html")) {
        console.warn(`  ${url} returned HTML error, trying next...`);
        continue;
      }
      json = JSON.parse(text);
      if (json.elements?.length > 0) break;
      console.warn(`  ${url} returned 0 elements, trying next...`);
    } catch (err) {
      console.warn(`  ${url} failed: ${err.message}, trying next...`);
    }
  }
  if (!json || !json.elements?.length)
    throw new Error("All Overpass endpoints failed or returned no data");

  console.log(`Overpass returned ${json.elements.length} elements`);

  const stores = json.elements
    .map((el, i) => parseElement(el, i + 1))
    .filter(Boolean);

  console.log(`Parsed ${stores.length} valid stores (after excluding Louis Delhaize)`);

  for (const s of stores.slice(0, 8)) {
    console.log(
      `  ${s.name} (${s.lat.toFixed(3)}, ${s.lng.toFixed(3)}) → BE=${s.belgian} FR=${s.french} DE=${s.german} NL=${s.dutch}`,
    );
  }

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
