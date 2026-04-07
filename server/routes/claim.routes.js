import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { supabase } from "../integrations/supabase.js";
import { sendVerificationCode } from "../services/email.service.js";
import { isAuthenticated } from "../middleware/auth.js";
import { env } from "../config/env.js";

const router = Router();

// ── In-memory rate limiting ──────────────────────────────────────────────────
const rateLimits = { byEmail: {}, byIp: {} };
const HOUR = 60 * 60 * 1000;

function checkRateLimit(key, map, max) {
  const now = Date.now();
  const entries = (map[key] || []).filter((t) => now - t < HOUR);
  if (entries.length >= max) return false;
  entries.push(now);
  map[key] = entries;
  return true;
}

// In-memory brute-force tracking for code attempts
const attempts = {};
const LOCKOUT = 30 * 60 * 1000;

// Social media domains to skip domain matching
const SOCIAL_DOMAINS = [
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
  "linkedin.com",
  "youtube.com",
];

function extractDomain(urlOrEmail) {
  try {
    if (urlOrEmail.includes("@")) {
      return urlOrEmail.split("@")[1].toLowerCase().replace(/^www\./, "");
    }
    const url = new URL(
      urlOrEmail.startsWith("http") ? urlOrEmail : `https://${urlOrEmail}`
    );
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

// ── POST /api/claim/send-code ────────────────────────────────────────────────
router.post("/claim/send-code", async (req, res, next) => {
  try {
    const { email, place_id, venue_name, website } = req.body ?? {};

    if (!email || !place_id) {
      return res
        .status(400)
        .json({ success: false, message: "Email and place_id are required" });
    }

    // Rate limiting
    const ip = req.ip || req.connection?.remoteAddress || "unknown";
    if (!checkRateLimit(email, rateLimits.byEmail, 3)) {
      return res
        .status(429)
        .json({ success: false, message: "Too many requests. Try again later." });
    }
    if (!checkRateLimit(ip, rateLimits.byIp, 5)) {
      return res
        .status(429)
        .json({ success: false, message: "Too many requests. Try again later." });
    }

    // Domain matching (skip if no website or social media)
    if (website) {
      const websiteDomain = extractDomain(website);
      const emailDomain = extractDomain(email);
      const isSocial =
        websiteDomain &&
        SOCIAL_DOMAINS.some((d) => websiteDomain.endsWith(d));

      if (websiteDomain && emailDomain && !isSocial) {
        if (websiteDomain !== emailDomain) {
          return res.status(400).json({
            success: false,
            message: `Email domain must match the venue website (${websiteDomain})`,
          });
        }
      }
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store in database
    const { error: insertErr } = await supabase
      .from("verification_codes")
      .insert({
        email,
        code,
        place_id,
        venue_name: venue_name || null,
        website: website || null,
        expires_at: expiresAt,
      });

    if (insertErr) {
      console.error("[claim/send-code] DB insert failed:", insertErr);
      return res
        .status(500)
        .json({ success: false, message: "Failed to generate code" });
    }

    // Send email
    await sendVerificationCode(email, code, venue_name || "your venue");

    res.json({ success: true, message: "Verification code sent" });
  } catch (e) {
    console.error("[claim/send-code]", e);
    next(e);
  }
});

// ── POST /api/claim/verify-code ──────────────────────────────────────────────
router.post("/claim/verify-code", async (req, res, next) => {
  try {
    const { email, code, place_id, venue_name, website } = req.body ?? {};

    if (!email || !code || !place_id) {
      return res
        .status(400)
        .json({ success: false, message: "Email, code, and place_id are required" });
    }

    // Brute-force check
    const attemptKey = `${email}:${place_id}`;
    const att = attempts[attemptKey];
    if (att && att.locked && Date.now() - att.locked < LOCKOUT) {
      return res
        .status(429)
        .json({ success: false, message: "Too many attempts. Try again in 30 minutes." });
    }

    // Look up the latest unused code
    const { data: codeRow, error: codeErr } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("email", email)
      .eq("place_id", place_id)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (codeErr || !codeRow) {
      return res
        .status(400)
        .json({ success: false, message: "No valid verification code found" });
    }

    // Check expiry
    if (new Date(codeRow.expires_at) < new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "Code has expired. Request a new one." });
    }

    // Check code match
    if (codeRow.code !== code) {
      // Track failed attempts
      if (!attempts[attemptKey]) attempts[attemptKey] = { count: 0 };
      attempts[attemptKey].count++;
      if (attempts[attemptKey].count >= 5) {
        attempts[attemptKey].locked = Date.now();
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid code" });
    }

    // Code is valid — mark as used
    await supabase
      .from("verification_codes")
      .update({ used: true })
      .eq("id", codeRow.id);

    // Clear attempt tracking
    delete attempts[attemptKey];

    // Check if venue already exists (auto-created from scan)
    const { data: existingAssortment } = await supabase
      .from("assortments")
      .select("id, business_id")
      .eq("place_id", place_id)
      .limit(1)
      .maybeSingle();

    let businessId;
    let isNew = true;
    const websiteDomain = website ? extractDomain(website) : null;

    if (existingAssortment) {
      // Upgrade existing auto-created business
      businessId = existingAssortment.business_id;
      isNew = false;

      await supabase
        .from("business_info")
        .update({
          email,
          verified: true,
          website_domain: websiteDomain,
        })
        .eq("id", businessId);

      console.log(
        `[claim/verify] Upgraded existing business ${businessId} for place_id ${place_id}`
      );
    } else {
      // Create new business + assortment
      const { data: newBiz, error: bizErr } = await supabase
        .from("business_info")
        .insert({
          horeca_name: venue_name || "Unknown Venue",
          email,
          password: bcrypt.hashSync("temporary", 10),
          verified: true,
          website_domain: websiteDomain,
        })
        .select("id")
        .single();

      if (bizErr) {
        console.error("[claim/verify] Failed to create business:", bizErr);
        return res
          .status(500)
          .json({ success: false, message: "Failed to create account" });
      }

      businessId = newBiz.id;

      // Create assortment with place_id
      await supabase.from("assortments").insert({
        business_id: businessId,
        name: venue_name || "Unknown Venue",
        place_id,
        location_address_place_id: place_id,
        sort_order: 0,
      });

      console.log(
        `[claim/verify] Created new business ${businessId} for place_id ${place_id}`
      );
    }

    // Log user in
    const { data: bizData } = await supabase
      .from("business_info")
      .select("id, email, horeca_name, logo, product_type")
      .eq("id", businessId)
      .single();

    req.session.user = {
      id: bizData.id,
      email: bizData.email,
      horeca_name: bizData.horeca_name,
      logo: bizData.logo,
      product_type: bizData.product_type ?? 2,
    };

    req.session.save((err) => {
      if (err) {
        console.error("[claim/verify] Session save failed:", err);
        return res
          .status(500)
          .json({ success: false, message: "Session error" });
      }

      res.json({
        success: true,
        business_id: businessId,
        horeca_name: bizData.horeca_name,
        is_new: isNew,
      });
    });
  } catch (e) {
    console.error("[claim/verify-code]", e);
    next(e);
  }
});

// ── POST /api/claim/set-password ─────────────────────────────────────────────
router.post("/claim/set-password", isAuthenticated, async (req, res, next) => {
  try {
    const { password } = req.body ?? {};

    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ success: false, message: "Password must be at least 6 characters" });
    }

    const hashed = bcrypt.hashSync(password, 10);

    const { error } = await supabase
      .from("business_info")
      .update({ password: hashed })
      .eq("id", req.session.user.id);

    if (error) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to set password" });
    }

    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

// ── Facebook / Instagram OAuth verification ─────────────────────────────────

const FB_REDIRECT_URI =
  process.env.NODE_ENV === "production"
    ? "https://master2-1-xm2m.onrender.com/api/claim/facebook/callback"
    : "http://localhost:3007/api/claim/facebook/callback";

// GET /api/claim/facebook/start — redirect user to Facebook OAuth
router.get("/claim/facebook/start", (req, res) => {
  const { place_id, venue_name, website } = req.query;

  if (!place_id || !website) {
    return res.status(400).json({ success: false, message: "place_id and website are required" });
  }

  // Store claim context in session so we can use it in the callback
  const state = crypto.randomBytes(16).toString("hex");
  req.session.fbClaim = { place_id, venue_name, website, state };
  req.session.save();

  const params = new URLSearchParams({
    client_id: env.FB_APP_ID,
    redirect_uri: FB_REDIRECT_URI,
    state,
    scope: "pages_show_list",
    response_type: "code",
  });

  res.redirect(`https://www.facebook.com/v21.0/dialog/oauth?${params}`);
});

// GET /api/claim/facebook/callback — exchange code, check page ownership
router.get("/claim/facebook/callback", async (req, res, next) => {
  try {
    const { code, state, error: fbError } = req.query;
    const claim = req.session.fbClaim;

    if (fbError || !code) {
      return res.redirect("/?fb_claim=denied");
    }

    if (!claim || claim.state !== state) {
      return res.redirect("/?fb_claim=invalid_state");
    }

    // 1. Exchange code for access token
    const tokenParams = new URLSearchParams({
      client_id: env.FB_APP_ID,
      client_secret: env.FB_APP_SECRET,
      redirect_uri: FB_REDIRECT_URI,
      code,
    });

    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?${tokenParams}`
    );
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("[claim/fb] Token exchange failed:", tokenData);
      return res.redirect("/?fb_claim=token_error");
    }

    // 2. Get user's managed pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,link,username&access_token=${tokenData.access_token}`
    );
    const pagesData = await pagesRes.json();

    if (!pagesData.data) {
      console.error("[claim/fb] Pages fetch failed:", pagesData);
      return res.redirect("/?fb_claim=pages_error");
    }

    // 3. Also get the user's own profile (for Instagram-linked venues)
    const profileRes = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id,name,email,link&access_token=${tokenData.access_token}`
    );
    const profileData = await profileRes.json();

    // 4. Match venue website against user's pages
    const venueUrl = claim.website.toLowerCase();
    const match = pagesData.data.find((page) => {
      const pageLink = (page.link || "").toLowerCase();
      const pageUsername = (page.username || "").toLowerCase();
      // Match by page link or username in the venue URL
      if (pageLink && venueUrl.includes(pageUsername)) return true;
      if (pageLink && venueUrl.includes(page.id)) return true;
      // Direct link comparison
      const venuePath = venueUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
      const pagePath = pageLink.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
      if (venuePath && pagePath && venuePath === pagePath) return true;
      return false;
    });

    if (!match) {
      // No matching page found
      console.log(
        `[claim/fb] No page match. Venue URL: ${venueUrl}, User pages:`,
        pagesData.data.map((p) => ({ name: p.name, link: p.link, username: p.username }))
      );
      delete req.session.fbClaim;
      return res.redirect("/?fb_claim=no_match");
    }

    // 5. Verified! Create or upgrade the business account
    const { place_id, venue_name, website } = claim;
    const websiteDomain = extractDomain(website);
    const userEmail = profileData.email || null;

    const { data: existingAssortment } = await supabase
      .from("assortments")
      .select("id, business_id")
      .eq("place_id", place_id)
      .limit(1)
      .maybeSingle();

    let businessId;

    if (existingAssortment) {
      businessId = existingAssortment.business_id;
      await supabase
        .from("business_info")
        .update({
          email: userEmail,
          verified: true,
          website_domain: websiteDomain,
          fb_page_id: match.id,
        })
        .eq("id", businessId);
    } else {
      const { data: newBiz, error: bizErr } = await supabase
        .from("business_info")
        .insert({
          horeca_name: venue_name || match.name || "Unknown Venue",
          email: userEmail,
          password: bcrypt.hashSync("temporary", 10),
          verified: true,
          website_domain: websiteDomain,
          fb_page_id: match.id,
        })
        .select("id")
        .single();

      if (bizErr) {
        console.error("[claim/fb] Failed to create business:", bizErr);
        return res.redirect("/?fb_claim=db_error");
      }

      businessId = newBiz.id;

      await supabase.from("assortments").insert({
        business_id: businessId,
        name: venue_name || match.name || "Unknown Venue",
        place_id,
        location_address_place_id: place_id,
        sort_order: 0,
      });
    }

    // Log user in
    const { data: bizData } = await supabase
      .from("business_info")
      .select("id, email, horeca_name, logo, product_type")
      .eq("id", businessId)
      .single();

    req.session.user = {
      id: bizData.id,
      email: bizData.email,
      horeca_name: bizData.horeca_name,
      logo: bizData.logo,
      product_type: bizData.product_type ?? 2,
    };

    delete req.session.fbClaim;

    req.session.save((err) => {
      if (err) {
        console.error("[claim/fb] Session save failed:", err);
        return res.redirect("/?fb_claim=session_error");
      }
      // Redirect to claim page with success
      res.redirect(`/claim?fb_claim=success&place_id=${place_id}&venue_name=${encodeURIComponent(venue_name || "")}`);
    });
  } catch (e) {
    console.error("[claim/facebook/callback]", e);
    next(e);
  }
});

export default router;
