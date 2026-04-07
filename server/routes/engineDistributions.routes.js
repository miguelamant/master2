import { Router } from "express";
import { supabase } from "../integrations/supabase.js";
import { isAuthenticated } from "../middleware/auth.js";
import { applyFilters } from "../services/engine.js";

const router = Router();

const FIELD_MAP = {
  is_zero:        "products.is_zero",
  is_sparkling:   "products.is_sparkling",
  is_gluten_free: "products.is_gluten_free",
  is_lactose_free:"products.is_lactose_free",
  brand:          "products.brand",
  subcategory:    "products.subcategories.subcat_name",
  subsubcategory: "products.subsubcategories.subsubcat_name",
  price_retail:   "products.price_retail",
  abv:            "products.abv",
  ibu:            "products.ibu",
  heritage:       "products.heritage",
  caffeine:       "products.caffeine",
  sugar_content:  "products.sugar_content",
  is_protein:     "products.is_protein",
  is_prebiotic:   "products.is_prebiotic",
  is_magnesium:   "products.is_magnesium",
  is_vitamin:     "products.is_vitamin",
  is_collagen:    "products.is_collagen",
  is_trending:    "products.is_trending",
  is_high_margin: "products.is_high_margin",
};

const PARENT_BY_SECTION = {
  beers: "BEERS", sodas: "REFRESHMENTS", refreshments: "REFRESHMENTS",
  wines: "WINES", cocktails: "COCKTAILS", liquors: "LIQUORS",
  snacks: "SNACKS", meals: "MEALS",
  deep_fried_snacks: "DEEP_FRIED_SNACKS",
};

const abvToBand = (x) => {
  const v = Number(x);
  if (Number.isNaN(v)) return "ABV_UNKNOWN";
  if (v <= 0.5) return "ABV_0_TO_0p5";
  if (v <= 3.5) return "ABV_0p5_TO_3p5";
  if (v <= 5.5) return "ABV_3p5_TO_5p5";
  if (v <= 7.5) return "ABV_5p5_TO_7p5";
  return "ABV_7p5_PLUS";
};

