import { Router } from "express";
import { supabase } from "../integrations/supabase.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = Router();

// Resolve assortment ID from query, body, or session
function getAssortmentId(req) {
  return req.query.assortmentId || req.body?.assortmentId || req.session?.activeAssortmentId;
}

// GET /api/menu-config — fetch (auto-create default if missing)
router.get("/menu-config", isAuthenticated, async (req, res) => {
  const assortmentId = getAssortmentId(req);
  if (!assortmentId) return res.status(400).json({ error: "assortmentId required" });

  try {
    let { data, error } = await supabase
      .from("menu_configs")
      .select("*")
      .eq("assortment_id", assortmentId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      const { data: created, error: createErr } = await supabase
        .from("menu_configs")
        .insert({ assortment_id: assortmentId })
        .select()
        .single();
      if (createErr) throw createErr;
      data = created;
    }

    res.json(data);
  } catch (e) {
    console.error("[menu-config] GET error:", e);
    res.status(500).json({ error: "Server error", message: e.message });
  }
});

// PUT /api/menu-config — upsert
router.put("/menu-config", isAuthenticated, async (req, res) => {
  const assortmentId = getAssortmentId(req);
  if (!assortmentId) return res.status(400).json({ error: "assortmentId required" });

  const { format, columns, show_euro, decimal_sep } = req.body;

  const row = { assortment_id: assortmentId };
  if (format !== undefined)      row.format = format;
  if (columns !== undefined)     row.columns = columns;
  if (show_euro !== undefined)   row.show_euro = show_euro;
  if (decimal_sep !== undefined) row.decimal_sep = decimal_sep;
  row.updated_at = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from("menu_configs")
      .upsert(row, { onConflict: "assortment_id" })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error("[menu-config] PUT error:", e);
    res.status(500).json({ error: "Server error", message: e.message });
  }
});

export default router;
