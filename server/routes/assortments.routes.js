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
  try {
    const { data, error } = await supabase
      .from('assortments')
      .select('id, name, address, sort_order, lat, lng, belgian, french, german, dutch')
      .eq('business_id', businessId)
      .order('sort_order', { ascending: true });

    if (error) return res.status(500).json({ error: 'Database error', message: error.message });
    res.json(data || []);
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
      .select('id, belgian, french, german, dutch')
      .eq('business_id', businessId)
      .order('sort_order', { ascending: true })
      .limit(1)
      .single();

    if (error || !data) return res.status(404).json({ error: 'No assortment found for this business' });

    const raw = {
      belgian: data.belgian ?? 25,
      french:  data.french  ?? 25,
      german:  data.german  ?? 25,
      dutch:   data.dutch   ?? 25,
    };
    const total = raw.belgian + raw.french + raw.german + raw.dutch;
    const normalise = (v) => total > 0 ? Math.round((v / total) * 100) : 25;
    const normalised = {
      belgian: normalise(raw.belgian),
      french:  normalise(raw.french),
      german:  normalise(raw.german),
      dutch:   normalise(raw.dutch),
    };
    const nTotal = normalised.belgian + normalised.french + normalised.german + normalised.dutch;
    normalised.belgian += 100 - nTotal;

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
  const { belgian, french, german, dutch } = req.body || {};

  const values = [belgian, french, german, dutch].map(Number);
  if (values.some(v => !Number.isFinite(v) || v < 0 || v > 100)) {
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

    const { error } = await supabase
      .from('assortments')
      .update({ belgian: values[0], french: values[1], german: values[2], dutch: values[3] })
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
  const { belgian, french, german, dutch } = req.body || {};

  if (!Number.isFinite(assortmentId)) {
    return res.status(400).json({ error: 'Invalid assortment id' });
  }

  const values = [belgian, french, german, dutch].map(Number);
  if (values.some(v => !Number.isFinite(v) || v < 0 || v > 100)) {
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

    const { error } = await supabase
      .from('assortments')
      .update({ belgian: values[0], french: values[1], german: values[2], dutch: values[3] })
      .eq('id', assortmentId);

    if (error) return res.status(500).json({ error: 'Database error', message: error.message });
    res.json({ ok: true, id: assortmentId });
  } catch (e) {
    res.status(500).json({ error: 'Server error', message: e.message });
  }
});

export default router;
