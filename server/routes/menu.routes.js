import { Router } from "express";
import { supabase } from "../integrations/supabase.js";
import { isAuthenticated } from "../middleware/auth.js";
import { applyFilters } from "../services/engine.js";


console.log("[menu.routes] loaded at", new Date().toISOString());

/* Optional predicate support for numeric/bool ranges etc. */
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


  // ✅ NEW functional flags
  is_protein:     "products.is_protein",
  is_prebiotic:   "products.is_prebiotic",
  is_magnesium:   "products.is_magnesium",
  is_vitamin:     "products.is_vitamin",
  is_collagen:    "products.is_collagen",

  // ✅ also these
  is_trending:    "products.is_trending",
  is_high_margin: "products.is_high_margin",
};
function applyPredicates(q, predicates = []) {
  if (!Array.isArray(predicates)) return q;

  for (const pred of predicates) {
    if (!pred || typeof pred !== "object") continue;

    const field = pred.field;
    if (!field) continue;

    const path = FIELD_MAP[field];
    if (!path) continue;

    const op = String(pred.op || "eq").toLowerCase();
    const v = pred.value;

    // 🚫 ignore predicates with undefined value (common leak from buggy builders)
    if (v === undefined) continue;

    // 🚫 ignore empty IN/NIN lists
    if ((op === "in" || op === "nin") && (!Array.isArray(v) || v.length === 0)) continue;

    switch (op) {
      case "eq": q = q.eq(path, v); break;
      case "in": q = q.in(path, Array.isArray(v) ? v : [v]); break;
      case "ilike": q = q.ilike(path, v); break;
      case "gte": q = q.gte(path, v); break;
      case "lte": q = q.lte(path, v); break;
      case "between":
        if (Array.isArray(v) && v.length === 2) q = q.gte(path, v[0]).lte(path, v[1]);
        break;

      case "nin": {
        const arr = Array.isArray(v) ? v : [v];
        const list = `(${arr
            .map((x) => {
              if (x === null || x === undefined) return '""';
              if (typeof x === "number") return String(x);
              const s = String(x).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
              return `"${s}"`;
            })
            .join(",")})`;
        q = q.not(path, "in", list);
        break;
      }

      default:
        // unknown op -> ignore
        break;
    }
  }

  return q;
}


function toPostgrestInList(v) {
  const arr = Array.isArray(v) ? v : [v];
  const parts = arr.map((x) => {
    if (x === null || x === undefined) return '""';
    if (typeof x === "number") return String(x);
    const s = String(x).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `"${s}"`;
  });
  return `(${parts.join(",")})`;
}


const router = Router();

