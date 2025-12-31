import { Router } from "express";
import { supabase } from "../integrations/supabase.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = Router();

router.get("/sales", isAuthenticated, async (req, res) => {
  const businessId = req.session.user.id;
  try {
    const { data: mItems, error } = await supabase
      .from("menu_items")
      .select(`
        id_menu_item, price, created_at,
        products!inner(
          name, brand, production_city, production_country,
          is_trending, is_high_margin, eco_friendly, season,
          categories!inner(category_name),
          subcategories(subcat_name)
        ),
        sales(sold_at)
      `)
      .eq("business_id", businessId);
    if (error) return res.status(500).json({ error: "Database error" });

    const stats = mItems.map(mi => {
      const prod = mi.products;
      const thisYear = mi.sales.filter(s => s.sold_at >= "2025-01-01" && s.sold_at <= "2025-12-31").length;
      const lastYear = mi.sales.filter(s => s.sold_at >= "2024-01-01" && s.sold_at <= "2024-12-31").length;
      return {
        id_menu_item: mi.id_menu_item,
        item_name: prod.name,
        producent: prod.brand,
        category: prod.categories?.category_name,
        subcategory: mi.products.subcategories?.subcat_name ?? "",
        price: mi.price,
        created_at: mi.created_at,
        total_sold: thisYear,
        last_year_sold: lastYear,
        is_trending: prod.is_trending,
        is_high_margin: prod.is_high_margin,
        eco_friendly: prod.eco_friendly,
        season: prod.season,
        prodCity: prod.production_city,
        prodCountry: prod.production_country
      };
    });
    res.json(stats);
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

router.get("/sales/last-year", isAuthenticated, async (req, res) => {
  const businessId = req.session.user.id;
  const lastYear = new Date().getFullYear() - 1;
  const start = `${lastYear}-01-01`, end = `${lastYear}-12-31`;
  try {
    const { data: mItems, error } = await supabase
      .from("menu_items")
      .select(`
        id_menu_item, price, created_at,
        products!inner(
          id_category, name, brand, production_country, production_city,
          is_trending, is_high_margin, eco_friendly, season,
          categories!inner(category_name),
          subcategories!inner(subcat_name)
        ),
        sales(sold_at)
      `)
      .eq("business_id", businessId);
    if (error) return res.status(500).json({ error: "Database error" });

    const stats = mItems.map(mi => {
      const prod = mi.products, cat = prod.categories, sub = prod.subcategories;
      const total_sold = (mi.sales || []).filter(s => s.sold_at >= start && s.sold_at <= end).length;
      return {
        id_menu_item: mi.id_menu_item,
        id_category: prod.id_category,
        item_name: prod.name,
        producent: prod.brand,
        category: cat.category_name,
        subcategorie: sub?.subcat_name ?? "",
        price: mi.price,
        created_at: mi.created_at,
        land: prod.production_country,
        stad: prod.production_city,
        total_sold,
        is_trending: prod.is_trending,
        is_high_margin: prod.is_high_margin,
        eco_friendly: prod.eco_friendly,
        season: prod.season ?? "Unknown"
      };
    }).sort((a,b) => a.id_menu_item - b.id_menu_item);
    res.json(stats);
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

router.get("/sales/last-90-days", isAuthenticated, async (req, res) => {
  const businessId = req.session.user.id;
  try {
    const { data: mItems, error } = await supabase
      .from("menu_items")
      .select(`
        id_menu_item, price, created_at,
        products!inner(name, brand, categories!inner(category_name)),
        sales(sold_at)
      `)
      .eq("business_id", businessId);
    if (error) return res.status(500).json({ error: "Database error" });

    const allDates = mItems.flatMap(mi => mi.sales.map(s => new Date(s.sold_at)));
    const latestDate = new Date(Math.max(...allDates));
    const cutoffDate = new Date(latestDate); cutoffDate.setDate(cutoffDate.getDate() - 90);

    const results = mItems.map(mi => {
      const category = mi.products.categories?.category_name || "";
      const salesCount = mi.sales.filter(s => {
        const d = new Date(s.sold_at);
        return d >= cutoffDate && d <= latestDate;
      }).length;
      return { id_menu_item: mi.id_menu_item, name: mi.products.name, brand: mi.products.brand, category, total_sold: salesCount };
    });
    res.json(results);
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

router.get("/sales/growth", isAuthenticated, async (req, res) => {
  const businessId = req.session.user.id;
  try {
    const { data: mItems, error } = await supabase
      .from("menu_items")
      .select(`id_menu_item, price, products!inner(name, brand), sales(sold_at)`)
      .eq("business_id", businessId);
    if (error) return res.status(500).json({ error: "Database error" });

    const stats = mItems.map(mi => {
      const s2025 = mi.sales.filter(s => s.sold_at >= "2025-01-01" && s.sold_at <= "2025-12-31").length;
      const s2024 = mi.sales.filter(s => s.sold_at >= "2024-01-01" && s.sold_at <= "2024-12-31").length;
      const diff = s2025 - s2024;
      const pct = s2024 === 0 ? (s2025 > 0 ? 100 : 0) : ((diff / s2024) * 100);
      return { id_menu_item: mi.id_menu_item, name: mi.products.name, brand: mi.products.brand, sold_2025: s2025, sold_2024: s2024, growth_abs: diff, growth_pct: pct.toFixed(1) };
    });
    res.json(stats);
  } catch (e) { res.status(500).json({ error: "Server error" }); }
});

export default router;
