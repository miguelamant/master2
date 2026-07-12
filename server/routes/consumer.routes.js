import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { supabase } from "../integrations/supabase.js";
import { sendConsumerOtp } from "../services/email.service.js";
import { isAuthenticated } from "../middleware/auth.js";
import { env } from "../config/env.js";
import { CONSUMER_SESSION_MAX_AGE_MS } from "../config/session.js";

const router = Router();

// ── In-memory rate limiting ──────────────────────────────────────────────────
const rateLimits = { byEmail: {} };
const HOUR = 60 * 60 * 1000;

function checkRateLimit(key, map, max) {
  const now = Date.now();
  const entries = (map[key] || []).filter((t) => now - t < HOUR);
  if (entries.length >= max) return false;
  entries.push(now);
  map[key] = entries;
  return true;
}

const attempts = {};
const LOCKOUT = 30 * 60 * 1000;
const PLACE_ID_SENTINEL = "consumer";

const GOOGLE_REDIRECT_URI =
  process.env.NODE_ENV === "production"
    ? "https://master2-1-xm2m.onrender.com/api/consumer/google/callback"
    : "http://localhost:3007/api/consumer/google/callback";

// In dev the React app is on :3000; in prod Express serves it on the same origin
const FRONTEND_ORIGIN =
  process.env.NODE_ENV === "production" ? "" : "http://localhost:3000";

// ── Shared: upsert consumer user & set session ───────────────────────────────
async function upsertConsumerSession(req, email, name = null) {
  const { data: existing } = await supabase
    .from("users")
    .select("id, email, name")
    .eq("email", email)
    .maybeSingle();

  let user;
  let isNew = false;

  if (existing) {
    user = existing;
  } else {
    const randomPassword = bcrypt.hashSync(crypto.randomUUID(), 10);
    const { data: created, error: createErr } = await supabase
      .from("users")
      .insert({ email, password: randomPassword, name: name || null })
      .select("id, email, name")
      .single();
    if (createErr) throw createErr;
    user = created;
    isNew = true;

    // Welcome bonus: 5 Willies on sign-up
    await supabase.from("product_ratings").insert([
      { user_id: user.id, gtin: "WELCOME-BONUS-1", score: 8 },
      { user_id: user.id, gtin: "WELCOME-BONUS-2", score: 8 },
      { user_id: user.id, gtin: "WELCOME-BONUS-3", score: 8 },
      { user_id: user.id, gtin: "WELCOME-BONUS-4", score: 8 },
      { user_id: user.id, gtin: "WELCOME-BONUS-5", score: 8 },
    ]);
  }

  req.session.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    user_type: "consumer",
    business_id: null,
  };
  req.session.cookie.maxAge = CONSUMER_SESSION_MAX_AGE_MS;

  return { user, isNew };
}

// ── POST /api/consumer/request-otp ──────────────────────────────────────────
router.post("/consumer/request-otp", async (req, res, next) => {
  try {
    const { email } = req.body ?? {};

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Valid email is required" });
    }

    if (!checkRateLimit(email.toLowerCase(), rateLimits.byEmail, 3)) {
      return res.status(429).json({ success: false, message: "Too many requests. Try again later." });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: insertErr } = await supabase
      .from("verification_codes")
      .insert({
        email: email.toLowerCase(),
        code,
        place_id: PLACE_ID_SENTINEL,
        venue_name: null,
        website: null,
        expires_at: expiresAt,
      });

    if (insertErr) {
      console.error("[consumer/request-otp] DB insert failed:", insertErr);
      return res.status(500).json({ success: false, message: "Failed to generate code" });
    }

    try {
      await sendConsumerOtp(email, code);
    } catch (mailErr) {
      console.error("[consumer/request-otp] email send failed:", mailErr);
      return res.status(502).json({
        success: false,
        message: "We couldn't send the code by email. Please try again in a moment.",
      });
    }

    res.json({ success: true });
  } catch (e) {
    console.error("[consumer/request-otp]", e);
    next(e);
  }
});

