import { Router } from "express";
import { supabase } from "../integrations/supabase.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = Router();

function getAssortmentId(req) {
  return req.query.assortmentId || req.body?.assortmentId || req.session?.activeAssortmentId;
}

// GET /api/menu-config
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

// PUT /api/menu-config — upsert any config fields
const ALLOWED_FIELDS = [
  'fold_type', 'columns', 'show_euro', 'decimal_sep',
  'font_family', 'font_size_base', 'bg_color', 'text_color',
  'header_color', 'accent_color', 'logo_url',
];

router.put("/menu-config", isAuthenticated, async (req, res) => {
  const assortmentId = getAssortmentId(req);
  if (!assortmentId) return res.status(400).json({ error: "assortmentId required" });

  const row = { assortment_id: assortmentId };
  for (const field of ALLOWED_FIELDS) {
    if (req.body[field] !== undefined) row[field] = req.body[field];
  }
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