/** Resolve the assortment ID from request or fall back to user's first linked assortment */
async function resolveAssortmentId(req) {
  const raw = req.body?.assortmentId ?? req.query?.assortmentId;
  if (raw != null) return Number(raw);
  // Fall back: fetch the first assortment linked to this user
  const userId = req.session.user.id;
  const { data, error } = await supabase
    .from('user_venues')
    .select('assortment_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  if (error || !data) throw new Error('No assortment found for user ' + userId);
  return data.assortment_id;
}

/* ===== /api/menu-items (GET & POST) ===== */
// ===== handler: query menu items with filters, paging, ordering =====
// ===== handler: query menu items with filters, paging, ordering =====
const handleMenuItems = async (req, res) => {
  let assortmentId;
  try { assortmentId = await resolveAssortmentId(req); } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  const isGet = req.method === "GET";
  const body = isGet ? {} : (req.body || {});

  // Build a unified filters object (strip paging/sorting keys)
  const baseFilters = (() => {
    const src = isGet ? { ...req.query } : { ...(body.filters || body) };
    delete src.page; delete src.pageSize; delete src.orderBy; delete src.groupBy;
    delete src.within; delete src.predicates; // keep these separate
    return src;
  })();

  // accept `within` and `predicates` (POST-only in your design)
  const within     = isGet ? {} : (body.within || {});
  const predicates = isGet ? [] : (body.predicates || []);

  // Merge within into filters so applyFilters can constrain scope tables
  const effectiveFilters = { ...baseFilters, ...within };

  const page = Number(isGet ? req.query.page : body.page) || 1;
  const pageSize = Math.min(Number(isGet ? req.query.pageSize : body.pageSize) || 100, 3000);
  const orderBy = (isGet ? req.query.orderBy : body.orderBy) || "products.name";

  // ✅ IMPORTANT: since we rely on applyFilters() for .select(),
  // we must tell it to include all the joins we need.
  const includeProducts = true;
  const includeCategories = true;
  const includeSubcategories = true;
  const includeSubsubcategories = true;

  // Supabase/PostgREST safe per-request chunk
  const SUPABASE_CHUNK = 1000;

  try {
    // Build the reusable base query (NO .range here)
    const buildBaseQuery = () => {
      let q = supabase.from("menu_items");

      // applyFilters() will do the .select(...) + joins
      q = applyFilters(q, effectiveFilters, {
        includeProducts,
        includeCategories,
        includeSubcategories,
        includeSubsubcategories,
      });

      q = q.eq("assortment_id", assortmentId);

      // apply explicit predicates
      q = applyPredicates(q, Array.isArray(predicates) ? predicates : []);

      // orderBy like 'products.name'
      let foreignTable;
      let col = orderBy || "products.name";
      if (col.startsWith("products.")) {
        col = col.split(".").slice(1).join(".");
        foreignTable = "products";
      }
      q = q.order(col, { ascending: true, foreignTable });

      return q;
    };

    // paging window we want
    const fromWanted = (page - 1) * pageSize;
    const toWanted   = fromWanted + pageSize - 1;

    // fetch in chunks
    let allRows = [];
    for (let chunkFrom = fromWanted; chunkFrom <= toWanted; chunkFrom += SUPABASE_CHUNK) {
      const chunkTo = Math.min(chunkFrom + SUPABASE_CHUNK - 1, toWanted);

      const { data: chunkRows, error } = await buildBaseQuery().range(chunkFrom, chunkTo);

      if (error) {
        console.error("[menu-items] Supabase ERROR:", error);
        return res.status(500).json({ error: "Database error", message: error.message });
      }

      if (!chunkRows?.length) break;

      allRows.push(...chunkRows);

      // if less returned than requested, we reached the end
      if (chunkRows.length < (chunkTo - chunkFrom + 1)) break;
    }

    const items = (allRows || []).map((mi) => ({
      id_menu_item:   mi.id_menu_item,
      price:          mi.price,
      created_at:     mi.created_at,

      item_name:      mi.products?.name ?? "",
      producent:      mi.products?.brand ?? "",
      category:       mi.products?.categories?.category_name ?? "",
      subcategory:    mi.products?.subcategories?.subcat_name ?? "",
      subsubcategory: mi.products?.subsubcategories?.subsubcat_name ?? "",

      is_zero:        Number(mi.products?.is_zero ?? 0),
      is_sparkling:   Number(mi.products?.is_sparkling ?? 0),

      is_protein:     Number(mi.products?.is_protein ?? 0),
      is_prebiotic:   Number(mi.products?.is_prebiotic ?? 0),
      is_magnesium:   Number(mi.products?.is_magnesium ?? 0),
      is_vitamin:     Number(mi.products?.is_vitamin ?? 0),
      is_collagen:    Number(mi.products?.is_collagen ?? 0),

      is_trending:    Number(mi.products?.is_trending ?? 0),
      is_high_margin: Number(mi.products?.is_high_margin ?? 0),

      abv:            Number(mi.products?.abv ?? 0),
      ibu:            Number(mi.products?.ibu ?? 0),
      heritage:       mi.products?.heritage ?? "NORMAL",

      floor_price:    mi.products?.floor_price ?? null,
      low_price:      mi.products?.low_price ?? null,
      high_price:     mi.products?.high_price ?? null,
      ceiling_price:  mi.products?.ceiling_price ?? null,

      price_retail:       mi.products?.price_retail ?? null,
      price_foodservice:  mi.products?.price_foodservice ?? null,
      volume_foodservice: mi.products?.volume_foodservice ?? null,
      taste_score:        mi.products?.taste_score ?? null,
      star_rating:        mi.products?.star_rating ?? null,
      spice_level:        mi.products?.spice_level ?? null,
      prep_deep_fryer:    Number(mi.products?.prep_deep_fryer ?? 0),
      prep_oven:          Number(mi.products?.prep_oven ?? 0),
      prep_airfryer:      Number(mi.products?.prep_airfryer ?? 0),
      is_crispy:          Number(mi.products?.is_crispy ?? 0),
      is_vegan:           Number(mi.products?.is_vegan ?? 0),
      is_vegetarian:      Number(mi.products?.is_vegetarian ?? 0),

      description:        mi.description ?? null,
      volumes_prices:     mi.volumes_prices ?? [],
      page_number:        mi.page_number ?? 1,
      sort_order:         mi.sort_order ?? 0,
    }));

    res.json({
      items,
      page,
      pageSize,
      appliedFilters: effectiveFilters,
      appliedPredicates: predicates,
    });
  } catch (e) {
    console.error("[menu-items] CATCH:", e);
    res.status(500).json({ error: "Server error", message: e.message });
  }
};



router.get("/menu-items", isAuthenticated, handleMenuItems);
/*
router.get("/menu-items", isAuthenticated, (req, res) => {
  return res.status(405).json({ error: "GET /api/menu-items disabled. Use POST with filters/within/predicates." });
});
*/
router.post("/menu-items", isAuthenticated, handleMenuItems);

// routes/menu.routes.js
router.get("/menu-items/by-group", isAuthenticated, async (req, res) => {
  let assortmentId;
  try { assortmentId = await resolveAssortmentId(req); } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  const groupBy = String(req.query.groupBy || "category");
  const key     = String(req.query.key || "");
  const extra   = req.query; // optional: pass-thru like is_zero, etc.

  const abvToBand = (v) => {
    const x = Number(v);
    if (Number.isNaN(x)) return "ABV_UNKNOWN";
    if (x <= 0.5) return "ABV_0_TO_0p5";
    if (x <= 3.5) return "ABV_0p5_TO_3p5";
    if (x <= 5.5) return "ABV_3p5_TO_5p5";
    if (x <= 7.5) return "ABV_5p5_TO_7p5";
    return "ABV_7p5_PLUS";
  };

  try {
    let q = supabase
        .from('menu_items')
        .select(`
        id_menu_item, price,
        products!inner(
          name, brand, abv, ibu, heritage,
          categories!inner(category_name),
          subcategories(subcat_name),
          subsubcategories(subsubcat_name)
        )
      `)
        .eq('assortment_id', assortmentId);

    // constrain by group
    if (groupBy === 'category') {
      q = q.eq('products.categories.category_name', key);
    } else if (groupBy === 'subcategory') {
      q = q.eq('products.subcategories.subcat_name', key);
    } else if (groupBy === 'subsubcategory') {
      q = q.eq('products.subsubcategories.subsubcat_name', key);
    } else if (groupBy === 'heritage') {
      q = q.eq('products.heritage', key);
    } else if (groupBy === 'abv_band') {
      // convert "ABV_3p5_TO_5p5" → numeric gte/lte
      const BANDS = {
        ABV_0_TO_0p5:     [0, 0.5],
        ABV_0p5_TO_3p5:   [0.5, 3.5],
        ABV_3p5_TO_5p5:   [3.5, 5.5],
        ABV_5p5_TO_7p5:   [5.5, 7.5],
        ABV_7p5_PLUS:     [7.5, 999],
      };
      const rng = BANDS[key];
      if (rng) { q = q.gte('products.abv', rng[0]).lte('products.abv', rng[1]); }
    }

    // optional extra predicate support (e.g. is_zero=1)
    if (extra.is_zero !== undefined) {
      q = q.eq('products.is_zero', Number(extra.is_zero));
    }

    const { data, error } = await q;
    if (error) return res.status(500).json({ error: 'Database error' });

    const items = (data || []).map(mi => ({
      id_menu_item:   mi.id_menu_item,
      name:           mi.products?.name || '',
      brand:          mi.products?.brand || '',
      price:          mi.price ?? null,
      abv:            mi.products?.abv ?? null,
      ibu:            mi.products?.ibu ?? null,
      heritage:       mi.products?.heritage || 'UNKNOWN',
      category:       mi.products?.categories?.category_name || '',
      subcategory:    mi.products?.subcategories?.subcat_name || '',
      subsubcategory: mi.products?.subsubcategories?.subsubcat_name || ''
    }));

    res.json({ items });
  } catch (err) {
    console.error('[by-group] error', err);
    res.status(500).json({ error: 'Server error' });
  }
});


/* ===== /api/menu-counts (GET & POST) ===== */
async function handleMenuCounts(req, res) {
  res.set("X-DBG-menu-counts", "1");

  let assortmentId;
  try { assortmentId = await resolveAssortmentId(req); } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  const isGet = req.method === "GET";
  const payload = isGet ? req.query : req.body;
  const {
    groupBy = "category",
    section,
    includeEmpty = false,
    within = {},
    filters = {},
    predicates = []
  } = payload || {};

  console.log("[menu-counts][DBG]", {
    groupBy,
    section,
    predicatesCount: Array.isArray(predicates) ? predicates.length : null,
    predicatesSample: Array.isArray(predicates) ? predicates.slice(0, 5) : predicates,
    filtersType: Array.isArray(filters) ? "array" : typeof filters,
  });


  const PARENT_BY_SECTION = {
    beers: "BEERS", sodas: "REFRESHMENTS", refreshments: "REFRESHMENTS",
    wines: "WINES", cocktails: "COCKTAILS", liquors: "LIQUORS",
    snacks: "SNACKS", meals: "MEALS",
    deep_fried_snacks: "DEEP_FRIED_SNACKS",
  };
  const parentName = section ? PARENT_BY_SECTION[String(section).toLowerCase()] : null;

  try {
    const includeProducts = ["category", "subcategory", "subsubcategory", "brand", "heritage", "abv_band"].includes(groupBy);
    const includeCategories = groupBy === "category" || !!parentName;
    const includeSubcategories = groupBy === "subcategory" || !!within.subcategory_in || !!parentName;
    const includeSubsubcategories = groupBy === "subsubcategory" || !!within.subsubcategory_in;

    // helper: map numeric ABV to a band token
    const abvToBand = (x) => {
      const v = Number(x);
      if (Number.isNaN(v)) return "ABV_UNKNOWN";
      if (v <= 0.5) return "ABV_0_TO_0p5";
      if (v <= 3.5) return "ABV_0p5_TO_3p5";
      if (v <= 5.5) return "ABV_3p5_TO_5p5";
      if (v <= 7.5) return "ABV_5p5_TO_7p5";
      return "ABV_7p5_PLUS";
    };

    const objFilters = Array.isArray(filters) ? {} : (filters || {});
    const effectiveFilters = {
      ...objFilters,
      ...(parentName ? {category: parentName} : {}),
      ...(within || {}),
    };

    let q = supabase.from("menu_items");
    q = applyFilters(q, effectiveFilters, {
      includeProducts,
      includeCategories,
      includeSubcategories,
      includeSubsubcategories,
    });
    q = q.eq("assortment_id", assortmentId);
    q = applyPredicates(q, Array.isArray(filters) ? filters : predicates);

    const {data: rows, error} = await q;
    if (error) return res.status(500).json({error: "Database error", message: error.message});

    const countMap = new Map();
    for (const mi of rows || []) {
      const key =
          groupBy === "subcategory"
              ? (mi.products?.subcategories?.subcat_name ?? "Unknown")
              : groupBy === "subsubcategory"
                  ? (mi.products?.subsubcategories?.subsubcat_name ?? "Unknown")
                  : groupBy === "brand"
                      ? (mi.products?.brand ?? "Unknown")
                      : groupBy === "heritage"
                          ? (mi.products?.heritage ?? "UNKNOWN")
                          : groupBy === "abv_band"
                              ? abvToBand(mi.products?.abv)
                              : (mi.products?.categories?.category_name ?? "Uncategorised");
      if (!countMap.has(key)) countMap.set(key, new Set());
      countMap.get(key).add(mi.id_menu_item);
    }

    if (!includeEmpty) {
      const results = [...countMap.entries()]
          .map(([category, set]) => ({category, count_on_menu: set.size}))
          .sort((a, b) => a.category.localeCompare(b.category));
      return res.json({groupBy, section: section || null, results});
    }

    let allGroups = [];
    if (groupBy === "category") {
      const {data, error: e} = await supabase.from("categories").select("category_name").order("category_name");
      if (e) throw e;
      allGroups = (data || []).map(r => r.category_name);
    } else if (groupBy === "subcategory") {
      let s = supabase.from("subcategories").select("subcat_name, categories!inner(category_name)").order("subcat_name");
      if (parentName) s = s.eq("categories.category_name", parentName);
      const {data, error: e} = await s;
      if (e) throw e;
      allGroups = (data || []).map(r => r.subcat_name);
    } else if (groupBy === "subsubcategory") {
      let s = supabase
          .from("subsubcategories")
          .select("subsubcat_name, subcategories!inner(subcat_name, categories!inner(category_name))")
          .order("subsubcat_name");
      if (parentName) s = s.eq("subcategories.categories.category_name", parentName);
      const subcatIn = within?.subcategory_in;
      if (Array.isArray(subcatIn) && subcatIn.length) s = s.in("subcategories.subcat_name", subcatIn);
      const {data, error: e} = await s;
      if (e) throw e;
      allGroups = (data || []).map(r => r.subsubcat_name);
    } else if (groupBy === "brand") {
      let s = supabase.from("products").select("brand").order("brand");
      if (parentName) s = s.select("brand, categories!inner(category_name)").eq("categories.category_name", parentName);
      const {data, error: e} = await s;
      if (e) throw e;
      allGroups = (data || []).map(r => r.brand).filter(Boolean);
    } else if (groupBy === "heritage") {
      // fixed domain
      allGroups = ["NORMAL", "ABBEY", "TRAPPIST","MODERN"];
    } else if (groupBy === "abv_band") {
      // fixed ABV band labels (match abvToBand)
      allGroups = [
        "ABV_0_TO_0p5",
        "ABV_0p5_TO_3p5",
        "ABV_3p5_TO_5p5",
        "ABV_5p5_TO_7p5",
        "ABV_7p5_PLUS"
      ];
    }


    const results = allGroups.map(g => ({
      category: g,
      count_on_menu: (countMap.get(g)?.size) || 0
    }));
    res.json({ groupBy, section: section || null, results, includeEmpty: true });
  } catch (e) {
    console.error("[menu-counts] CATCH", e);
    res.status(500).json({ error: "Server error", message: e.message });
  }
}

router.get("/menu-counts", isAuthenticated, handleMenuCounts);
//router.post("/menu-counts", isAuthenticated, handleMenuCounts);

router.post("/menu-counts", isAuthenticated, (req, res) => {
  console.log("[menu-counts][HIT] POST /api/menu-counts");
  return handleMenuCounts(req, res);
});

//add and remove endpoints
router.patch('/menu-items/:id/price', isAuthenticated, async (req, res) => {
  let assortmentId;
  try { assortmentId = await resolveAssortmentId(req); } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  const id = Number(req.params.id);
  const price = Number(req.body?.price);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Valid id_menu_item is required' });
  }
  if (!Number.isFinite(price) || price <= 0) {
    return res.status(400).json({ error: 'Valid price is required' });
  }

  const { error } = await supabase
      .from('menu_items')
      .update({ price })
      .eq('id_menu_item', id)
      .eq('assortment_id', assortmentId);

  if (error) return res.status(500).json({ error: 'Database error', detail: error.message });
  res.json({ success: true });
});