// ── POST /api/consumer/verify-otp ────────────────────────────────────────────
router.post("/consumer/verify-otp", async (req, res, next) => {
  try {
    const { email, code } = req.body ?? {};

    if (!email || !code) {
      return res.status(400).json({ success: false, message: "Email and code are required" });
    }

    const normalizedEmail = email.toLowerCase();
    const att = attempts[normalizedEmail];
    if (att?.locked && Date.now() - att.locked < LOCKOUT) {
      return res.status(429).json({ success: false, message: "Too many attempts. Try again in 30 minutes." });
    }

    const { data: codeRow, error: codeErr } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("place_id", PLACE_ID_SENTINEL)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (codeErr || !codeRow) {
      return res.status(400).json({ success: false, message: "No valid code found. Request a new one." });
    }

    if (new Date(codeRow.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: "Code has expired. Request a new one." });
    }

    if (codeRow.code !== code) {
      if (!attempts[normalizedEmail]) attempts[normalizedEmail] = { count: 0 };
      attempts[normalizedEmail].count++;
      if (attempts[normalizedEmail].count >= 5) attempts[normalizedEmail].locked = Date.now();
      return res.status(400).json({ success: false, message: "Invalid code" });
    }

    await supabase.from("verification_codes").update({ used: true }).eq("id", codeRow.id);
    delete attempts[normalizedEmail];

    const { user, isNew } = await upsertConsumerSession(req, normalizedEmail);

    req.session.save((err) => {
      if (err) {
        console.error("[consumer/verify-otp] Session save failed:", err);
        return res.status(500).json({ success: false, message: "Session error" });
      }
      res.json({ success: true, is_new: isNew });
    });
  } catch (e) {
    console.error("[consumer/verify-otp]", e);
    next(e);
  }
});

// ── POST /api/consumer/set-password ──────────────────────────────────────────
router.post("/consumer/set-password", isAuthenticated, async (req, res, next) => {
  try {
    const { password } = req.body ?? {};

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const hashed = bcrypt.hashSync(password, 10);

    const { error } = await supabase
      .from("users")
      .update({ password: hashed })
      .eq("id", req.session.user.id);

    if (error) {
      return res.status(500).json({ success: false, message: "Failed to set password" });
    }

    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

// ── POST /api/consumer/login ─────────────────────────────────────────────────
router.post("/consumer/login", async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, password, name")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (error) return res.status(500).json({ success: false, message: "Database error" });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      user_type: "consumer",
      business_id: null,
    };
    req.session.cookie.maxAge = CONSUMER_SESSION_MAX_AGE_MS;

    req.session.save((err) => {
      if (err) return res.status(500).json({ success: false, message: "Session error" });
      res.json({ success: true });
    });
  } catch (e) {
    next(e);
  }
});

// ── GET /api/consumer/google/start ───────────────────────────────────────────
router.get("/consumer/google/start", (req, res) => {
  if (!env.GOOGLE_CLIENT_ID) {
    return res.redirect("/join?google_error=not_configured");
  }

  const state = crypto.randomBytes(16).toString("hex");
  req.session.googleConsumerState = state;
  req.session.save();

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// ── GET /api/consumer/google/callback ────────────────────────────────────────
router.get("/consumer/google/callback", async (req, res, next) => {
  try {
    const { code, state, error: googleError } = req.query;

    if (googleError || !code) {
      return res.redirect(`${FRONTEND_ORIGIN}/join?google_error=denied`);
    }

    if (!req.session.googleConsumerState || req.session.googleConsumerState !== state) {
      return res.redirect(`${FRONTEND_ORIGIN}/join?google_error=invalid_state`);
    }

    delete req.session.googleConsumerState;

    // Exchange code for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("[consumer/google/callback] Token exchange failed:", tokenData);
      return res.redirect(`${FRONTEND_ORIGIN}/join?google_error=token_error`);
    }

    // Get user info from Google
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userRes.json();

    if (!googleUser.email) {
      console.error("[consumer/google/callback] No email in Google profile:", googleUser);
      return res.redirect(`${FRONTEND_ORIGIN}/join?google_error=no_email`);
    }

    await upsertConsumerSession(req, googleUser.email.toLowerCase(), googleUser.name || null);

    req.session.save((err) => {
      if (err) {
        console.error("[consumer/google/callback] Session save failed:", err);
        return res.redirect(`${FRONTEND_ORIGIN}/join?google_error=session_error`);
      }
      res.redirect(`${FRONTEND_ORIGIN}/consumer`);
    });
  } catch (e) {
    console.error("[consumer/google/callback]", e);
    next(e);
  }
});

// ── Shared: compute willy balance ───────────────────────────────────────────
async function getWillyBalance(userId) {
  const [{ count: earned }, { count: sessions }] = await Promise.all([
    supabase.from('product_ratings').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('scratch_sessions').select('*', { count: 'exact', head: true }).eq('user_id', userId),
  ]);
  return (earned ?? 0) - (sessions ?? 0) * 5;
}

// ── GET /api/consumer/willies ─────────────────────────────────────────────────
router.get('/consumer/willies', isAuthenticated, async (req, res, next) => {
  try {
    const balance = await getWillyBalance(req.session.user?.id);
    res.json({ success: true, balance });
  } catch (e) {
    next(e);
  }
});

// ── POST /api/consumer/scratch ────────────────────────────────────────────────
router.post('/consumer/scratch', isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.session.user?.id;
    const balance = await getWillyBalance(userId);

    if (balance < 5) {
      return res.status(400).json({ success: false, message: 'Not enough Willies' });
    }

    const roll = Math.random() * 100;
    const prize = roll < 1 ? 50 : roll < 6 ? 5 : 0;

    const { error } = await supabase
      .from('scratch_sessions')
      .insert({ user_id: userId, prize_euros: prize });

    if (error) {
      console.error('[consumer/scratch]', error);
      return res.status(500).json({ success: false, message: 'Failed to record scratch' });
    }

    res.json({ success: true, prize, new_balance: balance - 5 });
  } catch (e) {
    next(e);
  }
});