function applyPredicates(q, predicates = []) {
  if (!Array.isArray(predicates)) return q;
  for (const pred of predicates) {
    if (!pred?.field) continue;
    const path = FIELD_MAP[pred.field];
    if (!path) continue;
    const op = String(pred.op || "eq").toLowerCase();
    const v = pred.value;
    if (v === undefined) continue;
    if ((op === "in" || op === "nin") && (!Array.isArray(v) || !v.length)) continue;
    switch (op) {
      case "eq":  q = q.eq(path, v); break;
      case "in":  q = q.in(path, Array.isArray(v) ? v : [v]); break;
      case "ilike": q = q.ilike(path, v); break;
      case "gte": q = q.gte(path, v); break;
      case "lte": q = q.lte(path, v); break;
      case "between":
        if (Array.isArray(v) && v.length === 2) q = q.gte(path, v[0]).lte(path, v[1]);
        break;
      case "nin": {
        const arr = Array.isArray(v) ? v : [v];
        const list = `(${arr.map(x => {
          if (x === null || x === undefined) return '""';
          if (typeof x === "number") return String(x);
          return `"${String(x).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
        }).join(",")})`;
        q = q.not(path, "in", list);
        break;
      }
    }
  }
  return q;
}

async function countsForAssortment({ assortmentId, groupBy, effectiveFilters, predicates }) {
  const includeProducts = ["category","subcategory","subsubcategory","brand","heritage","abv_band"].includes(groupBy);
  const includeCategories = groupBy === "category" || !!effectiveFilters.category;
  const includeSubcategories = groupBy === "subcategory" || !!effectiveFilters.subcategory_in;
  const includeSubsubcategories = groupBy === "subsubcategory" || !!effectiveFilters.subsubcategory_in;

  let q = supabase.from("menu_items");
  q = applyFilters(q, effectiveFilters, { includeProducts, includeCategories, includeSubcategories, includeSubsubcategories });
  q = q.eq("assortment_id", assortmentId);
  q = applyPredicates(q, predicates);

  const { data: rows, error } = await q;
  if (error) throw new Error(error.message);

  const countMap = new Map();
  for (const mi of rows || []) {
    const key =
      groupBy === "subcategory"     ? (mi.products?.subcategories?.subcat_name ?? "Unknown")
      : groupBy === "subsubcategory"? (mi.products?.subsubcategories?.subsubcat_name ?? "Unknown")
      : groupBy === "brand"         ? (mi.products?.brand ?? "Unknown")
      : groupBy === "heritage"      ? (mi.products?.heritage ?? "UNKNOWN")
      : groupBy === "abv_band"      ? abvToBand(mi.products?.abv)
      : (mi.products?.categories?.category_name ?? "Uncategorised");
    countMap.set(key, (countMap.get(key) || 0) + 1);
  }

  let total = 0;
  for (const v of countMap.values()) total += v;
  return { countMap, total };
}

/**
 * POST /api/engine-distributions
 *
 * Returns weighted-average distribution percentages per stereotype bucket,
 * plus the bar's persona weights. Used to build dynamic engine layers.
 *
 * Returns:
 *   {
 *     weights:       { Belgian: 50, French: 50, German: 50, Dutch: 50 },
 *     distributions: { Belgian: { IPA_CLASSIC: 5.4, LAGER: 22.1, ... }, ... }
 *   }
 */
router.post("/engine-distributions", isAuthenticated, async (req, res) => {
  try {
    const {
      groupBy = "subcategory",
      section,
      within = {},
      filters = {},
      predicates = [],
      stereotypes = ["Belgian", "French", "German", "Dutch", "Conservative", "Normal", "Progressive"],
    } = req.body || {};

    // 1. Resolve assortment + fetch bar's persona weights
    let assortmentId = req.body?.assortmentId != null ? Number(req.body.assortmentId) : null;
    let barWeights = { Belgian: 50, French: 50, German: 50, Dutch: 50, Conservative: 50, Normal: 50, Progressive: 50 };

    const weightFields = "id, belgian, french, german, dutch, conservative, normal, progressive";
    if (assortmentId) {
      const { data, error } = await supabase
        .from("assortments")
        .select(weightFields)
        .eq("id", assortmentId)
        .single();
      if (!error && data) {
        barWeights = { Belgian: data.belgian ?? 50, French: data.french ?? 50, German: data.german ?? 50, Dutch: data.dutch ?? 50, Conservative: data.conservative ?? 50, Normal: data.normal ?? 50, Progressive: data.progressive ?? 50 };
      }
    } else {
      // Resolve from user's linked venues
      const userId = req.session.user.id;
      const { data: link } = await supabase.from("user_venues").select("assortment_id").eq("user_id", userId).limit(1).maybeSingle();
      if (!link) return res.status(400).json({ error: "No assortment found for this user" });
      const { data, error } = await supabase
        .from("assortments")
        .select(weightFields)
        .eq("id", link.assortment_id)
        .single();
      if (error || !data) return res.status(400).json({ error: "No assortment found" });
      assortmentId = data.id;
      barWeights = { Belgian: data.belgian ?? 50, French: data.french ?? 50, German: data.german ?? 50, Dutch: data.dutch ?? 50, Conservative: data.conservative ?? 50, Progressive: data.progressive ?? 50 };
    }

    // 2. Build effective filters
    const parentName = section ? PARENT_BY_SECTION[String(section).toLowerCase()] : null;
    const objFilters = Array.isArray(filters) ? {} : (filters || {});
    const effectiveFilters = {
      ...objFilters,
      ...(parentName ? { category: parentName } : {}),
      ...(within || {}),
    };
    const effPreds = Array.isArray(predicates) ? predicates : [];

    // 3. Fetch child assortments per stereotype
    const validStereotypes = (Array.isArray(stereotypes) ? stereotypes : [])
      .filter(s => typeof s === "string" && s.length);

    const { data: paRows, error: paErr } = await supabase
      .from("persona_assortments")
      .select("stereotype, assortment_id, weight")
      .in("stereotype", validStereotypes);

    if (paErr) throw new Error(paErr.message);

    const byStereotype = new Map();
    for (const row of paRows || []) {
      if (!byStereotype.has(row.stereotype)) byStereotype.set(row.stereotype, []);
      byStereotype.get(row.stereotype).push(row);
    }

    // 4. For each stereotype, compute weighted-avg distribution %
    const distributions = {};

    for (const stereotype of validStereotypes) {
      const children = byStereotype.get(stereotype) || [];
      if (!children.length) { distributions[stereotype] = {}; continue; }

      const childResults = await Promise.all(
        children.map(async (child) => {
          try {
            const { countMap, total } = await countsForAssortment({
              assortmentId: child.assortment_id,
              groupBy, effectiveFilters, predicates: effPreds,
            });
            return { weight: child.weight, countMap, total };
          } catch {
            return { weight: child.weight, countMap: new Map(), total: 0 };
          }
        })
      );

      // Only include children that have items (skip empty assortments)
      const activeChildren = childResults.filter(c => c.total > 0);
      const totalWeight = activeChildren.reduce((s, c) => s + c.weight, 0);

      if (totalWeight === 0) { distributions[stereotype] = {}; continue; }

      const allBuckets = new Set();
      for (const { countMap } of activeChildren) {
        for (const k of countMap.keys()) allBuckets.add(k);
      }

      const result = {};
      for (const bucket of allBuckets) {
        let weightedPctSum = 0;
        let weightSum = 0;
        for (const { weight, countMap, total } of activeChildren) {
          const pct = (countMap.get(bucket) || 0) / total;
          weightedPctSum += weight * pct;
          weightSum += weight;
        }
        const avgPct = weightSum > 0 ? weightedPctSum / weightSum : 0;
        // Return as percentage (0–100), rounded to 1dp
        const pctVal = Math.round(avgPct * 100 * 10) / 10;
        if (pctVal > 0) result[bucket] = pctVal;
      }
      distributions[stereotype] = result;
    }

    res.json({ weights: barWeights, distributions });
  } catch (e) {
    console.error("[engine-distributions]", e);
    res.status(500).json({ error: "Server error", message: e.message });
  }
});

export default router;