router.post('/menu-items/add', isAuthenticated, async (req, res) => {
  let assortmentId;
  try { assortmentId = await resolveAssortmentId(req); } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  const { product_id, price } = req.body;

  if (!product_id || price == null) {
    return res.status(400).json({ error: 'product_id and price are required' });
  }

  const { data, error } = await supabase
      .from('menu_items')
      .insert([{ assortment_id: assortmentId, product_id, price }])
      .select('id_menu_item')
      .single();

  if (error) return res.status(500).json({ error: 'Database error', detail: error.message });
  res.json({ success: true, id_menu_item: data.id_menu_item });
});


// menu.routes.js
router.delete('/menu-items/:id', isAuthenticated, async (req, res) => {
  let assortmentId;
  try { assortmentId = await resolveAssortmentId(req); } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Valid id_menu_item is required' });
  }

  const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id_menu_item', id)
      .eq('assortment_id', assortmentId);

  if (error) return res.status(500).json({ error: 'Database error', detail: error.message });
  res.json({ success: true });
});


// PATCH /api/menu-items/:id/details — update description + volumes_prices
router.patch('/menu-items/:id/details', isAuthenticated, async (req, res) => {
  let assortmentId;
  try { assortmentId = await resolveAssortmentId(req); } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Valid id required' });

  const updates = {};
  if (req.body.description !== undefined)    updates.description = req.body.description;
  if (req.body.volumes_prices !== undefined) updates.volumes_prices = req.body.volumes_prices;

  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nothing to update' });

  const { error } = await supabase
    .from('menu_items')
    .update(updates)
    .eq('id_menu_item', id)
    .eq('assortment_id', assortmentId);

  if (error) return res.status(500).json({ error: 'Database error', detail: error.message });
  res.json({ success: true });
});