// ── POST /api/consumer/rate-product ─────────────────────────────────────────
router.post("/consumer/rate-product", isAuthenticated, async (req, res, next) => {
  try {
    const { gtin, score } = req.body ?? {};
    const userId = req.session.user?.id;

    const numScore = parseFloat(score);
    if (!gtin || isNaN(numScore) || numScore < 1 || numScore > 10 || (numScore * 2) % 1 !== 0) {
      return res.status(400).json({ success: false, message: "Valid gtin and score (1–10 in 0.5 steps) required" });
    }

    // Upsert — one rating per user per product, updated if they re-rate
    const { data: existing } = await supabase
      .from("product_ratings")
      .select("id")
      .eq("user_id", userId)
      .eq("gtin", gtin)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("product_ratings")
        .update({ score: numScore, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      return res.json({ success: true, already_rated: true });
    }

    const { error } = await supabase
      .from("product_ratings")
      .insert({ user_id: userId, gtin, score: numScore });

    if (error) {
      console.error("[consumer/rate-product]", error);
      return res.status(500).json({ success: false, message: "Failed to save rating" });
    }

    res.json({ success: true, already_rated: false });
  } catch (e) {
    console.error("[consumer/rate-product]", e);
    next(e);
  }
});

// ── GET /api/consumer/rating/:gtin ───────────────────────────────────────────
router.get("/consumer/rating/:gtin", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.session.user?.id;
    const { data, error } = await supabase
      .from("product_ratings")
      .select("score")
      .eq("user_id", userId)
      .eq("gtin", req.params.gtin)
      .maybeSingle();

    if (error) {
      console.error("[consumer/rating]", error);
      return res.status(500).json({ success: false, message: "Failed to load rating" });
    }

    res.json({ success: true, score: data?.score ?? null });
  } catch (e) {
    console.error("[consumer/rating]", e);
    next(e);
  }
});

// ── POST /api/consumer/log-scan ──────────────────────────────────────────────
// Fire-and-forget from client — no auth required, failures silently ignored
router.post("/consumer/log-scan", async (req, res) => {
  try {
    const { scanner, gtin, found, duration_ms } = req.body ?? {};
    const user_agent = req.headers['user-agent'] ?? null;
    await supabase.from("scan_attempts").insert({ scanner, gtin, found, duration_ms, user_agent });
  } catch (_) {}
  res.sendStatus(204);
});

// ── GET /api/consumer/products ───────────────────────────────────────────────
// Public barcode catalog — no auth required, fetched once by the scanner on mount
router.get("/consumer/products", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("scan_products")
      .select("gtin, name, brand, image_url, is_reference, reference_gtin");

    if (error) {
      console.error("[consumer/products]", error);
      return res.status(500).json({ success: false, message: "Failed to load products" });
    }

    const byGtin = {};
    for (const p of data) byGtin[p.gtin] = p;

    // Reference products (e.g. the mainstream full-sugar equivalent) are comparison
    // targets only — not part of the public catalog, so they're excluded here and
    // attached inline as `.reference` on the products that point to them.
    const products = {};
    for (const p of data) {
      if (p.is_reference) continue;
      const ref = p.reference_gtin ? byGtin[p.reference_gtin] : null;
      products[p.gtin] = {
        name: p.name,
        brand: p.brand,
        image: p.image_url,
        reference: ref ? { gtin: ref.gtin, name: ref.name, brand: ref.brand, image: ref.image_url } : null,
      };
    }

    res.json({ success: true, products });
  } catch (e) {
    next(e);
  }
});

export default router;
