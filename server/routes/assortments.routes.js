import { Router } from 'express';
import { supabase } from '../integrations/supabase.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/assortments
 * Returns all assortments for the logged-in business, ordered by sort_order ASC.
 * Includes coordinates and persona targets for the map overview.
 */
router.get('/assortments', isAuthenticated, async (req, res) => {
  const businessId = req.session.user.id;
  const CHUNK = 1000;
  try {
    let allRows = [];
    for (let from = 0; ; from += CHUNK) {
      const { data, error } = await supabase
        .from('assortments')
        .select('id, name, address, sort_order, lat, lng, belgian, french, german, dutch, conservative, normal, progressive')
        .eq('business_id', businessId)
        .order('sort_order', { ascending: true })
        .range(from, from + CHUNK - 1);

      if (error) return res.status(500).json({ error: 'Database error', message: error.message });
      if (!data?.length) break;
      allRows.push(...data);
      if (data.length < CHUNK) break;
    }
    res.json(allRows);
  } catch (e) {
    res.status(500).json({ error: 'Server error', message: e.message });
  }
});

/**
 * GET /api/assortments/persona-weights
 * Returns belgian/french/german/dutch weights for the session user's primary assortment.
 */
router.get('/assortments/persona-weights', isAuthenticated, async (req, res) => {
  const businessId = req.session.user.id;
  try {
    const { data, error } = await supabase
      .from('assortments')
      .select('id, belgian, french, german, dutch, conservative, normal, progressive')
      .eq('business_id', businessId)
      .order('sort_order', { ascending: true })
      .limit(1)
      .single();

    if (error || !data) return res.status(404).json({ error: 'No assortment found for this business' });

    // Two independent axes — each sums to 100%
    const geo   = { belgian: data.belgian ?? 25, french: data.french ?? 25, german: data.german ?? 25, dutch: data.dutch ?? 25 };
    const style = { conservative: data.conservative ?? 33, normal: data.normal ?? 34, progressive: data.progressive ?? 33 };
    const geoTot   = Object.values(geo).reduce((s, v) => s + v, 0) || 1;
    const styleTot = Object.values(style).reduce((s, v) => s + v, 0) || 1;
    const norm = (v, tot) => Math.round((v / tot) * 100);
    const normalised = {
      belgian:      norm(geo.belgian, geoTot),
      french:       norm(geo.french, geoTot),
      german:       norm(geo.german, geoTot),
      dutch:        norm(geo.dutch, geoTot),
      conservative: norm(style.conservative, styleTot),
      normal:       norm(style.normal, styleTot),
      progressive:  norm(style.progressive, styleTot),
    };
    // Fix rounding for each axis
    const geoSum = normalised.belgian + normalised.french + normalised.german + normalised.dutch;
    normalised.belgian += 100 - geoSum;
    const styleSum = normalised.conservative + normalised.normal + normalised.progressive;
    normalised.conservative += 100 - styleSum;

    res.json({ id: data.id, ...normalised });
  } catch (e) {
    res.status(500).json({ error: 'Server error', message: e.message });
  }
});

/**
 * PATCH /api/assortments/persona-weights
 * Updates belgian/french/german/dutch for the session user's primary assortment.
 */
router.patch('/assortments/persona-weights', isAuthenticated, async (req, res) => {
  const businessId = req.session.user.id;
  const { belgian, french, german, dutch, conservative, normal, progressive } = req.body || {};

  const allVals = { belgian, french, german, dutch, conservative, normal, progressive };
  const provided = Object.values(allVals).filter(v => v != null).map(Number);
  if (provided.some(v => !Number.isFinite(v) || v < 0 || v > 100)) {
    return res.status(400).json({ error: 'Each weight must be a number between 0 and 100' });
  }

  try {
    const { data: existing, error: findErr } = await supabase
      .from('assortments')
      .select('id')
      .eq('business_id', businessId)
      .order('sort_order', { ascending: true })
      .limit(1)
      .single();

    if (findErr || !existing) return res.status(404).json({ error: 'No assortment found for this business' });

    const update = {};
    for (const [k, v] of Object.entries(allVals)) {
      if (v != null) update[k] = Number(v);
    }

    const { error } = await supabase
      .from('assortments')
      .update(update)
      .eq('id', existing.id);

    if (error) return res.status(500).json({ error: 'Database error', message: error.message });
    res.json({ ok: true, id: existing.id });
  } catch (e) {
    res.status(500).json({ error: 'Server error', message: e.message });
  }
});

/**
 * PATCH /api/assortments/:id/persona-weights
 * Updates persona weights for a specific assortment (must belong to the logged-in business).
 */
router.patch('/assortments/:id/persona-weights', isAuthenticated, async (req, res) => {
  const businessId = req.session.user.id;
  const assortmentId = Number(req.params.id);
  const { belgian, french, german, dutch, conservative, normal, progressive } = req.body || {};

  if (!Number.isFinite(assortmentId)) {
    return res.status(400).json({ error: 'Invalid assortment id' });
  }

  const allVals = { belgian, french, german, dutch, conservative, normal, progressive };
  const provided = Object.values(allVals).filter(v => v != null).map(Number);
  if (provided.some(v => !Number.isFinite(v) || v < 0 || v > 100)) {
    return res.status(400).json({ error: 'Each weight must be a number between 0 and 100' });
  }

  try {
    // Verify ownership
    const { data: existing, error: findErr } = await supabase
      .from('assortments')
      .select('id')
      .eq('id', assortmentId)
      .eq('business_id', businessId)
      .single();

    if (findErr || !existing) return res.status(404).json({ error: 'Assortment not found' });

    const update = {};
    for (const [k, v] of Object.entries(allVals)) {
      if (v != null) update[k] = Number(v);
    }

    const { error } = await supabase
      .from('assortments')
      .update(update)
      .eq('id', assortmentId);

    if (error) return res.status(500).json({ error: 'Database error', message: error.message });
    res.json({ ok: true, id: assortmentId });
  } catch (e) {
    res.status(500).json({ error: 'Server error', message: e.message });
  }
});

export default router;
