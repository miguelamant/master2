import { Router } from "express";
import { supabase } from "../integrations/supabase.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = Router();

/* products / categories / subcategories */
router.get("/products", isAuthenticated, async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("id_product, name, brand, id_category, id_subcategory, low_price, high_price")
      .order("name", { ascending: true });
    if (error) return res.status(500).json({ error: "Database error" });
    res.json(data);
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

router.get("/categories", isAuthenticated, async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id_category, category_name")
      .order("category_name", { ascending: true });
    if (error) return res.status(500).json({ error: "Database error" });
    res.json(data);
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

router.get("/subcategories", isAuthenticated, async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("subcategories")
      .select("id_subcat, id_category, subcat_name")
      .order("subcat_name", { ascending: true });
    if (error) return res.status(500).json({ error: "Database error" });
    res.json(data);
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

router.get("/items-not-on-menu", isAuthenticated, async (req, res) => {
  const businessId = req.session.user.id;

  try {
    // 1) product_ids already on the menu for this business
    const { data: menuItems, error: miError } = await supabase
        .from("menu_items")
        .select("product_id")
        .eq("business_id", businessId);

    if (miError) {
      console.error("[/items-not-on-menu] menu_items error:", miError);
      return res.status(500).json({ error: "Database error fetching menu items" });
    }

    const takenIds = (menuItems || []).map((mi) => mi.product_id).filter((id) => id != null);

    // 2) Build products query (LEFT JOINs by default)
    const selectCols = `
      id_product,
      name,
      brand,
      production_city,
      production_country,
      eco_friendly,
      season,
      low_price,
      high_price,
      is_zero,
      is_sparkling,
      
      // NEW functional flags
      is_protein,
      is_prebiotic,
      is_magnesium,
      is_vitamin,
      is_collagen,
      
      // ALSO include these
      is_trending,
      is_high_margin,
      heritage,
      categories ( category_name ),
      subcategories!left ( subcat_name ),
      subsubcategories!left ( subsubcat_name )
    `;

    let q = supabase
        .from("products")
        .select(selectCols)
        .order("name", { ascending: true });

    // ✅ Proper NOT IN for supabase-js/PostgREST
    if (takenIds.length > 0) {
      // PostgREST expects a parenthesized list string for (not.)in
      const list = `(${takenIds.join(",")})`;
      q = q.filter("id_product", "not.in", list);
      // Alternative if your client supports it:
      // q = q.not("id_product", "in", list);
    }

    const { data: products, error: pError } = await q;

    if (pError) {
      console.error("[/items-not-on-menu] products error:", pError);
      return res.status(500).json({ error: "Database error fetching products" });
    }

    // 3) Flatten into the shape the FE expects
    const flattened = (products || []).map((p) => ({
      id:               p.id_product,
      id_product:       p.id_product,
      name:             p.name,
      brand:            p.brand,

      // individual names (used for taste tokens)
      category_name:    p.categories?.category_name ?? null,
      subcat_name:      p.subcategories?.subcat_name ?? null,
      subsubcat_name:   p.subsubcategories?.subsubcat_name ?? null,

      // legacy combined fallback
      category:         p.subcategories?.subcat_name || p.categories?.category_name || "",

      // origin
      prodCity:         p.production_city,
      prodCountry:      p.production_country,

      // highlights / pricing
      eco_friendly:     p.eco_friendly,
      season:           p.season,
      low_price:        p.low_price,
      high_price:       p.high_price,

      // ✅ new filters
      is_zero:          p.is_zero ?? 0,
      is_sparkling:     p.is_sparkling ?? 0,
      heritage:         (p.heritage || "normal"),

      // NEW functional flags
      is_protein:       p.is_protein ?? 0,
      is_prebiotic:     p.is_prebiotic ?? 0,
      is_magnesium:     p.is_magnesium ?? 0,
      is_vitamin:       p.is_vitamin ?? 0,
      is_collagen:      p.is_collagen ?? 0,

// ALSO include these
      is_trending:      p.is_trending ?? 0,
      is_high_margin:   p.is_high_margin ?? 0,
    }));

    return res.json(flattened);
  } catch (err) {
    console.error("[/items-not-on-menu] server error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/* segments (by section) */
router.get("/segments", isAuthenticated, async (req, res) => {
  const section = String(req.query.section || "beers").toLowerCase();
  const PARENT_BY_SECTION = {
    beers:"BEERS", sodas:"REFRESHMENTS", refreshments:"REFRESHMENTS", wines:"WINES",
    cocktails:"COCKTAILS", liquors:"LIQUORS", snacks:"SNACKS", meals:"MEALS",
  };
  const parentName = PARENT_BY_SECTION[section] || "REFRESHMENTS";
  try {
    const { data, error } = await supabase
      .from("subcategories")
      .select("id_subcat, subcat_name, categories!inner(category_name)")
      .eq("categories.category_name", parentName)
      .order("subcat_name", { ascending: true });
    if (error) return res.status(500).json({ error: "Database error", detail: error.message });

    const prettify = (t) => (t||"").replace(/_/g," ").replace(/\bNFC\b/g,"NFC").replace(/\b([a-z])/g, m => m.toUpperCase());
    const options = (data||[]).map(row => ({
      id: row.subcat_name.toLowerCase(),
      label: prettify(row.subcat_name),
      db_id: row.id_subcat,
      token: row.subcat_name
    }));
    res.json({ section, parent: parentName, options });
  } catch (e) { res.status(500).json({ error: "Server error", detail: e.message }); }
});

/* filter-registry */
router.get("/filter-registry", isAuthenticated, (_req, res) => {
  const REGISTRY = {
    is_zero:        { path: "products.is_zero",        type: "bool",   ops: ["eq"],  label: "Zero sugar" },
    is_sparkling:   { path: "products.is_sparkling",   type: "bool",   ops: ["eq"],  label: "Sparkling" },
    is_gluten_free: { path: "products.is_gluten_free", type: "bool",   ops: ["eq"],  label: "Gluten free" },
    is_lactose_free:{ path: "products.is_lactose_free",type: "bool",   ops: ["eq"],  label: "Lactose free" },
    brand:          { path: "products.brand",          type: "enum",   ops: ["in","ilike"], label: "Brand" },
    subcategory:    { path: "products.subcategories.subcat_name",    type: "enum", ops: ["eq","in"], label: "Subcategory" },
    subsubcategory: { path: "products.subsubcategories.subsubcat_name", type: "enum", ops: ["eq","in"], label: "Subsubcategory" },
    price_retail:   { path: "products.price_retail",   type: "number", ops: ["gte","lte","between"], label: "Retail price" },
    abv:            { path: "products.abv",            type: "number", ops: ["gte","lte","between"], label: "ABV %" },
    caffeine:       { path: "products.caffeine",       type: "number", ops: ["gte","lte","between"], label: "Caffeine (mg)" },
    sugar_content:  { path: "products.sugar_content",  type: "number", ops: ["gte","lte","between"], label: "Sugar (g/100ml)" },
  };
  res.json({ groups: ["category","subcategory","subsubcategory","brand"], filters: REGISTRY });
});

/* price comparison */
router.get("/price-comparison", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { data: ownItems, error: ownError } = await supabase
      .from("menu_items")
      .select("product_id, price, products(name)")
      .eq("business_id", userId);
    if (ownError) throw ownError;

    const { data: others, error: othersError } = await supabase
      .from("menu_items")
      .select("product_id, price")
      .neq("business_id", userId);
    if (othersError) throw othersError;

    const avgByProduct = {}, countByProduct = {};
    others.forEach(({ product_id, price }) => {
      if (!avgByProduct[product_id]) { avgByProduct[product_id] = 0; countByProduct[product_id] = 0; }
      avgByProduct[product_id] += price; countByProduct[product_id] += 1;
    });

    const comparisons = ownItems.map(({ product_id, price, products }) => {
      const avg = avgByProduct[product_id] / countByProduct[product_id];
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
});

/* business-info */
router.get("/business-info", isAuthenticated, async (req, res) => {
  const businessId = req.session.user.id;
  try {
    const { data: row, error } = await supabase
      .from("business_info")
      .select("address")
      .eq("id", businessId)
      .single();
    if (error) return res.status(500).json({ error: "Database error" });
    if (!row) return res.status(404).json({ error: "Business not found" });

    const parts = (row.address || "").split(",").map(s => s.trim());
    const city = parts.length > 1 ? parts[parts.length - 1] : "";
    res.json({ city, country: "" });
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

export default router;
