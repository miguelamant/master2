import { supabase } from "../integrations/supabase.js";
import {
  PARENT_BY_SECTION,
  SELECT_COLS_PRODUCTS_WITH_RELATIONS,
  prettifyLabel,
  notInList,
  flattenProductRow,
} from "../utils/products.helpers.js";

/* GET /api/products */
export async function listProducts(_req, res) {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("id_product, name, brand, id_category, id_subcategory, low_price, high_price")
      .order("name", { ascending: true });
    if (error) return res.status(500).json({ error: "Database error" });
    res.json(data);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
}

/* GET /api/categories */
export async function listCategories(_req, res) {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id_category, category_name")
      .order("category_name", { ascending: true });
    if (error) return res.status(500).json({ error: "Database error" });
    res.json(data);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
}

/* GET /api/subcategories */
export async function listSubcategories(_req, res) {
  try {
    const { data, error } = await supabase
      .from("subcategories")
      .select("id_subcat, id_category, subcat_name")
      .order("subcat_name", { ascending: true });
    if (error) return res.status(500).json({ error: "Database error" });
    res.json(data);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
}

/* GET /api/items-not-on-menu */
export async function itemsNotOnMenu(req, res) {
  res.set("Cache-Control", "no-store"); // kill any caching
  res.set("X-LOCAL-BACKEND", "yes");

  const businessId = req.session.user.id;
  // resolve assortmentId — from query or default to first assortment
  let assortmentId = req.query.assortmentId ? Number(req.query.assortmentId) : null;
  if (!assortmentId) {
    const { data: aRow } = await supabase
      .from("assortments")
      .select("id")
      .eq("business_id", businessId)
      .order("sort_order", { ascending: true })
      .limit(1)
      .single();
    assortmentId = aRow?.id ?? null;
  }

  // read section + optional search
  const section = String(req.query.section || "beers").toLowerCase();
  const parentName = PARENT_BY_SECTION[section] || "REFRESHMENTS";

  const searchRaw = String(req.query.search || "").trim();
  const hasSearch = searchRaw.length >= 2;
  // escape commas because .or() uses commas as separators
  const escapeForOr = (s) =>
      String(s)
          .replace(/,/g, " ")
          .replace(/%/g, "\\%")
          .replace(/_/g, "\\_");

  const search = escapeForOr(searchRaw);

  console.log("[items-not-on-menu][HIT]", {
    ts: new Date().toISOString(),
    section,
    limit: req.query.limit,
    page: req.query.page,
    search: hasSearch ? searchRaw : null,
  });

  try {
    // 1) all product_ids already on this assortment's menu
    let miQuery = supabase.from("menu_items").select("product_id");
    if (assortmentId) {
      miQuery = miQuery.eq("assortment_id", assortmentId);
    }
    const { data: menuItems, error: miError } = await miQuery;

    if (miError) {
      console.error("[/items-not-on-menu] menu_items error:", miError);
      return res.status(500).json({ error: "Database error fetching menu items" });
    }

    const takenIds = (menuItems || [])
        .map((mi) => mi.product_id)
        .filter((id) => id != null);

    // 2) resolve category id for the section
    const { data: catRow, error: catErr } = await supabase
        .from("categories")
        .select("id_category")
        .eq("category_name", parentName)
        .single();

    if (catErr || !catRow) {
      console.error("[/items-not-on-menu] category lookup error:", catErr);
      return res
          .status(500)
          .json({ error: "Database error resolving section category" });
    }

    // 3) paging / limits
    // - if searching: default to 50 results (fast, accurate over full DB)
    // - if not searching: default to 300 "suggestions"
    const requestedLimit = Math.min(
        Number(req.query.limit || (hasSearch ? 50 : 300)),
        3000
    );

    const page = Math.max(1, Number(req.query.page || 1));
    const fromWanted = (page - 1) * requestedLimit;
    const toWanted = fromWanted + requestedLimit - 1;

    // keep chunking to avoid large range requests
    const CHUNK = 1000;

    let all = [];
    const list = notInList(takenIds);

    console.log("[items-not-on-menu][DBG] takenIds:", takenIds.length);
    console.log(
        "[items-not-on-menu][DBG] notInList chars:",
        list ? String(list).length : null
    );

    for (let from = fromWanted; from <= toWanted; from += CHUNK) {
      const to = Math.min(from + CHUNK - 1, toWanted);

      const searchRaw = String(req.query.search || "").trim();
      const hasSearch = searchRaw.length >= 2;

// ...
      let q = supabase
          .from("products")
          .select(SELECT_COLS_PRODUCTS_WITH_RELATIONS)
          .eq("id_category", catRow.id_category)
          .order("commodity_score", { ascending: false })
          .order("name", { ascending: true });

// exclude items already on menu
      const list = notInList(takenIds);
      if (list) q = q.filter("id_product", "not.in", list);

      if (section === "beers") {
        q = q.or("is_trending.is.null,is_trending.eq.0");
      }

// ✅ server-side search
      if (hasSearch) {
        const s = searchRaw.replace(/,/g, " "); // commas break `.or(...)`
        q = q.or(`name.ilike.%${s}%,brand.ilike.%${s}%`);
      }

// ✅ limit results when searching
      const limit = hasSearch ? 100 : requestedLimit;
      q = q.range(0, limit - 1);

      const { data, error } = await q;

      if (error) {
        console.error("[/items-not-on-menu] products error:", error);
        return res.status(500).json({ error: "Database error fetching products" });
      }

      if (!data?.length) break;

      all.push(...data);

      // reached end early
      if (data.length < to - from + 1) break;

      // if we're searching, we almost never need chunking; but keep it safe anyway
      if (all.length >= requestedLimit) break;
    }

    // hard cap to requested limit (because chunking might overshoot)
    all = all.slice(0, requestedLimit);

    const flattened = (all || []).map(flattenProductRow);
    return res.json(flattened);
  } catch (err) {
    console.error("[/items-not-on-menu] server error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}



/* GET /api/segments */
export async function segmentsBySection(req, res) {
  const section = String(req.query.section || "beers").toLowerCase();
  const parentName = PARENT_BY_SECTION[section] || "REFRESHMENTS";

  try {
    const { data, error } = await supabase
      .from("subcategories")
      .select("id_subcat, subcat_name, categories!inner(category_name)")
      .eq("categories.category_name", parentName)
      .order("subcat_name", { ascending: true });

    if (error) {
      return res.status(500).json({ error: "Database error", detail: error.message });
    }

    const options = (data || []).map((row) => ({
      id: row.subcat_name.toLowerCase(),
      label: prettifyLabel(row.subcat_name),
      db_id: row.id_subcat,
      token: row.subcat_name,
    }));

    res.json({ section, parent: parentName, options });
  } catch (e) {
    res.status(500).json({ error: "Server error", detail: e.message });
  }
}

/* GET /api/filter-registry */
export function filterRegistry(_req, res) {
  const REGISTRY = {
    is_zero:        { path: "products.is_zero",        type: "bool",   ops: ["eq"],               label: "Zero sugar" },
    is_sparkling:   { path: "products.is_sparkling",   type: "bool",   ops: ["eq"],               label: "Sparkling" },
    is_gluten_free: { path: "products.is_gluten_free", type: "bool",   ops: ["eq"],               label: "Gluten free" },
    is_lactose_free:{ path: "products.is_lactose_free",type: "bool",   ops: ["eq"],               label: "Lactose free" },
    brand:          { path: "products.brand",          type: "enum",   ops: ["in","ilike"],       label: "Brand" },
    subcategory:    { path: "products.subcategories.subcat_name",       type: "enum", ops: ["eq","in"], label: "Subcategory" },
    subsubcategory: { path: "products.subsubcategories.subsubcat_name", type: "enum", ops: ["eq","in"], label: "Subsubcategory" },
    price_retail:   { path: "products.price_retail",   type: "number", ops: ["gte","lte","between"], label: "Retail price" },
    abv:            { path: "products.abv",            type: "number", ops: ["gte","lte","between"], label: "ABV %" },
    ibu:            { path: "products.ibu",            type: "number", ops: ["gte","lte","between"], label: "IBU" },
    heritage:       { path: "products.heritage",       type: "enum",   ops: ["eq","in"],label: "Heritage" },
    caffeine:       { path: "products.caffeine",       type: "number", ops: ["gte","lte","between"], label: "Caffeine (mg)" },
    sugar_content:  { path: "products.sugar_content",  type: "number", ops: ["gte","lte","between"], label: "Sugar (g/100ml)" },


    // NEW functional flags
    is_protein:      { path: "products.is_protein",      type: "bool", ops: ["eq"], label: "Protein" },
    is_prebiotic:    { path: "products.is_prebiotic",    type: "bool", ops: ["eq"], label: "Prebiotic" },
    is_magnesium:    { path: "products.is_magnesium",    type: "bool", ops: ["eq"], label: "Magnesium" },
    is_vitamin:      { path: "products.is_vitamin",      type: "bool", ops: ["eq"], label: "Vitamins" },
    is_collagen:     { path: "products.is_collagen",     type: "bool", ops: ["eq"], label: "Collagen" },

    // ALSO include these (you asked)
    is_trending:     { path: "products.is_trending",     type: "bool", ops: ["eq"], label: "Trending" },
    is_high_margin:  { path: "products.is_high_margin",  type: "bool", ops: ["eq"], label: "High margin" },

  };
  res.json({ groups: ["category","subcategory","subsubcategory","brand"], filters: REGISTRY });
}

/* GET /api/price-comparison */
export async function priceComparison(req, res) {
  try {
    const userId = req.session.user.id;

    // resolve default assortment for price comparison
    const { data: aRow } = await supabase
      .from("assortments")
      .select("id")
      .eq("business_id", userId)
      .order("sort_order", { ascending: true })
      .limit(1)
      .single();
    const ownAssortmentId = aRow?.id;

    const { data: ownItems, error: ownError } = await supabase
      .from("menu_items")
      .select("product_id, price, products(name)")
      .eq("assortment_id", ownAssortmentId);
    if (ownError) throw ownError;

    const { data: others, error: othersError } = await supabase
      .from("menu_items")
      .select("product_id, price")
      .neq("assortment_id", ownAssortmentId);
    if (othersError) throw othersError;

    const avgByProduct = {}, countByProduct = {};
    (others || []).forEach(({ product_id, price }) => {
      if (!avgByProduct[product_id]) { avgByProduct[product_id] = 0; countByProduct[product_id] = 0; }
      avgByProduct[product_id] += price; countByProduct[product_id] += 1;
    });

    const comparisons = (ownItems || []).map(({ product_id, price, products }) => {
      const total = avgByProduct[product_id] || 0;
      const cnt   = countByProduct[product_id] || 0;
      const avg   = cnt ? (total / cnt) : 0;
      if (!avg) return null;

      const diff = (price - avg);
      const comp = diff >= 0
        ? "+ €" + diff.toFixed(2).replace(".", ",")
        : "- €" + Math.abs(diff).toFixed(2).replace(".", ",");

      return {
        name: products?.name || "Onbekend product",
        price: price.toFixed(2),
        avg_price: avg.toFixed(2),
        difference: diff,
        comparison: comp
      };
    }).filter(Boolean).sort((a,b) => Math.abs(b.difference) - Math.abs(a.difference));

    res.json(comparisons.slice(0, 10));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

/* GET /api/business-info */
export async function businessInfo(req, res) {
  const businessId = req.session.user.id;
  const assortmentId = req.query.assortmentId ? Number(req.query.assortmentId) : null;
  try {
    let q = supabase.from("assortments").select("address");
    if (assortmentId) {
      q = q.eq("id", assortmentId).eq("business_id", businessId);
    } else {
      q = q.eq("business_id", businessId).order("sort_order", { ascending: true }).limit(1);
    }
    const { data: rows, error } = await q;
    if (error) return res.status(500).json({ error: "Database error" });
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) return res.status(404).json({ error: "Business not found" });

    const parts = (row.address || "").split(",").map(s => s.trim());
    const city = parts.length > 1 ? parts[parts.length - 1] : "";
    res.json({ city, country: "" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
}
