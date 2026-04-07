import { Router } from "express";
import bcrypt from "bcryptjs";
import { supabase } from "../integrations/supabase.js";
import path from 'path';
import { rebuildMergedMatrixForBusiness } from '../services/personaMatrix.service.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = Router();

// ── POST /api/login ──────────────────────────────────────────────────────────
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Look up in users table
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, password, name")
      .eq("email", email)
      .maybeSingle();

    if (error) return res.status(500).json({ success: false, message: "Database error" });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Fetch user's linked venues with roles
    const { data: venues } = await supabase
      .from("user_venues")
      .select("assortment_id, role")
      .eq("user_id", user.id);

    // For backward compat: resolve a "primary" business_id from first linked assortment
    let businessId = null;
    let productType = 2;
    let logo = null;
    if (venues?.length > 0) {
      const { data: assortment } = await supabase
        .from("assortments")
        .select("business_id")
        .eq("id", venues[0].assortment_id)
        .maybeSingle();
      if (assortment) {
        businessId = assortment.business_id;
        const { data: biz } = await supabase
          .from("business_info")
          .select("logo, product_type")
          .eq("id", businessId)
          .maybeSingle();
        if (biz) {
          logo = biz.logo;
          productType = biz.product_type ?? 2;
        }
      }
    }

    // Set session with user info
    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      // Keep business_id for backward compat with routes that use it
      business_id: businessId,
      logo,
      product_type: productType,
    };

    // Build persona matrix for first linked business
    let layersMatrix = null;
    let warning = null;
    if (businessId) {
      try {
        const PERSONA_DIR = path.resolve("src/Dashboard/ToAdd/engine/context_and_clientele");
        const payload = await rebuildMergedMatrixForBusiness({ businessId, rootDir: PERSONA_DIR });
        layersMatrix = { version: payload.version, layers: payload.layers, meta: payload.meta };
      } catch (e) {
        console.error("[auth.login] persona matrix rebuild failed:", e);
        warning = "layers_matrix_rebuild_failed";
      }
    }

    req.session.save((err) => {
      if (err) {
        console.error("[auth.login] session save failed:", err);
        return res.status(500).json({ success: false, message: "Failed to start session" });
      }
      return res.json({
        success: true,
        user_id: user.id,
        business_id: businessId,
        name: user.name,
        logo: logo || null,
        product_type: productType,
        venues: venues || [],
        warning,
        layers_matrix: layersMatrix,
      });
    });
  } catch (e) { next(e); }
});

// ── POST /api/register ───────────────────────────────────────────────────────
router.post("/register", async (req, res, next) => {
  try {
    const { email, password, name } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const hashed = bcrypt.hashSync(password, 10);
    const { data: user, error } = await supabase
      .from("users")
      .insert({ email, password: hashed, name: name || null })
      .select("id, email, name")
      .single();

    if (error) throw new Error(error.message);

    // Auto-login after registration
    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      business_id: null,
      logo: null,
      product_type: 2,
    };

    req.session.save((err) => {
      if (err) return res.status(500).json({ success: false, message: "Session error" });
      res.json({ success: true, user_id: user.id, venues: [] });
    });
  } catch (e) { next(e); }
});

// ── GET /api/user ────────────────────────────────────────────────────────────
router.get("/user", (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: "Not authenticated" });
  res.json({ user: req.session.user });
});

// ── POST /api/logout ─────────────────────────────────────────────────────────
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

export default router;
