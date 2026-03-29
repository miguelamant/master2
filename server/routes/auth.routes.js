import { Router } from "express";
import bcrypt from "bcryptjs";
import { supabase } from "../integrations/supabase.js";
// Inside your login route handler, AFTER req.session.user is set:
import path from 'path';
import { rebuildMergedMatrixForBusiness } from '../services/personaMatrix.service.js';



const router = Router();

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const { data: user, error } = await supabase
        .from("business_info")
        .select("id,email,password,horeca_name,logo,product_type")
        .eq("email", email)
        .maybeSingle();

    if (error) {
      return res.status(500).json({ success: false, message: "Database error" });
    }
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

// Set session
    req.session.user = {
      id: user.id,
      email: user.email,
      horeca_name: user.horeca_name,
      logo: user.logo,
      product_type: user.product_type ?? 2,
    };

// Build per-business matrix ON LOGIN
    const PERSONA_DIR = path.resolve("src/Dashboard/ToAdd/engine/context_and_clientele");
    let layersMatrix = null;
    let warning = null;

    try {
      const payload = await rebuildMergedMatrixForBusiness({
        businessId: req.session.user.id,
        rootDir: PERSONA_DIR,
      });
      // keep only what the client needs
      layersMatrix = { version: payload.version, layers: payload.layers, meta: payload.meta };
    } catch (e) {
      console.error("[auth.login] persona matrix rebuild failed:", e);
      warning = "layers_matrix_rebuild_failed";
    }

// Force session to persist before sending response
    req.session.save((err) => {
      if (err) {
        console.error("[auth.login] session save failed:", err);
        return res.status(500).json({ success: false, message: "Failed to start session" });
      }

      return res.json({
        success: true,
        business_id: user.id,
        horeca_name: user.horeca_name,
        logo: user.logo || null,
        product_type: user.product_type ?? 2,
        warning,
        layers_matrix: layersMatrix, // <= hydrate client, avoid extra request
      });
    });

  } catch (e) {
    next(e);
  }
});

router.post("/complete-onboarding", async (req, res, next) => {
  try {
    const {
      manager_first_name, manager_last_name, horeca_name,
      address, phonenumber, email, password
    } = req.body ?? {};
    if (!horeca_name || !email || !password) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const hashed = bcrypt.hashSync(password, 10);
    const { data, error } = await supabase
      .from("business_info")
      .insert([{ horeca_name, email, password: hashed }])
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    // Create the default assortment for this new business
    await supabase.from("assortments").insert([{
      business_id: data.id,
      name: horeca_name,
      address: address || null,
      manager_first_name: manager_first_name || null,
      manager_last_name: manager_last_name || null,
      phone_number: phonenumber || null,
      sort_order: 0,
    }]);

    res.json({ success: true, insertedId: data.id });
  } catch (e) { next(e); }
});

router.get("/user", (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: "Not authenticated" });
  res.json({ user: req.session.user });
});

export default router;