// PATCH /api/menu-items/layout — bulk update page_number + sort_order
router.patch('/menu-items/layout', isAuthenticated, async (req, res) => {
  let assortmentId;
  try { assortmentId = await resolveAssortmentId(req); } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  const { updates } = req.body || {};
  if (!Array.isArray(updates) || !updates.length) {
    return res.status(400).json({ error: 'updates array required' });
  }

  try {
    for (const { id_menu_item, page_number, sort_order } of updates) {
      const row = {};
      if (page_number !== undefined) row.page_number = page_number;
      if (sort_order !== undefined)  row.sort_order = sort_order;
      if (!Object.keys(row).length) continue;

      const { error } = await supabase
        .from('menu_items')
        .update(row)
        .eq('id_menu_item', id_menu_item)
        .eq('assortment_id', assortmentId);

      if (error) throw error;
    }
    res.json({ success: true });
  } catch (e) {
    console.error('[menu-items/layout] error:', e);
    res.status(500).json({ error: 'Database error', detail: e.message });
  }
});


/* ===== NEW: /api/menu-groups (POST) ===== */
router.post("/menu-groups", isAuthenticated, async (req, res) => {
  let assortmentId;
  try { assortmentId = await resolveAssortmentId(req); } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  const { groupBy = ["category"], filters = {}, minBadgeCoverage = 0.95, sampleLimit = 8 } = req.body || {};
  const gb = Array.isArray(groupBy) ? groupBy : [String(groupBy || "category")];

  const includeProducts   = true;
  const includeCategories = gb.includes("category") || !!filters.category;

  try {
    let q = supabase.from("menu_items");
    q = applyFilters(q, filters, { includeProducts, includeCategories });
    q = q.eq("assortment_id", assortmentId);

    const { data, error } = await q;
    if (error) return res.status(500).json({ error: "Database error", detail: error.message });

    const pick = (mi, key) => {
      switch (key) {
        case "category":  return mi?.products?.categories?.category_name || "Uncategorised";
        case "brand":     return mi?.products?.brand || "Unknown";
        case "subsubcat": return mi?.products?.subsubcategories?.subsubcat_name || "General";
        default:          return "Unknown";
      }
    };

    const makeKeyObj = (mi) => {
      const obj = {};
      for (const k of gb) obj[k] = pick(mi, k);
      return obj;
    };
    const keyToString = (obj) => Object.entries(obj).map(([k,v]) => `${k}=${v}`).join("|");

    const groups = new Map();
    for (const mi of (data || [])) {
      const keyObj = makeKeyObj(mi);
      const keyStr = keyToString(keyObj);
      if (!groups.has(keyStr)) groups.set(keyStr, { keyObj, items: [] });
      groups.get(keyStr).items.push(mi);
    }

    const BASE_ICON_BY_CATEGORY = {

    };

    const BADGE_RULES = [
      { key: "is_zero",         token: "badge_zero" },
      { key: "is_sparkling",    token: "badge_sparkling" },
      { key: "is_lactose_free", token: "badge_lactose_free" },
      { key: "is_gluten_free",  token: "badge_gluten_free" },
    ];

    const buildLabel = (keyObj) => gb.map(k => keyObj[k]).join(" — ");

    const results = [];
    for (const [k, { keyObj, items }] of groups.entries()) {
      const count = items.length;
      const cov = (field) => {
        const yes = items.filter(mi => (mi?.products?.[field] === 1)).length;
        return count === 0 ? 0 : yes / count;
      };
      const badges = BADGE_RULES
          .filter(rule => cov(rule.key) >= minBadgeCoverage)
          .map(rule => rule.token)
          .slice(0, 3);

      const category = keyObj.category || null;
      const base = category ? (BASE_ICON_BY_CATEGORY[category] || "beer_other") : "beer_other";

      results.push({
        key: k,
        label: buildLabel(keyObj),
        count,
        icon: { base, badges },
        sample: items.slice(0, sampleLimit).map(mi => ({
          id_menu_item: mi.id_menu_item,
          name: mi.products?.name || "",
          price: mi.price ?? null
        }))
      });
    }

    results.sort((a,b) => a.label.localeCompare(b.label));
    res.json({ groupBy: gb, results, appliedFilters: filters, minBadgeCoverage });
  } catch (e) {
    console.error("[menu-groups] CATCH", e);
    res.status(500).json({ error: "Server error", detail: e.message });
  }
});

export default router;

